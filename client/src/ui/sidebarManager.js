/**
 * OFICRI Sidebar Manager
 * Módulo para gestionar la visibilidad y comportamiento de la barra lateral
 */

import { debugLogger } from '../utils/debugLogger.js';
import { traceLog } from '../utils/trace_log.js';

// Configuración de logger para seguimiento
const logger = debugLogger.createLogger('SidebarManager');

// Constantes
const STORAGE_KEY = 'oficri_sidebar_state';
const SIDEBAR_COLLAPSED_CLASS = 'sidebar-collapsed';
const MENU_TOGGLE_SELECTOR = '.menu-toggle';
const SIDEBAR_SELECTOR = '.oficri-sidebar';
const MAIN_CONTENT_SELECTOR = '.oficri-main';
const APP_CONTAINER_SELECTOR = '.oficri-app';
const MOBILE_BREAKPOINT = 992; // Debe coincidir con el breakpoint en CSS

// Evento personalizado para notificar cambios en el estado del sidebar
const SIDEBAR_STATE_CHANGED_EVENT = 'OFICRI_SIDEBAR_STATE_CHANGED';

// Estado interno
const _sidebarState = {
  collapsed: false,
  initialStateApplied: false,
  isMobile: false
};

/**
 * Inicializa el gestor de la barra lateral
 * @param {Object} options - Opciones de configuración
 */
