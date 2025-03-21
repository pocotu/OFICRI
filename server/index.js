/**
 * Servidor de prueba para OFICRI API
 * Configuración mínima para probar endpoints
 */

const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { logger } = require('./utils/logger');
const { fileHandlerMiddleware } = require('./middleware/file-handler');

// Rutas
const userRoutes = require('./routes/user.routes');
const areaRoutes = require('./routes/area.routes');
const roleRoutes = require('./routes/role.routes');
const mesaPartesRoutes = require('./routes/mesaPartes.routes');
const documentRoutes = require('./routes/document.routes');
const securityRoutes = require('./routes/security.routes');
const notificationRoutes = require('./routes/notification.routes');

// Crear aplicación Express
const app = express();

// Middleware básico
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));

// Middleware de manejo de archivos
app.use(fileHandlerMiddleware);

// Ruta de salud - sin autenticación
app.get('/health', (req, res) => {
  res.json({ status: 'OK' });
});

// Endpoint para generar token para pruebas
app.post('/api/auth/test-token', (req, res) => {
  // Generar un token JWT para pruebas
  const payload = {
    id: 1,
    email: 'test@oficri.com',
    role: req.body.role || 'admin', // Por defecto admin
    name: 'Usuario de Prueba'
  };
  
  const token = jwt.sign(
    payload,
    process.env.JWT_SECRET || 'your_jwt_secret_key_for_development_only',
    { expiresIn: '1h' }
  );
  
  res.json({
    success: true,
    message: 'Token generado para pruebas',
    token: token,
    user: payload
  });
});

// Aplicar rutas
app.use('/api/users', userRoutes);
app.use('/api/areas', areaRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/mesa-partes', mesaPartesRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/security', securityRoutes);
app.use('/api/notifications', notificationRoutes);

// Ruta no encontrada
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found',
    endpoint: req.originalUrl
  });
});

// Error global
app.use((err, req, res, next) => {
  logger.error(`Error: ${err.message}`);
  res.status(500).json({
    success: false,
    message: 'Error interno del servidor',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Iniciar servidor
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  logger.info(`🚀 Servidor de prueba corriendo en puerto ${PORT}`);
  logger.info(`📌 Utiliza POST /api/auth/test-token para generar un token de prueba`);
});

// Exportar app para testing
module.exports = app; 