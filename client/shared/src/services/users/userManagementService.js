import { httpClient } from '../api/httpClient'
import { PERMISSIONS } from '../permissions/permissionService'
import { adminValidationService } from '../security/adminValidation'
import { auditService } from '../security/auditTrail'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

/**
 * Servicio para la gestión de usuarios (solo administradores)
 */
export const userManagementService = {
  /**
   * Validar formato de CIP (8 dígitos)
   * @param {string} codigoCIP - Código CIP a validar
   * @returns {boolean} - true si el formato es válido
   */
  validateCIP(codigoCIP) {
    return /^\d{8}$/.test(codigoCIP)
  },

  /**
   * Validar campos permitidos según el modelo de datos restringido
   * @param {Object} userData - Datos del usuario a validar
   * @returns {boolean} - true si los campos son válidos
   */
  validateUserFields(userData) {
    const allowedFields = [
      'codigoCIP',
      'nombres',
      'apellidos',
      'grado',
      'password',
      'idArea',
      'idRol'
    ]
    
    // Verificar que solo se incluyan campos permitidos
    const hasInvalidFields = Object.keys(userData).some(
      field => !allowedFields.includes(field)
    )
    
    if (hasInvalidFields) {
      throw new Error('Se han incluido campos no permitidos en los datos del usuario')
    }
    
    // Validar campos requeridos
    const requiredFields = ['codigoCIP', 'nombres', 'apellidos', 'grado', 'idArea', 'idRol']
    const missingFields = requiredFields.filter(field => !userData[field])
    
    if (missingFields.length > 0) {
      throw new Error(`Faltan campos requeridos: ${missingFields.join(', ')}`)
    }
    
    return true
  },

  /**
   * Crear un nuevo usuario (solo administradores)
   * @param {Object} userData - Datos del usuario a crear
   * @returns {Promise<Object>} - Respuesta del servidor
   */
  async createUser(userData) {
    try {
      // Verificar que el usuario actual tiene permisos de administrador
      await adminValidationService.requireAdminPermission('crear usuario', { userData })
      
      // Validar formato de CIP
      if (!this.validateCIP(userData.codigoCIP)) {
        throw new Error('El código CIP debe tener 8 dígitos')
      }
      
      // Validar campos permitidos
      this.validateUserFields(userData)
      
      const response = await httpClient.post(`${API_URL}/users`, userData)
      
      // Registrar evento de auditoría
      await auditService.logEvent(
        'USER_CREATE',
        `Usuario creado: ${userData.codigoCIP}`,
        'INFO',
        { userData: { codigoCIP: userData.codigoCIP, idArea: userData.idArea, idRol: userData.idRol } }
      )
      
      return response.data
    } catch (error) {
      console.error('Error al crear usuario:', error)
      
      // Registrar error en auditoría
      await auditService.logEvent(
        'SECURITY_VIOLATION',
        `Error al crear usuario: ${error.message}`,
        'ERROR',
        { error: error.message, userData: { codigoCIP: userData.codigoCIP } }
      )
      
      throw error
    }
  },

  /**
   * Actualizar datos de un usuario (solo administradores)
   * @param {number} userId - ID del usuario a actualizar
   * @param {Object} userData - Datos a actualizar
   * @returns {Promise<Object>} - Respuesta del servidor
   */
  async updateUser(userId, userData) {
    try {
      // Verificar que el usuario actual tiene permisos de administrador
      await adminValidationService.requireAdminPermission('actualizar usuario', { userId, userData })
      
      // Si se está actualizando el CIP, validar formato
      if (userData.codigoCIP && !this.validateCIP(userData.codigoCIP)) {
        throw new Error('El código CIP debe tener 8 dígitos')
      }
      
      // Validar campos permitidos
      this.validateUserFields(userData)
      
      const response = await httpClient.put(`${API_URL}/users/${userId}`, userData)
      
      // Registrar evento de auditoría
      await auditService.logEvent(
        'USER_UPDATE',
        `Usuario actualizado: ID ${userId}`,
        'INFO',
        { userId, userData: { codigoCIP: userData.codigoCIP, idArea: userData.idArea, idRol: userData.idRol } }
      )
      
      return response.data
    } catch (error) {
      console.error('Error al actualizar usuario:', error)
      
      // Registrar error en auditoría
      await auditService.logEvent(
        'SECURITY_VIOLATION',
        `Error al actualizar usuario: ${error.message}`,
        'ERROR',
        { error: error.message, userId, userData: { codigoCIP: userData.codigoCIP } }
      )
      
      throw error
    }
  },

  /**
   * Cambiar el estado de un usuario (activar/desactivar)
   * @param {number} userId - ID del usuario
   * @param {boolean} isActive - Nuevo estado
   * @returns {Promise<Object>} - Respuesta del servidor
   */
  async changeUserStatus(userId, isActive) {
    try {
      // Verificar que el usuario actual tiene permisos de administrador
      await adminValidationService.requireAdminPermission('cambiar estado de usuario', { userId, isActive })

      const response = await httpClient.put(`${API_URL}/users/${userId}/estado`, { isActive })
      
      // Registrar evento de auditoría
      await auditService.logEvent(
        'USER_STATUS_CHANGE',
        `Estado de usuario cambiado: ID ${userId} a ${isActive ? 'activo' : 'inactivo'}`,
        'INFO',
        { userId, isActive }
      )
      
      return response.data
    } catch (error) {
      console.error('Error al cambiar estado de usuario:', error)
      
      // Registrar error en auditoría
      await auditService.logEvent(
        'SECURITY_VIOLATION',
        `Error al cambiar estado de usuario: ${error.message}`,
        'ERROR',
        { error: error.message, userId, isActive }
      )
      
      throw error
    }
  },

  /**
   * Verificar si el usuario actual tiene permisos de administrador
   * @returns {Promise<boolean>} - true si tiene permisos
   * @deprecated Usar adminValidationService.hasAdminPermission() en su lugar
   */
  async checkAdminPermission() {
    console.warn('Este método está obsoleto. Use adminValidationService.hasAdminPermission() en su lugar.')
    return adminValidationService.hasAdminPermission()
  }
}

export default userManagementService 