function init(options = {}) {
  logger.info('Inicializando gestor de barra lateral');
  traceLog.info('SIDEBAR', 'Inicializando gestor de barra lateral');
  
  // Actualizar estado de móvil
  _sidebarState.isMobile = window.innerWidth < MOBILE_BREAKPOINT;
  
  const config = {
    sidebarSelector: SIDEBAR_SELECTOR,
    mainContentSelector: MAIN_CONTENT_SELECTOR,
    menuToggleSelector: MENU_TOGGLE_SELECTOR,
    appContainerSelector: APP_CONTAINER_SELECTOR,
    persistState: true,
    ...options
  };
  
  // Obtener elementos DOM
  const sidebar = document.querySelector(config.sidebarSelector);
  const mainContent = document.querySelector(config.mainContentSelector);
  const menuToggleBtn = document.querySelector(config.menuToggleSelector);
  const appContainer = document.querySelector(config.appContainerSelector);
  
  // Verificar que todos los elementos necesarios existen
  if (!sidebar || !mainContent || !menuToggleBtn || !appContainer) {
    logger.error('No se encontraron todos los elementos necesarios para el sidebar', {
      sidebar: !!sidebar,
      mainContent: !!mainContent,
      menuToggleBtn: !!menuToggleBtn,
      appContainer: !!appContainer
    });
    traceLog.error('SIDEBAR', 'Elementos no encontrados', {
      sidebar: !!sidebar,
      mainContent: !!mainContent,
      menuToggleBtn: !!menuToggleBtn,
      appContainer: !!appContainer
    });
    return {
      toggleSidebar: () => {},
      setSidebarState: () => {},
      getSidebarState: () => false
    };
  }
  
  // Restaurar estado almacenado si existe
  if (config.persistState) {
    _restoreState();
  }
  
  // Manejar caso especial: si estamos en móvil y sidebar no está colapsado, colapsarlo inicialmente
  if (_sidebarState.isMobile && !_sidebarState.collapsed) {
    _sidebarState.collapsed = true;
    if (config.persistState) {
      _saveState();
    }
  }
  
  // Aplicar estado inicial
  _applyState(sidebar, mainContent, appContainer);
  _sidebarState.initialStateApplied = true;
  
  // Configurar evento de clic para el botón de alternar menú
  // Primero eliminar todos los listeners existentes para evitar duplicados
  const newMenuToggleBtn = menuToggleBtn.cloneNode(true);
  menuToggleBtn.parentNode.replaceChild(newMenuToggleBtn, menuToggleBtn);
  
  newMenuToggleBtn.addEventListener('click', function(e) {
    e.preventDefault();
    e.stopPropagation();
    logger.info('Botón toggle clickeado');
    toggleSidebar();
  });
  
  // Configurar evento de redimensión de ventana
  window.addEventListener('resize', function() {
    const wasMobile = _sidebarState.isMobile;
    _sidebarState.isMobile = window.innerWidth < MOBILE_BREAKPOINT;
    
    // Si cambió de desktop a móvil o viceversa, actualizar el estado
    if (wasMobile !== _sidebarState.isMobile) {
      logger.info('Cambio de modo detectado', {
        from: wasMobile ? 'mobile' : 'desktop',
        to: _sidebarState.isMobile ? 'mobile' : 'desktop'
      });
      
      // Actualizar estado (colapsar en móvil por defecto al cambiar de desktop a móvil)
      if (_sidebarState.isMobile && !_sidebarState.collapsed) {
        _sidebarState.collapsed = true;
        _applyState(sidebar, mainContent, appContainer);
        if (config.persistState) {
          _saveState();
        }
      }
      
      // Notificar cambio
      _notifySidebarStateChanged();
    }
  });
  
  logger.info('Gestor de barra lateral inicializado', { 
    collapsed: _sidebarState.collapsed,
    isMobile: _sidebarState.isMobile
  });
  traceLog.info('SIDEBAR', 'Gestor de barra lateral inicializado', { 
    collapsed: _sidebarState.collapsed,
    isMobile: _sidebarState.isMobile
  });
  
  /**
   * Alterna el estado de la barra lateral
   */
  function toggleSidebar() {
    _sidebarState.collapsed = !_sidebarState.collapsed;
    _applyState(sidebar, mainContent, appContainer);
    
    if (config.persistState) {
      _saveState();
    }
    
    logger.info('Estado de barra lateral actualizado', { 
      collapsed: _sidebarState.collapsed,
      isMobile: _sidebarState.isMobile
    });
    traceLog.info('SIDEBAR', 'Estado de barra lateral actualizado', { 
      collapsed: _sidebarState.collapsed 
    });
    
    // Asegurarse de notificar el cambio
    _notifySidebarStateChanged();
    
    return _sidebarState.collapsed;
  }
  
  /**
   * Establece un estado específico para la barra lateral
   * @param {boolean} collapsed - Si debe estar colapsada o no
   */
  function setSidebarState(collapsed) {
    if (_sidebarState.collapsed === collapsed) return;
    
    _sidebarState.collapsed = collapsed;
    _applyState(sidebar, mainContent, appContainer);
    
    if (config.persistState) {
      _saveState();
    }
    
    logger.info('Estado de barra lateral establecido', { 
      collapsed: _sidebarState.collapsed,
      isMobile: _sidebarState.isMobile
    });
    traceLog.info('SIDEBAR', 'Estado de barra lateral establecido', { 
      collapsed: _sidebarState.collapsed 
    });
    
    // Notificar cambio de estado al resto de la aplicación
    _notifySidebarStateChanged();
    
    return _sidebarState.collapsed;
  }
  
  /**
   * Retorna el estado actual de la barra lateral
   * @returns {boolean} - true si está colapsada, false si está expandida
   */
  function getSidebarState() {
    return {
      collapsed: _sidebarState.collapsed,
      isMobile: _sidebarState.isMobile
    };
  }
  
  // Aplicar una actualización inmediata para garantizar estado correcto
  setTimeout(() => {
    _applyState(sidebar, mainContent, appContainer);
    _notifySidebarStateChanged();
  }, 50);
  
  // Exponer API pública
  return {
    toggleSidebar,
    setSidebarState,
    getSidebarState
  };
}

/**
 * Aplica el estado actual a los elementos DOM
 * @private
 */
