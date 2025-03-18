/**
 * Utilidades para el manejo centralizado de errores
 * 
 * Este módulo proporciona funciones consistentes para el manejo de errores
 * en toda la aplicación, integrándose con el sistema de logging de seguridad.
 */

// Usar el mock de seguridad para evitar dependencias circulares durante la refactorización
import { log, LOG_LEVEL, logSecurityEvent, SECURITY_EVENT } from './securityMock.js';

// También exportamos estas constantes para que otros módulos puedan usarlas
export { LOG_LEVEL, SECURITY_EVENT };

/**
 * Establece el nivel de log para depuración
 * @param {string} level - Nivel de log a establecer
 */
export function setLogLevel(level) {
    console.log(`[ERROR-HANDLER] Estableciendo nivel de log: ${level}`);
    // Esta función es un stub por ahora
}

/**
 * Función de log centralizada
 * @param {string} module - Módulo que genera el log
 * @param {string} message - Mensaje a registrar
 * @param {Object} data - Datos adicionales
 * @param {string} level - Nivel de log (opcional)
 */
export function logMessage(module, message, data = null, level = LOG_LEVEL.INFO) {
    log(level, message, data, module);
}

// Mantener compatibilidad con código existente usando un alias
export const logEvent = logMessage;

/**
 * Maneja un error de forma consistente
 * @param {string} module - Nombre del módulo donde ocurrió el error
 * @param {Error} error - Objeto de error
 * @param {string} context - Contexto donde ocurrió el error
 * @param {boolean} showToUser - Si se debe mostrar al usuario
 * @returns {boolean} - false para facilitar el manejo en los llamadores
 */
export const handleError = (module, error, context = '', showToUser = false) => {
  // Registrar error en el sistema de logging
  log(
    LOG_LEVEL.ERROR,
    `Error en ${context}: ${error.message}`,
    { stack: error.stack, originalError: error },
    module
  );
  
  // Registrar como evento de seguridad si parece ser un error relacionado con seguridad
  if (
    error.message.includes('permiso') ||
    error.message.includes('autenticación') ||
    error.message.includes('autorización') ||
    error.message.includes('token') ||
    error.status === 401 ||
    error.status === 403
  ) {
    logSecurityEvent(
      SECURITY_EVENT.PERMISSION_ERROR,
      {
        module,
        context,
        message: error.message,
        status: error.status
      }
    );
  }
  
  // Mostrar al usuario si es necesario
  if (showToUser) {
    showErrorToUser(error.message);
  }
  
  // Devolver false para facilitar el manejo en los llamadores
  return false;
};

/**
 * Muestra un error al usuario de manera amigable
 * @param {string} message - Mensaje de error
 * @param {string} title - Título del error (opcional)
 */
export const showErrorToUser = (message, title = 'Error') => {
  // Usar SweetAlert2 si está disponible, o fallback a alert
  if (window.Swal) {
    window.Swal.fire({
      title: title,
      text: message,
      icon: 'error',
      confirmButtonText: 'Aceptar'
    });
  } else {
    alert(`${title}: ${message}`);
  }
};

/**
 * Crea un manejador de errores para un módulo específico
 * @param {string} moduleName - Nombre del módulo
 * @returns {Object} - Objeto con funciones de manejo de errores
 */
export const createErrorHandler = (moduleName) => {
  return {
    /**
     * Maneja un error para este módulo específico
     * @param {Error} error - Error a manejar
     * @param {string} context - Contexto adicional
     * @param {boolean} showToUser - Si mostrar al usuario
     * @returns {boolean} - false para facilitar el manejo
     */
    handle: (error, context = '', showToUser = false) => {
      return handleError(moduleName, error, context, showToUser);
    },
    
    /**
     * Registra un mensaje de error para este módulo
     * @param {string} message - Mensaje a registrar
     * @param {Object} data - Datos adicionales
     */
    logError: (message, data = {}) => {
      log(LOG_LEVEL.ERROR, message, data, moduleName);
    },
    
    /**
     * Registra un mensaje de advertencia para este módulo
     * @param {string} message - Mensaje a registrar
     * @param {Object} data - Datos adicionales
     */
    logWarning: (message, data = {}) => {
      log(LOG_LEVEL.WARN, message, data, moduleName);
    },
    
    /**
     * Registra un mensaje informativo para este módulo
     * @param {string} message - Mensaje a registrar
     * @param {Object} data - Datos adicionales
     */
    logInfo: (message, data = {}) => {
      log(LOG_LEVEL.INFO, message, data, moduleName);
    },
    
    /**
     * Muestra un error al usuario
     * @param {string} message - Mensaje de error
     */
    showError: (message) => {
      showErrorToUser(message);
    }
  };
};

export default {
  handleError,
  showErrorToUser,
  createErrorHandler
}; 