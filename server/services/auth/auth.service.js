/**
 * Authentication Service
 * Handles user authentication with ISO/IEC 27001 security controls
 */

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { executeQuery } = require('../../config/database');
const { passwordPolicy, accountLockout, sessionSecurity } = require('../../config/security');
const { logger } = require('../../utils/logger');

// Función de reemplazo para logSecurityEvent
function logSecurityEvent(eventType, data = {}) {
  console.log(`[SECURITY EVENT] ${eventType}`, data);
  return { eventType, ...data };
}

/**
 * User login with security controls
 * @param {string} codigoCIP - User CIP code
 * @param {string} password - User password
 * @returns {Promise<Object>} Authentication result with user data and tokens
 */
async function login(codigoCIP, password) {
  try {
    // Input validation
    if (!codigoCIP || !password) {
      const error = new Error('CIP y contraseña son requeridos');
      error.statusCode = 400;
      throw error;
    }
    
    // Find user by CIP
    const users = await executeQuery(`
      SELECT 
        u.IDUsuario, u.CodigoCIP, u.Nombres, u.Apellidos, u.Grado,
        u.PasswordHash, u.IDArea, u.IDRol, u.UltimoAcceso,
        u.IntentosFallidos, u.Bloqueado, u.UltimoBloqueo,
        a.NombreArea, r.NombreRol, r.Permisos
      FROM Usuario u
      LEFT JOIN AreaEspecializada a ON u.IDArea = a.IDArea
      LEFT JOIN Rol r ON u.IDRol = r.IDRol
      WHERE u.CodigoCIP = ?
    `, [codigoCIP]);
    
    // User not found
    if (users.length === 0) {
      logSecurityEvent('AUTH_FAILURE', {
        reason: 'USER_NOT_FOUND',
        codigoCIP,
        ipAddress: null
      });
      
      // Use the same error message as password failure for security
      const error = new Error('Credenciales incorrectas');
      error.statusCode = 401;
      throw error;
    }
    
    const user = users[0];
    
    // Check if account is locked
    if (user.Bloqueado) {
      const lockoutTime = new Date(user.UltimoBloqueo).getTime();
      const currentTime = new Date().getTime();
      const lockoutDuration = accountLockout.lockoutDuration;
      
      // If lockout period hasn't expired
      if (currentTime - lockoutTime < lockoutDuration) {
        const remainingTime = Math.ceil((lockoutDuration - (currentTime - lockoutTime)) / 60000);
        
        logSecurityEvent('AUTH_BLOCKED_ACCOUNT_ACCESS', {
          userId: user.IDUsuario,
          codigoCIP,
          remainingTime
        });
        
        const error = new Error(`Cuenta bloqueada. Intente nuevamente en ${remainingTime} minutos`);
        error.statusCode = 403;
        throw error;
      }
      
      // Lockout period expired, reset lockout status
      await executeQuery(`
        UPDATE Usuario 
        SET Bloqueado = FALSE, IntentosFallidos = 0 
        WHERE IDUsuario = ?
      `, [user.IDUsuario]);
      
      user.Bloqueado = false;
      user.IntentosFallidos = 0;
    }
    
    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.PasswordHash);
    
    // Password is incorrect
    if (!isPasswordValid) {
      // Increment failed attempts
      const newAttempts = (user.IntentosFallidos || 0) + 1;
      const shouldLock = newAttempts >= accountLockout.maxLoginAttempts;
      
      await executeQuery(`
        UPDATE Usuario 
        SET 
          IntentosFallidos = ?,
          Bloqueado = ?,
          UltimoBloqueo = ${shouldLock ? 'NOW()' : 'UltimoBloqueo'}
        WHERE IDUsuario = ?
      `, [newAttempts, shouldLock, user.IDUsuario]);
      
      logSecurityEvent('AUTH_FAILURE', {
        reason: 'INVALID_PASSWORD',
        userId: user.IDUsuario,
        codigoCIP,
        attempts: newAttempts,
        locked: shouldLock
      });
      
      if (shouldLock) {
        const error = new Error('Demasiados intentos fallidos. Cuenta bloqueada temporalmente');
        error.statusCode = 403;
        throw error;
      } else {
        const attemptsLeft = accountLockout.maxLoginAttempts - newAttempts;
        const error = new Error(`Credenciales incorrectas. Intentos restantes: ${attemptsLeft}`);
        error.statusCode = 401;
        throw error;
      }
    }
    
    // Password is correct, reset failed attempts
    await executeQuery(`
      UPDATE Usuario 
      SET IntentosFallidos = 0, UltimoAcceso = NOW() 
      WHERE IDUsuario = ?
    `, [user.IDUsuario]);
    
    // Generate tokens (JWT and refresh token)
    const tokenPayload = {
      sub: user.IDUsuario,
      cip: user.CodigoCIP,
      rol: user.IDRol,
      permisos: user.Permisos
    };
    
    const token = jwt.sign(
      tokenPayload,
      process.env.JWT_SECRET,
      { expiresIn: sessionSecurity.tokenExpiresIn }
    );
    
    // Generate refresh token
    const refreshToken = crypto.randomBytes(40).toString('hex');
    const refreshExpires = new Date();
    refreshExpires.setDate(refreshExpires.getDate() + 7); // 7 days
    
    // Store refresh token in database
    await executeQuery(`
      INSERT INTO Session (
        IDUsuario, SessionToken, FechaInicio, 
        UltimoAcceso, Expiracion, IPOrigen
      ) VALUES (?, ?, NOW(), NOW(), ?, ?)
    `, [
      user.IDUsuario,
      refreshToken,
      refreshExpires,
      null // IP is captured at controller level
    ]);
    
    // Log successful login
    logSecurityEvent('AUTH_SUCCESS', {
      userId: user.IDUsuario,
      codigoCIP,
      sessionId: null // Session ID is not available at this point
    });
    
    // Return auth result
    return {
      success: true,
      user: {
        IDUsuario: user.IDUsuario,
        CodigoCIP: user.CodigoCIP,
        Nombres: user.Nombres,
        Apellidos: user.Apellidos,
        Grado: user.Grado,
        IDArea: user.IDArea,
        NombreArea: user.NombreArea,
        IDRol: user.IDRol,
        NombreRol: user.NombreRol,
        Permisos: user.Permisos,
        UltimoAcceso: user.UltimoAcceso
      },
      token,
      refreshToken,
      expiresIn: sessionSecurity.tokenExpiresIn
    };
  } catch (error) {
    logger.error('Error en autenticación', { 
      error: error.message, 
      codigoCIP,
      stack: error.stack 
    });
    throw error;
  }
}

