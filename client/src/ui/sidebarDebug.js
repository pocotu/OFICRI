/**
 * OFICRI Sidebar Debugger
 * Herramienta para depurar y diagnosticar problemas con el sidebar
 */

// Configuración global
const DEBUG_PREFIX = '[SIDEBAR DEBUG]';
const SIDEBAR_SELECTOR = '.oficri-sidebar';
const MAIN_CONTENT_SELECTOR = '.oficri-main';
const APP_CONTAINER_SELECTOR = '.oficri-app';
const TOGGLE_BUTTON_SELECTOR = '#menu-toggle';

/**
 * Estado del depurador
 */
const debugState = {
  enabled: true,
  logLevel: 'info', // 'error', 'warn', 'info', 'debug'
  initialized: false,
  sidebarRef: null,
  mainContentRef: null,
  appContainerRef: null,
  toggleButtonRef: null,
  originalToggleHandler: null,
  clickCount: 0
};

// Niveles de log y colores
const LOG_LEVELS = {
  error: { value: 1, color: 'red', consoleMethod: 'error' },
  warn: { value: 2, color: 'orange', consoleMethod: 'warn' },
  info: { value: 3, color: 'blue', consoleMethod: 'info' },
  debug: { value: 4, color: 'gray', consoleMethod: 'log' }
};

/**
 * Registra un mensaje en la consola
 */
function log(level, message, data = null) {
  if (!debugState.enabled) return;
  
  const logConfig = LOG_LEVELS[level] || LOG_LEVELS.info;
  if (LOG_LEVELS[debugState.logLevel].value < logConfig.value) return;
  
  const style = `color: ${logConfig.color}; font-weight: bold;`;
  const timestamp = new Date().toISOString().substring(11, 23);
  
  if (data) {
    console[logConfig.consoleMethod](`%c${DEBUG_PREFIX} [${timestamp}] ${message}`, style, data);
  } else {
    console[logConfig.consoleMethod](`%c${DEBUG_PREFIX} [${timestamp}] ${message}`, style);
  }
}

/**
 * Inicializa el depurador del sidebar
 */
function init() {
  if (debugState.initialized) {
    log('warn', 'El depurador ya está inicializado');
    return;
  }
  
  log('info', 'Inicializando depurador de sidebar');
  
  // Obtener referencias a los elementos DOM
  debugState.sidebarRef = document.querySelector(SIDEBAR_SELECTOR);
  debugState.mainContentRef = document.querySelector(MAIN_CONTENT_SELECTOR);
  debugState.appContainerRef = document.querySelector(APP_CONTAINER_SELECTOR);
  debugState.toggleButtonRef = document.querySelector(TOGGLE_BUTTON_SELECTOR);
  
  // Verificar que todos los elementos existen
  if (!debugState.sidebarRef) log('error', 'No se encontró el elemento sidebar', { selector: SIDEBAR_SELECTOR });
  if (!debugState.mainContentRef) log('error', 'No se encontró el elemento de contenido principal', { selector: MAIN_CONTENT_SELECTOR });
  if (!debugState.appContainerRef) log('error', 'No se encontró el contenedor de la aplicación', { selector: APP_CONTAINER_SELECTOR });
  if (!debugState.toggleButtonRef) log('error', 'No se encontró el botón de toggle', { selector: TOGGLE_BUTTON_SELECTOR });
  
  // Si no se encontraron todos los elementos, mostrar error y salir
  if (!debugState.sidebarRef || !debugState.mainContentRef || !debugState.appContainerRef || !debugState.toggleButtonRef) {
    log('error', 'No se pudieron encontrar todos los elementos DOM necesarios');
    return;
  }
  
  // Interceptar eventos de click en el botón de toggle
  if (debugState.toggleButtonRef) {
    // Guardar cualquier handler existente
    if (debugState.toggleButtonRef.onclick) {
      debugState.originalToggleHandler = debugState.toggleButtonRef.onclick;
    }
    
    // Agregar nuevo handler con debugging
    debugState.toggleButtonRef.addEventListener('click', handleToggleClick, true);
    log('info', 'Handler de click interceptado para el botón toggle');
  }
  
  // Observar cambios en clases para detectar cuándo se oculta/muestra el sidebar
  setupClassObserver();
  
  // Observar cambios en style para detectar manipulaciones directas
  setupStyleObserver();
  
  // Exponer funciones para diagnóstico manual
  exposeGlobalMethods();
  
  // Agregar un botón de depuración directo en la UI
  addDebugControls();
  
  debugState.initialized = true;
  log('info', 'Depurador de sidebar inicializado completamente');
  
  // Analizar el estado actual
  analyzeCurrentState();
}

