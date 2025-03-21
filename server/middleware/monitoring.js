/**
 * Middleware de monitoreo
 * Implementa monitoreo de rendimiento y estado de la aplicación
 */

const os = require('os');
const { logger } = require('../utils/logger');

/**
 * Métricas de rendimiento
 */
const performanceMetrics = {
  requests: 0,
  errors: 0,
  responseTime: 0,
  activeConnections: 0,
  lastReset: Date.now()
};

/**
 * Middleware para monitorear peticiones
 */
const requestMonitor = (req, res, next) => {
  const start = Date.now();
  performanceMetrics.requests++;
  performanceMetrics.activeConnections++;

  res.on('finish', () => {
    const duration = Date.now() - start;
    performanceMetrics.responseTime += duration;
    performanceMetrics.activeConnections--;

    // Logging de métricas cada 100 peticiones
    if (performanceMetrics.requests % 100 === 0) {
      const avgResponseTime = performanceMetrics.responseTime / performanceMetrics.requests;
      logger.info('Métricas de rendimiento:', {
        totalRequests: performanceMetrics.requests,
        totalErrors: performanceMetrics.errors,
        averageResponseTime: avgResponseTime,
        activeConnections: performanceMetrics.activeConnections,
        timestamp: new Date().toISOString()
      });
    }
  });

  next();
};

/**
 * Middleware para monitorear errores
 */
const errorMonitor = (err, req, res, next) => {
  performanceMetrics.errors++;

  logger.error('Error en la aplicación:', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  });

  next(err);
};

/**
 * Middleware para monitorear recursos del sistema
 */
const systemMonitor = (req, res, next) => {
  const metrics = {
    cpu: {
      load: os.loadavg(),
      cores: os.cpus().length,
      usage: process.cpuUsage()
    },
    memory: {
      total: os.totalmem(),
      free: os.freemem(),
      used: os.totalmem() - os.freemem()
    },
    uptime: os.uptime(),
    timestamp: new Date().toISOString()
  };

  // Logging de métricas del sistema cada 5 minutos
  if (Date.now() - performanceMetrics.lastReset > 5 * 60 * 1000) {
    logger.info('Métricas del sistema:', metrics);
    performanceMetrics.lastReset = Date.now();
  }

  next();
};

/**
 * Middleware para monitorear conexiones
 */
const connectionMonitor = (req, res, next) => {
  const start = Date.now();

  res.on('close', () => {
    const duration = Date.now() - start;
    logger.info('Conexión cerrada:', {
      duration,
      ip: req.ip,
      method: req.method,
      path: req.path,
      status: res.statusCode,
      timestamp: new Date().toISOString()
    });
  });

  next();
};

/**
 * Middleware para monitorear memoria
 */
const memoryMonitor = (req, res, next) => {
  const used = process.memoryUsage();
  const threshold = 0.8; // 80% de uso de memoria

  if (used.heapUsed / used.heapTotal > threshold) {
    logger.warn('Alto uso de memoria:', {
      heapUsed: used.heapUsed,
      heapTotal: used.heapTotal,
      external: used.external,
      timestamp: new Date().toISOString()
    });
  }

  next();
};

/**
 * Middleware para monitorear tiempo de respuesta
 */
const responseTimeMonitor = (req, res, next) => {
  const start = Date.now();
  const threshold = 1000; // 1 segundo

  res.on('finish', () => {
    const duration = Date.now() - start;
    if (duration > threshold) {
      logger.warn('Respuesta lenta:', {
        duration,
        path: req.path,
        method: req.method,
        timestamp: new Date().toISOString()
      });
    }
  });

  next();
};

/**
 * Middleware para monitorear estado de la aplicación
 */
const healthCheck = (req, res, next) => {
  const health = {
    status: 'OK',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    cpu: process.cpuUsage(),
    activeConnections: performanceMetrics.activeConnections,
    timestamp: new Date().toISOString()
  };

  if (req.path === '/health') {
    return res.json(health);
  }

  next();
};

// Middleware de monitoreo básico
const monitoringMiddleware = (req, res, next) => {
  const start = Date.now();

  // Logging al finalizar la petición
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('Request completed', {
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration: `${duration}ms`
    });
  });

  next();
};

module.exports = {
  requestMonitor,
  errorMonitor,
  systemMonitor,
  connectionMonitor,
  memoryMonitor,
  responseTimeMonitor,
  healthCheck,
  monitoringMiddleware
}; 