/**
 * OFICRI Error Handler
 * Módulo para el manejo centralizado de errores en la aplicación
 */

// Intentar importar notificationManager si está disponible
let notificationManager;
try {
  // Importación dinámica para evitar dependencias circulares
  import('../ui/notificationManager.js').then(module => {
    notificationManager = module.default;
  });
} catch (error) {
  console.warn('No se pudo cargar el gestor de notificaciones:', error);
}

/**
 * Registra un error en la consola y opcionalmente muestra una notificación
 * @param {Error|string} error - Error o mensaje de error
 * @param {string} source - Fuente del error (módulo, componente, etc.)
 * @param {boolean} showNotification - Si se debe mostrar una notificación
 */
export function logError(error, source = 'App', showNotification = false) {
  // Obtener detalles del error
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorStack = error instanceof Error ? error.stack : '';
  
  // Registrar en consola
  console.error(`[${source}] Error:`, errorMessage);
  if (errorStack) {
    console.debug(`[${source}] Stack:`, errorStack);
  }
  
  // Mostrar notificación si se solicita
  if (showNotification) {
    // Intentar usar el gestor de notificaciones
    try {
      if (notificationManager && typeof notificationManager.showError === 'function') {
        notificationManager.showError('Error', errorMessage);
      } else if (window.OFICRI && window.OFICRI.notifications && typeof window.OFICRI.notifications.showError === 'function') {
        window.OFICRI.notifications.showError('Error', errorMessage);
      }
    } catch (notificationError) {
      console.warn('Error al mostrar notificación:', notificationError);
    }
  }
  
  return {
    message: errorMessage,
    source,
    stack: errorStack,
    timestamp: new Date().toISOString()
  };
}

/**
 * Crea un bloque try/catch para ejecutar una función de forma segura
 * @param {Function} fn - Función a ejecutar
 * @param {Object} options - Opciones
 * @param {string} options.source - Fuente del error
 * @param {boolean} options.showNotification - Si se debe mostrar una notificación
 * @param {Function} options.onError - Función a ejecutar en caso de error
 * @returns {*} Resultado de la función o undefined en caso de error
 */
export function tryCatch(fn, options = {}) {
  const { source = 'App', showNotification = false, onError } = options;
  
  try {
    return fn();
  } catch (error) {
    logError(error, source, showNotification);
    
    if (typeof onError === 'function') {
      return onError(error);
    }
    
    return undefined;
  }
}

/**
 * Envuelve una función asíncrona en un try/catch
 * @param {Function} asyncFn - Función asíncrona a ejecutar
 * @param {Object} options - Opciones
 * @param {string} options.source - Fuente del error
 * @param {boolean} options.showNotification - Si se debe mostrar una notificación
 * @param {Function} options.onError - Función a ejecutar en caso de error
 * @returns {Promise<*>} Promesa con el resultado de la función o el resultado de onError
 */
export function asyncTryCatch(asyncFn, options = {}) {
  const { source = 'App', showNotification = false, onError } = options;
  
  return asyncFn().catch(error => {
    logError(error, source, showNotification);
    
    if (typeof onError === 'function') {
      return onError(error);
    }
    
    return Promise.reject(error);
  });
}

// Exportar objeto con funciones
export const errorHandler = {
  logError,
  tryCatch,
  asyncTryCatch
};

// Export default para compatibilidad
export default errorHandler; 