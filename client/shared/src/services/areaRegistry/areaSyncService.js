import { ref, reactive } from 'vue';
import { apiClient } from '../api/apiClient';
import { eventBus } from '../event-bus/eventBus';
import { auditService } from '../security/auditTrail';
import * as areaCacheService from './areaCacheService';

/**
 * Servicio de sincronización de áreas
 * Gestiona la sincronización entre la caché local y el servidor
 */

// Configuración de la sincronización
const syncConfig = reactive({
  syncInterval: 5 * 60 * 1000, // 5 minutos por defecto
  enableAutoSync: true,
  syncOnNetwork: true,
  syncOnFocus: true,
  retryAttempts: 3,
  retryDelay: 5000 // 5 segundos
});

// Estado de la sincronización
const syncState = ref({
  lastSync: null,
  syncInProgress: false,
  syncError: null,
  pendingChanges: [],
  conflictResolutionMode: 'server-wins', // 'server-wins', 'client-wins', 'manual'
  lastSyncStats: {
    added: 0,
    updated: 0,
    deleted: 0,
    conflicts: 0,
    errors: 0
  },
  intervalId: null
});

// Funciones internas

/**
 * Compara dos áreas para detectar conflictos
 * @param {Object} clientArea Área en el cliente
 * @param {Object} serverArea Área en el servidor
 * @returns {boolean} true si hay conflictos
 */
function hasConflicts(clientArea, serverArea) {
  // Si alguna no existe, no hay conflicto (es nueva o eliminada)
  if (!clientArea || !serverArea) {
    return false;
  }
  
  // Si ambas existen pero tienen diferentes timestamps de actualización
  return clientArea.UltimaActualizacion !== serverArea.UltimaActualizacion;
}

/**
 * Resuelve conflictos según el modo configurado
 * @param {Object} clientArea Área en el cliente
 * @param {Object} serverArea Área en el servidor
 * @returns {Object} Área resultante de la resolución
 */
function resolveConflict(clientArea, serverArea) {
  switch (syncState.value.conflictResolutionMode) {
    case 'client-wins':
      return clientArea;
    case 'server-wins':
      return serverArea;
    case 'manual':
      // Notificar para resolución manual
      eventBus.emit('area:sync-conflict', {
        clientVersion: clientArea,
        serverVersion: serverArea,
        resolve: (resolution) => {
          // Guardar la resolución
          if (resolution) {
            areaCacheService.updateAreaInCache(resolution);
          }
        }
      });
      // Por defecto usar versión del servidor
      return serverArea;
    default:
      return serverArea;
  }
}

/**
 * Procesa cambios locales pendientes
 * @returns {Promise<Object>} Estadísticas de la sincronización
 */
async function processPendingChanges() {
  const stats = {
    added: 0,
    updated: 0,
    deleted: 0,
    conflicts: 0,
    errors: 0
  };
  
  // Si no hay cambios pendientes, retornar
  if (syncState.value.pendingChanges.length === 0) {
    return stats;
  }
  
  // Procesar cada cambio pendiente
  for (const change of [...syncState.value.pendingChanges]) {
    try {
      switch (change.action) {
        case 'CREATE':
          await apiClient.post('/areas', change.data);
          stats.added++;
          break;
        case 'UPDATE':
          await apiClient.put(`/areas/${change.data.IDArea}`, change.data);
          stats.updated++;
          break;
        case 'DELETE':
          await apiClient.delete(`/areas/${change.data.IDArea}`);
          stats.deleted++;
          break;
      }
      
      // Eliminar cambio procesado
      const index = syncState.value.pendingChanges.findIndex(c => 
        c.id === change.id || 
        (c.data.IDArea === change.data.IDArea && c.action === change.action)
      );
      
      if (index >= 0) {
        syncState.value.pendingChanges.splice(index, 1);
      }
    } catch (error) {
      console.error(`Error procesando cambio pendiente (${change.action}):`, error);
      stats.errors++;
      
      // Si es un conflicto, marcarlo
      if (error.response && error.response.status === 409) {
        stats.conflicts++;
      }
    }
  }
  
  return stats;
}

/**
 * Compara y sincroniza las áreas del servidor con la caché local
 * @param {Array} serverAreas Áreas obtenidas del servidor
 * @returns {Object} Estadísticas de la sincronización
 */
