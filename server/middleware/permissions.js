/**
 * Middleware de validación de permisos
 * Implementa validación de permisos y roles de usuario
 */

const { logger } = require('../utils/logger');
const { logSecurityEvent } = require('../utils/logger/index');

/**
 * Tipos de permisos
 */
const PERMISSION_TYPES = {
  CREATE: 'CREATE',
  READ: 'READ',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE',
  MANAGE: 'MANAGE',
  APPROVE: 'APPROVE',
  REJECT: 'REJECT',
  ASSIGN: 'ASSIGN',
  VIEW: 'VIEW'
};

/**
 * Tipos de roles
 */
const ROLE_TYPES = {
  ADMIN: 'ADMIN',
  MANAGER: 'MANAGER',
  SUPERVISOR: 'SUPERVISOR',
  USER: 'USER',
  GUEST: 'GUEST'
};

/**
 * Mapeo de roles a permisos por defecto
 */
const DEFAULT_ROLE_PERMISSIONS = {
  [ROLE_TYPES.ADMIN]: [
    PERMISSION_TYPES.CREATE,
    PERMISSION_TYPES.READ,
    PERMISSION_TYPES.UPDATE,
    PERMISSION_TYPES.DELETE,
    PERMISSION_TYPES.MANAGE,
    PERMISSION_TYPES.APPROVE,
    PERMISSION_TYPES.REJECT,
    PERMISSION_TYPES.ASSIGN,
    PERMISSION_TYPES.VIEW
  ],
  [ROLE_TYPES.MANAGER]: [
    PERMISSION_TYPES.CREATE,
    PERMISSION_TYPES.READ,
    PERMISSION_TYPES.UPDATE,
    PERMISSION_TYPES.APPROVE,
    PERMISSION_TYPES.REJECT,
    PERMISSION_TYPES.ASSIGN,
    PERMISSION_TYPES.VIEW
  ],
  [ROLE_TYPES.SUPERVISOR]: [
    PERMISSION_TYPES.CREATE,
    PERMISSION_TYPES.READ,
    PERMISSION_TYPES.UPDATE,
    PERMISSION_TYPES.APPROVE,
    PERMISSION_TYPES.REJECT,
    PERMISSION_TYPES.VIEW
  ],
  [ROLE_TYPES.USER]: [
    PERMISSION_TYPES.CREATE,
    PERMISSION_TYPES.READ,
    PERMISSION_TYPES.UPDATE,
    PERMISSION_TYPES.VIEW
  ],
  [ROLE_TYPES.GUEST]: [
    PERMISSION_TYPES.READ,
    PERMISSION_TYPES.VIEW
  ]
};

/**
 * Verifica si el usuario tiene un permiso específico basado en bits
 * @param {Number} userPermisos - Valor entero que contiene todos los permisos del usuario como bits
 * @param {Number} requiredPermission - Bit de permiso requerido
 * @returns {Boolean} - true si tiene el permiso, false en caso contrario
 */
const checkPermissions = (userPermisos, requiredPermission) => {
  return (userPermisos & requiredPermission) === requiredPermission;
};

/**
 * Middleware para verificar si el usuario tiene un permiso específico
 * @param {Number} requiredPermission - Bit de permiso requerido
 */
const requirePermission = (requiredPermission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'No autenticado'
      });
    }

    if (!checkPermissions(req.user.permisos, requiredPermission)) {
      // Registrar intento de acceso no autorizado
      logSecurityEvent('SECURITY_UNAUTHORIZED_ACCESS_ATTEMPT', `Usuario ${req.user.codigoCIP} intentó acceder a recurso restringido`, {
        endpoint: req.originalUrl,
        method: req.method,
        permisoRequerido: requiredPermission,
        permisosUsuario: req.user.permisos
      });
      
      return res.status(403).json({
        success: false,
        message: 'No tiene permisos suficientes para realizar esta acción'
      });
    }
    
    next();
  };
};

/**
 * Middleware para verificar si el usuario tiene permiso de administrador (bit 7, valor 128)
 */
const checkAdminPermission = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'No autenticado'
    });
  }

  // Bit 7 = Administrar (128)
  if (!checkPermissions(req.user.permisos, 128)) {
    // Registrar intento de acceso administrativo no autorizado
    logSecurityEvent('SECURITY_ADMIN_ACCESS_ATTEMPT', `Usuario ${req.user.codigoCIP} intentó acceder a funcionalidad administrativa`, {
      endpoint: req.originalUrl,
      method: req.method,
      permisosUsuario: req.user.permisos
    });
    
    return res.status(403).json({
      success: false,
      message: 'Se requiere permiso de administrador para acceder a esta funcionalidad'
    });
  }
  
  next();
};

/**
 * Middleware para verificar si el usuario tiene permiso de auditoría (bit 5, valor 32)
 */
