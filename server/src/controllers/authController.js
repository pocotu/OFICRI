/**
 * Controlador de autenticación
 * Maneja las solicitudes HTTP relacionadas con la autenticación
 */

const { authService } = require('../services/servicesExport');
const { BadRequestError, logger } = require('../utils/utilsExport');

/**
 * Maneja la solicitud de inicio de sesión
 * @param {Object} req - Objeto de solicitud Express
 * @param {Object} res - Objeto de respuesta Express
 * @param {Function} next - Función next de Express
 */
async function login(req, res, next) {
    try {
        const { codigoCIP, password } = req.body;
        
        // Validar datos de entrada
        if (!codigoCIP || !password) {
            throw new BadRequestError('Código CIP y contraseña son requeridos');
        }
        
        // Llamar al servicio de autenticación
        const result = await authService.login(codigoCIP, password);
        
        // Enviar respuesta
        res.json({
            success: true,
            ...result
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Maneja la solicitud de cierre de sesión
 * @param {Object} req - Objeto de solicitud Express
 * @param {Object} res - Objeto de respuesta Express
 * @param {Function} next - Función next de Express
 */
async function logout(req, res, next) {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        
        // Llamar al servicio de autenticación
        await authService.logout(token);
        
        // Enviar respuesta
        res.json({
            success: true,
            message: 'Sesión cerrada correctamente'
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Verifica si el usuario está autenticado
 * @param {Object} req - Objeto de solicitud Express
 * @param {Object} res - Objeto de respuesta Express
 * @param {Function} next - Función next de Express
 */
function checkAuth(req, res, next) {
    try {
        // El middleware de autenticación ya ha verificado el token
        // y ha añadido el usuario a req.user
        res.json({
            success: true,
            user: req.user
        });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    login,
    logout,
    checkAuth
}; 