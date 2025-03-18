/**
 * Servicio API centralizado (ISO 27001 A.14.1, A.14.2)
 * 
 * Este servicio proporciona métodos para realizar peticiones HTTP a la API
 * de manera segura, gestionando tokens de autenticación, cabeceras, 
 * validación y errores según las recomendaciones de ISO 27001.
 */

import { APP_CONFIG } from '../../config/app.config.js';
import { SECURITY_PROTECTION } from '../../config/security.config.js';
import { API_CONFIG } from '../../config/api.config.js';
import * as csrfService from '../security/csrf.js';
import * as errorHandler from '../../utils/errorHandler.js';
import * as storageUtils from '../../utils/storageUtils.js';

// Cache para peticiones GET (optimización de rendimiento)
const requestCache = new Map();

// Renombramos para mantener compatibilidad con el código existente
const SECURITY_CONFIG = {
    csrf: SECURITY_PROTECTION.CSRF
};

/**
 * Cliente API centralizado con gestión de seguridad
 */
const apiClient = {
  /**
   * Valida que el endpoint sea seguro
   * @param {string} endpoint - Endpoint a validar
   * @throws {Error} Si el endpoint es inválido
   */
  validateEndpoint(endpoint) {
    if (endpoint.includes('..') || !endpoint.startsWith('/')) {
      throw new Error('Endpoint inválido: ' + endpoint);
    }
    return true;
  },

  /**
   * Construye la URL completa para la petición
   * @param {string} endpoint - Endpoint de la API
   * @returns {string} - URL completa
   */
  buildUrl(endpoint) {
    return `${APP_CONFIG.apiBaseUrl}${endpoint}`;
  },

  /**
   * Construye las opciones para la petición fetch
   * @param {string} method - Método HTTP 
   * @param {boolean} auth - Si requiere autenticación
   * @param {Object} data - Datos para enviar
   * @returns {Object} - Opciones de fetch
   */
  buildRequestOptions(method, auth, data) {
    // Opciones básicas
    const options = {
      method: method.toUpperCase(),
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      credentials: 'same-origin'
    };
    
    // Autenticación
    if (auth) {
      this.addAuthHeader(options);
    }
    
    // CSRF para métodos de modificación
    if (SECURITY_CONFIG.csrf.enabled && 
        (method === 'POST' || method === 'PUT' || method === 'DELETE')) {
      this.addCsrfToken(options);
    }
    
    // Datos para métodos con body
    if (data && (method === 'POST' || method === 'PUT')) {
      options.body = JSON.stringify(data);
    }
    
    return options;
  },
  
  /**
   * Agrega el header de autenticación
   * @param {Object} options - Opciones de fetch
   */
  addAuthHeader(options) {
    const token = this.getAuthToken();
    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    } else {
      // Manejar caso sin token cuando es requerido
      console.warn('API: Petición autenticada sin token disponible');
    }
  },
  
  /**
   * Agrega el token CSRF
   * @param {Object} options - Opciones de fetch
   */
  addCsrfToken(options) {
    const csrfToken = this.getCsrfToken();
    if (csrfToken) {
      options.headers['X-CSRF-Token'] = csrfToken;
    }
  },
  
  /**
   * Verifica y gestiona la caché para peticiones GET
   * @param {string} method - Método HTTP
   * @param {string} url - URL de la petición
   * @param {Object} options - Opciones de fetch
   * @param {boolean} useCache - Si debe usar caché
   * @returns {Object|null} - Datos en caché o null
   */
  checkCache(method, url, options, useCache) {
    if (method !== 'GET' || !useCache) {
      return null;
    }
    
    const cacheKey = `${method}:${url}:${JSON.stringify(options)}`;
    if (requestCache.has(cacheKey)) {
      return { key: cacheKey, data: requestCache.get(cacheKey) };
    }
    
    return { key: cacheKey, data: null };
  },
  
  /**
   * Guarda datos en caché
   * @param {string} cacheKey - Clave de caché
   * @param {Object} data - Datos a guardar
   */
  saveToCache(cacheKey, data) {
    requestCache.set(cacheKey, data);
  },
  
  /**
   * Ejecuta la petición HTTP con timeout
   * @param {string} url - URL de la petición
   * @param {Object} options - Opciones de fetch
   * @returns {Promise<Response>} - Respuesta de fetch
   */
  async executeRequest(url, options, data) {
    // Configurar timeout y ejecutar la petición
    const { controller, timeoutId } = this.configureRequestTimeout();
    options.signal = controller.signal;
    
    try {
      // Registrar la petición y ejecutarla
      this.logRequestAttempt(url, options.method, data);
      const response = await fetch(url, options);
      
      // Limpiar timeout
      this.clearRequestTimeout(timeoutId);
      
      return response;
    } catch (error) {
      // Limpiar timeout también en caso de error
      this.clearRequestTimeout(timeoutId);
      throw error;
    }
  },
  
  /**
   * Configura el controlador de aborto y el timeout para la petición
   * @returns {Object} - Controlador y ID del timeout
   */
  configureRequestTimeout() {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, APP_CONFIG.apiTimeout || 30000);
    
    return { controller, timeoutId };
  },
  
  /**
   * Registra un intento de petición en el log
   * @param {string} url - URL de la petición
   * @param {string} method - Método HTTP
   * @param {Object} data - Datos de la petición (opcional)
   */
  logRequestAttempt(url, method, data) {
    console.log(`API: ${method} ${url}`, data ? { data } : '');
  },
  
  /**
   * Limpia el timeout de la petición
   * @param {number} timeoutId - ID del timeout a limpiar
   */
  clearRequestTimeout(timeoutId) {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  },
  
  /**
   * Maneja errores específicos de la petición
   * @param {Error} error - Error ocurrido
   * @param {string} endpoint - Endpoint de la petición
   * @param {string} method - Método HTTP
   * @param {Object} options - Opciones de configuración
   * @returns {Promise<Object>} - Resultado del manejo de error
   */
  async handleRequestError(error, endpoint, method, options = {}) {
    const { data, auth, cache } = options;
    
    // Error de timeout
    if (error.name === 'AbortError') {
      throw new Error(`La petición a ${endpoint} excedió el tiempo límite`);
    }
    
    // Error de autenticación
    if (error.status === 401 && auth) {
      return await this.handleAuthError(method, endpoint, data, auth, cache);
    }
    
    // Otros errores
    return this.handleError(error, `${method} ${endpoint}`);
  },
  
  /**
   * Maneja errores de autenticación intentando renovar el token
   * @param {string} method - Método HTTP
   * @param {string} endpoint - Endpoint de la petición
   * @param {Object} data - Datos de la petición
   * @param {boolean} auth - Si requiere autenticación
   * @param {boolean} cache - Si debe usar caché
   * @returns {Promise<Object>} - Resultado del manejo de error
   */
  async handleAuthError(method, endpoint, data, auth, cache) {
    try {
      // Intentar renovar el token
      const tokenRefreshed = await this.refreshToken();
      
      if (tokenRefreshed) {
        // Reintentar la petición con el nuevo token
        return this.request(method, endpoint, data, auth, cache);
      }
    } catch (refreshError) {
      console.error('Error al renovar token:', refreshError);
      // Si falla la renovación, redirigir al login
      this.redirectToLogin();
      throw new Error('Sesión expirada. Por favor, inicie sesión nuevamente.');
    }
  },
  
  /**
   * Realiza una petición HTTP genérica
   * @param {string} method - Método HTTP (GET, POST, PUT, DELETE)
   * @param {string} endpoint - Endpoint de la API
   * @param {Object} data - Datos para enviar (para POST, PUT)
   * @param {boolean} auth - Si requiere autenticación
   * @param {boolean} cache - Si debe usar caché (solo para GET)
   * @returns {Promise<Object>} - Datos de la respuesta
   */
  async request(method, endpoint, data = null, auth = true, cache = false) {
    try {
      // 1. Preparar la petición
      const { url, options, cacheResult } = await this.prepareRequest(method, endpoint, data, auth, cache);
      
      // 2. Verificar si hay datos en caché
      if (cacheResult?.data) {
        return cacheResult.data;
      }
      
      // 3. Ejecutar la petición y procesar respuesta
      const responseData = await this.executeAndProcessRequest(url, options, data, method, cache, cacheResult);
      
      return responseData;
    } catch (error) {
      // 4. Manejar errores
      return this.handleRequestError(error, endpoint, method, { data, auth, cache });
    }
  },
  
  /**
   * Prepara los parámetros para una petición
   * @param {string} method - Método HTTP
   * @param {string} endpoint - Endpoint de la API
   * @param {Object} data - Datos para enviar
   * @param {boolean} auth - Si requiere autenticación
   * @param {boolean} cache - Si debe usar caché
   * @returns {Object} - URL, opciones y resultado de caché
   */
  async prepareRequest(method, endpoint, data, auth, cache) {
    // Validar endpoint
    this.validateEndpoint(endpoint);
    
    // Construir URL
    const url = this.buildUrl(endpoint);
    
    // Construir opciones
    const options = this.buildRequestOptions(method, auth, data);
    
    // Verificar caché
    const cacheResult = this.checkCache(method, url, options, cache);
    
    return { url, options, cacheResult };
  },
  
  /**
   * Ejecuta la petición y procesa la respuesta
   * @param {string} url - URL completa
   * @param {Object} options - Opciones de fetch
   * @param {Object} data - Datos de la petición
   * @param {string} method - Método HTTP
   * @param {boolean} cache - Si debe usar caché
   * @param {Object} cacheResult - Resultado de la verificación de caché
   * @returns {Promise<Object>} - Datos procesados de la respuesta
   */
  async executeAndProcessRequest(url, options, data, method, cache, cacheResult) {
    // Ejecutar petición
    const response = await this.executeRequest(url, options, data);
    
    // Procesar respuesta
    const responseData = await this.handleResponse(response);
    
    // Guardar en caché si corresponde
    this.saveToCacheIfNeeded(method, cache, cacheResult, responseData);
    
    return responseData;
  },
  
  /**
   * Guarda los datos en caché si es necesario
   * @param {string} method - Método HTTP
   * @param {boolean} cache - Si debe usar caché
   * @param {Object} cacheResult - Resultado de la verificación de caché
   * @param {Object} responseData - Datos a guardar en caché
   */
  saveToCacheIfNeeded(method, cache, cacheResult, responseData) {
    if (method === 'GET' && cache && cacheResult?.key) {
      this.saveToCache(cacheResult.key, responseData);
    }
  },
  
  /**
   * Realiza una petición GET
   * @param {string} endpoint - Endpoint de la API
   * @param {boolean} auth - Si requiere autenticación
   * @param {boolean} cache - Si debe usar caché
   * @returns {Promise<Object>} - Datos de la respuesta
   */
  async get(endpoint, auth = true, cache = true) {
    return this.request('GET', endpoint, null, auth, cache);
  },
  
  /**
   * Realiza una petición POST
   * @param {string} endpoint - Endpoint de la API
   * @param {Object} data - Datos para enviar
   * @param {boolean} auth - Si requiere autenticación
   * @returns {Promise<Object>} - Datos de la respuesta
   */
  async post(endpoint, data, auth = true) {
    return this.request('POST', endpoint, data, auth, false);
  },
  
  /**
   * Realiza una petición PUT
   * @param {string} endpoint - Endpoint de la API
   * @param {Object} data - Datos para enviar
   * @param {boolean} auth - Si requiere autenticación
   * @returns {Promise<Object>} - Datos de la respuesta
   */
  async put(endpoint, data, auth = true) {
    return this.request('PUT', endpoint, data, auth, false);
  },
  
  /**
   * Realiza una petición DELETE
   * @param {string} endpoint - Endpoint de la API
   * @param {boolean} auth - Si requiere autenticación
   * @returns {Promise<Object>} - Datos de la respuesta
   */
  async delete(endpoint, auth = true) {
    return this.request('DELETE', endpoint, null, auth, false);
  },
  
  /**
   * Procesa la respuesta de la API
   * @param {Response} response - Respuesta de fetch
   * @returns {Promise<Object>} - Datos de la respuesta
   */
  async handleResponse(response) {
    // 1. Verificar y actualizar token CSRF
    this.updateCsrfToken(response);
    
    // 2. Obtener y parsear el contenido de la respuesta
    const { text, data } = await this.parseResponseContent(response);
    
    // 3. Verificar si la respuesta es exitosa
    if (!response.ok) {
      throw this.createResponseError(response, data, text);
    }
    
    // 4. Asegurar formato de respuesta estándar
    return this.standardizeResponse(data);
  },
  
  /**
   * Verifica y actualiza el token CSRF desde la respuesta
   * @param {Response} response - Respuesta de fetch
   */
  updateCsrfToken(response) {
    if (SECURITY_CONFIG.csrf.enabled) {
      const newCsrfToken = response.headers.get('X-CSRF-Token');
      if (newCsrfToken) {
        this.saveCsrfToken(newCsrfToken);
      }
    }
  },
  
  /**
   * Parsea el contenido de la respuesta
   * @param {Response} response - Respuesta de fetch
   * @returns {Promise<Object>} - Texto y datos parseados de la respuesta
   */
  async parseResponseContent(response) {
    // Obtener el texto de la respuesta
    const text = await response.extractResponseText(response);
    
    // Intentar parsear como JSON
    const data = await this.parseTextAsJson(text, response);
    
    return { text, data };
  },
  
  /**
   * Extrae el texto de la respuesta
   * @param {Response} response - Respuesta de fetch
   * @returns {Promise<string>} - Texto de la respuesta
   */
  async extractResponseText(response) {
    return await response.text();
  },
  
  /**
   * Parsea el texto como JSON
   * @param {string} text - Texto a parsear
   * @param {Response} response - Respuesta original
   * @returns {Object} - Datos parseados como JSON
   */
  async parseTextAsJson(text, response) {
    if (!text) {
      return {};
    }
    
    try {
      return JSON.parse(text);
    } catch (error) {
      return this.handleJsonParseError(error, text, response);
    }
  },
  
  /**
   * Maneja errores al parsear JSON
   * @param {Error} error - Error de parsing
   * @param {string} text - Texto original
   * @param {Response} response - Respuesta original
   * @returns {Object} - Objeto alternativo cuando falla el parsing
   */
  handleJsonParseError(error, text, response) {
    console.warn('API: Error al parsear JSON', { error: error.message, text });
    
    // Si no es JSON y la respuesta es exitosa, devolver un objeto simple
    if (response.ok) {
      return { success: true, message: text };
    }
    
    throw new Error(`Respuesta no válida: ${text.substring(0, 100)}`);
  },
  
  /**
   * Crea un objeto de error para respuestas fallidas
   * @param {Response} response - Respuesta de fetch
   * @param {Object} data - Datos parseados de la respuesta
   * @param {string} text - Texto original de la respuesta
   * @returns {Error} - Error con información de la respuesta
   */
  createResponseError(response, data, text) {
    const errorMsg = (data && data.message) || `Error: ${response.status} ${response.statusText}`;
    console.error('API: Respuesta con error', { 
      status: response.status, 
      mensaje: errorMsg,
      url: response.url
    });
    
    const error = new Error(errorMsg);
    error.status = response.status;
    error.data = data;
    error.originalText = text;
    error.url = response.url;
    return error;
  },
  
  /**
   * Estandariza el formato de respuesta
   * @param {Object} data - Datos de la respuesta
   * @returns {Object} - Datos con formato estandarizado
   */
  standardizeResponse(data) {
    // Asegurar que todas las respuestas tengan un campo success
    if (data && typeof data === 'object' && data.success === undefined) {
      data.success = true;
    }
    
    return data;
  },
  
  /**
   * Maneja errores de peticiones
   * @param {Error} error - Error ocurrido
   * @param {string} context - Contexto donde ocurrió el error
   * @returns {Promise<Object>} - Objeto con error
   */
  handleError(error, context) {
    console.error(`API Error en ${context}:`, error);
    
    // Si es un error de autenticación (401), redirigir al login
    if (error.status === 401) {
      this.redirectToLogin();
    }
    
    // Devolver un objeto estandarizado con el error
    return Promise.reject({
      success: false,
      error: error.message,
      status: error.status,
      data: error.data
    });
  },
  
  /**
   * Obtiene el token de autenticación del almacenamiento
   * @returns {string|null} - Token de autenticación o null
   */
  getAuthToken() {
    try {
      return localStorage.getItem(APP_CONFIG.storage.tokenKey) || 
             sessionStorage.getItem(APP_CONFIG.storage.tokenKey);
    } catch (e) {
      console.warn('API: Error al obtener token:', e.message);
      return null;
    }
  },
  
  /**
   * Obtiene el token CSRF del almacenamiento
   * @returns {string|null} - Token CSRF o null
   */
  getCsrfToken() {
    try {
      return localStorage.getItem('csrf-token') || 
             sessionStorage.getItem('csrf-token');
    } catch (e) {
      console.warn('API: Error al obtener token CSRF:', e.message);
      return null;
    }
  },
  
  /**
   * Guarda el token CSRF en el almacenamiento
   * @param {string} token - Token CSRF
   */
  saveCsrfToken(token) {
    try {
      localStorage.setItem('csrf-token', token);
      sessionStorage.setItem('csrf-token', token);
    } catch (e) {
      console.warn('API: Error al guardar token CSRF:', e.message);
    }
  },
  
  /**
   * Intenta renovar el token de autenticación
   * @returns {Promise<boolean>} - true si se renovó con éxito
   */
  async refreshToken() {
    try {
      // Esta petición no debe usar autenticación con el token expirado
      const response = await this.request('POST', '/auth/refresh-token', null, false, false);
      
      if (response && response.token) {
        // Guardar el nuevo token
        localStorage.setItem(APP_CONFIG.storage.tokenKey, response.token);
        sessionStorage.setItem(APP_CONFIG.storage.tokenKey, response.token);
        return true;
      }
      return false;
    } catch (error) {
      console.error('API: Error al renovar token:', error);
      return false;
    }
  },
  
  /**
   * Redirige al usuario a la página de login
   */
  redirectToLogin() {
    try {
      // Limpiar almacenamiento
      localStorage.removeItem(APP_CONFIG.storage.tokenKey);
      localStorage.removeItem(APP_CONFIG.storage.userKey);
      sessionStorage.removeItem(APP_CONFIG.storage.tokenKey);
      sessionStorage.removeItem(APP_CONFIG.storage.userKey);
      
      // Guardar la URL actual para volver después del login
      const currentPath = window.location.pathname;
      if (currentPath !== '/' && !currentPath.includes('/index.html')) {
        localStorage.setItem('redirect_after_login', currentPath);
      }
      
      // Redirigir a la página de login
      window.location.replace(APP_CONFIG.routes.login || '/index.html');
    } catch (e) {
      console.error('API: Error al redirigir:', e.message);
    }
  },
  
  /**
   * Limpia la caché de peticiones
   */
  clearCache() {
    requestCache.clear();
  }
};

export default apiClient; 