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
   * Realiza una petición HTTP genérica
   * @param {string} method - Método HTTP (GET, POST, PUT, DELETE)
   * @param {string} endpoint - Endpoint de la API
   * @param {Object} data - Datos para enviar (para POST, PUT)
   * @param {boolean} auth - Si requiere autenticación
   * @param {boolean} cache - Si debe usar caché (solo para GET)
   * @returns {Promise<Object>} - Datos de la respuesta
   */
  async request(method, endpoint, data = null, auth = true, cache = false) {
    // Validar el endpoint (prevenir path traversal)
    if (endpoint.includes('..') || !endpoint.startsWith('/')) {
      throw new Error('Endpoint inválido: ' + endpoint);
    }
    
    // Construir URL completa
    const url = `${APP_CONFIG.apiBaseUrl}${endpoint}`;
    
    // Crear opciones de la petición
    const options = {
      method: method.toUpperCase(),
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      credentials: 'same-origin'
    };
    
    // Agregar token de autenticación si es necesario
    if (auth) {
      const token = this.getAuthToken();
      if (token) {
        options.headers['Authorization'] = `Bearer ${token}`;
      } else {
        // Manejar caso sin token cuando es requerido
        console.warn('API: Petición autenticada sin token disponible');
      }
    }
    
    // Agregar CSRF token para peticiones de modificación si está habilitado
    if (SECURITY_CONFIG.csrf.enabled && 
        (method === 'POST' || method === 'PUT' || method === 'DELETE')) {
      const csrfToken = this.getCsrfToken();
      if (csrfToken) {
        options.headers['X-CSRF-Token'] = csrfToken;
      }
    }
    
    // Agregar datos para métodos POST/PUT
    if (data && (method === 'POST' || method === 'PUT')) {
      options.body = JSON.stringify(data);
    }
    
    // Para peticiones GET, verificar caché si está habilitado
    const cacheKey = `${method}:${url}:${JSON.stringify(options)}`;
    if (method === 'GET' && cache && requestCache.has(cacheKey)) {
      return requestCache.get(cacheKey);
    }
    
    try {
      // Agregar timeout para prevenir peticiones bloqueadas
      const controller = new AbortController();
      options.signal = controller.signal;
      
      // Establecer timeout según configuración
      const timeoutId = setTimeout(() => {
        controller.abort();
      }, APP_CONFIG.apiTimeout || 30000);
      
      // Realizar la petición
      console.log(`API: ${method} ${url}`, data ? { data } : '');
      const response = await fetch(url, options);
      
      // Limpiar el timeout
      clearTimeout(timeoutId);
      
      // Procesar la respuesta
      const responseData = await this.handleResponse(response);
      
      // Si es GET y se solicita caché, guardar en caché
      if (method === 'GET' && cache) {
        requestCache.set(cacheKey, responseData);
      }
      
      return responseData;
    } catch (error) {
      // Manejar errores específicos
      if (error.name === 'AbortError') {
        throw new Error(`La petición a ${endpoint} excedió el tiempo límite`);
      }
      
      // Si es un error de autenticación (401), intentar renovar token
      if (error.status === 401 && auth) {
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
      }
      
      // Pasar el error al manejador
      return this.handleError(error, `${method} ${endpoint}`);
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
    // Verificar CSRF token en la respuesta si está configurado
    if (SECURITY_CONFIG.csrf.enabled) {
      const newCsrfToken = response.headers.get('X-CSRF-Token');
      if (newCsrfToken) {
        this.saveCsrfToken(newCsrfToken);
      }
    }
    
    // Obtener el texto de la respuesta
    const text = await response.text();
    
    // Intentar parsear como JSON
    let data;
    try {
      data = text ? JSON.parse(text) : {};
    } catch (e) {
      console.warn('API: Error al parsear JSON', { error: e.message, text });
      
      // Si no es JSON y la respuesta es exitosa, devolver un objeto simple
      if (response.ok) {
        return { success: true, message: text };
      }
      throw new Error(`Respuesta no válida: ${text.substring(0, 100)}`);
    }
    
    // Si la respuesta no es exitosa, lanzar error
    if (!response.ok) {
      const errorMsg = data.message || `Error: ${response.status} ${response.statusText}`;
      console.error('API: Respuesta con error', { status: response.status, mensaje: errorMsg });
      
      const error = new Error(errorMsg);
      error.status = response.status;
      error.data = data;
      throw error;
    }
    
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