const checkAuditPermission = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'No autenticado'
    });
  }

  // Bit 5 = Auditar (32)
  if (!checkPermissions(req.user.permisos, 32)) {
    // Registrar intento de acceso a auditoría no autorizado
    logSecurityEvent('SECURITY_AUDIT_ACCESS_ATTEMPT', `Usuario ${req.user.codigoCIP} intentó acceder a funcionalidad de auditoría`, {
      endpoint: req.originalUrl,
      method: req.method,
      permisosUsuario: req.user.permisos
    });
    
    return res.status(403).json({
      success: false,
      message: 'Se requiere permiso de auditoría para acceder a esta funcionalidad'
    });
  }
  
  next();
};

/**
 * Middleware para verificar si el usuario tiene permiso de exportación (bit 6, valor 64)
 */
const checkExportPermission = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'No autenticado'
    });
  }

  // Bit 6 = Exportar (64)
  if (!checkPermissions(req.user.permisos, 64)) {
    // Registrar intento de acceso a exportación no autorizado
    logSecurityEvent('SECURITY_EXPORT_ACCESS_ATTEMPT', `Usuario ${req.user.codigoCIP} intentó acceder a funcionalidad de exportación`, {
      endpoint: req.originalUrl,
      method: req.method,
      permisosUsuario: req.user.permisos
    });
    
    return res.status(403).json({
      success: false,
      message: 'Se requiere permiso de exportación para acceder a esta funcionalidad'
    });
  }
  
  next();
};

/**
 * Middleware para verificar si el usuario tiene permiso para ver (bit 3, valor 8)
 */
const checkViewPermission = (req, res, next) => {
      if (!req.user) {
        return res.status(401).json({
          success: false,
      message: 'No autenticado'
        });
      }

  // Bit 3 = Ver (8)
  if (!checkPermissions(req.user.permisos, 8)) {
    // Registrar intento de acceso a visualización no autorizado
    logSecurityEvent('SECURITY_VIEW_ACCESS_ATTEMPT', `Usuario ${req.user.codigoCIP} intentó acceder a funcionalidad de visualización`, {
      endpoint: req.originalUrl,
      method: req.method,
      permisosUsuario: req.user.permisos
    });
    
    return res.status(403).json({
      success: false,
      message: 'Se requiere permiso de visualización para acceder a esta funcionalidad'
    });
  }
  
  next();
};

/**
 * Middleware para verificar si el usuario tiene permiso para crear (bit 0, valor 1)
 */
const checkCreatePermission = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'No autenticado'
    });
  }

  // Bit 0 = Crear (1)
  if (!checkPermissions(req.user.permisos, 1)) {
    // Registrar intento de creación no autorizado
    logSecurityEvent('SECURITY_CREATE_ACCESS_ATTEMPT', `Usuario ${req.user.codigoCIP} intentó acceder a funcionalidad de creación`, {
      endpoint: req.originalUrl,
      method: req.method,
      permisosUsuario: req.user.permisos
    });
    
    return res.status(403).json({
      success: false,
      message: 'Se requiere permiso de creación para acceder a esta funcionalidad'
    });
  }
  
  next();
};

/**
 * Middleware para verificar si el usuario tiene permiso para editar (bit 1, valor 2)
 */
const checkEditPermission = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'No autenticado'
    });
  }

  // Bit 1 = Editar (2)
  if (!checkPermissions(req.user.permisos, 2)) {
    // Registrar intento de edición no autorizado
    logSecurityEvent('SECURITY_EDIT_ACCESS_ATTEMPT', `Usuario ${req.user.codigoCIP} intentó acceder a funcionalidad de edición`, {
      endpoint: req.originalUrl,
          method: req.method,
      permisosUsuario: req.user.permisos
        });

        return res.status(403).json({
          success: false,
      message: 'Se requiere permiso de edición para acceder a esta funcionalidad'
        });
      }

      next();
};

/**
 * Middleware para verificar si el usuario tiene permiso para eliminar (bit 2, valor 4)
 */
const checkDeletePermission = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'No autenticado'
    });
  }

  // Bit 2 = Eliminar (4)
  if (!checkPermissions(req.user.permisos, 4)) {
    // Registrar intento de eliminación no autorizado
    logSecurityEvent('SECURITY_DELETE_ACCESS_ATTEMPT', `Usuario ${req.user.codigoCIP} intentó acceder a funcionalidad de eliminación`, {
      endpoint: req.originalUrl,
        method: req.method,
      permisosUsuario: req.user.permisos
      });

    return res.status(403).json({
        success: false,
      message: 'Se requiere permiso de eliminación para acceder a esta funcionalidad'
    });
  }
  
  next();
};

/**
 * Middleware para verificar si el usuario tiene permiso para derivar (bit 4, valor 16)
 */
