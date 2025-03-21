/**
 * Middleware de validación de sesión
 * Implementa validación y gestión de sesiones de usuario
 */

const session = require('express-session');
const RedisStore = require('connect-redis').default;
const Redis = require('ioredis');
const { logger } = require('../utils/logger');

/**
 * Configuración de Redis para sesiones
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
 * Configuración de sesión
 */
const sessionConfig = {
  store: new RedisStore({ client: redisClient }),
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 horas
  },
  name: 'sessionId',
  rolling: true
};

/**
 * Middleware para validar sesión activa
 */
const validateSession = (req, res, next) => {
  try {
    if (!req.session || !req.session.user) {
      return res.status(401).json({
        success: false,
        message: 'Sesión no válida o expirada'
      });
    }

    // Verificar si la sesión está activa en Redis
    redisClient.get(`session:${req.session.id}`, (err, data) => {
      if (err) {
        logger.error('Error al verificar sesión:', {
          error: err.message,
          sessionId: req.session.id,
          timestamp: new Date().toISOString()
        });

        return res.status(500).json({
          success: false,
          message: 'Error al verificar sesión'
        });
      }

      if (!data) {
        return res.status(401).json({
          success: false,
          message: 'Sesión expirada'
        });
      }

      next();
    });
  } catch (error) {
    logger.error('Error en validación de sesión:', {
      error: error.message,
      timestamp: new Date().toISOString()
    });

    res.status(500).json({
      success: false,
      message: 'Error al validar sesión'
    });
  }
};

/**
 * Middleware para regenerar ID de sesión
 */
const regenerateSession = (req, res, next) => {
  try {
    if (!req.session.regenerate) {
      return next();
    }

    req.session.regenerate((err) => {
      if (err) {
        logger.error('Error al regenerar sesión:', {
          error: err.message,
          timestamp: new Date().toISOString()
        });

        return res.status(500).json({
          success: false,
          message: 'Error al regenerar sesión'
        });
      }

      next();
    });
  } catch (error) {
    logger.error('Error en regeneración de sesión:', {
      error: error.message,
      timestamp: new Date().toISOString()
    });

    next();
  }
};

/**
 * Middleware para limpiar sesión
 */
const clearSession = (req, res, next) => {
  try {
    if (!req.session) {
      return next();
    }

    req.session.destroy((err) => {
      if (err) {
        logger.error('Error al limpiar sesión:', {
          error: err.message,
          sessionId: req.session.id,
          timestamp: new Date().toISOString()
        });

        return res.status(500).json({
          success: false,
          message: 'Error al limpiar sesión'
        });
      }

      res.clearCookie('sessionId');
      next();
    });
  } catch (error) {
    logger.error('Error en limpieza de sesión:', {
      error: error.message,
      timestamp: new Date().toISOString()
    });

    next();
  }
};

/**
 * Middleware para verificar múltiples sesiones
 */
const checkMultipleSessions = (req, res, next) => {
  try {
    if (!req.session || !req.session.user) {
      return next();
    }

    const userId = req.session.user.id;
    const currentSessionId = req.session.id;

    // Obtener todas las sesiones del usuario
    redisClient.keys(`session:*`, (err, keys) => {
      if (err) {
        logger.error('Error al verificar múltiples sesiones:', {
          error: err.message,
          userId,
          timestamp: new Date().toISOString()
        });

        return next();
      }

      let userSessions = 0;

      // Contar sesiones activas del usuario
      keys.forEach(key => {
        redisClient.get(key, (err, data) => {
          if (err) return;

          try {
            const sessionData = JSON.parse(data);
            if (sessionData.user && sessionData.user.id === userId) {
              userSessions++;
            }
          } catch (error) {
            logger.error('Error al parsear sesión:', {
              error: error.message,
              key,
              timestamp: new Date().toISOString()
            });
          }
        });
      });

      // Si hay más de una sesión activa, invalidar la actual
      if (userSessions > 1) {
        logger.warn('Múltiples sesiones detectadas:', {
          userId,
          sessionCount: userSessions,
          currentSessionId,
          timestamp: new Date().toISOString()
        });

        return res.status(401).json({
          success: false,
          message: 'Sesión inválida por múltiples accesos'
        });
      }

      next();
    });
  } catch (error) {
    logger.error('Error en verificación de múltiples sesiones:', {
      error: error.message,
      timestamp: new Date().toISOString()
    });

    next();
  }
};

module.exports = {
  sessionConfig,
  validateSession,
  regenerateSession,
  clearSession,
  checkMultipleSessions
}; 