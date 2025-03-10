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
const { dbConfig } = require('./src/config/database');
const { sessionConfig } = require('./src/config/session');
const { corsConfig } = require('./src/config/cors');
const { rateLimitConfig } = require('./src/config/rateLimit');
const { initializeDatabase } = require('./scripts/init-database');

// Importar utilidades
const { logger, errorHandler } = require('./src/utils/utilsExport');

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

// Servir archivos estáticos con opciones específicas
const staticOptions = {
    setHeaders: (res, path) => {
        // Configurar cabeceras para archivos estáticos
        res.set('X-Content-Type-Options', 'nosniff');
        
        // Configurar Cache-Control según el tipo de archivo
        if (path.endsWith('.html')) {
            res.set('Cache-Control', 'no-cache');
        } else {
            res.set('Cache-Control', 'public, max-age=31536000'); // 1 año para recursos estáticos
        }
    }
};

// Servir archivos estáticos
app.use('/src', express.static(path.join(__dirname, '../client/src'), staticOptions));
app.use(express.static(path.join(__dirname, '../client/public'), staticOptions));

// Configuración de Helmet con CSP personalizado
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https:", "http:"],
            scriptSrcAttr: ["'unsafe-inline'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https:", "http:"],
            imgSrc: ["'self'", "data:", "https:", "http:"],
            fontSrc: ["'self'", "https:", "http:", "data:"],
            connectSrc: ["'self'", process.env.CORS_ORIGIN || "http://localhost:3000"]
        }
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: false
}));

// Configuración de CORS
app.use(cors(corsConfig));

// Límite de tasa de solicitudes
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100 // límite de 100 solicitudes por ventana por IP
});
app.use('/api/', limiter);

// Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configuración de sesiones
app.use(session(sessionConfig));

// Rutas API
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/areas', areaRoutes);
app.use('/api/mesa-partes', mesaPartesRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Manejar rutas del cliente (SPA)
app.get('*', (req, res, next) => {
    // Si es una solicitud de API o un archivo estático, continuar al siguiente middleware
    if (req.path.startsWith('/api/') || req.path.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$/)) {
        return next();
    }
    // Para todas las demás rutas, servir el index.html
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
        logger.info('Iniciando configuración de la base de datos...');
        await initializeDatabase();
        logger.info('Base de datos inicializada correctamente');
        
        app.listen(PORT, () => {
            logger.info(`Servidor corriendo en puerto ${PORT}`);
            if (process.env.NODE_ENV !== 'production') {
                logger.info('\nCredenciales de administrador:');
                logger.info('CIP: 12345678');
                logger.info('Contraseña: admin123');
                logger.info(`\nAcceda a http://localhost:${PORT} para comenzar`);
            }
        });
    } catch (error) {
        logger.logError('Error al iniciar el servidor', error);
        process.exit(1);
    }
}

// Iniciar servidor
startServer();
