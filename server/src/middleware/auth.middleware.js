/**
 * Middleware de autenticación
 * Verifica que el usuario esté autenticado antes de permitir el acceso a rutas protegidas
 */

const { authService } = require('../services/servicesExport');
const { pool } = require('../config/database');
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
        
        if (!token) {
            throw new UnauthorizedError('Token no proporcionado');
        }

        // Verificar token en JWT
        const decoded = authService.verifyToken(token);
        
        // Verificar si el token existe en la base de datos y no ha expirado
        const [sessions] = await pool.query(
            'SELECT * FROM Session WHERE SessionToken = ? AND Expiracion IS NULL',
            [token]
        );
        
        if (sessions.length === 0) {
            throw new UnauthorizedError('Sesión inválida o expirada');
        }

        // Verificar si el usuario está bloqueado
        const [users] = await pool.query(
            'SELECT Bloqueado FROM Usuario WHERE IDUsuario = ?',
            [decoded.id]
        );

        if (users.length === 0 || users[0].Bloqueado) {
            throw new UnauthorizedError('Usuario bloqueado o eliminado');
        }
        
        // Añadir usuario a la solicitud
        req.user = decoded;
        next();
    } catch (error) {
        logger.error('Error de autenticación:', error);
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