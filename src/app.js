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
const rolesRoutes = require('./routes/roles'); // Añadir esta línea
const { requireAuth, requireAdmin } = require('./middleware/auth');
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

// Servir archivos estáticos públicos (accesibles sin autenticación)
app.use(express.static(path.join(__dirname, '..', 'public')));
app.use('/index.html', express.static(path.join(__dirname, '..', 'index.html')));
app.use('/src/styles', express.static(path.join(__dirname, 'styles')));
app.use('/src/images', express.static(path.join(__dirname, 'images')));
app.use('/src/js/frontendAuth.js', express.static(path.join(__dirname, 'js', 'clientAuth.js')));
app.use('/src/js/auth.js', express.static(path.join(__dirname, 'js', 'clientAuth.js'))); // Mantener compatibilidad con código existente
app.use('/src/js/clientAuth.js', express.static(path.join(__dirname, 'js', 'clientAuth.js')));
app.use('/src/js/login.js', express.static(path.join(__dirname, 'js', 'login.js')));

// Middleware para proteger archivos estáticos que requieren autenticación
app.use('/src/pages', requireAuth, express.static(path.join(__dirname, 'pages')));
app.use('/src/js', requireAuth, express.static(path.join(__dirname, 'js')));

// Rutas de la API
app.use('/api/auth', authRoutes);
app.use('/api/users', requireAuth, userRoutes);
app.use('/api/areas', requireAuth, areaRoutes);
app.use('/api/logs', requireAuth, logRoutes);
app.use('/api/roles', requireAuth, rolesRoutes); // Añadir esta línea
app.use('/api/tipos', tiposRoutes);

// Ruta principal
app.get('/', (req, res) => {
    if (req.session && req.session.user) {
        if (req.session.user.nivelAcceso === 1) {
            res.redirect('/admin');
        } else {
            res.redirect('/dashboard');
        }
    } else {
        res.sendFile(path.join(__dirname, '..', 'index.html'));
    }
});

// Rutas protegidas para las páginas
app.get('/admin', requireAdmin, (req, res) => {
    res.sendFile(path.join(__dirname, 'pages', 'admin_dashboard.html'));
});

app.get('/dashboard', requireAuth, (req, res) => {
    res.sendFile(path.join(__dirname, 'pages', 'dashboard_toxicologia.html'));
});

// Ruta para verificar autenticación
app.get('/api/auth/check', requireAuth, (req, res) => {
    res.json({ 
        authenticated: true, 
        user: req.session.user 
    });
});

// Middleware para manejar rutas no encontradas
app.use((req, res) => {
    if (!req.session || !req.session.user) {
        res.redirect('/index.html');
    } else {
        res.status(404).send('Página no encontrada');
    }
});

// Crear áreas especializadas, mesas de partes y roles básicos
async function createBasicAreasAndRoles() {
    try {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();
            
            // 1. CREAR ÁREAS BÁSICAS
            console.log('Verificando y creando áreas básicas...');
            
            const areas = [
                { nombre: 'Administración', codigo: 'ADMIN-001', tipo: 'ADMINISTRACION' },
                { nombre: 'Mesa de Partes', codigo: 'MDP-001', tipo: 'RECEPCION' },
                { nombre: 'Forense Digital', codigo: 'FD-001', tipo: 'ESPECIALIZADA' },
                { nombre: 'Dosaje Etílico', codigo: 'DE-001', tipo: 'ESPECIALIZADA' },
                { nombre: 'Química y Toxicología Forense', codigo: 'QTF-001', tipo: 'ESPECIALIZADA' }
            ];
            
            for (const area of areas) {
                const [existingAreas] = await connection.query(
                    'SELECT * FROM AreaEspecializada WHERE NombreArea = ?', 
                    [area.nombre]
                );
                
                if (existingAreas.length === 0) {
                    console.log(`Creando área: ${area.nombre}`);
                    await connection.query(`
                        INSERT INTO AreaEspecializada (
                            NombreArea, 
                            CodigoIdentificacion,
                            TipoArea, 
                            IsActive
                        ) VALUES (?, ?, ?, ?)
                    `, [area.nombre, area.codigo, area.tipo, 1]);
                } else {
                    console.log(`Área ${area.nombre} ya existe.`);
                }
            }
            
            // 2. CREAR MESAS DE PARTES
            console.log('Verificando y creando mesas de partes...');
            
            const mesasPartes = [
                { descripcion: 'Mesa de Partes Central', codigo: 'MPC-001' },
                { descripcion: 'Mesa de Partes Dosaje', codigo: 'MPD-001' },
                { descripcion: 'Mesa de Partes Balística', codigo: 'MPB-001' },
                { descripcion: 'Mesa de Partes Forense Digital', codigo: 'MPFD-001' }
            ];
            
            for (const mesa of mesasPartes) {
                const [existingMesas] = await connection.query(
                    'SELECT * FROM MesaPartes WHERE Descripcion = ?', 
                    [mesa.descripcion]
                );
                
                if (existingMesas.length === 0) {
                    console.log(`Creando mesa de partes: ${mesa.descripcion}`);
                    await connection.query(`
                        INSERT INTO MesaPartes (
                            Descripcion,
                            IsActive,
                            CodigoIdentificacion
                        ) VALUES (?, ?, ?)
                    `, [mesa.descripcion, 1, mesa.codigo]);
                } else {
                    console.log(`Mesa de partes ${mesa.descripcion} ya existe.`);
                }
            }
            
            // 3. CREAR ROLES BÁSICOS
            console.log('Verificando y creando roles básicos...');
            
            const roles = [
                { nombre: 'Administrador', descripcion: 'Control total del sistema', nivelAcceso: 1, crear: 1, editar: 1, derivar: 1, auditar: 1 },
                { nombre: 'Operador Mesa de Partes', descripcion: 'Gestión de documentos entrantes y salientes', nivelAcceso: 2, crear: 1, editar: 1, derivar: 1, auditar: 0 },
                { nombre: 'Técnico Especialista', descripcion: 'Personal técnico de áreas especializadas', nivelAcceso: 3, crear: 1, editar: 1, derivar: 0, auditar: 0 },
                { nombre: 'Jefe de Área', descripcion: 'Responsables de áreas especializadas', nivelAcceso: 4, crear: 1, editar: 1, derivar: 1, auditar: 1 },
                { nombre: 'Visualizador', descripcion: 'Solo puede consultar información', nivelAcceso: 5, crear: 0, editar: 0, derivar: 0, auditar: 0 }
            ];
            
            for (const rol of roles) {
                const [existingRoles] = await connection.query(
                    'SELECT * FROM Rol WHERE NombreRol = ?', 
                    [rol.nombre]
                );
                
                if (existingRoles.length === 0) {
                    console.log(`Creando rol: ${rol.nombre}`);
                    await connection.query(`
                        INSERT INTO Rol (
                            NombreRol,
                            Descripcion,
                            NivelAcceso,
                            PuedeCrear,
                            PuedeEditar,
                            PuedeDerivar,
                            PuedeAuditar
                        ) VALUES (?, ?, ?, ?, ?, ?, ?)
                    `, [rol.nombre, rol.descripcion, rol.nivelAcceso, rol.crear, rol.editar, rol.derivar, rol.auditar]);
                } else {
                    console.log(`Rol ${rol.nombre} ya existe.`);
                }
            }
            
            await connection.commit();
            console.log('Estructura básica de áreas y roles creada exitosamente');
            
            return true;
            
        } catch (error) {
            await connection.rollback();
            console.error('Error al crear estructura básica:', error);
            throw error;
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Error en la función createBasicAreasAndRoles:', error);
        throw error;
    }
}

