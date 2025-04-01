/**
 * OFICRI Debug Logger
 * Utilidad para logs de depuración con diferentes niveles y módulos
 */

import { appConfig } from '../config/appConfig.js';

// Constantes de niveles de log
const LOG_LEVELS = {
  DEBUG: 10,
  INFO: 20,
  WARN: 30,
  ERROR: 40,
  CRITICAL: 50
};

// Configuración por defecto
const DEFAULT_CONFIG = {
  enabled: true,
  minLevel: LOG_LEVELS.DEBUG,
  useColors: true,
  includeTimestamp: true,
  moduleLevels: {}
};

// Colores para cada nivel
const COLORS = {
  DEBUG: 'color: #6c757d',
  INFO: 'color: #0d6efd',
  WARN: 'color: #ffc107',
  ERROR: 'color: #dc3545',
  CRITICAL: 'color: #ffffff; background-color: #dc3545'
};

// Estado del logger
let _config = { ...DEFAULT_CONFIG };

/**
 * Inicializa el logger con una configuración personalizada
 * @param {Object} config - Configuración del logger
 */
function init(config = {}) {
  _config = {
    ...DEFAULT_CONFIG,
    ...config,
    moduleLevels: { ...DEFAULT_CONFIG.moduleLevels, ...(config.moduleLevels || {}) }
  };
  
  if (appConfig && appConfig.logging && appConfig.logging.level) {
    // Convertir nivel de log de string a número
    const levelName = appConfig.logging.level.toUpperCase();
    if (LOG_LEVELS[levelName]) {
      _config.minLevel = LOG_LEVELS[levelName];
    }
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
    debug: (message, data) => {
      if (_shouldLog(moduleName, LOG_LEVELS.DEBUG)) {
        console.debug(..._formatLogMessage(moduleName, 'DEBUG', message, data));
      }
    },
    
    info: (message, data) => {
      if (_shouldLog(moduleName, LOG_LEVELS.INFO)) {
        console.info(..._formatLogMessage(moduleName, 'INFO', message, data));
      }
    },
    
    warn: (message, data) => {
      if (_shouldLog(moduleName, LOG_LEVELS.WARN)) {
        console.warn(..._formatLogMessage(moduleName, 'WARN', message, data));
      }
    },
    
    error: (message, data) => {
      if (_shouldLog(moduleName, LOG_LEVELS.ERROR)) {
        console.error(..._formatLogMessage(moduleName, 'ERROR', message, data));
      }
    },
    
    critical: (message, data) => {
      if (_shouldLog(moduleName, LOG_LEVELS.CRITICAL)) {
        console.error(..._formatLogMessage(moduleName, 'CRITICAL', message, data));
      }
    },
    
    group: (title) => {
      if (_shouldLog(moduleName, LOG_LEVELS.DEBUG)) {
        console.group(title);
      }
    },
    
    groupEnd: () => {
      if (_shouldLog(moduleName, LOG_LEVELS.DEBUG)) {
        console.groupEnd();
      }
    }
  };
}

// Inicializar con valores por defecto
init();

// Exportar API pública
export const debugLogger = {
  init,
  createLogger,
  LOG_LEVELS
};

export default debugLogger; 