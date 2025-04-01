/**
 * OFICRI Debug Logger
 * Sistema avanzado de logging y depuración global para el lado del cliente
 * 
 * Características:
 * - Logging por niveles y módulos
 * - Captura global de errores no controlados
 * - Almacenamiento de logs en localStorage
 * - Exportación de logs
 * - Monitoreo de rendimiento
 * - Configuración granular
 */

import { appConfig } from '../config/appConfig.js';

// Constantes de niveles de log
const LOG_LEVELS = {
  TRACE: 5,    // Nivel más detallado
  DEBUG: 10,
  INFO: 20,
  WARN: 30,
  ERROR: 40,
  CRITICAL: 50
};

// Convertir nombre de nivel a valor numérico
const getLevelValue = (levelName) => {
  if (typeof levelName === 'number') return levelName;
  return LOG_LEVELS[levelName?.toUpperCase()] || LOG_LEVELS.INFO;
};

// Convertir valor numérico a nombre de nivel
const getLevelName = (levelValue) => {
  for (const [name, value] of Object.entries(LOG_LEVELS)) {
    if (value === levelValue) return name;
  }
  return 'INFO';
};

// Configuración por defecto
const DEFAULT_CONFIG = {
  enabled: true,
  minLevel: LOG_LEVELS.DEBUG,
  useColors: true,
  includeTimestamp: true,
  moduleLevels: {},
  
  // Nuevas opciones
  captureGlobalErrors: true,       // Capturar errores no controlados
  persistLogs: false,              // Guardar logs en localStorage
  maxPersistedLogs: 1000,          // Máximo número de logs persistidos
  enableConsoleOutput: true,       // Mostrar logs en consola
  enablePerformanceMonitoring: false, // Monitorizar rendimiento
  allowLogExport: true,            // Permitir exportar logs
  persistFilters: {                // Filtros para logs persistidos
    minLevel: LOG_LEVELS.WARN      // Por defecto solo guardar WARN+
  }
};

// Colores para cada nivel
const COLORS = {
  TRACE: 'color: #adb5bd',
  DEBUG: 'color: #6c757d',
  INFO: 'color: #0d6efd',
  WARN: 'color: #ffc107',
  ERROR: 'color: #dc3545',
  CRITICAL: 'color: #ffffff; background-color: #dc3545'
};

// Estado del logger
let _config = { ...DEFAULT_CONFIG };

// Almacén de logs persistentes
let _persistedLogs = [];

/**
 * Inicializa el logger con una configuración personalizada
 * @param {Object} config - Configuración del logger
 */
function init(config = {}) {
  // Combinar configuraciones
  _config = {
    ...DEFAULT_CONFIG,
    ...config,
    moduleLevels: { ...DEFAULT_CONFIG.moduleLevels, ...(config.moduleLevels || {}) },
    persistFilters: { ...DEFAULT_CONFIG.persistFilters, ...(config.persistFilters || {}) }
  };
  
  // Aplicar configuración desde appConfig si está disponible
  if (appConfig && appConfig.logging) {
    if (appConfig.logging.level) {
      _config.minLevel = getLevelValue(appConfig.logging.level);
    }
    
    // Otras opciones de configuración
    if (appConfig.logging.persistLogs !== undefined) {
      _config.persistLogs = appConfig.logging.persistLogs;
    }
    
    if (appConfig.logging.captureGlobalErrors !== undefined) {
      _config.captureGlobalErrors = appConfig.logging.captureGlobalErrors;
    }
  }
  
  // Cargar logs persistentes
  if (_config.persistLogs) {
    _loadPersistedLogs();
  }
  
  // Configurar captura de errores globales
  if (_config.captureGlobalErrors) {
    _setupGlobalErrorCapture();
  }
  
  // Iniciar monitoreo de rendimiento
  if (_config.enablePerformanceMonitoring) {
    _setupPerformanceMonitoring();
  }
  
  // Log inicial
  const systemLogger = createLogger('SYSTEM');
  systemLogger.info(`Logger inicializado [nivel: ${getLevelName(_config.minLevel)}]`);
}

/**
 * Configura los escuchas para capturar errores globales no controlados
 * @private
 */
