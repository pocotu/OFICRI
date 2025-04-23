/**
 * API Routes Index
 * Combines all routes and applies common middleware
 * ISO/IEC 27001 compliant route management
 */

const express = require('express');
const router = express.Router();

// Import route modules
const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const areaRoutes = require('./area.routes');
const roleRoutes = require('./role.routes');
const mesaPartesRoutes = require('./mesaPartes.routes');
const documentRoutes = require('./document.routes');
const dashboardRoutes = require('./dashboard.routes');
const securityRoutes = require('./security.routes');
const notificationRoutes = require('./notification.routes');
const logsRoutes = require('./logs.routes');
const permisosRoutes = require('./permisos.routes');
const adminRoutes = require('./admin.routes');
const templateRoutes = require('./template.routes');
const integrationRoutes = require('./integration.routes');
const backupRoutes = require('./backup.routes');

// Import common middleware
const { verifyToken } = require('../middleware/auth');
const { csrfMiddleware } = require('../middleware/security/csrf.middleware');
const { logSecurityEvent } = require('../utils/logger/index');

// Middleware to extract API version from header
router.use((req, res, next) => {
  // Default to v1 if not specified
  req.apiVersion = req.get('X-API-Version') || 'v1';
  next();
});

// Status endpoint (no auth required)
router.get('/status', (req, res) => {
  res.status(200).json({
    success: true,
    status: 'operational',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0'
  });
});

// Apply routes (sin el prefijo /api duplicado)
router.use('/auth', authRoutes);
router.use('/documents', documentRoutes);
router.use('/users', userRoutes);
router.use('/areas', areaRoutes);
router.use('/roles', roleRoutes);
router.use('/security', securityRoutes);
router.use('/mesapartes', mesaPartesRoutes);
router.use('/notifications', notificationRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/logs', logsRoutes);
router.use('/permisos', permisosRoutes);
router.use('/admin', adminRoutes);
router.use('/templates', templateRoutes);
router.use('/integrations', integrationRoutes);
router.use('/backups', verifyToken, backupRoutes);

// Spanish aliases for compatibility
router.use('/usuarios', verifyToken, userRoutes);
router.use('/usuario', verifyToken, userRoutes);  // Singular alias
router.use('/areas', verifyToken, areaRoutes);
router.use('/area', verifyToken, areaRoutes);     // Singular alias
router.use('/roles', verifyToken, roleRoutes);
router.use('/rol', verifyToken, roleRoutes);      // Singular alias
router.use('/documentos', verifyToken, documentRoutes);
router.use('/documento', verifyToken, documentRoutes); // Singular alias
router.use('/permissions', verifyToken, permisosRoutes); // English alias
router.use('/administracion', verifyToken, adminRoutes);
router.use('/respaldos', verifyToken, backupRoutes);

// Route not found handler (catch any undefined API routes)
router.use('*', (req, res) => {
  // Log suspicious API requests
  if (!req.originalUrl.startsWith('/status')) {
    logSecurityEvent('INVALID_ENDPOINT_ACCESS', {
      endpoint: req.originalUrl,
      method: req.method,
      ip: req.ip,
      user: req.user ? req.user.id : 'unauthenticated'
    });
  }
  
  res.status(404).json({
    success: false,
    message: 'API endpoint not found',
    endpoint: req.originalUrl
  });
});

module.exports = router; 