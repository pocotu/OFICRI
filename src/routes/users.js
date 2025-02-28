const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../config/database');

// Obtener todos los usuarios
router.get('/', async (req, res) => {
    try {
        const [users] = await db.query(`
            SELECT 
                u.IDUsuario,
                u.Username,
                u.UltimoAcceso,
                u.IntentosFallidos,
                u.Bloqueado,
                a.IDArea,
                a.NombreArea,
                a.CodigoIdentificacion as AreaCodigo,
                a.IsActive as AreaActiva,
                r.IDRol,
                r.NombreRol,
                r.NivelAcceso,
                r.PuedeCrear,
                r.PuedeEditar,
                r.PuedeDerivar,
                r.PuedeAuditar
            FROM Usuario u 
            INNER JOIN AreaEspecializada a ON u.IDArea = a.IDArea
            INNER JOIN Rol r ON u.IDRol = r.IDRol
            ORDER BY u.Username
        `);
        
        console.log('Usuarios recuperados:', users);
        res.json(users);
    } catch (error) {
        console.error('Error al obtener usuarios:', error);
        res.status(500).json({ message: 'Error al obtener usuarios', error: error.message });
    }
});

// Obtener un usuario específico
router.get('/:id', async (req, res) => {
    try {
        const [users] = await db.query(`
            SELECT 
                u.IDUsuario,
                u.Username,
                u.UltimoAcceso,
                u.IntentosFallidos,
                u.Bloqueado,
                a.IDArea,
                a.NombreArea,
                a.CodigoIdentificacion as AreaCodigo,
                a.IsActive as AreaActiva,
                r.IDRol,
                r.NombreRol,
                r.NivelAcceso,
                r.PuedeCrear,
                r.PuedeEditar,
                r.PuedeDerivar,
                r.PuedeAuditar
            FROM Usuario u 
            INNER JOIN AreaEspecializada a ON u.IDArea = a.IDArea
            INNER JOIN Rol r ON u.IDRol = r.IDRol
            WHERE u.IDUsuario = ? AND u.Bloqueado = 0
        `, [req.params.id]);

        if (users.length === 0) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        res.json(users[0]);
    } catch (error) {
        console.error('Error al obtener usuario:', error);
        res.status(500).json({ message: 'Error al obtener usuario', error: error.message });
    }
});

// Crear nuevo usuario
router.post('/', async (req, res) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        const { username, password, idArea, nivelAcceso } = req.body;

        console.log('Datos recibidos para crear usuario:', req.body);

        // Validar datos requeridos
        if (!username || !password || !idArea || !nivelAcceso) {
            console.log('Error: Todos los campos son requeridos');
            await connection.rollback();
            return res.status(400).json({ message: 'Todos los campos son requeridos' });
        }

        // Verificar si el usuario ya existe
        const [existingUsers] = await connection.query(
            'SELECT IDUsuario FROM Usuario WHERE Username = ?',
            [username]
        );

        if (existingUsers.length > 0) {
            await connection.rollback();
            return res.status(400).json({ message: 'El nombre de usuario ya existe' });
        }

        // Hash de la contraseña
        const salt = await bcrypt.genSalt(10);
        const passwordWithSalt = password + salt;
        const hashedPassword = await bcrypt.hash(passwordWithSalt, 10);

        // Definir un IDRol predeterminado (por ejemplo, 1 para Administrador)
        const defaultRolId = 1; // Cambia esto si necesitas otro rol predeterminado

        // Insertar usuario
        const [result] = await connection.query(
            'INSERT INTO Usuario (Username, PasswordHash, Salt, IDArea, IDRol) VALUES (?, ?, ?, ?, ?)',
            [username, hashedPassword, salt, idArea, defaultRolId]
        );

        // Obtener el ID del nuevo usuario
        const newUserId = result.insertId;

        // Insertar niveles de acceso en la tabla UsuarioNivelAcceso
        const nivelAccesoInsertQuery = 'INSERT INTO UsuarioNivelAcceso (IDUsuario, NivelAcceso) VALUES (?, ?)';
        for (const nivel of nivelAcceso) {
            await connection.query(nivelAccesoInsertQuery, [newUserId, nivel]);
        }

        // Obtener información del dispositivo y IP
        const ipAddress = req.ip || '127.0.0.1';
        const userAgent = req.get('User-Agent') || 'Unknown Device';

        // Registrar en el log
        await connection.commit();
        res.status(201).json({ message: 'Usuario creado exitosamente' });
    } catch (error) {
        console.error('Error al crear usuario:', error);
        await connection.rollback();
        res.status(500).json({ message: 'Error al crear usuario', error: error.message });
    } finally {
        connection.release();
    }
});

