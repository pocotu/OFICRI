/**
 * Middleware de logging
 * Implementa logging de peticiones HTTP, errores y métricas
 */

const { logger } = require('../utils/logger');

/**
 * Middleware para logging de peticiones HTTP
 */
const httpLogger = (req, res, next) => {
  const start = Date.now();

  // Logging de inicio de petición
  logger.info('Inicio de petición:', {
    method: req.method,
    path: req.path,
    query: req.query,
    ip: req.ip,
    userAgent: req.get('user-agent'),
    timestamp: new Date().toISOString()
  });

  // Interceptar respuesta
  res.on('finish', () => {
    const duration = Date.now() - start;
    const status = res.statusCode;

    // Logging de fin de petición
    logger.info('Fin de petición:', {
      method: req.method,
      path: req.path,
      status,
      duration,
      ip: req.ip,
      timestamp: new Date().toISOString()
    });

    // Logging de errores HTTP
    if (status >= 400) {
      logger.error('Error HTTP:', {
        method: req.method,
        path: req.path,
        status,
        duration,
        ip: req.ip,
        timestamp: new Date().toISOString()
      });
    }

    // Logging de peticiones lentas
    if (duration > 1000) {
      logger.warn('Petición lenta:', {
        method: req.method,
        path: req.path,
        duration,
        ip: req.ip,
        timestamp: new Date().toISOString()
      });
    }
  });

  next();
};

/**
 * Middleware para logging de errores
 */
const errorLogger = (err, req, res, next) => {
  logger.error('Error en la aplicación:', {
    error: err.message,
    stack: err.stack,
    method: req.method,
    path: req.path,
    query: req.query,
    body: req.body,
    ip: req.ip,
    userAgent: req.get('user-agent'),
    timestamp: new Date().toISOString()
  });

  next(err);
};

/**
 * Middleware para logging de autenticación
 */
const authLogger = (req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const status = res.statusCode;

    if (req.path.includes('/auth')) {
      logger.info('Intento de autenticación:', {
        method: req.method,
        path: req.path,
        status,
        duration,
        ip: req.ip,
        timestamp: new Date().toISOString()
      });

      if (status === 401) {
        logger.warn('Autenticación fallida:', {
          method: req.method,
          path: req.path,
          ip: req.ip,
          timestamp: new Date().toISOString()
        });
      }
    }
  });

  next();
};

/**
 * Middleware para logging de acceso a recursos
 */
const accessLogger = (req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const status = res.statusCode;

    // Logging de acceso a recursos sensibles
    if (req.path.includes('/api/admin') || req.path.includes('/api/users')) {
      logger.info('Acceso a recurso sensible:', {
        method: req.method,
        path: req.path,
        status,
        duration,
        ip: req.ip,
        user: req.user?.id,
        timestamp: new Date().toISOString()
      });

      if (status === 403) {
        logger.warn('Acceso denegado a recurso sensible:', {
          method: req.method,
          path: req.path,
          ip: req.ip,
          user: req.user?.id,
          timestamp: new Date().toISOString()
        });
      }
    }
  });

  next();
};

/**
 * Middleware para logging de operaciones de archivos
 */
const fileLogger = (req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const status = res.statusCode;

    if (req.file) {
      logger.info('Operación con archivo:', {
        method: req.method,
        path: req.path,
        status,
        duration,
        filename: req.file.filename,
        size: req.file.size,
        mimetype: req.file.mimetype,
        ip: req.ip,
        user: req.user?.id,
        timestamp: new Date().toISOString()
      });
    }
  });

  next();
};

module.exports = {
  httpLogger,
  errorLogger,
  authLogger,
  accessLogger,
  fileLogger
}; 