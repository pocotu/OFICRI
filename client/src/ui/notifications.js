/**
 * OFICRI Notifications Module
 * Handles UI notifications and alerts
 */

// Create namespace if it doesn't exist
window.OFICRI = window.OFICRI || {};

// Notifications Module
OFICRI.notifications = (function() {
  'use strict';
  
  // Private variables
  let _container = null;
  let _notificationCounter = 0;
  
  /**
   * Creates notification container if it doesn't exist
   */
  const _ensureContainer = function() {
    if (!_container) {
      _container = document.getElementById('notification-container');
      
      if (!_container) {
        _container = document.createElement('div');
        _container.id = 'notification-container';
        _container.className = 'notification-container';
        document.body.appendChild(_container);
        
        // Add container styles if not already in CSS
        const style = document.createElement('style');
        style.textContent = `
          .notification-container {
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: var(--z-notification, 1100);
            display: flex;
            flex-direction: column;
            gap: 10px;
            max-width: 90%;
            width: 350px;
          }
          
          .notification {
            padding: 15px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            color: white;
            display: flex;
            align-items: flex-start;
            opacity: 0;
            transform: translateX(50px);
            transition: all 0.3s ease;
            overflow: hidden;
            position: relative;
          }
          
          .notification.show {
            opacity: 1;
            transform: translateX(0);
          }
          
          .notification-success {
            background-color: var(--oficri-success, #43a047);
          }
          
          .notification-error {
            background-color: var(--oficri-danger, #e53935);
          }
          
          .notification-warning {
            background-color: var(--oficri-warning, #ffb300);
            color: rgba(0, 0, 0, 0.7);
          }
          
          .notification-info {
            background-color: var(--oficri-info, #039be5);
          }
          
          .notification-icon {
            margin-right: 12px;
            font-size: 1.2rem;
          }
          
          .notification-content {
            flex: 1;
          }
          
          .notification-title {
            font-weight: 600;
            margin-bottom: 5px;
          }
          
          .notification-message {
            font-size: 0.9rem;
            opacity: 0.9;
          }
          
          .notification-close {
            background: none;
            border: none;
            color: inherit;
            font-size: 1.1rem;
            cursor: pointer;
            opacity: 0.7;
            margin-left: 10px;
            padding: 0;
            transition: opacity 0.2s;
          }
          
          .notification-close:hover {
            opacity: 1;
          }
          
          .notification-progress {
            position: absolute;
            bottom: 0;
            left: 0;
            width: 100%;
            height: 3px;
            background: rgba(255, 255, 255, 0.3);
          }
          
          .notification-progress-bar {
            height: 100%;
            background: rgba(255, 255, 255, 0.7);
            width: 100%;
          }
          
          @media (max-width: 576px) {
            .notification-container {
              width: calc(100% - 40px);
              top: 10px;
              right: 10px;
            }
          }
        `;
        document.head.appendChild(style);
      }
    }
  };
  
  /**
   * Creates notification element
   * @param {string} type - Notification type
   * @param {Object} options - Notification options
   * @returns {HTMLElement} - Notification element
   */
  const _createNotification = function(type, options) {
    const id = `notification-${_notificationCounter++}`;
    const notification = document.createElement('div');
    notification.id = id;
    notification.className = `notification notification-${type}`;
    
    // Icon based on type
    let icon = '';
    switch (type) {
      case 'success':
        icon = '<i class="fa-solid fa-circle-check"></i>';
        break;
      case 'error':
        icon = '<i class="fa-solid fa-circle-xmark"></i>';
        break;
      case 'warning':
        icon = '<i class="fa-solid fa-triangle-exclamation"></i>';
        break;
      case 'info':
        icon = '<i class="fa-solid fa-circle-info"></i>';
        break;
    }
    
    // Build notification content
    notification.innerHTML = `
      <div class="notification-icon">${icon}</div>
      <div class="notification-content">
        ${options.title ? `<div class="notification-title">${options.title}</div>` : ''}
        <div class="notification-message">${options.message}</div>
      </div>
      <button class="notification-close" aria-label="Cerrar notificación">
        <i class="fa-solid fa-xmark"></i>
      </button>
      <div class="notification-progress">
        <div class="notification-progress-bar"></div>
      </div>
    `;
    
    // Add close button event listener
    notification.querySelector('.notification-close').addEventListener('click', () => {
      _removeNotification(id);
    });
    
    return notification;
  };
  
  /**
   * Animates progress bar
   * @param {HTMLElement} notification - Notification element
   * @param {number} duration - Animation duration
   */
  const _animateProgressBar = function(notification, duration) {
    const progressBar = notification.querySelector('.notification-progress-bar');
    
    if (progressBar) {
      progressBar.style.transition = `width ${duration}ms linear`;
      
      // Trigger reflow to ensure animation starts
      progressBar.getBoundingClientRect();
      
      progressBar.style.width = '0%';
    }
  };
  
  /**
   * Removes notification with animation
   * @param {string} id - Notification ID
   */
  const _removeNotification = function(id) {
    const notification = document.getElementById(id);
    
    if (notification) {
      notification.classList.remove('show');
      
      notification.style.opacity = '0';
      notification.style.transform = 'translateX(50px)';
      
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }
  };
  
  // Public API
  return {
    /**
     * Shows a success notification
     * @param {string} message - Notification message
     * @param {Object} options - Additional options
     */
    success: function(message, options = {}) {
      _ensureContainer();
      
      const notification = _createNotification('success', {
        message,
        title: options.title || 'Éxito',
        ...options
      });
      
      _container.appendChild(notification);
      
      // Trigger animation
      setTimeout(() => {
        notification.classList.add('show');
      }, 10);
      
      // Set timeout for removal
      const duration = options.duration || config.ui.notificationDuration || 5000;
      _animateProgressBar(notification, duration);
      
      setTimeout(() => {
        _removeNotification(notification.id);
      }, duration);
    },
    
    /**
     * Shows an error notification
     * @param {string} message - Notification message
     * @param {Object} options - Additional options
     */
    error: function(message, options = {}) {
      _ensureContainer();
      
      const notification = _createNotification('error', {
        message,
        title: options.title || 'Error',
        ...options
      });
      
      _container.appendChild(notification);
      
      // Trigger animation
      setTimeout(() => {
        notification.classList.add('show');
      }, 10);
      
      // Set timeout for removal (longer for errors)
      const duration = options.duration || config.ui.notificationDuration || 5000;
      _animateProgressBar(notification, duration);
      
      setTimeout(() => {
        _removeNotification(notification.id);
      }, duration);
    },
    
    /**
     * Shows a warning notification
     * @param {string} message - Notification message
     * @param {Object} options - Additional options
     */
    warning: function(message, options = {}) {
      _ensureContainer();
      
      const notification = _createNotification('warning', {
        message,
        title: options.title || 'Advertencia',
        ...options
      });
      
      _container.appendChild(notification);
      
      // Trigger animation
      setTimeout(() => {
        notification.classList.add('show');
      }, 10);
      
      // Set timeout for removal
      const duration = options.duration || config.ui.notificationDuration || 5000;
      _animateProgressBar(notification, duration);
      
      setTimeout(() => {
        _removeNotification(notification.id);
      }, duration);
    },
    
    /**
     * Shows an info notification
     * @param {string} message - Notification message
     * @param {Object} options - Additional options
     */
    info: function(message, options = {}) {
      _ensureContainer();
      
      const notification = _createNotification('info', {
        message,
        title: options.title || 'Información',
        ...options
      });
      
      _container.appendChild(notification);
      
      // Trigger animation
      setTimeout(() => {
        notification.classList.add('show');
      }, 10);
      
      // Set timeout for removal
      const duration = options.duration || config.ui.notificationDuration || 5000;
      _animateProgressBar(notification, duration);
      
      setTimeout(() => {
        _removeNotification(notification.id);
      }, duration);
    },
    
    /**
     * Clears all notifications
     */
    clearAll: function() {
      if (_container) {
        const notifications = _container.querySelectorAll('.notification');
        notifications.forEach(notification => {
          _removeNotification(notification.id);
        });
      }
    }
  };
})(); 