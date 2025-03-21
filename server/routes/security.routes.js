/**
 * Security Routes
 * Implements security management endpoints
 * ISO/IEC 27001 compliant API
 */

const express = require('express');
const router = express.Router();

// Import controller
const securityController = require('../controllers/security.controller');

// Import middleware
const { verifyToken, checkRole } = require('../middleware/auth');

/**
 * @route GET /api/security/audit-logs
 * @desc Get audit logs
 * @access Admin, Security Officer
 */
router.get('/audit-logs', 
  checkRole(['admin', 'security_officer']), 
  securityController.getAuditLogs
);

/**
 * @route GET /api/security/events
 * @desc Get security events
 * @access Admin, Security Officer
 */
router.get('/events', 
  checkRole(['admin', 'security_officer']), 
  securityController.getSecurityEvents
);

/**
 * @route GET /api/security/status
 * @desc Get security status
 * @access Admin, Security Officer
 */
router.get('/status', 
  checkRole(['admin', 'security_officer']), 
  securityController.securityStatus
);

/**
 * @route GET /api/security/password-policy
 * @desc Get password policy
 * @access Admin
 */
router.get('/password-policy', 
  checkRole(['admin']), 
  securityController.passwordPolicy
);

/**
 * @route PUT /api/security/password-policy
 * @desc Update password policy
 * @access Admin
 */
router.put('/password-policy', 
  checkRole(['admin']), 
  securityController.updatePasswordPolicy
);

/**
 * @route GET /api/security/settings
 * @desc Get security settings
 * @access Admin, Security Officer
 */
router.get('/settings', 
  checkRole(['admin', 'security_officer']), 
  securityController.securitySettings
);

/**
 * @route PUT /api/security/settings
 * @desc Update security settings
 * @access Admin
 */
router.put('/settings', 
  checkRole(['admin']), 
  securityController.updateSecuritySettings
);

module.exports = router; 