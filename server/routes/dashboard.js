const express = require('express');
const router = express.Router();
const { checkAuth } = require('../middleware/auth');
const { checkPermissions } = require('../middleware/permissions');
const { 
  getDashboardStats, 
  getDashboardKPIs, 
  getDashboardAlerts 
} = require('../services/dashboardService');
const { exportDashboardData } = require('../services/exportService');
const { validateFilters } = require('../validators/dashboardValidators');
const { handleError } = require('../utils/errorHandler');
const dashboardController = require('../controllers/dashboardController');

// Middleware de autenticación para todas las rutas
router.use(checkAuth);

/**
 * GET /api/dashboard/stats
 * Obtiene estadísticas generales del dashboard
 */
router.get('/stats', checkPermissions('VER'), async (req, res) => {
  try {
    const filters = validateFilters(req.query);
    const stats = await getDashboardStats(filters);
    res.json(stats);
  } catch (error) {
    handleError(res, error);
  }
});

/**
 * GET /api/dashboard/kpis
 * Obtiene los KPIs del dashboard
 */
router.get('/kpis', checkPermissions('VER'), async (req, res) => {
  try {
    const filters = validateFilters(req.query);
    const kpis = await getDashboardKPIs(filters);
    res.json(kpis);
  } catch (error) {
    handleError(res, error);
  }
});

/**
 * GET /api/dashboard/alerts
 * Obtiene las alertas del dashboard
 */
router.get('/alerts', checkPermissions('VER'), async (req, res) => {
  try {
    const filters = validateFilters(req.query);
    const alerts = await getDashboardAlerts(filters);
    res.json(alerts);
  } catch (error) {
    handleError(res, error);
  }
});

/**
 * POST /api/dashboard/export
 * Exporta datos del dashboard en el formato especificado
 */
router.post('/export', checkPermissions('EXPORTAR'), async (req, res) => {
  try {
    const { data, format, options } = req.body;
    
    // Validar formato
    const validFormats = ['xlsx', 'pdf', 'csv', 'json'];
    if (!validFormats.includes(format)) {
      return res.status(400).json({ 
        error: 'Formato de exportación no válido' 
      });
    }

    // Exportar datos
    const exportedFile = await exportDashboardData(data, format, options);

    // Configurar headers según formato
    const contentTypes = {
      xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      pdf: 'application/pdf',
      csv: 'text/csv',
      json: 'application/json'
    };

    res.setHeader('Content-Type', contentTypes[format]);
    res.setHeader('Content-Disposition', `attachment; filename=${options.filename}.${format}`);
    
    res.send(exportedFile);
  } catch (error) {
    handleError(res, error);
  }
});

// Obtener actividad reciente
router.get('/activity', dashboardController.getActivity);

// Obtener documentos pendientes
router.get('/pending', dashboardController.getPendingDocuments);

module.exports = router; 