/**
 * Maneja los clics en el botón de toggle
 */
function handleToggleClick(event) {
  debugState.clickCount++;
  log('info', `Botón de toggle clickeado (${debugState.clickCount})`, { 
    timestamp: new Date().toISOString(),
    target: event.target,
    currentTarget: event.currentTarget,
    eventPhase: getEventPhaseText(event.eventPhase)
  });
  
  // Comprobar preventDefault y stopPropagation
  const eventWillPropagate = !event.cancelBubble && !event._stopped;
  log('debug', `Propagación del evento: ${eventWillPropagate ? 'Permitida' : 'Detenida'}`);
  
  // No impedimos que continúe la ejecución normal
}

/**
 * Devuelve el texto de la fase del evento
 */
function getEventPhaseText(phase) {
  switch(phase) {
    case Event.CAPTURING_PHASE: return 'CAPTURING_PHASE';
    case Event.AT_TARGET: return 'AT_TARGET';
    case Event.BUBBLING_PHASE: return 'BUBBLING_PHASE';
    default: return `DESCONOCIDO (${phase})`;
  }
}

/**
 * Configura un observador para detectar cambios en las clases
 */
function setupClassObserver() {
  const classObserver = new MutationObserver(mutations => {
    mutations.forEach(mutation => {
      if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
        const target = mutation.target;
        log('debug', 'Cambio detectado en clase CSS', {
          element: target.tagName,
          id: target.id,
          oldClassName: mutation.oldValue,
          newClassName: target.className
        });
        
        // Si el cambio es en el container de la app, verificar sidebar-collapsed
        if (target === debugState.appContainerRef) {
          const hasCollapsedClass = target.classList.contains('sidebar-collapsed');
          log('info', `Estado de sidebar: ${hasCollapsedClass ? 'COLAPSADO' : 'EXPANDIDO'}`);
        }
      }
    });
  });
  
  // Observar cambios en clases del contenedor principal
  classObserver.observe(debugState.appContainerRef, { 
    attributes: true, 
    attributeFilter: ['class'],
    attributeOldValue: true
  });
  
  // Observar cambios en clases del sidebar
  classObserver.observe(debugState.sidebarRef, { 
    attributes: true, 
    attributeFilter: ['class'],
    attributeOldValue: true
  });
  
  log('info', 'Observador de clases CSS configurado');
}

/**
 * Configura un observador para detectar cambios en los estilos inline
 */
function setupStyleObserver() {
  const styleObserver = new MutationObserver(mutations => {
    mutations.forEach(mutation => {
      if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
        const target = mutation.target;
        log('debug', 'Cambio detectado en estilo inline', {
          element: target.tagName,
          id: target.id,
          style: target.style.cssText
        });
      }
    });
  });
  
  // Observar cambios en estilos del sidebar
  styleObserver.observe(debugState.sidebarRef, { 
    attributes: true, 
    attributeFilter: ['style'],
    attributeOldValue: true
  });
  
  // Observar cambios en estilos del contenido principal
  styleObserver.observe(debugState.mainContentRef, { 
    attributes: true, 
    attributeFilter: ['style'],
    attributeOldValue: true
  });
  
  log('info', 'Observador de estilos configurado');
}

/**
 * Analiza el estado actual del sidebar
 */
function analyzeCurrentState() {
  log('info', '===== ANÁLISIS DEL ESTADO ACTUAL DEL SIDEBAR =====');
  
  // Comprobar estructura DOM
  checkDOMStructure();
  
  // Comprobar estilos CSS
  checkStyles();
  
  // Comprobar estado de colapsado
  const isCollapsed = debugState.appContainerRef.classList.contains('sidebar-collapsed');
  log('info', `Estado del sidebar: ${isCollapsed ? 'COLAPSADO' : 'EXPANDIDO'}`);
  
  // Comprobar eventos
  checkEvents();
  
  // Comprobar integración con simpleSidebar
  checkSimpleSidebar();
  
  log('info', '===== FIN DEL ANÁLISIS =====');
}

