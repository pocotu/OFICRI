import { ref, reactive } from 'vue';
import { apiClient } from '../api/apiClient';
import { auditService } from '../security/auditTrail';
import { eventBus } from '../event-bus/eventBus';

// Cache reactivo de áreas
const areasCache = reactive({
  items: [],
  lastUpdate: null,
  isLoading: false,
  error: null
});

// Estado del registro
const registryState = ref({
  initialized: false,
  syncInProgress: false,
  lastSync: null,
  pendingChanges: []
});

/**
 * Registra un área en el sistema
 * @param {Object} area Datos del área a registrar
 * @returns {Promise<Object>} Respuesta del servidor
 */
export async function registerArea(area) {
  try {
    // Validar área antes de enviar
    const validationResult = validateArea(area);
    if (!validationResult.isValid) {
      throw new Error(`Error de validación: ${validationResult.errors.join(', ')}`);
    }

    // Registrar en el servidor
    const response = await apiClient.post('/areas', area);
    
    // Actualizar caché local
    if (response.data.success) {
      const newArea = response.data.data;
      updateCacheWithNewArea(newArea);
      
      // Registrar en auditoría
      await auditService.log({
        action: 'AREA_CREATED',
        resource: { id: newArea.IDArea, type: 'AREA' },
        details: `Área registrada: ${newArea.NombreArea}`
      });
      
      // Notificar a través del event bus
      eventBus.emit('area:registered', newArea);
    }
    
    return response.data;
  } catch (error) {
    console.error('Error al registrar área:', error);
    areasCache.error = error.message || 'Error desconocido';
    throw error;
  }
}

/**
 * Valida los datos de un área
 * @param {Object} area Datos del área a validar
 * @returns {Object} Resultado de validación
 */
