/**
 * Middleware de caché de base de datos
 * Implementa caché de consultas frecuentes a la base de datos
 */

const NodeCache = require('node-cache');
const { logger } = require('../utils/logger');

/**
 * Instancia de caché para base de datos
 */
const dbCache = new NodeCache({
  stdTTL: 300, // Tiempo de vida por defecto: 5 minutos
  checkperiod: 60, // Verificar elementos expirados cada minuto
  useClones: false // No clonar objetos para mejor rendimiento
});

/**
 * Middleware para caché de consultas
 * @param {string} key - Clave única para la consulta
 * @param {number} duration - Duración de la caché en segundos
 * @returns {Function} Middleware de caché de consultas
 */
const cacheQuery = (key, duration) => {
  return async (req, res, next) => {
    try {
      // Verificar si hay datos en caché
      const cachedData = dbCache.get(key);

      if (cachedData) {
        logger.info('DB Cache Hit:', {
          key,
          timestamp: new Date().toISOString()
        });

        return res.json(cachedData);
      }

      // Guardar la función original de res.json
      const originalJson = res.json;

      // Sobrescribir res.json para cachear la respuesta
      res.json = function(data) {
        dbCache.set(key, data, duration);
        
        logger.info('DB Cache Miss:', {
          key,
          duration,
          timestamp: new Date().toISOString()
        });

        return originalJson.call(this, data);
      };

      next();
    } catch (error) {
      logger.error('Error en caché de base de datos:', {
        error: error.message,
        key,
        timestamp: new Date().toISOString()
      });

      next();
    }
  };
};

/**
 * Middleware para invalidar caché de consultas
 * @param {string[]} patterns - Patrones de clave a invalidar
 * @returns {Function} Middleware de invalidación de caché
 */
const invalidateQueryCache = (patterns) => {
  return (req, res, next) => {
    try {
      const keys = dbCache.keys();
      let invalidatedCount = 0;

      keys.forEach(key => {
        if (patterns.some(pattern => key.includes(pattern))) {
          dbCache.del(key);
          invalidatedCount++;
        }
      });

      if (invalidatedCount > 0) {
        logger.info('DB Cache Invalidated:', {
          patterns,
          invalidatedCount,
          timestamp: new Date().toISOString()
        });
      }

      next();
    } catch (error) {
      logger.error('Error al invalidar caché de base de datos:', {
        error: error.message,
        patterns,
        timestamp: new Date().toISOString()
      });

      next();
    }
  };
};

/**
 * Función para limpiar toda la caché de base de datos
 */
const clearQueryCache = () => {
  try {
    dbCache.flushAll();
    logger.info('DB Cache Cleared:', {
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error al limpiar caché de base de datos:', {
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Middleware para caché de consultas con parámetros
 * @param {Function} keyGenerator - Función para generar clave única
 * @param {number} duration - Duración de la caché en segundos
 * @returns {Function} Middleware de caché de consultas con parámetros
 */
const cacheQueryWithParams = (keyGenerator, duration) => {
  return async (req, res, next) => {
    try {
      const key = keyGenerator(req);

      // Verificar si hay datos en caché
      const cachedData = dbCache.get(key);

      if (cachedData) {
        logger.info('DB Cache Hit (with params):', {
          key,
          params: req.params,
          query: req.query,
          timestamp: new Date().toISOString()
        });

        return res.json(cachedData);
      }

      // Guardar la función original de res.json
      const originalJson = res.json;

      // Sobrescribir res.json para cachear la respuesta
      res.json = function(data) {
        dbCache.set(key, data, duration);
        
        logger.info('DB Cache Miss (with params):', {
          key,
          params: req.params,
          query: req.query,
          duration,
          timestamp: new Date().toISOString()
        });

        return originalJson.call(this, data);
      };

      next();
    } catch (error) {
      logger.error('Error en caché de base de datos con parámetros:', {
        error: error.message,
        params: req.params,
        query: req.query,
        timestamp: new Date().toISOString()
      });

      next();
    }
  };
};

module.exports = {
  cacheQuery,
  invalidateQueryCache,
  clearQueryCache,
  cacheQueryWithParams
}; 