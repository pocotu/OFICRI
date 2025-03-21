/**
 * Middleware de validación de permisos
 * Implementa validación de permisos y roles de usuario
 */

const { logger } = require('../utils/logger');

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
 * Middleware para validar permisos
 * @param {string[]} requiredPermissions - Permisos requeridos
 * @returns {Function} Middleware de validación de permisos
 */
const validatePermissions = (requiredPermissions) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Usuario no autenticado'
        });
      }

      const userRole = req.user.role;
      const userPermissions = req.user.permissions || DEFAULT_ROLE_PERMISSIONS[userRole] || [];

      // Verificar si el usuario tiene todos los permisos requeridos
      const hasAllPermissions = requiredPermissions.every(permission =>
        userPermissions.includes(permission)
      );

      if (!hasAllPermissions) {
        logger.warn('Acceso denegado por permisos insuficientes:', {
          user: req.user.id,
          role: userRole,
          requiredPermissions,
          userPermissions,
          path: req.path,
          method: req.method,
          timestamp: new Date().toISOString()
        });

        return res.status(403).json({
          success: false,
          message: 'No tiene los permisos necesarios'
        });
      }

      next();
    } catch (error) {
      logger.error('Error en validación de permisos:', {
        error: error.message,
        user: req.user ? req.user.id : null,
        path: req.path,
        method: req.method,
        timestamp: new Date().toISOString()
      });

      res.status(500).json({
        success: false,
        message: 'Error al validar permisos'
      });
    }
  };
};

/**
 * Middleware para validar roles
 * @param {string[]} allowedRoles - Roles permitidos
 * @returns {Function} Middleware de validación de roles
 */
const validateRoles = (allowedRoles) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Usuario no autenticado'
        });
      }

      const userRole = req.user.role;

      if (!allowedRoles.includes(userRole)) {
        logger.warn('Acceso denegado por rol no permitido:', {
          user: req.user.id,
          role: userRole,
          allowedRoles,
          path: req.path,
          method: req.method,
          timestamp: new Date().toISOString()
        });

        return res.status(403).json({
          success: false,
          message: 'No tiene el rol necesario'
        });
      }

      next();
    } catch (error) {
      logger.error('Error en validación de roles:', {
        error: error.message,
        user: req.user ? req.user.id : null,
        path: req.path,
        method: req.method,
        timestamp: new Date().toISOString()
      });

      res.status(500).json({
        success: false,
        message: 'Error al validar roles'
      });
    }
  };
};

/**
 * Middleware para validar permisos por recurso
 * @param {Object} resourcePermissions - Mapeo de recursos a permisos requeridos
 * @returns {Function} Middleware de validación de permisos por recurso
 */
const validateResourcePermissions = (resourcePermissions) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Usuario no autenticado'
        });
      }

      const resource = req.params.resource || req.baseUrl.split('/')[1];
      const method = req.method.toUpperCase();
      const requiredPermissions = resourcePermissions[resource]?.[method] || [];

      if (requiredPermissions.length === 0) {
        return next();
      }

      const userRole = req.user.role;
      const userPermissions = req.user.permissions || DEFAULT_ROLE_PERMISSIONS[userRole] || [];

      const hasAllPermissions = requiredPermissions.every(permission =>
        userPermissions.includes(permission)
      );

      if (!hasAllPermissions) {
        logger.warn('Acceso denegado a recurso:', {
          user: req.user.id,
          role: userRole,
          resource,
          method,
          requiredPermissions,
          userPermissions,
          path: req.path,
          timestamp: new Date().toISOString()
        });

        return res.status(403).json({
          success: false,
          message: 'No tiene los permisos necesarios para acceder a este recurso'
        });
      }

      next();
    } catch (error) {
      logger.error('Error en validación de permisos por recurso:', {
        error: error.message,
        user: req.user ? req.user.id : null,
        path: req.path,
        method: req.method,
        timestamp: new Date().toISOString()
      });

      res.status(500).json({
        success: false,
        message: 'Error al validar permisos del recurso'
      });
    }
  };
};

module.exports = {
  PERMISSION_TYPES,
  ROLE_TYPES,
  DEFAULT_ROLE_PERMISSIONS,
  validatePermissions,
  validateRoles,
  validateResourcePermissions
}; 