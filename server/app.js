const express = require('express');
const session = require('express-session');
const cors = require('cors');
const path = require('path');
const db = require('./config/database');
const bcrypt = require('bcryptjs');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/users');
const areaRoutes = require('./routes/areas');
const logRoutes = require('./routes/logs');
const rolesRoutes = require('./routes/roles');
const { requireAuth, requireAdmin, requireArea } = require('./middlewares/auth');
const tiposRoutes = require('./routes/tipos');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(session({
    secret: process.env.SESSION_SECRET || 'oficri-secret-key',
    resave: false,
    saveUninitialized: true,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000 // 24 horas
    }
}));

// Archivos públicos (sin autenticación)
app.use('/', express.static(path.join(__dirname, '..', 'client', 'public')));
app.use('/assets', express.static(path.join(__dirname, '..', 'client', 'src', 'assets')));
app.use('/styles/stylesLogin.css', express.static(path.join(__dirname, '..', 'client', 'src', 'styles', 'stylesLogin.css')));
app.use('/js/clientAuth.js', express.static(path.join(__dirname, '..', 'client', 'src', 'js', 'clientAuth.js')));
app.use('/js/frontendAuth.js', express.static(path.join(__dirname, '..', 'client', 'src', 'js', 'frontendAuth.js')));
app.use('/js/login.js', express.static(path.join(__dirname, '..', 'client', 'src', 'js', 'login.js')));
app.use('/js/uiHelpers.js', express.static(path.join(__dirname, '..', 'client', 'src', 'js', 'uiHelpers.js')));
app.use('/js/utils/formatters.js', express.static(path.join(__dirname, '..', 'client', 'src', 'js', 'utils', 'formatters.js')));

// Rutas protegidas para las páginas (ANTES de servir archivos estáticos)
app.get('/admin', requireAuth, requireAdmin, (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'client', 'src', 'pages', 'admin_dashboard.html'));
});

app.get('/pages/dashboard_mesapartes.html', requireAuth, requireArea(2), (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'client', 'src', 'pages', 'dashboard_mesapartes.html'));
});

app.get('/pages/dashboard_toxicologia.html', requireAuth, requireArea(5), (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'client', 'src', 'pages', 'dashboard_toxicologia.html'));
});

// Archivos estáticos protegidos (después de las rutas específicas)
app.use('/styles', requireAuth, (req, res, next) => {
    if (req.path.includes('stylesLogin.css')) {
        next('route');
    } else {
        express.static(path.join(__dirname, '..', 'client', 'src', 'styles'))(req, res, next);
    }
});

app.use('/js/modules', requireAuth, express.static(path.join(__dirname, '..', 'client', 'src', 'js', 'modules')));
app.use('/js/dashboard-common.js', requireAuth, express.static(path.join(__dirname, '..', 'client', 'src', 'js', 'dashboard-common.js')));

// Rutas de la API
app.use('/api/auth', authRoutes);
app.use('/api/users', requireAuth, userRoutes);
app.use('/api/areas', requireAuth, areaRoutes);
app.use('/api/logs', requireAuth, logRoutes);
app.use('/api/roles', requireAuth, rolesRoutes);
app.use('/api/tipos', requireAuth, tiposRoutes);

// Ruta principal y login
app.get(['/', '/index.html', '/login'], (req, res) => {
    if (req.session && req.session.user) {
        switch (req.session.user.idArea) {
            case 1:
                return res.redirect('/admin');
            case 2:
                return res.redirect('/pages/dashboard_mesapartes.html');
            case 5:
                return res.redirect('/pages/dashboard_toxicologia.html');
            default:
                return res.redirect('/dashboard');
        }
    }
    res.sendFile(path.join(__dirname, '..', 'client', 'public', 'index.html'));
});

// Ruta para verificar el estado de autenticación
app.get('/api/auth/check', (req, res) => {
    if (req.session && req.session.user) {
        res.json({
            authenticated: true,
            user: {
                id: req.session.user.id,
                username: req.session.user.username,
                nivelAcceso: req.session.user.nivelAcceso,
                idArea: req.session.user.idArea,
                permisos: req.session.user.permisos
            }
        });
    } else {
        res.json({ authenticated: false });
    }
});

// Middleware para manejar rutas no encontradas
app.use((req, res) => {
    res.redirect('/');
});

