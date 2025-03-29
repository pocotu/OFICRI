/**
 * OFICRI Notifications Module
 * Sistema modular para mostrar notificaciones y mensajes de alerta
 */

// Namespace para compatibilidad
window.OFICRI = window.OFICRI || {};

// Módulo de Notificaciones
const notifications = (function() {
  'use strict';
  
  // Configuración por defecto
  const _defaultConfig = {
    position: 'top-right',     // Posición de las notificaciones
    duration: 5000,            // Duración en ms (0 = no desaparece)
    animationDuration: 300,    // Duración de animación en ms
    maxNotifications: 5,       // Máximo de notificaciones visibles
    container: null,           // Contenedor personalizado
    theme: 'light',            // Tema: light, dark
    closeButton: true,         // Mostrar botón de cierre
    progressBar: true,         // Mostrar barra de progreso
    preventDuplicates: true,   // Evitar duplicados
    newestOnTop: true,         // Nuevas notificaciones arriba
    escapeHTML: true           // Escapar HTML en los mensajes
  };
  
  // Instancia de contenedor de notificaciones
  let _container = null;
  
  // Contador para IDs únicos
  let _idCounter = 0;
  
  // Cola de notificaciones
  let _queue = [];
  
  // Lista de notificaciones activas
  let _activeNotifications = [];
  
  /**
   * Inicializa el módulo de notificaciones
   * @param {Object} config - Configuración personalizada
   */
  const init = function(config = {}) {
    // Combinar configuración por defecto con personalizada
    const mergedConfig = { ..._defaultConfig, ...config };
    
    // Guardar configuración
    Object.keys(mergedConfig).forEach(key => {
      _defaultConfig[key] = mergedConfig[key];
    });
    
    // Inicializar contenedor
    _initContainer();
    
    // Si hay notificaciones en la cola, mostrarlas
    _processQueue();
  };
  
  /**
   * Inicializa el contenedor de notificaciones
   * @private
   */
  const _initContainer = function() {
    // Si ya existe contenedor, no hacer nada
    if (_container) return;
    
    // Si se especificó un contenedor personalizado
    if (_defaultConfig.container) {
      if (typeof _defaultConfig.container === 'string') {
        _container = document.querySelector(_defaultConfig.container);
      } else if (_defaultConfig.container instanceof HTMLElement) {
        _container = _defaultConfig.container;
      }
    }
    
    // Si no hay contenedor o no es válido, crear uno
    if (!_container) {
      _container = document.createElement('div');
      _container.className = `oficri-notifications oficri-notifications-${_defaultConfig.position}`;
      document.body.appendChild(_container);
    }
    
    // Agregar clase de tema
    _container.classList.add(`oficri-notifications-theme-${_defaultConfig.theme}`);
  };
  
  /**
   * Crea una nueva notificación
   * @param {string} message - Mensaje de la notificación
   * @param {Object} options - Opciones específicas
   * @private
   */
  const _createNotification = function(message, options = {}) {
    const config = { ..._defaultConfig, ...options };
    
    // Crear ID único
    const id = `notification-${Date.now()}-${_idCounter++}`;
    
    // Escapar HTML si está configurado
    if (config.escapeHTML && typeof message === 'string') {
      message = _escapeHTML(message);
    }
    
    // Crear elemento de notificación
    const notification = document.createElement('div');
    notification.className = `oficri-notification oficri-notification-${config.type || 'info'}`;
    notification.id = id;
    notification.setAttribute('role', 'alert');
    
    // Aplicar transición
    notification.style.transition = `all ${config.animationDuration}ms ease-in-out`;
    notification.style.opacity = '0';
    notification.style.transform = 'translateY(20px)';
    
    // Crear contenido
    let html = '';
    
    // Título si existe
    if (config.title) {
      html += `<div class="oficri-notification-title">${config.escapeHTML ? _escapeHTML(config.title) : config.title}</div>`;
    }
    
    // Mensaje
    html += `<div class="oficri-notification-message">${message}</div>`;
    
    // Botón de cierre
    if (config.closeButton) {
      html += '<button type="button" class="oficri-notification-close" aria-label="Cerrar">&times;</button>';
    }
    
    // Barra de progreso
    if (config.progressBar && config.duration > 0) {
      html += '<div class="oficri-notification-progress"><div class="oficri-notification-progress-bar"></div></div>';
    }
    
    // Asignar HTML
    notification.innerHTML = html;
    
    // Agregar evento de cierre
    if (config.closeButton) {
      const closeButton = notification.querySelector('.oficri-notification-close');
      closeButton.addEventListener('click', () => _removeNotification(id));
    }
    
    // Agregar evento de click si es interactivo
    if (config.onClick) {
      notification.addEventListener('click', (e) => {
        // No ejecutar si se hizo click en el botón de cierre
        if (e.target.closest('.oficri-notification-close')) return;
        config.onClick(e);
      });
      
      // Agregar cursor de puntero
      notification.style.cursor = 'pointer';
    }
    
    // Guardar datos para referencia
    const notificationData = {
      id,
      element: notification,
      timeout: null,
      config
    };
    
    // Agregar a lista de notificaciones activas
    _activeNotifications.push(notificationData);
    
    // Si se excede el máximo de notificaciones, poner en cola
    if (_activeNotifications.length > config.maxNotifications) {
      _queue.push(notificationData);
      return;
    }
    
    // Mostrar notificación
    _showNotification(notificationData);
  };
  
  /**
   * Muestra una notificación
   * @param {Object} notification - Datos de la notificación
   * @private
   */
  const _showNotification = function(notification) {
    // Preparar contenedor
    _initContainer();
    
    const { element, config, id } = notification;
    
    // Agregar al contenedor según configuración
    if (config.newestOnTop) {
      _container.insertBefore(element, _container.firstChild);
    } else {
      _container.appendChild(element);
    }
    
    // Forzar reflow para que la transición funcione
    void element.offsetWidth;
    
    // Animar entrada
    element.style.opacity = '1';
    element.style.transform = 'translateY(0)';
    
    // Configurar barra de progreso
    if (config.progressBar && config.duration > 0) {
      const progressBar = element.querySelector('.oficri-notification-progress-bar');
      progressBar.style.transition = `width ${config.duration}ms linear`;
      progressBar.style.width = '100%';
      
      // Retrasar un poco para que la animación funcione
      setTimeout(() => {
        progressBar.style.width = '0%';
      }, 10);
    }
    
    // Si la duración no es 0, configurar timeout para remover
    if (config.duration > 0) {
      notification.timeout = setTimeout(() => {
        _removeNotification(id);
      }, config.duration);
    }
    
    // Agregar evento para pausar temporizador al hacer hover
    element.addEventListener('mouseenter', () => {
      if (notification.timeout) {
        clearTimeout(notification.timeout);
        notification.timeout = null;
        
        // Pausar barra de progreso
        if (config.progressBar) {
          const progressBar = element.querySelector('.oficri-notification-progress-bar');
          progressBar.style.transition = 'none';
        }
      }
    });
    
    // Reanudar temporizador al quitar hover
    element.addEventListener('mouseleave', () => {
      if (config.duration > 0 && !notification.timeout) {
        notification.timeout = setTimeout(() => {
          _removeNotification(id);
        }, config.duration / 2); // Usar la mitad del tiempo restante
        
        // Reanudar barra de progreso
        if (config.progressBar) {
          const progressBar = element.querySelector('.oficri-notification-progress-bar');
          progressBar.style.transition = `width ${config.duration / 2}ms linear`;
          progressBar.style.width = '0%';
        }
      }
    });
  };
  
  /**
   * Elimina una notificación
   * @param {string} id - ID de la notificación
   * @private
   */
  const _removeNotification = function(id) {
    // Buscar índice de la notificación
    const index = _activeNotifications.findIndex(n => n.id === id);
    
    // Si no se encuentra, salir
    if (index === -1) return;
    
    // Obtener datos de la notificación
    const notification = _activeNotifications[index];
    const { element, timeout, config } = notification;
    
    // Limpiar timeout si existe
    if (timeout) {
      clearTimeout(timeout);
    }
    
    // Animar salida
    element.style.opacity = '0';
    element.style.transform = 'translateY(-20px)';
    
    // Esperar a que termine la animación para remover
    setTimeout(() => {
      // Remover del DOM
      if (element.parentNode) {
        element.parentNode.removeChild(element);
      }
      
      // Remover de la lista de notificaciones activas
      _activeNotifications.splice(index, 1);
      
      // Procesar cola si hay notificaciones pendientes
      _processQueue();
      
      // Ejecutar callback si existe
      if (config.onClose && typeof config.onClose === 'function') {
        config.onClose();
      }
    }, config.animationDuration);
  };
  
  /**
   * Procesa la cola de notificaciones
   * @private
   */
  const _processQueue = function() {
    // Si no hay notificaciones en cola, salir
    if (_queue.length === 0) return;
    
    // Mientras haya espacio y notificaciones en cola
    while (_activeNotifications.length < _defaultConfig.maxNotifications && _queue.length > 0) {
      // Obtener primera notificación de la cola
      const notification = _queue.shift();
      
      // Mostrar notificación
      _showNotification(notification);
    }
  };
  
  /**
   * Escapa caracteres HTML
   * @param {string} html - String a escapar
   * @private
   */
  const _escapeHTML = function(html) {
    if (typeof html !== 'string') {
      return html;
    }
    
    return html
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  };
  
  /**
   * Verifica si un mensaje está duplicado
   * @param {string} message - Mensaje a verificar
   * @returns {boolean} - True si está duplicado
   * @private
   */
  const _isDuplicate = function(message) {
    return _activeNotifications.some(n => n.config.message === message);
  };
  
  /**
   * Elimina todas las notificaciones
   */
  const clear = function() {
    // Copiar IDs para evitar problemas al modificar el array durante la iteración
    const ids = _activeNotifications.map(n => n.id);
    
    // Remover cada notificación
    ids.forEach(id => _removeNotification(id));
    
    // Limpiar cola
    _queue = [];
  };
  
  // API pública
  return {
    init,
    clear,
    
    // Métodos para diferentes tipos de notificaciones
    success: function(message, options = {}) {
      if (_defaultConfig.preventDuplicates && _isDuplicate(message)) {
        return;
      }
      _createNotification(message, { ...options, type: 'success' });
    },
    
    error: function(message, options = {}) {
      if (_defaultConfig.preventDuplicates && _isDuplicate(message)) {
        return;
      }
      _createNotification(message, { ...options, type: 'error' });
    },
    
    warning: function(message, options = {}) {
      if (_defaultConfig.preventDuplicates && _isDuplicate(message)) {
        return;
      }
      _createNotification(message, { ...options, type: 'warning' });
    },
    
    info: function(message, options = {}) {
      if (_defaultConfig.preventDuplicates && _isDuplicate(message)) {
        return;
      }
      _createNotification(message, { ...options, type: 'info' });
    },
    
    // Método general para cualquier tipo
    show: function(message, options = {}) {
      if (_defaultConfig.preventDuplicates && _isDuplicate(message)) {
        return;
      }
      _createNotification(message, options);
    },
    
    // Getter/setter para configuración
    getConfig: function() {
      return { ..._defaultConfig };
    },
    
    setConfig: function(config) {
      init(config);
    }
  };
})();

