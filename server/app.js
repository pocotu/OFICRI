const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const session = require('express-session');
const { logger } = require('./utils/logger');
const { errorHandler } = require('./middleware/error-handler');
const { securityMiddleware } = require('./middleware/security');
const { monitoringMiddleware } = require('./middleware/monitoring');
const { cacheMiddleware } = require('./middleware/cache');
const { compressionMiddleware } = require('./middleware/compression');
const sessionMiddleware = require('./middleware/session-handler');
const { fileHandlerMiddleware } = require('./middleware/file-handler');
const { validatorMiddleware } = require('./middleware/validator');

// Crear aplicación Express
const app = express();

// Middleware básico
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
  origin: ['http://localhost:3001', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin', 'X-CSRF-Token']
}));

// Middleware de seguridad
if (process.env.HELMET_ENABLED === 'true') {
  app.use(helmet());
}

// Middleware de compresión
if (process.env.COMPRESSION_ENABLED === 'true') {
  app.use(compressionMiddleware);
}

// Middleware de sesión
if (process.env.SESSION_ENABLED === 'true') {
  app.use(sessionMiddleware);
}

// Middleware de caché
if (process.env.CACHE_ENABLED === 'true') {
  app.use(cacheMiddleware);
}

// Middleware de monitoreo
if (process.env.MONITORING_ENABLED === 'true') {
  app.use(monitoringMiddleware);
}

// Middleware de validación
app.use(validatorMiddleware);

// Middleware de manejo de archivos
app.use(fileHandlerMiddleware);

// Ruta de salud
app.get('/health', (req, res) => {
  res.json({ status: 'OK' });
});

// Ruta de API de salud
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK' });
});

// Manejo de errores
app.use(errorHandler);

// Iniciar servidor solo si no estamos en modo de prueba
if (process.env.NODE_ENV !== 'test') {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => {
    logger.info(`Servidor corriendo en puerto ${PORT}`);
  });
}

module.exports = app; 