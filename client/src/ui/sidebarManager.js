/**
 * OFICRI Sidebar Manager
 * Módulo para gestionar el sidebar de navegación en la interfaz administrativa
 */

import { traceLog } from '../utils/trace_log.js';

// Constantes
const STORAGE_KEY = 'OFICRI_SIDEBAR_STATE';
const SIDEBAR_COLLAPSED_CLASS = 'sidebar-collapsed';
const SIDEBAR_SHOW_CLASS = 'show';

/**
 * Estado del sidebar
 * @private
 */
let _sidebarState = {
  collapsed: false,
  initialized: false,
  isMobile: false
};

/**
 * Comprueba si la pantalla es móvil
 * @returns {boolean} True si es una pantalla móvil
 * @private
 */
function _isMobile() {
  return window.innerWidth < 992;
}

/**
 * Inicializa el gestor del sidebar
 * @param {Object} options - Opciones de configuración
 * @param {string} options.sidebarSelector - Selector CSS del sidebar
 * @param {string} options.toggleButtonSelector - Selector CSS del botón de alternar
 * @param {string} options.mainContentSelector - Selector CSS del contenido principal
 * @param {string} options.appContainerSelector - Selector CSS del contenedor de la aplicación
 * @param {boolean} options.restoreState - Si debe restaurar el estado previo desde localStorage
 * @returns {Object} API pública del gestor de sidebar
 */
function init(options = {}) {
  // Registrar inicio de inicialización
  traceLog.info('SIDEBAR', 'Iniciando inicialización del Sidebar Manager', options);
  
  const config = {
    sidebarSelector: '#sidebar',
    toggleButtonSelector: '#menu-toggle',
    mainContentSelector: '.oficri-main',
    appContainerSelector: '.oficri-app',
    restoreState: true,
    ...options
  };

  // Elementos DOM
  const sidebar = document.querySelector(config.sidebarSelector);
  const toggleButton = document.querySelector(config.toggleButtonSelector);
  const mainContent = document.querySelector(config.mainContentSelector);
  const appContainer = document.querySelector(config.appContainerSelector);

  // Verificar que se encontraron todos los elementos
  if (!sidebar) {
    traceLog.error('SIDEBAR', 'No se encontró el elemento sidebar', { selector: config.sidebarSelector });
    return null;
  }
  
  if (!toggleButton) {
    traceLog.error('SIDEBAR', 'No se encontró el botón de toggle', { selector: config.toggleButtonSelector });
    return null;
  }
  
  if (!mainContent) {
    traceLog.error('SIDEBAR', 'No se encontró el contenido principal', { selector: config.mainContentSelector });
    return null;
  }
  
  if (!appContainer) {
    traceLog.error('SIDEBAR', 'No se encontró el contenedor de la aplicación', { selector: config.appContainerSelector });
    return null;
  }

  traceLog.info('SIDEBAR', 'Elementos DOM encontrados correctamente');

  // Actualizar estado de móvil
  _sidebarState.isMobile = _isMobile();

  // Restaurar estado anterior si está habilitado
  if (config.restoreState) {
    _restoreState();
  }

  // Aplicar estado inicial
  _applyState(sidebar, mainContent, appContainer);

  // Configurar evento del botón de alternar
  traceLog.info('SIDEBAR', 'Configurando evento click para el botón toggle', { buttonId: toggleButton.id });
  
  toggleButton.addEventListener('click', function(e) {
    e.preventDefault();
    traceLog.info('SIDEBAR', 'Botón toggle clickeado');
    toggle(sidebar, mainContent, appContainer);
  });

  // Configurar evento de redimensión de ventana
  window.addEventListener('resize', function() {
    const wasMobile = _sidebarState.isMobile;
    _sidebarState.isMobile = _isMobile();
    
    if (wasMobile !== _sidebarState.isMobile) {
      traceLog.info('SIDEBAR', 'Cambio de modo detectado', { 
        from: wasMobile ? 'mobile' : 'desktop',
        to: _sidebarState.isMobile ? 'mobile' : 'desktop'
      });
      _applyState(sidebar, mainContent, appContainer);
    }
  });

  // Marcar como inicializado
  _sidebarState.initialized = true;
  traceLog.info('SIDEBAR', 'Sidebar Manager inicializado', { state: _sidebarState });

  // Devolver API pública
  const api = {
    isCollapsed: function() { return _sidebarState.collapsed; },
    toggle: function() { toggle(sidebar, mainContent, appContainer); },
    show: function() { show(sidebar, mainContent, appContainer); },
    hide: function() { hide(sidebar, mainContent, appContainer); }
  };
  
  // Guardar la API en una variable global para facilitar el acceso
  window.OFICRI = window.OFICRI || {};
  window.OFICRI.sidebarManagerApi = api;
  
  return api;
}

/**
 * Restaura el estado desde localStorage
 * @private
 */
function _restoreState() {
  try {
    const savedState = localStorage.getItem(STORAGE_KEY);
    if (savedState) {
      const parsed = JSON.parse(savedState);
      _sidebarState.collapsed = parsed.collapsed;
      traceLog.info('SIDEBAR', 'Estado de sidebar restaurado', { state: _sidebarState });
    }
  } catch (error) {
    traceLog.error('SIDEBAR', 'Error al restaurar el estado del sidebar', error);
  }
}

/**
 * Guarda el estado en localStorage
 * @private
 */
function _saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(_sidebarState));
    traceLog.info('SIDEBAR', 'Estado guardado en localStorage', { state: _sidebarState });
  } catch (error) {
    traceLog.error('SIDEBAR', 'Error al guardar el estado del sidebar', error);
  }
}

