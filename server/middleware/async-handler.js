/**
 * Middleware para manejar errores asíncronos
 * Elimina la necesidad de try/catch en controladores
 */

const { logger } = require('../utils/logger');

/**
 * Envuelve una función asíncrona para manejar errores automáticamente
 * @param {Function} fn - Función asíncrona a envolver
 * @returns {Function} Función envuelta con manejo de errores
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch((error) => {
      logger.error('Error asíncrono no manejado:', {
        error: error.message,
        stack: error.stack,
        path: req.path,
        method: req.method,
        ip: req.ip,
        timestamp: new Date().toISOString()
      });

      // Determinar el código de estado HTTP apropiado
      let statusCode = 500;
      let message = 'Error interno del servidor';

      if (error.name === 'ValidationError') {
        statusCode = 400;
        message = 'Error de validación';
      } else if (error.name === 'UnauthorizedError') {
        statusCode = 401;
        message = 'No autorizado';
      } else if (error.name === 'ForbiddenError') {
        statusCode = 403;
        message = 'Acceso denegado';
      } else if (error.name === 'NotFoundError') {
        statusCode = 404;
        message = 'Recurso no encontrado';
      } else if (error.name === 'ConflictError') {
        statusCode = 409;
        message = 'Conflicto de recursos';
      }

      res.status(statusCode).json({
        success: false,
        message,
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    });
  };
};

/**
 * Envuelve múltiples funciones asíncronas para manejar errores automáticamente
 * @param {Array<Function>} fns - Array de funciones asíncronas a envolver
 * @returns {Array<Function>} Array de funciones envueltas con manejo de errores
 */
const asyncHandlers = (fns) => {
  return fns.map(fn => asyncHandler(fn));
};

/**
 * Middleware para manejar errores de base de datos
 */
const dbErrorHandler = (error, req, res, next) => {
  logger.error('Error de base de datos:', {
    error: error.message,
    code: error.code,
    path: req.path,
    method: req.method,
    ip: req.ip,
    timestamp: new Date().toISOString()
  });

  // Manejar errores específicos de MySQL
  if (error.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({
      success: false,
      message: 'El registro ya existe'
    });
  }

  if (error.code === 'ER_NO_REFERENCED_ROW') {
    return res.status(400).json({
      success: false,
      message: 'Referencia a registro inexistente'
    });
  }

  if (error.code === 'ER_BAD_NULL_ERROR') {
    return res.status(400).json({
      success: false,
      message: 'Campo requerido no proporcionado'
    });
  }

  next(error);
};

/**
 * Middleware para manejar errores de validación de Joi
 */
const joiErrorHandler = (error, req, res, next) => {
  if (error.isJoi) {
    logger.warn('Error de validación Joi:', {
      error: error.message,
      path: req.path,
      method: req.method,
      ip: req.ip,
      timestamp: new Date().toISOString()
    });

    return res.status(400).json({
      success: false,
      message: 'Error de validación',
      errors: error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }))
    });
  }

  next(error);
};

module.exports = {
  asyncHandler,
  asyncHandlers,
  dbErrorHandler,
  joiErrorHandler
}; 