// Actualizar usuario
router.put('/:id', async (req, res) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        const userId = req.params.id;
        const { username, idArea, nivelAcceso } = req.body;

        // Validar datos requeridos
        if (!username || !idArea || !nivelAcceso) {
            await connection.rollback();
            return res.status(400).json({ message: 'Todos los campos son requeridos' });
        }

        // Verificar si el usuario existe
        const [users] = await connection.query(
            'SELECT IDUsuario FROM Usuario WHERE IDUsuario = ? AND Bloqueado = 0',
            [userId]
        );

        if (users.length === 0) {
            await connection.rollback();
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        // Verificar si el nuevo username ya existe (si se está cambiando)
        const [existingUsers] = await connection.query(
            'SELECT IDUsuario FROM Usuario WHERE Username = ? AND IDUsuario != ?',
            [username, userId]
        );

        if (existingUsers.length > 0) {
            await connection.rollback();
            return res.status(400).json({ message: 'El nombre de usuario ya existe' });
        }

        // Actualizar usuario
        await connection.query(
            `UPDATE Usuario 
             SET Username = ?,
                 IDArea = ?,
                 IDRol = ?
             WHERE IDUsuario = ?`,
            [username, idArea, nivelAcceso, userId]
        );

        // Obtener información del dispositivo y IP
        const ipAddress = req.ip || '127.0.0.1';
        const userAgent = req.get('User-Agent') || 'Unknown Device';

        // Registrar en el log
        await connection.query(
            `INSERT INTO UsuarioLog (
                IDUsuario,
                TipoEvento,
                IPOrigen,
                DispositivoInfo,
                FechaEvento,
                Exitoso
            ) VALUES (?, ?, ?, ?, NOW(), ?)`,
            [
                userId,
                'ACTUALIZACION_USUARIO',
                ipAddress,
                userAgent,
                1
            ]
        );

        await connection.commit();
        res.json({ message: 'Usuario actualizado exitosamente' });
    } catch (error) {
        await connection.rollback();
        console.error('Error al actualizar usuario:', error);
        res.status(500).json({ 
            message: 'Error al actualizar usuario',
            error: error.message 
        });
    } finally {
        connection.release();
    }
});

