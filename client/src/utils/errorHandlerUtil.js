/**
 * Utilidad para manejo centralizado de errores
 * Ofrece funciones para el manejo estandarizado de errores en la aplicación
 */

// Importar dependencias
import { authStateManager } from './authStateManager.js';
import { notifications } from '../ui/notifications.js';

// Crear namespace para compatibilidad
window.OFICRI = window.OFICRI || {};

/**
 * Clase para manejo centralizado de errores
 */
const errorHandler = (function() {
  'use strict';

  /**
   * Maneja errores de API de manera centralizada
   * @param {Object} error - Error original de la API
   * @param {boolean} showNotification - Si es true, muestra una notificación al usuario
   * @param {boolean} logToConsole - Si es true, registra el error en la consola
   * @returns {Object} - Error formateado con información adicional
   */
  const handleApiError = function(error, showNotification = true, logToConsole = true) {
    // Si no es un objeto de error válido, crear uno genérico
    if (!error) {
      error = new Error('Error desconocido');
    }

    // Obtener información relevante del error
    const status = error.status || (error.response ? error.response.status : 0);
    let message = '';
    
    // Determinar mensaje apropiado según el tipo de error
    if (error.message) {
      message = error.message;
    } else if (error.response && error.response.data && error.response.data.message) {
      message = error.response.data.message;
    } else if (status) {
      message = `Error ${status}: ${getHttpStatusText(status)}`;
    } else {
      message = 'Error desconocido en la comunicación con el servidor';
    }

    // Crear objeto de error estandarizado
    const formattedError = {
      status,
      message,
      originalError: error,
      timestamp: new Date().toISOString(),
      code: error.code || 'UNKNOWN_ERROR'
    };

    // Registrar en consola si se solicita
    if (logToConsole) {
      console.error('[Error Handler]', formattedError);
    }

    // Mostrar notificación si se solicita
    if (showNotification && window.OFICRI.notifications) {
      showErrorNotification(message);
    }

    return formattedError;
  };

  /**
   * Maneja errores de autenticación (401)
   * @param {Object} error - Error original
   * @returns {Promise} - Promesa rechazada con el error formateado
   */
  const handleAuthError = function(error) {
    // Verificar si ya hay una redirección en curso
    if (authStateManager.getState() === authStateManager.STATES.REDIRECTING) {
      console.warn('[Error Handler] Ya hay una redirección en curso, ignorando error de autenticación');
      return Promise.reject(handleApiError(error, false));
    }
    
    console.warn('[Error Handler] Error de autenticación detectado');
    
    // Si el estado actual permite redirección, proceder
    if (authStateManager.canRedirect('login')) {
      // Limpiar datos de autenticación
      localStorage.removeItem('oficri_token');
      localStorage.removeItem('oficri_user');
      
      // Marcar estado como redirigiendo
      authStateManager.setState(authStateManager.STATES.REDIRECTING);
      
      // Mostrar mensaje al usuario
      showErrorNotification('Su sesión ha expirado. Por favor inicie sesión nuevamente.', 'Sesión expirada');
      
      // Añadir delay para asegurar que el mensaje se muestre
      setTimeout(() => {
        // Redirigir a página de login
        window.location.href = 'index.html';
        
        // Reset estado después de iniciar redirección
        setTimeout(() => {
          authStateManager.setState(null);
        }, 500);
      }, 1500);
    }
    
    return Promise.reject(handleApiError(error, false));
  };

  /**
   * Muestra una notificación de error
   * @param {string} message - Mensaje a mostrar
   * @param {string} title - Título de la notificación
   */
  const showErrorNotification = function(message, title = 'Error') {
    if (window.OFICRI.notifications) {
      notifications.error(message, { title });
    } else {
      console.error(`${title}: ${message}`);
      // Fallback a alert solo en casos críticos
      if (title.includes('crítico') || title.includes('sesión')) {
        alert(`${title}: ${message}`);
      }
    }
  };

  /**
   * Obtiene el texto descriptivo para un código de estado HTTP
   * @param {number} status - Código de estado HTTP
   * @returns {string} - Descripción del código de estado
   */
  const getHttpStatusText = function(status) {
    const statusTexts = {
      400: 'Solicitud incorrecta',
      401: 'No autorizado',
      403: 'Prohibido',
      404: 'No encontrado',
      409: 'Conflicto',
      422: 'Entidad no procesable',
      429: 'Demasiadas solicitudes',
      500: 'Error interno del servidor',
      503: 'Servicio no disponible'
    };
    
    return statusTexts[status] || 'Error desconocido';
  };

  /**
   * Maneja errores de red (conexión, timeout, etc.)
   * @param {Object} error - Error original
   * @returns {Object} - Error formateado
   */
  const handleNetworkError = function(error) {
    let message = 'Error de conexión. Verifique su conexión a Internet.';
    
    if (error.name === 'AbortError' || error.message.includes('timeout')) {
      message = 'La solicitud ha excedido el tiempo máximo de espera. Por favor, inténtelo de nuevo.';
    } else if (error.message.includes('Network Error') || error.message.includes('Failed to fetch')) {
      message = 'No se ha podido conectar con el servidor. Por favor, verifique su conexión a Internet.';
    }
    
    return handleApiError({
      message,
      originalError: error,
      status: 0,
      code: 'NETWORK_ERROR'
    });
  };

  // API pública
  return {
    handleApiError,
    handleAuthError,
    handleNetworkError,
    showErrorNotification
  };
})();

// Exportar para ES modules
export { errorHandler };

// Compatibilidad global
window.OFICRI.errorHandler = errorHandler; 