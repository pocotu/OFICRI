/**
 * Authentication Controller
 * Handles authentication-related operations
 * ISO/IEC 27001 compliant implementation
 */

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { logger, logSecurityEvent } = require('../utils/logger');

// Simulated user for testing (to be replaced with actual database query)
const simulatedUser = {
  id: 1,
  username: 'admin',
  // Hash of: Admin123!
  password: '$2a$10$mBpQoMfPGGjYV2NzvL.YHeTw0znNqptBsYKrn.zxr5Hd2zQvmCv9q',
  email: 'admin@oficri.gob.pe',
  role: 'admin',
  fullName: 'Administrador del Sistema',
  active: true
};

/**
 * User login
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.login = async (req, res) => {
  try {
    const { codigoCIP, password } = req.body;
    
    // En una implementación real, consultaríamos la base de datos
    // Por ahora, usamos un servicio simulado para pruebas
    
    // Intentamos el login utilizando el servicio de autenticación
    try {
      const authService = require('../services/auth/auth.service');
      const authResult = await authService.login(codigoCIP, password);
      
      // Si llegamos aquí, la autenticación fue exitosa
      return res.status(200).json({
        success: true,
        message: 'Inicio de sesión exitoso',
        token: authResult.token,
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
exports.logout = (req, res) => {
  try {
    // Get the token
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];
    
    if (token) {
      // In a real implementation, we would add the token to a blacklist
      // or remove it from storage
      
      // Log logout event
      logSecurityEvent('USER_LOGOUT', {
        ip: req.ip,
        userId: req.user ? req.user.id : 'unknown'
      });
    }
    
    // Clear session if it exists
    if (req.session) {
      req.session.destroy();
    }
    
    return res.status(200).json({
      success: true,
      message: 'Sesión cerrada exitosamente'
    });
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
exports.refreshToken = (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'No se proporcionó token de refresco'
      });
    }
    
    // Verify refresh token
    jwt.verify(refreshToken, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        logSecurityEvent('INVALID_REFRESH_TOKEN', {
          ip: req.ip,
          error: err.message
        });
        
        return res.status(401).json({
          success: false,
          message: 'Token de refresco inválido o expirado'
        });
      }
      
      // In a real implementation, we would fetch the user from database
      // For now, using the simulated user
      const user = simulatedUser;
      
      // Generate new access token
      const newAccessToken = jwt.sign(
        { 
          id: user.id, 
          username: user.username, 
          role: user.role 
        }, 
        process.env.JWT_SECRET, 
        { 
          expiresIn: '1h'
        }
      );
      
      // Log token refresh
      logSecurityEvent('TOKEN_REFRESH', {
        userId: user.id,
        ip: req.ip
      });
      
      return res.status(200).json({
        success: true,
        message: 'Token refrescado exitosamente',
        data: {
          accessToken: newAccessToken,
          expiresIn: 3600 // 1 hour in seconds
        }
      });
    });
  } catch (error) {
    logger.error('Error al refrescar token', { error: error.message });
    
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
    // El middleware verifyToken ya ha verificado el token y agregado el usuario a req.user
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'No se proporcionó token de autenticación'
      });
    }

    // Log successful auth check
    logSecurityEvent('AUTH_CHECK', {
      userId: req.user.id,
      ip: req.ip
    });

    return res.status(200).json({
      success: true,
      message: 'Token válido',
      data: {
        user: {
          id: req.user.id,
          username: req.user.username,
          role: req.user.role
        }
      }
    });
  } catch (error) {
    logger.error('Error al verificar autenticación', { error: error.message });
    
    return res.status(500).json({
      success: false,
      message: 'Error al verificar autenticación'
    });
  }
}; 