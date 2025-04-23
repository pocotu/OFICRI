/**
 * Store de Responsables - Gestión de estado central para responsables de áreas
 * Implementado con Pinia para mayor rendimiento y escalabilidad
 */

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import responsibleService from '../services/responsibleService';
import { useToast } from '@/shared/composables/useToast';
import { logOperation } from '@/shared/services/security/auditTrail';

export const useResponsibleStore = defineStore('responsibles', () => {
  // Toast para notificaciones
  const { showToast } = useToast();
  
  // Estado reactivo
  const areaResponsibles = ref({}); // Mapa de responsables por área: { areaId: [responsables] }
  const userAreas = ref({}); // Mapa de áreas por usuario: { userId: [areas] }
  const selectedResponsible = ref(null);
  const isLoading = ref(false);
  const error = ref(null);
  const lastFetch = ref({}); // Mapa de fechas de última obtención: { cacheKey: Date }
  const filters = ref({
    searchTerm: '',
    grado: null,
    sortBy: 'Apellidos',
    sortDirection: 'asc'
  });
  
  // Getters computados
  
  /**
   * Obtener responsables de un área específica
   */
  const getResponsiblesForArea = computed(() => {
    return (areaId) => {
      return areaResponsibles.value[areaId] || [];
    };
  });
  
  /**
   * Obtener áreas donde un usuario es responsable
   */
  const getAreasForUser = computed(() => {
    return (userId) => {
      return userAreas.value[userId] || [];
    };
  });
  
  /**
   * Obtener responsables filtrados de un área
   */
  const getFilteredResponsiblesForArea = computed(() => {
    return (areaId) => {
      const responsibles = areaResponsibles.value[areaId] || [];
      
      return responsibles.filter(responsible => {
        // Filtrar por término de búsqueda
        if (filters.value.searchTerm) {
          const searchLower = filters.value.searchTerm.toLowerCase();
          const fullName = `${responsible.Nombres} ${responsible.Apellidos}`.toLowerCase();
          const cipMatch = responsible.CodigoCIP?.toLowerCase().includes(searchLower);
          
          if (!fullName.includes(searchLower) && !cipMatch) {
            return false;
          }
        }
        
        // Filtrar por grado
        if (filters.value.grado && responsible.Grado !== filters.value.grado) {
          return false;
        }
        
        return true;
      }).sort((a, b) => {
        const sortBy = filters.value.sortBy;
        const sortDir = filters.value.sortDirection === 'asc' ? 1 : -1;
        
        if (typeof a[sortBy] === 'string') {
          return a[sortBy].localeCompare(b[sortBy]) * sortDir;
        }
        
        return (a[sortBy] - b[sortBy]) * sortDir;
      });
    };
  });
  
  /**
   * Verificar si un usuario es responsable de un área
   */
  const isUserResponsibleForArea = computed(() => {
    return (areaId, userId) => {
      const responsibles = areaResponsibles.value[areaId] || [];
      return responsibles.some(r => r.IDUsuario === parseInt(userId));
    };
  });
  
  /**
   * Obtener estadísticas de responsables
   */
  const responsibleStats = computed(() => {
    // Contar áreas sin responsables
    const areasWithoutResponsibles = Object.keys(areaResponsibles.value).filter(
      areaId => !areaResponsibles.value[areaId] || areaResponsibles.value[areaId].length === 0
    ).length;
    
    // Contar usuarios con múltiples áreas
    const usersWithMultipleAreas = Object.keys(userAreas.value).filter(
      userId => userAreas.value[userId] && userAreas.value[userId].length > 1
    ).length;
    
    return {
      areasWithoutResponsibles,
      usersWithMultipleAreas
    };
  });
  
  // Acciones
  
  /**
   * Cargar responsables de un área
   * @param {number} areaId - ID del área
   * @param {Object} options - Opciones adicionales
   * @returns {Promise<Array>} Lista de responsables
   */
  async function fetchAreaResponsibles(areaId, options = { force: false }) {
    if (!areaId) {
      throw new Error('ID de área no proporcionado');
    }
    
    // Si ya tenemos datos recientes y no se fuerza la recarga
    const cacheKey = `area_${areaId}`;
    if (
      !options.force && 
      areaResponsibles.value[areaId] && 
      !shouldRefresh(cacheKey)
    ) {
      return areaResponsibles.value[areaId];
    }
    
    isLoading.value = true;
    error.value = null;
    
    try {
      const responsibles = await responsibleService.getAreaResponsibles(areaId, { 
        force: options.force 
      });
      
      // Actualizar el store
      areaResponsibles.value = { 
        ...areaResponsibles.value, 
        [areaId]: responsibles 
      };
      
      // Registrar fecha de obtención
      lastFetch.value = { 
        ...lastFetch.value, 
        [cacheKey]: new Date() 
      };
      
      return responsibles;
    } catch (err) {
      error.value = err.message || `Error al cargar responsables del área #${areaId}`;
      showToast(error.value, 'error');
      throw err;
    } finally {
      isLoading.value = false;
    }
  }
  
  /**
   * Cargar áreas donde un usuario es responsable
   * @param {number} userId - ID del usuario
   * @param {Object} options - Opciones adicionales
   * @returns {Promise<Array>} Lista de áreas
   */
  async function fetchUserAreas(userId, options = { force: false }) {
    if (!userId) {
      throw new Error('ID de usuario no proporcionado');
    }
    
    // Si ya tenemos datos recientes y no se fuerza la recarga
    const cacheKey = `user_${userId}`;
    if (
      !options.force && 
      userAreas.value[userId] && 
      !shouldRefresh(cacheKey)
    ) {
      return userAreas.value[userId];
    }
    
    isLoading.value = true;
    error.value = null;
    
    try {
      const areas = await responsibleService.getUserResponsibleAreas(userId, { 
        force: options.force 
      });
      
      // Actualizar el store
      userAreas.value = { 
        ...userAreas.value, 
        [userId]: areas 
      };
      
      // Registrar fecha de obtención
      lastFetch.value = { 
        ...lastFetch.value, 
        [cacheKey]: new Date() 
      };
      
      return areas;
    } catch (err) {
      error.value = err.message || `Error al cargar áreas del usuario #${userId}`;
      showToast(error.value, 'error');
      throw err;
    } finally {
      isLoading.value = false;
    }
  }
  
  /**
   * Asignar un responsable a un área
   * @param {number} areaId - ID del área
   * @param {number} userId - ID del usuario
   * @returns {Promise<Object>} Resultado de la operación
   */
  async function assignResponsible(areaId, userId) {
    if (!areaId || !userId) {
      throw new Error('ID de área o usuario no proporcionado');
    }
    
    isLoading.value = true;
    error.value = null;
    
    try {
      const result = await responsibleService.assignResponsible(areaId, userId);
      
      // Actualizar caché forzando recarga
      await fetchAreaResponsibles(areaId, { force: true });
      
      // Si tenemos datos de las áreas del usuario, actualizarlos también
      if (userAreas.value[userId]) {
        await fetchUserAreas(userId, { force: true });
      }
      
      // Notificar
      showToast('Responsable asignado correctamente', 'success');
      
      return result;
    } catch (err) {
      error.value = err.message || `Error al asignar responsable al área #${areaId}`;
      showToast(error.value, 'error');
      throw err;
    } finally {
      isLoading.value = false;
    }
  }
  
  /**
   * Remover un responsable de un área
   * @param {number} areaId - ID del área
   * @param {number} userId - ID del usuario
   * @returns {Promise<Object>} Resultado de la operación
   */
  async function removeResponsible(areaId, userId) {
    if (!areaId || !userId) {
      throw new Error('ID de área o usuario no proporcionado');
    }
    
    isLoading.value = true;
    error.value = null;
    
    try {
      const result = await responsibleService.removeResponsible(areaId, userId);
      
      // Actualizar caché forzando recarga
      await fetchAreaResponsibles(areaId, { force: true });
      
      // Si tenemos datos de las áreas del usuario, actualizarlos también
      if (userAreas.value[userId]) {
        await fetchUserAreas(userId, { force: true });
      }
      
      // Notificar
      showToast('Responsable removido correctamente', 'success');
      
      return result;
    } catch (err) {
      error.value = err.message || `Error al remover responsable del área #${areaId}`;
      showToast(error.value, 'error');
      throw err;
    } finally {
      isLoading.value = false;
    }
  }
  
  /**
   * Actualizar la lista completa de responsables de un área
   * @param {number} areaId - ID del área
   * @param {Array<number>} userIds - IDs de los usuarios responsables
   * @returns {Promise<Object>} Resultado de la operación
   */
  async function updateAreaResponsibles(areaId, userIds) {
    if (!areaId) {
      throw new Error('ID de área no proporcionado');
    }
    
    if (!Array.isArray(userIds)) {
      throw new Error('La lista de IDs de usuarios debe ser un array');
    }
    
    isLoading.value = true;
    error.value = null;
    
    try {
      const result = await responsibleService.updateAreaResponsibles(areaId, userIds);
      
      // Actualizar caché forzando recarga
      await fetchAreaResponsibles(areaId, { force: true });
      
      // Si tenemos datos de las áreas de algún usuario, actualizarlos también
      const updatePromises = userIds.map(userId => {
        if (userAreas.value[userId]) {
          return fetchUserAreas(userId, { force: true });
        }
        return Promise.resolve();
      });
      
      await Promise.all(updatePromises);
      
      // Notificar
      showToast('Responsables actualizados correctamente', 'success');
      
      return result;
    } catch (err) {
      error.value = err.message || `Error al actualizar responsables del área #${areaId}`;
      showToast(error.value, 'error');
      throw err;
    } finally {
      isLoading.value = false;
    }
  }
  
  /**
   * Actualizar filtros de búsqueda
   * @param {Object} newFilters - Nuevos filtros
   */
  function updateFilters(newFilters) {
    filters.value = {
      ...filters.value,
      ...newFilters
    };
  }
  
  /**
   * Limpiar filtros de búsqueda
   */
  function clearFilters() {
    filters.value = {
      searchTerm: '',
      grado: null,
      sortBy: 'Apellidos',
      sortDirection: 'asc'
    };
  }
  
  /**
   * Verificar si se debe refrescar la caché
   * @param {string} cacheKey - Clave de caché
   * @returns {boolean} true si los datos son viejos
   */
  function shouldRefresh(cacheKey) {
    if (!lastFetch.value[cacheKey]) return true;
    
    const now = new Date();
    const refreshInterval = 5 * 60 * 1000; // 5 minutos
    return now - lastFetch.value[cacheKey] > refreshInterval;
  }
  
  /**
   * Cargar estadísticas de responsables
   * @returns {Promise<Object>} Datos estadísticos
   */
  async function fetchResponsiblesStats() {
    isLoading.value = true;
    error.value = null;
    
    try {
      const stats = await responsibleService.getResponsiblesStats();
      
      // Registrar operación
      logOperation('RESPONSIBLE_SERVICE', 'INFO', 'Estadísticas de responsables consultadas');
      
      return stats;
    } catch (err) {
      error.value = err.message || 'Error al cargar estadísticas de responsables';
      showToast(error.value, 'error');
      throw err;
    } finally {
      isLoading.value = false;
    }
  }
  
  /**
   * Limpiar la caché de responsables
   */
  function clearCache() {
    areaResponsibles.value = {};
    userAreas.value = {};
    lastFetch.value = {};
    responsibleService.clearCache();
  }
  
  /**
   * Restablecer el store a su estado inicial
   */
  function resetStore() {
    areaResponsibles.value = {};
    userAreas.value = {};
    selectedResponsible.value = null;
    isLoading.value = false;
    error.value = null;
    lastFetch.value = {};
    clearFilters();
  }
  
  return {
    // Estado
    areaResponsibles,
    userAreas,
    selectedResponsible,
    isLoading,
    error,
    filters,
    
    // Getters
    getResponsiblesForArea,
    getAreasForUser,
    getFilteredResponsiblesForArea,
    isUserResponsibleForArea,
    responsibleStats,
    
    // Acciones
    fetchAreaResponsibles,
    fetchUserAreas,
    assignResponsible,
    removeResponsible,
    updateAreaResponsibles,
    updateFilters,
    clearFilters,
    fetchResponsiblesStats,
    clearCache,
    resetStore
  };
}); 