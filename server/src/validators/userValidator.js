/**
 * Validador de usuarios
 * Proporciona funciones de validación para las rutas de usuarios
 */

const { BadRequestError } = require('../utils/utilsExport');

/**
 * Valida los datos para crear un usuario
 * @param {Object} req - Objeto de solicitud Express
 * @param {Object} res - Objeto de respuesta Express
 * @param {Function} next - Función next de Express
 */
function validateCreateUser(req, res, next) {
    const { codigoCIP, nombres, apellidos, grado, password, idArea, idRol } = req.body;
    
    // Validar que se proporcionen los campos requeridos
    if (!codigoCIP || !nombres || !apellidos || !grado || !password || !idArea || !idRol) {
        return next(new BadRequestError('Todos los campos son requeridos'));
    }
    
    // Validar formato del código CIP (solo números y longitud entre 6 y 8)
    if (!/^\d{6,8}$/.test(codigoCIP)) {
        return next(new BadRequestError('Formato de código CIP inválido'));
    }
    
    // Validar longitud de nombres y apellidos
    if (nombres.length < 2 || apellidos.length < 2) {
        return next(new BadRequestError('Nombres y apellidos deben tener al menos 2 caracteres'));
    }
    
    // Validar longitud de la contraseña
    if (password.length < 6) {
        return next(new BadRequestError('La contraseña debe tener al menos 6 caracteres'));
    }
    
    // Validar que idArea e idRol sean números
    if (isNaN(parseInt(idArea)) || isNaN(parseInt(idRol))) {
        return next(new BadRequestError('Área y rol deben ser números válidos'));
    }
    
    next();
}

/**
 * Valida los datos para actualizar un usuario
 * @param {Object} req - Objeto de solicitud Express
 * @param {Object} res - Objeto de respuesta Express
 * @param {Function} next - Función next de Express
 */
function validateUpdateUser(req, res, next) {
    const { nombres, apellidos, grado, password, idArea, idRol, bloqueado } = req.body;
    
    // Validar que se proporcione al menos un campo para actualizar
    if (!nombres && !apellidos && !grado && !password && idArea === undefined && idRol === undefined && bloqueado === undefined) {
        return next(new BadRequestError('Debe proporcionar al menos un campo para actualizar'));
    }
    
    // Validar longitud de nombres y apellidos si se proporcionan
    if (nombres && nombres.length < 2) {
        return next(new BadRequestError('Nombres debe tener al menos 2 caracteres'));
    }
    
    if (apellidos && apellidos.length < 2) {
        return next(new BadRequestError('Apellidos debe tener al menos 2 caracteres'));
    }
    
    // Validar longitud de la contraseña si se proporciona
    if (password && password.length < 6) {
        return next(new BadRequestError('La contraseña debe tener al menos 6 caracteres'));
    }
    
    // Validar que idArea e idRol sean números si se proporcionan
    if (idArea !== undefined && isNaN(parseInt(idArea))) {
        return next(new BadRequestError('Área debe ser un número válido'));
    }
    
    if (idRol !== undefined && isNaN(parseInt(idRol))) {
        return next(new BadRequestError('Rol debe ser un número válido'));
    }
    
    // Validar que bloqueado sea un booleano si se proporciona
    if (bloqueado !== undefined && typeof bloqueado !== 'boolean' && bloqueado !== 'true' && bloqueado !== 'false') {
        return next(new BadRequestError('Bloqueado debe ser un valor booleano'));
    }
    
    next();
}

/**
 * Valida los datos para cambiar la contraseña
 * @param {Object} req - Objeto de solicitud Express
 * @param {Object} res - Objeto de respuesta Express
 * @param {Function} next - Función next de Express
 */
function validateChangePassword(req, res, next) {
    const { currentPassword, newPassword } = req.body;
    
    // Validar que se proporcionen los campos requeridos
    if (!currentPassword || !newPassword) {
        return next(new BadRequestError('Contraseña actual y nueva son requeridas'));
    }
    
    // Validar longitud de las contraseñas
    if (currentPassword.length < 6) {
        return next(new BadRequestError('La contraseña actual debe tener al menos 6 caracteres'));
    }
    
    if (newPassword.length < 6) {
        return next(new BadRequestError('La nueva contraseña debe tener al menos 6 caracteres'));
    }
    
    // Validar que las contraseñas sean diferentes
    if (currentPassword === newPassword) {
        return next(new BadRequestError('La nueva contraseña debe ser diferente a la actual'));
    }
    
    next();
}

/**
 * Valida el ID de usuario en los parámetros
 * @param {Object} req - Objeto de solicitud Express
 * @param {Object} res - Objeto de respuesta Express
 * @param {Function} next - Función next de Express
 */
function validateUserId(req, res, next) {
    const id = parseInt(req.params.id);
    
    if (isNaN(id) || id <= 0) {
        return next(new BadRequestError('ID de usuario inválido'));
    }
    
    next();
}

module.exports = {
    validateCreateUser,
    validateUpdateUser,
    validateChangePassword,
    validateUserId
}; 