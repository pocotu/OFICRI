/**
 * Dashboard Routes
 * Implementa endpoints para el dashboard
 */

const express = require('express');
const router = express.Router();

// Controlador temporal para pruebas
const dashboardController = {
  getStatistics: (req, res) => {
    res.status(200).json({ message: 'Estadísticas generales - Implementación pendiente' });
  },
  getUserStatistics: (req, res) => {
    res.status(200).json({ message: 'Estadísticas de usuarios - Implementación pendiente' });
  },
  getAreaStatistics: (req, res) => {
    res.status(200).json({ message: 'Estadísticas de áreas - Implementación pendiente' });
  },
  getDocumentStatistics: (req, res) => {
    res.status(200).json({ message: 'Estadísticas de documentos - Implementación pendiente' });
  },
  getChartData: (req, res) => {
    res.status(200).json({ message: `Datos para el gráfico: ${req.params.chartType} - Implementación pendiente` });
  }
};

// Import middleware
const { verifyToken, checkRole } = require('../middleware/auth');

/**
 * @route GET /api/dashboard/statistics
 * @desc Get general statistics
 * @access Admin
 */
router.get('/statistics', 
  verifyToken,
  checkRole(['admin']), 
  dashboardController.getStatistics
);

/**
 * @route GET /api/dashboard/user-stats
 * @desc Get user statistics
 * @access Admin
 */
router.get('/user-stats', 
  verifyToken,
  checkRole(['admin']), 
  dashboardController.getUserStatistics
);

/**
 * @route GET /api/dashboard/area-stats
 * @desc Get area statistics
 * @access Admin
 */
router.get('/area-stats', 
  verifyToken,
  checkRole(['admin']), 
  dashboardController.getAreaStatistics
);

/**
 * @route GET /api/dashboard/document-stats
 * @desc Get document statistics
 * @access Admin
 */
router.get('/document-stats', 
  verifyToken,
  checkRole(['admin']), 
  dashboardController.getDocumentStatistics
);

/**
 * @route GET /api/dashboard/chart/:chartType
 * @desc Get chart data
 * @access Admin
 */
router.get('/chart/:chartType', 
  verifyToken,
  checkRole(['admin']), 
  dashboardController.getChartData
);

module.exports = router; 