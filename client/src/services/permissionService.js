import { getAuthToken } from './authService';

// Mapeo de permisos por área y rol
const PERMISSIONS_MAP = {
  // Permisos para el área de Administración
  ADMIN: {
    ADMIN: ['read', 'write', 'delete', 'manage_users', 'manage_roles', 'manage_permissions'],
    SUPERVISOR: ['read', 'write'],
    USER: ['read']
  },
  // Permisos para el área de Operaciones
  OPERATIONS: {
    ADMIN: ['read', 'write', 'delete', 'manage_operations', 'manage_workflows'],
    SUPERVISOR: ['read', 'write', 'manage_workflows'],
    USER: ['read', 'write']
  },
  // Permisos para el área de Reportes
  REPORTS: {
    ADMIN: ['read', 'write', 'delete', 'manage_reports', 'export_data'],
    SUPERVISOR: ['read', 'write', 'export_data'],
    USER: ['read']
  },
  // Permisos para el área de Configuración
  SETTINGS: {
    ADMIN: ['read', 'write', 'delete', 'manage_settings'],
    SUPERVISOR: ['read', 'write'],
    USER: ['read']
  }
};

// Permisos especiales por rol
const SPECIAL_PERMISSIONS = {
  ADMIN: ['manage_all', 'view_audit_logs', 'manage_system_settings'],
  SUPERVISOR: ['view_audit_logs', 'manage_team'],
  USER: []
};

// Estados de documentos y sus permisos requeridos
const DOCUMENT_STATES = {
  DRAFT: ['write'],
  PENDING: ['read', 'write'],
  IN_PROGRESS: ['read', 'write'],
  COMPLETED: ['read'],
  ARCHIVED: ['read', 'write'],
  DELETED: ['read', 'write', 'delete']
};

// Tiempos límite para acciones (en horas)
const TIME_LIMITS = {
  EDIT_DOCUMENT: 24,
  DELETE_DOCUMENT: 72,
  RESTORE_DOCUMENT: 168 // 7 días
};

/**
 * Obtiene los permisos del usuario actual
 * @returns {Promise<Object>} Objeto con los permisos del usuario
 */
export const getUserPermissions = async () => {
  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error('No hay token de autenticación');
    }

    // Obtener información del usuario del token
    const userInfo = JSON.parse(atob(token.split('.')[1]));
    const { area, role } = userInfo;

    // Obtener permisos base según área y rol
    const basePermissions = PERMISSIONS_MAP[area]?.[role] || [];
    
    // Obtener permisos especiales según rol
    const specialPerms = SPECIAL_PERMISSIONS[role] || [];

    // Combinar todos los permisos
    const allPermissions = [...new Set([...basePermissions, ...specialPerms])];

    return {
      area,
      role,
      permissions: allPermissions
    };
  } catch (error) {
    console.error('Error al obtener permisos:', error);
    throw error;
  }
};

/**
 * Verifica si el usuario tiene un permiso específico
 * @param {string} permission - Permiso a verificar
 * @returns {Promise<boolean>} true si el usuario tiene el permiso
 */
export const hasPermission = async (permission) => {
  try {
    const { permissions } = await getUserPermissions();
    return permissions.includes(permission);
  } catch (error) {
    console.error('Error al verificar permiso:', error);
    return false;
  }
};

/**
 * Verifica si el usuario tiene todos los permisos especificados
 * @param {string[]} requiredPermissions - Lista de permisos requeridos
 * @returns {Promise<boolean>} true si el usuario tiene todos los permisos
 */
export const hasAllPermissions = async (requiredPermissions) => {
  try {
    const { permissions } = await getUserPermissions();
    return requiredPermissions.every(permission => permissions.includes(permission));
  } catch (error) {
    console.error('Error al verificar permisos:', error);
    return false;
  }
};

/**
 * Verifica si el usuario tiene al menos uno de los permisos especificados
 * @param {string[]} requiredPermissions - Lista de permisos requeridos
 * @returns {Promise<boolean>} true si el usuario tiene al menos un permiso
 */
