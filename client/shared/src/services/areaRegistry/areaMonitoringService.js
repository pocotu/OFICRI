import { ref, computed, reactive, watchEffect } from 'vue';
import { eventBus } from '../event-bus/eventBus';
import { auditService } from '../security/auditTrail';
import * as areaCacheService from './areaCacheService';
import * as areaSyncService from './areaSyncService';

/**
 * Servicio de monitoreo para el sistema de registro de áreas
 * Proporciona estadísticas, estado del sistema y alertas
 */

// Niveles de alerta
export const ALERT_LEVELS = {
  INFO: 'info',
  WARNING: 'warning',
  ERROR: 'error',
  CRITICAL: 'critical'
};

// Tipos de alertas
export const ALERT_TYPES = {
  SYNC_FAILURE: 'sync-failure',
  CACHE_EXPIRED: 'cache-expired',
  CONFLICT_DETECTED: 'conflict-detected',
  PENDING_CHANGES: 'pending-changes',
  CONNECTION_ISSUE: 'connection-issue',
  PERFORMANCE_ISSUE: 'performance-issue'
};

// Configuración del monitoreo
const monitorConfig = reactive({
  enabled: true,
  alertsEnabled: true,
  logToConsole: true,
  logToAudit: true,
  checkInterval: 60 * 1000, // 1 minuto
  maxAlertsHistory: 50,
  performanceThresholds: {
    syncTime: 5000, // ms
    loadTime: 1000, // ms
    areaCacheSize: 1000 // número de áreas
  }
});

// Estado del monitoreo
const monitorState = ref({
  isMonitoring: false,
  lastCheck: null,
  intervalId: null,
  alerts: [],
  performance: {
    lastSyncTime: 0,
    lastLoadTime: 0,
    syncCount: 0,
    loadCount: 0,
    avgSyncTime: 0,
    avgLoadTime: 0
  },
  health: {
    syncHealthy: true,
    cacheHealthy: true,
    systemHealthy: true
  }
});

// Estadísticas calculadas
const monitorStats = computed(() => {
  const cacheState = areaCacheService.getCacheState();
  const syncState = areaSyncService.getSyncState();
  
  return {
    areas: {
      count: cacheState.count || 0,
      lastUpdate: cacheState.lastUpdate,
      isExpired: cacheState.isExpired
    },
    sync: {
      lastSync: syncState.lastSync,
      inProgress: syncState.syncInProgress,
      pendingChanges: syncState.pendingChangesCount,
      errors: syncState.syncError ? 1 : 0,
      conflictMode: syncState.conflictResolutionMode
    },
    alerts: {
      total: monitorState.value.alerts.length,
      byLevel: countAlertsByLevel(),
      active: getActiveAlerts().length
    },
    health: {
      overall: monitorState.value.health.systemHealthy,
      sync: monitorState.value.health.syncHealthy,
      cache: monitorState.value.health.cacheHealthy
    }
  };
});

// Funciones internas

/**
 * Cuenta alertas por nivel
 * @returns {Object} Conteo de alertas por nivel
 */
function countAlertsByLevel() {
  const counts = {
    info: 0,
    warning: 0,
    error: 0,
    critical: 0
  };
  
  monitorState.value.alerts.forEach(alert => {
    counts[alert.level]++;
  });
  
  return counts;
}

/**
 * Obtiene alertas activas (no resueltas)
 * @returns {Array} Lista de alertas activas
 */
function getActiveAlerts() {
  return monitorState.value.alerts.filter(alert => !alert.resolved);
}

/**
 * Realiza una comprobación completa del sistema
 */
async function performHealthCheck() {
  const startTime = Date.now();
  monitorState.value.lastCheck = new Date();
  
  // Comprobar estado del caché
  checkCacheHealth();
  
  // Comprobar estado de sincronización
  checkSyncHealth();
  
  // Actualizar estado general
  monitorState.value.health.systemHealthy = 
    monitorState.value.health.cacheHealthy && 
    monitorState.value.health.syncHealthy;
  
  // Registrar tiempo de comprobación
  const checkTime = Date.now() - startTime;
  
  // Notificar resultado
  eventBus.emit('area:monitor-check-completed', {
    timestamp: monitorState.value.lastCheck,
    duration: checkTime,
    status: monitorState.value.health
  });
  
  // Registrar en auditoría si está habilitado
  if (monitorConfig.logToAudit && !monitorState.value.health.systemHealthy) {
    await auditService.log({
      action: 'AREA_HEALTH_CHECK',
      details: `Estado del sistema: ${JSON.stringify(monitorState.value.health)}`
    });
  }
}

