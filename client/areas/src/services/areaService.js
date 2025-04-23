/**
 * Area Service - Servicio para gestión de áreas
 * Proporciona funcionalidades CRUD, validación, caché y sincronización
 * Cumplimiento con ISO/IEC 27001
 */

import { apiService } from '@/shared/services/api';
import { logOperation } from '@/shared/services/security/auditTrail';
import { validateForm } from '@/shared/services/validation';
import NodeCache from 'node-cache';

// Cache de áreas con ttl de 5 minutos
const areaCache = new NodeCache({ 
  stdTTL: 300, // 5 minutos en segundos
  checkperiod: 60, // Verificar caducidad cada minuto
  useClones: false // Para mejor rendimiento
});

// Clave para almacenar la lista completa de áreas en caché
const AREAS_CACHE_KEY = 'areas_list';
// Prefijo para caché individual de áreas por ID
const AREA_PREFIX = 'area_';

/**
 * Normas de validación para áreas
 */
const areaValidationRules = {
  NombreArea: {
    required: true,
    minLength: 3,
    maxLength: 100,
    pattern: /^[a-zA-ZáéíóúÁÉÍÓÚüÜñÑ0-9\s-]+$/
  },
  CodigoIdentificacion: {
    maxLength: 50,
    pattern: /^[A-Z0-9-]+$/
  },
  TipoArea: {
    required: true,
    enum: ['RECEPCION', 'ESPECIALIZADA', 'ADMINISTRATIVA', 'OTRO']
  },
  Descripcion: {
    maxLength: 255
  }
};

/**
 * Validar datos del área
 * @param {Object} areaData - Datos del área a validar
 * @returns {Object} Resultado de validación { isValid, errors }
 */
const validateArea = (areaData) => {
  return validateForm(areaData, areaValidationRules);
};

/**
 * Normalizar datos del área antes de enviarlos al servidor
 * @param {Object} areaData - Datos del área a normalizar
 * @returns {Object} Datos normalizados
 */
const normalizeAreaData = (areaData) => {
  const normalized = { ...areaData };
  
  // Normalizar nombre (trim y capitalizar primera letra)
  if (normalized.NombreArea) {
    normalized.NombreArea = normalized.NombreArea.trim();
    normalized.NombreArea = normalized.NombreArea.charAt(0).toUpperCase() + 
                            normalized.NombreArea.slice(1);
  }
  
  // Normalizar código (mayúsculas)
  if (normalized.CodigoIdentificacion) {
    normalized.CodigoIdentificacion = normalized.CodigoIdentificacion.trim().toUpperCase();
  }
  
  // Normalizar descripción
  if (normalized.Descripcion) {
    normalized.Descripcion = normalized.Descripcion.trim();
  }
  
  return normalized;
};

/**
 * Servicios relacionados con áreas
 */
