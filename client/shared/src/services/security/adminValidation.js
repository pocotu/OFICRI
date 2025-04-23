import { PERMISSIONS } from '../permissions/permissionService'
import { auditService } from './auditTrail'
import { httpClient } from '../api/httpClient'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

/**
 * Servicio para validar permisos de administrador
 */
export const adminValidationService = {
  /**
   * Verificar si el usuario actual tiene permisos de administrador
   * @returns {Promise<boolean>} - true si tiene permisos
   */
  async hasAdminPermission() {
    try {
      const response = await httpClient.post(`${API_URL}/permissions/verificar-bit`, {
        permission: PERMISSIONS.Administrar
      })
      return response.data.hasPermission
    } catch (error) {
      console.error('Error al verificar permisos de administrador:', error)
      return false
    }
  },

  /**
   * Validar que el usuario tiene permisos de administrador y registrar en auditoría si no los tiene
   * @param {string} action - Acción que se intenta realizar
   * @param {Object} resourceData - Datos del recurso sobre el que se actúa
   * @returns {Promise<boolean>} - true si tiene permisos
   */
  async validateAdminPermission(action, resourceData = {}) {
    const hasPermission = await this.hasAdminPermission()
    
    if (!hasPermission) {
      // Registrar intento de acceso no autorizado
      await auditService.logUnauthorizedAccess(
        'administración',
        action,
        {
          ...resourceData,
          timestamp: new Date().toISOString()
        }
      )
      
      // Registrar violación de seguridad
      await auditService.logSecurityViolation(
        `Intento de ${action} sin permisos de administrador`,
        {
          action,
          resourceData,
          timestamp: new Date().toISOString()
        }
      )
    }
    
    return hasPermission
  },

  /**
   * Verificar permisos de administrador y lanzar error si no los tiene
   * @param {string} action - Acción que se intenta realizar
   * @param {Object} resourceData - Datos del recurso sobre el que se actúa
   * @returns {Promise<void>}
   * @throws {Error} - Si el usuario no tiene permisos de administrador
   */
  async requireAdminPermission(action, resourceData = {}) {
    const hasPermission = await this.validateAdminPermission(action, resourceData)
    
    if (!hasPermission) {
      throw new Error(`No tiene permisos de administrador para realizar la acción: ${action}`)
    }
  }
}

export default adminValidationService 