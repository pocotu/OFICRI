/**
 * Rutas para la gestión de logs
 * Implementa endpoints para obtener y exportar logs del sistema
 */

const express = require('express');
const router = express.Router();
const logsController = require('../controllers/logs.controller');
const { verifyToken, checkRole } = require('../middleware/auth');

// Middleware de autenticación para todas las rutas
router.use(verifyToken);

// Solo administradores pueden acceder a los logs
router.use(checkRole('admin'));

// GET /api/logs - Obtener logs de la base de datos
router.get('/', logsController.getLogs);

// GET /api/logs/files - Obtener logs del sistema de archivos
router.get('/files', logsController.getFileSystemLogs);

// POST /api/logs/export - Exportar logs
router.post('/export', logsController.exportLogs);

// GET /api/logs/download/:fileName - Descargar un archivo de logs exportado
router.get('/download/:fileName', logsController.downloadExportedLog);

// GET /api/logs/security/stats - Obtener estadísticas de seguridad
router.get('/security/stats', logsController.getSecurityStats);

module.exports = router; 