/**
 * Verifica la estructura DOM
 */
function checkDOMStructure() {
  log('info', 'Verificando estructura DOM');
  
  // Comprobar si el sidebar está dentro del contenedor correcto
  const sidebarParent = debugState.sidebarRef.parentElement;
  if (sidebarParent !== debugState.appContainerRef && sidebarParent.className !== 'oficri-container') {
    log('warn', 'El sidebar no está dentro del contenedor adecuado', {
      sidebarParent: sidebarParent.className,
      expectedParent: 'oficri-container'
    });
  } else {
    log('debug', 'Estructura del sidebar correcta');
  }
  
  // Comprobar hermanos
  const siblings = Array.from(sidebarParent.children);
  log('debug', 'Hermanos del sidebar', siblings.map(el => ({ 
    tagName: el.tagName, 
    className: el.className,
    id: el.id 
  })));
}

/**
 * Verifica los estilos CSS
 */
function checkStyles() {
  log('info', 'Verificando estilos CSS');
  
  // Obtener estilos computados
  const sidebarStyles = window.getComputedStyle(debugState.sidebarRef);
  const mainContentStyles = window.getComputedStyle(debugState.mainContentRef);
  
  // Mostrar propiedades relevantes
  log('debug', 'Estilos computados del sidebar', {
    width: sidebarStyles.width,
    minWidth: sidebarStyles.minWidth,
    transform: sidebarStyles.transform,
    visibility: sidebarStyles.visibility,
    transition: sidebarStyles.transition,
    position: sidebarStyles.position,
    zIndex: sidebarStyles.zIndex
  });
  
  log('debug', 'Estilos computados del contenido principal', {
    width: mainContentStyles.width,
    marginLeft: mainContentStyles.marginLeft,
    flex: mainContentStyles.flex
  });
  
  // Verificar CSS cargado
  checkCSSLoaded();
}

/**
 * Verifica que los archivos CSS estén cargados correctamente
 */
function checkCSSLoaded() {
  const cssFiles = Array.from(document.styleSheets).map(sheet => sheet.href || 'inline');
  log('debug', 'Hojas de estilo cargadas', cssFiles);
  
  // Verificar que sidebar.css está cargado
  const sidebarCSSLoaded = cssFiles.some(url => url && url.includes('sidebar.css'));
  if (!sidebarCSSLoaded) {
    log('error', 'No se ha detectado la carga de sidebar.css');
  } else {
    log('debug', 'sidebar.css detectado');
  }
}

/**
 * Verifica los eventos asociados
 */
function checkEvents() {
  log('info', 'Verificando eventos');
  
  // Registrar handler de toggle original
  log('debug', 'Handler original de toggle', debugState.originalToggleHandler);
  
  // Comprobar si simpleSidebar está registrado globalmente
  if (window.simpleSidebar) {
    log('debug', 'simpleSidebar está disponible globalmente');
  } else {
    log('warn', 'simpleSidebar no está disponible en window');
  }
  
  // Comprobar si OFICRI.sidebar está registrado
  if (window.OFICRI && window.OFICRI.sidebar) {
    log('debug', 'OFICRI.sidebar está disponible', window.OFICRI.sidebar);
  } else {
    log('warn', 'OFICRI.sidebar no está disponible');
  }
}

/**
 * Verifica la integración con simpleSidebar
 */
function checkSimpleSidebar() {
  log('info', 'Verificando integración con simpleSidebar');
  
  if (!window.simpleSidebar) {
    log('error', 'simpleSidebar no está definido en el ámbito global');
    return;
  }
  
  // Comprobar métodos disponibles
  const methods = ['init', 'toggleSidebar', 'showSidebar', 'hideSidebar', 'updateLayout', 'isVisible'];
  const missingMethods = methods.filter(method => typeof window.simpleSidebar[method] !== 'function');
  
  if (missingMethods.length > 0) {
    log('error', 'simpleSidebar no tiene todos los métodos esperados', { faltantes: missingMethods });
  } else {
    log('debug', 'La API de simpleSidebar está completa');
  }
}

/**
 * Agrega un panel de control para depuración
 */
