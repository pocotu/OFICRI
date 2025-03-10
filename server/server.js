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

// Configuración de Helmet con CSP personalizado
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://cdn.jsdelivr.net"],
            scriptSrcAttr: ["'unsafe-inline'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com"],
            imgSrc: ["'self'", "data:", "https:"],
            fontSrc: ["'self'", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com"],
            connectSrc: ["'self'", "http://localhost:*"]
        }
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: false
}));

// Configuración de CORS
app.use(cors(corsConfig));

// Parsers para el cuerpo de las solicitudes
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configuración de sesiones
app.use(session(sessionConfig));

// Rate limiter específico para API
const apiLimiter = rateLimit({
    ...rateLimitConfig,
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100 // límite de 100 peticiones por ventana por IP
});

// Rate limiter más permisivo para archivos estáticos
const staticLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minuto
    max: 500, // 500 peticiones por minuto
    message: 'Demasiadas peticiones a archivos estáticos'
});

// Aplicar rate limiting
app.use('/api/', apiLimiter); // Rate limiting estricto para la API
app.use('/src/', staticLimiter); // Rate limiting más permisivo para archivos estáticos

// Configurar tipos MIME
app.use((req, res, next) => {
    const ext = path.extname(req.path).toLowerCase();
    switch (ext) {
        case '.js':
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
        case '.ico':
            res.type('image/x-icon');
            break;
    }
    next();
});

// Middleware personalizado para servir archivos estáticos con control de caché
app.use((req, res, next) => {
    // Rutas para archivos estáticos
    const publicPath = path.join(__dirname, '../client/public');
    const srcPath = path.join(__dirname, '../client/src');
    
    let filePath = null;
    
    // Comprobar si la solicitud es para un archivo en public
    if (req.path.startsWith('/assets/') || req.path === '/favicon.ico' || req.path === '/index.html') {
        filePath = path.join(publicPath, req.path);
    } 
    // Comprobar si la solicitud es para un archivo en src
    else if (req.path.startsWith('/src/')) {
        filePath = path.join(__dirname, '..', req.path);
    }
    
    // Si es un archivo estático
    if (filePath && require('fs').existsSync(filePath)) {
        // Establecer cabeceras de caché
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        
        // Enviar el archivo
        res.sendFile(filePath);
    } else {
        // No es un archivo estático, continuar con el siguiente middleware
        next();
    }
});

// Mantener express.static como fallback, pero con opciones de caché estrictas
const staticOptions = {
    etag: false,
    lastModified: false,
    maxAge: 0,
    setHeaders: (res) => {
        res.set({
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
        });
    }
};

// Servir archivos estáticos
app.use(express.static(path.join(__dirname, '../client/public'), staticOptions));
app.use('/src', express.static(path.join(__dirname, '../client/src'), staticOptions));

// Rutas API
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/areas', areaRoutes);
app.use('/api/mesa-partes', mesaPartesRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Manejo de errores 404 para archivos estáticos
app.use((req, res, next) => {
    if (req.path.match(/\.(js|css|png|jpg|jpeg|ico)$/i)) {
        logger.warn(`Archivo no encontrado: ${req.path}`);
        return res.status(404).send('Archivo no encontrado');
    }
    next();
});

// Middleware de manejo de errores global
app.use(errorMiddleware);

// Ruta para el SPA - debe estar al final
app.get('*', (req, res) => {
    if (!req.path.includes('.')) {  // Solo para rutas que no son archivos
        res.sendFile(path.join(__dirname, '../client/public/index.html'));
    } else {
        res.status(404).send('Archivo no encontrado');
    }
});

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
            logger.info('\nCredenciales de administrador:');
            logger.info('CIP: 12345678');
            logger.info('Contraseña: admin123');
            logger.info(`\nAcceda a http://localhost:${PORT} para comenzar`);
        });
    } catch (error) {
        logger.logError('Error al iniciar el servidor', error);
        process.exit(1);
    }
}

// Iniciar el servidor
startServer();