// Crear usuario admin si no existe
async function createAdminIfNotExists() {
    try {
        const [users] = await db.query('SELECT * FROM Usuario WHERE Username = ?', ['admin']);
        
        if (users.length === 0) {
            // Ya no necesitamos crear el área admin aquí porque ya se creó en createBasicAreasAndRoles
            const [areas] = await db.query('SELECT IDArea FROM AreaEspecializada WHERE NombreArea = ?', ['Administración']);
            const idArea = areas.length > 0 ? areas[0].IDArea : null;
            
            // Ya no necesitamos crear el rol admin aquí porque ya se creó en createBasicAreasAndRoles
            const [roles] = await db.query('SELECT IDRol FROM Rol WHERE NombreRol = ?', ['Administrador']);
            const idRol = roles.length > 0 ? roles[0].IDRol : null;
            
            if (!idArea || !idRol) {
                throw new Error('No se pudo encontrar el área o rol de administrador');
            }
            
            // Generar salt y hash para la contraseña
            const salt = await bcrypt.genSalt(10);
            const password = 'admin123'; // Contraseña por defecto
            const passwordHash = await bcrypt.hash(password + salt, 10);
            
            // Crear usuario admin
            const [result] = await db.query(`
                INSERT INTO Usuario (
                    Username, 
                    PasswordHash,
                    Salt,
                    IDArea,
                    IDRol,
                    IntentosFallidos,
                    Bloqueado
                ) VALUES (?, ?, ?, ?, ?, ?, ?)
            `, ['admin', passwordHash, salt, idArea, idRol, 0, false]);
            
            // Registrar la creación del usuario en el log
            await db.query(
                'INSERT INTO UsuarioLog (IDUsuario, TipoEvento, IPOrigen, DispositivoInfo, Exitoso) VALUES (?, ?, ?, ?, ?)',
                [result.insertId, 'CREACION_USUARIO', '127.0.0.1', 'Sistema', 1]
            );
            
            console.log('Usuario admin creado exitosamente');
        } else {
            console.log('Usuario admin ya existe, omitiendo creación.');
        }
    } catch (error) {
        console.error('Error al crear usuario admin:', error);
        throw error;
    }
}

// Verificar conexión a la base de datos
async function testDatabaseConnection() {
    try {
        await db.query('SELECT 1');
        console.log('Conexión a la base de datos establecida correctamente');
    } catch (error) {
        console.error('Error al conectar con la base de datos:', error);
        process.exit(1);
    }
}

// Inicializar datos
async function initializeData() {
    try {
        // Primero crear áreas y roles básicos
        await createBasicAreasAndRoles();
        // Luego crear usuario admin que depende de las áreas y roles
        await createAdminIfNotExists();
        console.log('Inicialización completada exitosamente');
    } catch (error) {
        console.error('Error durante la inicialización:', error);
        process.exit(1);
    }
}

// Iniciar el servidor
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, async () => {
    console.log(`Servidor corriendo en puerto ${PORT}`);
    
    // Verificar conexión a la base de datos
    await testDatabaseConnection();
    

    // Inicializar datos
    await initializeData();
});

module.exports = server;
module.exports = server;