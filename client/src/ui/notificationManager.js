/**
 * OFICRI Notification Manager
 * Sistema unificado para gestionar notificaciones en la aplicación
 * Compatible con la interfaz esperada en los componentes existentes
 */

// Importar el servicio de notificaciones existente
import { notifications } from './notifications.js';

/**
 * Notification Manager - Wrapper con interfaz compatible
 * Asegura que todos los métodos necesarios estén disponibles
 */
const notificationManager = (function() {
  'use strict';
  
  // Inicializar servicio original si es necesario
  const _init = function() {
    // Si el sistema de notificaciones interno tiene su propio método init, llamarlo
    if (notifications && typeof notifications.init === 'function') {
      notifications.init();
    }
    
    // Asegurar que los métodos estén disponibles en el namespace global
    if (window.OFICRI) {
      window.OFICRI.notifications = exports;
    }
  };
  
  /**
   * Muestra una notificación informativa
   * @param {string} title - Título de la notificación
   * @param {string} message - Mensaje de la notificación
   * @param {Object} options - Opciones adicionales
   */
  const showInfo = function(title, message, options = {}) {
    // Intentar usar el método original si existe
    if (notifications && typeof notifications.show === 'function') {
      return notifications.show(message, {
        title,
        type: 'info',
        ...options
      });
    }
    
    // Implementación de fallback
    console.info(`[INFO] ${title}: ${message}`);
    _createBasicNotification('info', title, message, options);
    
    return {
      id: Date.now(),
      type: 'info',
      title,
      message
    };
  };
  
  /**
   * Muestra una notificación de éxito
   * @param {string} title - Título de la notificación
   * @param {string} message - Mensaje de la notificación
   * @param {Object} options - Opciones adicionales
   */
  const showSuccess = function(title, message, options = {}) {
    // Intentar usar el método original si existe
    if (notifications && typeof notifications.show === 'function') {
      return notifications.show(message, {
        title,
        type: 'success',
        ...options
      });
    }
    
    // Implementación de fallback
    console.log(`[SUCCESS] ${title}: ${message}`);
    _createBasicNotification('success', title, message, options);
    
    return {
      id: Date.now(),
      type: 'success',
      title,
      message
    };
  };
  
  /**
   * Muestra una notificación de error
   * @param {string} title - Título de la notificación
   * @param {string} message - Mensaje de la notificación
   * @param {Object} options - Opciones adicionales
   */
  const showError = function(title, message, options = {}) {
    // Intentar usar el método original si existe
    if (notifications && typeof notifications.show === 'function') {
      return notifications.show(message, {
        title,
        type: 'error',
        ...options
      });
    }
    
    // Implementación de fallback
    console.error(`[ERROR] ${title}: ${message}`);
    _createBasicNotification('error', title, message, options);
    
    return {
      id: Date.now(),
      type: 'error',
      title,
      message
    };
  };
  
  /**
   * Muestra una notificación de advertencia
   * @param {string} title - Título de la notificación
   * @param {string} message - Mensaje de la notificación
   * @param {Object} options - Opciones adicionales
   */
  const showWarning = function(title, message, options = {}) {
    // Intentar usar el método original si existe
    if (notifications && typeof notifications.show === 'function') {
      return notifications.show(message, {
        title,
        type: 'warning',
        ...options
      });
    }
    
    // Implementación de fallback
    console.warn(`[WARNING] ${title}: ${message}`);
    _createBasicNotification('warning', title, message, options);
    
    return {
      id: Date.now(),
      type: 'warning',
      title,
      message
    };
  };
  
  /**
   * Crea una notificación básica visual en caso de que no funcione el sistema original
   * @param {string} type - Tipo de notificación (info, success, error, warning)
   * @param {string} title - Título 
   * @param {string} message - Mensaje
   * @param {Object} options - Opciones adicionales
   * @private
   */
  const _createBasicNotification = function(type, title, message, options = {}) {
    // Verificar que estamos en un navegador
    if (typeof document === 'undefined') return;
    
    // Crear contenedor de notificaciones si no existe
    let container = document.getElementById('oficri-notifications-fallback');
    if (!container) {
      container = document.createElement('div');
      container.id = 'oficri-notifications-fallback';
      container.style.cssText = 'position:fixed;top:20px;right:20px;z-index:9999;';
      document.body.appendChild(container);
    }
    
    // Crear notificación
    const notification = document.createElement('div');
    notification.className = `oficri-notification-fallback oficri-notification-${type}`;
    notification.style.cssText = `
      padding: 15px;
      margin-bottom: 10px;
      border-radius: 4px;
      background-color: #fff;
      box-shadow: 0 2px 10px rgba(0,0,0,0.2);
      max-width: 350px;
      animation: oficri-notification-fadein 0.5s;
      border-left: 5px solid ${_getColorForType(type)};
    `;
    
    // Contenido
    notification.innerHTML = `
      <div style="font-weight:bold;margin-bottom:5px;">${title}</div>
      <div>${message}</div>
    `;
    
    // Agregar al contenedor
    container.appendChild(notification);
    
    // Agregar estilos de animación si no existen
    if (!document.getElementById('oficri-fallback-styles')) {
      const style = document.createElement('style');
      style.id = 'oficri-fallback-styles';
      style.textContent = `
        @keyframes oficri-notification-fadein {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .oficri-notification-fallback {
          transition: all 0.3s ease;
        }
      `;
      document.head.appendChild(style);
    }
    
    // Auto cerrar después de un tiempo
    const timeout = options.duration || 5000;
    setTimeout(() => {
      notification.style.opacity = '0';
      notification.style.transform = 'translateX(100%)';
      
      // Eliminar del DOM después de la transición
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, timeout);
  };
  
  /**
   * Obtiene el color para el tipo de notificación
   * @param {string} type - Tipo de notificación
   * @returns {string} Color en formato hex
   * @private
   */
  const _getColorForType = function(type) {
    switch (type) {
      case 'success': return '#4CAF50';
      case 'error': return '#F44336';
      case 'warning': return '#FF9800';
      case 'info': default: return '#2196F3';
    }
  };
  
  // Exportar API pública
  const exports = {
    init: _init,
    showInfo,
    showSuccess,
    showError,
    showWarning
  };
  
  // Auto-inicializar si estamos en un navegador
  if (typeof window !== 'undefined') {
    _init();
  }
  
  return exports;
})();

// Exports para ES modules
export { notificationManager };

// Exports para CommonJS y namespace global
export default notificationManager; 