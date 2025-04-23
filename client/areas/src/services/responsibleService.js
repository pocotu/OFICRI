/**
 * Responsible Service - Servicio para gestión de responsables de áreas
 * Proporciona funcionalidades CRUD y seguimiento de responsables de áreas
 * Cumplimiento con ISO/IEC 27001
 */

import { apiService } from '@/shared/services/api';
import { logOperation } from '@/shared/services/security/auditTrail';
import { validateForm } from '@/shared/services/validation';
import NodeCache from 'node-cache';

// Cache con ttl de 5 minutos
const responsibleCache = new NodeCache({ 
  stdTTL: 300, // 5 minutos en segundos
  checkperiod: 60, // Verificar caducidad cada minuto
  useClones: false
});

// Claves para caché
const AREA_RESPONSIBLES_PREFIX = 'area_responsibles_';
const USER_AREAS_PREFIX = 'user_areas_';

/**
 * Normas de validación para asignación de responsables
 */
const responsibleAssignmentRules = {
  IDArea: {
    required: true,
    custom: value => {
      return !isNaN(parseInt(value)) && parseInt(value) > 0 ? true : 'ID de área inválido';
    }
  },
  IDUsuario: {
    required: true,
    custom: value => {
      return !isNaN(parseInt(value)) && parseInt(value) > 0 ? true : 'ID de usuario inválido';
    }
  }
};

/**
 * Validar asignación de responsable
 * @param {Object} assignmentData - Datos de asignación a validar
 * @returns {Object} Resultado de validación { isValid, errors }
 */
const validateAssignment = (assignmentData) => {
  return validateForm(assignmentData, responsibleAssignmentRules);
};

/**
 * Servicios relacionados con responsables de áreas
 */