const areaService = {
  /**
   * Obtener todas las áreas (con caché)
   * @param {Object} options - Opciones de búsqueda
   * @param {boolean} options.force - Forzar recarga desde el servidor
   * @param {boolean} options.includeInactive - Incluir áreas inactivas
   * @returns {Promise<Array>} Lista de áreas
   */
  async getAreas(options = {}) {
    const { force = false, includeInactive = false } = options;
    
    // Verificar caché si no se fuerza la recarga
    if (!force) {
      const cachedAreas = areaCache.get(AREAS_CACHE_KEY);
      if (cachedAreas) {
        // Filtrar áreas inactivas si es necesario
        return includeInactive 
          ? cachedAreas 
          : cachedAreas.filter(area => area.IsActive);
      }
    }
    
    try {
      const response = await apiService.get('/areas');
      
      if (response.data && response.data.success) {
        // Guardar en caché
        areaCache.set(AREAS_CACHE_KEY, response.data.data);
        
        // Actualizar cache individual para cada área
        response.data.data.forEach(area => {
          areaCache.set(`${AREA_PREFIX}${area.IDArea}`, area);
        });
        
        // Filtrar si es necesario
        return includeInactive 
          ? response.data.data 
          : response.data.data.filter(area => area.IsActive);
      }
      
      throw new Error(response.data?.message || 'Error al obtener áreas');
    } catch (error) {
      logOperation('AREA_SERVICE', 'ERROR', 'Error al obtener áreas', {
        error: error.message
      });
      throw error;
    }
  },
  
  /**
   * Obtener un área por ID (con caché)
   * @param {number} id - ID del área
   * @param {boolean} force - Forzar recarga desde el servidor
   * @returns {Promise<Object>} Datos del área
   */
  async getAreaById(id, force = false) {
    if (!id) {
      throw new Error('ID de área no proporcionado');
    }
    
    const cacheKey = `${AREA_PREFIX}${id}`;
    
    // Verificar caché si no se fuerza la recarga
    if (!force) {
      const cachedArea = areaCache.get(cacheKey);
      if (cachedArea) {
        return cachedArea;
      }
    }
    
    try {
      const response = await apiService.get(`/areas/${id}`);
      
      if (response.data && response.data.success) {
        // Guardar en caché
        areaCache.set(cacheKey, response.data.data);
        return response.data.data;
      }
      
      throw new Error(response.data?.message || `Área con ID ${id} no encontrada`);
    } catch (error) {
      logOperation('AREA_SERVICE', 'ERROR', `Error al obtener área #${id}`, {
        error: error.message,
        areaId: id
      });
      throw error;
    }
  },
  
  /**
   * Crear una nueva área
   * @param {Object} areaData - Datos del área a crear
   * @returns {Promise<Object>} Área creada
   */
  async createArea(areaData) {
    // Validar datos
    const { isValid, errors } = validateArea(areaData);
    if (!isValid) {
      logOperation('AREA_SERVICE', 'WARNING', 'Intento de crear área con datos inválidos', {
        errors,
        data: areaData
      });
      throw new Error(`Datos de área inválidos: ${JSON.stringify(errors)}`);
    }
    
    // Normalizar datos
    const normalizedData = normalizeAreaData(areaData);
    
    try {
      const response = await apiService.post('/areas', normalizedData);
      
      if (response.data && response.data.success) {
        // Invalidar caché de lista
        areaCache.del(AREAS_CACHE_KEY);
        
        // Guardar nueva área en caché
        const newArea = response.data.data;
        areaCache.set(`${AREA_PREFIX}${newArea.IDArea}`, newArea);
        
        // Registrar operación
        logOperation('AREA_SERVICE', 'INFO', 'Área creada correctamente', {
          areaId: newArea.IDArea,
          nombreArea: newArea.NombreArea
        });
        
        return newArea;
      }
      
      throw new Error(response.data?.message || 'Error al crear área');
    } catch (error) {
      logOperation('AREA_SERVICE', 'ERROR', 'Error al crear área', {
        error: error.message,
        data: normalizedData
      });
      throw error;
    }
  },
  
  /**
   * Actualizar un área existente
   * @param {number} id - ID del área a actualizar
   * @param {Object} areaData - Datos a actualizar
   * @returns {Promise<Object>} Área actualizada
   */
  async updateArea(id, areaData) {
    if (!id) {
      throw new Error('ID de área no proporcionado');
    }
    
    // Validar datos
    const { isValid, errors } = validateArea(areaData);
    if (!isValid) {
      logOperation('AREA_SERVICE', 'WARNING', `Intento de actualizar área #${id} con datos inválidos`, {
        errors,
        data: areaData,
        areaId: id
      });
      throw new Error(`Datos de área inválidos: ${JSON.stringify(errors)}`);
    }
    
    // Normalizar datos
    const normalizedData = normalizeAreaData(areaData);
    
    try {
      const response = await apiService.put(`/areas/${id}`, normalizedData);
      
      if (response.data && response.data.success) {
        // Invalidar caché
        areaCache.del(AREAS_CACHE_KEY);
        areaCache.del(`${AREA_PREFIX}${id}`);
        
        // Guardar área actualizada en caché
        const updatedArea = response.data.data;
        areaCache.set(`${AREA_PREFIX}${id}`, updatedArea);
        
        // Registrar operación
        logOperation('AREA_SERVICE', 'INFO', `Área #${id} actualizada correctamente`, {
          areaId: id,
          nombreArea: updatedArea.NombreArea
        });
        
        return updatedArea;
      }
      
      throw new Error(response.data?.message || `Error al actualizar área #${id}`);
    } catch (error) {
      logOperation('AREA_SERVICE', 'ERROR', `Error al actualizar área #${id}`, {
        error: error.message,
        areaId: id,
        data: normalizedData
      });
      throw error;
    }
  },
  
  /**
   * Eliminar un área
   * @param {number} id - ID del área a eliminar
   * @returns {Promise<Object>} Resultado de la operación
   */
  async deleteArea(id) {
    if (!id) {
      throw new Error('ID de área no proporcionado');
    }
    
    try {
      const response = await apiService.delete(`/areas/${id}`);
      
      if (response.data && response.data.success) {
        // Invalidar caché
        areaCache.del(AREAS_CACHE_KEY);
        areaCache.del(`${AREA_PREFIX}${id}`);
        
        // Registrar operación
        logOperation('AREA_SERVICE', 'INFO', `Área #${id} eliminada correctamente`, {
          areaId: id
        });
        
        return response.data;
      }
      
      throw new Error(response.data?.message || `Error al eliminar área #${id}`);
    } catch (error) {
      logOperation('AREA_SERVICE', 'ERROR', `Error al eliminar área #${id}`, {
        error: error.message,
        areaId: id
      });
      throw error;
    }
  },
  
  /**
   * Cambiar estado de un área (activar/desactivar)
   * @param {number} id - ID del área
   * @param {boolean} active - Nuevo estado (true: activo, false: inactivo)
   * @returns {Promise<Object>} Área actualizada
   */
  async toggleAreaStatus(id, active) {
    if (!id) {
      throw new Error('ID de área no proporcionado');
    }
    
    try {
      const response = await apiService.put(`/areas/${id}/estado`, { active });
      
      if (response.data && response.data.success) {
        // Invalidar caché
        areaCache.del(AREAS_CACHE_KEY);
        areaCache.del(`${AREA_PREFIX}${id}`);
        
        // Guardar área actualizada en caché
        const updatedArea = response.data.data;
        areaCache.set(`${AREA_PREFIX}${id}`, updatedArea);
        
        // Registrar operación
        const statusText = active ? 'activada' : 'desactivada';
        logOperation('AREA_SERVICE', 'INFO', `Área #${id} ${statusText} correctamente`, {
          areaId: id,
          nuevoEstado: active
        });
        
        return updatedArea;
      }
      
      throw new Error(response.data?.message || `Error al cambiar estado del área #${id}`);
    } catch (error) {
      logOperation('AREA_SERVICE', 'ERROR', `Error al cambiar estado del área #${id}`, {
        error: error.message,
        areaId: id,
        active
      });
      throw error;
    }
  },
  
  /**
   * Obtener responsables de un área
   * @param {number} areaId - ID del área
   * @returns {Promise<Array>} Lista de responsables
   */
  async getAreaResponsibles(areaId) {
    if (!areaId) {
      throw new Error('ID de área no proporcionado');
    }
    
    try {
      const response = await apiService.get(`/areas/${areaId}/responsables`);
      
      if (response.data && response.data.success) {
        return response.data.data;
      }
      
      throw new Error(response.data?.message || `Error al obtener responsables del área #${areaId}`);
    } catch (error) {
      logOperation('AREA_SERVICE', 'ERROR', `Error al obtener responsables del área #${areaId}`, {
        error: error.message,
        areaId
      });
      throw error;
    }
  },
  
  /**
   * Asignar un responsable a un área
   * @param {number} areaId - ID del área
   * @param {number} userId - ID del usuario a asignar
   * @returns {Promise<Object>} Resultado de la operación
   */
  async addAreaResponsible(areaId, userId) {
    if (!areaId || !userId) {
      throw new Error('ID de área o usuario no proporcionado');
    }
    
    try {
      const response = await apiService.post(`/areas/${areaId}/responsables`, { IDUsuario: userId });
      
      if (response.data && response.data.success) {
        // Registrar operación
        logOperation('AREA_SERVICE', 'INFO', `Responsable asignado al área #${areaId}`, {
          areaId,
          userId
        });
        
        return response.data;
      }
      
      throw new Error(response.data?.message || `Error al asignar responsable al área #${areaId}`);
    } catch (error) {
      logOperation('AREA_SERVICE', 'ERROR', `Error al asignar responsable al área #${areaId}`, {
        error: error.message,
        areaId,
        userId
      });
      throw error;
    }
  },
  
  /**
   * Remover un responsable de un área
   * @param {number} areaId - ID del área
   * @param {number} userId - ID del usuario a remover
   * @returns {Promise<Object>} Resultado de la operación
   */
  async removeAreaResponsible(areaId, userId) {
    if (!areaId || !userId) {
      throw new Error('ID de área o usuario no proporcionado');
    }
    
    try {
      const response = await apiService.delete(`/areas/${areaId}/responsables/${userId}`);
      
      if (response.data && response.data.success) {
        // Registrar operación
        logOperation('AREA_SERVICE', 'INFO', `Responsable removido del área #${areaId}`, {
          areaId,
          userId
        });
        
        return response.data;
      }
      
      throw new Error(response.data?.message || `Error al remover responsable del área #${areaId}`);
    } catch (error) {
      logOperation('AREA_SERVICE', 'ERROR', `Error al remover responsable del área #${areaId}`, {
        error: error.message,
        areaId,
        userId
      });
      throw error;
    }
  },
  
  /**
   * Limpiar caché específica
   * @param {string} cacheKey - Clave de caché a limpiar (null para toda la caché)
   */
  clearCache(cacheKey = null) {
    if (cacheKey) {
      areaCache.del(cacheKey);
    } else {
      areaCache.flushAll();
    }
    
    logOperation('AREA_SERVICE', 'INFO', 'Caché de áreas limpiada', {
      cacheKey: cacheKey || 'ALL'
    });
  },
  
  /**
   * Sincronizar caché con el servidor
   * @returns {Promise<boolean>} Resultado de la sincronización
   */
  async syncCache() {
    try {
      // Obtener datos frescos
      const response = await apiService.get('/areas');
      
      if (response.data && response.data.success) {
        // Limpiar caché actual
        areaCache.flushAll();
        
        // Actualizar caché con nuevos datos
        areaCache.set(AREAS_CACHE_KEY, response.data.data);
        
        // Actualizar cache individual para cada área
        response.data.data.forEach(area => {
          areaCache.set(`${AREA_PREFIX}${area.IDArea}`, area);
        });
        
        logOperation('AREA_SERVICE', 'INFO', 'Caché de áreas sincronizada correctamente');
        
        return true;
      }
      
      throw new Error(response.data?.message || 'Error al sincronizar caché de áreas');
    } catch (error) {
      logOperation('AREA_SERVICE', 'ERROR', 'Error al sincronizar caché de áreas', {
        error: error.message
      });
      return false;
    }
  }
};

export default areaService; 