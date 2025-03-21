/**
 * Role Routes
 * Implements role management endpoints
 * ISO/IEC 27001 compliant API
 */

const express = require('express');
const router = express.Router();

// Import controller
const roleController = require('../controllers/role.controller');

// Import middleware
const { verifyToken, checkRole } = require('../middleware/auth');

/**
 * @route GET /api/roles
 * @desc Get all roles
 * @access Admin
 */
router.get('/', 
  checkRole(['admin']), 
  roleController.getAllRoles
);

/**
 * @route GET /api/roles/:id
 * @desc Get role by ID
 * @access Admin
 */
router.get('/:id', 
  checkRole(['admin']), 
  roleController.getRoleById
);

/**
 * @route POST /api/roles
 * @desc Create new role
 * @access Admin
 */
router.post('/', 
  checkRole(['admin']), 
  roleController.createRole
);

/**
 * @route PUT /api/roles/:id
 * @desc Update role
 * @access Admin
 */
router.put('/:id', 
  checkRole(['admin']), 
  roleController.updateRole
);

/**
 * @route DELETE /api/roles/:id
 * @desc Delete role
 * @access Admin
 */
router.delete('/:id', 
  checkRole(['admin']), 
  roleController.deleteRole
);

/**
 * @route GET /api/roles/:id/permissions
 * @desc Get role permissions
 * @access Admin
 */
router.get('/:id/permissions', 
  checkRole(['admin']), 
  roleController.getRolePermissions
);

/**
 * @route PUT /api/roles/:id/permissions
 * @desc Update role permissions
 * @access Admin
 */
router.put('/:id/permissions', 
  checkRole(['admin']), 
  roleController.updateRolePermissions
);

module.exports = router; 