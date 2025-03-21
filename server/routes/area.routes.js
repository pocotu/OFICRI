/**
 * Area Routes
 * Implements area management endpoints
 * ISO/IEC 27001 compliant API
 */

const express = require('express');
const router = express.Router();

// Import controller
const areaController = require('../controllers/area.controller');

// Import middleware
const { verifyToken, checkRole } = require('../middleware/auth');

/**
 * @route GET /api/areas
 * @desc Get all areas
 * @access Any authenticated user
 */
router.get('/', 
  verifyToken, 
  areaController.getAllAreas
);

/**
 * @route GET /api/areas/:id
 * @desc Get area by ID
 * @access Any authenticated user
 */
router.get('/:id', 
  verifyToken, 
  areaController.getAreaById
);

/**
 * @route POST /api/areas
 * @desc Create new area
 * @access Admin
 */
router.post('/', 
  checkRole(['admin']), 
  areaController.createArea
);

/**
 * @route PUT /api/areas/:id
 * @desc Update area
 * @access Admin
 */
router.put('/:id', 
  checkRole(['admin']), 
  areaController.updateArea
);

/**
 * @route DELETE /api/areas/:id
 * @desc Delete area
 * @access Admin
 */
router.delete('/:id', 
  checkRole(['admin']), 
  areaController.deleteArea
);

/**
 * @route GET /api/areas/:id/users
 * @desc Get users in area
 * @access Admin, Area Manager
 */
router.get('/:id/users', 
  checkRole(['admin', 'area_manager']), 
  areaController.getAreaUsers
);

/**
 * @route GET /api/areas/:id/documents
 * @desc Get documents in area
 * @access Admin, Area Manager, Area User
 */
router.get('/:id/documents', 
  checkRole(['admin', 'area_manager', 'area_user']), 
  areaController.getAreaDocuments
);

/**
 * @route GET /api/areas/:id/pending
 * @desc Get pending documents in area
 * @access Admin, Area Manager, Area User
 */
router.get('/:id/pending', 
  checkRole(['admin', 'area_manager', 'area_user']), 
  areaController.getAreaPendingDocuments
);

/**
 * @route GET /api/areas/:id/statistics
 * @desc Get area statistics
 * @access Admin, Area Manager
 */
router.get('/:id/statistics', 
  checkRole(['admin', 'area_manager']), 
  areaController.getAreaStatistics
);

module.exports = router; 