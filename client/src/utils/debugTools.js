/**
 * OFICRI Debug Tools
 * Utilidades para facilitar la depuración y análisis de la aplicación
 */

import { debugLogger } from './debugLogger.js';
import { appConfig } from '../config/appConfig.js';

// Logger interno
const logger = debugLogger.createLogger('DEBUG_TOOLS');

/**
 * Inicia el inspector de debugLogger con interfaz visual
 * @returns {Object} Objeto con funciones para controlar el inspector
 */
function initDebugInspector() {
  // Verificar si ya existe
  if (document.getElementById('oficri-debug-inspector')) {
    logger.warn('Debug Inspector ya está inicializado');
    return getInspectorAPI();
  }
  
  // Crear elementos de UI
  const container = document.createElement('div');
  container.id = 'oficri-debug-inspector';
  container.style.cssText = `
    position: fixed;
    right: 10px;
    bottom: 10px;
    width: 50px;
    height: 50px;
    background-color: rgba(0, 123, 255, 0.8);
    color: white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
    cursor: pointer;
    z-index: 9999;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
    transition: all 0.3s ease;
  `;
  
  // Icono
  container.innerHTML = '<i class="fas fa-bug"></i>';
  if (!document.querySelector('link[href*="font-awesome"]')) {
    // Fallback si no hay Font Awesome
    container.textContent = '🐞';
  }
  
  // Panel de depuración (inicialmente oculto)
  const panel = document.createElement('div');
  panel.id = 'oficri-debug-panel';
  panel.style.cssText = `
    position: fixed;
    right: 10px;
    bottom: 70px;
    width: 600px;
    height: 400px;
    background-color: white;
    border-radius: 8px;
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
    display: none;
    flex-direction: column;
    z-index: 9998;
    overflow: hidden;
  `;
  
  // Cabecera del panel
  panel.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;padding:10px;background:#f8f9fa;border-bottom:1px solid #dee2e6;">
      <h3 style="margin:0;font-size:16px;">OFICRI Debug Inspector</h3>
      <div>
        <button id="oficri-debug-export" style="margin-right:5px;padding:3px 8px;background:#28a745;color:white;border:none;border-radius:3px;cursor:pointer;">Exportar</button>
        <button id="oficri-debug-clear" style="margin-right:5px;padding:3px 8px;background:#dc3545;color:white;border:none;border-radius:3px;cursor:pointer;">Limpiar</button>
        <button id="oficri-debug-close" style="padding:3px 8px;background:#6c757d;color:white;border:none;border-radius:3px;cursor:pointer;">Cerrar</button>
      </div>
    </div>
    <div style="display:flex;padding:10px;background:#f8f9fa;border-bottom:1px solid #dee2e6;">
      <select id="oficri-debug-level" style="margin-right:10px;padding:5px;border-radius:3px;border:1px solid #ced4da;">
        <option value="trace">TRACE</option>
        <option value="debug">DEBUG</option>
        <option value="info" selected>INFO</option>
        <option value="warn">WARN</option>
        <option value="error">ERROR</option>
      </select>
      <input id="oficri-debug-filter" type="text" placeholder="Filtrar logs..." style="flex-grow:1;padding:5px;border-radius:3px;border:1px solid #ced4da;">
      <button id="oficri-debug-refresh" style="margin-left:10px;padding:5px 10px;background:#0d6efd;color:white;border:none;border-radius:3px;cursor:pointer;">Refrescar</button>
    </div>
    <div id="oficri-debug-logs" style="flex-grow:1;overflow-y:auto;padding:10px;font-family:monospace;font-size:12px;background:#fff;"></div>
    <div id="oficri-debug-status" style="padding:5px 10px;font-size:12px;background:#f8f9fa;border-top:1px solid #dee2e6;">
      Total logs: <span id="oficri-debug-count">0</span>
    </div>
  `;
  
  // Añadir elementos al DOM
  document.body.appendChild(container);
  document.body.appendChild(panel);
  
  // Eventos
  container.addEventListener('click', () => {
    if (panel.style.display === 'none') {
      panel.style.display = 'flex';
      refreshLogs();
    } else {
      panel.style.display = 'none';
    }
  });
  
  document.getElementById('oficri-debug-close').addEventListener('click', (e) => {
    e.stopPropagation();
    panel.style.display = 'none';
  });
  
  document.getElementById('oficri-debug-clear').addEventListener('click', (e) => {
    e.stopPropagation();
    if (confirm('¿Está seguro de borrar todos los logs?')) {
      debugLogger.clearLogs();
      refreshLogs();
    }
  });
  
  document.getElementById('oficri-debug-export').addEventListener('click', (e) => {
    e.stopPropagation();
    exportLogs();
  });
  
  document.getElementById('oficri-debug-refresh').addEventListener('click', (e) => {
    e.stopPropagation();
    refreshLogs();
  });
  
  document.getElementById('oficri-debug-level').addEventListener('change', () => {
    refreshLogs();
  });
  
  document.getElementById('oficri-debug-filter').addEventListener('input', () => {
    refreshLogs();
  });
  
  // Función para refrescar logs
  function refreshLogs() {
    const logsContainer = document.getElementById('oficri-debug-logs');
    const levelSelect = document.getElementById('oficri-debug-level');
    const filterInput = document.getElementById('oficri-debug-filter');
    const countElement = document.getElementById('oficri-debug-count');
    
    // Obtener filtros
    const minLevel = levelSelect.value;
    const filterText = filterInput.value.toLowerCase();
    
    // Obtener logs filtrados
    const logs = debugLogger.getLogs({
      minLevel: minLevel
    }).filter(log => {
      if (!filterText) return true;
      return log.message.toLowerCase().includes(filterText) || 
             log.module.toLowerCase().includes(filterText);
    });
    
    // Actualizar contador
    countElement.textContent = logs.length;
    
    // Colores por nivel
    const levelColors = {
      'TRACE': '#6c757d',
      'DEBUG': '#0d6efd',
      'INFO': '#198754',
      'WARN': '#ffc107',
      'ERROR': '#dc3545',
      'CRITICAL': '#dc3545'
    };
    
    // Renderizar logs
    logsContainer.innerHTML = logs.length > 0 
      ? logs.map(log => `
          <div style="margin-bottom:5px;padding-bottom:5px;border-bottom:1px solid #f0f0f0;">
            <div>
              <span style="color:#6c757d;">${new Date(log.timestamp).toLocaleTimeString()}</span>
              <span style="color:${levelColors[log.level] || '#000'};margin-left:5px;font-weight:bold;">${log.level}</span>
              <span style="color:#0dcaf0;margin-left:5px;">[${log.module}]</span>
            </div>
            <div style="margin-top:3px;">${log.message}</div>
            ${log.data ? `<pre style="margin:3px 0 0;background:#f8f9fa;padding:3px;border-radius:3px;max-height:100px;overflow:auto;">${JSON.stringify(log.data, null, 2)}</pre>` : ''}
          </div>
        `).join('')
      : '<div style="text-align:center;padding:20px;color:#6c757d;">No hay logs que coincidan con los filtros</div>';
  }
  
  // Función para exportar logs
  function exportLogs() {
    const levelSelect = document.getElementById('oficri-debug-level');
    const filterInput = document.getElementById('oficri-debug-filter');
    
    // Obtener filtros
    const minLevel = levelSelect.value;
    const filterText = filterInput.value;
    
    // Exportar los logs filtrados
    const data = debugLogger.exportLogs('json', {
      minLevel: minLevel,
      search: filterText
    });
    
    // Crear y descargar archivo
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    link.href = url;
    link.download = `oficri-debug-logs-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
  
  logger.info('Debug Inspector inicializado');
  return getInspectorAPI();
}