function _setupGlobalErrorCapture() {
  const errorLogger = createLogger('GLOBAL_ERROR');
  
  // Capturar errores de JavaScript no controlados
  window.addEventListener('error', (event) => {
    const { message, filename, lineno, colno, error } = event;
    errorLogger.critical(
      `Error no controlado: ${message}`, 
      { location: `${filename}:${lineno}:${colno}`, stack: error?.stack }
    );
    
    // No prevenir el comportamiento por defecto
    return false;
  });
  
  // Capturar rechazos de promesas no controlados
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    errorLogger.error(
      `Promesa rechazada no controlada: ${reason?.message || reason}`,
      { stack: reason?.stack, detail: reason }
    );
    
    // No prevenir el comportamiento por defecto
    return false;
  });
  
  // Reemplazar console.error para capturar todos los errores
  const originalConsoleError = console.error;
  console.error = function(...args) {
    // Llamar al original
    originalConsoleError.apply(console, args);
    
    // Loggear solo si el primer argumento es un error
    if (args[0] instanceof Error) {
      errorLogger.error(`Console.error: ${args[0].message}`, { stack: args[0].stack });
    }
  };
}

/**
 * Configura monitoreo de rendimiento
 * @private
 */
function _setupPerformanceMonitoring() {
  const perfLogger = createLogger('PERFORMANCE');
  
  // Monitorear carga de la página
  if (window.performance) {
    window.addEventListener('load', () => {
      const { timing } = window.performance;
      const pageLoadTime = timing.loadEventEnd - timing.navigationStart;
      const domReadyTime = timing.domComplete - timing.domLoading;
      
      perfLogger.info(`Página cargada en ${pageLoadTime}ms (DOM: ${domReadyTime}ms)`, {
        details: {
          total: pageLoadTime,
          dom: domReadyTime,
          network: timing.responseEnd - timing.requestStart,
          processing: timing.domComplete - timing.responseEnd
        }
      });
    });
  }
  
  // Crear API para medir rendimiento
  window.OFICRI = window.OFICRI || {};
  window.OFICRI.performance = {
    startMeasure: (label) => {
      if (!_config.enablePerformanceMonitoring) return;
      performance.mark(`${label}-start`);
    },
    
    endMeasure: (label) => {
      if (!_config.enablePerformanceMonitoring) return;
      performance.mark(`${label}-end`);
      
      try {
        performance.measure(label, `${label}-start`, `${label}-end`);
        const measure = performance.getEntriesByName(label)[0];
        perfLogger.debug(`${label}: ${measure.duration.toFixed(2)}ms`);
        
        return measure.duration;
      } catch (e) {
        perfLogger.warn(`Error al medir '${label}': ${e.message}`);
        return null;
      }
    }
  };
}

/**
 * Carga logs persistentes desde localStorage
 * @private
 */
function _loadPersistedLogs() {
  try {
    const storedLogs = localStorage.getItem('OFICRI_DEBUG_LOGS');
    if (storedLogs) {
      _persistedLogs = JSON.parse(storedLogs);
    }
  } catch (e) {
    console.error('Error al cargar logs persistentes:', e);
    _persistedLogs = [];
  }
}

/**
 * Guarda logs en localStorage
 * @private
 */
function _savePersistedLogs() {
  if (!_config.persistLogs) return;
  
  try {
    // Limitar tamaño
    if (_persistedLogs.length > _config.maxPersistedLogs) {
      _persistedLogs = _persistedLogs.slice(-_config.maxPersistedLogs);
    }
    
    localStorage.setItem('OFICRI_DEBUG_LOGS', JSON.stringify(_persistedLogs));
  } catch (e) {
    console.error('Error al guardar logs persistentes:', e);
  }
}

/**
 * Añade un log al almacén persistente
 * @param {string} module - Nombre del módulo
 * @param {string} level - Nivel del log (como texto)
 * @param {string} message - Mensaje a mostrar
 * @param {Object} data - Datos adicionales
 * @private
 */
function _persistLog(module, level, message, data) {
  if (!_config.persistLogs) return;
  
  // Solo persistir si cumple el nivel mínimo
  const levelValue = LOG_LEVELS[level];
  if (levelValue < _config.persistFilters.minLevel) return;
  
  _persistedLogs.push({
    timestamp: new Date().toISOString(),
    module,
    level,
    message,
    data
  });
  
  // Guardar cada 10 logs o en errores/críticos inmediatamente
  if (_persistedLogs.length % 10 === 0 || level === 'ERROR' || level === 'CRITICAL') {
    _savePersistedLogs();
  }
}

/**
 * Función interna para determinar si un log debe mostrarse
 * @param {string} module - Nombre del módulo
 * @param {number} level - Nivel del log
 * @returns {boolean} - True si el log debe mostrarse
 * @private
 */
