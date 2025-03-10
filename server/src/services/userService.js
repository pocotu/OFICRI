/**
 * Servicio de usuarios
 * Maneja la lógica de negocio relacionada con los usuarios
 */

const bcrypt = require('bcryptjs');
const { pool } = require('../config/database');
const { NotFoundError, ConflictError, BadRequestError, logger } = require('../utils/utilsExport');

/**
 * Obtiene todos los usuarios
 * @param {Object} filters - Filtros para la consulta
 * @returns {Array} Lista de usuarios
 */
async function getAllUsers(filters = {}) {
    try {
        let query = `
            SELECT 
                u.IDUsuario, u.CodigoCIP, u.Nombres, u.Apellidos, 
                u.Rango, u.IDArea, u.IDRol, u.UltimoAcceso, u.Bloqueado,
                a.NombreArea, r.NombreRol
            FROM Usuario u
            LEFT JOIN AreaEspecializada a ON u.IDArea = a.IDArea
            LEFT JOIN Rol r ON u.IDRol = r.IDRol
        `;
        
        const queryParams = [];
        const whereConditions = [];
        
        // Aplicar filtros si existen
        if (filters.idArea) {
            whereConditions.push('u.IDArea = ?');
            queryParams.push(filters.idArea);
        }
        
        if (filters.idRol) {
            whereConditions.push('u.IDRol = ?');
            queryParams.push(filters.idRol);
        }
        
        if (filters.bloqueado !== undefined) {
            whereConditions.push('u.Bloqueado = ?');
            queryParams.push(filters.bloqueado);
        }
        
        if (whereConditions.length > 0) {
            query += ' WHERE ' + whereConditions.join(' AND ');
        }
        
        // Ordenar resultados
        query += ' ORDER BY u.Apellidos, u.Nombres';
        
        const [users] = await pool.query(query, queryParams);
        
        // Eliminar campos sensibles
        return users.map(user => ({
            ...user,
            PasswordHash: undefined,
            Salt: undefined
        }));
    } catch (error) {
        logger.logError('Error al obtener usuarios', error);
        throw error;
    }
}

/**
 * Obtiene un usuario por su ID
 * @param {number} id - ID del usuario
 * @returns {Object} Datos del usuario
 */
async function getUserById(id) {
    try {
        const [users] = await pool.query(
            `SELECT 
                u.IDUsuario, u.CodigoCIP, u.Nombres, u.Apellidos, 
                u.Rango, u.IDArea, u.IDRol, u.UltimoAcceso, u.Bloqueado,
                a.NombreArea, r.NombreRol
            FROM Usuario u
            LEFT JOIN AreaEspecializada a ON u.IDArea = a.IDArea
            LEFT JOIN Rol r ON u.IDRol = r.IDRol
            WHERE u.IDUsuario = ?`,
            [id]
        );
        
        const user = users[0];
        
        if (!user) {
            throw new NotFoundError(`Usuario con ID ${id} no encontrado`);
        }
        
        // Eliminar campos sensibles
        return {
            ...user,
            PasswordHash: undefined,
            Salt: undefined
        };
    } catch (error) {
        if (error.isOperational) {
            throw error;
        }
        logger.logError(`Error al obtener usuario con ID ${id}`, error);
        throw error;
    }
}

/**
 * Crea un nuevo usuario
 * @param {Object} userData - Datos del usuario a crear
 * @returns {Object} Datos del usuario creado
 */
async function createUser(userData) {
    const { codigoCIP, nombres, apellidos, rango, password, idArea, idRol } = userData;
    
    try {
        // Verificar si el usuario ya existe
        const [existingUsers] = await pool.query(
            'SELECT IDUsuario FROM Usuario WHERE CodigoCIP = ?',
            [codigoCIP]
        );
        
        if (existingUsers.length > 0) {
            throw new ConflictError(`El código CIP ${codigoCIP} ya está registrado`);
        }
        
        // Generar hash de la contraseña
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);
        
        // Insertar usuario
        const [result] = await pool.query(
            `INSERT INTO Usuario (
                CodigoCIP, Nombres, Apellidos, Rango, 
                PasswordHash, Salt, IDArea, IDRol,
                UltimoAcceso, IntentosFallidos, Bloqueado
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), 0, FALSE)`,
            [codigoCIP, nombres, apellidos, rango, passwordHash, salt, idArea, idRol]
        );
        
        logger.info(`Usuario creado: ${codigoCIP} - ${nombres} ${apellidos}`);
        
        // Obtener el usuario creado
        return getUserById(result.insertId);
    } catch (error) {
        if (error.isOperational) {
            throw error;
        }
        logger.logError('Error al crear usuario', error);
        throw new BadRequestError('Error al crear usuario');
    }
}

