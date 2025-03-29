/**
 * OFICRI Main Application Module
 * Entry point for the application
 */

// Importar módulos necesarios
import { config } from './config/app.config.js';
import { apiClient } from './api/apiClient.js';
import { authService } from './services/authService.js';
import { notifications } from './ui/notifications.js';

// Create namespace if it doesn't exist
window.OFICRI = window.OFICRI || {};

// Main App Module
OFICRI.app = (function() {
  'use strict';
  
  /**
   * Initializes the application
   */
  const _init = function() {
    console.log('[DEBUG-APP] Starting application initialization');
    
    // Initialize core services
    _initServices();
    
    // Apply theme from user preferences
    _applyTheme();
    
    // Set up global event listeners
    _setupGlobalEvents();
    
    // Log initialization if debugging enabled
    if (config.features.debugging) {
      console.log('[DEBUG-APP] OFICRI App initialized:', {
        environment: config.environment.isDevelopment ? 'development' : 'production',
        apiUrl: config.api.baseUrl,
        features: config.features,
        userAgent: navigator.userAgent,
        corsEnabled: typeof config.corsOptions !== 'undefined'
      });
    }
    
    // Inicializar sistema de monitoreo
    initApiMonitor();
  };
  
  /**
   * Initializes core services
   */
  const _initServices = function() {
    console.log('[DEBUG-APP] Initializing core services');
    
    // Setup security protections
    _setupSecurityProtections();
    
    // Setup error handling
    _setupErrorHandling();
    
    console.log('[DEBUG-APP] Core services initialized');
  };
  
  /**
   * Applies theme based on user preferences
   */
  const _applyTheme = function() {
    const theme = localStorage.getItem('oficri_theme') || config.ui.theme || 'light';
    document.documentElement.setAttribute('data-theme', theme);
    
    if (theme === 'dark') {
      document.body.classList.add('dark-theme');
    } else {
      document.body.classList.remove('dark-theme');
    }
  };
  
  /**
   * Sets up global event listeners
   */
  const _setupGlobalEvents = function() {
    // Listen for auth events
    window.addEventListener('storage', function(event) {
      // Handle storage events for auth changes
      if (event.key === config.auth.tokenKey && !event.newValue) {
        // Token was removed in another tab
        window.location.href = '/';
      }
    });
    
    // Add general error handling for unhandled errors
    window.addEventListener('error', function(event) {
      _handleGlobalError(event.error);
    });
    
    // Add promise error handling
    window.addEventListener('unhandledrejection', function(event) {
      _handleGlobalError(event.reason);
    });
  };
  
  /**
   * Sets up security protections
   */
  const _setupSecurityProtections = function() {
    console.log('[DEBUG-APP] Setting up security protections');
    
    // Check existing CSP meta tags
    let existingCSP = null;
    const metaTags = document.getElementsByTagName('meta');
    for (let i = 0; i < metaTags.length; i++) {
      if (metaTags[i].getAttribute('http-equiv') === 'Content-Security-Policy') {
        existingCSP = metaTags[i].getAttribute('content');
        console.log('[DEBUG-APP] Found existing CSP meta tag:', existingCSP);
        break;
      }
    }
    
    // Only add CSP if it doesn't already exist
    if (!existingCSP) {
      console.log('[DEBUG-APP] No existing CSP meta tag found, adding new one');
      
      const cspContent = "default-src 'self'; connect-src 'self' http://localhost:3000 http://localhost:3001; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com; style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com; img-src 'self' data: https:; font-src 'self' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com;";
      
      const meta = document.createElement('meta');
      meta.setAttribute('http-equiv', 'Content-Security-Policy');
      meta.setAttribute('content', cspContent);
      document.head.appendChild(meta);
      
      console.log('[DEBUG-APP] Added CSP meta tag with content:', cspContent);
    } else {
      console.log('[DEBUG-APP] Using existing CSP meta tag');
    }
  };
  
  /**
   * Sets up global error handling
   */
  const _setupErrorHandling = function() {
    // Overriding console.error if debugging is disabled
    if (!config.features.debugging) {
      const originalConsoleError = console.error;
      console.error = function(...args) {
        // Log to analytics or server in production
        if (config.environment.isProduction) {
          // Here we could send error to an error tracking service
        }
        
        // Call original console.error with all arguments
        originalConsoleError.apply(console, args);
      };
    }
  };
  
  /**
   * Handles global uncaught errors
   * @param {Error} error - Uncaught error
   */
  const _handleGlobalError = function(error) {
    if (!error) return;
    
    // Detalle del error para depuración
    const errorDetails = {
      message: error.message || 'Error sin mensaje',
      name: error.name || 'Error desconocido',
      stack: error.stack,
      time: new Date().toISOString()
    };
    
    // Añadir información de API si existe
    if (error.status) {
      errorDetails.status = error.status;
      errorDetails.statusText = error.statusText;
      errorDetails.endpoint = error.url;
      
      if (error.data) {
        errorDetails.serverResponse = error.data;
      }
    }
    
    console.error('Unhandled error:', errorDetails);
    
    // En entorno de desarrollo, mostrar detalles completos
    if (config.environment.isDevelopment) {
      notifications.error(
        `Error: ${error.message || 'Error desconocido'} (${error.name || 'Unknown'})${error.status ? ` [${error.status}]` : ''}`,
        { 
          title: 'Error no controlado', 
          duration: 10000,
          onClick: function() {
            console.info('Detalles completos del error:', errorDetails);
          }
        }
      );
    } else {
      // En producción, mensaje genérico
      notifications.error(
        'Ha ocurrido un error inesperado. Por favor, refresque la página o contacte a soporte.',
        { title: 'Error' }
      );
      
      // Enviar error a servicio de tracking (si está disponible)
      if (typeof window.errorTrackingService !== 'undefined') {
        window.errorTrackingService.captureException(error, { extra: errorDetails });
      }
    }
    
    // Devolver true para indicar que se ha manejado el error
    return true;
  };
  
  /**
   * Inicializa el monitor de API para depuración
   */
  const initApiMonitor = function() {
    // Solo inicializar si está en modo debug
    if (!config.features.debugging) return;
    
    console.log('Inicializando API Monitor');
    
    // Crear elemento flotante para mostrar peticiones activas
    const monitorElement = document.createElement('div');
    monitorElement.id = 'api-monitor';
    monitorElement.style.cssText = `
      position: fixed;
      bottom: 10px;
      right: 10px;
      width: 300px;
      max-height: 200px;
      overflow-y: auto;
      background-color: rgba(0, 0, 0, 0.7);
      color: white;
      font-family: monospace;
      font-size: 11px;
      padding: 10px;
      border-radius: 5px;
      z-index: 10000;
      display: none;
    `;
    
    // Crear botón para mostrar/ocultar
    const toggleButton = document.createElement('button');
    toggleButton.id = 'api-monitor-toggle';
    toggleButton.textContent = 'API';
    toggleButton.style.cssText = `
      position: fixed;
      bottom: 10px;
      right: 10px;
      width: 40px;
      height: 40px;
      background-color: #007bff;
      color: white;
      border: none;
      border-radius: 50%;
      font-weight: bold;
      cursor: pointer;
      z-index: 10001;
    `;
    
    document.body.appendChild(monitorElement);
    document.body.appendChild(toggleButton);
    
    // Botón para limpiar logs
    const clearButton = document.createElement('button');
    clearButton.textContent = 'Limpiar';
    clearButton.style.cssText = `
      background-color: #dc3545;
      color: white;
      border: none;
      border-radius: 3px;
      padding: 2px 6px;
      margin-left: 10px;
      cursor: pointer;
      font-size: 10px;
    `;
    
    // Título del monitor
    const titleElement = document.createElement('div');
    titleElement.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 5px;
      font-weight: bold;
    `;
    titleElement.innerHTML = '<span>API Monitor</span>';
    titleElement.appendChild(clearButton);
    monitorElement.appendChild(titleElement);
    
    // Contenedor para las peticiones
    const requestsContainer = document.createElement('div');
    requestsContainer.id = 'api-monitor-requests';
    monitorElement.appendChild(requestsContainer);
    
    // Toggle de visibilidad
    let isVisible = false;
    toggleButton.addEventListener('click', function() {
      isVisible = !isVisible;
      monitorElement.style.display = isVisible ? 'block' : 'none';
      toggleButton.style.backgroundColor = isVisible ? '#28a745' : '#007bff';
      
      if (isVisible) {
        updateMonitor();
      }
    });
    
    // Limpiar logs
    clearButton.addEventListener('click', function(e) {
      e.stopPropagation();
      apiClient.clearRequestLog();
      updateMonitor();
    });
    
    // Función para actualizar el monitor
    const updateMonitor = function() {
      if (!isVisible) return;
      
      const requestLog = apiClient.getRequestLog();
      const requestsElement = document.getElementById('api-monitor-requests');
      
      // Limpiar contenedor
      requestsElement.innerHTML = '';
      
      if (requestLog.length === 0) {
        requestsElement.innerHTML = '<div style="font-style: italic">No hay peticiones registradas</div>';
        return;
      }
      
      // Mostrar las peticiones más recientes primero
      const reversedLog = [...requestLog].reverse();
      
      // Crear elementos para cada petición
      reversedLog.forEach(entry => {
        const requestElement = document.createElement('div');
        requestElement.style.cssText = `
          margin-bottom: 4px;
          padding: 2px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.2);
        `;
        
        // Color según status
        let statusColor = 'white';
        if (entry.status === 200 || entry.status === 304) statusColor = '#28a745';
        else if (entry.status >= 400) statusColor = '#dc3545';
        else if (entry.status >= 300) statusColor = '#ffc107';
        
        requestElement.innerHTML = `
          <div style="display:flex; justify-content:space-between">
            <span>${entry.method} ${entry.url.split('/').pop()}</span>
            <span style="color:${statusColor}">${entry.status}</span>
          </div>
          <div style="font-size:10px; opacity:0.7">
            ${new Date(entry.timestamp).toLocaleTimeString()} 
            ${entry.duration ? `(${entry.duration}ms)` : ''}
          </div>
        `;
        
        requestsElement.appendChild(requestElement);
      });
    };
    
    // Actualizar cada 2 segundos
    setInterval(updateMonitor, 2000);
  };
  
  // Public API
  return {
    init: _init,
    getVersion: function() {
      return '1.0.0';
    }
  };
})();

// Initialize the application when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  OFICRI.app.init();
});

// Export for modules
export const app = OFICRI.app; 