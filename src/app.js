const express = require('express');
const session = require('express-session');
const cors = require('cors');
const path = require('path');
const db = require('./config/database');
const bcrypt = require('bcryptjs');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const areaRoutes = require('./routes/areas');
const logRoutes = require('./routes/logs');
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
app.use('/src/js/auth.js', express.static(path.join(__dirname, 'js', 'auth.js')));
app.use('/src/js/login.js', express.static(path.join(__dirname, 'js', 'login.js')));

// Middleware para proteger archivos estáticos que requieren autenticación
app.use('/src/pages', requireAuth, express.static(path.join(__dirname, 'pages')));
app.use('/src/js', requireAuth, express.static(path.join(__dirname, 'js')));

// Rutas de la API
app.use('/api/auth', authRoutes);
app.use('/api/users', requireAuth, userRoutes);
app.use('/api/areas', requireAuth, areaRoutes);
app.use('/api/logs', requireAuth, logRoutes);
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

// Crear área admin si no existe
async function createAdminAreaIfNotExists() {
    try {
        const [areas] = await db.query('SELECT * FROM AreaEspecializada WHERE NombreArea = ?', ['Administración']);
        
        if (areas.length === 0) {
            const [result] = await db.query(`
                INSERT INTO AreaEspecializada (
                    NombreArea, 
                    TipoArea, 
                    CodigoIdentificacion,
                    IsActive
                ) VALUES (?, ?, ?, ?)
            `, ['Administración', 'ADMIN', 'ADMIN-001', 1]);
            console.log('Área admin creada exitosamente');
            return result.insertId;
        }
        return areas[0].IDArea;
    } catch (error) {
        console.error('Error al crear área admin:', error);
        throw error;
    }
}

// Crear rol admin si no existe
async function createAdminRolIfNotExists() {
    try {
        const [roles] = await db.query('SELECT * FROM Rol WHERE NombreRol = ?', ['Administrador']);
        
        if (roles.length === 0) {
            const [result] = await db.query(`
                INSERT INTO Rol (
                    NombreRol, 
                    Descripcion, 
                    NivelAcceso, 
                    PuedeCrear, 
                    PuedeEditar, 
                    PuedeDerivar, 
                    PuedeAuditar
                ) VALUES (?, ?, ?, ?, ?, ?, ?)
            `, ['Administrador', 'Rol de administrador del sistema', 1, 1, 1, 1, 1]);
            console.log('Rol admin creado exitosamente');
            return result.insertId;
        }
        return roles[0].IDRol;
    } catch (error) {
        console.error('Error al crear rol admin:', error);
        throw error;
    }
}

// Crear usuario admin si no existe - VERSIÓN CORREGIDA
async function createAdminIfNotExists() {
    try {
        const [users] = await db.query('SELECT * FROM Usuario WHERE Username = ?', ['admin']);
        
        if (users.length === 0) {
            // Obtener o crear área admin
            const idArea = await createAdminAreaIfNotExists();
            console.log('ID del área admin:', idArea);
            
            // Obtener o crear rol admin
            const idRol = await createAdminRolIfNotExists();
            console.log('ID del rol admin:', idRol);
            
            // Generar salt y hash para la contraseña
            const salt = await bcrypt.genSalt(10);
            const password = 'admin123'; // Contraseña por defecto
            const passwordHash = await bcrypt.hash(password + salt, 10);
            
            // Crear usuario admin - Sin usar columnas IsActive y FechaCreacion
            await db.query(`
                INSERT INTO Usuario (
                    Username, 
                    PasswordHash,
                    Salt,
                    IDArea,
                    IDRol
                ) VALUES (?, ?, ?, ?, ?)
            `, ['admin', passwordHash, salt, idArea, idRol]);
            
            console.log('Usuario admin creado exitosamente');
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