/**
 * Aplica el estado actual a los elementos DOM
 * @param {HTMLElement} sidebar - Elemento del sidebar
 * @param {HTMLElement} mainContent - Elemento del contenido principal
 * @param {HTMLElement} appContainer - Elemento del contenedor de la aplicación
 * @private
 */
function _applyState(sidebar, mainContent, appContainer) {
  traceLog.info('SIDEBAR', 'Aplicando estado', { 
    collapsed: _sidebarState.collapsed,
    isMobile: _sidebarState.isMobile 
  });
  
  if (_sidebarState.isMobile) {
    // En móvil, usamos la clase show
    if (_sidebarState.collapsed) {
      sidebar.classList.remove(SIDEBAR_SHOW_CLASS);
    } else {
      sidebar.classList.add(SIDEBAR_SHOW_CLASS);
    }
  } else {
    // En desktop, usamos la clase sidebar-collapsed
    if (_sidebarState.collapsed) {
      appContainer.classList.add(SIDEBAR_COLLAPSED_CLASS);
    } else {
      appContainer.classList.remove(SIDEBAR_COLLAPSED_CLASS);
    }
  }
}

/**
 * Muestra el sidebar
 * @param {HTMLElement} sidebar - Elemento del sidebar
 * @param {HTMLElement} mainContent - Elemento del contenido principal
 * @param {HTMLElement} appContainer - Elemento del contenedor de la aplicación
 */
function show(sidebar, mainContent, appContainer) {
  // Si no se proporcionan los elementos, intentar encontrarlos
  if (!sidebar || !mainContent || !appContainer) {
    traceLog.info('SIDEBAR', 'Buscando elementos DOM en show()');
    sidebar = document.querySelector('#sidebar');
    mainContent = document.querySelector('.oficri-main');
    appContainer = document.querySelector('.oficri-app');
    
    if (!sidebar || !mainContent || !appContainer) {
      traceLog.error('SIDEBAR', 'No se pudieron encontrar los elementos DOM necesarios en show()');
      return;
    }
  }
  
  _sidebarState.collapsed = false;
  _applyState(sidebar, mainContent, appContainer);
  _saveState();
  traceLog.info('SIDEBAR', 'Sidebar mostrado');
}

/**
 * Oculta el sidebar
 * @param {HTMLElement} sidebar - Elemento del sidebar
 * @param {HTMLElement} mainContent - Elemento del contenido principal
 * @param {HTMLElement} appContainer - Elemento del contenedor de la aplicación
 */
function hide(sidebar, mainContent, appContainer) {
  // Si no se proporcionan los elementos, intentar encontrarlos
  if (!sidebar || !mainContent || !appContainer) {
    traceLog.info('SIDEBAR', 'Buscando elementos DOM en hide()');
    sidebar = document.querySelector('#sidebar');
    mainContent = document.querySelector('.oficri-main');
    appContainer = document.querySelector('.oficri-app');
    
    if (!sidebar || !mainContent || !appContainer) {
      traceLog.error('SIDEBAR', 'No se pudieron encontrar los elementos DOM necesarios en hide()');
      return;
    }
  }
  
  _sidebarState.collapsed = true;
  _applyState(sidebar, mainContent, appContainer);
  _saveState();
  traceLog.info('SIDEBAR', 'Sidebar ocultado');
}

/**
 * Alterna la visibilidad del sidebar
 * @param {HTMLElement} sidebar - Elemento del sidebar
 * @param {HTMLElement} mainContent - Elemento del contenido principal
 * @param {HTMLElement} appContainer - Elemento del contenedor de la aplicación
 */
function toggle(sidebar, mainContent, appContainer) {
  traceLog.info('SIDEBAR', 'Función toggle llamada');
  
  // Si no se proporcionan los elementos, intentar encontrarlos
  if (!sidebar || !mainContent || !appContainer) {
    traceLog.info('SIDEBAR', 'Buscando elementos DOM en toggle()');
    sidebar = document.querySelector('#sidebar');
    mainContent = document.querySelector('.oficri-main');
    appContainer = document.querySelector('.oficri-app');
    
    if (!sidebar || !mainContent || !appContainer) {
      traceLog.error('SIDEBAR', 'No se pudieron encontrar los elementos DOM necesarios en toggle()');
      return;
    }
  }

  _sidebarState.collapsed = !_sidebarState.collapsed;
  _applyState(sidebar, mainContent, appContainer);
  _saveState();
  traceLog.info('SIDEBAR', `Sidebar alternado: ${_sidebarState.collapsed ? 'ocultado' : 'mostrado'}`);
}

// Instalar evento global para debugging
window.toggleOFICRISidebar = function() {
  traceLog.info('SIDEBAR', 'Función global toggleOFICRISidebar llamada');
  if (window.OFICRI && window.OFICRI.sidebarManagerApi) {
    window.OFICRI.sidebarManagerApi.toggle();
    return true;
  } else {
    const elements = [
      document.querySelector('#sidebar'),
      document.querySelector('.oficri-main'),
      document.querySelector('.oficri-app')
    ];
    
    if (elements[0] && elements[1] && elements[2]) {
      toggle(elements[0], elements[1], elements[2]);
      return true;
    }
    
    traceLog.error('SIDEBAR', 'No se pudo alternar el sidebar desde la función global');
    return false;
  }
};

// Exponer API pública
export const sidebarManager = {
  init,
  show,
  hide,
  toggle
};

export default sidebarManager; 