/**
 * Comprueba el estado del caché
 */
function checkCacheHealth() {
  const cacheState = areaCacheService.getCacheState();
  
  // Verificar si el caché está inicializado
  if (!cacheState.isInitialized) {
    createAlert(
      ALERT_TYPES.CACHE_EXPIRED,
      'El caché de áreas no está inicializado', 
      ALERT_LEVELS.WARNING
    );
    monitorState.value.health.cacheHealthy = false;
    return;
  }
  
  // Verificar si el caché ha expirado
  if (cacheState.isExpired) {
    createAlert(
      ALERT_TYPES.CACHE_EXPIRED,
      'El caché de áreas ha expirado y necesita actualizarse', 
      ALERT_LEVELS.WARNING
    );
    monitorState.value.health.cacheHealthy = false;
    return;
  }
  
  // Verificar tamaño del caché
  if (cacheState.count > monitorConfig.performanceThresholds.areaCacheSize) {
    createAlert(
      ALERT_TYPES.PERFORMANCE_ISSUE,
      `El caché de áreas es demasiado grande (${cacheState.count} áreas)`,
      ALERT_LEVELS.INFO
    );
  }
  
  monitorState.value.health.cacheHealthy = true;
}

/**
 * Comprueba el estado de la sincronización
 */
function checkSyncHealth() {
  const syncState = areaSyncService.getSyncState();
  
  // Verificar errores de sincronización
  if (syncState.syncError) {
    createAlert(
      ALERT_TYPES.SYNC_FAILURE,
      `Error de sincronización: ${syncState.syncError}`,
      ALERT_LEVELS.ERROR
    );
    monitorState.value.health.syncHealthy = false;
    return;
  }
  
  // Verificar cambios pendientes
  if (syncState.pendingChangesCount > 10) {
    createAlert(
      ALERT_TYPES.PENDING_CHANGES,
      `Hay ${syncState.pendingChangesCount} cambios pendientes de sincronizar`,
      ALERT_LEVELS.WARNING
    );
  }
  
  // Verificar última sincronización
  if (syncState.lastSync) {
    const now = new Date().getTime();
    const lastSync = new Date(syncState.lastSync).getTime();
    const hoursSinceSync = (now - lastSync) / (1000 * 60 * 60);
    
    if (hoursSinceSync > 24) {
      createAlert(
        ALERT_TYPES.SYNC_FAILURE,
        `No se ha sincronizado en las últimas ${Math.floor(hoursSinceSync)} horas`,
        ALERT_LEVELS.WARNING
      );
      monitorState.value.health.syncHealthy = false;
      return;
    }
  } else {
    createAlert(
      ALERT_TYPES.SYNC_FAILURE,
      'Nunca se ha realizado una sincronización',
      ALERT_LEVELS.WARNING
    );
    monitorState.value.health.syncHealthy = false;
    return;
  }
  
  monitorState.value.health.syncHealthy = true;
}

/**
 * Crea una nueva alerta
 * @param {string} type Tipo de alerta
 * @param {string} message Mensaje de la alerta
 * @param {string} level Nivel de alerta
 * @returns {Object} Alerta creada
 */
