/**
 * Servicio de autenticación
 * Maneja la lógica de negocio relacionada con la autenticación de usuarios
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');
const { UnauthorizedError, BadRequestError, logger } = require('../utils/utilsExport');

/**
 * Autentica a un usuario con su código CIP y contraseña
 * @param {string} codigoCIP - Código CIP del usuario
 * @param {string} password - Contraseña del usuario
 * @returns {Object} Datos del usuario y token JWT
 */
async function login(codigoCIP, password) {
    try {
        // Buscar usuario por código CIP
        const [users] = await pool.query(
            `SELECT u.*, r.Permisos 
             FROM Usuario u 
             LEFT JOIN Rol r ON u.IDRol = r.IDRol 
             WHERE u.CodigoCIP = ?`,
            [codigoCIP]
        );

        const user = users[0];

        if (!user) {
            throw new UnauthorizedError('Credenciales inválidas');
        }

        // Verificar si el usuario está bloqueado
        if (user.Bloqueado) {
            throw new UnauthorizedError('Usuario bloqueado. Contacte al administrador', 'USER_BLOCKED');
        }

        // Verificar contraseña
        const validPassword = await bcrypt.compare(password, user.PasswordHash);

        if (!validPassword) {
            // Incrementar intentos fallidos
            await pool.query(
                'UPDATE Usuario SET IntentosFallidos = IntentosFallidos + 1 WHERE IDUsuario = ?',
                [user.IDUsuario]
            );

            // Verificar si debe ser bloqueado
            if (user.IntentosFallidos + 1 >= parseInt(process.env.MAX_LOGIN_ATTEMPTS)) {
                await pool.query(
                    'UPDATE Usuario SET Bloqueado = TRUE, UltimoBloqueo = CURRENT_TIMESTAMP WHERE IDUsuario = ?',
                    [user.IDUsuario]
                );
                logger.warn(`Usuario ${codigoCIP} bloqueado por múltiples intentos fallidos`);
            }

            throw new UnauthorizedError('Credenciales inválidas');
        }

        // Resetear intentos fallidos y actualizar último acceso
        await pool.query(
            'UPDATE Usuario SET IntentosFallidos = 0, UltimoAcceso = CURRENT_TIMESTAMP WHERE IDUsuario = ?',
            [user.IDUsuario]
        );

        // Generar token JWT
        const token = jwt.sign(
            {
                id: user.IDUsuario,
                codigoCIP: user.CodigoCIP,
                rol: user.IDRol,
                permisos: user.Permisos
            },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        // Registrar sesión
        await pool.query(
            'INSERT INTO Session (IDUsuario, SessionToken, IPOrigen) VALUES (?, ?, ?)',
            [user.IDUsuario, token, '']
        );

        logger.info(`Usuario ${codigoCIP} ha iniciado sesión`);

        // Retornar datos del usuario y token
        return {
            token,
            user: {
                id: user.IDUsuario,
                codigoCIP: user.CodigoCIP,
                nombres: user.Nombres,
                apellidos: user.Apellidos,
                grado: user.Grado,
                idArea: user.IDArea,
                idRol: user.IDRol,
                permisos: user.Permisos
            }
        };
    } catch (error) {
        // Reenviar errores operacionales
        if (error.isOperational) {
            throw error;
        }
        
        // Loguear y convertir errores no operacionales
        logger.logError('Error en el servicio de autenticación', error);
        throw new UnauthorizedError('Error al procesar la solicitud de inicio de sesión');
    }
}

/**
 * Cierra la sesión de un usuario
 * @param {string} token - Token JWT del usuario
 */
async function logout(token) {
    try {
        if (token) {
            await pool.query(
                'UPDATE Session SET Expiracion = CURRENT_TIMESTAMP WHERE SessionToken = ?',
                [token]
            );
            logger.info('Sesión cerrada correctamente');
        }
        return { success: true };
    } catch (error) {
        logger.logError('Error al cerrar sesión', error);
        throw new Error('Error al cerrar sesión');
    }
}

/**
 * Verifica si un token JWT es válido
 * @param {string} token - Token JWT a verificar
 * @returns {Object} Datos del usuario decodificados del token
 */
function verifyToken(token) {
    try {
        if (!token) {
            throw new UnauthorizedError('No se proporcionó token de autenticación');
        }
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        return decoded;
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            throw new UnauthorizedError('Token inválido');
        }
        if (error.name === 'TokenExpiredError') {
            throw new UnauthorizedError('Token expirado');
        }
        throw error;
    }
}

module.exports = {
    login,
    logout,
    verifyToken
}; 