/**
 * Logout and invalidate user session
 * @param {string} token - JWT token to invalidate
 * @param {string} refreshToken - Refresh token to invalidate
 * @returns {Promise<Object>} Logout result
 */
async function logout(token, refreshToken) {
  try {
    if (!token && !refreshToken) {
      return { success: true, message: 'Sesión cerrada' };
    }
    
    let userId = null;
    
    // If token exists, decode it to get userId
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        userId = decoded.sub;
      } catch (e) {
        // Token is invalid, but we still want to continue with logout
        logger.warn('Token inválido en logout', { error: e.message });
      }
    }
    
    // If refreshToken exists, invalidate it
    if (refreshToken) {
      const result = await executeQuery(`
        DELETE FROM Session WHERE SessionToken = ?
      `, [refreshToken]);
      
      if (result.affectedRows > 0) {
        logger.info('Token de refresco invalidado', { refreshToken: '[REDACTED]' });
      }
    }
    
    // If userId exists, invalidate all sessions for this user (optional)
    if (userId && process.env.LOGOUT_ALL_SESSIONS === 'true') {
      await executeQuery(`
        DELETE FROM Session WHERE IDUsuario = ?
      `, [userId]);
      
      logger.info('Todas las sesiones invalidadas para usuario', { userId });
    }
    
    // Log the logout event
    if (userId) {
      logSecurityEvent('AUTH_LOGOUT', { userId });
    }
    
    return {
      success: true,
      message: 'Sesión cerrada correctamente'
    };
  } catch (error) {
    logger.error('Error en logout', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * Refresh authentication token
 * @param {string} refreshToken - Current refresh token
 * @returns {Promise<Object>} New tokens
 */
async function refreshToken(refreshToken) {
  try {
    if (!refreshToken) {
      const error = new Error('Token de refresco requerido');
      error.statusCode = 400;
      throw error;
    }
    
    // Find session by refresh token
    const sessions = await executeQuery(`
      SELECT 
        s.IDSession, s.IDUsuario, s.FechaInicio, s.Expiracion,
        u.CodigoCIP, u.IDRol, r.Permisos
      FROM Session s
      JOIN Usuario u ON s.IDUsuario = u.IDUsuario
      JOIN Rol r ON u.IDRol = r.IDRol
      WHERE s.SessionToken = ? AND s.Expiracion > NOW()
    `, [refreshToken]);
    
    // Invalid or expired refresh token
    if (sessions.length === 0) {
      logSecurityEvent('AUTH_REFRESH_FAILURE', {
        reason: 'INVALID_REFRESH_TOKEN'
      });
      
      const error = new Error('Token de refresco inválido o expirado');
      error.statusCode = 401;
      throw error;
    }
    
    const session = sessions[0];
    
    // Generate new JWT token
    const tokenPayload = {
      sub: session.IDUsuario,
      cip: session.CodigoCIP,
      rol: session.IDRol,
      permisos: session.Permisos
    };
    
    const newToken = jwt.sign(
      tokenPayload,
      process.env.JWT_SECRET,
      { expiresIn: sessionSecurity.tokenExpiresIn }
    );
    
    // Generate new refresh token
    const newRefreshToken = crypto.randomBytes(40).toString('hex');
    const refreshExpires = new Date();
    refreshExpires.setDate(refreshExpires.getDate() + 7); // 7 days
    
    // Update session with new refresh token
    await executeQuery(`
      UPDATE Session 
      SET 
        SessionToken = ?,
        UltimoAcceso = NOW(),
        Expiracion = ?
      WHERE IDSession = ?
    `, [newRefreshToken, refreshExpires, session.IDSession]);
    
    // Log token refresh
    logSecurityEvent('AUTH_TOKEN_REFRESH', {
      userId: session.IDUsuario,
      sessionId: session.IDSession
    });
    
    return {
      success: true,
      token: newToken,
      refreshToken: newRefreshToken,
      expiresIn: sessionSecurity.tokenExpiresIn
    };
  } catch (error) {
    logger.error('Error en refreshToken', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * Verify JWT token
 * @param {string} token - JWT token
 * @returns {Promise<Object>} Decoded token with user data
 */
async function verifyToken(token) {
  try {
    if (!token) {
      const error = new Error('Token requerido');
      error.statusCode = 401;
      throw error;
    }
    
    // Verify JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user data
    const users = await executeQuery(`
      SELECT 
        u.IDUsuario, u.CodigoCIP, u.Nombres, u.Apellidos, u.Grado,
        u.IDArea, u.IDRol, r.NombreRol, r.Permisos
      FROM Usuario u
      JOIN Rol r ON u.IDRol = r.IDRol
      WHERE u.IDUsuario = ? AND u.Bloqueado = FALSE
    `, [decoded.sub]);
    
    // User not found or blocked
    if (users.length === 0) {
      logSecurityEvent('AUTH_VERIFICATION_FAILURE', {
        reason: 'USER_NOT_FOUND_OR_BLOCKED',
        tokenSubject: decoded.sub
      });
      
      const error = new Error('Usuario no encontrado o bloqueado');
      error.statusCode = 401;
      throw error;
    }
    
    const user = users[0];
    
    // Return verified user data
    return {
      user: {
        IDUsuario: user.IDUsuario,
        CodigoCIP: user.CodigoCIP,
        Nombres: user.Nombres,
        Apellidos: user.Apellidos,
        Grado: user.Grado,
        IDArea: user.IDArea,
        IDRol: user.IDRol,
        NombreRol: user.NombreRol,
        Permisos: user.Permisos
      },
      token: decoded
    };
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      logSecurityEvent('AUTH_VERIFICATION_FAILURE', {
        reason: error.name,
        message: error.message
      });
      
      const err = new Error('Token inválido o expirado');
      err.statusCode = 401;
      throw err;
    }
    
    logger.error('Error en verifyToken', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * Request password reset
 * @param {string} codigoCIP - User CIP code
 * @returns {Promise<Object>} Reset token data
 */
async function requestPasswordReset(codigoCIP) {
  try {
    // Find user by CIP
    const users = await executeQuery(`
      SELECT IDUsuario, CodigoCIP, Nombres, Apellidos
      FROM Usuario
      WHERE CodigoCIP = ? AND Bloqueado = FALSE
    `, [codigoCIP]);
    
    // For security reasons, always return success even if user is not found
    if (users.length === 0) {
      // Log but don't expose that the user doesn't exist
      logSecurityEvent('PASSWORD_RESET_REQUEST', {
        result: 'USER_NOT_FOUND',
        codigoCIP
      });
      
      return {
        success: true,
        message: 'Si el usuario existe, se enviará un enlace de recuperación'
      };
    }
    
    const user = users[0];
    
    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const tokenExpires = new Date();
    tokenExpires.setHours(tokenExpires.getHours() + 1); // 1 hour expiration
    
    // Store reset token in database
    await executeQuery(`
      INSERT INTO PasswordReset (
        IDUsuario, ResetToken, Expiracion, Usado
      ) VALUES (?, ?, ?, FALSE)
    `, [user.IDUsuario, resetToken, tokenExpires]);
    
    // Log the reset request
    logSecurityEvent('PASSWORD_RESET_REQUEST', {
      result: 'SUCCESS',
      userId: user.IDUsuario,
      codigoCIP
    });
    
    // In a real implementation, send email with reset link
    // For this example, just return the token (would normally be sent via email)
    return {
      success: true,
      // Only include these in development, in production we'd send an email instead
      ...(process.env.NODE_ENV !== 'production' && {
        resetToken,
        userId: user.IDUsuario,
        expiresAt: tokenExpires
      }),
      message: 'Se ha enviado un enlace de recuperación'
    };
  } catch (error) {
    logger.error('Error en requestPasswordReset', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * Reset password using reset token
 * @param {string} resetToken - Password reset token
 * @param {string} newPassword - New password
 * @returns {Promise<Object>} Reset result
 */
async function resetPassword(resetToken, newPassword) {
  try {
    // Verificar token
    const reset = await verifyPasswordResetToken(resetToken);
    if (!reset) {
      logger.warn('Intento de restablecer contraseña con token inválido');
      return false;
    }

    // Generar nueva contraseña hasheada
    const passwordHash = await hashPassword(newPassword);

    // Actualizar contraseña y borrar intentos fallidos
    await executeQuery(`
      UPDATE Usuario
      SET PasswordHash = ?, IntentosFallidos = 0, Bloqueado = FALSE
      WHERE IDUsuario = ?
    `, [passwordHash, reset.IDUsuario]);

    // Invalidar token usado
    await markResetTokenAsUsed(resetToken);

    logger.info('Contraseña restablecida exitosamente', {
      userId: reset.IDUsuario
    });

    return true;
  } catch (error) {
    logger.error('Error al restablecer contraseña:', error);
    return false;
  }
}

/**
 * Change user password (when already authenticated)
 * @param {number} userId - User ID
 * @param {string} currentPassword - Current password
 * @param {string} newPassword - New password
 * @returns {Promise<Object>} Change result
 */
async function changePassword(userId, currentPassword, newPassword) {
  try {
    // Verificar contraseña actual
    const user = await getUserById(userId);
    
    if (!user) {
      logger.warn('Intento de cambiar contraseña con usuario inexistente', {userId});
      return false;
    }
    
    // Verificar contraseña actual
    const passwordValid = await verifyPassword(currentPassword, user.passwordHash);
    
    if (!passwordValid) {
      logger.warn('Intento de cambiar contraseña con contraseña actual incorrecta', {userId});
      return false;
    }

    // Generar nueva contraseña hasheada
    const passwordHash = await hashPassword(newPassword);

    // Actualizar contraseña
    await executeQuery(`
      UPDATE Usuario
      SET PasswordHash = ?
      WHERE IDUsuario = ?
    `, [passwordHash, userId]);

    logger.info('Contraseña cambiada exitosamente', {userId});
    return true;
  } catch (error) {
    logger.error('Error al cambiar contraseña:', error);
    return false;
  }
}

/**
 * Validate password against security policy
 * @param {string} password - Password to validate
 * @throws {Error} If password doesn't meet requirements
 */
function validatePassword(password) {
  // Check length
  if (!password || password.length < passwordPolicy.minLength) {
    const error = new Error(`La contraseña debe tener al menos ${passwordPolicy.minLength} caracteres`);
    error.statusCode = 400;
    throw error;
  }
  
  // Check complexity
  let errorMessage = [];
  
  if (passwordPolicy.requireUppercase && !/[A-Z]/.test(password)) {
    errorMessage.push('al menos una mayúscula');
  }
  
  if (passwordPolicy.requireLowercase && !/[a-z]/.test(password)) {
    errorMessage.push('al menos una minúscula');
  }
  
  if (passwordPolicy.requireNumbers && !/[0-9]/.test(password)) {
    errorMessage.push('al menos un número');
  }
  
  if (passwordPolicy.requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errorMessage.push('al menos un carácter especial');
  }
  
  if (errorMessage.length > 0) {
    const error = new Error(`La contraseña debe contener ${errorMessage.join(', ')}`);
    error.statusCode = 400;
    throw error;
  }
}

async function getUserByCIP(codigoCIP) {
  try {
    const users = await executeQuery(`
      SELECT 
        u.IDUsuario, u.CodigoCIP, u.Nombres, u.Apellidos, u.Grado,
        u.PasswordHash, u.IDArea, u.IDRol, u.UltimoAcceso,
        u.IntentosFallidos, u.Bloqueado, u.UltimoBloqueo,
        a.NombreArea, r.NombreRol, r.NivelAcceso, r.Permisos
      FROM Usuario u
      LEFT JOIN AreaEspecializada a ON u.IDArea = a.IDArea
      LEFT JOIN Rol r ON u.IDRol = r.IDRol
      WHERE u.CodigoCIP = ?
    `, [codigoCIP]);
    
    return users.length > 0 ? mapUsuarioResponse(users[0]) : null;
  } catch (error) {
    logger.error('Error en getUserByCIP', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * Actualiza la contraseña de un usuario
 * @param {number} userId - ID del usuario
 * @param {string} newPassword - Nueva contraseña
 * @returns {Promise<boolean>} - true si la actualización fue exitosa
 */
async function updatePassword(userId, newPassword) {
  try {
    // Generar hash seguro para la nueva contraseña
    const passwordHash = await hashPassword(newPassword);
    
    // Actualizar la contraseña en la base de datos
    await executeQuery(`
      UPDATE Usuario 
      SET PasswordHash = ? 
      WHERE IDUsuario = ?
    `, [passwordHash, userId]);
    
    return true;
  } catch (error) {
    logger.error('Error actualizando contraseña:', { error: error.message });
    return false;
  }
}

/**
 * Check if a user exists by CIP code
 * @param {string} codigoCIP - User CIP code
 * @returns {Promise<boolean>} True if user exists
 */
async function checkUserExists(codigoCIP) {
  try {
    const users = await executeQuery(`
      SELECT IDUsuario FROM Usuario WHERE CodigoCIP = ?
    `, [codigoCIP]);
    
    return users.length > 0;
  } catch (error) {
    logger.error('Error al verificar existencia de usuario', { error: error.message });
    throw error;
  }
}

/**
 * Register a new user
 * @param {Object} userData - User data
 * @returns {Promise<Object>} Registration result
 */
async function registerUser(userData) {
  try {
    const { codigoCIP, nombres, apellidos, grado, password, idRol, idArea } = userData;
    
    // Validate password against policy
    try {
      // Esta función lanzará un error si la contraseña no es válida
      validatePassword(password);
    } catch (validationError) {
      // Re-lanzar el error de validación
      throw validationError;
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Insert user
    const result = await executeQuery(`
      INSERT INTO Usuario (
        CodigoCIP, Nombres, Apellidos, Grado, 
        PasswordHash, IDArea, IDRol
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      codigoCIP,
      nombres,
      apellidos,
      grado,
      hashedPassword,
      idArea,
      idRol
    ]);
    
    return {
      success: true,
      userId: result.insertId
    };
  } catch (error) {
    logger.error('Error al registrar usuario', { error: error.message });
    
    // Check for duplicate key (codigoCIP already exists)
    if (error.code === 'ER_DUP_ENTRY') {
      const err = new Error('El código CIP ya está registrado');
      err.statusCode = 409;
      throw err;
    }
    
    throw error;
  }
}

/**
 * Block a user account
 * @param {number} userId - User ID to block
 * @param {number} adminId - Admin user ID performing the action
 * @returns {Promise<Object>} Block result
 */
async function blockUser(userId, adminId) {
  try {
    if (userId === adminId) {
      const error = new Error('No puede bloquear su propia cuenta');
      error.statusCode = 400;
      throw error;
    }
    
    // Check if user exists
    const users = await executeQuery(`
      SELECT IDUsuario, CodigoCIP, Bloqueado, IDRol
      FROM Usuario
      WHERE IDUsuario = ?
    `, [userId]);
    
    if (users.length === 0) {
      const error = new Error('Usuario no encontrado');
      error.statusCode = 404;
      throw error;
    }
    
    const user = users[0];
    
    // Check if user is already blocked
    if (user.Bloqueado) {
      return {
        success: true,
        message: 'El usuario ya estaba bloqueado'
      };
    }
    
    // Cannot block admin users (role ID 1)
    if (user.IDRol === 1) {
      const error = new Error('No se puede bloquear un usuario administrador');
      error.statusCode = 403;
      throw error;
    }
    
    // Block user
    await executeQuery(`
      UPDATE Usuario 
      SET Bloqueado = TRUE, UltimoBloqueo = NOW() 
      WHERE IDUsuario = ?
    `, [userId]);
    
    // Close all active sessions for this user
    await executeQuery(`
      DELETE FROM Session WHERE IDUsuario = ?
    `, [userId]);
    
    return {
      success: true,
      message: 'Usuario bloqueado correctamente'
    };
  } catch (error) {
    logger.error('Error al bloquear usuario', { error: error.message });
    throw error;
  }
}

/**
 * Unblock a user account
 * @param {number} userId - User ID to unblock
 * @param {number} adminId - Admin user ID performing the action
 * @returns {Promise<Object>} Unblock result
 */
async function unblockUser(userId, adminId) {
  try {
    // Check if user exists
    const users = await executeQuery(`
      SELECT IDUsuario, CodigoCIP, Bloqueado
      FROM Usuario
      WHERE IDUsuario = ?
    `, [userId]);
    
    if (users.length === 0) {
      const error = new Error('Usuario no encontrado');
      error.statusCode = 404;
      throw error;
    }
    
    const user = users[0];
    
    // Check if user is already unblocked
    if (!user.Bloqueado) {
      return {
        success: true,
        message: 'El usuario ya estaba desbloqueado'
      };
    }
    
    // Unblock user
    await executeQuery(`
      UPDATE Usuario 
      SET Bloqueado = FALSE, IntentosFallidos = 0, UltimoBloqueo = NULL 
      WHERE IDUsuario = ?
    `, [userId]);
    
    return {
      success: true,
      message: 'Usuario desbloqueado correctamente'
    };
  } catch (error) {
    logger.error('Error al desbloquear usuario', { error: error.message });
    throw error;
  }
}

/**
 * Get active sessions for a user
 * @param {number} userId - User ID
 * @returns {Promise<Array>} List of active sessions
 */
async function getActiveSessions(userId) {
  try {
    const sessions = await executeQuery(`
      SELECT 
        IDSession, FechaInicio, UltimoAcceso, Expiracion, IPOrigen
      FROM Session
      WHERE IDUsuario = ? AND Expiracion > NOW()
      ORDER BY UltimoAcceso DESC
    `, [userId]);
    
    return sessions;
  } catch (error) {
    logger.error('Error al obtener sesiones activas', { error: error.message });
    throw error;
  }
}

/**
 * Close all active sessions for a user
 * @param {number} userId - User ID
 * @returns {Promise<Object>} Close result
 */
async function closeAllSessions(userId) {
  try {
    const result = await executeQuery(`
      DELETE FROM Session 
      WHERE IDUsuario = ?
    `, [userId]);
    
    return {
      success: true,
      message: 'Sesiones cerradas correctamente',
      count: result.affectedRows
    };
  } catch (error) {
    logger.error('Error al cerrar sesiones', { error: error.message });
    throw error;
  }
}

/**
 * Verify a password reset token
 * @param {string} resetToken - Token to verify
 * @returns {Promise<Object|null>} Reset token info or null if invalid
 */
async function verifyPasswordResetToken(resetToken) {
  try {
    if (!resetToken) {
      return null;
    }
    
    // Find token in database
    const tokens = await executeQuery(`
      SELECT 
        pr.IDReset, pr.IDUsuario, pr.ResetToken, pr.Expiracion, pr.Usado,
        u.CodigoCIP
      FROM PasswordReset pr
      JOIN Usuario u ON pr.IDUsuario = u.IDUsuario
      WHERE pr.ResetToken = ? AND pr.Usado = FALSE AND pr.Expiracion > NOW()
    `, [resetToken]);
    
    // Token not found, expired, or already used
    if (tokens.length === 0) {
      logSecurityEvent('PASSWORD_RESET_FAILURE', {
        reason: 'INVALID_TOKEN',
        token: '[REDACTED]'
      });
      return null;
    }
    
    return tokens[0];
  } catch (error) {
    logger.error('Error al verificar token de restablecimiento:', { error: error.message });
    return null;
  }
}

/**
 * Mark a password reset token as used
 * @param {string} resetToken - Token to mark as used
 * @returns {Promise<boolean>} True if successful
 */
async function markResetTokenAsUsed(resetToken) {
  try {
    const result = await executeQuery(`
      UPDATE PasswordReset
      SET Usado = TRUE, FechaUso = NOW()
      WHERE ResetToken = ?
    `, [resetToken]);
    
    return result.affectedRows > 0;
  } catch (error) {
    logger.error('Error al marcar token como usado:', { error: error.message });
    return false;
  }
}

/**
 * Hash a password securely
 * @param {string} password - Plain text password
 * @returns {Promise<string>} Hashed password
 */
async function hashPassword(password) {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, 10);
}

/**
 * Verify a password against a hash
 * @param {string} password - Plain text password
 * @param {string} hash - Hashed password
 * @returns {Promise<boolean>} True if password matches hash
 */
async function verifyPassword(password, hash) {
  return await bcrypt.compare(password, hash);
}

/**
 * Get a user by ID
 * @param {number} userId - User ID
 * @returns {Promise<Object|null>} User data or null if not found
 */
async function getUserById(userId) {
  try {
    const users = await executeQuery(`
      SELECT 
        u.IDUsuario, u.CodigoCIP, u.Nombres, u.Apellidos, u.Grado,
        u.PasswordHash as passwordHash, u.IDArea, u.IDRol
      FROM Usuario u
      WHERE u.IDUsuario = ? AND u.Bloqueado = FALSE
    `, [userId]);
    
    return users.length > 0 ? users[0] : null;
  } catch (error) {
    logger.error('Error en getUserById:', { error: error.message });
    return null;
  }
}

// Función auxiliar para mapear respuestas de usuario
function mapUsuarioResponse(user) {
  return {
    IDUsuario: user.IDUsuario,
    CodigoCIP: user.CodigoCIP,
    Nombres: user.Nombres,
    Apellidos: user.Apellidos,
    Grado: user.Grado,
    IDArea: user.IDArea,
    NombreArea: user.NombreArea,
    IDRol: user.IDRol,
    NombreRol: user.NombreRol,
    Permisos: user.Permisos,
    UltimoAcceso: user.UltimoAcceso,
    passwordHash: user.PasswordHash // Solo para uso interno
  };
}

// Export all functions
module.exports = {
  login,
  logout,
  refreshToken,
  verifyToken,
  requestPasswordReset,
  resetPassword,
  changePassword,
  validatePassword,
  getUserByCIP,
  updatePassword,
  checkUserExists,
  registerUser,
  blockUser,
  unblockUser,
  getActiveSessions,
  closeAllSessions,
  // Funciones auxiliares expuestas para testing
  verifyPasswordResetToken,
  markResetTokenAsUsed,
  hashPassword,
  verifyPassword,
  getUserById,
  mapUsuarioResponse
}; 