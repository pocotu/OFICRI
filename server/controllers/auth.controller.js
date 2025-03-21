/**
 * Authentication Controller
 * Handles authentication-related operations
 * ISO/IEC 27001 compliant implementation
 */

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { logger } = require('../utils/logger');
const authService = require('../services/auth/auth.service');

// Función de reemplazo para logSecurityEvent
function logSecurityEvent(eventType, data = {}) {
  console.log(`[SECURITY EVENT] ${eventType}`, data);
  return { eventType, ...data };
}

/**
 * User login
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.login = async (req, res) => {
  try {
    const { codigoCIP, password } = req.body;
    
    if (!codigoCIP || !password) {
      return res.status(400).json({
        success: false,
        message: 'Se requiere código CIP y contraseña'
      });
    }
    
    try {
      // Usar el servicio de autenticación para el login
      const authResult = await authService.login(codigoCIP, password);
      
      // Si llegamos aquí, la autenticación fue exitosa
      return res.status(200).json({
        success: true,
        message: 'Inicio de sesión exitoso',
        token: authResult.token,
        refreshToken: authResult.refreshToken,
        user: authResult.user
      });
    } catch (authError) {
      // Manejo de errores de autenticación
      logSecurityEvent('FAILED_LOGIN_ATTEMPT', {
        codigoCIP,
        ip: req.ip,
        reason: authError.message
      });
      
      return res.status(authError.statusCode || 401).json({
        success: false,
        message: authError.message || 'Credenciales inválidas'
      });
    }
    
  } catch (error) {
    logger.error('Error en autenticación', { error: error.message, stack: error.stack });
    
    return res.status(500).json({
      success: false,
      message: 'Error en el proceso de autenticación'
    });
  }
};

/**
 * User logout
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.logout = async (req, res) => {
  try {
    // Get the token
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];
    
    // Get refresh token from body
    const { refreshToken } = req.body;
    
    try {
      // Usar el servicio de autenticación para cerrar sesión
      await authService.logout(token, refreshToken);
      
      // Log logout event
      logSecurityEvent('USER_LOGOUT', {
        ip: req.ip,
        userId: req.user ? req.user.sub : 'unknown'
      });
      
      // Clear session if it exists
      if (req.session) {
        req.session.destroy();
      }
      
      return res.status(200).json({
        success: true,
        message: 'Sesión cerrada exitosamente'
      });
    } catch (error) {
      logger.warn('Error en cierre de sesión', { error: error.message });
      // Aún así retornamos éxito para no bloquear al usuario
      return res.status(200).json({
        success: true,
        message: 'Sesión cerrada exitosamente'
      });
    }
  } catch (error) {
    logger.error('Error en cierre de sesión', { error: error.message });
    
    return res.status(500).json({
      success: false,
      message: 'Error al cerrar sesión'
    });
  }
};

/**
 * Refresh authentication token
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'No se proporcionó token de refresco'
      });
    }
    
    try {
      // Usar el servicio de autenticación para refrescar el token
      const refreshResult = await authService.refreshToken(refreshToken);
      
      return res.status(200).json({
        success: true,
        message: 'Token refrescado exitosamente',
        token: refreshResult.token,
        refreshToken: refreshResult.refreshToken,
        expiresIn: refreshResult.expiresIn
      });
    } catch (error) {
      logger.error('Error al refrescar token', { 
        error: error.message,
        refreshToken: '[REDACTED]' 
      });
      
      return res.status(error.statusCode || 401).json({
        success: false,
        message: error.message || 'Token de refresco inválido o expirado'
      });
    }
  } catch (error) {
    logger.error('Error al procesar solicitud de refresh token', { error: error.message });
    
    return res.status(500).json({
      success: false,
      message: 'Error al refrescar token'
    });
  }
};

/**
 * Check authentication status
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.checkAuth = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No se proporcionó token de autenticación'
      });
    }
    
    const token = authHeader.split(' ')[1];
    
    try {
      // Usar el servicio de autenticación para verificar el token
      const verifyResult = await authService.verifyToken(token);
      
      // Log successful auth check
      logSecurityEvent('AUTH_CHECK', {
        userId: verifyResult.user.IDUsuario,
        ip: req.ip
      });
      
      return res.status(200).json({
        success: true,
        message: 'Token válido',
        data: {
          user: {
            id: verifyResult.user.IDUsuario,
            codigoCIP: verifyResult.user.CodigoCIP,
            nombres: verifyResult.user.Nombres,
            apellidos: verifyResult.user.Apellidos,
            grado: verifyResult.user.Grado,
            rol: verifyResult.user.IDRol,
            nombreRol: verifyResult.user.NombreRol,
            permisos: verifyResult.user.Permisos
          }
        }
      });
    } catch (error) {
      return res.status(error.statusCode || 401).json({
        success: false,
        message: error.message || 'Token inválido o expirado'
      });
    }
  } catch (error) {
    logger.error('Error al verificar autenticación', { error: error.message });
    
    return res.status(500).json({
      success: false,
      message: 'Error al verificar autenticación'
    });
  }
}; 