/**
 * Actualiza un usuario existente
 * @param {number} id - ID del usuario a actualizar
 * @param {Object} userData - Datos actualizados del usuario
 * @returns {Object} Datos del usuario actualizado
 */
async function updateUser(id, userData) {
    try {
        // Verificar si el usuario existe
        const [existingUsers] = await pool.query(
            'SELECT IDUsuario FROM Usuario WHERE IDUsuario = ?',
            [id]
        );
        
        if (existingUsers.length === 0) {
            throw new NotFoundError(`Usuario con ID ${id} no encontrado`);
        }
        
        // Preparar datos para actualización
        const updateData = {};
        const allowedFields = ['Nombres', 'Apellidos', 'Rango', 'IDArea', 'IDRol', 'Bloqueado'];
        
        // Mapear campos del objeto userData a nombres de columnas en la base de datos
        if (userData.nombres) updateData.Nombres = userData.nombres;
        if (userData.apellidos) updateData.Apellidos = userData.apellidos;
        if (userData.rango) updateData.Rango = userData.rango;
        if (userData.idArea) updateData.IDArea = userData.idArea;
        if (userData.idRol) updateData.IDRol = userData.idRol;
        if (userData.bloqueado !== undefined) updateData.Bloqueado = userData.bloqueado;
        
        // Si hay una nueva contraseña, actualizarla
        if (userData.password) {
            const salt = await bcrypt.genSalt(10);
            updateData.PasswordHash = await bcrypt.hash(userData.password, salt);
            updateData.Salt = salt;
        }
        
        // Si no hay datos para actualizar, retornar error
        if (Object.keys(updateData).length === 0) {
            throw new BadRequestError('No se proporcionaron datos para actualizar');
        }
        
        // Construir consulta de actualización
        const setClause = Object.keys(updateData)
            .map(key => `${key} = ?`)
            .join(', ');
        
        const queryParams = [...Object.values(updateData), id];
        
        // Ejecutar actualización
        await pool.query(
            `UPDATE Usuario SET ${setClause} WHERE IDUsuario = ?`,
            queryParams
        );
        
        logger.info(`Usuario actualizado: ID ${id}`);
        
        // Obtener el usuario actualizado
        return getUserById(id);
    } catch (error) {
        if (error.isOperational) {
            throw error;
        }
        logger.logError(`Error al actualizar usuario con ID ${id}`, error);
        throw new BadRequestError('Error al actualizar usuario');
    }
}

/**
 * Elimina un usuario
 * @param {number} id - ID del usuario a eliminar
 * @returns {boolean} true si se eliminó correctamente
 */
async function deleteUser(id) {
    try {
        // Verificar si el usuario existe
        const [existingUsers] = await pool.query(
            'SELECT IDUsuario FROM Usuario WHERE IDUsuario = ?',
            [id]
        );
        
        if (existingUsers.length === 0) {
            throw new NotFoundError(`Usuario con ID ${id} no encontrado`);
        }
        
        // Eliminar usuario
        await pool.query('DELETE FROM Usuario WHERE IDUsuario = ?', [id]);
        
        logger.info(`Usuario eliminado: ID ${id}`);
        
        return true;
    } catch (error) {
        if (error.isOperational) {
            throw error;
        }
        logger.logError(`Error al eliminar usuario con ID ${id}`, error);
        throw error;
    }
}

/**
 * Cambia la contraseña de un usuario
 * @param {number} id - ID del usuario
 * @param {string} currentPassword - Contraseña actual
 * @param {string} newPassword - Nueva contraseña
 * @returns {boolean} true si se cambió correctamente
 */
async function changePassword(id, currentPassword, newPassword) {
    try {
        // Obtener usuario
        const [users] = await pool.query(
            'SELECT IDUsuario, PasswordHash FROM Usuario WHERE IDUsuario = ?',
            [id]
        );
        
        const user = users[0];
        
        if (!user) {
            throw new NotFoundError(`Usuario con ID ${id} no encontrado`);
        }
        
        // Verificar contraseña actual
        const validPassword = await bcrypt.compare(currentPassword, user.PasswordHash);
        
        if (!validPassword) {
            throw new BadRequestError('Contraseña actual incorrecta');
        }
        
        // Generar hash de la nueva contraseña
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(newPassword, salt);
        
        // Actualizar contraseña
        await pool.query(
            'UPDATE Usuario SET PasswordHash = ?, Salt = ? WHERE IDUsuario = ?',
            [passwordHash, salt, id]
        );
        
        logger.info(`Contraseña cambiada para usuario ID ${id}`);
        
        return true;
    } catch (error) {
        if (error.isOperational) {
            throw error;
        }
        logger.logError(`Error al cambiar contraseña para usuario ID ${id}`, error);
        throw new BadRequestError('Error al cambiar contraseña');
    }
}

module.exports = {
    getAllUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser,
    changePassword
}; 