const checkDerivationPermission = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'No autenticado'
    });
  }

  // Bit 4 = Derivar (16)
  if (!checkPermissions(req.user.permisos, 16)) {
    // Registrar intento de derivación no autorizado
    logSecurityEvent('SECURITY_DERIVATION_ACCESS_ATTEMPT', `Usuario ${req.user.codigoCIP} intentó acceder a funcionalidad de derivación`, {
      endpoint: req.originalUrl,
      method: req.method,
      permisosUsuario: req.user.permisos
    });
    
    return res.status(403).json({
      success: false,
      message: 'Se requiere permiso de derivación para acceder a esta funcionalidad'
    });
  }
  
  next();
};

/**
 * Middleware para verificar permisos contextuales basados en lógica específica
 * @param {Object} options - Opciones de configuración
 * @param {String} options.recurso - Tipo de recurso (documento, usuario, etc)
 * @param {String} options.accion - Tipo de acción (ver, editar, eliminar, etc)
 */
const checkContextualPermission = (options) => {
  return async (req, res, next) => {
      if (!req.user) {
        return res.status(401).json({
          success: false,
        message: 'No autenticado'
        });
      }

    try {
      // Implementar lógica para verificar permisos contextuales desde la base de datos
      // Esta es una implementación simplificada. En producción, debería consultar
      // a la tabla PermisoContextual con las condiciones específicas.
      
      // Por ahora, simplemente usamos los permisos globales como fallback
      const { recurso, accion } = options;
      let bitPermiso = 0;
      
      // Mapear acción a bit de permiso
      switch (accion.toUpperCase()) {
        case 'CREAR':
          bitPermiso = 1; // Bit 0
          break;
        case 'EDITAR':
          bitPermiso = 2; // Bit 1
          break;
        case 'ELIMINAR':
          bitPermiso = 4; // Bit 2
          break;
        case 'VER':
          bitPermiso = 8; // Bit 3
          break;
        case 'DERIVAR':
          bitPermiso = 16; // Bit 4
          break;
        case 'AUDITAR':
          bitPermiso = 32; // Bit 5
          break;
        case 'EXPORTAR':
          bitPermiso = 64; // Bit 6
          break;
        case 'ADMINISTRAR':
          bitPermiso = 128; // Bit 7
          break;
        default:
          bitPermiso = 255; // Todos los permisos (caso improbable)
      }
      
      if (!checkPermissions(req.user.permisos, bitPermiso)) {
        // Registrar intento de acceso contextual no autorizado
        logSecurityEvent('SECURITY_CONTEXTUAL_ACCESS_ATTEMPT', 
          `Usuario ${req.user.codigoCIP} intentó ${accion} ${recurso} sin permiso`, {
          endpoint: req.originalUrl,
          method: req.method,
          permisosUsuario: req.user.permisos,
          recurso,
          accion
        });

        return res.status(403).json({
          success: false,
          message: `No tiene permisos para ${accion} ${recurso}`
        });
      }

      next();
    } catch (error) {
      console.error('Error al verificar permisos contextuales:', error);
      return res.status(500).json({
        success: false,
        message: 'Error al verificar permisos'
      });
    }
  };
};

/**
 * Verifica si un usuario es propietario de un recurso
 * @param {Function} getOwnerId - Función que recupera el ID del propietario del recurso
 */
const checkOwnership = (getOwnerId) => {
  return async (req, res, next) => {
      if (!req.user) {
        return res.status(401).json({
          success: false,
        message: 'No autenticado'
        });
      }

    try {
      const ownerId = await getOwnerId(req);
      
      if (req.user.id !== ownerId && !checkPermissions(req.user.permisos, 128)) {
        // Si no es propietario ni administrador
        logSecurityEvent('SECURITY_OWNERSHIP_VIOLATION', 
          `Usuario ${req.user.codigoCIP} intentó acceder a recurso ajeno`, {
          endpoint: req.originalUrl,
          method: req.method,
          usuarioId: req.user.id,
          propietarioId: ownerId
        });

        return res.status(403).json({
          success: false,
          message: 'Solo puede acceder a sus propios recursos'
        });
      }

      next();
    } catch (error) {
      console.error('Error al verificar propiedad:', error);
      return res.status(500).json({
        success: false,
        message: 'Error al verificar propiedad del recurso'
      });
    }
  };
};

module.exports = {
  PERMISSION_TYPES,
  ROLE_TYPES,
  DEFAULT_ROLE_PERMISSIONS,
  checkPermissions,
  requirePermission,
  checkAdminPermission,
  checkAuditPermission,
  checkExportPermission,
  checkViewPermission,
  checkCreatePermission,
  checkEditPermission,
  checkDeletePermission,
  checkDerivationPermission,
  checkContextualPermission,
  checkOwnership
}; 