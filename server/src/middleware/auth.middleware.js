/**
 * Middleware de autenticación
 * Verifica que el usuario esté autenticado antes de permitir el acceso a rutas protegidas
 */

const { authService } = require('../services/servicesExport');
const { UnauthorizedError, ForbiddenError, logger } = require('../utils/utilsExport');

/**
 * Middleware para verificar autenticación
 * @param {Object} req - Objeto de solicitud Express
 * @param {Object} res - Objeto de respuesta Express
 * @param {Function} next - Función next de Express
 */
const authMiddleware = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        
        // Verificar token
        const decoded = authService.verifyToken(token);
        
        // Añadir usuario a la solicitud
        req.user = decoded;
        next();
    } catch (error) {
        next(error);
    }
};

/**
 * Middleware para verificar permisos
 * @param {number} requiredPermission - Permiso requerido (bit)
 * @returns {Function} Middleware de Express
 */
const hasPermission = (requiredPermission) => {
    return (req, res, next) => {
        try {
            // Verificar que el usuario esté autenticado
            if (!req.user) {
                throw new UnauthorizedError('Usuario no autenticado');
            }
            
            // Verificar permisos
            const userPermissions = req.user.permisos || 0;
            
            if ((userPermissions & requiredPermission) !== requiredPermission) {
                logger.warn(`Acceso denegado: Usuario ${req.user.id} intentó acceder a una ruta protegida sin los permisos necesarios`);
                throw new ForbiddenError('No tiene permisos para realizar esta acción');
            }
            
            next();
        } catch (error) {
            next(error);
        }
    };
};

/**
 * Middleware para verificar rol
 * @param {Array} allowedRoles - Roles permitidos
 * @returns {Function} Middleware de Express
 */
const hasRole = (allowedRoles) => {
    return (req, res, next) => {
        try {
            // Verificar que el usuario esté autenticado
            if (!req.user) {
                throw new UnauthorizedError('Usuario no autenticado');
            }
            
            // Verificar rol
            const userRole = req.user.rol;
            
            if (!allowedRoles.includes(userRole)) {
                logger.warn(`Acceso denegado: Usuario ${req.user.id} con rol ${userRole} intentó acceder a una ruta restringida`);
                throw new ForbiddenError('No tiene el rol necesario para acceder a este recurso');
            }
            
            next();
        } catch (error) {
            next(error);
        }
    };
};

module.exports = {
    authMiddleware,
    hasPermission,
    hasRole
}; 