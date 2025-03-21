/**
 * Notification Routes
 * Implements notification management endpoints
 * ISO/IEC 27001 compliant API
 */

const express = require('express');
const router = express.Router();

// Import controller
const notificationController = require('../controllers/notification.controller');

// Import middleware
const { verifyToken } = require('../middleware/auth');

/**
 * @route GET /api/notifications
 * @desc Get user notifications
 * @access Authenticated user
 */
router.get('/', 
  verifyToken, 
  notificationController.getUserNotifications
);

/**
 * @route GET /api/notifications/:id
 * @desc Get notification by ID
 * @access Authenticated user (owner)
 */
router.get('/:id', 
  verifyToken, 
  notificationController.getNotificationById
);

/**
 * @route PATCH /api/notifications/:id/read
 * @desc Mark notification as read
 * @access Authenticated user (owner)
 */
router.patch('/:id/read', 
  verifyToken, 
  notificationController.markAsRead
);

/**
 * @route PATCH /api/notifications/read-all
 * @desc Mark all notifications as read
 * @access Authenticated user
 */
router.patch('/read-all', 
  verifyToken, 
  notificationController.markAllAsRead
);

/**
 * @route DELETE /api/notifications/:id
 * @desc Delete notification
 * @access Authenticated user (owner)
 */
router.delete('/:id', 
  verifyToken, 
  notificationController.deleteNotification
);

/**
 * @route GET /api/notifications/settings
 * @desc Get notification settings
 * @access Authenticated user
 */
router.get('/settings', 
  verifyToken, 
  notificationController.getNotificationSettings
);

/**
 * @route PUT /api/notifications/settings
 * @desc Update notification settings
 * @access Authenticated user
 */
router.put('/settings', 
  verifyToken, 
  notificationController.updateNotificationSettings
);

module.exports = router; 