function syncWithServerData(serverAreas) {
  const stats = {
    added: 0,
    updated: 0,
    deleted: 0,
    conflicts: 0,
    errors: 0
  };
  
  // Obtener áreas de la caché
  const clientAreas = areaCacheService.getAllAreas();
  
  // Crear mapa para acceso más rápido
  const clientAreasMap = new Map();
  for (const area of clientAreas) {
    clientAreasMap.set(area.IDArea, area);
  }
  
  // Procesar áreas del servidor
  for (const serverArea of serverAreas) {
    const clientArea = clientAreasMap.get(serverArea.IDArea);
    
    // Si existe en cliente, verificar conflictos
    if (clientArea) {
      if (hasConflicts(clientArea, serverArea)) {
        const resolvedArea = resolveConflict(clientArea, serverArea);
        areaCacheService.updateAreaInCache(resolvedArea);
        stats.conflicts++;
      }
      // Eliminar del mapa para luego identificar áreas eliminadas
      clientAreasMap.delete(serverArea.IDArea);
    } else {
      // Nueva área del servidor
      areaCacheService.updateAreaInCache(serverArea);
      stats.added++;
    }
  }
  
  // Las áreas que quedan en el mapa son las que no existen en el servidor
  // Pero solo eliminarlas si no están como pendientes de creación
  const pendingCreations = syncState.value.pendingChanges
    .filter(c => c.action === 'CREATE')
    .map(c => c.data.IDArea);
  
  for (const [areaId, area] of clientAreasMap.entries()) {
    // No eliminar áreas pendientes de creación
    if (!pendingCreations.includes(areaId)) {
      areaCacheService.removeAreaFromCache(areaId);
      stats.deleted++;
    }
  }
  
  return stats;
}

// Funciones exportadas

/**
 * Configura el servicio de sincronización
 * @param {Object} config Opciones de configuración
 */
export function configureSyncService(config = {}) {
  // Aplicar configuración
  if (config.syncInterval !== undefined) {
    syncConfig.syncInterval = config.syncInterval;
  }
  
  if (config.enableAutoSync !== undefined) {
    syncConfig.enableAutoSync = config.enableAutoSync;
  }
  
  if (config.syncOnNetwork !== undefined) {
    syncConfig.syncOnNetwork = config.syncOnNetwork;
  }
  
  if (config.syncOnFocus !== undefined) {
    syncConfig.syncOnFocus = config.syncOnFocus;
  }
  
  if (config.retryAttempts !== undefined) {
    syncConfig.retryAttempts = config.retryAttempts;
  }
  
  if (config.retryDelay !== undefined) {
    syncConfig.retryDelay = config.retryDelay;
  }
  
  if (config.conflictResolutionMode !== undefined) {
    syncState.value.conflictResolutionMode = config.conflictResolutionMode;
  }
}

/**
 * Inicializa el servicio de sincronización
 * @returns {Promise<boolean>} true si se inicializó correctamente
 */
export async function initializeSyncService() {
  try {
    // Iniciar caché si no está inicializado
    if (!areaCacheService.getCacheState().isInitialized) {
      areaCacheService.initCache();
    }
    
    // Realizar sincronización inicial
    await syncWithServer();
    
    // Configurar sincronización periódica si está habilitada
    if (syncConfig.enableAutoSync) {
      startAutoSync();
    }
    
    // Configurar eventos de red si está habilitado
    if (syncConfig.syncOnNetwork) {
      window.addEventListener('online', handleNetworkOnline);
    }
    
    // Configurar eventos de enfoque si está habilitado
    if (syncConfig.syncOnFocus) {
      window.addEventListener('focus', handleWindowFocus);
    }
    
    // Suscribirse a eventos de áreas
    eventBus.on('area:created', handleAreaCreated);
    eventBus.on('area:updated', handleAreaUpdated);
    eventBus.on('area:deleted', handleAreaDeleted);
    
    return true;
  } catch (error) {
    console.error('Error inicializando servicio de sincronización:', error);
    return false;
  }
}

/**
 * Detiene el servicio de sincronización
 */
export function stopSyncService() {
  // Detener sincronización automática
  stopAutoSync();
  
  // Remover event listeners
  window.removeEventListener('online', handleNetworkOnline);
  window.removeEventListener('focus', handleWindowFocus);
  
  // Desuscribirse de eventos
  eventBus.off('area:created', handleAreaCreated);
  eventBus.off('area:updated', handleAreaUpdated);
  eventBus.off('area:deleted', handleAreaDeleted);
}

/**
 * Inicia la sincronización automática
 */
export function startAutoSync() {
  // Detener intervalo existente si hay uno
  stopAutoSync();
  
  // Iniciar nuevo intervalo
  syncState.value.intervalId = setInterval(() => {
    syncWithServer();
  }, syncConfig.syncInterval);
}

/**
 * Detiene la sincronización automática
 */
