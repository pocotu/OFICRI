/**
 * Mesa de Partes Routes
 * Implements mesa de partes management endpoints
 * ISO/IEC 27001 compliant API
 */

const express = require('express');
const router = express.Router();

// Import controller
const mesaPartesController = require('../controllers/mesaPartes.controller');

// Import middleware
const { verifyToken, checkRole } = require('../middleware/auth');

/**
 * @route GET /api/mesa-partes
 * @desc Get all mesas de partes
 * @access Admin, Mesa Partes
 */
router.get('/', 
  checkRole(['admin', 'mesa_partes']), 
  mesaPartesController.getAllMesaPartes
);

/**
 * @route GET /api/mesa-partes/:id
 * @desc Get mesa de partes by ID
 * @access Any authenticated user
 */
router.get('/:id', 
  verifyToken, 
  mesaPartesController.getMesaPartesById
);

/**
 * @route POST /api/mesa-partes
 * @desc Create new mesa de partes
 * @access Admin, Mesa Partes
 */
router.post('/', 
  checkRole(['admin', 'mesa_partes']), 
  mesaPartesController.createMesaPartes
);

/**
 * @route PUT /api/mesa-partes/:id
 * @desc Update mesa de partes
 * @access Admin, Mesa Partes
 */
router.put('/:id', 
  checkRole(['admin', 'mesa_partes']), 
  mesaPartesController.updateMesaPartes
);

/**
 * @route DELETE /api/mesa-partes/:id
 * @desc Delete mesa de partes
 * @access Admin
 */
router.delete('/:id', 
  checkRole(['admin']), 
  mesaPartesController.deleteMesaPartes
);

/**
 * @route GET /api/mesa-partes/pending/documents
 * @desc Get pending documents in mesa de partes
 * @access Admin, Mesa Partes
 */
router.get('/pending/documents', 
  checkRole(['admin', 'mesa_partes']), 
  mesaPartesController.getPendingDocuments
);

/**
 * @route GET /api/mesa-partes/statistics
 * @desc Get mesa de partes statistics
 * @access Any authenticated user
 */
router.get('/statistics', 
  verifyToken, 
  mesaPartesController.getStatistics
);

module.exports = router; 