function _shouldLog(module, level) {
  if (!_config.enabled) return false;
  
  // Verificar nivel específico para el módulo
  if (_config.moduleLevels[module] !== undefined) {
    return level >= _config.moduleLevels[module];
  }
  
  // Usar nivel global
  return level >= _config.minLevel;
}

/**
 * Formatea un mensaje de log
 * @param {string} module - Nombre del módulo
 * @param {string} level - Nivel del log (como texto)
 * @param {string} message - Mensaje a mostrar
 * @param {Object} data - Datos adicionales
 * @returns {Array} - Array con formato para console.log
 * @private
 */
function _formatLogMessage(module, level, message, data) {
  const parts = [];
  let formatString = '';
  
  // Añadir timestamp si está habilitado
  if (_config.includeTimestamp) {
    const now = new Date();
    const timestamp = now.toISOString().slice(11, 23); // HH:MM:SS.mmm
    formatString += '%c[%s]';
    parts.push('color: #888', timestamp);
  }
  
  // Añadir nivel y módulo
  formatString += '%c[%s]%c[%s]%c %s';
  parts.push(
    _config.useColors ? COLORS[level] : '',
    level,
    'color: #0dcaf0',
    module,
    'color: inherit',
    message
  );
  
  // Array final para console.log
  return [formatString, ...parts, data];
}

/**
 * Crea una instancia de logger para un módulo específico
 * @param {string} moduleName - Nombre del módulo
 * @returns {Object} - Objeto con métodos de logging
 */
function createLogger(moduleName) {
  return {
    trace: (message, data) => {
      if (_shouldLog(moduleName, LOG_LEVELS.TRACE)) {
        if (_config.enableConsoleOutput) {
          console.debug(..._formatLogMessage(moduleName, 'TRACE', message, data));
        }
        _persistLog(moduleName, 'TRACE', message, data);
      }
    },
    
    debug: (message, data) => {
      if (_shouldLog(moduleName, LOG_LEVELS.DEBUG)) {
        if (_config.enableConsoleOutput) {
          console.debug(..._formatLogMessage(moduleName, 'DEBUG', message, data));
        }
        _persistLog(moduleName, 'DEBUG', message, data);
      }
    },
    
    info: (message, data) => {
      if (_shouldLog(moduleName, LOG_LEVELS.INFO)) {
        if (_config.enableConsoleOutput) {
          console.info(..._formatLogMessage(moduleName, 'INFO', message, data));
        }
        _persistLog(moduleName, 'INFO', message, data);
      }
    },
    
    warn: (message, data) => {
      if (_shouldLog(moduleName, LOG_LEVELS.WARN)) {
        if (_config.enableConsoleOutput) {
          console.warn(..._formatLogMessage(moduleName, 'WARN', message, data));
        }
        _persistLog(moduleName, 'WARN', message, data);
      }
    },
    
    error: (message, data) => {
      if (_shouldLog(moduleName, LOG_LEVELS.ERROR)) {
        if (_config.enableConsoleOutput) {
          console.error(..._formatLogMessage(moduleName, 'ERROR', message, data));
        }
        _persistLog(moduleName, 'ERROR', message, data);
      }
    },
    
    critical: (message, data) => {
      if (_shouldLog(moduleName, LOG_LEVELS.CRITICAL)) {
        if (_config.enableConsoleOutput) {
          console.error(..._formatLogMessage(moduleName, 'CRITICAL', message, data));
        }
        _persistLog(moduleName, 'CRITICAL', message, data);
      }
    },
    
    group: (title) => {
      if (_shouldLog(moduleName, LOG_LEVELS.DEBUG) && _config.enableConsoleOutput) {
        console.group(title);
      }
    },
    
    groupEnd: () => {
      if (_shouldLog(moduleName, LOG_LEVELS.DEBUG) && _config.enableConsoleOutput) {
        console.groupEnd();
      }
    },
    
    // Función para medir rendimiento
    measure: (label, fn) => {
      if (!_config.enablePerformanceMonitoring) return fn();
      
      window.OFICRI.performance.startMeasure(`${moduleName}.${label}`);
      const result = fn();
      
      if (result instanceof Promise) {
        return result.finally(() => {
          window.OFICRI.performance.endMeasure(`${moduleName}.${label}`);
        });
      } else {
        window.OFICRI.performance.endMeasure(`${moduleName}.${label}`);
        return result;
      }
    }
  };
}

