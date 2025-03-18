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
                IDUsuario: user.IDUsuario,
                codigoCIP: user.CodigoCIP,
                rol: user.IDRol,
                permisos: user.Permisos
            },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        // Registrar sesión
        const expirationDate = new Date();
        expirationDate.setDate(expirationDate.getDate() + 1); // 24 horas desde ahora
        
        await pool.query(
            'INSERT INTO Session (IDUsuario, SessionToken, IPOrigen, Expiracion) VALUES (?, ?, ?, ?)',
            [user.IDUsuario, token, '', expirationDate]
        );

        logger.info(`Usuario ${codigoCIP} ha iniciado sesión`);
        
        return {
            success: true,
            token,
            user: {
                id: user.IDUsuario,
                codigoCIP: user.CodigoCIP,
                nombres: user.Nombres,
                apellidos: user.Apellidos,
                grado: user.Grado,
                idRol: user.IDRol,
                permisos: user.Permisos
            }
        };
    } catch (error) {
        logger.error('Error en servicio de login:', error);
        
        if (error instanceof UnauthorizedError) {
            throw error;
        }
        
        throw new Error('Error al iniciar sesión');
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
        
        // Verificar token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Añadir información sobre la expiración
        const now = Math.floor(Date.now() / 1000);
        decoded.expiresInSeconds = decoded.exp - now;
        decoded.needsRenewal = decoded.expiresInSeconds < 3600; // Renovar si queda menos de 1 hora
        
        return decoded;
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            throw new UnauthorizedError('Token inválido');
        }
        if (error.name === 'TokenExpiredError') {
            try {
                // Intentar decodificar el token expirado para obtener info del usuario
                const decoded = jwt.decode(token);
                throw new UnauthorizedError('Token expirado', 'TOKEN_EXPIRED', decoded);
            } catch (e) {
                throw new UnauthorizedError('Token expirado');
            }
        }
        throw error;
    }
}

/**
 * Renueva un token JWT que está por expirar
 * @param {string} oldToken - Token JWT a renovar
 * @returns {Promise<Object>} Nuevo token y datos del usuario
 */
async function renewToken(oldToken) {
    try {
        // Intentar decodificar el token sin verificar
        let userData;
        try {
            // Si el token es válido, lo decodificamos normalmente
            userData = jwt.verify(oldToken, process.env.JWT_SECRET);
        } catch (error) {
            // Si el token expiró, lo decodificamos sin verificar
            if (error.name === 'TokenExpiredError') {
                userData = jwt.decode(oldToken);
            } else {
                throw new UnauthorizedError('Token inválido para renovación');
            }
        }
        
        if (!userData || !userData.id) {
            throw new UnauthorizedError('Token inválido para renovación');
        }
        
        // Verificar si el usuario existe y no está bloqueado
        const [users] = await pool.query(
            'SELECT * FROM Usuario WHERE IDUsuario = ? AND Bloqueado = FALSE',
            [userData.id]
        );
        
        if (users.length === 0) {
            throw new UnauthorizedError('Usuario no encontrado o bloqueado');
        }
        
        // Generar nuevo token
        const newToken = jwt.sign(
            {
                id: userData.id,
                IDUsuario: userData.id,
                codigoCIP: userData.codigoCIP,
                rol: userData.rol,
                permisos: userData.permisos
            },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );
        
        // Actualizar sesión en la base de datos
        const expirationDate = new Date();
        expirationDate.setDate(expirationDate.getDate() + 1); // 24 horas desde ahora
        
        // Marcar el token antiguo como expirado
        await pool.query(
            'UPDATE Session SET Expiracion = CURRENT_TIMESTAMP WHERE SessionToken = ?',
            [oldToken]
        );
        
        // Crear una nueva sesión con el nuevo token
        await pool.query(
            'INSERT INTO Session (IDUsuario, SessionToken, IPOrigen, Expiracion) VALUES (?, ?, ?, ?)',
            [userData.id, newToken, '', expirationDate]
        );
        
        logger.info(`Token renovado para usuario ID ${userData.id}`);
        
        return {
            success: true,
            token: newToken,
            user: {
                id: userData.id,
                codigoCIP: userData.codigoCIP,
                rol: userData.rol,
                permisos: userData.permisos
            }
        };
    } catch (error) {
        logger.error('Error al renovar token:', error);
        throw error;
    }
}

module.exports = {
    login,
    logout,
    verifyToken,
    renewToken
}; 