export const hasAnyPermission = async (requiredPermissions) => {
  try {
    const { permissions } = await getUserPermissions();
    return requiredPermissions.some(permission => permissions.includes(permission));
  } catch (error) {
    console.error('Error al verificar permisos:', error);
    return false;
  }
};

/**
 * Verifica si el usuario tiene acceso a un área específica
 * @param {string} area - Área a verificar
 * @returns {Promise<boolean>} true si el usuario tiene acceso al área
 */
export const hasAreaAccess = async (area) => {
  try {
    const { permissions } = await getUserPermissions();
    return permissions.some(permission => 
      permission.startsWith(`manage_${area.toLowerCase()}`) || 
      permission === 'manage_all'
    );
  } catch (error) {
    console.error('Error al verificar acceso al área:', error);
    return false;
  }
};

/**
 * Verifica si el usuario tiene un rol específico
 * @param {string} role - Rol a verificar
 * @returns {Promise<boolean>} true si el usuario tiene el rol
 */
export const hasRole = async (role) => {
  try {
    const { role: userRole } = await getUserPermissions();
    return userRole === role;
  } catch (error) {
    console.error('Error al verificar rol:', error);
    return false;
  }
};

/**
 * Verifica si el usuario tiene un rol con privilegios superiores
 * @param {string} role - Rol a verificar
 * @returns {Promise<boolean>} true si el usuario tiene un rol superior
 */
export const hasHigherRole = async (role) => {
  try {
    const { role: userRole } = await getUserPermissions();
    const roleHierarchy = {
      ADMIN: 3,
      SUPERVISOR: 2,
      USER: 1
    };
    return roleHierarchy[userRole] > roleHierarchy[role];
  } catch (error) {
    console.error('Error al verificar jerarquía de rol:', error);
    return false;
  }
};

/**
 * Verifica permisos contextuales para un documento
 * @param {Object} document - Documento a verificar
 * @param {string} action - Acción a realizar
 * @returns {Promise<boolean>} true si el usuario tiene permiso para la acción
 */
export const checkDocumentPermission = async (document, action) => {
  try {
    const { area: userArea, role: userRole } = await getUserPermissions();
    
    // Verificar permisos por estado
    const statePermissions = DOCUMENT_STATES[document.estado] || [];
    if (!statePermissions.includes(action)) {
      return false;
    }

    // Verificar permisos por área
    if (document.area !== userArea && userRole !== 'ADMIN') {
      return false;
    }

    // Verificar permisos por tiempo
    const now = new Date();
    const documentDate = new Date(document.fechaCreacion);
    const hoursDiff = (now - documentDate) / (1000 * 60 * 60);

    switch (action) {
      case 'write':
        if (hoursDiff > TIME_LIMITS.EDIT_DOCUMENT && userRole !== 'ADMIN') {
          return false;
        }
        break;
      case 'delete':
        if (hoursDiff > TIME_LIMITS.DELETE_DOCUMENT && userRole !== 'ADMIN') {
          return false;
        }
        break;
      case 'restore':
        if (hoursDiff > TIME_LIMITS.RESTORE_DOCUMENT && userRole !== 'ADMIN') {
          return false;
        }
        break;
    }

    return true;
  } catch (error) {
    console.error('Error al verificar permisos del documento:', error);
    return false;
  }
};

/**
 * Verifica permisos contextuales para un recurso
 * @param {Object} resource - Recurso a verificar
 * @param {string} resourceType - Tipo de recurso
 * @param {string} action - Acción a realizar
 * @returns {Promise<boolean>} true si el usuario tiene permiso para la acción
 */
export const checkContextualPermission = async (resource, resourceType, action) => {
  try {
    const { area: userArea, role: userRole } = await getUserPermissions();

    // Verificar permisos por tipo de recurso
    switch (resourceType) {
      case 'DOCUMENTO':
        return checkDocumentPermission(resource, action);
      case 'USUARIO':
        // Solo administradores pueden gestionar usuarios
        return userRole === 'ADMIN';
      case 'AREA':
        // Solo administradores pueden gestionar áreas
        return userRole === 'ADMIN';
      default:
        return false;
    }
  } catch (error) {
    console.error('Error al verificar permisos contextuales:', error);
    return false;
  }
}; 