// Ruta para iniciar sesión
app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        console.log('Intento de login:', { username, password });

        if (!username || !password) {
            return res.status(400).json({ message: 'Usuario y contraseña son requeridos' });
        }

        // Buscar usuario en la base de datos
        console.log('Buscando usuario en la base de datos...');
        const [users] = await db.query('SELECT * FROM Usuario WHERE Username = ?', [username]);
        console.log('Usuarios encontrados:', users.length);

        if (users.length === 0) {
            return res.status(401).json({ message: 'Credenciales inválidas' });
        }

        const user = users[0];
        console.log('Usuario encontrado:', { id: user.IDUsuario, username: user.Username });

        // Verificar si el usuario está bloqueado
        if (user.Bloqueado) {
            return res.status(401).json({ message: 'Usuario bloqueado. Contacte al administrador.' });
        }

        // Verificar contraseña
        console.log('Verificando contraseña con salt...');
        const isMatch = await bcrypt.compare(password, user.Password);
        console.log('Contraseña válida:', isMatch);

        if (!isMatch) {
            // Incrementar intentos fallidos
            await db.query('UPDATE Usuario SET IntentosFallidos = IntentosFallidos + 1 WHERE IDUsuario = ?', [user.IDUsuario]);
            
            // Verificar si debe ser bloqueado (5 intentos fallidos)
            const [updatedUser] = await db.query('SELECT IntentosFallidos FROM Usuario WHERE IDUsuario = ?', [user.IDUsuario]);
            if (updatedUser[0].IntentosFallidos >= 5) {
                await db.query('UPDATE Usuario SET Bloqueado = 1 WHERE IDUsuario = ?', [user.IDUsuario]);
                return res.status(401).json({ message: 'Usuario bloqueado después de múltiples intentos fallidos.' });
            }
            
            return res.status(401).json({ message: 'Credenciales inválidas' });
        }

        // Actualizar último acceso y resetear intentos fallidos
        console.log('Actualizando último acceso y reseteando intentos fallidos');
        await db.query('UPDATE Usuario SET UltimoAcceso = NOW(), IntentosFallidos = 0 WHERE IDUsuario = ?', [user.IDUsuario]);

        // Obtener información adicional del usuario (área, rol, permisos)
        const [userInfo] = await db.query(`
            SELECT 
                u.IDUsuario, 
                u.Username, 
                a.IDArea, 
                a.NombreArea, 
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
            WHERE u.IDUsuario = ?
        `, [user.IDUsuario]);

        if (userInfo.length === 0) {
            return res.status(500).json({ message: 'Error al obtener información del usuario' });
        }

        // Crear objeto de sesión
        const userSession = {
            id: userInfo[0].IDUsuario,
            username: userInfo[0].Username,
            idArea: userInfo[0].IDArea,
            idRol: userInfo[0].IDRol,
            nivelAcceso: userInfo[0].NivelAcceso,
            permisos: {
                puedeCrear: Boolean(userInfo[0].PuedeCrear),
                puedeEditar: Boolean(userInfo[0].PuedeEditar),
                puedeDerivar: Boolean(userInfo[0].PuedeDerivar),
                puedeAuditar: Boolean(userInfo[0].PuedeAuditar)
            }
        };

        // Guardar en sesión
        req.session.user = userSession;
        console.log('Sesión creada:', userSession);

        // Registrar el evento de login
        const ipAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
        const userAgent = req.headers['user-agent'] || 'Desconocido';
        
        await db.query(`
            INSERT INTO UsuarioLog (IDUsuario, TipoEvento, IPOrigen, DispositivoInfo, Exitoso)
            VALUES (?, 'LOGIN_EXITOSO', ?, ?, 1)
        `, [user.IDUsuario, ipAddress, userAgent]);

        // Responder con información del usuario
        res.json({
            message: 'Inicio de sesión exitoso',
            user: userSession
        });
    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({ message: 'Error en el servidor', error: error.message });
    }
});

// Ruta para cerrar sesión
app.post('/api/auth/logout', (req, res) => {
    if (req.session.user) {
        const userId = req.session.user.id;
        const ipAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
        const userAgent = req.headers['user-agent'] || 'Desconocido';
        
        // Registrar el evento de logout
        db.query(`
            INSERT INTO UsuarioLog (IDUsuario, TipoEvento, IPOrigen, DispositivoInfo, Exitoso)
            VALUES (?, 'LOGOUT', ?, ?, 1)
        `, [userId, ipAddress, userAgent])
        .then(() => {
            console.log('Logout registrado para usuario ID:', userId);
        })
        .catch(err => {
            console.error('Error al registrar logout:', err);
        });
        
        // Destruir la sesión
        req.session.destroy();
        console.log('Sesión destruida para usuario ID:', userId);
        res.json({ message: 'Sesión cerrada exitosamente' });
    } else {
        console.log('No hay sesión activa para cerrar.');
        res.json({ message: 'No hay sesión activa' });
    }
});

