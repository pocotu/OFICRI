import { api } from '../api';
import { logOperation } from '../audit/auditService';
import { permissionService } from './permissionService'

// Tipos de reglas contextuales
export const RULE_TYPES = {
  TIME: 'TIME',
  STATE: 'STATE',
  AREA: 'AREA',
  PROPERTY: 'PROPERTY'
};

// Operadores para reglas de tiempo
export const TIME_OPERATORS = {
  BEFORE: 'BEFORE',
  AFTER: 'AFTER',
  BETWEEN: 'BETWEEN',
  WEEKDAY: 'WEEKDAY',
  HOLIDAY: 'HOLIDAY'
};

// Operadores para reglas de estado
export const STATE_OPERATORS = {
  EQUALS: 'EQUALS',
  NOT_EQUALS: 'NOT_EQUALS',
  IN: 'IN',
  NOT_IN: 'NOT_IN'
};

/**
 * Reglas contextuales predefinidas para diferentes tipos de recursos
 */
const CONTEXTUAL_RULES = {
  module: {
    load: (context) => {
      // Por defecto, todos los módulos son accesibles
      return true
    }
  },
  apiCache: {
    access: (context) => {
      // Por defecto, el caché de API es accesible
      return true
    }
  },
  document: {
    view: (context, userPermissions) => {
      if (!context || !context.document) return false
      
      // Verificar permisos de visualización de documentos
      return permissionService.hasPermission(userPermissions, permissionService.PERMISSIONS.Ver)
    },
    edit: (context, userPermissions) => {
      if (!context || !context.document) return false
      
      // Solo se puede editar un documento si:
      // 1. El usuario tiene permiso de edición
      // 2. El documento está en un estado editable
      // 3. El documento pertenece al área del usuario o el usuario es administrador
      
      const hasEditPermission = permissionService.hasPermission(userPermissions, permissionService.PERMISSIONS.Editar)
      const isEditableState = ['BORRADOR', 'EN_REVISION'].includes(context.document.estado)
      
      return hasEditPermission && isEditableState
    },
    delete: (context, userPermissions) => {
      if (!context || !context.document) return false
      
      // Solo se puede eliminar un documento si:
      // 1. El usuario tiene permiso de eliminación
      // 2. El documento está en un estado que permite eliminación
      
      const hasDeletePermission = permissionService.hasPermission(userPermissions, permissionService.PERMISSIONS.Eliminar)
      const isDeletableState = ['BORRADOR'].includes(context.document.estado)
      
      return hasDeletePermission && isDeletableState
    }
  },
  area: {
    manage: (context, userPermissions) => {
      if (!context) return false
      
      // Solo los administradores pueden gestionar áreas
      return permissionService.hasPermission(userPermissions, permissionService.PERMISSIONS.Administrar)
    }
  },
  user: {
    view: (context, userPermissions) => {
      // Cualquier usuario puede ver perfiles básicos
      return true
    },
    edit: (context, userPermissions) => {
      if (!context || !context.user) return false
      
      // Solo se puede editar un usuario si:
      // 1. Es el propio usuario
      // 2. O el usuario actual tiene permisos de administración
      
      const isSelf = context.user.id === context.currentUser?.id
      const isAdmin = permissionService.hasPermission(userPermissions, permissionService.PERMISSIONS.Administrar)
      
      return isSelf || isAdmin
    }
  }
}

/**
 * Crea una nueva regla contextual
 * @param {Object} ruleData - Datos de la regla
 * @returns {Promise<Object>} - Regla creada
 */
export const createContextualRule = async (ruleData) => {
  try {
    const response = await api.post('/permissions/contextual', ruleData);
    await logOperation('CREATE_CONTEXTUAL_RULE', {
      ruleId: response.data.id,
      ...ruleData
    });
    return response.data;
  } catch (error) {
    console.error('Error creating contextual rule:', error);
    throw error;
  }
};

/**
 * Obtiene todas las reglas contextuales para un rol y área
 * @param {number} roleId - ID del rol
 * @param {number} areaId - ID del área
 * @returns {Promise<Array>} - Lista de reglas
 */
export const getContextualRules = async (roleId, areaId) => {
  try {
    const response = await api.get(`/permissions/contextual?roleId=${roleId}&areaId=${areaId}`);
    return response.data;
  } catch (error) {
    console.error('Error getting contextual rules:', error);
    throw error;
  }
};

/**
 * Actualiza una regla contextual existente
 * @param {number} ruleId - ID de la regla
 * @param {Object} ruleData - Datos actualizados
 * @returns {Promise<Object>} - Regla actualizada
 */
export const updateContextualRule = async (ruleId, ruleData) => {
  try {
    const response = await api.put(`/permissions/contextual/${ruleId}`, ruleData);
    await logOperation('UPDATE_CONTEXTUAL_RULE', {
      ruleId,
      ...ruleData
    });
    return response.data;
  } catch (error) {
    console.error('Error updating contextual rule:', error);
    throw error;
  }
};

/**
 * Elimina una regla contextual
 * @param {number} ruleId - ID de la regla
 * @returns {Promise<void>}
 */
