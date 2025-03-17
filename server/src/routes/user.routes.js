/**
 * Rutas de usuarios
 * Define las rutas relacionadas con la gestión de usuarios
 */

const express = require('express');
const router = express.Router();
const { userController } = require('../controllers/controllersExport');
const { userValidator } = require('../validators/validatorsExport');
const { authMiddleware, hasPermission } = require('../middleware/middlewareExport');
const { pool } = require('../config/database');

// Constantes para permisos
const PERMISSION = {
    VIEW: 8,    // 1000 en binario
    CREATE: 1,  // 0001 en binario
    EDIT: 2,    // 0010 en binario
    DELETE: 4   // 0100 en binario
};

// Ruta para obtener un perfil de usuario simple (para propósitos de diagnóstico)
// NOTA: Este endpoint es temporal y debe ser reemplazado por una versión segura
router.get('/public-profile/:cip', async (req, res) => {
    try {
        const codigoCIP = req.params.cip;
        console.log('Accediendo a perfil público para CIP:', codigoCIP);
        
        // Validación básica
        if (!codigoCIP || codigoCIP.length < 6) {
            return res.status(400).json({ 
                success: false, 
                message: 'El código CIP es inválido' 
            });
        }
        
        try {
            // Verificar estructura de la tabla Usuario
            console.log('Verificando estructura de la tabla Usuario...');
            
            const [columnsInfo] = await pool.query(`
                SHOW COLUMNS FROM Usuario
            `);
            
            console.log('Columnas de la tabla Usuario:', columnsInfo.map(col => col.Field).join(', '));
            
            // 1. Consulta principal con información del usuario
            const [users] = await pool.query(`
                SELECT 
                    u.IDUsuario, u.CodigoCIP, u.Nombres, u.Apellidos, 
                    u.IDArea, u.IDRol, u.UltimoAcceso
                FROM 
                    Usuario u
                WHERE 
                    u.CodigoCIP = ?
            `, [codigoCIP]);
            
            if (users.length === 0) {
                console.log(`Usuario no encontrado para CIP: ${codigoCIP}`);
                return res.status(404).json({
                    success: false,
                    message: 'Usuario no encontrado en la base de datos.'
                });
            }
            
            // 2. Usuario encontrado, obtener información adicional
            const userData = users[0];
            console.log(`Usuario encontrado para CIP: ${codigoCIP}, ID: ${userData.IDUsuario}`);
            
            // 3. Obtener información del área
            try {
                const [areaInfo] = await pool.query(`
                    SELECT NombreArea 
                    FROM AreaEspecializada 
                    WHERE IDArea = ?
                `, [userData.IDArea]);
                
                if (areaInfo.length > 0) {
                    userData.NombreArea = areaInfo[0].NombreArea;
                }
            } catch (areaError) {
                console.log(`Error al obtener área: ${areaError.message}`);
            }
            
            // 4. Obtener información del rol
            try {
                const [rolInfo] = await pool.query(`
                    SELECT NombreRol, Permisos 
                    FROM Rol 
                    WHERE IDRol = ?
                `, [userData.IDRol]);
                
                if (rolInfo.length > 0) {
                    userData.NombreRol = rolInfo[0].NombreRol;
                    userData.Permisos = rolInfo[0].Permisos;
                }
            } catch (rolError) {
                console.log(`Error al obtener rol: ${rolError.message}`);
            }
            
            // 5. Obtener información de grado/rango
            try {
                const [gradoInfo] = await pool.query(`
                    SELECT Rango 
                    FROM Usuario 
                    WHERE IDUsuario = ?
                `, [userData.IDUsuario]);
                
                if (gradoInfo.length > 0 && gradoInfo[0].Rango) {
                    userData.Grado = gradoInfo[0].Rango;
                } else {
                    // Verificar si la columna se llama Grado
                    const [gradoAlternativo] = await pool.query(`
                        SELECT Grado 
                        FROM Usuario 
                        WHERE IDUsuario = ?
                    `, [userData.IDUsuario]);
                    
                    if (gradoAlternativo.length > 0) {
                        userData.Grado = gradoAlternativo[0].Grado;
                    }
                }
            } catch (gradoError) {
                console.log(`Error al obtener grado: ${gradoError.message}`);
            }
            
            // 6. Obtener estadísticas adicionales
            try {
                const [documentStats] = await pool.query(`
                    SELECT 
                        COUNT(CASE WHEN Estado = 'PENDIENTE' THEN 1 END) as documentosPendientes,
                        COUNT(CASE WHEN Estado = 'PROCESADO' THEN 1 END) as documentosProcesados,
                        COUNT(*) as documentosTotal
                    FROM 
                        Documento
                    WHERE 
                        IDUsuarioCreador = ? OR IDUsuarioAsignado = ?
                `, [userData.IDUsuario, userData.IDUsuario]);
                
                if (documentStats.length > 0) {
                    userData.estadisticas = documentStats[0];
                }
            } catch (statsError) {
                console.log(`Error al obtener estadísticas: ${statsError.message}`);
            }
            
            // 7. Obtener últimos accesos
            try {
                const [accessLogs] = await pool.query(`
                    SELECT 
                        TipoEvento, FechaEvento, IPOrigen, DispositivoInfo, Exitoso
                    FROM 
                        UsuarioLog
                    WHERE 
                        IDUsuario = ? AND TipoEvento = 'LOGIN' 
                    ORDER BY 
                        FechaEvento DESC
                    LIMIT 5
                `, [userData.IDUsuario]);
                
                if (accessLogs.length > 0) {
                    userData.accesos = accessLogs;
                }
            } catch (logsError) {
                console.log(`Error al obtener logs de acceso: ${logsError.message}`);
            }
            
            console.log('Datos finales del usuario:', JSON.stringify(userData, null, 2));
            return res.json({
                success: true,
                user: userData
            });
        } catch (dbError) {
            console.error('Error en consulta de base de datos:', dbError);
            
            return res.status(500).json({
                success: false,
                message: 'Error al consultar la base de datos',
                errorDetails: process.env.NODE_ENV === 'development' ? dbError.message : 'Error interno del servidor'
            });
        }
    } catch (error) {
        console.error('Error al obtener perfil público:', error);
        
        return res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            errorDetails: process.env.NODE_ENV === 'development' ? error.message : 'Error interno del servidor'
        });
    }
});

