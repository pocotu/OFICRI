import { httpClient } from '../api'
import { auditService } from '../security/auditService'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

// Constantes de permisos basados en bits
export const PERMISSIONS = {
  Crear: 1,      // 00000001
  Editar: 2,     // 00000010
  Eliminar: 4,   // 00000100
  Ver: 8,        // 00001000
  Derivar: 16,   // 00010000
  Auditar: 32,   // 00100000
  Exportar: 64,  // 01000000
  Administrar: 128 // 10000000
}

// Roles predefinidos
export const ROLES = {
  ADMINISTRADOR: 255, // Todos los permisos
  MESA_PARTES: 91,   // Crear, Editar, Ver, Derivar, Exportar
  RESPONSABLE_AREA: 91 // Crear, Editar, Ver, Derivar, Exportar
}

// Servicio de permisos
export const permissionService = {
  /**
   * Verifica un permiso específico
   * @param {number} permissions - Permisos del usuario
   * @param {number} permission - Permiso a verificar
   * @param {string} contextType - Tipo de contexto
   * @param {string|number} contextId - ID del contexto
   * @returns {Promise<boolean>} true si tiene el permiso
   */
  async checkPermission(permissions, permission, contextType, contextId) {
    try {
      const response = await httpClient.get(`${API_URL}/permissions/check`, {
        params: {
          permission,
          contextType,
          contextId
        }
      })

      // Registrar verificación de permiso
      await auditService.logPermissionChange({
        tipo: 'CHECK_PERMISSION',
        detalles: `Verificación de permiso ${permission} en contexto ${contextType}:${contextId}`,
        resultado: response.data.hasPermission
      })

      return response.data.hasPermission
    } catch (error) {
      console.error('Error al verificar permiso:', error)
      return false
    }
  },

  /**
   * Obtiene los permisos por contexto
   * @param {string} contextType - Tipo de contexto
   * @param {string|number} contextId - ID del contexto
   * @returns {Promise<Array>} Lista de permisos
   */
  async getPermissionsByContext(contextType, contextId) {
    try {
      const response = await httpClient.get(`${API_URL}/permissions/context`, {
        params: {
          contextType,
          contextId
        }
      })

      // Registrar consulta de permisos
      await auditService.logPermissionChange({
        tipo: 'GET_PERMISSIONS',
        detalles: `Consulta de permisos en contexto ${contextType}:${contextId}`
      })

      return response.data.permissions
    } catch (error) {
      console.error('Error al obtener permisos por contexto:', error)
      return []
    }
  },

  /**
   * Asigna un permiso
   * @param {number} permission - Permiso a asignar
   * @param {string} contextType - Tipo de contexto
   * @param {string|number} contextId - ID del contexto
   * @returns {Promise<boolean>} true si se asignó correctamente
   */
  async assignPermission(permission, contextType, contextId) {
    try {
      await httpClient.post(`${API_URL}/permissions/assign`, {
        permission,
        contextType,
        contextId
      })

      // Registrar asignación de permiso
      await auditService.logPermissionChange({
        tipo: 'ASSIGN_PERMISSION',
        detalles: `Asignación de permiso ${permission} en contexto ${contextType}:${contextId}`
      })

      return true
    } catch (error) {
      console.error('Error al asignar permiso:', error)
      return false
    }
  },

  /**
   * Revoca un permiso
   * @param {number} permission - Permiso a revocar
   * @param {string} contextType - Tipo de contexto
   * @param {string|number} contextId - ID del contexto
   * @returns {Promise<boolean>} true si se revocó correctamente
   */
  async revokePermission(permission, contextType, contextId) {
    try {
      await httpClient.delete(`${API_URL}/permissions/revoke`, {
        params: {
          permission,
          contextType,
          contextId
        }
      })

      // Registrar revocación de permiso
      await auditService.logPermissionChange({
        tipo: 'REVOKE_PERMISSION',
        detalles: `Revocación de permiso ${permission} en contexto ${contextType}:${contextId}`
      })

      return true
    } catch (error) {
      console.error('Error al revocar permiso:', error)
      return false
    }
  },

  /**
   * Verifica si el usuario tiene un permiso específico
   * @param {number} permissions - Permisos del usuario
   * @param {number} permission - Permiso a verificar
   * @returns {boolean} true si tiene el permiso
   */
  hasPermission(permissions, permission) {
    return (permissions & permission) === permission
  },

  /**
   * Verifica si el usuario tiene todos los permisos especificados
   * @param {number} permissions - Permisos del usuario
   * @param {Array<number>} requiredPermissions - Permisos requeridos
   * @returns {boolean} true si tiene todos los permisos
   */
  hasAllPermissions(permissions, requiredPermissions) {
    return requiredPermissions.every(permission => 
      this.hasPermission(permissions, permission)
    )
  },

  /**
   * Verifica si el usuario tiene al menos uno de los permisos especificados
   * @param {number} permissions - Permisos del usuario
   * @param {Array<number>} requiredPermissions - Permisos requeridos
   * @returns {boolean} true si tiene al menos un permiso
   */
  hasAnyPermission(permissions, requiredPermissions) {
    return requiredPermissions.some(permission => 
      this.hasPermission(permissions, permission)
    )
  }
}

export default permissionService 