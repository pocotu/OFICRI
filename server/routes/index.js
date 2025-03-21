/**
 * API Routes Index
 * Combines all routes and applies common middleware
 * ISO/IEC 27001 compliant route management
 */

const express = require('express');
const router = express.Router();

// Import route modules
// const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const areaRoutes = require('./area.routes');
const roleRoutes = require('./role.routes');
const mesaPartesRoutes = require('./mesaPartes.routes');
const documentRoutes = require('./document.routes');
const dashboardRoutes = require('./dashboard.routes');
const securityRoutes = require('./security.routes');

// Import common middleware
const { verifyToken } = require('../middleware/auth');
const { csrfMiddleware } = require('../middleware/security/csrf.middleware');
const { logSecurityEvent } = require('../utils/logger');

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

// Apply routes
// router.use('/auth', authRoutes);

// Protected routes - require authentication
router.use('/users', verifyToken, userRoutes);
router.use('/areas', verifyToken, areaRoutes);
router.use('/roles', verifyToken, roleRoutes);
router.use('/mesa-partes', verifyToken, mesaPartesRoutes);
router.use('/documents', verifyToken, documentRoutes);
router.use('/dashboard', verifyToken, dashboardRoutes);
router.use('/security', verifyToken, securityRoutes);

// Spanish aliases for compatibility
router.use('/usuarios', verifyToken, userRoutes);
router.use('/usuario', verifyToken, userRoutes);  // Singular alias
router.use('/areas', verifyToken, areaRoutes);
router.use('/area', verifyToken, areaRoutes);     // Singular alias
router.use('/roles', verifyToken, roleRoutes);
router.use('/rol', verifyToken, roleRoutes);      // Singular alias
router.use('/documentos', verifyToken, documentRoutes);
router.use('/documento', verifyToken, documentRoutes); // Singular alias

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