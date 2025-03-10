/**
 * Controlador de usuarios
 * Maneja las solicitudes HTTP relacionadas con los usuarios
 */

const { userService } = require('../services/servicesExport');
const { BadRequestError, logger } = require('../utils/utilsExport');

/**
 * Obtiene todos los usuarios
 * @param {Object} req - Objeto de solicitud Express
 * @param {Object} res - Objeto de respuesta Express
 * @param {Function} next - Función next de Express
 */
async function getAllUsers(req, res, next) {
    try {
        // Extraer filtros de la consulta
        const filters = {
            idArea: req.query.idArea ? parseInt(req.query.idArea) : undefined,
            idRol: req.query.idRol ? parseInt(req.query.idRol) : undefined,
            bloqueado: req.query.bloqueado !== undefined ? req.query.bloqueado === 'true' : undefined
        };
        
        // Llamar al servicio de usuarios
        const users = await userService.getAllUsers(filters);
        
        // Enviar respuesta
        res.json({
            success: true,
            users
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Obtiene un usuario por su ID
 * @param {Object} req - Objeto de solicitud Express
 * @param {Object} res - Objeto de respuesta Express
 * @param {Function} next - Función next de Express
 */
async function getUserById(req, res, next) {
    try {
        const id = parseInt(req.params.id);
        
        if (isNaN(id)) {
            throw new BadRequestError('ID de usuario inválido');
        }
        
        // Llamar al servicio de usuarios
        const user = await userService.getUserById(id);
        
        // Enviar respuesta
        res.json({
            success: true,
            user
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Crea un nuevo usuario
 * @param {Object} req - Objeto de solicitud Express
 * @param {Object} res - Objeto de respuesta Express
 * @param {Function} next - Función next de Express
 */
async function createUser(req, res, next) {
    try {
        const { codigoCIP, nombres, apellidos, rango, password, idArea, idRol } = req.body;
        
        // Validar datos de entrada
        if (!codigoCIP || !nombres || !apellidos || !password || !idArea || !idRol) {
            throw new BadRequestError('Todos los campos son requeridos');
        }
        
        // Llamar al servicio de usuarios
        const user = await userService.createUser({
            codigoCIP,
            nombres,
            apellidos,
            rango,
            password,
            idArea: parseInt(idArea),
            idRol: parseInt(idRol)
        });
        
        // Enviar respuesta
        res.status(201).json({
            success: true,
            user
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Actualiza un usuario existente
 * @param {Object} req - Objeto de solicitud Express
 * @param {Object} res - Objeto de respuesta Express
 * @param {Function} next - Función next de Express
 */
async function updateUser(req, res, next) {
    try {
        const id = parseInt(req.params.id);
        
        if (isNaN(id)) {
            throw new BadRequestError('ID de usuario inválido');
        }
        
        const { nombres, apellidos, rango, password, idArea, idRol, bloqueado } = req.body;
        
        // Preparar datos para actualización
        const userData = {};
        if (nombres !== undefined) userData.nombres = nombres;
        if (apellidos !== undefined) userData.apellidos = apellidos;
        if (rango !== undefined) userData.rango = rango;
        if (password !== undefined) userData.password = password;
        if (idArea !== undefined) userData.idArea = parseInt(idArea);
        if (idRol !== undefined) userData.idRol = parseInt(idRol);
        if (bloqueado !== undefined) userData.bloqueado = bloqueado === true || bloqueado === 'true';
        
        // Llamar al servicio de usuarios
        const user = await userService.updateUser(id, userData);
        
        // Enviar respuesta
        res.json({
            success: true,
            user
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Elimina un usuario
 * @param {Object} req - Objeto de solicitud Express
 * @param {Object} res - Objeto de respuesta Express
 * @param {Function} next - Función next de Express
 */
async function deleteUser(req, res, next) {
    try {
        const id = parseInt(req.params.id);
        
        if (isNaN(id)) {
            throw new BadRequestError('ID de usuario inválido');
        }
        
        // Llamar al servicio de usuarios
        await userService.deleteUser(id);
        
        // Enviar respuesta
        res.json({
            success: true,
            message: 'Usuario eliminado correctamente'
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Cambia la contraseña de un usuario
 * @param {Object} req - Objeto de solicitud Express
 * @param {Object} res - Objeto de respuesta Express
 * @param {Function} next - Función next de Express
 */
async function changePassword(req, res, next) {
    try {
        const id = parseInt(req.params.id);
        const { currentPassword, newPassword } = req.body;
        
        if (isNaN(id)) {
            throw new BadRequestError('ID de usuario inválido');
        }
        
        if (!currentPassword || !newPassword) {
            throw new BadRequestError('Contraseña actual y nueva son requeridas');
        }
        
        // Llamar al servicio de usuarios
        await userService.changePassword(id, currentPassword, newPassword);
        
        // Enviar respuesta
        res.json({
            success: true,
            message: 'Contraseña cambiada correctamente'
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Obtiene el conteo de usuarios
 * @param {Object} req - Objeto de solicitud Express
 * @param {Object} res - Objeto de respuesta Express
 * @param {Function} next - Función next de Express
 */
async function getUserCount(req, res, next) {
    try {
        // Extraer filtros de la consulta
        const filters = {
            bloqueado: req.query.bloqueado === 'false' ? false : undefined
        };
        
        // Llamar al servicio de usuarios
        const users = await userService.getAllUsers(filters);
        
        // Enviar respuesta
        res.json({
            success: true,
            count: users.length
        });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    getAllUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser,
    changePassword,
    getUserCount
}; 