/**
 * Obtiene la API del inspector
 */
function getInspectorAPI() {
  return {
    show: () => {
      const panel = document.getElementById('oficri-debug-panel');
      if (panel) {
        panel.style.display = 'flex';
        // Refrescar logs si existe la función
        if (typeof refreshLogs === 'function') {
          refreshLogs();
        }
      }
    },
    
    hide: () => {
      const panel = document.getElementById('oficri-debug-panel');
      if (panel) {
        panel.style.display = 'none';
      }
    },
    
    toggle: () => {
      const panel = document.getElementById('oficri-debug-panel');
      if (panel) {
        panel.style.display = panel.style.display === 'none' ? 'flex' : 'none';
      }
    },
    
    destroy: () => {
      const container = document.getElementById('oficri-debug-inspector');
      const panel = document.getElementById('oficri-debug-panel');
      
      if (container) document.body.removeChild(container);
      if (panel) document.body.removeChild(panel);
    }
  };
}

/**
 * Inicia el monitoreo global de rendimiento
 */
function initPerformanceMonitoring() {
  if (!window.OFICRI || !window.OFICRI.performance) {
    logger.warn('API de rendimiento no disponible');
    return;
  }
  
  // Monitorear navegación entre páginas
  const originalPushState = history.pushState;
  history.pushState = function() {
    const returnValue = originalPushState.apply(this, arguments);
    
    // Registro de cambio de URL
    logger.info(`Navegación: ${arguments[2]}`);
    
    // Medir tiempo de carga de página
    window.OFICRI.performance.startMeasure('page-navigation');
    
    // Detectar cuando el DOM esté listo
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        const duration = window.OFICRI.performance.endMeasure('page-navigation');
        logger.info(`Navegación completada en ${duration?.toFixed(2)}ms`);
      });
    });
    
    return returnValue;
  };
  
  // Monitorear peticiones AJAX
  const originalXHROpen = XMLHttpRequest.prototype.open;
  const originalXHRSend = XMLHttpRequest.prototype.send;
  
  XMLHttpRequest.prototype.open = function() {
    this.requestMethod = arguments[0];
    this.requestUrl = arguments[1];
    return originalXHROpen.apply(this, arguments);
  };
  
  XMLHttpRequest.prototype.send = function() {
    const xhr = this;
    const startTime = performance.now();
    
    // Registrar inicio de petición
    logger.debug(`XHR Inicio: ${xhr.requestMethod} ${xhr.requestUrl}`);
    
    // Registrar finalización
    xhr.addEventListener('loadend', function() {
      const duration = performance.now() - startTime;
      const status = xhr.status;
      const success = status >= 200 && status < 300;
      
      if (success) {
        logger.info(`XHR Completado: ${xhr.requestMethod} ${xhr.requestUrl} (${duration.toFixed(2)}ms)`, {
          status,
          duration
        });
      } else {
        logger.warn(`XHR Error: ${xhr.requestMethod} ${xhr.requestUrl} (${duration.toFixed(2)}ms)`, {
          status,
          duration,
          response: xhr.responseText
        });
      }
    });
    
    return originalXHRSend.apply(this, arguments);
  };
  
  // Monitorear Fetch API
  const originalFetch = window.fetch;
  
  window.fetch = function() {
    const startTime = performance.now();
    const url = arguments[0].url || arguments[0];
    const method = arguments[1]?.method || 'GET';
    
    // Registrar inicio
    logger.debug(`Fetch Inicio: ${method} ${url}`);
    
    // Capturar respuesta para registrar
    return originalFetch.apply(this, arguments)
      .then(response => {
        const duration = performance.now() - startTime;
        const success = response.ok;
        
        if (success) {
          logger.info(`Fetch Completado: ${method} ${url} (${duration.toFixed(2)}ms)`, {
            status: response.status,
            duration
          });
        } else {
          logger.warn(`Fetch Error: ${method} ${url} (${duration.toFixed(2)}ms)`, {
            status: response.status,
            duration
          });
        }
        
        return response;
      })
      .catch(error => {
        const duration = performance.now() - startTime;
        logger.error(`Fetch Excepción: ${method} ${url} (${duration.toFixed(2)}ms)`, {
          error: error.message,
          duration
        });
        throw error;
      });
  };
  
  // Monitorear clicks en botones
  document.addEventListener('click', function(event) {
    // Solo monitorear elementos específicos
    const target = event.target.closest('button, a, [role="button"]');
    if (!target) return;
    
    // Obtener identificación del elemento
    const id = target.id || '';
    const text = target.textContent?.trim() || '';
    const href = target.href || '';
    const classes = Array.from(target.classList).join(' ');
    
    logger.debug(`Click: ${id || text || href || 'elemento desconocido'}`, {
      id,
      text,
      href,
      classes
    });
  });
  
  logger.info('Monitoreo de rendimiento inicializado');
}

