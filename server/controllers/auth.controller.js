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

/**
 * Verificar validez del token
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.verificarToken = async (req, res) => {
  try {
    // El usuario ya está verificado por el middleware verifyToken
    return res.status(200).json({
      success: true,
      message: 'Token válido',
      user: {
        id: req.user.sub,
        codigoCIP: req.user.codigoCIP,
        nombres: req.user.nombres,
        apellidos: req.user.apellidos,
        rol: req.user.rol
      }
    });
  } catch (error) {
    logger.error('Error al verificar token', { error: error.message });
    
    return res.status(500).json({
      success: false,
      message: 'Error al verificar token'
    });
  }
};

/**
 * Registro de nuevo usuario
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.registro = async (req, res) => {
  try {
    const { codigoCIP, nombres, apellidos, grado, password, idRol, idArea } = req.body;
    
    // Verificar que el usuario no exista ya
    try {
      const exists = await authService.checkUserExists(codigoCIP);
      if (exists) {
        return res.status(409).json({
          success: false,
          message: 'El código CIP ya está registrado'
        });
      }
      
      // Crear el usuario
      const result = await authService.registerUser({
        codigoCIP,
        nombres,
        apellidos,
        grado,
        password,
        idRol,
        idArea
      });
      
      // Log evento de creación
      logSecurityEvent('USER_CREATED', {
        codigoCIP,
        createdBy: req.user.sub,
        ip: req.ip
      });
      
      return res.status(201).json({
        success: true,
        message: 'Usuario registrado correctamente',
        userId: result.userId
      });
      
    } catch (error) {
      logger.error('Error al registrar usuario', { error: error.message });
      
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Error al registrar usuario'
      });
    }
  } catch (error) {
    logger.error('Error en proceso de registro', { error: error.message, stack: error.stack });
    
    return res.status(500).json({
      success: false,
      message: 'Error en el proceso de registro'
    });
  }
};

/**
 * Solicitar restablecimiento de contraseña
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.solicitarResetPassword = async (req, res) => {
  try {
    const { codigoCIP } = req.body;
    
    if (!codigoCIP) {
      return res.status(400).json({
        success: false,
        message: 'Se requiere código CIP'
      });
    }
    
    try {
      await authService.requestPasswordReset(codigoCIP, req.user.sub);
      
      // Log evento
      logSecurityEvent('PASSWORD_RESET_REQUESTED', {
        targetCIP: codigoCIP,
        requestedBy: req.user.sub,
        ip: req.ip
      });
      
      return res.status(200).json({
        success: true,
        message: 'Solicitud procesada correctamente'
      });
    } catch (error) {
      logger.error('Error al solicitar reset', { error: error.message });
      
      return res.status(error.statusCode || 400).json({
        success: false,
        message: error.message || 'Error al procesar solicitud'
      });
    }
  } catch (error) {
    logger.error('Error al procesar solicitud de reset', { error: error.message });
    
    return res.status(500).json({
      success: false,
      message: 'Error al procesar solicitud'
    });
  }
};

/**
 * Restablecer contraseña
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    
    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Se requiere token y nueva contraseña'
      });
    }
    
    try {
      await authService.resetPassword(token, newPassword);
      
      // Log evento
      logSecurityEvent('PASSWORD_RESET_COMPLETED', {
        ip: req.ip
      });
      
      return res.status(200).json({
        success: true,
        message: 'Contraseña restablecida correctamente'
      });
    } catch (error) {
      logger.error('Error al restablecer contraseña', { error: error.message });
      
      return res.status(error.statusCode || 400).json({
        success: false,
        message: error.message || 'Error al restablecer contraseña'
      });
    }
  } catch (error) {
    logger.error('Error en proceso de reset', { error: error.message });
    
    return res.status(500).json({
      success: false,
      message: 'Error al restablecer contraseña'
    });
  }
};

/**
 * Cambiar contraseña
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.cambiarPassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Se requieren contraseña actual y nueva'
      });
    }
    
    try {
      await authService.changePassword(req.user.sub, currentPassword, newPassword);
      
      // Log evento
      logSecurityEvent('PASSWORD_CHANGED', {
        userId: req.user.sub,
        ip: req.ip
      });
      
      return res.status(200).json({
        success: true,
        message: 'Contraseña cambiada correctamente'
      });
    } catch (error) {
      logger.error('Error al cambiar contraseña', { error: error.message });
      
      return res.status(error.statusCode || 400).json({
        success: false,
        message: error.message || 'Error al cambiar contraseña'
      });
    }
  } catch (error) {
    logger.error('Error en proceso de cambio de contraseña', { error: error.message });
    
    return res.status(500).json({
      success: false,
      message: 'Error al cambiar contraseña'
    });
  }
};

/**
 * Bloquear usuario
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.bloquearUsuario = async (req, res) => {
  try {
    const userId = req.params.id;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'Se requiere ID de usuario'
      });
    }
    
    try {
      await authService.blockUser(userId, req.user.sub);
      
      // Log evento
      logSecurityEvent('USER_BLOCKED', {
        targetUserId: userId,
        blockedBy: req.user.sub,
        ip: req.ip
      });
      
      return res.status(200).json({
        success: true,
        message: 'Usuario bloqueado correctamente'
      });
    } catch (error) {
      logger.error('Error al bloquear usuario', { error: error.message });
      
      return res.status(error.statusCode || 400).json({
        success: false,
        message: error.message || 'Error al bloquear usuario'
      });
    }
  } catch (error) {
    logger.error('Error en proceso de bloqueo', { error: error.message });
    
    return res.status(500).json({
      success: false,
      message: 'Error al bloquear usuario'
    });
  }
};

/**
 * Desbloquear usuario
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.desbloquearUsuario = async (req, res) => {
  try {
    const userId = req.params.id;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'Se requiere ID de usuario'
      });
    }
    
    try {
      await authService.unblockUser(userId, req.user.sub);
      
      // Log evento
      logSecurityEvent('USER_UNBLOCKED', {
        targetUserId: userId,
        unblockedBy: req.user.sub,
        ip: req.ip
      });
      
      return res.status(200).json({
        success: true,
        message: 'Usuario desbloqueado correctamente'
      });
    } catch (error) {
      logger.error('Error al desbloquear usuario', { error: error.message });
      
      return res.status(error.statusCode || 400).json({
        success: false,
        message: error.message || 'Error al desbloquear usuario'
      });
    }
  } catch (error) {
    logger.error('Error en proceso de desbloqueo', { error: error.message });
    
    return res.status(500).json({
      success: false,
      message: 'Error al desbloquear usuario'
    });
  }
};

/**
 * Obtener sesiones activas
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.sesionesActivas = async (req, res) => {
  try {
    try {
      const sessions = await authService.getActiveSessions(req.user.sub);
      
      return res.status(200).json({
        success: true,
        data: sessions
      });
    } catch (error) {
      logger.error('Error al obtener sesiones', { error: error.message });
      
      return res.status(error.statusCode || 400).json({
        success: false,
        message: error.message || 'Error al obtener sesiones activas'
      });
    }
  } catch (error) {
    logger.error('Error en proceso de consulta de sesiones', { error: error.message });
    
    return res.status(500).json({
      success: false,
      message: 'Error al obtener sesiones activas'
    });
  }
};

/**
 * Cerrar todas las sesiones
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.cerrarSesiones = async (req, res) => {
  try {
    try {
      await authService.closeAllSessions(req.user.sub);
      
      // Log evento
      logSecurityEvent('ALL_SESSIONS_CLOSED', {
        userId: req.user.sub,
        ip: req.ip
      });
      
      return res.status(200).json({
        success: true,
        message: 'Todas las sesiones han sido cerradas'
      });
    } catch (error) {
      logger.error('Error al cerrar sesiones', { error: error.message });
      
      return res.status(error.statusCode || 400).json({
        success: false,
        message: error.message || 'Error al cerrar sesiones'
      });
    }
  } catch (error) {
    logger.error('Error en proceso de cierre de sesiones', { error: error.message });
    
    return res.status(500).json({
      success: false,
      message: 'Error al cerrar sesiones'
    });
  }
}; 