// Inicializar al cargar
document.addEventListener('DOMContentLoaded', function() {
  notifications.init();
  
  // Agregar estilos CSS si no están presentes
  if (!document.getElementById('oficri-notifications-styles')) {
    const style = document.createElement('style');
    style.id = 'oficri-notifications-styles';
    style.textContent = `
      .oficri-notifications {
        position: fixed;
        z-index: 9999;
        max-width: 320px;
        box-sizing: border-box;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      }
      
      .oficri-notifications-top-right {
        top: 12px;
        right: 12px;
      }
      
      .oficri-notifications-top-left {
        top: 12px;
        left: 12px;
      }
      
      .oficri-notifications-bottom-right {
        bottom: 12px;
        right: 12px;
      }
      
      .oficri-notifications-bottom-left {
        bottom: 12px;
        left: 12px;
      }
      
      .oficri-notification {
        position: relative;
        min-width: 280px;
        margin-bottom: 10px;
        padding: 15px 15px 15px 20px;
        border-radius: 4px;
        box-shadow: 0 1px 10px rgba(0, 0, 0, 0.1);
        background: #fff;
        color: #333;
        overflow: hidden;
      }
      
      .oficri-notification-title {
        font-weight: bold;
        margin-bottom: 5px;
        padding-right: 20px;
      }
      
      .oficri-notification-message {
        word-wrap: break-word;
        padding-right: 20px;
      }
      
      .oficri-notification-close {
        position: absolute;
        top: 5px;
        right: 10px;
        background: transparent;
        border: 0;
        font-size: 20px;
        line-height: 1;
        cursor: pointer;
        color: rgba(0, 0, 0, 0.6);
      }
      
      .oficri-notification-progress {
        position: absolute;
        bottom: 0;
        left: 0;
        width: 100%;
        height: 4px;
        background: rgba(0, 0, 0, 0.1);
        z-index: 1;
      }
      
      .oficri-notification-progress-bar {
        height: 100%;
        width: 100%;
        transition: width linear;
      }
      
      .oficri-notification-success {
        background-color: #51A351;
        color: white;
        border-left: 5px solid #387038;
      }
      
      .oficri-notification-success .oficri-notification-progress-bar {
        background-color: #387038;
      }
      
      .oficri-notification-error {
        background-color: #BD362F;
        color: white;
        border-left: 5px solid #802420;
      }
      
      .oficri-notification-error .oficri-notification-progress-bar {
        background-color: #802420;
      }
      
      .oficri-notification-warning {
        background-color: #F89406;
        color: white;
        border-left: 5px solid #AD6704;
      }
      
      .oficri-notification-warning .oficri-notification-progress-bar {
        background-color: #AD6704;
      }
      
      .oficri-notification-info {
        background-color: #2F96B4;
        color: white;
        border-left: 5px solid #1F6377;
      }
      
      .oficri-notification-info .oficri-notification-progress-bar {
        background-color: #1F6377;
      }
      
      .oficri-notifications-theme-dark .oficri-notification {
        background-color: #333;
        color: #f5f5f5;
      }
      
      .oficri-notifications-theme-dark .oficri-notification-close {
        color: rgba(255, 255, 255, 0.7);
      }
    `;
    document.head.appendChild(style);
  }
});

// Exportar para ES modules
export { notifications };

// Para compatibilidad con navegadores antiguos
window.OFICRI.notifications = notifications;
