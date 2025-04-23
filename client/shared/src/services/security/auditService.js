import { httpClient } from '../api'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

export const auditService = {
  /**
   * Registra un cambio de permisos
   * @param {Object} data - Datos del cambio de permisos
   * @returns {Promise<boolean>} true si se registró correctamente
   */
  async logPermissionChange(data) {
    try {
      await httpClient.post(`${API_URL}/auditoria/permisos`, {
        ...data,
        timestamp: new Date().toISOString()
      })
      return true
    } catch (error) {
      console.error('Error al registrar cambio de permisos:', error)
      return false
    }
  },

  /**
   * Registra un intento de acceso denegado
   * @param {Object} data - Datos del intento de acceso
   * @returns {Promise<boolean>} true si se registró correctamente
   */
  async logAccessDenied(data) {
    try {
      await httpClient.post(`${API_URL}/auditoria/accesos-denegados`, {
        ...data,
        timestamp: new Date().toISOString()
      })
      return true
    } catch (error) {
      console.error('Error al registrar acceso denegado:', error)
      return false
    }
  },

  /**
   * Obtiene el historial de cambios de permisos
   * @param {Object} filters - Filtros para la búsqueda
   * @returns {Promise<Array>} Lista de cambios de permisos
   */
  async getPermissionHistory(filters = {}) {
    try {
      const response = await httpClient.get(`${API_URL}/auditoria/permisos`, {
        params: filters
      })
      return response.data
    } catch (error) {
      console.error('Error al obtener historial de permisos:', error)
      return []
    }
  },

  /**
   * Obtiene el historial de accesos denegados
   * @param {Object} filters - Filtros para la búsqueda
   * @returns {Promise<Array>} Lista de accesos denegados
   */
  async getAccessDeniedHistory(filters = {}) {
    try {
      const response = await httpClient.get(`${API_URL}/auditoria/accesos-denegados`, {
        params: filters
      })
      return response.data
    } catch (error) {
      console.error('Error al obtener historial de accesos denegados:', error)
      return []
    }
  }
}

export default auditService 