/**
 * Inicializa el depurador global cuando se carga la página
 */
function initDebuggerOnLoad() {
  if (appConfig.isDevelopment() || 
      window.location.search.includes('debug=true') ||
      localStorage.getItem('OFICRI_DEBUG_ENABLED') === 'true') {
    
    // Establecer configuración inicial
    debugLogger.init({
      enabled: true,
      minLevel: debugLogger.LOG_LEVELS.DEBUG,
      persistLogs: true,
      captureGlobalErrors: true,
      enablePerformanceMonitoring: true
    });
    
    // Iniciar inspector visual si estamos en un navegador
    if (typeof window !== 'undefined' && document.body) {
      // Si el DOM ya está listo
      initDebugInspector();
      if (appConfig.logging.enablePerformanceMonitoring) {
        initPerformanceMonitoring();
      }
    } else {
      // Esperar a que el DOM esté listo
      window.addEventListener('DOMContentLoaded', () => {
        initDebugInspector();
        if (appConfig.logging.enablePerformanceMonitoring) {
          initPerformanceMonitoring();
        }
      });
    }
    
    logger.info('Depurador global inicializado automáticamente');
  }
}

/**
 * Establece el nivel de depuración global o por módulo
 * @param {string} level - Nivel de log (trace, debug, info, warn, error, critical)
 * @param {string} [module] - Nombre del módulo (opcional)
 */
