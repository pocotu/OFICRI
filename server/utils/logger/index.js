/**
 * Logger Utility
 * ISO/IEC 27001 compliant logging system
 * Provides centralized logging with security event tracking
 */

const winston = require('winston');
const path = require('path');
const fs = require('fs');

// Ensure logs directory exists
const logDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Define log levels with priorities
const levels = {
  error: 0,
  warn: 1,
  security: 2, // Custom level for security events
  info: 3,
  http: 4,
  debug: 5,
};

// Define custom colors for each level
const colors = {
  error: 'red',
  warn: 'yellow',
  security: 'magenta',
  info: 'green',
  http: 'cyan',
  debug: 'blue',
};

// Add colors to Winston
winston.addColors(colors);

// Define format for console output
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}${
      info.data ? ' ' + JSON.stringify(info.data, null, 2) : ''
    }${
      info.stack ? '\n' + info.stack : ''
    }`
  )
);

// Define format for file output (machine-readable JSON)
const fileFormat = winston.format.combine(
  winston.format.timestamp(),
  // Sanitize sensitive information
  winston.format((info) => {
    // Deep copy to avoid modifying the original
    const sanitizedInfo = JSON.parse(JSON.stringify(info));
    
    // List of sensitive fields to mask
    const sensitiveFields = ['password', 'token', 'secret', 'authorization', 'cookie'];
    
    // Function to mask sensitive data recursively
    const maskSensitiveData = (obj) => {
      if (!obj || typeof obj !== 'object') return;
      
      Object.keys(obj).forEach(key => {
        const lowerKey = key.toLowerCase();
        if (sensitiveFields.some(field => lowerKey.includes(field))) {
          obj[key] = '[REDACTED]';
        } else if (typeof obj[key] === 'object') {
          maskSensitiveData(obj[key]);
        }
      });
    };
    
    // Mask sensitive data in the message and any nested objects
    maskSensitiveData(sanitizedInfo);
    
    return sanitizedInfo;
  })(),
  winston.format.json()
);

// Get log level from environment variable or default to 'info'
const logLevel = process.env.LOG_LEVEL || 'info';

// Determine if logging to file and console should be enabled
const logToFile = process.env.LOG_TO_FILE === 'true';
const logToConsole = process.env.LOG_TO_CONSOLE !== 'false';

// Create transports array
const transports = [];

// Add console transport if enabled
if (logToConsole) {
  transports.push(
    new winston.transports.Console({
      level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
      format: consoleFormat,
    })
  );
}

// Add file transports if enabled
if (logToFile) {
  // Application logs
  transports.push(
    new winston.transports.File({
      filename: path.join(logDir, process.env.LOG_FILE || 'app.log'),
      level: logLevel,
      format: fileFormat,
      maxsize: process.env.LOG_MAX_SIZE || 10485760, // 10MB
      maxFiles: process.env.LOG_MAX_FILES || 7,
    })
  );
  
  // Error logs (separate file)
  transports.push(
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      format: fileFormat,
      maxsize: process.env.LOG_MAX_SIZE || 10485760, // 10MB
      maxFiles: process.env.LOG_MAX_FILES || 7,
    })
  );
  
  // Security logs (separate file with restricted access)
  transports.push(
    new winston.transports.File({
      filename: path.join(logDir, 'security.log'),
      level: 'security',
      format: fileFormat,
      maxsize: process.env.LOG_MAX_SIZE || 10485760, // 10MB
      maxFiles: process.env.LOG_MAX_FILES || 31, // Keep security logs longer
    })
  );
}

// Create Winston logger
const logger = winston.createLogger({
  levels,
  level: logLevel,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: { service: 'oficri-api' },
  transports,
  // Handle exceptions and rejections
  exceptionHandlers: [
    new winston.transports.File({ 
      filename: path.join(logDir, 'exceptions.log'),
      format: fileFormat
    })
  ],
  rejectionHandlers: [
    new winston.transports.File({ 
      filename: path.join(logDir, 'rejections.log'),
      format: fileFormat
    })
  ],
  exitOnError: false
});

// Create log functions
const log = (level, message, data = null, stack = null) => {
  logger.log({
    level,
    message,
    data,
    stack
  });
};

// Security events logger - ISO/IEC 27001 A.12.4 logging requirements
const logSecurityEvent = (eventType, data = {}) => {
  const securityEvent = {
    eventType,
    timestamp: new Date().toISOString(),
    ...data
  };
  
  logger.log({
    level: 'security',
    message: `Security event: ${eventType}`,
    data: securityEvent
  });
  
  // For critical security events, also log as error for visibility
  if (['AUTH_FAILURE', 'INTRUSION_DETECTED', 'PERMISSION_VIOLATION'].includes(eventType)) {
    logger.error(`Critical security event: ${eventType}`, securityEvent);
  }
  
  return securityEvent;
};

// HTTP request logger
const logHttpRequest = (req, res, responseTime) => {
  if (process.env.NODE_ENV !== 'test') { // Skip in test environment
    const logData = {
      method: req.method,
      url: req.originalUrl || req.url,
      status: res.statusCode,
      responseTime: responseTime,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('user-agent') || '',
      userId: req.user ? req.user.IDUsuario : null
    };
    
    logger.http(`HTTP ${req.method} ${req.originalUrl || req.url}`, logData);
  }
};

module.exports = {
  logger,
  logSecurityEvent,
  logHttpRequest,
  log
}; 