// Ruta para obtener todos los usuarios
router.get('/', 
    authMiddleware, 
    hasPermission(PERMISSION.VIEW), 
    userController.getAllUsers
);

// Ruta para obtener el conteo de usuarios
router.get('/count', 
    authMiddleware, 
    hasPermission(PERMISSION.VIEW), 
    userController.getUserCount
);

// Ruta para obtener un usuario por su ID
router.get('/:id', 
    authMiddleware, 
    hasPermission(PERMISSION.VIEW), 
    userValidator.validateUserId, 
    userController.getUserById
);

// Ruta para crear un usuario
router.post('/', 
    authMiddleware, 
    hasPermission(PERMISSION.CREATE), 
    userValidator.validateCreateUser, 
    userController.createUser
);

// Ruta para actualizar un usuario
router.put('/:id', 
    authMiddleware, 
    hasPermission(PERMISSION.EDIT), 
    userValidator.validateUserId, 
    userValidator.validateUpdateUser, 
    userController.updateUser
);

// Ruta para eliminar un usuario
router.delete('/:id', 
    authMiddleware, 
    hasPermission(PERMISSION.DELETE), 
    userValidator.validateUserId, 
    userController.deleteUser
);

// Ruta para cambiar la contraseña
router.post('/:id/change-password', 
    authMiddleware, 
    userValidator.validateUserId, 
    userValidator.validateChangePassword, 
    userController.changePassword
);

module.exports = router; 