/**
 * Main Application Module
 * Entry point for the OFICRI application
 */

import { config } from './config/app.config.js';
import { authService } from './services/authService.js';
import { userService } from './services/userService.js';
// import { router } from './router/router.js';
import { notifications } from './ui/notifications.js';
// import { uiService } from './ui/uiService.js';
// import { langService } from './i18n/langService.js';
import './utils/prototypes.js';
import { authStateManager } from './utils/authStateManager.js';

// Create namespace
window.OFICRI = window.OFICRI || {};

/**
 * Application core module
 */
const app = (function() {
  'use strict';
  
  // Constants
  const APP_INIT_KEY = 'oficri_initialized';
  
  // App version
  const version = '1.0.0';
  
  // Bandera para prevenir múltiples inicializaciones
  let _isInitialized = false;
  let _initializationPromise = null;
  
  /**
   * Initializes the application core
   */
  function _initializeApp() {
    // Evitar múltiples inicializaciones
    if (_isInitialized) {
      console.warn('[App] La aplicación ya fue inicializada');
      return Promise.resolve();
    }
    
    // Si ya hay una inicialización en curso, devolver esa promesa
    if (_initializationPromise) {
      console.log('[App] Inicialización en curso, esperando...');
      return _initializationPromise;
    }
    
    console.log('[App] Iniciando OFICRI...');
    
    // Crear promesa de inicialización
    _initializationPromise = new Promise(async (resolve, reject) => {
      try {
        // Mostrar carga
        _showLoadingScreen();
        
        // Inicializar configuración
        console.log('[App] Cargando configuración...');
        
        // Inicializar servicios uno por uno para asegurar orden correcto
        await _initializeServices();
        
        // Marcar como inicializado
        _isInitialized = true;
        
        // Ocultar carga
        _hideLoadingScreen();
        
        console.log('[App] Inicialización completada');
        resolve();
      } catch (error) {
        console.error('[App] Error durante inicialización:', error);
        _hideLoadingScreen();
        
        // Mostrar error al usuario
        _showErrorMessage('Error al iniciar la aplicación', error.message || 'Intente recargar la página');
        
        reject(error);
      }
    });
    
    return _initializationPromise;
  }

  /**
   * Inicializa los servicios necesarios en orden
   * @private
   */
  async function _initializeServices() {
    try {
      // 1. Verificar si estamos en un ciclo de redirección
      if (authStateManager.isRedirectionCycle()) {
        console.warn('[App] Detectado ciclo de redirección, entrando en modo de recuperación');
        _showErrorMessage('Problema de navegación detectado', 'El sistema está intentando recuperarse. Si persiste, cierre sesión manualmente.');
        return Promise.resolve();
      }
      
      // 2. Manejar redirecciones basadas en autenticación
      if (window.OFICRI && window.OFICRI.authService) {
        console.log('[App] Verificando estado de autenticación...');
        window.OFICRI.authService.redirectIfNeeded();
      }
      
      // 3. Inicializar interfaz de usuario
      if (window.OFICRI && window.OFICRI.uiService) {
        console.log('[App] Inicializando interfaz de usuario...');
        window.OFICRI.uiService.initialize();
      }
      
      // 4. Configurar eventos globales
      _setupGlobalEvents();
      
      return Promise.resolve();
    } catch (error) {
      console.error('[App] Error durante inicialización de servicios:', error);
      return Promise.reject(error);
    }
  }

  /**
   * Configura los eventos globales de la aplicación
   * @private
   */
  function _setupGlobalEvents() {
    // Manejar errores globales no capturados
    window.addEventListener('error', function(event) {
      console.error('[App] Error global no capturado:', event.error || event.message);
      
      // No mostrar errores de script o red para evitar spam
      if (event.filename && !event.filename.includes('oficri')) {
        return;
      }
      
      _showErrorMessage('Error inesperado', 'Ha ocurrido un error en la aplicación. Por favor, recargue la página.');
    });
    
    // Manejar promesas rechazadas no capturadas
    window.addEventListener('unhandledrejection', function(event) {
      console.error('[App] Promesa rechazada no capturada:', event.reason);
    });
  }

  /**
   * Muestra pantalla de carga durante inicialización
   * @private
   */
  function _showLoadingScreen() {
    // Si ya existe un loader, no crear otro
    if (document.getElementById('oficri-app-loader')) {
      return;
    }
    
    const loaderDiv = document.createElement('div');
    loaderDiv.id = 'oficri-app-loader';
    loaderDiv.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(255,255,255,0.8);z-index:9999;display:flex;justify-content:center;align-items:center;';
    
    const spinner = document.createElement('div');
    spinner.style.cssText = 'width:40px;height:40px;border:4px solid #f3f3f3;border-top:4px solid #3498db;border-radius:50%;animation:spin 1s linear infinite;';
    
    loaderDiv.appendChild(spinner);
    document.body.appendChild(loaderDiv);
    
    // Agregar animación de spin
    const style = document.createElement('style');
    style.textContent = '@keyframes spin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}';
    document.head.appendChild(style);
  }

  /**
   * Oculta pantalla de carga
   * @private
   */
  function _hideLoadingScreen() {
    const loader = document.getElementById('oficri-app-loader');
    if (loader) {
      // Usar animación para ocultar suavemente
      loader.style.opacity = '0';
      loader.style.transition = 'opacity 0.3s';
      
      // Eliminar después de la transición
      setTimeout(() => {
        if (loader.parentNode) {
          loader.parentNode.removeChild(loader);
        }
      }, 300);
    }
  }

  /**
   * Muestra mensaje de error al usuario
   * @param {string} title - Título del error
   * @param {string} message - Mensaje detallado
   * @private
   */
  function _showErrorMessage(title, message) {
    // Solo mostrar si existe el servicio de notificaciones
    if (window.OFICRI && window.OFICRI.notifications) {
      window.OFICRI.notifications.showError(title, message);
        return;
      }
      
    // Fallback a alert si no hay servicio de notificaciones
    console.error(`[App] ${title}: ${message}`);
    alert(`${title}: ${message}`);
  }
  
  // Public API
  return {
    init: _initializeApp,
    version
  };
})();

// Assign to global namespace
window.OFICRI.app = app;

// Export for ES modules
export { app };

// Initialize application when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  // Verificar si debe inicializarse automáticamente
  const autoInit = !window.OFICRI.initialized;
  
  if (autoInit) {
    // Iniciar la aplicación
  OFICRI.app.init();
  } else {
    console.log('[APP] Inicialización automática omitida');
  }
});