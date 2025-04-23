/**
 * Rutas para gestión de integraciones del sistema
 * ISO/IEC 27001 compliant integration routes
 */

const express = require('express');
const router = express.Router();
const integrationController = require('../controllers/integration.controller');
const { verifyToken } = require('../middleware/auth');
const { checkAdminPermission } = require('../middleware/permissions');
const { validateInput } = require('../middleware/validation');
const { body, param } = require('express-validator');

// Middleware para verificar token en todas las rutas
router.use(verifyToken);

/**
 * @route GET /integrations
 * @desc Obtiene todas las integraciones del sistema
 * @access Private (Admin)
 */
router.get('/', checkAdminPermission, integrationController.getIntegrations);

/**
 * @route POST /integrations
 * @desc Crea una nueva integración
 * @access Private (Admin)
 */
router.post('/',
  checkAdminPermission,
  [
    body('nombre').notEmpty().withMessage('El nombre es requerido'),
    body('tipo').notEmpty().withMessage('El tipo es requerido'),
    body('configuracion').notEmpty().withMessage('La configuración es requerida'),
    body('descripcion').optional()
  ],
  validateInput,
  integrationController.createIntegration
);

/**
 * @route PUT /integrations/:id
 * @desc Actualiza una integración existente
 * @access Private (Admin)
 */
router.put('/:id',
  checkAdminPermission,
  [
    param('id').isInt().withMessage('ID de integración inválido'),
    body('nombre').optional().notEmpty().withMessage('El nombre no puede estar vacío'),
    body('tipo').optional().notEmpty().withMessage('El tipo no puede estar vacío'),
    body('configuracion').optional().notEmpty().withMessage('La configuración no puede estar vacía'),
    body('descripcion').optional()
  ],
  validateInput,
  integrationController.updateIntegration
);

/**
 * @route DELETE /integrations/:id
 * @desc Elimina una integración (soft delete)
 * @access Private (Admin)
 */
router.delete('/:id',
  checkAdminPermission,
  [
    param('id').isInt().withMessage('ID de integración inválido')
  ],
  validateInput,
  integrationController.deleteIntegration
);

module.exports = router; 