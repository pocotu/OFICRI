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
            return res.status(401).json({
                success: false,
                message: 'Token no proporcionado'
            });
        }

        try {
            // Verificar token en JWT
            const decoded = authService.verifyToken(token);
            
            // Si el token está próximo a expirar (menos de 30 minutos), añadir header de renovación
            if (decoded.expiresInSeconds < 1800) { // menos de 30 minutos
                res.set('X-Token-Renew', 'true');
                res.set('X-Token-Expires-In', decoded.expiresInSeconds);
                
                logger.info(`Token próximo a expirar para usuario ${decoded.id} - ${Math.floor(decoded.expiresInSeconds / 60)} minutos restantes`);
            }
            
            // Log de datos decodificados para depuración
            logger.debug('Decoded token data:', decoded);
            
            // Verificar si el token existe en la base de datos y no ha expirado
            const [sessions] = await pool.query(
                'SELECT * FROM Session WHERE SessionToken = ? AND (Expiracion IS NULL OR Expiracion > NOW())',
                [token]
            );
            
            if (sessions.length === 0) {
                return res.status(401).json({
                    success: false,
                    message: 'Sesión inválida o expirada',
                    code: 'SESSION_EXPIRED'
                });
            }

            // Verificar si el usuario está bloqueado
            const [users] = await pool.query(
                'SELECT IDUsuario, Bloqueado FROM Usuario WHERE IDUsuario = ?',
                [decoded.id]
            );

            if (users.length === 0 || users[0].Bloqueado) {
                return res.status(401).json({
                    success: false,
                    message: 'Usuario bloqueado o eliminado',
                    code: 'USER_BLOCKED'
                });
            }
            
            // Asegurarse de que los datos del usuario sean correctos
            if (decoded.id !== undefined) {
                // Para compatibilidad, asegurarse de que tanto id como IDUsuario estén disponibles
                decoded.IDUsuario = decoded.id;
            } else if (decoded.IDUsuario !== undefined) {
                decoded.id = decoded.IDUsuario;
            }
            
            // Añadir usuario a la solicitud
            req.user = decoded;
            
            logger.debug('User data added to request:', req.user);
            
            next();
        } catch (error) {
            logger.error('Error al verificar token:', error);
            
            // Manejar específicamente los errores de JWT
            if (error.name === 'TokenExpiredError' || 
                (error instanceof UnauthorizedError && error.code === 'TOKEN_EXPIRED')) {
                return res.status(401).json({
                    success: false,
                    message: 'Token expirado',
                    code: 'TOKEN_EXPIRED',
                    renewalEndpoint: '/api/auth/renew-token'
                });
            } else if (error.name === 'JsonWebTokenError') {
                return res.status(401).json({
                    success: false,
                    message: 'Token inválido',
                    code: 'TOKEN_INVALID'
                });
            }
            
            // Cualquier otro error
            return res.status(401).json({
                success: false,
                message: 'Error de autenticación',
                code: 'AUTH_ERROR'
            });
        }
    } catch (error) {
        logger.error('Error de autenticación:', error);
        return res.status(500).json({
            success: false,
            message: 'Error interno del servidor en el proceso de autenticación'
        });
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