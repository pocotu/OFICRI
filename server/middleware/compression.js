/**
 * Middleware de compresión
 * Implementa compresión de respuestas HTTP para mejorar el rendimiento
 */

const compression = require('compression');
const { logger } = require('../utils/logger');

/**
 * Opciones de compresión
 */
const compressionOptions = {
  level: 6, // Nivel de compresión (0-9)
  threshold: 1024, // Tamaño mínimo para comprimir (1KB)
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  }
};

/**
 * Middleware de compresión
 */
const compressionMiddleware = compression(compressionOptions);

/**
 * Middleware para estadísticas de compresión
 */
const compressionStats = (req, res, next) => {
  const start = Date.now();
  const originalSize = res.getHeader('content-length');

  res.on('finish', () => {
    const duration = Date.now() - start;
    const compressedSize = res.getHeader('content-length');
    const compressionRatio = originalSize && compressedSize
      ? ((originalSize - compressedSize) / originalSize * 100).toFixed(2)
      : null;

    logger.info('Estadísticas de compresión:', {
      path: req.path,
      method: req.method,
      originalSize,
      compressedSize,
      compressionRatio: compressionRatio ? `${compressionRatio}%` : 'N/A',
      duration: `${duration}ms`,
      timestamp: new Date().toISOString()
    });
  });

  next();
};

/**
 * Middleware para forzar compresión en rutas específicas
 */
const forceCompression = (req, res, next) => {
  const forceCompressPaths = [
    '/api/documents',
    '/api/reports',
    '/api/statistics'
  ];

  if (forceCompressPaths.some(path => req.path.startsWith(path))) {
    res.setHeader('Cache-Control', 'no-transform');
    res.setHeader('Content-Encoding', 'gzip');
  }

  next();
};

/**
 * Middleware para compresión de archivos grandes
 */
const largeFileCompression = (req, res, next) => {
  const largeFileThreshold = 5 * 1024 * 1024; // 5MB
  const contentLength = parseInt(res.getHeader('content-length') || '0');

  if (contentLength > largeFileThreshold) {
    res.setHeader('Cache-Control', 'no-transform');
    res.setHeader('Content-Encoding', 'gzip');
  }

  next();
};

/**
 * Middleware para compresión de respuestas JSON
 */
const jsonCompression = (req, res, next) => {
  const contentType = res.getHeader('content-type');
  
  if (contentType && contentType.includes('application/json')) {
    res.setHeader('Cache-Control', 'no-transform');
    res.setHeader('Content-Encoding', 'gzip');
  }

  next();
};

module.exports = {
  compressionMiddleware,
  compressionStats,
  forceCompression,
  largeFileCompression,
  jsonCompression
}; 