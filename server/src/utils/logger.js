/**
 * Logger centralizado para la aplicación
 * Proporciona funciones para registrar mensajes de diferentes niveles
 */

const winston = require('winston');
const path = require('path');

// Configuración del logger
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
        winston.format.timestamp({
            format: 'YYYY-MM-DD HH:mm:ss'
        }),
        winston.format.errors({ stack: true }),
        winston.format.splat(),
        winston.format.json()
    ),
    defaultMeta: { service: 'oficri-api' },
    transports: []
});

// Si estamos en producción, escribir a un archivo
if (process.env.NODE_ENV === 'production') {
    logger.add(new winston.transports.File({
        filename: path.join(__dirname, '../../../logs/error.log'),
        level: 'error'
    }));
    logger.add(new winston.transports.File({
        filename: path.join(__dirname, '../../../logs/combined.log')
    }));
}

// Si no estamos en producción, escribir a la consola
if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
        )
    }));
}

// Exportar funciones específicas para cada nivel de log
module.exports = {
    error: (message, meta = {}) => logger.error(message, meta),
    warn: (message, meta = {}) => logger.warn(message, meta),
    info: (message, meta = {}) => logger.info(message, meta),
    debug: (message, meta = {}) => logger.debug(message, meta),
    // Función para registrar errores con stack trace
    logError: (message, error) => {
        logger.error(`${message}: ${error.message}`, {
            stack: error.stack,
            ...error
        });
    }
}; 