// API global para exportar logs
function exportLogs(format = 'json', filter = {}) {
  if (!_config.allowLogExport) {
    console.warn('La exportación de logs está deshabilitada');
    return null;
  }
  
  try {
    let logs = [..._persistedLogs];
    
    // Aplicar filtros
    if (filter.module) {
      logs = logs.filter(log => log.module === filter.module);
    }
    
    if (filter.minLevel) {
      const minLevel = getLevelValue(filter.minLevel);
      logs = logs.filter(log => LOG_LEVELS[log.level] >= minLevel);
    }
    
    if (filter.from) {
      logs = logs.filter(log => new Date(log.timestamp) >= new Date(filter.from));
    }
    
    if (filter.to) {
      logs = logs.filter(log => new Date(log.timestamp) <= new Date(filter.to));
    }
    
    if (filter.search) {
      const searchTerms = filter.search.toLowerCase();
      logs = logs.filter(log => 
        log.message.toLowerCase().includes(searchTerms) || 
        log.module.toLowerCase().includes(searchTerms)
      );
    }
    
    // Exportar según formato
    if (format === 'json') {
      return JSON.stringify(logs, null, 2);
    } 
    
    if (format === 'csv') {
      const headers = ['Timestamp', 'Module', 'Level', 'Message', 'Data'];
      const rows = logs.map(log => [
        log.timestamp,
        log.module,
        log.level,
        log.message,
        JSON.stringify(log.data || '')
      ]);
      
      return [headers, ...rows]
        .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
        .join('\n');
    }
    
    if (format === 'html') {
      const tableRows = logs.map(log => `
        <tr class="log-level-${log.level.toLowerCase()}">
          <td>${log.timestamp}</td>
          <td>${log.module}</td>
          <td>${log.level}</td>
          <td>${log.message}</td>
          <td><pre>${JSON.stringify(log.data || '', null, 2)}</pre></td>
        </tr>
      `).join('');
      
      return `
        <html>
          <head>
            <title>OFICRI Debug Logs</title>
            <style>
              body { font-family: sans-serif; }
              table { width: 100%; border-collapse: collapse; }
              th, td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
              th { background-color: #f2f2f2; }
              pre { margin: 0; white-space: pre-wrap; }
              .log-level-error, .log-level-critical { background-color: #ffeeee; }
              .log-level-warn { background-color: #ffffee; }
            </style>
          </head>
          <body>
            <h1>OFICRI Debug Logs</h1>
            <p>Exported: ${new Date().toISOString()}</p>
            <table>
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Module</th>
                  <th>Level</th>
                  <th>Message</th>
                  <th>Data</th>
                </tr>
              </thead>
              <tbody>
                ${tableRows}
              </tbody>
            </table>
          </body>
        </html>
      `;
    }
    
    return logs;
  } catch (e) {
    console.error('Error al exportar logs:', e);
    return null;
  }
}

// Limpiar logs persistentes
function clearLogs() {
  _persistedLogs = [];
  _savePersistedLogs();
}

// Actualizar nivel de log en tiempo de ejecución
function setLevel(level, module) {
  if (module) {
    _config.moduleLevels[module] = getLevelValue(level);
  } else {
    _config.minLevel = getLevelValue(level);
  }
  
  const systemLogger = createLogger('SYSTEM');
  systemLogger.info(`Nivel de log actualizado: ${getLevelName(_config.minLevel)}`);
}

// Obtener logs para análisis interno
function getLogs(filter = {}) {
  let logs = [..._persistedLogs];
  
  // Aplicar filtros similares a exportLogs
  if (filter.module) {
    logs = logs.filter(log => log.module === filter.module);
  }
  
  if (filter.minLevel) {
    const minLevel = getLevelValue(filter.minLevel);
    logs = logs.filter(log => LOG_LEVELS[log.level] >= minLevel);
  }
  
  // Otros filtros...
  
  return logs;
}

// Inicializar con valores por defecto
init();

// Registro global para acceso desde la consola del navegador
if (window) {
  window.OFICRI = window.OFICRI || {};
  window.OFICRI.debug = {
    init,
    exportLogs,
    clearLogs,
    setLevel,
    getLogs,
    levels: LOG_LEVELS,
    createLogger
  };
}

// Exportar API pública
export const debugLogger = {
  init,
  createLogger,
  LOG_LEVELS,
  exportLogs,
  clearLogs,
  setLevel,
  getLogs
};

export default debugLogger; 