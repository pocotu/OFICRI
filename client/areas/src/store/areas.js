/**
 * Store de Áreas - Gestión de estado central para áreas
 * Implementado con Pinia para mayor rendimiento y escalabilidad
 * 
 * Características:
 * - Gestión completa de áreas
 * - Caché integrada
 * - Sincronización con backend
 * - Operaciones CRUD optimizadas
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import areaService from '../services/areaService'
import { logOperation } from '@/shared/services/security/auditTrail'
import { useToast } from '@/shared/composables/useToast'

/**
 * Store para la gestión de áreas
 */
export const useAreaStore = defineStore('areas', () => {
  // Toast para notificaciones
  const { showToast } = useToast()
  
  // Estado reactivo
  const areas = ref([])
  const selectedArea = ref(null)
  const isLoading = ref(false)
  const error = ref(null)
  const lastFetch = ref(null)
  const filters = ref({
    searchTerm: '',
    tipoArea: null,
    estado: 'active',
    sortBy: 'NombreArea',
    sortDirection: 'asc'
  })
  
  // Getters computados
  
  /**
   * Obtener todas las áreas activas
   */
  const activeAreas = computed(() => {
    return areas.value.filter(area => area.IsActive)
  })
  
  /**
   * Obtener áreas ordenadas según criterios actuales
   */
  const sortedAreas = computed(() => {
    const filteredAreas = areas.value.filter(area => {
      // Filtrar por estado si es necesario
      if (filters.value.estado === 'active' && !area.IsActive) return false
      if (filters.value.estado === 'inactive' && area.IsActive) return false
      
      // Filtrar por tipo si es necesario
      if (filters.value.tipoArea && area.TipoArea !== filters.value.tipoArea) return false
      
      // Filtrar por término de búsqueda
      if (filters.value.searchTerm) {
        const searchLower = filters.value.searchTerm.toLowerCase()
        return area.NombreArea.toLowerCase().includes(searchLower) ||
               (area.Descripcion && area.Descripcion.toLowerCase().includes(searchLower)) ||
               (area.CodigoIdentificacion && area.CodigoIdentificacion.toLowerCase().includes(searchLower))
      }
      
      return true
    })
    
    // Ordenar según criterios
    return [...filteredAreas].sort((a, b) => {
      const sortBy = filters.value.sortBy
      const sortDir = filters.value.sortDirection === 'asc' ? 1 : -1
      
      if (a[sortBy] === null) return 1 * sortDir
      if (b[sortBy] === null) return -1 * sortDir
      
      if (typeof a[sortBy] === 'string') {
        return a[sortBy].localeCompare(b[sortBy]) * sortDir
      }
      
      return (a[sortBy] - b[sortBy]) * sortDir
    })
  })
  
  /**
   * Obtener un área por ID
   */
  const getAreaById = computed(() => {
    return (id) => areas.value.find(area => area.IDArea === parseInt(id))
  })
  
  /**
   * Obtener áreas raíz (sin padre)
   */
  const rootAreas = computed(() => {
    return areas.value.filter(area => !area.IDAreaPadre)
  })
  
  /**
   * Obtener áreas hijas de un área específica
   */
  const getChildAreas = computed(() => {
    return (parentId) => {
      return areas.value.filter(area => area.IDAreaPadre === parentId)
    }
  })
  
  /**
   * Verificar si hay datos cargados
   */
  const hasAreas = computed(() => {
    return areas.value.length > 0
  })
  
  // Acciones
  
  /**
   * Cargar todas las áreas desde el backend
   * @param {Object} options - Opciones de carga
   * @returns {Promise<Array>} Lista de áreas
   */
  const fetchAreas = async (options = { force: false }) => {
    if (isLoading.value) return areas.value
    
    // Si ya tenemos datos y no se fuerza la recarga, devolver los existentes
    if (hasAreas.value && !options.force && !shouldRefresh()) {
      return areas.value
    }
    
    isLoading.value = true
    error.value = null
    
    try {
      const areasData = await areaService.getAreas({
        force: options.force,
        includeInactive: true
      })
      
      areas.value = areasData
      lastFetch.value = new Date()
      
      return areas.value
    } catch (err) {
      error.value = err.message || 'Error al cargar áreas'
      showToast(error.value, 'error')
      throw err
    } finally {
      isLoading.value = false
    }
  }
  
  /**
   * Cargar un área específica por ID
   * @param {number} id - ID del área
   * @param {boolean} force - Forzar recarga desde servidor
   * @returns {Promise<Object>} Datos del área
   */
  const fetchAreaById = async (id, force = false) => {
    if (!id) {
      throw new Error('ID de área no proporcionado')
    }
    
    isLoading.value = true
    error.value = null
    
    try {
      // Obtener área con detalle completo
      const areaData = await areaService.getAreaById(id, force)
      
      // Actualizar si existe en el store, o agregar si no
      const index = areas.value.findIndex(a => a.IDArea === parseInt(id))
      if (index >= 0) {
        areas.value[index] = areaData
      } else {
        areas.value.push(areaData)
      }
      
      // Actualizar selección si es necesario
      if (selectedArea.value && selectedArea.value.IDArea === parseInt(id)) {
        selectedArea.value = areaData
      }
      
      return areaData
    } catch (err) {
      error.value = err.message || `Error al cargar área #${id}`
      showToast(error.value, 'error')
      throw err
    } finally {
      isLoading.value = false
    }
  }
  
  /**
   * Crear una nueva área
   * @param {Object} areaData - Datos del área a crear
   * @returns {Promise<Object>} Área creada
   */
  const createArea = async (areaData) => {
    isLoading.value = true
    error.value = null
    
    try {
      const createdArea = await areaService.createArea(areaData)
      
      // Agregar al store
      areas.value.push(createdArea)
      
      // Notificar
      showToast('Área creada correctamente', 'success')
      
      return createdArea
    } catch (err) {
      error.value = err.message || 'Error al crear área'
      showToast(error.value, 'error')
      throw err
    } finally {
      isLoading.value = false
    }
  }
  
  /**
   * Actualizar un área existente
   * @param {Object} areaData - Datos del área con IDArea incluido
   * @returns {Promise<Object>} Área actualizada
   */
  const updateArea = async (areaData) => {
    if (!areaData.IDArea) {
      throw new Error('ID de área no proporcionado')
    }
    
    isLoading.value = true
    error.value = null
    
    try {
      const updatedArea = await areaService.updateArea(areaData.IDArea, areaData)
      
      // Actualizar en el store
      const index = areas.value.findIndex(a => a.IDArea === updatedArea.IDArea)
      if (index >= 0) {
        areas.value[index] = updatedArea
      }
      
      // Actualizar selección si es necesario
      if (selectedArea.value && selectedArea.value.IDArea === updatedArea.IDArea) {
        selectedArea.value = updatedArea
      }
      
      // Notificar
      showToast('Área actualizada correctamente', 'success')
      
      return updatedArea
    } catch (err) {
      error.value = err.message || `Error al actualizar área #${areaData.IDArea}`
      showToast(error.value, 'error')
      throw err
    } finally {
      isLoading.value = false
    }
  }
  
  /**
   * Eliminar un área
   * @param {number} id - ID del área a eliminar
   * @returns {Promise<boolean>} true si se eliminó correctamente
   */
  const deleteArea = async (id) => {
    if (!id) {
      throw new Error('ID de área no proporcionado')
    }
    
    isLoading.value = true
    error.value = null
    
    try {
      await areaService.deleteArea(id)
      
      // Eliminar del store
      areas.value = areas.value.filter(area => area.IDArea !== parseInt(id))
      
      // Limpiar selección si es necesario
      if (selectedArea.value && selectedArea.value.IDArea === parseInt(id)) {
        selectedArea.value = null
      }
      
      // Notificar
      showToast('Área eliminada correctamente', 'success')
      
      return true
    } catch (err) {
      error.value = err.message || `Error al eliminar área #${id}`
      showToast(error.value, 'error')
      throw err
    } finally {
      isLoading.value = false
    }
  }
  
  /**
   * Cambiar estado de un área (activar/desactivar)
   * @param {number} id - ID del área
   * @param {boolean} active - Nuevo estado
   * @returns {Promise<Object>} Área actualizada
   */
  const toggleAreaStatus = async (id, active) => {
    if (!id) {
      throw new Error('ID de área no proporcionado')
    }
    
    isLoading.value = true
    error.value = null
    
    try {
      const updatedArea = await areaService.toggleAreaStatus(id, active)
      
      // Actualizar en el store
      const index = areas.value.findIndex(a => a.IDArea === parseInt(id))
      if (index >= 0) {
        areas.value[index] = updatedArea
      }
      
      // Actualizar selección si es necesario
      if (selectedArea.value && selectedArea.value.IDArea === parseInt(id)) {
        selectedArea.value = updatedArea
      }
      
      // Notificar
      const statusText = active ? 'activada' : 'desactivada'
      showToast(`Área ${statusText} correctamente`, 'success')
      
      return updatedArea
    } catch (err) {
      error.value = err.message || `Error al cambiar estado del área #${id}`
      showToast(error.value, 'error')
      throw err
    } finally {
      isLoading.value = false
    }
  }
  
  /**
   * Actualizar el área padre de un área
   * @param {number} areaId - ID del área
   * @param {number|null} newParentId - ID del nuevo padre (null para áreas raíz)
   * @returns {Promise<Object>} Área actualizada
   */
  const updateAreaParent = async (areaId, newParentId) => {
    if (!areaId) {
      throw new Error('ID de área no proporcionado')
    }
    
    // Verificar que no creamos un ciclo
    if (newParentId && wouldCreateCycle(areaId, newParentId)) {
      error.value = 'No se puede asignar un área hija como padre'
      showToast(error.value, 'error')
      throw new Error(error.value)
    }
    
    isLoading.value = true
    error.value = null
    
    try {
      // Obtener área actual
      const currentArea = areas.value.find(a => a.IDArea === parseInt(areaId))
      if (!currentArea) {
        throw new Error(`Área #${areaId} no encontrada`)
      }
      
      // Actualizar referencia
      const updatedData = {
        ...currentArea,
        IDAreaPadre: newParentId
      }
      
      // Guardar cambios
      const updatedArea = await updateArea(updatedData)
      
      // Notificar
      showToast('Jerarquía de área actualizada correctamente', 'success')
      
      // Registrar para auditoría
      logOperation('AREA_HIERARCHY', 'INFO', `Jerarquía de área #${areaId} actualizada`, {
        areaId,
        oldParentId: currentArea.IDAreaPadre,
        newParentId
      })
      
      return updatedArea
    } catch (err) {
      error.value = err.message || `Error al actualizar jerarquía del área #${areaId}`
      showToast(error.value, 'error')
      throw err
    } finally {
      isLoading.value = false
    }
  }
  
  /**
   * Verificar si actualizar un padre crearía un ciclo en la jerarquía
   * @param {number} areaId - ID del área a modificar
   * @param {number} newParentId - ID del nuevo padre
   * @returns {boolean} true si crearía un ciclo
   */
  const wouldCreateCycle = (areaId, newParentId) => {
    // Si son iguales, es un ciclo directo
    if (parseInt(areaId) === parseInt(newParentId)) {
      return true
    }
    
    // Verificar si el área a mover es ancestro del nuevo padre
    let currentAreaId = newParentId
    const visited = new Set()
    
    while (currentAreaId) {
      // Evitar bucles infinitos
      if (visited.has(currentAreaId)) {
        return true
      }
      visited.add(currentAreaId)
      
      const currentArea = areas.value.find(a => a.IDArea === currentAreaId)
      if (!currentArea) break
      
      // Si encontramos que el área es ancestro, es un ciclo
      if (currentArea.IDAreaPadre === areaId) return true
      
      // Seguimos subiendo en la jerarquía
      currentAreaId = currentArea.IDAreaPadre
    }
    
    return false
  }
  
  /**
   * Seleccionar un área para trabajar con ella
   * @param {number|Object} areaOrId - ID del área o el objeto área
   */
  const selectArea = (areaOrId) => {
    if (!areaOrId) {
      selectedArea.value = null
      return
    }
    
    if (typeof areaOrId === 'object') {
      selectedArea.value = areaOrId
    } else {
      const found = areas.value.find(a => a.IDArea === parseInt(areaOrId))
      selectedArea.value = found || null
    }
  }
  
  /**
   * Actualizar los filtros de búsqueda
   * @param {Object} newFilters - Nuevos filtros
   */
  const updateFilters = (newFilters) => {
    filters.value = {
      ...filters.value,
      ...newFilters
    }
  }
  
  /**
   * Borrar todos los filtros
   */
  const clearFilters = () => {
    filters.value = {
      searchTerm: '',
      tipoArea: null,
      estado: 'active',
      sortBy: 'NombreArea',
      sortDirection: 'asc'
    }
  }
  
  /**
   * Verificar si se debe actualizar la caché
   * @returns {boolean} true si los datos son viejos
   */
  const shouldRefresh = () => {
    if (!lastFetch.value) return true
    
    const now = new Date()
    const refreshInterval = 5 * 60 * 1000 // 5 minutos
    return now - lastFetch.value > refreshInterval
  }
  
  /**
   * Sincronizar datos con el servidor
   */
  const syncWithServer = async () => {
    try {
      await areaService.syncCache()
      await fetchAreas({ force: true })
      showToast('Datos sincronizados correctamente', 'success')
      return true
    } catch (err) {
      error.value = err.message || 'Error al sincronizar datos'
      showToast(error.value, 'error')
      return false
    }
  }
  
  /**
   * Restablecer el store a su estado inicial
   */
  const resetStore = () => {
    areas.value = []
    selectedArea.value = null
    isLoading.value = false
    error.value = null
    lastFetch.value = null
    clearFilters()
  }
  
  return {
    // Estado
    areas,
    selectedArea,
    isLoading,
    error,
    lastFetch,
    filters,
    
    // Getters
    activeAreas,
    sortedAreas,
    getAreaById,
    rootAreas,
    getChildAreas,
    hasAreas,
    
    // Acciones
    fetchAreas,
    fetchAreaById,
    createArea,
    updateArea,
    deleteArea,
    toggleAreaStatus,
    updateAreaParent,
    selectArea,
    updateFilters,
    clearFilters,
    syncWithServer,
    resetStore
  }
}) 