/**
 * User Routes
 * Implements user management endpoints
 * ISO/IEC 27001 compliant API
 */

const express = require('express');
const router = express.Router();

// Import controller
const userController = require('../controllers/user.controller');

// Import middleware
const { verifyToken, checkRole } = require('../middleware/auth');

/**
 * @route GET /api/users
 * @desc Get all users
 * @access Admin
 */
router.get('/', 
  checkRole(['admin']), 
  userController.getAllUsers
);

/**
 * @route GET /api/users/:id
 * @desc Get user by ID
 * @access Admin
 */
router.get('/:id', 
  checkRole(['admin']), 
  userController.getUserById
);

/**
 * @route POST /api/users
 * @desc Create new user
 * @access Admin
 */
router.post('/', 
  checkRole(['admin']), 
  userController.createUser
);

/**
 * @route PUT /api/users/:id
 * @desc Update user
 * @access Admin
 */
router.put('/:id', 
  checkRole(['admin']), 
  userController.updateUser
);

/**
 * @route DELETE /api/users/:id
 * @desc Delete user
 * @access Admin
 */
router.delete('/:id', 
  checkRole(['admin']), 
  userController.deleteUser
);

module.exports = router; 