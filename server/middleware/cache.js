/**
 * Middleware de caché
 * Implementa el manejo de caché para mejorar el rendimiento
 */

const { logger } = require('../utils/logger');

// Caché en memoria simple
const cache = new Map();

// Tiempo de expiración por defecto: 5 minutos
const DEFAULT_TTL = 300000;

/**
 * Middleware de caché básico
 */
const cacheMiddleware = (req, res, next) => {
  // Solo cachear peticiones GET
  if (req.method !== 'GET') {
    return next();
  }

  const key = `cache:${req.originalUrl}`;

  // Verificar si existe en caché
  if (cache.has(key)) {
    logger.info('Cache hit:', key);
    res.setHeader('X-Cache', 'HIT');
    return res.json(cache.get(key));
  }

  res.setHeader('X-Cache', 'MISS');

  // Almacenar la respuesta en caché
  const originalJson = res.json;
  res.json = function(body) {
    cache.set(key, body);
    // Eliminar de la caché después de 5 minutos
    setTimeout(() => cache.delete(key), DEFAULT_TTL);
    originalJson.call(this, body);
  };

  next();
};

/**
 * Middleware para invalidar caché
 */
const invalidateCache = (pattern) => {
  return (req, res, next) => {
    try {
      let count = 0;
      
      // Eliminar todas las entradas que coincidan con el patrón
      for (const key of cache.keys()) {
        if (key.includes(pattern)) {
          cache.delete(key);
          count++;
        }
      }
      
      if (count > 0) {
        logger.info(`Caché invalidado: ${count} entradas eliminadas para ${pattern}`);
      }

      next();
    } catch (error) {
      logger.error('Error al invalidar caché:', error);
      next();
    }
  };
};

/**
 * Middleware para limpiar toda la caché
 */
const clearCache = (req, res, next) => {
  try {
    const count = cache.size;
    cache.clear();
    logger.info(`Caché limpiado: ${count} entradas eliminadas`);
    next();
  } catch (error) {
    logger.error('Error al limpiar caché:', error);
    next();
  }
};

/**
 * Middleware para caché con parámetros
 */
const parameterizedCache = (ttl = DEFAULT_TTL) => {
  return (req, res, next) => {
    // Solo cachear peticiones GET
    if (req.method !== 'GET') {
      return next();
    }

    // Crear clave única basada en URL y parámetros
    const params = new URLSearchParams(req.query).toString();
    const key = `cache:${req.path}${params ? `?${params}` : ''}`;

    // Verificar si existe en caché
    if (cache.has(key)) {
      logger.info('Cache hit con parámetros:', { key });
      res.setHeader('X-Cache', 'HIT');
      return res.json(cache.get(key));
    }

    res.setHeader('X-Cache', 'MISS');

    // Almacenar la respuesta en caché
    const originalJson = res.json;
    res.json = function(body) {
      cache.set(key, body);
      // Eliminar de la caché después del tiempo especificado
      setTimeout(() => cache.delete(key), ttl);
      originalJson.call(this, body);
    };

    next();
  };
};

module.exports = {
  cacheMiddleware,
  invalidateCache,
  clearCache,
  parameterizedCache
}; 