// Eliminar o desactivar usuario (según el parámetro permanentDelete)
router.delete('/:id', async (req, res) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        
        const userId = req.params.id;
        const { adminUsername, adminPassword, permanentDelete } = req.body;

        console.log('=== INICIO DE PROCESO DE ELIMINACIÓN DE USUARIO ===');
        console.log('Datos de la solicitud:', {
            userId,
            adminUsername,
            adminPasswordProvided: !!adminPassword,
            permanentDelete: !!permanentDelete,
            sessionUser: req.session?.user,
            headers: req.headers
        });

        if (!adminUsername || !adminPassword) {
            console.log('Error: Faltan credenciales de administrador:', {
                adminUsername: !!adminUsername,
                adminPassword: !!adminPassword
            });
            await connection.rollback();
            return res.status(400).json({ message: 'Se requieren las credenciales del administrador' });
        }

        console.log('Buscando usuario administrador en la base de datos...');

        // Obtener todos los datos del usuario administrador para depuración
        const [adminUsers] = await connection.query(
            `SELECT 
                u.IDUsuario,
                u.Username,
                u.PasswordHash,
                u.Salt,
                u.IDRol,
                u.Bloqueado,
                r.NombreRol,
                r.NivelAcceso
            FROM Usuario u
            LEFT JOIN Rol r ON u.IDRol = r.IDRol
            WHERE u.Username = ?`,
            [adminUsername]
        );

        console.log('Resultado de búsqueda de admin:', {
            encontrado: adminUsers.length > 0,
            datos: adminUsers.length > 0 ? {
                id: adminUsers[0].IDUsuario,
                username: adminUsers[0].Username,
                rolId: adminUsers[0].IDRol,
                rolNombre: adminUsers[0].NombreRol,
                nivelAcceso: adminUsers[0].NivelAcceso,
                bloqueado: adminUsers[0].Bloqueado,
                tienePasswordHash: !!adminUsers[0].PasswordHash,
                tieneSalt: !!adminUsers[0].Salt
            } : null
        });

        if (adminUsers.length === 0) {
            console.log('Error: Usuario administrador no encontrado');
            await connection.rollback();
            return res.status(401).json({ message: 'Credenciales de administrador incorrectas' });
        }

        const adminUser = adminUsers[0];

        if (adminUser.Bloqueado) {
            console.log('Error: Usuario administrador bloqueado');
            await connection.rollback();
            return res.status(401).json({ message: 'Usuario administrador bloqueado' });
        }

        if (adminUser.IDRol !== 1) {
            console.log('Error: Usuario no es administrador:', {
                idRol: adminUser.IDRol,
                esperado: 1,
                nivelAcceso: adminUser.NivelAcceso
            });
            await connection.rollback();
            return res.status(401).json({ message: 'El usuario no tiene permisos de administrador' });
        }

        console.log('Verificando contraseña del administrador...');
        console.log('Datos para verificación:', {
            passwordProvided: !!adminPassword,
            saltProvided: !!adminUser.Salt,
            hashProvided: !!adminUser.PasswordHash
        });

        // Verificar contraseña
        const isPasswordValid = await bcrypt.compare(adminPassword + (adminUser.Salt || ''), adminUser.PasswordHash);
        console.log('Resultado de verificación de contraseña:', isPasswordValid);

        if (!isPasswordValid) {
            console.log('Error: Contraseña de administrador incorrecta');
            await connection.rollback();
            return res.status(401).json({ message: 'Credenciales de administrador incorrectas' });
        }

        console.log('Credenciales de administrador verificadas correctamente');

        // Verificar si el usuario a eliminar existe
        const [users] = await connection.query(
            'SELECT IDUsuario, Username, Bloqueado FROM Usuario WHERE IDUsuario = ?',
            [userId]
        );

        console.log('Búsqueda de usuario a eliminar:', {
            encontrado: users.length > 0,
            id: userId
        });

        if (users.length === 0) {
            console.log('Error: Usuario a eliminar no encontrado');
            await connection.rollback();
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        // Obtener información del dispositivo y IP para el log
        const ipAddress = req.ip || '127.0.0.1';
        const userAgent = req.get('User-Agent') || 'Unknown Device';
        
        if (permanentDelete) {
            // Eliminación permanente del usuario
            console.log('Realizando eliminación permanente del usuario...');
            
            // Primero registrar en el log que se va a eliminar permanentemente
            await connection.query(
                `INSERT INTO UsuarioLog (
                    IDUsuario,
                    TipoEvento,
                    IPOrigen,
                    DispositivoInfo,
                    FechaEvento,
                    Exitoso
                ) VALUES (?, ?, ?, ?, NOW(), ?)`,
                [
                    userId,
                    'ELIMINACION_PERMANENTE_USUARIO',
                    ipAddress,
                    userAgent,
                    1
                ]
            );
            
            // Eliminar el usuario de la base de datos
            await connection.query('DELETE FROM Usuario WHERE IDUsuario = ?', [userId]);
            console.log('Usuario eliminado permanentemente de la base de datos');
            
            await connection.commit();
            console.log('=== PROCESO DE ELIMINACIÓN PERMANENTE COMPLETADO EXITOSAMENTE ===');
            res.json({ message: 'Usuario eliminado permanentemente' });
        } else {
            // Soft delete del usuario (comportamiento anterior)
            await connection.query(
                'UPDATE Usuario SET Bloqueado = 1 WHERE IDUsuario = ?',
                [userId]
            );

            console.log('Usuario marcado como bloqueado exitosamente');

            // Registrar en el log
            await connection.query(
                `INSERT INTO UsuarioLog (
                    IDUsuario,
                    TipoEvento,
                    IPOrigen,
                    DispositivoInfo,
                    FechaEvento,
                    Exitoso
                ) VALUES (?, ?, ?, ?, NOW(), ?)`,
                [
                    userId,
                    'DESACTIVACION_USUARIO',
                    ipAddress,
                    userAgent,
                    1
                ]
            );

            await connection.commit();
            console.log('=== PROCESO DE DESACTIVACIÓN COMPLETADO EXITOSAMENTE ===');
            res.json({ message: 'Usuario desactivado exitosamente' });
        }
    } catch (error) {
        await connection.rollback();
        console.error('Error detallado al eliminar usuario:', error);
        res.status(500).json({ 
            message: 'Error al eliminar usuario',
            error: error.message 
        });
    } finally {
        connection.release();
    }
});

