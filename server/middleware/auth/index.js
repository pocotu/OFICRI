/**
 * Authentication middleware for the OFICRI API
 * ISO/IEC 27001 compliant implementation
 */

const jwt = require('jsonwebtoken');
const logger = require('../../utils/logger');

// Middleware to verify JWT tokens
const verifyToken = (req, res, next) => {
  // Get the token from the Authorization header
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN format
  
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'No se proporcionó token de autenticación'
    });
  }
  
  try {
    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Add user info to request object
    req.user = decoded;
    
    next();
  } catch (error) {
    // Log the error
    logger.logSecurityEvent('INVALID_TOKEN', {
      ip: req.ip,
      path: req.originalUrl,
      method: req.method,
      error: error.message
    });
    
    return res.status(401).json({
      success: false,
      message: 'Token inválido o expirado'
    });
  }
};

// Check if user has required role
const checkRole = (requiredRoles) => {
  return (req, res, next) => {
    // verifyToken middleware should be called before this
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado'
      });
    }
    
    // Check if user role is in the required roles array
    if (!requiredRoles.includes(req.user.role)) {
      // Log unauthorized access attempt
      logger.logSecurityEvent('UNAUTHORIZED_ACCESS', {
        userId: req.user.id,
        userRole: req.user.role,
        requiredRoles: requiredRoles,
        path: req.originalUrl,
        method: req.method
      });
      
      return res.status(403).json({
        success: false,
        message: 'Acceso denegado: no tiene los permisos necesarios'
      });
    }
    
    next();
  };
};

// Exportar ambas funciones directamente
module.exports = {
  verifyToken,
  checkRole
}; 