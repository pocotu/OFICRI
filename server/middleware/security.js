/**
 * Middleware de seguridad
 * Implementa medidas de seguridad y protección contra ataques comunes
 */

const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const xss = require('xss-clean');
const hpp = require('hpp');
const cors = require('cors');
const { logger } = require('../utils/logger');

/**
 * Configuración de CORS
 */
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 86400 // 24 horas
};

/**
 * Configuración de rate limiting
 */
const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // límite de 100 peticiones por ventana
  message: {
    success: false,
    message: 'Demasiadas peticiones, por favor intente más tarde'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn('Rate limit excedido:', {
      ip: req.ip,
      path: req.path,
      method: req.method,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Configuración de rate limiting para autenticación
 */
const authRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 5, // límite de 5 intentos por hora
  message: {
    success: false,
    message: 'Demasiados intentos de autenticación, por favor intente más tarde'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn('Rate limit de autenticación excedido:', {
      ip: req.ip,
      path: req.path,
      method: req.method,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Configuración de Helmet
 */
const helmetConfig = {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'", "http://localhost:3000", "http://localhost:3001"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
      sandbox: ['allow-forms', 'allow-scripts', 'allow-same-origin']
    }
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' }
};

/**
 * Middleware para sanitización de datos
 */
const sanitizeData = (req, res, next) => {
  try {
    // Sanitizar query params
    if (req.query) {
      Object.keys(req.query).forEach(key => {
        if (typeof req.query[key] === 'string') {
          req.query[key] = req.query[key].trim();
        }
      });
    }

    // Sanitizar body
    if (req.body) {
      Object.keys(req.body).forEach(key => {
        if (typeof req.body[key] === 'string') {
          req.body[key] = req.body[key].trim();
        }
      });
    }

    // Sanitizar params
    if (req.params) {
      Object.keys(req.params).forEach(key => {
        if (typeof req.params[key] === 'string') {
          req.params[key] = req.params[key].trim();
        }
      });
    }

    next();
  } catch (error) {
    logger.error('Error al sanitizar datos:', {
      error: error.message,
      path: req.path,
      method: req.method,
      timestamp: new Date().toISOString()
    });

    next();
  }
};

/**
 * Middleware para validación de headers
 */
const validateHeaders = (req, res, next) => {
  try {
    // Verificar Content-Type
    if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
      const contentType = req.get('Content-Type');
      if (!contentType || !contentType.includes('application/json')) {
        return res.status(415).json({
          success: false,
          message: 'Content-Type debe ser application/json'
        });
      }
    }

    // Verificar Accept
    const accept = req.get('Accept');
    if (!accept || !accept.includes('application/json')) {
      return res.status(406).json({
        success: false,
        message: 'Accept debe ser application/json'
      });
    }

    next();
  } catch (error) {
    logger.error('Error al validar headers:', {
      error: error.message,
      path: req.path,
      method: req.method,
      timestamp: new Date().toISOString()
    });

    next();
  }
};

/**
 * Middleware para prevenir ataques de fuerza bruta
 */
const bruteForceProtection = (req, res, next) => {
  try {
    const ip = req.ip;
    const path = req.path;
    const key = `brute_force:${ip}:${path}`;

    // Implementar lógica de detección de fuerza bruta
    // Por ejemplo, usando Redis para contar intentos

    next();
  } catch (error) {
    logger.error('Error en protección contra fuerza bruta:', {
      error: error.message,
      ip: req.ip,
      path: req.path,
      timestamp: new Date().toISOString()
    });

    next();
  }
};

// Middleware de seguridad básico
const securityMiddleware = (req, res, next) => {
  // Headers de seguridad básicos
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  
  next();
};

module.exports = {
  corsOptions,
  rateLimiter,
  authRateLimiter,
  helmetConfig,
  sanitizeData,
  validateHeaders,
  bruteForceProtection,
  securityMiddleware
}; 