// Obtener logs filtrados por fecha
router.get('/logs', async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        
        const [logs] = await db.query(`
            SELECT 
                l.*,
                u.Username as UsuarioAfectado
            FROM UsuarioLog l
            LEFT JOIN Usuario u ON l.IDUsuario = u.IDUsuario
            WHERE l.FechaEvento BETWEEN ? AND DATE_ADD(?, INTERVAL 1 DAY)
            ORDER BY l.FechaEvento DESC
        `, [startDate, endDate]);

        // Formatear los logs para la interfaz
        const formattedLogs = logs.map(log => ({
            Fecha: log.FechaEvento,
            UsuarioAfectado: log.UsuarioAfectado,
            Accion: log.TipoEvento,
            Detalles: `IP: ${log.IPOrigen || 'N/A'}, Dispositivo: ${log.DispositivoInfo || 'N/A'}`,
            Estado: log.Exitoso ? 'Exitoso' : 'Fallido'
        }));

        res.json(formattedLogs);
    } catch (error) {
        console.error('Error al obtener logs:', error);
        res.status(500).json({ 
            message: 'Error al obtener registros de actividad',
            error: error.message 
        });
    }
});

// Obtener todos los logs
router.get('/logs/all', async (req, res) => {
    try {
        const [logs] = await db.query(`
            SELECT 
                l.*,
                u.Username as UsuarioAfectado
            FROM UsuarioLog l
            LEFT JOIN Usuario u ON l.IDUsuario = u.IDUsuario
            ORDER BY l.FechaEvento DESC
        `);

        // Formatear los logs para la interfaz
        const formattedLogs = logs.map(log => ({
            Fecha: log.FechaEvento,
            UsuarioAfectado: log.UsuarioAfectado,
            Accion: log.TipoEvento,
            Detalles: `IP: ${log.IPOrigen || 'N/A'}, Dispositivo: ${log.DispositivoInfo || 'N/A'}`,
            Estado: log.Exitoso ? 'Exitoso' : 'Fallido'
        }));

        res.json(formattedLogs);
    } catch (error) {
        console.error('Error al obtener todos los logs:', error);
        res.status(500).json({ 
            message: 'Error al obtener todos los registros de actividad',
            error: error.message 
        });
    }
});

