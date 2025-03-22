/**
 * OFICRI API Server
 * Main entry point for the application
 * ISO/IEC 27001 compliant security implementation
 */

// Load environment variables 
require('dotenv').config();

// Import dependencies
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const session = require('express-session');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');
const morgan = require('morgan');
const { errorHandler } = require('./middleware/error-handler');
const { authenticate } = require('./middleware/auth');
const { logger } = require('./utils/logger');
const { loadEnv } = require('./utils/database-helpers');
const { initializeDatabase } = require('./scripts/init-database');
const { setupSwagger } = require('./swagger');

// Import configurations
const { dbConfig, pool, testConnection, closePool } = require('./config/database');
const security = require('./config/security');
const { getCorsOptions } = require('./config/cors');

// Import utilities
const { logHttpRequest, logSecurityEvent } = require('./utils/logger/index');

// Import middlewares
const errorMiddleware = require('./middleware/error.middleware');
const { rateLimitMiddleware } = require('./middleware/security');
const { authMiddleware } = require('./middleware/auth');

// Import routes
const routes = require('./routes');

// Load environment variables
loadEnv();

// Verify required environment variables
const requiredEnvVars = ['JWT_SECRET', 'SESSION_SECRET', 'CSRF_SECRET'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  logger.error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
  process.exit(1);
}

// Create Express application
const app = express();

// Set up basic security using Helmet
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: process.env.NODE_ENV === 'production',
  crossOriginOpenerPolicy: { policy: 'same-origin' },
  crossOriginResourcePolicy: { policy: 'same-origin' },
  dnsPrefetchControl: { allow: false },
  expectCt: { enforce: true, maxAge: 30 },
  frameguard: { action: 'deny' },
  hidePoweredBy: true,
  hsts: { maxAge: 15552000, includeSubDomains: true, preload: true },
  ieNoOpen: true,
  noSniff: true,
  originAgentCluster: true,
  permittedCrossDomainPolicies: { permittedPolicies: 'none' },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  xssFilter: true
}));

// Request parsing middleware
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Setup CORS
const corsOptions = getCorsOptions();
app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // Enable pre-flight for all routes

// Session configuration
const sessionOptions = {
  secret: process.env.SESSION_SECRET,
  name: 'oficri.sid', // Custom session cookie name
  cookie: {
    httpOnly: true, // Prevent client-side JS from reading
    secure: process.env.NODE_ENV === 'production', // HTTPS only in production
    sameSite: 'lax', // Protection against CSRF
    maxAge: security.sessionSecurity.sessionMaxAge
  },
  resave: false,
  saveUninitialized: false,
  rolling: true, // Reset expiration on activity
};
app.use(session(sessionOptions));

// Request logging middleware
app.use((req, res, next) => {
  const startTime = Date.now();
  
  // Log request completion and timing
  res.on('finish', () => {
    const responseTime = Date.now() - startTime;
    logHttpRequest(req, res, responseTime);
  });
  
  next();
});

// Rate limiting
/* Temporarily disabled for debugging
app.use('/api/', rateLimitMiddleware.standard);
app.use('/api/auth/', rateLimitMiddleware.auth);
app.use('/api/auth/password/reset', rateLimitMiddleware.passwordReset);
*/

// Swagger documentation - exclude in production
if (process.env.NODE_ENV !== 'production') {
  // Disable helmet for Swagger UI
  app.use(['/api-docs', '/api-docs/*', '/swagger-test'], (req, res, next) => {
    // Permitir que Swagger UI funcione sin restricciones CSP
    req.cspdisabled = true;
    next();
  });
  
  try {
    // Mount Swagger UI
    setupSwagger(app);
    
    // Log Swagger UI availability
    logger.info('Swagger documentation available at /api-docs');
    logger.info('Test Swagger at /swagger-test');
  } catch (error) {
    logger.error(`Error configurando Swagger: ${error.message}`);
  }
}

// API Routes
app.use('/api', routes);

// Añadimos CSP para todas las rutas excepto /api-docs
app.use((req, res, next) => {
  if (!req.cspdisabled) {
    helmet.contentSecurityPolicy({
      directives: security.contentSecurityPolicy.directives
    })(req, res, next);
  } else {
    next();
  }
});

// Static files for frontend (only in production)
if (process.env.NODE_ENV === 'production') {
  // Serve static files from "public" directory
  app.use(express.static(path.join(__dirname, '../public')));
  
  // Serve index.html for any request that doesn't match API routes
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
  });
} else {
  // Root endpoint for testing
  app.get('/', (req, res) => {
    res.status(200).json({ 
      message: 'OFICRI API Server está funcionando correctamente',
      endpoints: {
        api: '/api',
        docs: '/api-docs',
        status: '/api/status',
        health: '/health'
      }
    });
  });
  
  // Health Check Endpoint (no auth needed)
  app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', environment: process.env.NODE_ENV });
  });
}

// Catch-all route for 404s
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
    path: req.originalUrl
  });
});

// Error handling middleware
app.use(errorMiddleware);

/**
 * Función para inicializar la base de datos y verificar usuario admin
 * Esta función es ejecutada al inicio del servidor
 */
