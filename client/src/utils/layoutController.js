/**
 * OFICRI Layout Controller
 * Módulo para gestionar aspectos del layout y ajustes responsivos
 */

import { traceLog } from './trace_log.js';
import { debugLogger } from './debugLogger.js';

// Configuración de logger para seguimiento
const logger = debugLogger.createLogger('LayoutController');

// Constantes
const SIDEBAR_WIDTH = 260; // Debe coincidir con --sidebar-width en CSS
const SIDEBAR_COLLAPSED_CLASS = 'sidebar-collapsed';
const MOBILE_BREAKPOINT = 992; // Debe coincidir con el breakpoint en CSS

/**
 * Inicializa el controlador de layout
 * @param {Object} options - Opciones de configuración
 * @param {string} options.mainContentSelector - Selector del contenido principal
 * @param {string} options.sidebarSelector - Selector del sidebar
 */
function init(options = {}) {
  const config = {
    mainContentSelector: '.oficri-main',
    sidebarSelector: '.oficri-sidebar',
    containerSelector: '.oficri-container',
    appSelector: '.oficri-app',
    ...options
  };
  
  logger.info('Inicializando controlador de layout');
  traceLog.info('LAYOUT', 'Inicializando controlador de layout');
  
  // Elementos DOM
  const mainContent = document.querySelector(config.mainContentSelector);
  const sidebar = document.querySelector(config.sidebarSelector);
  const container = document.querySelector(config.containerSelector);
  const app = document.querySelector(config.appSelector);
  
  if (!mainContent || !sidebar || !container || !app) {
    logger.error('No se encontraron todos los elementos necesarios', {
      mainContent: !!mainContent,
      sidebar: !!sidebar,
      container: !!container,
      app: !!app
    });
    traceLog.error('LAYOUT', 'No se encontraron todos los elementos necesarios', {
      mainContent: !!mainContent,
      sidebar: !!sidebar,
      container: !!container,
      app: !!app
    });
    return {
      updateLayout: () => {},
      resetLayout: () => {}
    };
  }
  
  // Guardar estados originales para referencia
  const originalStyles = {
    mainContent: {
      width: mainContent.style.width,
      marginLeft: mainContent.style.marginLeft,
      maxWidth: mainContent.style.maxWidth,
      flex: mainContent.style.flex
    },
    sidebar: {
      width: sidebar.style.width,
      minWidth: sidebar.style.minWidth,
      transform: sidebar.style.transform,
      overflow: sidebar.style.overflow
    },
    container: {
      width: container.style.width
    }
  };
  
  // Estado actual
  let isUpdating = false;
  let updateTimeout = null;
  
  /**
   * Actualiza el ancho del contenido principal y sidebar
   * @param {Object} [options] - Opciones para la actualización
   * @param {boolean} [options.force=false] - Si debe forzar la actualización independientemente del estado actual
   */
  function updateLayout(options = {}) {
    const opts = {
      force: false,
      ...options
    };
    
    // Evitar múltiples actualizaciones simultáneas a menos que se fuerce
    if (isUpdating && !opts.force) {
      // Programar una actualización después de que termine la actual
      clearTimeout(updateTimeout);
      updateTimeout = setTimeout(() => updateLayout({ force: true }), 100);
      return;
    }
    
    isUpdating = true;
    
    const isSidebarCollapsed = app.classList.contains(SIDEBAR_COLLAPSED_CLASS);
    const isMobile = window.innerWidth < MOBILE_BREAKPOINT;
    
    logger.info('Actualizando layout', {
      isSidebarCollapsed,
      isMobile,
      windowWidth: window.innerWidth
    });
    traceLog.info('LAYOUT', 'Actualizando layout', {
      isSidebarCollapsed,
      isMobile,
      windowWidth: window.innerWidth
    });
    
    // Limpiar propiedades inline que podrían causar conflictos
    _clearInlineStyles();
    
    if (isMobile) {
      // En móvil, el main content siempre ocupa el 100%
      _applyMobileLayout(isSidebarCollapsed);
    } else {
      // En desktop, ajustar según el estado del sidebar
      _applyDesktopLayout(isSidebarCollapsed);
    }
    
    // Inyectar estilos CSS adicionales
    _ensureFixStylesInjected();
    
    // Forzar repintado para eliminar artefactos visuales
    void mainContent.offsetWidth;
    void sidebar.offsetWidth;
    void container.offsetWidth;
    
    // Asegurar que el contenedor principal tenga el ancho correcto
    container.style.width = '100%';
    
    // Terminar la actualización después de un pequeño retraso
    setTimeout(() => {
      isUpdating = false;
      traceLog.debug('LAYOUT', 'Actualización de layout completada');
    }, 50);
  }
  
  /**
   * Aplica layout para dispositivos móviles
   * @private
   */
  function _applyMobileLayout(isSidebarCollapsed) {
    // En móvil, el contenido principal siempre ocupa todo el ancho
    mainContent.style.width = '100%';
    mainContent.style.marginLeft = '0';
    mainContent.style.flex = '1';
    
    // El sidebar tiene posición absoluta en móvil, gestionado por CSS
    if (isSidebarCollapsed) {
      sidebar.style.transform = 'translateX(-100%)';
    } else {
      sidebar.style.transform = 'translateX(0)';
    }
  }
  
  /**
   * Aplica layout para dispositivos desktop
   * @private
   */
  function _applyDesktopLayout(isSidebarCollapsed) {
    if (isSidebarCollapsed) {
      // Cuando el sidebar está colapsado, el contenido ocupa todo el ancho
      mainContent.style.width = '100%';
      mainContent.style.marginLeft = '0';
      mainContent.style.maxWidth = '100%';
      mainContent.style.flex = '1';
      
      // Asegurar que el sidebar esté completamente oculto
      sidebar.style.width = '0';
      sidebar.style.minWidth = '0';
      sidebar.style.flex = '0 0 0';
      sidebar.style.overflow = 'hidden';
    } else {
      // Cuando el sidebar está visible, ajustar el ancho del contenido
      mainContent.style.width = `calc(100% - ${SIDEBAR_WIDTH}px)`;
      mainContent.style.marginLeft = '0';
      
      // Restaurar el sidebar a su tamaño normal
      sidebar.style.width = `${SIDEBAR_WIDTH}px`;
      sidebar.style.minWidth = `${SIDEBAR_WIDTH}px`;
      sidebar.style.flex = `0 0 ${SIDEBAR_WIDTH}px`;
      sidebar.style.overflow = '';
    }
  }
  
  /**
   * Elimina estilos inline para prevenir conflictos
   * @private
   */
  function _clearInlineStyles() {
    // Limpiar estilos del contenido principal
    mainContent.style.removeProperty('width');
    mainContent.style.removeProperty('margin-left');
    mainContent.style.removeProperty('max-width');
    mainContent.style.removeProperty('flex');
    
    // Limpiar estilos del sidebar
    sidebar.style.removeProperty('width');
    sidebar.style.removeProperty('min-width');
    sidebar.style.removeProperty('overflow');
    sidebar.style.removeProperty('flex');
  }
  
  /**
   * Asegura que los estilos de corrección estén inyectados
   * @private
   */
  function _ensureFixStylesInjected() {
    let styleElement = document.getElementById('oficri-layout-fixes');
    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.id = 'oficri-layout-fixes';
      document.head.appendChild(styleElement);
    }
    
    // Estilos de corrección específicos
    styleElement.textContent = `
      .sidebar-collapsed .oficri-main {
        width: 100% !important;
        margin-left: 0 !important;
        max-width: 100% !important;
        flex: 1 !important;
      }
      
      .oficri-container {
        width: 100% !important;
        overflow-x: hidden !important;
      }
      
      .sidebar-collapsed .oficri-sidebar {
        width: 0 !important;
        min-width: 0 !important;
        flex: 0 0 0 !important;
        overflow: hidden !important;
      }
      
      @media (max-width: ${MOBILE_BREAKPOINT}px) {
        .oficri-main {
          width: 100% !important;
          margin-left: 0 !important;
        }
      }
    `;
  }
  
  /**
   * Restaura los estilos originales
   */
  function resetLayout() {
    // Restaurar estilos originales del contenido principal
    Object.keys(originalStyles.mainContent).forEach(key => {
      mainContent.style[key] = originalStyles.mainContent[key];
    });
    
    // Restaurar estilos originales del sidebar
    Object.keys(originalStyles.sidebar).forEach(key => {
      sidebar.style[key] = originalStyles.sidebar[key];
    });
    
    // Restaurar contenedor
    container.style.width = originalStyles.container.width;
    
    logger.info('Layout restaurado a estado original');
    traceLog.info('LAYOUT', 'Layout restaurado a estado original');
  }
  
  // Aplicar inicialmente
  updateLayout({ force: true });
  
  // Escuchar eventos relevantes
  window.addEventListener('resize', () => {
    clearTimeout(updateTimeout);
    updateTimeout = setTimeout(() => updateLayout(), 250);
  });
  
  window.addEventListener('OFICRI_SIDEBAR_STATE_CHANGED', (event) => {
    logger.info('Evento de cambio de sidebar detectado', event.detail);
    traceLog.info('LAYOUT', 'Evento de cambio de sidebar detectado', event.detail);
    updateLayout();
  });
  
  // También agregar un MutationObserver para detectar cambios en las clases del contenedor
  const observer = new MutationObserver(mutations => {
    for (const mutation of mutations) {
      if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
        logger.debug('Detectado cambio de clase en el contenedor', { 
          classes: app.className 
        });
        updateLayout();
        break;
      }
    }
  });
  
  observer.observe(app, { attributes: true });
  
  // Aplicar corrección después de un breve retraso para asegurar que todos los estilos estén aplicados
  setTimeout(() => updateLayout({ force: true }), 300);
  
  // Y otra vez después de la carga completa
  window.addEventListener('load', () => {
    setTimeout(() => updateLayout({ force: true }), 500);
  });
  
  logger.info('Controlador de layout inicializado');
  traceLog.info('LAYOUT', 'Controlador de layout inicializado');
  
  // Exponer API pública
  return {
    updateLayout,
    resetLayout
  };
}

// Exponer API pública
export const layoutController = {
  init
};

export default layoutController; 