function addDebugControls() {
  // Crear contenedor de depuración
  const debugPanel = document.createElement('div');
  debugPanel.id = 'sidebar-debug-panel';
  debugPanel.style.cssText = 'position: fixed; bottom: 10px; right: 10px; background: rgba(0,0,0,0.8); ' +
                            'color: white; padding: 10px; border-radius: 5px; z-index: 9999; ' +
                            'font-family: monospace; font-size: 12px;';
  
  debugPanel.innerHTML = `
    <h3 style="margin-top: 0; color: white;">Sidebar Debug</h3>
    <div>
      <button id="debug-toggle-sidebar">Toggle Sidebar</button>
      <button id="debug-show-sidebar">Mostrar</button>
      <button id="debug-hide-sidebar">Ocultar</button>
    </div>
    <div style="margin-top: 10px;">
      <button id="debug-analyze">Analizar Estado</button>
      <button id="debug-fix-sidebar">Arreglo Emergencia</button>
    </div>
    <div style="margin-top: 10px;">
      <button id="debug-close-panel">Cerrar Panel</button>
    </div>
  `;
  
  document.body.appendChild(debugPanel);
  
  // Configurar handlers
  document.getElementById('debug-toggle-sidebar').addEventListener('click', () => {
    log('info', 'Botón debug-toggle-sidebar clickeado');
    try {
      if (window.simpleSidebar && window.simpleSidebar.toggleSidebar) {
        window.simpleSidebar.toggleSidebar();
      } else {
        log('error', 'No se puede togglear: simpleSidebar no disponible');
      }
    } catch (error) {
      log('error', 'Error al intentar toggleSidebar', error);
    }
  });
  
  document.getElementById('debug-show-sidebar').addEventListener('click', () => {
    log('info', 'Botón debug-show-sidebar clickeado');
    try {
      if (window.simpleSidebar && window.simpleSidebar.showSidebar) {
        window.simpleSidebar.showSidebar();
      } else {
        log('error', 'No se puede mostrar: simpleSidebar no disponible');
      }
    } catch (error) {
      log('error', 'Error al intentar showSidebar', error);
    }
  });
  
  document.getElementById('debug-hide-sidebar').addEventListener('click', () => {
    log('info', 'Botón debug-hide-sidebar clickeado');
    try {
      if (window.simpleSidebar && window.simpleSidebar.hideSidebar) {
        window.simpleSidebar.hideSidebar();
      } else {
        log('error', 'No se puede ocultar: simpleSidebar no disponible');
      }
    } catch (error) {
      log('error', 'Error al intentar hideSidebar', error);
    }
  });
  
  document.getElementById('debug-analyze').addEventListener('click', () => {
    log('info', 'Botón debug-analyze clickeado');
    analyzeCurrentState();
  });
  
  document.getElementById('debug-fix-sidebar').addEventListener('click', () => {
    log('info', 'Botón debug-fix-sidebar clickeado');
    emergencyFix();
  });
  
  document.getElementById('debug-close-panel').addEventListener('click', () => {
    log('info', 'Botón debug-close-panel clickeado');
    debugPanel.remove();
  });
  
  log('info', 'Panel de depuración agregado a la página');
}

/**
 * Expone métodos en el ámbito global para debug manual
 */
function exposeGlobalMethods() {
  window.sidebarDebug = {
    analyzeState: analyzeCurrentState,
    toggleDirectly: forceToggleSidebar,
    showDirectly: forceShowSidebar,
    hideDirectly: forceHideSidebar,
    emergencyFix: emergencyFix,
    getState: getDebugState,
    setLogLevel: (level) => {
      if (LOG_LEVELS[level]) {
        debugState.logLevel = level;
        log('info', `Nivel de log establecido a ${level}`);
      } else {
        log('error', `Nivel de log inválido: ${level}`);
      }
    }
  };
  
  log('info', 'Métodos de depuración expuestos en window.sidebarDebug');
}

/**
 * Fuerza el toggle del sidebar de forma directa
 */
