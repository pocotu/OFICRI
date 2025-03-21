/**
 * Middleware de manejo de errores
 * Implementa el manejo centralizado de errores
 */

const { logger } = require('../utils/logger');

/**
 * Middleware principal de manejo de errores
 */
const errorHandler = (err, req, res, next) => {
  // Log error
  logger.error('Error:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    ip: req.ip
  });

  // Determine status code
  const statusCode = err.statusCode || 500;

  // Send error response
  res.status(statusCode).json({
    error: {
      message: err.message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    }
  });
};

/**
 * Middleware para manejar errores de validación
 */
const validationErrorHandler = (err, req, res, next) => {
  if (err.name !== 'ValidationError') {
    return next(err);
  }

  logger.error('Error de validación:', {
    error: err.message,
    path: req.path,
    method: req.method,
    body: req.body,
    timestamp: new Date().toISOString()
  });

  res.status(400).json({
    error: 'Error de validación',
    details: err.message,
    timestamp: new Date().toISOString()
  });
};

/**
 * Middleware para manejar errores de autenticación
 */
const authErrorHandler = (err, req, res, next) => {
  if (err.name !== 'UnauthorizedError') {
    return next(err);
  }

  logger.error('Error de autenticación:', {
    error: err.message,
    path: req.path,
    method: req.method,
    ip: req.ip,
    timestamp: new Date().toISOString()
  });

  res.status(401).json({
    error: 'No autorizado',
    message: err.message,
    timestamp: new Date().toISOString()
  });
};

/**
 * Middleware para manejar errores de base de datos
 */
const dbErrorHandler = (err, req, res, next) => {
  if (!err.code || !err.code.startsWith('ER_')) {
    return next(err);
  }

  logger.error('Error de base de datos:', {
    error: err.message,
    code: err.code,
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  });

  // Manejar errores específicos de MySQL
  let message = 'Error de base de datos';
  let statusCode = 500;

  switch (err.code) {
    case 'ER_DUP_ENTRY':
      message = 'Registro duplicado';
      statusCode = 409;
      break;
    case 'ER_NO_REFERENCED_ROW':
      message = 'Referencia no válida';
      statusCode = 400;
      break;
    case 'ER_BAD_NULL_ERROR':
      message = 'Campo requerido no proporcionado';
      statusCode = 400;
      break;
    case 'ER_DATA_TOO_LONG':
      message = 'Datos demasiado largos';
      statusCode = 400;
      break;
    case 'ER_LOCK_WAIT_TIMEOUT':
      message = 'Timeout de bloqueo';
      statusCode = 503;
      break;
    case 'ER_DEADLOCK':
      message = 'Deadlock detectado';
      statusCode = 503;
      break;
  }

  res.status(statusCode).json({
    error: message,
    details: err.message,
    timestamp: new Date().toISOString()
  });
};

/**
 * Middleware para manejar errores de archivos
 */
const fileErrorHandler = (err, req, res, next) => {
  if (!err.code || !err.code.startsWith('E')) {
    return next(err);
  }

  logger.error('Error de archivo:', {
    error: err.message,
    code: err.code,
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  });

  // Manejar errores específicos de archivos
  let message = 'Error de archivo';
  let statusCode = 500;

  switch (err.code) {
    case 'ENOENT':
      message = 'Archivo no encontrado';
      statusCode = 404;
      break;
    case 'EACCES':
      message = 'Permiso denegado';
      statusCode = 403;
      break;
    case 'EEXIST':
      message = 'Archivo ya existe';
      statusCode = 409;
      break;
    case 'ENOSPC':
      message = 'Espacio insuficiente';
      statusCode = 507;
      break;
  }

  res.status(statusCode).json({
    error: message,
    details: err.message,
    timestamp: new Date().toISOString()
  });
};

/**
 * Middleware para manejar errores de Joi
 */
const joiErrorHandler = (err, req, res, next) => {
  if (!err.isJoi) {
    return next(err);
  }

  logger.error('Error de validación Joi:', {
    error: err.message,
    details: err.details,
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  });

  res.status(400).json({
    error: 'Error de validación',
    details: err.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message
    })),
    timestamp: new Date().toISOString()
  });
};

/**
 * Middleware para manejar errores de sintaxis JSON
 */
const jsonSyntaxErrorHandler = (err, req, res, next) => {
  if (err.name !== 'SyntaxError' || err.status !== 400) {
    return next(err);
  }

  logger.error('Error de sintaxis JSON:', {
    error: err.message,
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  });

  res.status(400).json({
    error: 'Error de sintaxis JSON',
    message: err.message,
    timestamp: new Date().toISOString()
  });
};

module.exports = {
  errorHandler,
  validationErrorHandler,
  authErrorHandler,
  dbErrorHandler,
  fileErrorHandler,
  joiErrorHandler,
  jsonSyntaxErrorHandler
}; 