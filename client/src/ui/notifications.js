/**
 * Módulo de notificaciones para OFICRI
 * Proporciona una forma unificada de mostrar notificaciones al usuario
 */

// Create namespace if it doesn't exist
window.OFICRI = window.OFICRI || {};

// Notifications module
const notifications = (function() {
  'use strict';
  
  // Configuración por defecto
  const defaultOptions = {
    position: 'top-right',
    duration: 5000,        // duración en milisegundos
    closable: true,        // si se puede cerrar manualmente
    animated: true,        // si tiene animación
    autoClose: true,       // si se cierra automáticamente
    showIcon: true,        // si muestra ícono
    showTitle: true,       // si muestra título
    title: '',             // título por defecto
    className: '',         // clase CSS adicional
    callback: null,        // función a ejecutar al cerrarse
    onClick: null,         // función a ejecutar al hacer clic
    custom: false          // si es una notificación personalizada
  };
  
  // Contador para IDs únicos
  let notificationCount = 0;
  
  // Contenedor principal de notificaciones (se creará dinámicamente)
  let container = null;
  
  /**
   * Inicializa el contenedor de notificaciones
   * @private
   */
  const _initContainer = function() {
    if (container) return;
    
    // Crear contenedor principal
    container = document.createElement('div');
    container.id = 'oficri-notifications-container';
    container.className = 'oficri-notifications-container';
    
    // Crear contenedores para cada posición
    const positions = ['top-left', 'top-right', 'bottom-left', 'bottom-right', 'top-center', 'bottom-center'];
    
    positions.forEach(position => {
      const posContainer = document.createElement('div');
      posContainer.className = `oficri-notifications-position oficri-notifications-${position}`;
      container.appendChild(posContainer);
    });
    
    // Añadir estilos por defecto si no existen
    if (!document.getElementById('oficri-notifications-styles')) {
      const style = document.createElement('style');
      style.id = 'oficri-notifications-styles';
      style.textContent = `
        .oficri-notifications-container {
          position: fixed;
          z-index: 9999;
          pointer-events: none;
          width: 100%;
          height: 100%;
          left: 0;
          top: 0;
          overflow: hidden;
          box-sizing: border-box;
        }
        
        .oficri-notifications-position {
          position: absolute;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 10px;
          max-width: 100%;
          pointer-events: none;
        }
        
        .oficri-notifications-top-left {
          top: 20px;
          left: 20px;
        }
        
        .oficri-notifications-top-right {
          top: 20px;
          right: 20px;
          align-items: flex-end;
        }
        
        .oficri-notifications-bottom-left {
          bottom: 20px;
          left: 20px;
        }
        
        .oficri-notifications-bottom-right {
          bottom: 20px;
          right: 20px;
          align-items: flex-end;
        }
        
        .oficri-notifications-top-center {
          top: 20px;
          left: 50%;
          transform: translateX(-50%);
          align-items: center;
        }
        
        .oficri-notifications-bottom-center {
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%);
          align-items: center;
        }
        
        .oficri-notification {
          margin: 0;
          padding: 12px 15px;
          border-radius: 4px;
          width: 300px;
          max-width: 100%;
          background-color: #fff;
          box-shadow: 0 3px 6px rgba(0,0,0,0.16), 0 3px 6px rgba(0,0,0,0.23);
          pointer-events: auto;
          overflow: hidden;
          display: flex;
          align-items: center;
          opacity: 0;
          transform: translateY(-20px);
          transition: all 0.3s ease;
        }
        
        .oficri-notification.oficri-show {
          opacity: 1;
          transform: translateY(0);
        }
        
        .oficri-notification-content {
          flex: 1;
          margin-right: 10px;
        }
        
        .oficri-notification-title {
          font-weight: bold;
          margin-bottom: 5px;
        }
        
        .oficri-notification-icon {
          margin-right: 12px;
          font-size: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .oficri-notification-close {
          cursor: pointer;
          font-size: 18px;
          padding: 5px;
          line-height: 1;
        }
        
        .oficri-notification-success {
          border-left: 4px solid #4CAF50;
        }
        
        .oficri-notification-success .oficri-notification-icon {
          color: #4CAF50;
        }
        
        .oficri-notification-error {
          border-left: 4px solid #F44336;
        }
        
        .oficri-notification-error .oficri-notification-icon {
          color: #F44336;
        }
        
        .oficri-notification-warning {
          border-left: 4px solid #FF9800;
        }
        
        .oficri-notification-warning .oficri-notification-icon {
          color: #FF9800;
        }
        
        .oficri-notification-info {
          border-left: 4px solid #2196F3;
        }
        
        .oficri-notification-info .oficri-notification-icon {
          color: #2196F3;
        }
        
        @media (max-width: 480px) {
          .oficri-notification {
            width: calc(100vw - 40px);
            margin: 0 10px;
          }
          
          .oficri-notifications-top-center,
          .oficri-notifications-bottom-center {
            width: 100%;
          }
        }
      `;
      
      document.head.appendChild(style);
    }
    
    // Añadir contenedor al DOM
    document.body.appendChild(container);
  };
  
  /**
   * Obtiene el contenedor para una posición específica
   * @param {string} position - Posición de la notificación
   * @returns {HTMLElement} Contenedor para la posición
   * @private
   */
  const _getPositionContainer = function(position) {
    _initContainer();
    return container.querySelector(`.oficri-notifications-${position}`);
  };
  
  /**
   * Crea un elemento de notificación
   * @param {string} message - Mensaje a mostrar
   * @param {string} type - Tipo de notificación (success, error, warning, info)
   * @param {Object} options - Opciones adicionales
   * @returns {HTMLElement} Elemento de notificación
   * @private
   */
  const _createNotificationElement = function(message, type, options) {
    // Crear elemento principal
    const notificationElement = document.createElement('div');
    const id = `oficri-notification-${notificationCount++}`;
    notificationElement.id = id;
    notificationElement.className = `oficri-notification oficri-notification-${type}`;
    
    if (options.className) {
      notificationElement.className += ` ${options.className}`;
    }
    
    // Crear contenido
    let html = '';
    
    // Icono
    if (options.showIcon && !options.custom) {
      let iconClass = '';
      
      switch (type) {
        case 'success':
          iconClass = 'fa-check-circle';
          break;
        case 'error':
          iconClass = 'fa-exclamation-circle';
          break;
        case 'warning':
          iconClass = 'fa-exclamation-triangle';
          break;
        case 'info':
          iconClass = 'fa-info-circle';
          break;
      }
      
      html += `<div class="oficri-notification-icon"><i class="fa-solid ${iconClass}"></i></div>`;
    }
    
    // Contenido
    html += '<div class="oficri-notification-content">';
    
    // Título
    if (options.showTitle && options.title) {
      html += `<div class="oficri-notification-title">${options.title}</div>`;
    }
    
    // Mensaje
    html += `<div class="oficri-notification-message">${message}</div>`;
    html += '</div>';
    
    // Botón de cerrar
    if (options.closable) {
      html += '<div class="oficri-notification-close" aria-label="Cerrar notificación">&times;</div>';
    }
    
    notificationElement.innerHTML = html;
    
    // Si es personalizado, reemplazar el contenido
    if (options.custom) {
      notificationElement.innerHTML = message;
    }
    
    // Manejar eventos
    if (options.onClick) {
      notificationElement.addEventListener('click', function(event) {
        // No ejecutar onClick si se hizo clic en el botón de cerrar
        if (event.target.classList.contains('oficri-notification-close')) return;
        
        options.onClick(event, {
          id: id,
          type: type,
          close: () => _removeNotification(notificationElement, options)
        });
      });
    }
    
    // Manejar cierre
    const closeBtn = notificationElement.querySelector('.oficri-notification-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', function() {
        _removeNotification(notificationElement, options);
      });
    }
    
    return notificationElement;
  };
  
  /**
   * Muestra una notificación
   * @param {string} message - Mensaje a mostrar
   * @param {string} type - Tipo de notificación (success, error, warning, info)
   * @param {Object} customOptions - Opciones adicionales
   * @returns {string} ID de la notificación
   * @private
   */
  const _showNotification = function(message, type, customOptions = {}) {
    // Si el mensaje es un objeto, usarlo como opciones
    if (typeof message === 'object' && message !== null) {
      customOptions = message;
      message = customOptions.message || '';
    }
    
    // Opciones finales
    const options = { ...defaultOptions, ...customOptions };
    
    // Validar mensaje
    if (!message && !options.custom) {
      console.warn('No se ha proporcionado un mensaje para la notificación');
      return null;
    }
    
    // Obtener contenedor
    const positionContainer = _getPositionContainer(options.position);
    
    // Crear elemento de notificación
    const notificationElement = _createNotificationElement(message, type, options);
    
    // Añadir al contenedor
    positionContainer.appendChild(notificationElement);
    
    // Forzar reflow para aplicar la animación
    void notificationElement.offsetWidth;
    
    // Aplicar clase para mostrar con animación
    if (options.animated) {
      notificationElement.classList.add('oficri-show');
    } else {
      notificationElement.style.opacity = '1';
      notificationElement.style.transform = 'none';
    }
    
    // Auto-cierre
    if (options.autoClose && options.duration > 0) {
      setTimeout(() => {
        _removeNotification(notificationElement, options);
      }, options.duration);
    }
    
    return notificationElement.id;
  };
  
  /**
   * Elimina una notificación
   * @param {HTMLElement} element - Elemento a eliminar
   * @param {Object} options - Opciones de la notificación
   * @private
   */
  const _removeNotification = function(element, options) {
    if (!element || !element.parentNode) return;
    
    if (options.animated) {
      // Animación de salida
      element.classList.remove('oficri-show');
      element.style.opacity = '0';
      element.style.transform = 'translateY(-20px)';
      
      // Eliminar después de la animación
      setTimeout(() => {
        if (element.parentNode) {
          element.parentNode.removeChild(element);
          
          // Ejecutar callback si existe
          if (typeof options.callback === 'function') {
            options.callback();
          }
        }
      }, 300);
    } else {
      // Eliminar inmediatamente
      element.parentNode.removeChild(element);
      
      // Ejecutar callback si existe
      if (typeof options.callback === 'function') {
        options.callback();
      }
    }
  };
  
  /**
   * Limpia todas las notificaciones
   */
  const clearAll = function() {
    if (!container) return;
    
    const notifications = container.querySelectorAll('.oficri-notification');
    notifications.forEach(notification => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    });
  };
  
  /**
   * Muestra una notificación de éxito
   * @param {string|Object} message - Mensaje o configuración
   * @param {Object} [options] - Opciones adicionales
   * @returns {string} ID de la notificación
   */
  const success = function(message, options = {}) {
    return _showNotification(message, 'success', options);
  };
  
  /**
   * Muestra una notificación de error
   * @param {string|Object} message - Mensaje o configuración
   * @param {Object} [options] - Opciones adicionales
   * @returns {string} ID de la notificación
   */
  const error = function(message, options = {}) {
    return _showNotification(message, 'error', options);
  };
  
  /**
   * Muestra una notificación de advertencia
   * @param {string|Object} message - Mensaje o configuración
   * @param {Object} [options] - Opciones adicionales
   * @returns {string} ID de la notificación
   */
  const warning = function(message, options = {}) {
    return _showNotification(message, 'warning', options);
  };
  
  /**
   * Muestra una notificación informativa
   * @param {string|Object} message - Mensaje o configuración
   * @param {Object} [options] - Opciones adicionales
   * @returns {string} ID de la notificación
   */
  const info = function(message, options = {}) {
    return _showNotification(message, 'info', options);
  };
  
  /**
   * Muestra una notificación personalizada
   * @param {string|Object} content - Contenido HTML o configuración
   * @param {Object} [options] - Opciones adicionales
   * @returns {string} ID de la notificación
   */
  const custom = function(content, options = {}) {
    options.custom = true;
    return _showNotification(content, 'info', options);
  };
  
  // Inicializar contenedor cuando el DOM esté listo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', _initContainer);
  } else {
    _initContainer();
  }
  
  // API pública
  return {
    success,
    error,
    warning,
    info,
    custom,
    clearAll
  };
})();

// Para compatibilidad con ES modules y UMD
export { notifications };

// Para compatibilidad con código que usa window.OFICRI
window.OFICRI.notifications = notifications;