export const deleteContextualRule = async (ruleId) => {
  try {
    await api.delete(`/permissions/contextual/${ruleId}`);
    await logOperation('DELETE_CONTEXTUAL_RULE', { ruleId });
  } catch (error) {
    console.error('Error deleting contextual rule:', error);
    throw error;
  }
};

/**
 * Evalúa una regla de tiempo
 * @param {Object} rule - Regla a evaluar
 * @returns {boolean} - Resultado de la evaluación
 */
export const evaluateTimeRule = (rule) => {
  const now = new Date();
  const { operator, value } = rule;

  switch (operator) {
    case TIME_OPERATORS.BEFORE:
      return now < new Date(value);
    case TIME_OPERATORS.AFTER:
      return now > new Date(value);
    case TIME_OPERATORS.BETWEEN:
      return now >= new Date(value[0]) && now <= new Date(value[1]);
    case TIME_OPERATORS.WEEKDAY:
      return now.getDay() >= 1 && now.getDay() <= 5;
    case TIME_OPERATORS.HOLIDAY:
      // Implementar lógica de días festivos
      return false;
    default:
      return false;
  }
};

/**
 * Evalúa una regla de estado
 * @param {Object} rule - Regla a evaluar
 * @param {string} currentState - Estado actual
 * @returns {boolean} - Resultado de la evaluación
 */
export const evaluateStateRule = (rule, currentState) => {
  const { operator, value } = rule;

  switch (operator) {
    case STATE_OPERATORS.EQUALS:
      return currentState === value;
    case STATE_OPERATORS.NOT_EQUALS:
      return currentState !== value;
    case STATE_OPERATORS.IN:
      return Array.isArray(value) ? value.includes(currentState) : false;
    case STATE_OPERATORS.NOT_IN:
      return Array.isArray(value) ? !value.includes(currentState) : false;
    default:
      return false;
  }
};

/**
 * Evalúa una regla contextual completa
 * @param {Object} rule - Regla a evaluar
 * @param {Object} context - Contexto actual
 * @returns {boolean} - Resultado de la evaluación
 */
export const evaluateContextualRule = (rule, context) => {
  const { tipo, regla } = rule;

  switch (tipo) {
    case RULE_TYPES.TIME:
      return evaluateTimeRule(regla);
    case RULE_TYPES.STATE:
      return evaluateStateRule(regla, context.state);
    case RULE_TYPES.AREA:
      return context.areaId === regla.areaId;
    case RULE_TYPES.PROPERTY:
      return context.propertyId === regla.propertyId;
    default:
      return false;
  }
};

/**
 * Obtiene las reglas activas para un contexto específico
 * @param {number} roleId - ID del rol
 * @param {number} areaId - ID del área
 * @returns {Promise<Array>} - Reglas activas
 */
export const getActiveRulesForContext = async (roleId, areaId) => {
  try {
    const rules = await getContextualRules(roleId, areaId);
    return rules.filter(rule => rule.activo);
  } catch (error) {
    console.error('Error getting active rules:', error);
    throw error;
  }
};

/**
 * Verifica si un usuario tiene permiso en un contexto específico
 * @param {Object} user - Usuario
 * @param {string} permission - Permiso a verificar
 * @param {Object} context - Contexto actual
 * @returns {Promise<boolean>} - Resultado de la verificación
 */
export const checkContextualPermission = async (user, permission, context) => {
  try {
    const activeRules = await getActiveRulesForContext(user.rolId, user.areaId);
    
    // Verificar si alguna regla bloquea el permiso
    const blockingRule = activeRules.find(rule => 
      rule.tipo === RULE_TYPES.STATE && 
      rule.regla.operator === STATE_OPERATORS.EQUALS &&
      rule.regla.value === 'BLOQUEADO'
    );

    if (blockingRule) {
      return false;
    }

    // Verificar reglas específicas del permiso
    const permissionRules = activeRules.filter(rule => 
      rule.tipo === RULE_TYPES.PROPERTY &&
      rule.regla.propertyId === permission
    );

    return permissionRules.some(rule => evaluateContextualRule(rule, context));
  } catch (error) {
    console.error('Error checking contextual permission:', error);
    return false;
  }
};

/**
 * Evalúa una regla contextual para un recurso y acción específicos
 * @param {Object} params - Parámetros para la evaluación
 * @param {string} params.module - Módulo o tipo de recurso
 * @param {string} params.action - Acción a realizar
 * @param {Object} params.context - Contexto adicional para la evaluación
 * @param {Object} userPermissions - Permisos del usuario
 * @returns {boolean} - true si la acción está permitida
 */
export function evaluateContextualRule(params, userPermissions) {
  const { module, action, context } = params
  
  // Buscar regla para el módulo y acción
  const moduleRules = CONTEXTUAL_RULES[module]
  if (!moduleRules) {
    // Si no hay reglas para el módulo, denegar por defecto
    return false
  }
  
  const rule = moduleRules[action]
  if (!rule) {
    // Si no hay regla para la acción, denegar por defecto
    return false
  }
  
  // Evaluar la regla contextual
  return rule(context, userPermissions)
}

export default {
  evaluateContextualRule,
  rules: CONTEXTUAL_RULES
} 