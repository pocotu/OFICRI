/**
 * Servidor principal de la aplicación OFICRI
 * Configura y arranca el servidor Express
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const session = require('express-session');
const rateLimit = require('express-rate-limit');
require('dotenv').config();
const path = require('path');

// Importar configuraciones
const { dbConfig, pool, testConnection } = require('./src/config/database');
const { sessionConfig } = require('./src/config/session');
const { corsConfig } = require('./src/config/cors');
const { rateLimitConfig } = require('./src/config/rateLimit');
const { initializeDatabase } = require('./scripts/init-database');

// Importar utilidades
const { logger, errorHandler } = require('./src/utils/utilsExport');

// Verificar variables de entorno requeridas
const requiredEnvVars = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
    logger.error(`Faltan las siguientes variables de entorno: ${missingEnvVars.join(', ')}`);
    process.exit(1);
}

// Importar rutas
const authRoutes = require('./src/routes/auth.routes');
const userRoutes = require('./src/routes/user.routes');
const areaRoutes = require('./src/routes/area.routes');
const mesaPartesRoutes = require('./src/routes/mesaPartes.routes');
const dashboardRoutes = require('./src/routes/dashboard.routes');

// Importar middlewares
const { errorMiddleware } = require('./src/middleware/middlewareExport');

// Crear aplicación Express
const app = express();

// Configuración básica
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configuración de CORS - Usar la configuración importada
app.use(cors(corsConfig));

// Middleware adicional para manejar preflight OPTIONS
app.options('*', cors(corsConfig));

// Configuración de sesiones con SameSite y Secure apropiados
const sess = {
    ...sessionConfig,
    cookie: {
        ...sessionConfig.cookie,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production'
    }
};

app.use(session(sess));

// Configuración de seguridad básica
app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: false
}));

// Configuración de tipos MIME
express.static.mime.define({
    'application/javascript': ['js', 'mjs'],
    'text/css': ['css'],
    'image/png': ['png'],
    'image/jpeg': ['jpg', 'jpeg'],
    'image/gif': ['gif'],
    'image/svg+xml': ['svg'],
    'font/woff2': ['woff2'],
    'font/woff': ['woff'],
    'font/ttf': ['ttf'],
    'font/eot': ['eot']
});

// Middleware para manejar tipos MIME
app.use((req, res, next) => {
    const ext = path.extname(req.path).toLowerCase();
    switch (ext) {
        case '.js':
        case '.mjs':
            res.type('application/javascript');
            break;
        case '.css':
            res.type('text/css');
            break;
        case '.png':
            res.type('image/png');
            break;
        case '.jpg':
        case '.jpeg':
            res.type('image/jpeg');
            break;
        case '.gif':
            res.type('image/gif');
            break;
        case '.svg':
            res.type('image/svg+xml');
            break;
        case '.woff2':
            res.type('font/woff2');
            break;
        case '.woff':
            res.type('font/woff');
            break;
        case '.ttf':
            res.type('font/ttf');
            break;
        case '.eot':
            res.type('font/eot');
            break;
    }
    next();
});

// Middleware para verificar la conexión a la base de datos
app.use('/api', async (req, res, next) => {
    // Excluir rutas de autenticación de la verificación de DB
    if (req.path.startsWith('/auth/')) {
        return next();
    }
    try {
        await testConnection();
        next();
    } catch (error) {
        logger.error('Error de conexión a la base de datos:', error);
        res.status(500).json({
            success: false,
            message: 'Error de conexión a la base de datos'
        });
    }
});

// Rutas API
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/areas', areaRoutes);
app.use('/api/mesa-partes', mesaPartesRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Servir archivos estáticos
const staticOptions = {
    setHeaders: (res, path) => {
        res.set('X-Content-Type-Options', 'nosniff');
        if (path.endsWith('.html')) {
            res.set('Cache-Control', 'no-cache');
        } else {
            res.set('Cache-Control', 'public, max-age=31536000');
        }
    }
};

app.use('/src', express.static(path.join(__dirname, '../client/src'), staticOptions));
app.use(express.static(path.join(__dirname, '../client/public'), staticOptions));

// Manejar rutas del cliente (SPA)
app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/') || req.path.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$/)) {
        return next();
    }
    res.sendFile(path.join(__dirname, '../client/public/index.html'));
});

// Manejo de errores
app.use(errorMiddleware);

const PORT = process.env.PORT || 3000;

/**
 * Función para iniciar el servidor
 */
async function startServer() {
    try {
        // Verificar conexión a la base de datos
        logger.info('Verificando conexión a la base de datos...');
        await testConnection();

        // Inicializar base de datos
        logger.info('Iniciando configuración de la base de datos...');
        await initializeDatabase();
        logger.info('Base de datos inicializada correctamente');
        
        // Iniciar servidor
        app.listen(PORT, () => {
            logger.info(`Servidor corriendo en puerto ${PORT}`);
            logger.info(`Modo: ${process.env.NODE_ENV || 'development'}`);
            logger.info(`Base de datos: ${dbConfig.host}`);
            
            if (process.env.NODE_ENV !== 'production') {
                logger.info('\nCredenciales de administrador:');
                logger.info('CIP: 12345678');
                logger.info('Contraseña: admin123');
                logger.info(`\nAcceda a http://localhost:${PORT} para comenzar`);
            }
        });
    } catch (error) {
        logger.error('Error al iniciar el servidor:', error);
        process.exit(1);
    }
}

// Manejar señales de terminación
process.on('SIGTERM', async () => {
    logger.info('Recibida señal SIGTERM. Cerrando servidor...');
    await pool.end();
    process.exit(0);
});

process.on('SIGINT', async () => {
    logger.info('Recibida señal SIGINT. Cerrando servidor...');
    await pool.end();
    process.exit(0);
});

// Iniciar servidor
startServer();