function forceToggleSidebar() {
  log('info', 'Forzando toggle del sidebar directamente');
  
  const appContainer = debugState.appContainerRef;
  const sidebar = debugState.sidebarRef;
  const mainContent = debugState.mainContentRef;
  
  if (appContainer.classList.contains('sidebar-collapsed')) {
    // Mostrar sidebar
    appContainer.classList.remove('sidebar-collapsed');
    sidebar.style.width = '260px';
    sidebar.style.minWidth = '260px';
    sidebar.style.visibility = 'visible';
    sidebar.style.transform = 'translateX(0)';
    mainContent.style.width = 'calc(100% - 260px)';
  } else {
    // Ocultar sidebar
    appContainer.classList.add('sidebar-collapsed');
    sidebar.style.width = '0';
    sidebar.style.minWidth = '0';
    sidebar.style.visibility = 'hidden';
    sidebar.style.transform = 'translateX(-100%)';
    mainContent.style.width = '100%';
  }
  
  log('info', `Sidebar ${appContainer.classList.contains('sidebar-collapsed') ? 'ocultado' : 'mostrado'} forzadamente`);
}

/**
 * Fuerza mostrar el sidebar de forma directa
 */
function forceShowSidebar() {
  log('info', 'Forzando mostrar el sidebar directamente');
  
  const appContainer = debugState.appContainerRef;
  const sidebar = debugState.sidebarRef;
  const mainContent = debugState.mainContentRef;
  
  appContainer.classList.remove('sidebar-collapsed');
  sidebar.style.width = '260px';
  sidebar.style.minWidth = '260px';
  sidebar.style.visibility = 'visible';
  sidebar.style.transform = 'translateX(0)';
  mainContent.style.width = 'calc(100% - 260px)';
  
  log('info', 'Sidebar mostrado forzadamente');
}

/**
 * Fuerza ocultar el sidebar de forma directa
 */
function forceHideSidebar() {
  log('info', 'Forzando ocultar el sidebar directamente');
  
  const appContainer = debugState.appContainerRef;
  const sidebar = debugState.sidebarRef;
  const mainContent = debugState.mainContentRef;
  
  appContainer.classList.add('sidebar-collapsed');
  sidebar.style.width = '0';
  sidebar.style.minWidth = '0';
  sidebar.style.visibility = 'hidden';
  sidebar.style.transform = 'translateX(-100%)';
  mainContent.style.width = '100%';
  
  log('info', 'Sidebar ocultado forzadamente');
}

/**
 * Arreglo de emergencia que reemplaza la funcionalidad del sidebar
 */
function emergencyFix() {
  log('warn', 'Aplicando arreglo de emergencia para el sidebar');
  
  // Reiniciar el botón de toggle
  const toggleButton = debugState.toggleButtonRef;
  
  // Remover todos los listeners existentes creando un clon del botón
  const newToggle = toggleButton.cloneNode(true);
  toggleButton.parentNode.replaceChild(newToggle, toggleButton);
  
  // Actualizar referencia en debugState
  debugState.toggleButtonRef = newToggle;
  
  // Agregar nuevo listener directo
  newToggle.addEventListener('click', function(e) {
    e.preventDefault();
    log('info', 'Botón de toggle clickeado (handler de emergencia)');
    forceToggleSidebar();
  });
  
  // Arreglar clases y estilos iniciales
  const appContainer = debugState.appContainerRef;
  const sidebar = debugState.sidebarRef;
  const mainContent = debugState.mainContentRef;
  
  // Restablecer styles para evitar manipulaciones anteriores problemáticas
  sidebar.removeAttribute('style');
  mainContent.removeAttribute('style');
  
  // Establecer estilos iniciales
  if (appContainer.classList.contains('sidebar-collapsed')) {
    forceHideSidebar();
  } else {
    forceShowSidebar();
  }
  
  log('info', 'Arreglo de emergencia aplicado con éxito');
}

/**
 * Devuelve el estado actual del depurador
 */
function getDebugState() {
  return {
    ...debugState,
    sidebarCollapsed: debugState.appContainerRef ? 
      debugState.appContainerRef.classList.contains('sidebar-collapsed') : 
      null,
    toggleClickCount: debugState.clickCount
  };
}

// Exponer API del depurador
export const sidebarDebug = {
  init,
  analyzeCurrentState,
  forceToggleSidebar,
  forceShowSidebar,
  forceHideSidebar,
  emergencyFix,
  setLogLevel: (level) => {
    if (LOG_LEVELS[level]) {
      debugState.logLevel = level;
      log('info', `Nivel de log establecido a ${level}`);
    }
  }
};

// Asegurar que está disponible globalmente
if (typeof window !== 'undefined') {
  window.sidebarDebug = sidebarDebug;
}

export default sidebarDebug; 