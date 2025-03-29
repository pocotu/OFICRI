/**
 * OFICRI API Client
 * Handles API requests with authentication, retries, and error handling
 */

// Importar módulos necesarios
import { config } from '../config/app.config.js';
import { authService } from '../services/authService.js';

// Create namespace if it doesn't exist
window.OFICRI = window.OFICRI || {};

// API Client Module
const apiClient = (function() {
  'use strict';
  
  // Private variables
  let _requestQueue = [];
  let _isRefreshing = false;
  let _requestLog = [];
  let _maxLogSize = 50;
  
  /**
   * Procesa un error de API para darle formato consistente
   * @param {Object} response - Respuesta de fetch 
   * @param {Object} data - Datos de la respuesta
   * @param {Error} [originalError] - Error original en caso de error de red
   * @returns {Error} Error con información adicional
   * @private
   */
  const _processApiError = async function(response, data, originalError = null) {
    let error;
    
    if (originalError) {
      // Error de red
      error = new Error(originalError.message || 'Error de red');
      error.name = 'NetworkError';
      error.status = 0;
      error.originalError = originalError;
    } else if (response) {
      // Error del servidor
      let message = 'Error del servidor';
      
      // Intentar extraer mensaje de error de la respuesta
      if (data) {
        if (typeof data === 'string') {
          message = data;
        } else if (data.message) {
          message = data.message;
        } else if (data.error) {
          message = typeof data.error === 'string' ? data.error : data.error.message || 'Error desconocido';
        }
      }
      
      error = new Error(message);
      error.name = 'ApiError';
      error.status = response.status;
      error.statusText = response.statusText;
      error.data = data;
    } else {
      // Error genérico
      error = new Error('Error desconocido');
      error.name = 'UnknownError';
    }
    
    // Añadir información adicional para depuración
    error.timestamp = new Date().toISOString();
    
    return error;
  };
  
  /**
   * Registra una petición en el historial
   */
  const _logRequest = function(request, response, error) {
    // Mantener solo las últimas X peticiones
    if (_requestLog.length >= _maxLogSize) {
      _requestLog.shift();
    }
    
    const logEntry = {
      timestamp: new Date(),
      method: request.method,
      url: request.url,
      status: response ? response.status : error ? 'ERROR' : 'PENDING',
      duration: request.endTime ? (request.endTime - request.startTime) : null,
      requestHeaders: { ...request.headers },
      responseHeaders: response ? [...response.headers.entries()].reduce((obj, [key, val]) => {
        obj[key] = val;
        return obj;
      }, {}) : null,
      error: error ? {
        name: error.name,
        message: error.message,
        status: error.status
      } : null
    };
    
    // No incluir datos sensibles en el log
    if (logEntry.requestHeaders.Authorization) {
      logEntry.requestHeaders.Authorization = 'Bearer [REDACTED]';
    }
    
    _requestLog.push(logEntry);
    
    // Imprimir en consola si está en modo debug
    if (config.features.debugging) {
      console.log(`[API-LOG] ${logEntry.method} ${logEntry.url} - ${logEntry.status}`, 
        logEntry.duration ? `(${logEntry.duration}ms)` : '');
    }
    
    return logEntry;
  };
  
  /**
   * Performs an HTTP request to the API
   * @param {Object} options - Request options
   * @returns {Promise} - Promise resolving to the response data
   */
  const _request = async function(options) {
    const { method = 'GET', endpoint, data = null, headers = {}, params = {}, retries = config.api.retries } = options;
    
    console.log('[DEBUG-API] Starting API request:', { method, endpoint, params, skipAuth: options.skipAuth });
    
    // Build URL with query parameters
    let url = `${config.api.baseUrl}${endpoint}`;
    if (params && Object.keys(params).length > 0) {
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value);
        }
      });
      url += `?${queryParams.toString()}`;
    }
    
    console.log('[DEBUG-API] Request URL:', url);
    
    // Build request headers
    const requestHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...headers
    };
    
    // Add authentication token if available
    const token = authService.getToken();
    if (token) {
      requestHeaders['Authorization'] = `Bearer ${token}`;
      console.log('[DEBUG-API] Added auth token to request (token length):', token.length);
    } else {
      console.log('[DEBUG-API] No auth token available for request');
    }
    
    console.log('[DEBUG-API] Request headers:', requestHeaders);
    
    // Request options
    const requestOptions = {
      method,
      headers: requestHeaders,
      credentials: 'include',
      timeout: config.api.timeout
    };
    
    // Add request body for non-GET requests
    if (method !== 'GET' && data) {
      // Si estamos enviando un login y hay un codigoCIP pero no username, adaptarlo
      if (endpoint.includes('/auth/login') && data.codigoCIP && !data.username) {
        data = {
          ...data,
          username: data.codigoCIP
        };
        console.log('[DEBUG-API] Adaptando formato para login - añadiendo username a partir de codigoCIP');
      }
      
      requestOptions.body = JSON.stringify(data);
      console.log('[DEBUG-API] Request body:', method !== 'POST' || !endpoint.includes('login') ? JSON.stringify(data) : 'Password hidden for security');
    }
    
    // Crear objeto de petición para el log
    const requestLog = {
      method,
      url,
      headers: { ...requestHeaders },
      startTime: Date.now(),
      params,
      data: method !== 'GET' ? data : null
    };
    
    try {
      console.log('[DEBUG-API] Sending fetch request...');
      
      // Perform fetch request
      const response = await fetch(url, requestOptions);
      
      // Actualizar tiempo de finalización
      requestLog.endTime = Date.now();
      
      console.log('[DEBUG-API] Response received - Status:', response.status, response.statusText);
      console.log('[DEBUG-API] Response headers:', [...response.headers.entries()]);
      
      // Clone response for potential retries
      const clonedResponse = response.clone();
      
      // Handle 401 Unauthorized (token expired)
      if (response.status === 401 && !options.skipAuth) {
        console.log('[DEBUG-API] 401 Unauthorized - Attempting token refresh');
        
        // Registrar en el log
        _logRequest(requestLog, response);
        
        // Try token refresh
        const refreshed = await _handleTokenRefresh();
        if (refreshed) {
          console.log('[DEBUG-API] Token refresh successful - Retrying request');
          
          // Retry request with new token
          return _request({ ...options, skipAuth: true });
        } else {
          console.log('[DEBUG-API] Token refresh failed - Logging out user');
          
          // Refresh failed, redirect to login
          authService.logout();
          window.location.href = '/';
          throw new Error('Session expired. Please login again.');
        }
      }
      
      // Parse response body
      let responseData;
      const contentType = response.headers.get('content-type');
      
      console.log('[DEBUG-API] Response content type:', contentType);
      
      try {
        if (contentType && contentType.includes('application/json')) {
          console.log('[DEBUG-API] Parsing JSON response');
          responseData = await response.json();
        } else {
          console.log('[DEBUG-API] Parsing text response');
          responseData = await response.text();
        }
      } catch (parseError) {
        console.error('[DEBUG-API] Error parsing response:', parseError);
        const error = await _processApiError(response, null, parseError);
        _logRequest(requestLog, response, error);
        throw error;
      }
      
      // Registrar en el log
      _logRequest(requestLog, response);
      
      // Handle unsuccessful responses
      if (!response.ok) {
        console.log('[DEBUG-API] Response not OK:', response.status, responseData);
        
        // Retry on server errors if retries remaining
        if (response.status >= 500 && retries > 0) {
          console.log('[DEBUG-API] Server error - Retrying request');
          
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, 1000));
          return _request({ ...options, retries: retries - 1 });
        }
        
        // Format and throw error
        const error = await _processApiError(response, responseData);
        _logRequest(requestLog, response, error);
        throw error;
      }
      
      // Return parsed response data
      return responseData;
    } catch (error) {
      // Actualizar tiempo de finalización
      requestLog.endTime = Date.now();
      
      console.error('[DEBUG-API] Fetch error:', error);
      
      // Check if it's a network error
      if (!error.status) {
        console.log('[DEBUG-API] Network error detected');
        
        // Retry network errors if retries remaining
        if (retries > 0) {
          console.log('[DEBUG-API] Retrying request after network error');
          
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, 1000));
          return _request({ ...options, retries: retries - 1 });
        }
        
        // Format and throw error
        const apiError = await _processApiError(null, null, error);
        _logRequest(requestLog, null, apiError);
        throw apiError;
      }
      
      // Registrar en el log
      _logRequest(requestLog, null, error);
      
      // Re-throw the error
      throw error;
    }
  };
  
  /**
   * Handles token refresh when a request receives 401
   * @returns {Promise<boolean>} - Success of refresh operation
   */
  const _handleTokenRefresh = async function() {
    // If already refreshing, wait for completion
    if (_isRefreshing) {
      return new Promise(resolve => {
        _requestQueue.push(resolve);
      });
    }
    
    _isRefreshing = true;
    
    try {
      const refreshToken = authService.getRefreshToken();
      
      if (!refreshToken) {
        return false;
      }
      
      // Call auth service to refresh token
      const success = await authService.refreshToken();
      
      // Process pending requests
      _requestQueue.forEach(resolve => resolve(success));
      _requestQueue = [];
      
      return success;
    } catch (error) {
      return false;
    } finally {
      _isRefreshing = false;
    }
  };
  
  /**
   * Public API
   */
  return {
    get: function(endpoint, params = {}, headers = {}) {
      return _request({ method: 'GET', endpoint, params, headers });
    },
    
    post: function(endpoint, data = {}, params = {}, headers = {}) {
      return _request({ method: 'POST', endpoint, data, params, headers });
    },
    
    put: function(endpoint, data = {}, params = {}, headers = {}) {
      return _request({ method: 'PUT', endpoint, data, params, headers });
    },
    
    patch: function(endpoint, data = {}, params = {}, headers = {}) {
      return _request({ method: 'PATCH', endpoint, data, params, headers });
    },
    
    delete: function(endpoint, params = {}, headers = {}) {
      return _request({ method: 'DELETE', endpoint, params, headers });
    },
    
    /**
     * Retorna el historial de peticiones realizadas
     */
    getRequestLog: function() {
      return [..._requestLog];
    },
    
    /**
     * Limpia el historial de peticiones
     */
    clearRequestLog: function() {
      _requestLog = [];
      return true;
    }
  };
})();

// Para compatibilidad con ES modules y UMD
// El build process convertirá esto a formato compatible con navegadores
export { apiClient };

// Para compatibilidad con código que usa window.OFICRI.apiClient
window.OFICRI.apiClient = apiClient; 