// Ruta temporal para crear un nuevo usuario administrador
router.post('/setup-admin', async (req, res) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        // Verificar si ya existe un rol de administrador con NivelAcceso = 1
        const [roles] = await connection.query('SELECT IDRol FROM Rol WHERE NivelAcceso = 1 LIMIT 1');
        let adminRolId;

        if (roles.length === 0) {
            // Crear el rol de administrador si no existe
            const [rolResult] = await connection.query(`
                INSERT INTO Rol (
                    NombreRol,
                    Descripcion,
                    NivelAcceso,
                    PuedeCrear,
                    PuedeEditar,
                    PuedeDerivar,
                    PuedeAuditar
                ) VALUES (?, ?, ?, ?, ?, ?, ?)
            `, ['Administrador', 'Administrador del sistema', 1, 1, 1, 1, 1]);
            adminRolId = rolResult.insertId;
        } else {
            adminRolId = roles[0].IDRol;
        }

        // Verificar si ya existe un área administrativa
        const [areas] = await connection.query('SELECT IDArea FROM AreaEspecializada WHERE CodigoIdentificacion = ? LIMIT 1', ['ADMIN']);
        let adminAreaId;

        if (areas.length === 0) {
            // Crear el área administrativa si no existe
            const [areaResult] = await connection.query(
                'INSERT INTO AreaEspecializada (NombreArea, CodigoIdentificacion, TipoArea, IsActive) VALUES (?, ?, ?, ?)',
                ['Administración', 'ADMIN', 'ESPECIALIZADA', 1]
            );
            adminAreaId = areaResult.insertId;
        } else {
            adminAreaId = areas[0].IDArea;
        }

        // Crear el usuario administrador
        const username = 'admin';
        const password = 'admin123';
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Intentar actualizar el usuario admin existente o crear uno nuevo
        const [existingAdmin] = await connection.query('SELECT IDUsuario FROM Usuario WHERE Username = ?', [username]);

        if (existingAdmin.length > 0) {
            // Actualizar el usuario existente
            await connection.query(`
                UPDATE Usuario 
                SET PasswordHash = ?,
                    Salt = ?,
                    IDArea = ?,
                    IDRol = ?,
                    Bloqueado = 0,
                    IntentosFallidos = 0
                WHERE Username = ?
            `, [hashedPassword, salt, adminAreaId, adminRolId, username]);
        } else {
            // Crear nuevo usuario admin
            await connection.query(`
                INSERT INTO Usuario (
                    Username,
                    PasswordHash,
                    Salt,
                    IDArea,
                    IDRol,
                    Bloqueado,
                    IntentosFallidos
                ) VALUES (?, ?, ?, ?, ?, 0, 0)
            `, [username, hashedPassword, salt, adminAreaId, adminRolId]);
        }

        await connection.commit();
        res.json({ 
            message: 'Usuario administrador configurado exitosamente',
            credentials: {
                username: 'admin',
                password: 'admin123'
            }
        });
    } catch (error) {
        await connection.rollback();
        console.error('Error al configurar usuario admin:', error);
        res.status(500).json({ 
            message: 'Error al configurar usuario administrador',
            error: error.message 
        });
    } finally {
        connection.release();
    }
});

// Log failed login attempts
router.post('/log-failed-login', async (req, res) => {
    const { username, ip, deviceInfo } = req.body;
    console.log('Intento de inicio de sesión fallido para el usuario:', username);

    try {
        const [user] = await db.query('SELECT * FROM Usuario WHERE Username = ?', [username]);
        console.log('Resultado de la consulta de usuario:', user);

        if (user.length > 0) {
            console.log('Usuario encontrado:', user[0]);
            const userId = user[0].IDUsuario;

            // Incrementar intentos fallidos
            const [updateResult] = await db.query('UPDATE Usuario SET IntentosFallidos = IntentosFallidos + 1 WHERE IDUsuario = ?', [userId]);
            console.log('Resultado de la actualización de intentos fallidos:', updateResult);

            await db.query('INSERT INTO UsuarioLog (IDUsuario, TipoEvento, IPOrigen, DispositivoInfo, FechaEvento, Exitoso) VALUES (?, ?, ?, ?, ?, ?)', [userId, 'FALLO', ip, deviceInfo, new Date(), 0]);
            console.log('Registro de intento fallido guardado en UsuarioLog para el usuario ID:', userId);
            res.status(200).json({ message: 'Intento fallido registrado' });
        } else {
            console.log('Usuario no encontrado para el nombre de usuario:', username);
            res.status(404).json({ message: 'Usuario no encontrado' });
        }
    } catch (error) {
        console.error('Error al registrar intento fallido:', error);
        res.status(500).json({ message: 'Error al registrar intento fallido', error: error.message });
    }
});

module.exports = router;
