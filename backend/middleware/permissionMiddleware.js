const permissionService = require('../services/permissionService');

/**
 * Factory function that creates middleware to check for specific permissions
 * Follows Open/Closed Principle - extendable without modification
 * 
 * @param {number} requiredPermission - The permission bit to check for
 * @returns {Function} Middleware function
 */
const requirePermission = (requiredPermission) => {
  return async (req, res, next) => {
    try {
      // Check if user exists in request (set by authMiddleware)
      if (!req.user || !req.user.IDUsuario) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      // Check if user has required permission
      const hasPermission = await permissionService.hasPermission(
        req.user.IDUsuario,
        requiredPermission
      );

      if (!hasPermission) {
        // Log unauthorized access attempt
        await permissionService.logUnauthorizedAccess(
          req.user.IDUsuario,
          'RECURSO',
          0,
          'ACCESO',
          req.ip
        );

        return res.status(403).json({ message: 'Permission denied' });
      }

      // User has permission, proceed
      next();
    } catch (error) {
      console.error('Permission check error:', error);
      return res.status(500).json({ message: 'Error checking permissions' });
    }
  };
};

/**
 * Factory function that creates middleware to check for contextual permissions
 * 
 * @param {string} tipoRecurso - Type of resource (DOCUMENTO, USUARIO, AREA)
 * @param {string} accion - Action (CREAR, EDITAR, ELIMINAR, etc)
 * @param {Function} idExtractor - Function to extract resource ID from request
 * @returns {Function} Middleware function
 */
const requireContextualPermission = (tipoRecurso, accion, idExtractor) => {
  return async (req, res, next) => {
    try {
      // Check if user exists in request (set by authMiddleware)
      if (!req.user || !req.user.IDUsuario) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      // Extract resource ID using the provided extractor function
      const idRecurso = idExtractor(req);
      
      // Check contextual permission
      const hasPermission = await permissionService.hasContextualPermission(
        req.user.IDUsuario,
        tipoRecurso,
        idRecurso,
        accion
      );

      if (!hasPermission) {
        // Log unauthorized access attempt
        await permissionService.logUnauthorizedAccess(
          req.user.IDUsuario,
          tipoRecurso,
          idRecurso,
          accion,
          req.ip
        );

        return res.status(403).json({ message: 'Permission denied' });
      }

      // User has permission, proceed
      next();
    } catch (error) {
      console.error('Contextual permission check error:', error);
      return res.status(500).json({ message: 'Error checking permissions' });
    }
  };
};

module.exports = {
  requirePermission,
  requireContextualPermission,
  // Export predefined middleware for common permissions
  requireAdmin: requirePermission(permissionService.PERMISSION_BITS.ADMIN),
  requireCreate: requirePermission(permissionService.PERMISSION_BITS.CREAR),
  requireEdit: requirePermission(permissionService.PERMISSION_BITS.EDITAR),
  requireDelete: requirePermission(permissionService.PERMISSION_BITS.ELIMINAR),
  requireView: requirePermission(permissionService.PERMISSION_BITS.VER)
}; 