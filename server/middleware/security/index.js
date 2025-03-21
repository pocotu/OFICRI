/**
 * Security middleware for the OFICRI API
 * ISO/IEC 27001 compliant implementation
 */

const rateLimit = require('express-rate-limit');
const { logSecurityEvent } = require('../../utils/logger');

// Standard rate limiter for API endpoints
const standardLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logSecurityEvent('RATE_LIMIT_EXCEEDED', {
      ip: req.ip,
      path: req.originalUrl,
      method: req.method
    });
    res.status(429).json({
      success: false,
      message: 'Demasiadas solicitudes, por favor intente más tarde'
    });
  }
});

// Stricter rate limiter for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 login attempts per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logSecurityEvent('AUTH_RATE_LIMIT_EXCEEDED', {
      ip: req.ip,
      path: req.originalUrl,
      method: req.method
    });
    res.status(429).json({
      success: false,
      message: 'Demasiados intentos de autenticación, por favor intente más tarde'
    });
  }
});

// Password reset rate limiter
const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // limit each IP to 3 password reset attempts per hour
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logSecurityEvent('PASSWORD_RESET_RATE_LIMIT_EXCEEDED', {
      ip: req.ip,
      path: req.originalUrl,
      method: req.method
    });
    res.status(429).json({
      success: false,
      message: 'Demasiados intentos de restablecimiento de contraseña, por favor intente más tarde'
    });
  }
});

module.exports = {
  rateLimitMiddleware: {
    standard: standardLimiter,
    auth: authLimiter,
    passwordReset: passwordResetLimiter
  }
}; 