const responsibleService = {
  /**
   * Obtener todos los responsables de un área
   * @param {number} areaId - ID del área
   * @param {Object} options - Opciones adicionales
   * @param {boolean} options.force - Forzar recarga desde servidor
   * @returns {Promise<Array>} Lista de responsables
   */
  async getAreaResponsibles(areaId, options = {}) {
    if (!areaId) {
      throw new Error('ID de área no proporcionado');
    }
    
    const { force = false } = options;
    const cacheKey = `${AREA_RESPONSIBLES_PREFIX}${areaId}`;
    
    // Verificar caché si no se fuerza la recarga
    if (!force) {
      const cachedResponsibles = responsibleCache.get(cacheKey);
      if (cachedResponsibles) {
        return cachedResponsibles;
      }
    }
    
    try {
      const response = await apiService.get(`/areas/${areaId}/responsables`);
      
      if (response.data && response.data.success) {
        // Guardar en caché
        responsibleCache.set(cacheKey, response.data.data);
        return response.data.data;
      }
      
      throw new Error(response.data?.message || `Error al obtener responsables del área #${areaId}`);
    } catch (error) {
      logOperation('RESPONSIBLE_SERVICE', 'ERROR', `Error al obtener responsables del área #${areaId}`, {
        error: error.message,
        areaId
      });
      throw error;
    }
  },
  
  /**
   * Obtener todas las áreas donde un usuario es responsable
   * @param {number} userId - ID del usuario
   * @param {Object} options - Opciones adicionales
   * @param {boolean} options.force - Forzar recarga desde servidor
   * @returns {Promise<Array>} Lista de áreas
   */
  async getUserResponsibleAreas(userId, options = {}) {
    if (!userId) {
      throw new Error('ID de usuario no proporcionado');
    }
    
    const { force = false } = options;
    const cacheKey = `${USER_AREAS_PREFIX}${userId}`;
    
    // Verificar caché si no se fuerza la recarga
    if (!force) {
      const cachedAreas = responsibleCache.get(cacheKey);
      if (cachedAreas) {
        return cachedAreas;
      }
    }
    
    try {
      const response = await apiService.get(`/usuarios/${userId}/areas-responsable`);
      
      if (response.data && response.data.success) {
        // Guardar en caché
        responsibleCache.set(cacheKey, response.data.data);
        return response.data.data;
      }
      
      throw new Error(response.data?.message || `Error al obtener áreas del responsable #${userId}`);
    } catch (error) {
      logOperation('RESPONSIBLE_SERVICE', 'ERROR', `Error al obtener áreas del responsable #${userId}`, {
        error: error.message,
        userId
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
  async assignResponsible(areaId, userId) {
    // Validar datos
    const { isValid, errors } = validateAssignment({ IDArea: areaId, IDUsuario: userId });
    if (!isValid) {
      logOperation('RESPONSIBLE_SERVICE', 'WARNING', 'Intento de asignar responsable con datos inválidos', {
        errors,
        areaId,
        userId
      });
      throw new Error(`Datos de asignación inválidos: ${JSON.stringify(errors)}`);
    }
    
    try {
      const response = await apiService.post(`/areas/${areaId}/responsables`, { IDUsuario: userId });
      
      if (response.data && response.data.success) {
        // Invalidar caché
        responsibleCache.del(`${AREA_RESPONSIBLES_PREFIX}${areaId}`);
        responsibleCache.del(`${USER_AREAS_PREFIX}${userId}`);
        
        // Registrar operación
        logOperation('RESPONSIBLE_SERVICE', 'INFO', `Responsable asignado al área #${areaId}`, {
          areaId,
          userId
        });
        
        return response.data;
      }
      
      throw new Error(response.data?.message || `Error al asignar responsable al área #${areaId}`);
    } catch (error) {
      logOperation('RESPONSIBLE_SERVICE', 'ERROR', `Error al asignar responsable al área #${areaId}`, {
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
  async removeResponsible(areaId, userId) {
    // Validar datos
    if (!areaId || !userId) {
      throw new Error('ID de área o usuario no proporcionado');
    }
    
    try {
      const response = await apiService.delete(`/areas/${areaId}/responsables/${userId}`);
      
      if (response.data && response.data.success) {
        // Invalidar caché
        responsibleCache.del(`${AREA_RESPONSIBLES_PREFIX}${areaId}`);
        responsibleCache.del(`${USER_AREAS_PREFIX}${userId}`);
        
        // Registrar operación
        logOperation('RESPONSIBLE_SERVICE', 'INFO', `Responsable removido del área #${areaId}`, {
          areaId,
          userId
        });
        
        return response.data;
      }
      
      throw new Error(response.data?.message || `Error al remover responsable del área #${areaId}`);
    } catch (error) {
      logOperation('RESPONSIBLE_SERVICE', 'ERROR', `Error al remover responsable del área #${areaId}`, {
        error: error.message,
        areaId,
        userId
      });
      throw error;
    }
  },
  
  /**
   * Comprobar si un usuario es responsable de un área
   * @param {number} areaId - ID del área
   * @param {number} userId - ID del usuario
   * @returns {Promise<boolean>} true si es responsable
   */
  async isUserResponsibleForArea(areaId, userId) {
    if (!areaId || !userId) {
      return false;
    }
    
    try {
      // Obtener responsables del área
      const responsibles = await this.getAreaResponsibles(areaId);
      
      // Verificar si el usuario está en la lista
      return responsibles.some(responsible => responsible.IDUsuario === userId);
    } catch (error) {
      logOperation('RESPONSIBLE_SERVICE', 'ERROR', `Error al verificar responsable del área #${areaId}`, {
        error: error.message,
        areaId,
        userId
      });
      return false;
    }
  },
  
  /**
   * Actualizar la lista completa de responsables de un área
   * @param {number} areaId - ID del área
   * @param {Array<number>} userIds - IDs de los usuarios responsables
   * @returns {Promise<Object>} Resultado de la operación
   */
  async updateAreaResponsibles(areaId, userIds) {
    if (!areaId) {
      throw new Error('ID de área no proporcionado');
    }
    
    if (!Array.isArray(userIds)) {
      throw new Error('La lista de IDs de usuarios debe ser un array');
    }
    
    try {
      const response = await apiService.put(`/areas/${areaId}/responsables`, { responsables: userIds });
      
      if (response.data && response.data.success) {
        // Invalidar caché
        responsibleCache.del(`${AREA_RESPONSIBLES_PREFIX}${areaId}`);
        
        // Invalidar caché para cada usuario
        userIds.forEach(userId => {
          responsibleCache.del(`${USER_AREAS_PREFIX}${userId}`);
        });
        
        // Registrar operación
        logOperation('RESPONSIBLE_SERVICE', 'INFO', `Lista de responsables actualizada para el área #${areaId}`, {
          areaId,
          userIds
        });
        
        return response.data;
      }
      
      throw new Error(response.data?.message || `Error al actualizar responsables del área #${areaId}`);
    } catch (error) {
      logOperation('RESPONSIBLE_SERVICE', 'ERROR', `Error al actualizar responsables del área #${areaId}`, {
        error: error.message,
        areaId,
        userIds
      });
      throw error;
    }
  },
  
  /**
   * Obtener estadísticas de responsables
   * @returns {Promise<Object>} Datos estadísticos
   */
  async getResponsiblesStats() {
    try {
      const response = await apiService.get('/areas/responsables/estadisticas');
      
      if (response.data && response.data.success) {
        return response.data.data;
      }
      
      throw new Error(response.data?.message || 'Error al obtener estadísticas de responsables');
    } catch (error) {
      logOperation('RESPONSIBLE_SERVICE', 'ERROR', 'Error al obtener estadísticas de responsables', {
        error: error.message
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
      responsibleCache.del(cacheKey);
    } else {
      responsibleCache.flushAll();
    }
    
    logOperation('RESPONSIBLE_SERVICE', 'INFO', 'Caché de responsables limpiada', {
      cacheKey: cacheKey || 'ALL'
    });
  }
};

export default responsibleService; 