const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const pool = require('../config/database');

router.post('/login', async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        console.log('Intento de login:', req.body);
        const { username, password } = req.body;
        
        if (!username || !password) {
            console.log('Faltan campos requeridos');
            await connection.rollback();
            return res.status(400).json({ message: 'Usuario y contraseña son requeridos' });
        }

        // Obtener usuario de la base de datos
        console.log('Buscando usuario en la base de datos...');
        const [users] = await pool.query('SELECT * FROM Usuario WHERE Username = ?', [username]);
        
        console.log('Usuarios encontrados:', users.length);
        
        if (users.length === 0) {
            console.log('Usuario no encontrado');
            await connection.rollback();
            return res.status(401).json({ message: 'Usuario o contraseña incorrectos' });
        }

        const user = users[0];
        console.log('Usuario encontrado:', { id: user.IDUsuario, username: user.Username });
        
        // Verificar si el usuario está bloqueado
        if (user.Bloqueado) {
            console.log('Usuario bloqueado');
            const [blockInfo] = await pool.query('SELECT UltimoBloqueo FROM Usuario WHERE IDUsuario = ?', [user.IDUsuario]);
            const ultimoBloqueo = blockInfo[0].UltimoBloqueo;
            
            if (ultimoBloqueo) {
                const tiempoBloqueo = 5 * 60 * 1000; // 5 minutos en milisegundos
                const tiempoRestante = tiempoBloqueo - (Date.now() - new Date(ultimoBloqueo).getTime());
                
                if (tiempoRestante > 0) {
                    const minutosRestantes = Math.ceil(tiempoRestante / (60 * 1000));
                    await connection.rollback();
                    return res.status(403).json({ 
                        message: `Usuario bloqueado. Por favor espere ${minutosRestantes} minutos.`,
                        intentosFallidos: user.IntentosFallidos
                    });
                } else {
                    // Si ya pasó el tiempo de bloqueo, desbloquear
                    await connection.query('UPDATE Usuario SET Bloqueado = 0, IntentosFallidos = 0, UltimoBloqueo = NULL WHERE IDUsuario = ?', [user.IDUsuario]);
                }
            }
        }
        
        // Verificar contraseña usando el salt almacenado
        console.log('Verificando contraseña con salt...');
        const passwordWithSalt = password + (user.Salt || '');
        const isValid = await bcrypt.compare(passwordWithSalt, user.PasswordHash);
        console.log('Contraseña válida:', isValid);
        
        if (!isValid) {
            // Incrementar intentos fallidos
            console.log('Contraseña inválida, incrementando intentos fallidos');
            const intentosFallidos = user.IntentosFallidos + 1;
            
            // Registrar intento fallido en el log
            await connection.query(
                `INSERT INTO UsuarioLog (IDUsuario, TipoEvento, IPOrigen, DispositivoInfo, Exitoso) VALUES (?, ?, ?, ?, ?)`,
                [user.IDUsuario, 'LOGIN_FALLIDO', req.ip || '127.0.0.1', req.get('User-Agent') || 'Unknown', 0]
            );
            
            // Verificar si debemos bloquear al usuario (después de 5 intentos)
            if (intentosFallidos >= 5) {
                console.log('Bloqueando usuario por exceso de intentos');
                await connection.query(`
                    UPDATE Usuario 
                    SET IntentosFallidos = ?, 
                        Bloqueado = 1,
                        UltimoBloqueo = NOW()
                    WHERE IDUsuario = ?
                `, [intentosFallidos, user.IDUsuario]);
                
                // Registrar bloqueo en el log
                await connection.query(
                    `INSERT INTO UsuarioLog (IDUsuario, TipoEvento, IPOrigen, DispositivoInfo, Exitoso) VALUES (?, ?, ?, ?, ?)`,
                    [user.IDUsuario, 'USUARIO_BLOQUEADO', req.ip || '127.0.0.1', req.get('User-Agent') || 'Unknown', 1]
                );
                
                await connection.commit();
                return res.status(403).json({ 
                    message: 'Demasiados intentos fallidos. Usuario bloqueado por 5 minutos.',
                    intentosFallidos: intentosFallidos
                });
            }
            
            // Actualizar contador de intentos
            await connection.query('UPDATE Usuario SET IntentosFallidos = ? WHERE IDUsuario = ?', [intentosFallidos, user.IDUsuario]);
            await connection.commit();
            
            return res.status(401).json({ 
                message: 'Usuario o contraseña incorrectos',
                intentosFallidos: intentosFallidos,
                intentosRestantes: 5 - intentosFallidos
            });
        }

        // Login exitoso: resetear intentos fallidos y actualizar último acceso
        console.log('Actualizando último acceso y reseteando intentos fallidos');
        await connection.query(`
            UPDATE Usuario 
            SET IntentosFallidos = 0, 
                UltimoAcceso = NOW(),
                Bloqueado = 0,
                UltimoBloqueo = NULL
            WHERE IDUsuario = ?
        `, [user.IDUsuario]);

        // Registrar login exitoso en el log
        await connection.query(
            `INSERT INTO UsuarioLog (IDUsuario, TipoEvento, IPOrigen, DispositivoInfo, Exitoso)
             VALUES (?, ?, ?, ?, ?)`,
            [user.IDUsuario, 'LOGIN_EXITOSO', req.ip || '127.0.0.1', req.get('User-Agent') || 'Unknown', 1]
        );

        // Obtener información del rol
        const [roles] = await connection.query(`
            SELECT r.* 
            FROM Rol r 
            WHERE r.IDRol = ?
        `, [user.IDRol]);

        const userRole = roles[0];

        // Crear sesión
        req.session.user = {
            id: user.IDUsuario,
            username: user.Username,
            idArea: user.IDArea,
            idRol: user.IDRol,
            nivelAcceso: userRole.NivelAcceso,
            permisos: {
                puedeCrear: userRole.PuedeCrear === 1,
                puedeEditar: userRole.PuedeEditar === 1,
                puedeDerivar: userRole.PuedeDerivar === 1,
                puedeAuditar: userRole.PuedeAuditar === 1
            }
        };

        console.log('Sesión creada:', req.session.user);
        await connection.commit();

        res.json({ 
            message: 'Login exitoso',
            user: {
                username: user.Username,
                idArea: user.IDArea,
                idRol: user.IDRol,
                nivelAcceso: userRole.NivelAcceso,
                permisos: {
                    puedeCrear: userRole.PuedeCrear === 1,
                    puedeEditar: userRole.PuedeEditar === 1,
                    puedeDerivar: userRole.PuedeDerivar === 1,
                    puedeAuditar: userRole.PuedeAuditar === 1
                }
            }
        });

    } catch (error) {
        await connection.rollback();
        console.error('Error detallado en login:', error);
        res.status(500).json({ 
            message: 'Error en el servidor',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    } finally {
        connection.release();
    }
});

router.post('/logout', async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        if (req.session && req.session.user) {
            console.log('Cerrando sesión para:', req.session.user);
            
            // Registrar logout en el log
            await connection.query(
                `INSERT INTO UsuarioLog (IDUsuario, TipoEvento, IPOrigen, DispositivoInfo, Exitoso)
                 VALUES (?, ?, ?, ?, ?)`,
                [req.session.user.id, 'LOGOUT', req.ip || '127.0.0.1', req.get('User-Agent') || 'Unknown', 1]
            );
            
            await connection.commit();
            req.session.destroy(() => {
                res.json({ message: 'Sesión cerrada exitosamente' });
            });
        } else {
            console.log('No hay sesión activa para cerrar.');
            res.json({ message: 'No hay sesión activa' });
        }
    } catch (error) {
        await connection.rollback();
        console.error('Error al registrar logout:', error);
        res.status(500).json({ message: 'Error al cerrar sesión', error: error.message });
    } finally {
        connection.release();
    }
});

module.exports = router;
