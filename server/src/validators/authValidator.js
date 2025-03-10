/**
 * Validador de autenticación
 * Proporciona funciones de validación para las rutas de autenticación
 */

const { BadRequestError } = require('../utils/utilsExport');

/**
 * Valida los datos de inicio de sesión
 * @param {Object} req - Objeto de solicitud Express
 * @param {Object} res - Objeto de respuesta Express
 * @param {Function} next - Función next de Express
 */
function validateLogin(req, res, next) {
    const { codigoCIP, password } = req.body;
    
    // Validar que se proporcionen los campos requeridos
    if (!codigoCIP || !password) {
        return next(new BadRequestError('Código CIP y contraseña son requeridos'));
    }
    
    // Validar formato del código CIP (solo números y longitud entre 6 y 8)
    if (!/^\d{6,8}$/.test(codigoCIP)) {
        return next(new BadRequestError('Formato de código CIP inválido'));
    }
    
    // Validar longitud de la contraseña
    if (password.length < 6) {
        return next(new BadRequestError('La contraseña debe tener al menos 6 caracteres'));
    }
    
    next();
}

module.exports = {
    validateLogin
}; 