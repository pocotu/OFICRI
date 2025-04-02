/**
 * OFICRI API Client
 * Cliente para comunicación con la API del sistema
 */

// Importar dependencias
import { appConfig } from '../config/appConfig.js';
import { authService } from '../services/authService.js';
import { authStateManager } from '../utils/authStateManager.js';
import { errorHandler } from '../utils/errorHandlerUtil.js';

// Crear namespace global para compatibilidad
window.OFICRI = window.OFICRI || {};

/**
 * Cliente API del sistema OFICRI
 * Maneja todas las peticiones al backend
 */
const apiClient = (function() {
  'use strict';
  
  // Constantes privadas
  const API_BASE_URL = appConfig.apiUrl;
  const DEFAULT_TIMEOUT = appConfig.apiTimeout || 30000; // 30 segundos
  const MAX_RETRIES = 1;
  
  // Variables privadas
  let _accessToken = null;
  let _pendingRefreshPromise = null;
  let _isRefreshing = false;
  let _pendingRequests = [];
  let _requestId = 0;
  
  /**
   * Realiza una petición GET a la API
   * @param {string} endpoint - Endpoint de la API sin barra inicial
   * @param {Object} [data] - Query params para la URL
   * @param {Object} [options] - Opciones adicionales para la petición
   * @param {Object} [headers] - Headers adicionales
   * @param {boolean} [skipAuth] - Si es true, no incluye el token de autenticación
   * @returns {Promise} Promesa que resuelve con los datos de la respuesta
   */
  const get = function(endpoint, data, options, headers, skipAuth) {
    // Construir URL con query params
    const url = _buildUrl(endpoint, data);
    
    // Opciones por defecto para GET
    const fetchOptions = {
      method: 'GET',
      ..._buildRequestOptions(options, headers, skipAuth)
    };
      
    // Realizar petición
    return _request(url, fetchOptions);
  };
  
  /**
   * Realiza una petición POST a la API
   * @param {string} endpoint - Endpoint de la API sin barra inicial
   * @param {Object} data - Datos a enviar en el body
   * @param {Object} [options] - Opciones adicionales para la petición
   * @param {Object} [headers] - Headers adicionales
   * @param {boolean} [skipAuth] - Si es true, no incluye el token de autenticación
   * @returns {Promise} Promesa que resuelve con los datos de la respuesta
   */
  const post = function(endpoint, data, options, headers, skipAuth) {
    // Opciones por defecto para POST
    const fetchOptions = {
      method: 'POST',
      body: JSON.stringify(data),
      ..._buildRequestOptions(options, headers, skipAuth)
    };
    
    // Realizar petición
    return _request(API_BASE_URL + endpoint, fetchOptions);
  };
  
  /**
   * Realiza una petición PUT a la API
   * @param {string} endpoint - Endpoint de la API sin barra inicial
   * @param {Object} data - Datos a enviar en el body
   * @param {Object} [options] - Opciones adicionales para la petición
   * @param {Object} [headers] - Headers adicionales
   * @param {boolean} [skipAuth] - Si es true, no incluye el token de autenticación
   * @returns {Promise} Promesa que resuelve con los datos de la respuesta
   */
  const put = function(endpoint, data, options, headers, skipAuth) {
    // Opciones por defecto para PUT
    const fetchOptions = {
      method: 'PUT',
      body: JSON.stringify(data),
      ..._buildRequestOptions(options, headers, skipAuth)
    };
    
    // Realizar petición
    return _request(API_BASE_URL + endpoint, fetchOptions);
  };
  
  /**
   * Realiza una petición DELETE a la API
   * @param {string} endpoint - Endpoint de la API sin barra inicial
   * @param {Object} [data] - Datos a enviar en el body (opcional)
   * @param {Object} [options] - Opciones adicionales para la petición
   * @param {Object} [headers] - Headers adicionales
   * @param {boolean} [skipAuth] - Si es true, no incluye el token de autenticación
   * @returns {Promise} Promesa que resuelve con los datos de la respuesta
   */
  const del = function(endpoint, data, options, headers, skipAuth) {
    // Opciones por defecto para DELETE
    const fetchOptions = {
      method: 'DELETE',
      ..._buildRequestOptions(options, headers, skipAuth)
    };
    
    // Si hay datos, agregarlos al body
    if (data) {
      fetchOptions.body = JSON.stringify(data);
    }
    
    // Realizar petición
    return _request(API_BASE_URL + endpoint, fetchOptions);
  };
  
  /**
   * Sube un archivo a la API
   * @param {string} endpoint - Endpoint de la API sin barra inicial
   * @param {FormData} formData - Datos del formulario con el archivo
   * @param {Object} [options] - Opciones adicionales para la petición
   * @param {Object} [headers] - Headers adicionales
   * @param {boolean} [skipAuth] - Si es true, no incluye el token de autenticación
   * @param {Function} [onProgress] - Callback para el progreso de la carga
   * @returns {Promise} Promesa que resuelve con los datos de la respuesta
   */
  const upload = function(endpoint, formData, options = {}, headers = {}, skipAuth = false, onProgress) {
    // Validar formData
    if (!(formData instanceof FormData)) {
      return Promise.reject(new Error('Se requiere un objeto FormData para la subida de archivos'));
    }
    
    // Si hay función de progreso y el navegador lo soporta, usarla
    if (onProgress && typeof onProgress === 'function' && window.XMLHttpRequest) {
      return _uploadWithProgress(endpoint, formData, options, headers, skipAuth, onProgress);
    }
    
    // Si no hay progreso o no se soporta, usar fetch normal
    const fetchOptions = {
      method: 'POST',
      body: formData,
      // No incluir Content-Type para que el navegador lo configure automáticamente con el boundary
      ..._buildRequestOptions(options, headers, skipAuth, true)
    };
    
    // Realizar petición
    return _request(API_BASE_URL + endpoint, fetchOptions);
  };
  
  /**
   * Construye una URL con query params
   * @param {string} endpoint - Endpoint base
   * @param {Object} [params] - Query params
   * @returns {string} URL completa
   * @private
   */
  const _buildUrl = function(endpoint, params) {
    let url = API_BASE_URL + endpoint;
    
    // Si hay params, agregarlos a la URL
    if (params && Object.keys(params).length > 0) {
      const queryString = Object.keys(params)
        .filter(key => params[key] !== undefined && params[key] !== null)
        .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
        .join('&');
      
      if (queryString) {
        url += (url.includes('?') ? '&' : '?') + queryString;
      }
    }
    
    return url;
  };
  
  /**
   * Construye las opciones para la petición fetch
   * @param {Object} [options] - Opciones adicionales
   * @param {Object} [headers] - Headers adicionales
   * @param {boolean} [skipAuth] - Si es true, no incluye el token de autenticación
   * @param {boolean} [skipContentType] - Si es true, no incluye el Content-Type: application/json
   * @returns {Object} Opciones para fetch
   * @private
   */
  const _buildRequestOptions = function(options = {}, headers = {}, skipAuth = false, skipContentType = false) {
    // Headers por defecto
    const defaultHeaders = skipContentType ? {} : {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
    
    // Si hay token y no se indica skipAuth, incluirlo
    if (!skipAuth) {
    const token = authService.getToken();
    if (token) {
        defaultHeaders['Authorization'] = `Bearer ${token}`;
      }
    }
    
    // Opciones para fetch
    return {
      headers: { ...defaultHeaders, ...headers },
      credentials: 'include', // Incluir cookies en las peticiones
      mode: 'cors',
      cache: 'no-cache',
      redirect: 'follow',
      referrerPolicy: 'no-referrer-when-downgrade',
      ...options,
      // Timeout mediante AbortController
      signal: options.signal || (options.timeout ? _createTimeoutSignal(options.timeout) : _createTimeoutSignal(DEFAULT_TIMEOUT))
    };
  };
  
  /**
   * Crea una señal con timeout para abortar la petición si tarda demasiado
   * @param {number} [timeout] - Timeout en ms
   * @returns {AbortSignal} Señal para abortar la petición
   * @private
   */
  const _createTimeoutSignal = function(timeout = DEFAULT_TIMEOUT) {
    const controller = new AbortController();
    setTimeout(() => controller.abort(), timeout);
    return controller.signal;
  };
      
  /**
   * Realiza una petición a la API
   * @param {string} url - URL completa
   * @param {Object} options - Opciones para fetch
   * @param {number} [retryCount=0] - Contador de reintentos
   * @param {number} [requestId] - ID único para esta petición
   * @returns {Promise} Promesa que resuelve con los datos de la respuesta
   * @private
   */
  const _request = async function(url, options, retryCount = 0, requestId = _requestId++) {
    try {
      // Intentar hacer la petición
      const response = await fetch(url, options);
          
      // Si la respuesta es 204 No Content, devolver null
      if (response.status === 204) {
        return null;
      }
      
      // Si la respuesta es JSON, parsearlo
      const contentType = response.headers.get('content-type');
      let data;
      
        if (contentType && contentType.includes('application/json')) {
        data = await response.json();
        } else {
        // Si no es JSON, devolver el texto
        data = await response.text();
        }
      
      // Si es error 401 Unauthorized pero no es /auth/login (para evitar recursión)
      if (response.status === 401 && !url.includes('/auth/login') && !url.includes('/auth/refresh')) {
        // Si tenemos refresh token, intentar refrescar
        if (authService.getRefreshToken() && retryCount < MAX_RETRIES) {
          const refreshedToken = await _refreshTokenAndRetry();
          
          if (refreshedToken) {
            // Actualizar el token en las opciones
            if (options.headers) {
              options.headers['Authorization'] = `Bearer ${refreshedToken}`;
            }
      
            // Reintentar la petición con el nuevo token
            return _request(url, options, retryCount + 1, requestId);
          }
        }
        
        // Si no podemos refrescar o falló, redirigir al login
        console.error('Error de autenticación. Redirigiendo al login...');
        
        // Verificar si ya estamos en proceso de logout usando authStateManager
        if (authStateManager.getState() === authStateManager.STATES.LOGGING_OUT || 
            authStateManager.getState() === authStateManager.STATES.REDIRECTING) {
          console.warn('[API] Ya hay un proceso de autenticación en curso, omitiendo redirección adicional.');
          throw new Error('Sesión expirada. Redirección en proceso...');
        }
        
        // Solo hacer logout si es seguro hacerlo
        if (authStateManager.canRedirect('login')) {
          // Marcar como redirigiendo
          authStateManager.setState(authStateManager.STATES.REDIRECTING);
          
          // Solo redirigir si estamos logueados
          setTimeout(() => {
            if (window.OFICRI.isLoggedIn !== false && !window.location.pathname.includes('/login')) {
              window.OFICRI.isLoggedIn = false;
              authService.logout({ redirect: true });
            } else {
              // Limpiar estado si ya no es necesario
              authStateManager.setState(null);
            }
          }, 800); // Timeout más largo para evitar sobrecargas
        }
          
        // Rechazar la promesa para que el llamador pueda manejar el error
        throw new Error('Sesión expirada o inválida. Por favor inicie sesión nuevamente.');
      }
        
      // Si no es 2xx, lanzar error
      if (!response.ok) {
        const error = new Error(data.message || `Error ${response.status}: ${response.statusText}`);
        error.status = response.status;
        error.data = data;
        throw error;
      }
      
      // Devolver datos
      return data;
    } catch (error) {
      // Si es error de timeout o abort, personalizarlo
      if (error.name === 'AbortError') {
        return Promise.reject(errorHandler.handleNetworkError(error));
      }
      
      // Si es error de red y tenemos reintentos disponibles, reintentar
      if (error.message.includes('Failed to fetch') && retryCount < MAX_RETRIES) {
        console.warn(`Error de red. Reintentando (${retryCount + 1}/${MAX_RETRIES})...`);
        return new Promise(resolve => {
          // Esperar antes de reintentar (backoff exponencial)
          setTimeout(() => {
            resolve(_request(url, options, retryCount + 1, requestId));
          }, 1000 * Math.pow(2, retryCount));
        });
      }
      
      // Propagar el error usando el manejador central
      return Promise.reject(errorHandler.handleApiError(error));
    }
  };
  
  /**
   * Refresca el token y reintenta las peticiones pendientes
   * @returns {Promise<string>} Promesa que resuelve con el nuevo token
   * @private
   */
  const _refreshTokenAndRetry = async function() {
    // Verificar estado con authStateManager
    if (authStateManager.getState() === authStateManager.STATES.REFRESHING || 
        authStateManager.getState() === authStateManager.STATES.LOGGING_OUT || 
        authStateManager.getState() === authStateManager.STATES.REDIRECTING) {
      console.warn(`[API] Ya hay una operación de autenticación en curso: ${authStateManager.getState()}`);
      return _pendingRefreshPromise;
    }
    
    // Si ya estamos refrescando, devolver la misma promesa
    if (_isRefreshing) {
      return _pendingRefreshPromise;
    }
    
    // Marcar como refrescando e iniciar promesa
    _isRefreshing = true;
    authStateManager.setState(authStateManager.STATES.REFRESHING);
    
    _pendingRefreshPromise = new Promise(async (resolve) => {
      try {
        // Intentar refrescar token
      const success = await authService.refreshToken();
      
        // Pequeño timeout para permitir que los cambios en el almacenamiento se completen
        await new Promise(r => setTimeout(r, 100));
        
        if (success) {
          // Si se refrescó correctamente, resolver con el nuevo token
          resolve(authService.getToken());
        } else {
          // Si falló, resolver con null
          resolve(null);
        }
    } catch (error) {
        console.error('Error al refrescar token:', error.message);
        resolve(null);
    } finally {
        // Restaurar estado
      _isRefreshing = false;
        
        // Limpiar estado solo si seguimos en refreshing
        if (authStateManager.getState() === authStateManager.STATES.REFRESHING) {
          authStateManager.setState(null);
        }
    }
    });
    
    return _pendingRefreshPromise;
  };
  
  /**
   * Realiza una subida de archivo con seguimiento de progreso
   * @param {string} endpoint - Endpoint de la API
   * @param {FormData} formData - Datos del formulario
   * @param {Object} options - Opciones adicionales
   * @param {Object} headers - Headers adicionales
   * @param {boolean} skipAuth - Si es true, no incluye el token de autenticación
   * @param {Function} onProgress - Callback para el progreso de la carga
   * @returns {Promise} Promesa que resuelve con los datos de la respuesta
   * @private
   */
  const _uploadWithProgress = function(endpoint, formData, options, headers, skipAuth, onProgress) {
    return new Promise((resolve, reject) => {
      // Crear petición XHR para seguimiento de progreso
      const xhr = new XMLHttpRequest();
      
      // Configurar eventos
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const percentComplete = Math.round((event.loaded / event.total) * 100);
          onProgress(percentComplete, event);
        }
      });
      
      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          // Parsear respuesta
          let response;
          try {
            response = xhr.responseText ? JSON.parse(xhr.responseText) : null;
          } catch (e) {
            response = xhr.responseText;
          }
          resolve(response);
        } else if (xhr.status === 401 && authService.getRefreshToken()) {
          // Si es error 401, intentar refrescar token
          _refreshTokenAndRetry().then(token => {
            if (token) {
              // Reintentar con nuevo token
              const newHeaders = { ...headers };
              newHeaders['Authorization'] = `Bearer ${token}`;
              _uploadWithProgress(endpoint, formData, options, newHeaders, skipAuth, onProgress)
                .then(resolve)
                .catch(reject);
            } else {
              // Si no se pudo refrescar, rechazar
              authService.logout({ redirect: true });
              reject(new Error('Sesión expirada. Por favor inicie sesión nuevamente.'));
            }
          });
        } else {
          // Otros errores
          let errorMsg = 'Error al subir archivo';
          let data = null;
          
          try {
            data = JSON.parse(xhr.responseText);
            errorMsg = data.message || `Error ${xhr.status}: ${xhr.statusText}`;
          } catch (e) {
            errorMsg = `Error ${xhr.status}: ${xhr.statusText}`;
          }
          
          const error = new Error(errorMsg);
          error.status = xhr.status;
          error.data = data;
          reject(error);
        }
      });
      
      xhr.addEventListener('error', () => {
        reject(new Error('Error de red al subir archivo'));
      });
      
      xhr.addEventListener('abort', () => {
        reject(new Error('Subida de archivo cancelada'));
      });
      
      xhr.addEventListener('timeout', () => {
        reject(new Error('Tiempo de espera agotado al subir archivo'));
      });
      
      // Abrir conexión
      xhr.open('POST', API_BASE_URL + endpoint);
      
      // Configurar timeout
      xhr.timeout = options.timeout || DEFAULT_TIMEOUT;
      
      // Configurar headers
      if (!skipAuth) {
        const token = authService.getToken();
        if (token) {
          xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        }
      }
      
      // Headers adicionales
      if (headers) {
        Object.keys(headers).forEach(key => {
          xhr.setRequestHeader(key, headers[key]);
        });
      }
      
      // Incluir credentials
      xhr.withCredentials = options.credentials === 'include';
      
      // Enviar datos
      xhr.send(formData);
    });
  };
  
  // API pública
  return {
    get,
    post,
    put,
    delete: del, // 'delete' es palabra reservada en JS
    upload
  };
})();

// Exportar como módulo ES
export { apiClient };

// Para compatibilidad con código que usa la variable global
window.OFICRI.apiClient = apiClient; 