function setDebugLevel(level, module) {
  debugLogger.setLevel(level, module);
  logger.info(`Nivel de log ${module ? `para ${module}` : 'global'} establecido a ${level.toUpperCase()}`);
}

/**
 * Activa o desactiva el modo de depuración global
 * @param {boolean} enabled - Si el modo de depuración debe estar activo
 */
function enableDebugMode(enabled = true) {
  // Guardar preferencia
  localStorage.setItem('OFICRI_DEBUG_ENABLED', enabled ? 'true' : 'false');
  
  // Actualizar configuración
  debugLogger.init({
    enabled: enabled,
    minLevel: enabled ? debugLogger.LOG_LEVELS.DEBUG : debugLogger.LOG_LEVELS.INFO,
    persistLogs: enabled,
    captureGlobalErrors: true
  });
  
  if (enabled) {
    // Inicializar inspector si no existe
    if (!document.getElementById('oficri-debug-inspector')) {
      initDebugInspector();
    }
    
    if (appConfig.logging.enablePerformanceMonitoring) {
      initPerformanceMonitoring();
    }
    
    logger.info('Modo de depuración activado');
  } else {
    // Destruir inspector si existe
    const api = getInspectorAPI();
    api.destroy();
    
    logger.info('Modo de depuración desactivado');
  }
}

// Inicializar automáticamente en carga
if (typeof window !== 'undefined') {
  // Para navegadores
  if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', initDebuggerOnLoad);
  } else {
    // El DOM ya está cargado
    initDebuggerOnLoad();
  }
}

// Exponer globalmente
if (window) {
  window.OFICRI = window.OFICRI || {};
  window.OFICRI.debugTools = {
    initDebugInspector,
    enableDebugMode,
    setDebugLevel,
    initPerformanceMonitoring
  };
}

// Exportar API pública
export const debugTools = {
  initDebugInspector,
  enableDebugMode,
  setDebugLevel,
  initPerformanceMonitoring
};

export default debugTools; 