/**
 * Error handling middleware
 * Processes errors from routes and other middleware
 */

const { logger } = require('../utils/logger');

module.exports = (err, req, res, next) => {
  // Log the error
  logger.error('Error processing request', {
    path: req.path,
    method: req.method,
    error: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });

  // Determine status code
  const statusCode = err.statusCode || 500;

  // Return error response
  res.status(statusCode).json({
    success: false,
    message: statusCode === 500 && process.env.NODE_ENV === 'production' 
      ? 'Error interno del servidor' 
      : err.message,
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
}; 