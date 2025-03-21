/**
 * Middleware de autenticación
 * Implementa la autenticación y autorización de usuarios
 */

const jwt = require('jsonwebtoken');
const { logger } = require('../utils/logger');

/**
 * Configuración de JWT
 */
const jwtConfig = {
  secret: process.env.JWT_SECRET || 'your-secret-key',
  expiresIn: '24h',
  algorithm: 'HS256'
};

// Middleware de autenticación básico
const authMiddleware = (req, res, next) => {
  // Ignorar rutas públicas
  if (req.path === '/health' || req.path === '/api/health' || req.path.startsWith('/api/auth/')) {
    return next();
  }

  // Obtener token
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: {
        message: 'No autorizado - Token no proporcionado'
      }
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    // Verificar token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    logger.error('Error al verificar token:', error);
    return res.status(401).json({
      error: {
        message: 'No autorizado - Token inválido'
      }
    });
  }
};

/**
 * Middleware para verificar roles
 */
const checkRole = (...roles) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: 'Usuario no autenticado',
          timestamp: new Date().toISOString()
        });
      }

      if (!roles.includes(req.user.role)) {
        logger.warn('Acceso no autorizado:', {
          userId: req.user.id,
          role: req.user.role,
          requiredRoles: roles,
          path: req.path,
          method: req.method,
          timestamp: new Date().toISOString()
        });

        return res.status(403).json({
          error: 'Acceso no autorizado',
          timestamp: new Date().toISOString()
        });
      }

      next();
    } catch (error) {
      logger.error('Error al verificar roles:', {
        error: error.message,
        userId: req.user?.id,
        path: req.path,
        method: req.method,
        timestamp: new Date().toISOString()
      });

      res.status(500).json({
        error: 'Error al verificar roles',
        timestamp: new Date().toISOString()
      });
    }
  };
};

/**
 * Middleware para verificar permisos
 */
const checkPermissions = (...permissions) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: 'Usuario no autenticado',
          timestamp: new Date().toISOString()
        });
      }

      const hasPermission = permissions.every(permission =>
        req.user.permissions.includes(permission)
      );

      if (!hasPermission) {
        logger.warn('Permisos insuficientes:', {
          userId: req.user.id,
          permissions: req.user.permissions,
          requiredPermissions: permissions,
          path: req.path,
          method: req.method,
          timestamp: new Date().toISOString()
        });

        return res.status(403).json({
          error: 'Permisos insuficientes',
          timestamp: new Date().toISOString()
        });
      }

      next();
    } catch (error) {
      logger.error('Error al verificar permisos:', {
        error: error.message,
        userId: req.user?.id,
        path: req.path,
        method: req.method,
        timestamp: new Date().toISOString()
      });

      res.status(500).json({
        error: 'Error al verificar permisos',
        timestamp: new Date().toISOString()
      });
    }
  };
};

/**
 * Middleware para verificar propiedad de recursos
 */
const checkResourceOwnership = (resourceType) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: 'Usuario no autenticado',
          timestamp: new Date().toISOString()
        });
      }

      const resource = await getResource(resourceType, req.params.id);

      if (!resource) {
        return res.status(404).json({
          error: 'Recurso no encontrado',
          timestamp: new Date().toISOString()
        });
      }

      // Permitir acceso a administradores
      if (req.user.role === 'admin') {
        return next();
      }

      // Verificar propiedad
      if (resource.userId !== req.user.id) {
        logger.warn('Acceso no autorizado a recurso:', {
          userId: req.user.id,
          resourceId: req.params.id,
          resourceType,
          path: req.path,
          method: req.method,
          timestamp: new Date().toISOString()
        });

        return res.status(403).json({
          error: 'No autorizado para acceder a este recurso',
          timestamp: new Date().toISOString()
        });
      }

      next();
    } catch (error) {
      logger.error('Error al verificar propiedad de recurso:', {
        error: error.message,
        userId: req.user?.id,
        resourceType,
        resourceId: req.params.id,
        path: req.path,
        method: req.method,
        timestamp: new Date().toISOString()
      });

      res.status(500).json({
        error: 'Error al verificar propiedad de recurso',
        timestamp: new Date().toISOString()
      });
    }
  };
};

/**
 * Función auxiliar para obtener recursos
 */
const getResource = async (type, id) => {
  // Aquí se implementaría la lógica para obtener el recurso
  // según el tipo (documento, área, etc.)
  // Por ahora retornamos null
  return null;
};

module.exports = {
  authMiddleware,
  checkRole,
  checkPermissions,
  checkResourceOwnership
}; 