/**
 * Rutas del módulo de Administración
 * Implementa los endpoints para configuración, monitoreo, mantenimiento y auditoría
 * ISO/IEC 27001 compliant administration routes
 */

const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { verifyToken } = require('../middleware/auth');
const { checkAdminPermission } = require('../middleware/permissions');
const { validateInput } = require('../middleware/validation');
const { body, param, query } = require('express-validator');

// Middleware para verificar token en todas las rutas
router.use(verifyToken);

// ===== Endpoints de configuración =====

/**
 * @route GET /admin/config/parametros
 * @desc Obtiene todos los parámetros del sistema
 * @access Private (Admin)
 */
router.get('/config/parametros', checkAdminPermission, adminController.getSystemParams);

/**
 * @route PUT /admin/config/parametros/:id
 * @desc Actualiza un parámetro del sistema
 * @access Private (Admin)
 */
router.put('/config/parametros/:id', 
  checkAdminPermission,
  [
    param('id').isInt().withMessage('ID de parámetro inválido'),
    body('valor').notEmpty().withMessage('El valor es requerido'),
    body('descripcion').optional()
  ],
  validateInput,
  adminController.updateSystemParam
);

/**
 * @route GET /admin/config/reglas
 * @desc Obtiene reglas de negocio
 * @access Private (Admin)
 */
router.get('/config/reglas', checkAdminPermission, adminController.getBusinessRules);

/**
 * @route GET /admin/config/plantillas
 * @desc Obtiene plantillas del sistema
 * @access Private (Admin)
 */
router.get('/config/plantillas', checkAdminPermission, adminController.getTemplates);

/**
 * @route GET /admin/config/integraciones
 * @desc Obtiene integraciones configuradas
 * @access Private (Admin)
 */
router.get('/config/integraciones', checkAdminPermission, adminController.getIntegrations);

// ===== Endpoints de monitoreo =====

/**
 * @route GET /admin/monitoreo/estado
 * @desc Obtiene el estado actual del sistema
 * @access Private (Admin)
 */
router.get('/monitoreo/estado', checkAdminPermission, adminController.getSystemStatus);

/**
 * @route GET /admin/monitoreo/rendimiento
 * @desc Obtiene métricas de rendimiento del sistema
 * @access Private (Admin)
 */
router.get('/monitoreo/rendimiento', checkAdminPermission, adminController.getPerformanceMetrics);

/**
 * @route GET /admin/monitoreo/errores
 * @desc Obtiene errores recientes del sistema
 * @access Private (Admin)
 */
router.get('/monitoreo/errores', 
  checkAdminPermission,
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Página debe ser un número positivo'),
    query('limit').optional().isInt({ min: 1, max: 500 }).withMessage('Límite debe estar entre 1 y 500')
  ],
  validateInput,
  adminController.getSystemErrors
);

/**
 * @route GET /admin/monitoreo/uso
 * @desc Obtiene estadísticas de uso del sistema
 * @access Private (Admin)
 */
router.get('/monitoreo/uso', checkAdminPermission, adminController.getSystemUsage);

// ===== Endpoints de mantenimiento =====

/**
 * @route POST /admin/mantenimiento/backup
 * @desc Realiza un respaldo de la base de datos
 * @access Private (Admin)
 */
router.post('/mantenimiento/backup', checkAdminPermission, adminController.createBackup);

/**
 * @route POST /admin/mantenimiento/optimizar
 * @desc Optimiza la base de datos
 * @access Private (Admin)
 */
router.post('/mantenimiento/optimizar', checkAdminPermission, adminController.optimizeDatabase);

/**
 * @route POST /admin/mantenimiento/limpiar
 * @desc Limpia registros antiguos
 * @access Private (Admin)
 */
router.post('/mantenimiento/limpiar',
  checkAdminPermission,
  [
    body('days').optional().isInt({ min: 1 }).withMessage('Días debe ser un número positivo')
  ],
  validateInput,
  adminController.cleanupOldRecords
);

/**
 * @route POST /admin/mantenimiento/restaurar/:backupId
 * @desc Restaura un respaldo
 * @access Private (Admin)
 */
router.post('/mantenimiento/restaurar/:backupId',
  checkAdminPermission,
  [
    param('backupId').isInt().withMessage('ID de backup inválido')
  ],
  validateInput,
  adminController.restoreBackup
);

// ===== Endpoints de auditoría =====

/**
 * @route GET /admin/auditoria/logs
 * @desc Obtiene logs del sistema
 * @access Private (Admin)
 */
router.get('/auditoria/logs',
  checkAdminPermission,
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Página debe ser un número positivo'),
    query('limit').optional().isInt({ min: 1, max: 500 }).withMessage('Límite debe estar entre 1 y 500'),
    query('tipo').optional(),
    query('fechaDesde').optional().isDate().withMessage('Fecha desde debe ser una fecha válida'),
    query('fechaHasta').optional().isDate().withMessage('Fecha hasta debe ser una fecha válida')
  ],
  validateInput,
  adminController.getSystemLogs
);

/**
 * @route GET /admin/auditoria/usuarios
 * @desc Obtiene logs de acciones de usuarios
 * @access Private (Admin)
 */
router.get('/auditoria/usuarios',
  checkAdminPermission,
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Página debe ser un número positivo'),
    query('limit').optional().isInt({ min: 1, max: 500 }).withMessage('Límite debe estar entre 1 y 500'),
    query('usuario').optional().isInt().withMessage('ID de usuario debe ser un número'),
    query('accion').optional(),
    query('fechaDesde').optional().isDate().withMessage('Fecha desde debe ser una fecha válida'),
    query('fechaHasta').optional().isDate().withMessage('Fecha hasta debe ser una fecha válida')
  ],
  validateInput,
  adminController.getUserActions
);

/**
 * @route GET /admin/auditoria/configuracion
 * @desc Obtiene logs de cambios de configuración
 * @access Private (Admin)
 */
router.get('/auditoria/configuracion',
  checkAdminPermission,
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Página debe ser un número positivo'),
    query('limit').optional().isInt({ min: 1, max: 500 }).withMessage('Límite debe estar entre 1 y 500'),
    query('usuario').optional().isInt().withMessage('ID de usuario debe ser un número'),
    query('fechaDesde').optional().isDate().withMessage('Fecha desde debe ser una fecha válida'),
    query('fechaHasta').optional().isDate().withMessage('Fecha hasta debe ser una fecha válida')
  ],
  validateInput,
  adminController.getConfigChanges
);

/**
 * @route GET /admin/auditoria/seguridad
 * @desc Obtiene logs de eventos de seguridad
 * @access Private (Admin)
 */
router.get('/auditoria/seguridad',
  checkAdminPermission,
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Página debe ser un número positivo'),
    query('limit').optional().isInt({ min: 1, max: 500 }).withMessage('Límite debe estar entre 1 y 500'),
    query('tipo').optional(),
    query('fechaDesde').optional().isDate().withMessage('Fecha desde debe ser una fecha válida'),
    query('fechaHasta').optional().isDate().withMessage('Fecha hasta debe ser una fecha válida')
  ],
  validateInput,
  adminController.getSecurityEvents
);

// Exportar el router
module.exports = router; 