// Inicialización de la base de datos
async function initializeDatabase() {
    try {
        console.log('Verificando y creando áreas básicas...');
        // Verificar y crear áreas básicas
        const areas = [
            { nombre: 'Administración', codigo: 'AD', tipoArea: 'ADMIN', descripcion: 'Área administrativa del sistema' },
            { nombre: 'Mesa de Partes', codigo: 'MP', tipoArea: 'RECEPCION', descripcion: 'Recepción y registro de documentos' },
            { nombre: 'Forense Digital', codigo: 'FD', tipoArea: 'ESPECIALIZADA', descripcion: 'Análisis forense digital' },
            { nombre: 'Dosaje Etílico', codigo: 'DE', tipoArea: 'ESPECIALIZADA', descripcion: 'Análisis de dosaje etílico' },
            { nombre: 'Química y Toxicología Forense', codigo: 'QT', tipoArea: 'ESPECIALIZADA', descripcion: 'Análisis químico y toxicológico' }
        ];

        for (const area of areas) {
            const [existingArea] = await db.query('SELECT * FROM AreaEspecializada WHERE NombreArea = ?', [area.nombre]);
            if (existingArea.length === 0) {
                await db.query(
                    'INSERT INTO AreaEspecializada (NombreArea, CodigoIdentificacion, TipoArea, IsActive) VALUES (?, ?, ?, 1)',
                    [area.nombre, area.codigo, area.tipoArea]
                );
                console.log(`Área ${area.nombre} creada.`);
            } else {
                console.log(`Área ${area.nombre} ya existe.`);
            }
        }

        console.log('Verificando y creando mesas de partes...');
        // Verificar y crear mesas de partes
        const mesasPartes = [
            { descripcion: 'Mesa de Partes Central', codigo: 'MPC-001' },
            { descripcion: 'Mesa de Partes Dosaje', codigo: 'MPD-001' },
            { descripcion: 'Mesa de Partes Balística', codigo: 'MPB-001' },
            { descripcion: 'Mesa de Partes Forense Digital', codigo: 'MPF-001' }
        ];

        for (const mesa of mesasPartes) {
            const [existingMesa] = await db.query('SELECT * FROM MesaPartes WHERE Descripcion = ?', [mesa.descripcion]);
            if (existingMesa.length === 0) {
                await db.query(
                    'INSERT INTO MesaPartes (Descripcion, CodigoIdentificacion, IsActive) VALUES (?, ?, 1)',
                    [mesa.descripcion, mesa.codigo]
                );
                console.log(`Mesa de partes ${mesa.descripcion} creada.`);
            } else {
                console.log(`Mesa de partes ${mesa.descripcion} ya existe.`);
            }
        }

        console.log('Verificando y creando roles básicos...');
        // Verificar y crear roles básicos
        const roles = [
            { nombre: 'Administrador', nivelAcceso: 1, crear: 1, editar: 1, derivar: 1, auditar: 1 },
            { nombre: 'Operador Mesa de Partes', nivelAcceso: 3, crear: 1, editar: 1, derivar: 1, auditar: 0 },
            { nombre: 'Técnico Especialista', nivelAcceso: 2, crear: 1, editar: 1, derivar: 0, auditar: 0 },
            { nombre: 'Jefe de Área', nivelAcceso: 2, crear: 1, editar: 1, derivar: 1, auditar: 1 },
            { nombre: 'Visualizador', nivelAcceso: 4, crear: 0, editar: 0, derivar: 0, auditar: 1 }
        ];

        for (const rol of roles) {
            const [existingRol] = await db.query('SELECT * FROM Rol WHERE NombreRol = ?', [rol.nombre]);
            if (existingRol.length === 0) {
                await db.query(
                    'INSERT INTO Rol (NombreRol, NivelAcceso, PuedeCrear, PuedeEditar, PuedeDerivar, PuedeAuditar) VALUES (?, ?, ?, ?, ?, ?)',
                    [rol.nombre, rol.nivelAcceso, rol.crear, rol.editar, rol.derivar, rol.auditar]
                );
                console.log(`Rol ${rol.nombre} creado.`);
            } else {
                console.log(`Rol ${rol.nombre} ya existe.`);
            }
        }

        // Verificar si existe el usuario administrador
        const [adminUser] = await db.query('SELECT * FROM Usuario WHERE Username = ?', ['admin']);
        if (adminUser.length === 0) {
            // Obtener el ID del rol administrador
            const [adminRole] = await db.query('SELECT IDRol FROM Rol WHERE NombreRol = ? AND NivelAcceso = 1', ['Administrador']);
            if (adminRole.length === 0) {
                throw new Error('No se encontró el rol de administrador');
            }

            // Obtener el ID del área administrativa
            const [adminArea] = await db.query('SELECT IDArea FROM AreaEspecializada WHERE NombreArea = ?', ['Administración']);
            if (adminArea.length === 0) {
                throw new Error('No se encontró el área administrativa');
            }

            // Crear usuario administrador con hash y salt
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash('admin123' + salt, 10);
            
            await db.query(
                'INSERT INTO Usuario (Username, PasswordHash, Salt, IDArea, IDRol, UltimoAcceso, IntentosFallidos, Bloqueado) VALUES (?, ?, ?, ?, ?, NOW(), 0, 0)',
                ['admin', hashedPassword, salt, adminArea[0].IDArea, adminRole[0].IDRol]
            );
            console.log('Usuario administrador creado.');
        }

        console.log('Estructura básica de áreas y roles creada exitosamente');
    } catch (error) {
        console.error('Error al inicializar la base de datos:', error);
        throw error; // Propagar el error para que podamos verlo completo
    }
}

// Inicializar la base de datos al arrancar
initializeDatabase()
    .then(() => {
        console.log('Inicialización completada exitosamente');
        console.log('Usuario admin creado con contraseña: admin123');
    })
    .catch(err => {
        console.error('Error en la inicialización:', err);
        console.error('Error SQL:', err.sql);
        console.error('Mensaje SQL:', err.sqlMessage);
    });

module.exports = app;
