/**
 * Utilidades HTTP para OFICRI
 * Proporciona funciones útiles para operaciones HTTP comunes
 */

// Importaciones
import { config } from '../config/app.config.js';
import { errorHandler } from './errorHandlerUtil.js';

// Crear namespace para compatibilidad
window.OFICRI = window.OFICRI || {};

/**
 * Utilidades HTTP
 */
const httpUtil = (function() {
  'use strict';

  /**
   * Construye una URL con parámetros de consulta
   * @param {string} baseUrl - URL base
   * @param {Object} params - Parámetros a añadir como query string
   * @returns {string} - URL completa con query string
   */
  const buildUrl = function(baseUrl, params) {
    if (!params || Object.keys(params).length === 0) {
      return baseUrl;
    }

    const queryString = Object.keys(params)
      .filter(key => params[key] !== undefined && params[key] !== null)
      .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
      .join('&');

    if (!queryString) {
      return baseUrl;
    }

    const separator = baseUrl.includes('?') ? '&' : '?';
    return `${baseUrl}${separator}${queryString}`;
  };

  /**
   * Construye la ruta completa a un endpoint API con base URL configurada
   * @param {string} endpoint - Endpoint sin barra inicial
   * @returns {string} - URL completa
   */
  const buildApiUrl = function(endpoint) {
    const baseUrl = config.api.baseUrl || 'http://localhost:3000/api';
    return `${baseUrl}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
  };

  /**
   * Maneja errores de peticiones HTTP en formato estándar
   * @param {Error} error - Error producido
   * @param {string} context - Contexto de donde proviene el error
   * @returns {Object} - Error formateado para uso en la aplicación
   */
  const handleFetchError = function(error, context = 'API') {
    console.error(`[${context}] Error en petición:`, error);
    
    if (error.name === 'AbortError') {
      return errorHandler.handleNetworkError(error);
    }
    
    if (error.status === 401) {
      return errorHandler.handleAuthError(error);
    }
    
    return errorHandler.handleApiError(error);
  };

  /**
   * Crea una señal de timeout para peticiones fetch
   * @param {number} timeoutMs - Tiempo de espera en milisegundos
   * @returns {AbortSignal} - Señal para controlar el timeout
   */
  const createTimeoutSignal = function(timeoutMs = config.api.timeout || 15000) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    
    // Guardar el timeoutId para poder cancelarlo manualmente si es necesario
    const signal = controller.signal;
    signal.timeoutId = timeoutId;
    
    return signal;
  };

  /**
   * Cancela un timeout de petición
   * @param {AbortSignal} signal - Señal con el timeoutId
   */
  const cancelTimeout = function(signal) {
    if (signal && signal.timeoutId) {
      clearTimeout(signal.timeoutId);
    }
  };

  /**
   * Representa un archivo en Base64 para vista previa
   * @param {File} file - Archivo a representar
   * @returns {Promise<string>} - Promise con la URL de datos
   */
  const fileToDataUrl = function(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error('Error al leer el archivo'));
      reader.readAsDataURL(file);
    });
  };

  // API pública
  return {
    buildUrl,
    buildApiUrl,
    handleFetchError,
    createTimeoutSignal,
    cancelTimeout,
    fileToDataUrl
  };
})();

// Exportar para ES modules
export { httpUtil };

// Compatibilidad global
window.OFICRI.httpUtil = httpUtil; 