function createAlert(type, message, level = ALERT_LEVELS.INFO) {
  // Verificar si ya existe una alerta similar activa
  const existingAlertIndex = monitorState.value.alerts.findIndex(
    alert => alert.type === type && !alert.resolved
  );
  
  if (existingAlertIndex >= 0) {
    // Actualizar alerta existente
    monitorState.value.alerts[existingAlertIndex].occurences++;
    monitorState.value.alerts[existingAlertIndex].lastOccurence = new Date();
    monitorState.value.alerts[existingAlertIndex].message = message;
    
    // Elevar nivel si es más grave
    const alertLevels = Object.values(ALERT_LEVELS);
    const existingLevelIndex = alertLevels.indexOf(monitorState.value.alerts[existingAlertIndex].level);
    const newLevelIndex = alertLevels.indexOf(level);
    
    if (newLevelIndex > existingLevelIndex) {
      monitorState.value.alerts[existingAlertIndex].level = level;
    }
    
    return monitorState.value.alerts[existingAlertIndex];
  }
  
  // Crear nueva alerta
  const alert = {
    id: `${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    type,
    message,
    level,
    timestamp: new Date(),
    lastOccurence: new Date(),
    occurences: 1,
    resolved: false,
    resolutionTimestamp: null
  };
  
  // Añadir a la lista de alertas
  monitorState.value.alerts.unshift(alert);
  
  // Mantener límite de alertas
  if (monitorState.value.alerts.length > monitorConfig.maxAlertsHistory) {
    monitorState.value.alerts = monitorState.value.alerts.slice(0, monitorConfig.maxAlertsHistory);
  }
  
  // Notificar nueva alerta
  eventBus.emit('area:monitor-alert', alert);
  
  // Registrar en consola si está habilitado
  if (monitorConfig.logToConsole) {
    const logMethod = level === ALERT_LEVELS.ERROR || level === ALERT_LEVELS.CRITICAL 
      ? console.error 
      : (level === ALERT_LEVELS.WARNING ? console.warn : console.info);
    
    logMethod(`[AreaMonitor] ${level.toUpperCase()}: ${message}`);
  }
  
  return alert;
}

// Funciones exportadas

/**
 * Configura el servicio de monitoreo
 * @param {Object} config Opciones de configuración
 */
export function configureMonitoring(config = {}) {
  // Aplicar configuración
  if (config.enabled !== undefined) {
    monitorConfig.enabled = config.enabled;
  }
  
  if (config.alertsEnabled !== undefined) {
    monitorConfig.alertsEnabled = config.alertsEnabled;
  }
  
  if (config.logToConsole !== undefined) {
    monitorConfig.logToConsole = config.logToConsole;
  }
  
  if (config.logToAudit !== undefined) {
    monitorConfig.logToAudit = config.logToAudit;
  }
  
  if (config.checkInterval !== undefined) {
    monitorConfig.checkInterval = config.checkInterval;
  }
  
  if (config.maxAlertsHistory !== undefined) {
    monitorConfig.maxAlertsHistory = config.maxAlertsHistory;
  }
  
  if (config.performanceThresholds) {
    Object.assign(monitorConfig.performanceThresholds, config.performanceThresholds);
  }
  
  // Reiniciar monitoreo si ya estaba activo
  if (monitorState.value.isMonitoring) {
    stopMonitoring();
    startMonitoring();
  }
}

/**
 * Inicia el monitoreo
 */
export function startMonitoring() {
  if (monitorState.value.isMonitoring || !monitorConfig.enabled) {
    return;
  }
  
  // Realizar comprobación inicial
  performHealthCheck();
  
  // Configurar intervalo de comprobación
  monitorState.value.intervalId = setInterval(() => {
    performHealthCheck();
  }, monitorConfig.checkInterval);
  
  // Suscribirse a eventos relevantes
  eventBus.on('area:sync-error', handleSyncError);
  eventBus.on('area:sync-conflict', handleSyncConflict);
  eventBus.on('area:synced', handleSyncCompleted);
  
  monitorState.value.isMonitoring = true;
  
  // Notificar inicio de monitoreo
  eventBus.emit('area:monitor-started', {
    timestamp: new Date(),
    config: { ...monitorConfig }
  });
}

/**
 * Detiene el monitoreo
 */
export function stopMonitoring() {
  if (!monitorState.value.isMonitoring) {
    return;
  }
  
  // Detener intervalo
  if (monitorState.value.intervalId) {
    clearInterval(monitorState.value.intervalId);
    monitorState.value.intervalId = null;
  }
  
  // Desuscribirse de eventos
  eventBus.off('area:sync-error', handleSyncError);
  eventBus.off('area:sync-conflict', handleSyncConflict);
  eventBus.off('area:synced', handleSyncCompleted);
  
  monitorState.value.isMonitoring = false;
  
  // Notificar fin de monitoreo
  eventBus.emit('area:monitor-stopped', {
    timestamp: new Date()
  });
}

/**
 * Obtiene las estadísticas de monitoreo
 * @returns {Object} Estadísticas de monitoreo
 */
export function getMonitoringStats() {
  return monitorStats.value;
}

/**
 * Obtiene todas las alertas
 * @param {boolean} activeOnly Si es true, devuelve solo alertas activas
 * @returns {Array} Lista de alertas
 */
export function getAlerts(activeOnly = false) {
  return activeOnly ? getActiveAlerts() : [...monitorState.value.alerts];
}

/**
 * Marca una alerta como resuelta
 * @param {string} alertId ID de la alerta
 * @returns {boolean} true si se resolvió, false si no se encontró
 */
export function resolveAlert(alertId) {
  const alertIndex = monitorState.value.alerts.findIndex(a => a.id === alertId);
  
  if (alertIndex >= 0) {
    monitorState.value.alerts[alertIndex].resolved = true;
    monitorState.value.alerts[alertIndex].resolutionTimestamp = new Date();
    
    // Notificar resolución
    eventBus.emit('area:monitor-alert-resolved', monitorState.value.alerts[alertIndex]);
    
    return true;
  }
  
  return false;
}

/**
 * Limpia todas las alertas
 * @param {boolean} resolvedOnly Si es true, limpia solo las alertas resueltas
 */
export function clearAlerts(resolvedOnly = true) {
  if (resolvedOnly) {
    monitorState.value.alerts = monitorState.value.alerts.filter(alert => !alert.resolved);
  } else {
    monitorState.value.alerts = [];
  }
  
  // Notificar limpieza
  eventBus.emit('area:monitor-alerts-cleared', {
    timestamp: new Date(),
    resolvedOnly
  });
}

/**
 * Realiza una comprobación manual del sistema
 * @returns {Promise<Object>} Resultado de la comprobación
 */
export async function checkSystemHealth() {
  await performHealthCheck();
  
  return {
    timestamp: monitorState.value.lastCheck,
    health: { ...monitorState.value.health },
    stats: monitorStats.value
  };
}

// Manejadores de eventos

/**
 * Maneja errores de sincronización
 * @param {Object} event Evento de error
 */
function handleSyncError(event) {
  createAlert(
    ALERT_TYPES.SYNC_FAILURE,
    `Error de sincronización: ${event.error}`,
    ALERT_LEVELS.ERROR
  );
  
  // Actualizar estado de salud
  monitorState.value.health.syncHealthy = false;
  monitorState.value.health.systemHealthy = false;
}

/**
 * Maneja conflictos de sincronización
 * @param {Object} event Evento de conflicto
 */
function handleSyncConflict(event) {
  createAlert(
    ALERT_TYPES.CONFLICT_DETECTED,
    `Conflicto detectado en área ${event.serverVersion.NombreArea || event.serverVersion.IDArea}`,
    ALERT_LEVELS.WARNING
  );
}

/**
 * Maneja completado de sincronización
 * @param {Object} event Evento de sincronización
 */
function handleSyncCompleted(event) {
  // Actualizar estadísticas de rendimiento
  monitorState.value.performance.lastSyncTime = Date.now() - new Date(event.timestamp).getTime();
  monitorState.value.performance.syncCount++;
  
  // Actualizar promedio
  monitorState.value.performance.avgSyncTime = 
    (monitorState.value.performance.avgSyncTime * (monitorState.value.performance.syncCount - 1) +
    monitorState.value.performance.lastSyncTime) / monitorState.value.performance.syncCount;
  
  // Verificar umbral de rendimiento
  if (monitorState.value.performance.lastSyncTime > monitorConfig.performanceThresholds.syncTime) {
    createAlert(
      ALERT_TYPES.PERFORMANCE_ISSUE,
      `Sincronización lenta: ${monitorState.value.performance.lastSyncTime}ms`,
      ALERT_LEVELS.INFO
    );
  }
  
  // Resolver alertas de sincronización si fue exitosa
  const syncAlerts = monitorState.value.alerts.filter(
    alert => alert.type === ALERT_TYPES.SYNC_FAILURE && !alert.resolved
  );
  
  for (const alert of syncAlerts) {
    resolveAlert(alert.id);
  }
  
  // Actualizar estado de salud
  monitorState.value.health.syncHealthy = true;
  checkCacheHealth(); // Recalcular estado del caché
  monitorState.value.health.systemHealthy = 
    monitorState.value.health.cacheHealthy && 
    monitorState.value.health.syncHealthy;
}

export default {
  ALERT_LEVELS,
  ALERT_TYPES,
  configureMonitoring,
  startMonitoring,
  stopMonitoring,
  getMonitoringStats,
  getAlerts,
  resolveAlert,
  clearAlerts,
  checkSystemHealth
}; 