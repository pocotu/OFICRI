/**
 * Rutas para gestión de plantillas del sistema
 * ISO/IEC 27001 compliant template routes
 */

const express = require('express');
const router = express.Router();
const templateController = require('../controllers/template.controller');
const { verifyToken } = require('../middleware/auth');
const { checkAdminPermission } = require('../middleware/permissions');
const { validateInput } = require('../middleware/validation');
const { body, param } = require('express-validator');

// Middleware para verificar token en todas las rutas
router.use(verifyToken);

/**
 * @route GET /templates
 * @desc Obtiene todas las plantillas del sistema
 * @access Private (Admin)
 */
router.get('/', checkAdminPermission, templateController.getTemplates);

/**
 * @route POST /templates
 * @desc Crea una nueva plantilla
 * @access Private (Admin)
 */
router.post('/',
  checkAdminPermission,
  [
    body('nombre').notEmpty().withMessage('El nombre es requerido'),
    body('tipo').notEmpty().withMessage('El tipo es requerido'),
    body('contenido').notEmpty().withMessage('El contenido es requerido'),
    body('descripcion').optional()
  ],
  validateInput,
  templateController.createTemplate
);

/**
 * @route PUT /templates/:id
 * @desc Actualiza una plantilla existente
 * @access Private (Admin)
 */
router.put('/:id',
  checkAdminPermission,
  [
    param('id').isInt().withMessage('ID de plantilla inválido'),
    body('nombre').optional().notEmpty().withMessage('El nombre no puede estar vacío'),
    body('tipo').optional().notEmpty().withMessage('El tipo no puede estar vacío'),
    body('contenido').optional().notEmpty().withMessage('El contenido no puede estar vacío'),
    body('descripcion').optional()
  ],
  validateInput,
  templateController.updateTemplate
);

/**
 * @route DELETE /templates/:id
 * @desc Elimina una plantilla (soft delete)
 * @access Private (Admin)
 */
router.delete('/:id',
  checkAdminPermission,
  [
    param('id').isInt().withMessage('ID de plantilla inválido')
  ],
  validateInput,
  templateController.deleteTemplate
);

module.exports = router; 