async function initializeDatabaseAndAdmin() {
  try {
    logger.info('Verificando configuración inicial de la base de datos...');
    await initializeDatabase();
    logger.info('Inicialización de base de datos completada');
    return true;
  } catch (error) {
    logger.error('Error al inicializar la base de datos:', error);
    return false;
  }
}

// Graceful shutdown function
async function shutdownGracefully() {
  logger.info('Shutting down gracefully...');
  
  try {
    // Close database connections
    await closePool();
    logger.info('Database connections closed');
    
    // Close server
    process.exit(0);
  } catch (error) {
    logger.error('Error during shutdown:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', shutdownGracefully);
process.on('SIGINT', shutdownGracefully);

// Iniciar el servidor
const PORT = process.env.PORT || 3000;
const startServer = async () => {
  try {
    // Inicializar la base de datos antes de iniciar el servidor
    await initializeDatabaseAndAdmin();
    
    // Iniciar el servidor HTTP
    const server = app.listen(PORT, () => {
      // Información básica del servidor con enlaces destacados
      console.log('\n\n');
      console.log('======================================================================');
      console.log('                      OFICRI API SERVER INICIADO                      ');
      console.log('======================================================================');
      console.log('\n');
      console.log('📌 ENLACES PRINCIPALES:');
      console.log('------------------------');
      console.log(`🌐 Servidor:             http://localhost:${PORT}`);
      console.log(`🔍 Estado:               http://localhost:${PORT}/health`);
      console.log(`🚀 API Base:             http://localhost:${PORT}/api`);
      console.log(`📚 Documentación API:    http://localhost:${PORT}/api-docs`);
      console.log('\n');
      
      console.log('📑 ENDPOINTS PRINCIPALES:');
      console.log('------------------------');
      console.log(`🔐 Autenticación:        http://localhost:${PORT}/api/auth/login`);
      console.log(`📄 Documentos:           http://localhost:${PORT}/api/documents`);
      console.log(`👤 Usuarios:             http://localhost:${PORT}/api/users`);
      console.log(`🏢 Áreas:                http://localhost:${PORT}/api/areas`);
      console.log(`🔑 Permisos:             http://localhost:${PORT}/api/permisos`);
      console.log(`📨 Mesa de Partes:       http://localhost:${PORT}/api/mesapartes`);
      console.log('\n');
      
      console.log('🧪 COMANDOS DE PRUEBA:');
      console.log('------------------------');
      console.log('▶️ Tests de autenticación:      npm run test:auth');
      console.log('▶️ Tests de entidades:          npm run test:entity');
      console.log('▶️ Test específico (documento): npm run test:entity:documento');
      console.log('\n');
      
      // Información de configuración
      console.log('⚙️ CONFIGURACIÓN:');
      console.log('------------------------');
      console.log(`📌 Entorno:              ${process.env.NODE_ENV || 'development'}`);
      console.log(`📌 Base de datos:        ${process.env.DB_NAME} @ ${process.env.DB_HOST}`);
      console.log(`📌 JWT Secret:           ${process.env.JWT_SECRET ? 'Configurado ✓' : 'No configurado ✗'}`);
      console.log('\n');
      
      // También registramos en el logger
      logger.info('====================================================');
      logger.info('             OFICRI API SERVER INICIADO             ');
      logger.info('====================================================');
      logger.info(`Servidor: http://localhost:${PORT}`);
      logger.info(`Estado: http://localhost:${PORT}/health`);
      logger.info(`API Base: http://localhost:${PORT}/api`);
      logger.info(`Documentación API: http://localhost:${PORT}/api-docs`);
      
      // Mostrar endpoints de API
      try {
        const listEndpoints = require('express-list-endpoints');
        const endpoints = listEndpoints(app);
        
        // Endpoints API como tabla
        console.log('📋 LISTA DE ENDPOINTS API:');
        console.log('------------------------');
        
        // Agrupar endpoints por grupo principal
        const groups = {};
        endpoints.forEach(endpoint => {
          const parts = endpoint.path.split('/');
          const group = parts[1] || 'root';
          
          if (!groups[group]) {
            groups[group] = [];
          }
          
          groups[group].push({
            path: endpoint.path,
            methods: endpoint.methods
          });
        });
        
        // Mostrar cada grupo de endpoints
        Object.keys(groups).sort().forEach(group => {
          console.log(`\n📁 Grupo "${group}" (${groups[group].length} endpoints):`);
          
          groups[group].forEach(ep => {
            let methods = ep.methods.join(',');
            // Ajustar el padding para alinear las columnas
            methods = methods.padEnd(12, ' ');
            console.log(`   ${methods} ${ep.path}`);
          });
        });
        
        console.log('\n');
      } catch (error) {
        console.log(`Error al listar endpoints: ${error.message}`);
      }
      
      console.log('======================================================================');
      console.log('                SERVIDOR LISTO PARA RECIBIR SOLICITUDES               ');
      console.log('======================================================================');
      console.log('\n');
    });
    
    // Configurar manejo de cierre limpio del servidor
    server.on('close', () => {
      logger.info('Servidor HTTP cerrado');
    });
    
  } catch (error) {
    logger.error('Error al iniciar el servidor:', error);
    process.exit(1);
  }
};

startServer(); 