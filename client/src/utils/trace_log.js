/**
 * OFICRI Trace Logger
 * Utilidad simple para hacer trace de eventos y errores sin depender de otros módulos
 */

// Almacenamiento de logs
const traceHistory = [];

// Configuración
const config = {
  enabled: true,
  maxEntries: 500,
  consoleOutput: true
};

/**
 * Registra un mensaje de trace
 * @param {string} source - Fuente/módulo del log
 * @param {string} message - Mensaje a registrar
 * @param {*} [data] - Datos adicionales opcionales
 */
function trace(source, message, data) {
  if (!config.enabled) return;
  
  const entry = {
    timestamp: new Date(),
    source,
    message,
    data: data || null,
    type: 'TRACE'
  };
  
  _addEntry(entry);
}

/**
 * Registra un mensaje de información
 * @param {string} source - Fuente/módulo del log
 * @param {string} message - Mensaje a registrar
 * @param {*} [data] - Datos adicionales opcionales
 */
function info(source, message, data) {
  if (!config.enabled) return;
  
  const entry = {
    timestamp: new Date(),
    source,
    message,
    data: data || null,
    type: 'INFO'
  };
  
  _addEntry(entry);
  
  if (config.consoleOutput) {
    console.info(`[${_formatTime(entry.timestamp)}][${source}] ${message}`, data || '');
  }
}

/**
 * Registra un error
 * @param {string} source - Fuente/módulo del log
 * @param {string} message - Mensaje de error
 * @param {Error|*} [error] - Objeto de error o datos adicionales
 */
function error(source, message, error) {
  if (!config.enabled) return;
  
  const entry = {
    timestamp: new Date(),
    source,
    message,
    error: error instanceof Error ? { 
      message: error.message, 
      stack: error.stack,
      name: error.name 
    } : error || null,
    type: 'ERROR'
  };
  
  _addEntry(entry);
  
  if (config.consoleOutput) {
    console.error(`[${_formatTime(entry.timestamp)}][${source}] ${message}`, error || '');
  }
}

/**
 * Registra el rendimiento de una operación
 * @param {string} source - Fuente/módulo del log
 * @param {string} operation - Nombre de la operación
 * @param {number} timeMs - Tiempo en milisegundos
 */
function performance(source, operation, timeMs) {
  if (!config.enabled) return;
  
  const entry = {
    timestamp: new Date(),
    source,
    message: `Operación '${operation}' completada en ${timeMs}ms`,
    performance: {
      operation,
      timeMs
    },
    type: 'PERFORMANCE'
  };
  
  _addEntry(entry);
  
  if (config.consoleOutput) {
    console.log(`[${_formatTime(entry.timestamp)}][${source}] ${entry.message}`);
  }
}

/**
 * Mide el tiempo de ejecución de una función
 * @param {string} source - Fuente/módulo del log
 * @param {string} operation - Nombre de la operación
 * @param {Function} fn - Función a ejecutar y medir
 * @returns {*} Resultado de la función ejecutada
 */
function measure(source, operation, fn) {
  const start = Date.now();
  try {
    return fn();
  } finally {
    const timeMs = Date.now() - start;
    performance(source, operation, timeMs);
  }
}

/**
 * Mide el tiempo de ejecución de una función asíncrona
 * @param {string} source - Fuente/módulo del log
 * @param {string} operation - Nombre de la operación
 * @param {Function} asyncFn - Función asíncrona a ejecutar y medir
 * @returns {Promise<*>} Promesa con el resultado de la función ejecutada
 */
async function measureAsync(source, operation, asyncFn) {
  const start = Date.now();
  try {
    return await asyncFn();
  } finally {
    const timeMs = Date.now() - start;
    performance(source, operation, timeMs);
  }
}

/**
 * Obtiene todos los logs registrados
 * @returns {Array} Array con todos los logs
 */
function getLogs() {
  return [...traceHistory];
}

/**
 * Limpia todos los logs
 */
function clearLogs() {
  traceHistory.length = 0;
}

/**
 * Activa o desactiva el logger
 * @param {boolean} enabled - True para activar, false para desactivar
 */
function setEnabled(enabled) {
  config.enabled = !!enabled;
}

/**
 * Configura el logger
 * @param {Object} options - Opciones de configuración
 * @param {boolean} [options.enabled] - Si el logger está activado
 * @param {number} [options.maxEntries] - Máximo número de entradas a mantener
 * @param {boolean} [options.consoleOutput] - Si se debe mostrar en consola
 */
function configure(options = {}) {
  if (options.enabled !== undefined) config.enabled = !!options.enabled;
  if (options.maxEntries !== undefined) config.maxEntries = Math.max(1, options.maxEntries);
  if (options.consoleOutput !== undefined) config.consoleOutput = !!options.consoleOutput;
}

/**
 * Formatea una fecha para mostrar en logs
 * @param {Date} date - Fecha a formatear
 * @returns {string} Fecha formateada
 * @private
 */
function _formatTime(date) {
  return date.toISOString().slice(11, 23);
}

/**
 * Añade una entrada al historial de logs
 * @param {Object} entry - Entrada a añadir
 * @private
 */
function _addEntry(entry) {
  traceHistory.push(entry);
  
  // Limitar el tamaño del historial
  if (traceHistory.length > config.maxEntries) {
    traceHistory.shift();
  }
}

// Instalar captura de errores globales
function installGlobalErrorCapture() {
  window.addEventListener('error', function(event) {
    error('GLOBAL', `Error no controlado: ${event.message}`, {
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      error: event.error
    });
    return false; // No interferir con el comportamiento por defecto
  });
  
  window.addEventListener('unhandledrejection', function(event) {
    error('GLOBAL', 'Promesa rechazada no controlada', event.reason);
    return false; // No interferir con el comportamiento por defecto
  });
  
  info('SYSTEM', 'Captura de errores globales instalada');
}

// Exportar la API
export const traceLog = {
  trace,
  info,
  error,
  performance,
  measure,
  measureAsync,
  getLogs,
  clearLogs,
  setEnabled,
  configure,
  installGlobalErrorCapture
};

export default traceLog; 