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

module.exports = { logger }; 