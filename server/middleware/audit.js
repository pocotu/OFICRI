/**
 * Middleware de auditoría
 * Implementa registro de acciones de usuarios para auditoría
 */

const { logger } = require('../utils/logger');

/**
 * Tipos de acciones auditables
 */
const AUDIT_TYPES = {
  CREATE: 'CREATE',
  READ: 'READ',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE',
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
  FAILED_LOGIN: 'FAILED_LOGIN',
  PASSWORD_CHANGE: 'PASSWORD_CHANGE',
  PERMISSION_CHANGE: 'PERMISSION_CHANGE',
  ROLE_CHANGE: 'ROLE_CHANGE'
};

/**
 * Middleware para registrar acciones de auditoría
 * @param {string} action - Tipo de acción a auditar
 * @param {string} resource - Recurso afectado
 * @returns {Function} Middleware de auditoría
 */
const auditLog = (action, resource) => {
  return (req, res, next) => {
    try {
      const auditData = {
        action,
        resource,
        timestamp: new Date().toISOString(),
        user: req.user ? {
          id: req.user.id,
          username: req.user.username,
          role: req.user.role
        } : null,
        ip: req.ip,
        userAgent: req.get('user-agent'),
        method: req.method,
        path: req.path,
        query: req.query,
        body: req.body,
        statusCode: res.statusCode
      };

      // Registrar acción de auditoría
      logger.info('Audit Log:', auditData);

      // Almacenar en base de datos si es necesario
      // Aquí se podría implementar la lógica para guardar en una tabla de auditoría

      next();
    } catch (error) {
      logger.error('Error en auditoría:', {
        error: error.message,
        action,
        resource,
        timestamp: new Date().toISOString()
      });

      next();
    }
  };
};

/**
 * Middleware para registrar intentos de acceso fallidos
 */
const failedAccessAudit = (req, res, next) => {
  try {
    const auditData = {
      action: AUDIT_TYPES.FAILED_LOGIN,
      resource: 'auth',
      timestamp: new Date().toISOString(),
      ip: req.ip,
      userAgent: req.get('user-agent'),
      method: req.method,
      path: req.path,
      body: {
        username: req.body.username
      },
      statusCode: res.statusCode
    };

    // Registrar intento fallido
    logger.warn('Failed Access Attempt:', auditData);

    // Almacenar en base de datos si es necesario
    // Aquí se podría implementar la lógica para guardar en una tabla de auditoría

    next();
  } catch (error) {
    logger.error('Error en auditoría de acceso fallido:', {
      error: error.message,
      timestamp: new Date().toISOString()
    });

    next();
  }
};

/**
 * Middleware para registrar cambios de permisos
 */
const permissionChangeAudit = (req, res, next) => {
  try {
    const auditData = {
      action: AUDIT_TYPES.PERMISSION_CHANGE,
      resource: 'permissions',
      timestamp: new Date().toISOString(),
      user: req.user ? {
        id: req.user.id,
        username: req.user.username,
        role: req.user.role
      } : null,
      ip: req.ip,
      userAgent: req.get('user-agent'),
      method: req.method,
      path: req.path,
      body: req.body,
      statusCode: res.statusCode
    };

    // Registrar cambio de permisos
    logger.info('Permission Change:', auditData);

    // Almacenar en base de datos si es necesario
    // Aquí se podría implementar la lógica para guardar en una tabla de auditoría

    next();
  } catch (error) {
    logger.error('Error en auditoría de cambios de permisos:', {
      error: error.message,
      timestamp: new Date().toISOString()
    });

    next();
  }
};

/**
 * Middleware para registrar cambios de roles
 */
const roleChangeAudit = (req, res, next) => {
  try {
    const auditData = {
      action: AUDIT_TYPES.ROLE_CHANGE,
      resource: 'roles',
      timestamp: new Date().toISOString(),
      user: req.user ? {
        id: req.user.id,
        username: req.user.username,
        role: req.user.role
      } : null,
      ip: req.ip,
      userAgent: req.get('user-agent'),
      method: req.method,
      path: req.path,
      body: req.body,
      statusCode: res.statusCode
    };

    // Registrar cambio de rol
    logger.info('Role Change:', auditData);

    // Almacenar en base de datos si es necesario
    // Aquí se podría implementar la lógica para guardar en una tabla de auditoría

    next();
  } catch (error) {
    logger.error('Error en auditoría de cambios de roles:', {
      error: error.message,
      timestamp: new Date().toISOString()
    });

    next();
  }
};

module.exports = {
  AUDIT_TYPES,
  auditLog,
  failedAccessAudit,
  permissionChangeAudit,
  roleChangeAudit
}; 