/**
 * Middleware de sesiones
 * Implementa el manejo de sesiones de usuario
 */

const session = require('express-session');
const { logger } = require('../utils/logger');

/**
 * Configuración de sesión
 */
const sessionConfig = {
  secret: process.env.SESSION_SECRET || 'test-secret-key',
  name: process.env.SESSION_COOKIE_NAME || 'sessionId',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.SESSION_COOKIE_SECURE === 'true',
    httpOnly: process.env.SESSION_COOKIE_HTTPONLY === 'true',
    sameSite: process.env.SESSION_COOKIE_SAMESITE || 'strict',
    maxAge: 24 * 60 * 60 * 1000 // 24 horas
  }
};

/**
 * Middleware de sesión
 */
const sessionMiddleware = session(sessionConfig);

/**
 * Middleware para validar sesión
 */
const validateSession = (req, res, next) => {
  if (!req.session || !req.session.userId) {
    logger.warn('Sesión inválida:', {
      ip: req.ip,
      path: req.path,
      method: req.method,
      timestamp: new Date().toISOString()
    });

    return res.status(401).json({
      error: 'Sesión inválida o expirada',
      timestamp: new Date().toISOString()
    });
  }

  next();
};

/**
 * Middleware para regenerar ID de sesión
 */
const regenerateSession = (req, res, next) => {
  if (!req.session.regenerate) {
    return next();
  }

  req.session.regenerate((err) => {
    if (err) {
      logger.error('Error al regenerar sesión:', {
        error: err.message,
        userId: req.session.userId,
        timestamp: new Date().toISOString()
      });
      return next(err);
    }

    logger.info('Sesión regenerada:', {
      userId: req.session.userId,
      timestamp: new Date().toISOString()
    });

    next();
  });
};

/**
 * Middleware para limpiar sesión
 */
const clearSession = (req, res, next) => {
  if (!req.session.destroy) {
    return next();
  }

  req.session.destroy((err) => {
    if (err) {
      logger.error('Error al limpiar sesión:', {
        error: err.message,
        userId: req.session.userId,
        timestamp: new Date().toISOString()
      });
      return next(err);
    }

    res.clearCookie('sessionId');

    logger.info('Sesión limpiada:', {
      timestamp: new Date().toISOString()
    });

    next();
  });
};

/**
 * Middleware para verificar expiración de sesión
 */
const checkSessionExpiration = (req, res, next) => {
  if (!req.session.userId || !req.session.lastActivity) {
    return next();
  }

  const sessionTimeout = 30 * 60 * 1000; // 30 minutos
  const now = Date.now();

  if (now - req.session.lastActivity > sessionTimeout) {
    logger.warn('Sesión expirada:', {
      userId: req.session.userId,
      lastActivity: new Date(req.session.lastActivity).toISOString(),
      timestamp: new Date().toISOString()
    });

    req.session.destroy((err) => {
      if (err) {
        logger.error('Error al destruir sesión expirada:', {
          error: err.message,
          userId: req.session.userId,
          timestamp: new Date().toISOString()
        });
      }
    });

    return res.status(401).json({
      error: 'Sesión expirada',
      timestamp: new Date().toISOString()
    });
  }

  next();
};

module.exports = sessionMiddleware; 