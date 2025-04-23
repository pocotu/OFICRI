// Importar y re-exportar el servicio de permisos desde la ubicación correcta
import { permissionService, PERMISSIONS, ROLES } from '../permissions/permissionService'
import { evaluateContextualRule } from '../permissions/contextualRules'

// Mejorar el servicio de permisos con funciones contextuales
const permissionsServiceExtended = {
  ...permissionService,
  
  /**
   * Verifica un permiso contextual
   * @param {Object} params - Parámetros para la verificación contextual
   * @param {string} params.module - Módulo o tipo de recurso
   * @param {string} params.action - Acción a realizar
   * @param {Object} params.context - Contexto adicional para la evaluación
   * @returns {Promise<boolean>} - true si la acción está permitida
   */
  async checkContextualPermission(params) {
    try {
      // Obtener permisos del usuario (simulado, en producción obtener del store)
      const userPermissions = 255 // Simulamos todos los permisos por ahora
      
      // Evaluar regla contextual
      return evaluateContextualRule(params, userPermissions)
    } catch (error) {
      console.error('Error al verificar permiso contextual:', error)
      return false
    }
  }
}

export {
  permissionsServiceExtended as permissionService,
  PERMISSIONS,
  ROLES
}

export default {
  permissionService: permissionsServiceExtended,
  PERMISSIONS,
  ROLES
} 