export function stopAutoSync() {
  if (syncState.value.intervalId) {
    clearInterval(syncState.value.intervalId);
    syncState.value.intervalId = null;
  }
}

/**
 * Sincroniza manualmente con el servidor
 * @returns {Promise<Object>} Resultado de la sincronización
 */
export async function syncWithServer() {
  // Si ya hay una sincronización en progreso, no iniciar otra
  if (syncState.value.syncInProgress) {
    return null;
  }
  
  syncState.value.syncInProgress = true;
  syncState.value.syncError = null;
  
  try {
    // Primero procesar cambios locales pendientes
    const pendingStats = await processPendingChanges();
    
    // Luego obtener datos actualizados del servidor
    const response = await apiClient.get('/areas');
    
    if (response.data.success) {
      // Sincronizar con datos del servidor
      const serverStats = syncWithServerData(response.data.data);
      
      // Actualizar estadísticas de sincronización
      syncState.value.lastSyncStats = {
        added: pendingStats.added + serverStats.added,
        updated: pendingStats.updated + serverStats.updated,
        deleted: pendingStats.deleted + serverStats.deleted,
        conflicts: pendingStats.conflicts + serverStats.conflicts,
        errors: pendingStats.errors + serverStats.errors
      };
      
      // Registrar evento en auditoría
      if (syncState.value.lastSyncStats.added > 0 ||
          syncState.value.lastSyncStats.updated > 0 ||
          syncState.value.lastSyncStats.deleted > 0) {
        await auditService.log({
          action: 'AREA_SYNC',
          details: `Áreas sincronizadas: ${JSON.stringify(syncState.value.lastSyncStats)}`
        });
      }
      
      // Actualizar timestamp de última sincronización
      syncState.value.lastSync = new Date();
      
      // Notificar sobre sincronización exitosa
      eventBus.emit('area:synced', {
        timestamp: syncState.value.lastSync,
        stats: syncState.value.lastSyncStats
      });
      
      return syncState.value.lastSyncStats;
    } else {
      throw new Error(response.data.message || 'Error sincronizando con el servidor');
    }
  } catch (error) {
    console.error('Error en sincronización de áreas:', error);
    syncState.value.syncError = error.message || 'Error desconocido';
    
    // Notificar sobre error de sincronización
    eventBus.emit('area:sync-error', {
      timestamp: new Date(),
      error: syncState.value.syncError
    });
    
    return null;
  } finally {
    syncState.value.syncInProgress = false;
  }
}

/**
 * Añade un cambio pendiente para sincronización
 * @param {string} action Acción a realizar ('CREATE', 'UPDATE', 'DELETE')
 * @param {Object} data Datos del área
 * @returns {string} ID del cambio pendiente
 */
export function queueChange(action, data) {
  const change = {
    id: `${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    action,
    data,
    timestamp: new Date()
  };
  
  syncState.value.pendingChanges.push(change);
  
  // Notificar sobre nuevo cambio pendiente
  eventBus.emit('area:pending-change', {
    action,
    count: syncState.value.pendingChanges.length
  });
  
  return change.id;
}

/**
 * Obtiene el estado actual de la sincronización
 * @returns {Object} Estado de sincronización
 */
export function getSyncState() {
  return {
    lastSync: syncState.value.lastSync,
    syncInProgress: syncState.value.syncInProgress,
    syncError: syncState.value.syncError,
    pendingChangesCount: syncState.value.pendingChanges.length,
    conflictResolutionMode: syncState.value.conflictResolutionMode,
    lastSyncStats: { ...syncState.value.lastSyncStats },
    config: { ...syncConfig }
  };
}

/**
 * Maneja cambios de red (online)
 */
function handleNetworkOnline() {
  if (syncConfig.syncOnNetwork) {
    syncWithServer();
  }
}

/**
 * Maneja enfoque de ventana
 */
function handleWindowFocus() {
  if (syncConfig.syncOnFocus) {
    syncWithServer();
  }
}

/**
 * Maneja creación de área
 * @param {Object} area Área creada
 */
function handleAreaCreated(area) {
  queueChange('CREATE', area);
}

/**
 * Maneja actualización de área
 * @param {Object} area Área actualizada
 */
function handleAreaUpdated(area) {
  queueChange('UPDATE', area);
}

/**
 * Maneja eliminación de área
 * @param {Object} areaInfo Información del área eliminada
 */
function handleAreaDeleted(areaInfo) {
  queueChange('DELETE', { IDArea: areaInfo.IDArea });
}

export default {
  configureSyncService,
  initializeSyncService,
  stopSyncService,
  startAutoSync,
  stopAutoSync,
  syncWithServer,
  queueChange,
  getSyncState
}; 