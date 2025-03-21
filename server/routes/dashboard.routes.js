/**
 * Dashboard Routes
 * Implements dashboard and statistics endpoints
 * ISO/IEC 27001 compliant API
 */

const express = require('express');
const router = express.Router();

// Controllers (temporalmente simulados)
const dashboardController = {
  getStatistics: (req, res) => {
    res.status(200).json({ message: 'Estadísticas generales - Implementación pendiente' });
  },
  getUserStats: (req, res) => {
    res.status(200).json({ message: 'Estadísticas de usuario - Implementación pendiente' });
  },
  getDocumentStats: (req, res) => {
    res.status(200).json({ message: 'Estadísticas de documentos - Implementación pendiente' });
  },
  getAreaStats: (req, res) => {
    res.status(200).json({ message: 'Estadísticas por área - Implementación pendiente' });
  },
  getChartData: (req, res) => {
    res.status(200).json({ message: `Datos para el gráfico: ${req.params.chartType} - Implementación pendiente` });
  }
};

// Import middleware
const { authMiddleware } = require('../middleware/auth');

/**
 * @route GET /api/dashboard/statistics
 * @desc Get general statistics
 * @access Admin
 */
router.get('/statistics', 
  authMiddleware.checkRole(['admin']), 
  dashboardController.getStatistics
);

/**
 * @route GET /api/dashboard/user-stats
 * @desc Get user statistics
 * @access Admin
 */
router.get('/user-stats', 
  authMiddleware.checkRole(['admin']), 
  dashboardController.getUserStats
);

/**
 * @route GET /api/dashboard/document-stats
 * @desc Get document statistics
 * @access Admin, Area Manager
 */
router.get('/document-stats', 
  authMiddleware.checkRole(['admin', 'jefe_area']), 
  dashboardController.getDocumentStats
);

/**
 * @route GET /api/dashboard/area-stats
 * @desc Get area statistics
 * @access Admin, Area Manager
 */
router.get('/area-stats', 
  authMiddleware.checkRole(['admin', 'jefe_area']), 
  dashboardController.getAreaStats
);

/**
 * @route GET /api/dashboard/chart/:chartType
 * @desc Get data for specific chart
 * @access Admin, Area Manager
 */
router.get('/chart/:chartType', 
  authMiddleware.checkRole(['admin', 'jefe_area']), 
  dashboardController.getChartData
);

module.exports = router; 