export function validateArea(area) {
  const errors = [];
  
  // Validación de campos obligatorios
  if (!area.NombreArea || area.NombreArea.trim() === '') {
    errors.push('El nombre del área es obligatorio');
  }
  
  if (area.NombreArea && area.NombreArea.length > 100) {
    errors.push('El nombre del área no puede exceder 100 caracteres');
  }
  
  if (!area.TipoArea) {
    errors.push('El tipo de área es obligatorio');
  }
  
  // Validación de código de identificación (si existe)
  if (area.CodigoIdentificacion && area.CodigoIdentificacion.length > 50) {
    errors.push('El código de identificación no puede exceder 50 caracteres');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Actualiza la caché con un área nueva
 * @param {Object} newArea Área a añadir al caché
 */
function updateCacheWithNewArea(newArea) {
  // Verificar si ya existe el área en caché
  const existingIndex = areasCache.items.findIndex(a => a.IDArea === newArea.IDArea);
  
  if (existingIndex >= 0) {
    // Actualizar área existente
    areasCache.items.splice(existingIndex, 1, newArea);
  } else {
    // Añadir nueva área
    areasCache.items.push(newArea);
  }
  
  areasCache.lastUpdate = new Date();
}

/**
 * Carga todas las áreas desde la API
 * @returns {Promise<Array>} Lista de áreas
 */
export async function loadAllAreas() {
  try {
    areasCache.isLoading = true;
    areasCache.error = null;
    
    const response = await apiClient.get('/areas');
    
    if (response.data.success) {
      areasCache.items = response.data.data;
      areasCache.lastUpdate = new Date();
      registryState.value.initialized = true;
    } else {
      throw new Error(response.data.message || 'Error al cargar áreas');
    }
    
    return areasCache.items;
  } catch (error) {
    console.error('Error al cargar áreas:', error);
    areasCache.error = error.message || 'Error desconocido';
    throw error;
  } finally {
    areasCache.isLoading = false;
  }
}

/**
 * Obtiene un área por su ID
 * @param {number} areaId ID del área
 * @returns {Promise<Object>} Datos del área
 */
export async function getAreaById(areaId) {
  // Primero intentar desde la caché
  const cachedArea = areasCache.items.find(a => a.IDArea === areaId);
  
  if (cachedArea) {
    return cachedArea;
  }
  
  // Si no está en caché, solicitar al servidor
  try {
    const response = await apiClient.get(`/areas/${areaId}`);
    
    if (response.data.success) {
      const area = response.data.data;
      updateCacheWithNewArea(area);
      return area;
    } else {
      throw new Error(response.data.message || 'Área no encontrada');
    }
  } catch (error) {
    console.error(`Error al obtener área ${areaId}:`, error);
    throw error;
  }
}

/**
 * Actualiza un área existente
 * @param {Object} area Datos actualizados del área
 * @returns {Promise<Object>} Respuesta del servidor
 */
export async function updateArea(area) {
  try {
    // Validar área antes de enviar
    const validationResult = validateArea(area);
    if (!validationResult.isValid) {
      throw new Error(`Error de validación: ${validationResult.errors.join(', ')}`);
    }
    
    const response = await apiClient.put(`/areas/${area.IDArea}`, area);
    
    if (response.data.success) {
      const updatedArea = response.data.data;
      updateCacheWithNewArea(updatedArea);
      
      // Registrar en auditoría
      await auditService.log({
        action: 'AREA_UPDATED',
        resource: { id: updatedArea.IDArea, type: 'AREA' },
        details: `Área actualizada: ${updatedArea.NombreArea}`
      });
      
      // Notificar a través del event bus
      eventBus.emit('area:updated', updatedArea);
    }
    
    return response.data;
  } catch (error) {
    console.error('Error al actualizar área:', error);
    throw error;
  }
}

/**
 * Elimina un área existente
 * @param {number} areaId ID del área a eliminar
 * @returns {Promise<Object>} Respuesta del servidor
 */
export async function deleteArea(areaId) {
  try {
    const response = await apiClient.delete(`/areas/${areaId}`);
    
    if (response.data.success) {
      // Eliminar del caché
      const index = areasCache.items.findIndex(a => a.IDArea === areaId);
      if (index >= 0) {
        areasCache.items.splice(index, 1);
        areasCache.lastUpdate = new Date();
      }
      
      // Registrar en auditoría
      await auditService.log({
        action: 'AREA_DELETED',
        resource: { id: areaId, type: 'AREA' },
        details: `Área eliminada con ID: ${areaId}`
      });
      
      // Notificar a través del event bus
      eventBus.emit('area:deleted', { IDArea: areaId });
    }
    
    return response.data;
  } catch (error) {
    console.error(`Error al eliminar área ${areaId}:`, error);
    throw error;
  }
}

/**
 * Sincroniza la caché local con el servidor
 * @returns {Promise<boolean>} Resultado de la sincronización
 */
export async function synchronizeAreas() {
  if (registryState.value.syncInProgress) {
    return false;
  }
  
  try {
    registryState.value.syncInProgress = true;
    
    // Cargar áreas actualizadas
    await loadAllAreas();
    
    // Aplicar cambios pendientes si existen
    if (registryState.value.pendingChanges.length > 0) {
      for (const change of registryState.value.pendingChanges) {
        try {
          switch (change.action) {
            case 'CREATE':
              await registerArea(change.data);
              break;
            case 'UPDATE':
              await updateArea(change.data);
              break;
            case 'DELETE':
              await deleteArea(change.data.IDArea);
              break;
          }
        } catch (error) {
          console.error(`Error aplicando cambio pendiente: ${change.action}`, error);
        }
      }
      
      // Limpiar cambios aplicados
      registryState.value.pendingChanges = [];
    }
    
    registryState.value.lastSync = new Date();
    return true;
  } catch (error) {
    console.error('Error sincronizando áreas:', error);
    return false;
  } finally {
    registryState.value.syncInProgress = false;
  }
}

/**
 * Añade un cambio a la cola de cambios pendientes
 * @param {string} action Acción a realizar ('CREATE', 'UPDATE', 'DELETE')
 * @param {Object} data Datos del cambio
 */
export function queueChange(action, data) {
  registryState.value.pendingChanges.push({
    action,
    data,
    timestamp: new Date()
  });
  
  // Notificar sobre cambio pendiente
  eventBus.emit('area:pending-change', {
    action,
    count: registryState.value.pendingChanges.length
  });
}

/**
 * Obtiene el estado actual de la caché
 * @returns {Object} Estado del caché
 */
export function getCacheState() {
  return {
    areas: areasCache.items,
    lastUpdate: areasCache.lastUpdate,
    isLoading: areasCache.isLoading,
    error: areasCache.error,
    initialized: registryState.value.initialized,
    pendingChanges: registryState.value.pendingChanges.length
  };
}

/**
 * Inicializa el servicio de registro de áreas
 */
export async function initializeAreaRegistry() {
  if (!registryState.value.initialized) {
    try {
      await loadAllAreas();
      
      // Suscribirse a eventos relacionados con áreas
      eventBus.on('user:login', synchronizeAreas);
      eventBus.on('network:online', synchronizeAreas);
      
      return true;
    } catch (error) {
      console.error('Error al inicializar registro de áreas:', error);
      return false;
    }
  }
  return true;
}

export default {
  registerArea,
  validateArea,
  loadAllAreas,
  getAreaById,
  updateArea,
  deleteArea,
  synchronizeAreas,
  queueChange,
  getCacheState,
  initializeAreaRegistry
}; 