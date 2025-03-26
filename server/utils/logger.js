const winston = require('winston');
const path = require('path');

// Configuración de formatos
const formats = [
  winston.format.timestamp(),
  winston.format.json()
];

// Configuración de transports
const transports = [
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  })
];

// Agregar transport de archivo si se especifica en las variables de entorno
if (process.env.LOG_FILE) {
  transports.push(
    new winston.transports.File({
      filename: process.env.LOG_FILE,
      format: winston.format.combine(...formats)
    })
  );
}

// Crear logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(...formats),
  transports
});

/**
 * Función para registrar eventos de seguridad
 * @param {string} eventType - Tipo de evento de seguridad
 * @param {Object} details - Detalles del evento
 */
const logSecurityEvent = (eventType, details) => {
  logger.warn(`Security Event [${eventType}]`, { ...details, timestamp: new Date().toISOString() });
};

module.exports = { 
  logger,
  logSecurityEvent 
}; 