function _applyState(sidebar, mainContent, appContainer) {
  traceLog.debug('SIDEBAR', 'Aplicando estado', { 
    collapsed: _sidebarState.collapsed,
    isMobile: _sidebarState.isMobile
  });
  
  // Estrategia diferente según si es mobile o desktop
  if (_sidebarState.isMobile) {
    // En móvil, combinamos clases y transformaciones
    if (_sidebarState.collapsed) {
      appContainer.classList.add(SIDEBAR_COLLAPSED_CLASS);
      sidebar.style.transform = 'translateX(-100%)';
      mainContent.style.width = '100%';
      mainContent.style.marginLeft = '0';
    } else {
      appContainer.classList.remove(SIDEBAR_COLLAPSED_CLASS);
      sidebar.style.transform = 'translateX(0)';
      mainContent.style.width = '100%';
      mainContent.style.marginLeft = '0';
    }
  } else {
    // En desktop, aplicamos clase en container y gestionamos ancho
    if (_sidebarState.collapsed) {
      appContainer.classList.add(SIDEBAR_COLLAPSED_CLASS);
      sidebar.style.transform = '';
      
      // Forzar estilos específicos para la visualización correcta
      setTimeout(() => {
        mainContent.style.width = '100%';
        mainContent.style.marginLeft = '0';
        mainContent.style.maxWidth = '100%';
        mainContent.style.flex = '1';
        
        sidebar.style.width = '0';
        sidebar.style.minWidth = '0';
        sidebar.style.overflow = 'hidden';
      }, 10);
    } else {
      appContainer.classList.remove(SIDEBAR_COLLAPSED_CLASS);
      sidebar.style.transform = '';
      
      // Restaurar estilos para sidebar expandido
      setTimeout(() => {
        sidebar.style.width = '';
        sidebar.style.minWidth = '';
        sidebar.style.overflow = '';
        
        mainContent.style.width = '';
        mainContent.style.marginLeft = '';
        mainContent.style.maxWidth = '';
        mainContent.style.flex = '';
      }, 10);
    }
  }
  
  // Disparar evento después de que las transiciones CSS hayan terminado (300ms)
  setTimeout(() => {
    _notifySidebarStateChanged();
  }, 300);
}

/**
 * Guarda el estado actual en localStorage
 * @private
 */
function _saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      collapsed: _sidebarState.collapsed,
      timestamp: Date.now()
    }));
    traceLog.debug('SIDEBAR', 'Estado guardado en localStorage');
  } catch (error) {
    logger.warn('No se pudo guardar el estado del sidebar en localStorage', error);
    traceLog.warn('SIDEBAR', 'Error al guardar estado', error);
  }
}

/**
 * Restaura el estado desde localStorage
 * @private
 */
function _restoreState() {
  try {
    const savedState = localStorage.getItem(STORAGE_KEY);
    if (savedState) {
      const { collapsed } = JSON.parse(savedState);
      _sidebarState.collapsed = collapsed;
      traceLog.debug('SIDEBAR', 'Estado restaurado desde localStorage', { collapsed });
    }
  } catch (error) {
    logger.warn('No se pudo restaurar el estado del sidebar desde localStorage', error);
    traceLog.warn('SIDEBAR', 'Error al restaurar estado', error);
  }
}

/**
 * Notifica a la aplicación que el estado del sidebar ha cambiado
 * @private
 */
function _notifySidebarStateChanged() {
  const event = new CustomEvent(SIDEBAR_STATE_CHANGED_EVENT, {
    detail: {
      collapsed: _sidebarState.collapsed,
      isMobile: _sidebarState.isMobile,
      timestamp: Date.now()
    }
  });
  window.dispatchEvent(event);
  traceLog.debug('SIDEBAR', 'Evento de cambio de estado disparado', { 
    collapsed: _sidebarState.collapsed,
    isMobile: _sidebarState.isMobile
  });
}

// Exponer API pública
export const sidebarManager = {
  init,
  SIDEBAR_STATE_CHANGED_EVENT
};

// Exponer globalmente para acceso desde el HTML
if (typeof window !== 'undefined') {
  window.sidebarManager = sidebarManager;
}

export default sidebarManager; 