/**
 * Middleware de manejo de caché
 * Implementa sistema de caché con Redis para optimizar respuestas
 */

const Redis = require('ioredis');
const { logger } = require('../utils/logger');

/**
 * Cliente Redis para caché
 */
const redisClient = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  }
});

/**
 * Tiempo de expiración por defecto (5 minutos)
 */
const DEFAULT_TTL = 300;

/**
 * Middleware para cachear respuestas
 */
const cacheResponse = (duration = DEFAULT_TTL) => {
  return async (req, res, next) => {
    try {
      // Solo cachear peticiones GET
      if (req.method !== 'GET') {
        return next();
      }

      const key = `cache:${req.originalUrl}`;

      // Intentar obtener respuesta cacheada
      const cachedResponse = await redisClient.get(key);
      
      if (cachedResponse) {
        logger.info('Cache hit:', {
          key,
          timestamp: new Date().toISOString()
        });

        return res.json(JSON.parse(cachedResponse));
      }

      // Si no hay caché, interceptar la respuesta
      const originalJson = res.json;
      res.json = function(data) {
        // Restaurar método original
        res.json = originalJson;

        // Cachear la respuesta
        redisClient.setex(key, duration, JSON.stringify(data))
          .catch(err => {
            logger.error('Error al cachear respuesta:', {
              error: err.message,
              key,
              timestamp: new Date().toISOString()
            });
          });

        // Enviar respuesta
        return originalJson.call(this, data);
      };

      next();
    } catch (error) {
      logger.error('Error en middleware de caché:', {
        error: error.message,
        timestamp: new Date().toISOString()
      });

      next();
    }
  };
};

/**
 * Middleware para invalidar caché
 */
const invalidateCache = (patterns) => {
  return async (req, res, next) => {
    try {
      if (!Array.isArray(patterns)) {
        patterns = [patterns];
      }

      const keys = await redisClient.keys('cache:*');
      let invalidatedCount = 0;

      for (const key of keys) {
        for (const pattern of patterns) {
          if (key.includes(pattern)) {
            await redisClient.del(key);
            invalidatedCount++;
            break;
          }
        }
      }

      logger.info('Caché invalidado:', {
        patterns,
        invalidatedCount,
        timestamp: new Date().toISOString()
      });

      next();
    } catch (error) {
      logger.error('Error al invalidar caché:', {
        error: error.message,
        patterns,
        timestamp: new Date().toISOString()
      });

      next();
    }
  };
};

/**
 * Middleware para limpiar caché completo
 */
const clearCache = async (req, res, next) => {
  try {
    const keys = await redisClient.keys('cache:*');
    if (keys.length > 0) {
      await redisClient.del(keys);
    }

    logger.info('Caché limpiado:', {
      keysCleared: keys.length,
      timestamp: new Date().toISOString()
    });

    next();
  } catch (error) {
    logger.error('Error al limpiar caché:', {
      error: error.message,
      timestamp: new Date().toISOString()
    });

    next();
  }
};

/**
 * Middleware para caché con parámetros
 */
const cacheWithParams = (duration = DEFAULT_TTL) => {
  return async (req, res, next) => {
    try {
      if (req.method !== 'GET') {
        return next();
      }

      // Crear clave única basada en URL y parámetros
      const params = new URLSearchParams(req.query).toString();
      const key = `cache:${req.path}${params ? `?${params}` : ''}`;

      const cachedResponse = await redisClient.get(key);
      
      if (cachedResponse) {
        logger.info('Cache hit con parámetros:', {
          key,
          params,
          timestamp: new Date().toISOString()
        });

        return res.json(JSON.parse(cachedResponse));
      }

      const originalJson = res.json;
      res.json = function(data) {
        res.json = originalJson;

        redisClient.setex(key, duration, JSON.stringify(data))
          .catch(err => {
            logger.error('Error al cachear respuesta con parámetros:', {
              error: err.message,
              key,
              params,
              timestamp: new Date().toISOString()
            });
          });

        return originalJson.call(this, data);
      };

      next();
    } catch (error) {
      logger.error('Error en middleware de caché con parámetros:', {
        error: error.message,
        timestamp: new Date().toISOString()
      });

      next();
    }
  };
};

module.exports = {
  cacheResponse,
  invalidateCache,
  clearCache,
  cacheWithParams
}; 