/**
 * internalApi.js - APIs internas para comunicación entre módulos
 * 
 * Este servicio permite la comunicación directa entre módulos sin pasar por el backend,
 * implementando un sistema de endpoints internos y middlewares.
 */

import eventBus from '../utils/eventBus';

// Eventos del API interna
const API_EVENTS = {
  REQUEST: 'internal_api:request',
  RESPONSE: 'internal_api:response',
  ERROR: 'internal_api:error',
  REGISTER: 'internal_api:register',
  UNREGISTER: 'internal_api:unregister'
};

class InternalApiService {
  constructor() {
    this.endpoints = new Map();
    this.middlewares = [];
    this.debug = process.env.NODE_ENV !== 'production';
    
    // Configuración para simulación de latencia en desarrollo
    this.simulateLatency = false;
    this.latencyRange = [50, 200]; // min, max en ms
  }

  /**
   * Registrar un endpoint interno
   * @param {string} path - Ruta del endpoint (ej: 'documentos/listar')
   * @param {Function} handler - Manejador del endpoint
   * @param {Object} options - Opciones adicionales
   */
  registerEndpoint(path, handler, options = {}) {
    if (this.endpoints.has(path)) {
      console.warn(`Endpoint '${path}' ya está registrado. Será sobrescrito.`);
    }
    
    this.endpoints.set(path, {
      handler,
      options: {
        middleware: options.middleware || [],
        auth: options.auth !== false,
        cache: options.cache || false,
        cacheTTL: options.cacheTTL || 60 // segundos
      }
    });
    
    if (this.debug) {
      console.log(`Endpoint interno registrado: ${path}`);
    }
    
    // Notificar registro de endpoint
    eventBus.emit(API_EVENTS.REGISTER, { path, options });
    
    return () => this.unregisterEndpoint(path);
  }

  /**
   * Eliminar registro de un endpoint
   * @param {string} path - Ruta del endpoint
   */
  unregisterEndpoint(path) {
    if (!this.endpoints.has(path)) {
      console.warn(`Endpoint '${path}' no está registrado.`);
      return false;
    }
    
    this.endpoints.delete(path);
    
    if (this.debug) {
      console.log(`Endpoint interno eliminado: ${path}`);
    }
    
    // Notificar eliminación de endpoint
    eventBus.emit(API_EVENTS.UNREGISTER, { path });
    
    return true;
  }

  /**
   * Agregar middleware global
   * @param {Function} middleware - Función de middleware
   * @returns {Function} - Función para eliminar el middleware
   */
  addMiddleware(middleware) {
    this.middlewares.push(middleware);
    
    // Retornar función para eliminar middleware
    return () => {
      this.middlewares = this.middlewares.filter(m => m !== middleware);
    };
  }

  /**
   * Llamar a un endpoint interno
   * @param {string} path - Ruta del endpoint
   * @param {Object} data - Datos a enviar
   * @param {Object} options - Opciones adicionales
   * @returns {Promise<any>} - Respuesta del endpoint
   */
  async call(path, data = {}, options = {}) {
    if (!this.endpoints.has(path)) {
      const error = new Error(`Endpoint interno '${path}' no está registrado.`);
      
      // Notificar error
      eventBus.emit(API_EVENTS.ERROR, { 
        path, 
        error: error.message, 
        data 
      });
      
      throw error;
    }
    
    const endpoint = this.endpoints.get(path);
    const request = {
      path,
      data,
      options: {
        ...options,
        timestamp: Date.now(),
        requestId: this.generateRequestId()
      },
      meta: {
        cached: false
      }
    };
    
    // Notificar solicitud
    eventBus.emit(API_EVENTS.REQUEST, { 
      requestId: request.options.requestId,
      path,
      data 
    });
    
    try {
      // Verificar caché si está habilitada
      if (endpoint.options.cache && options.useCache !== false) {
        const cacheKey = this.generateCacheKey(path, data);
        const cachedResponse = this.getCachedResponse(cacheKey);
        
        if (cachedResponse) {
          request.meta.cached = true;
          
          // Notificar respuesta (desde caché)
          eventBus.emit(API_EVENTS.RESPONSE, { 
            requestId: request.options.requestId,
            path,
            data: cachedResponse,
            meta: { cached: true }
          });
          
          return cachedResponse;
        }
      }
      
      // Ejecutar middlewares globales
      let currentRequest = { ...request };
      
      for (const middleware of this.middlewares) {
        currentRequest = await middleware(currentRequest);
      }
      
      // Ejecutar middlewares específicos del endpoint
      for (const middleware of endpoint.options.middleware) {
        currentRequest = await middleware(currentRequest);
      }
      
      // Simular latencia en desarrollo si está habilitado
      if (this.simulateLatency) {
        const [min, max] = this.latencyRange;
        const delay = Math.floor(Math.random() * (max - min + 1)) + min;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
      
      // Ejecutar handler del endpoint
      const response = await endpoint.handler(currentRequest.data, currentRequest);
      
      // Almacenar en caché si está habilitado
      if (endpoint.options.cache) {
        const cacheKey = this.generateCacheKey(path, data);
        this.cacheResponse(cacheKey, response, endpoint.options.cacheTTL);
      }
      
      // Notificar respuesta
      eventBus.emit(API_EVENTS.RESPONSE, { 
        requestId: request.options.requestId,
        path,
        data: response
      });
      
      return response;
    } catch (error) {
      // Notificar error
      eventBus.emit(API_EVENTS.ERROR, { 
        requestId: request.options.requestId,
        path,
        error: error.message || 'Error desconocido',
        data 
      });
      
      throw error;
    }
  }

  /**
   * Generar clave única para caché
   * @param {string} path - Ruta del endpoint
   * @param {Object} data - Datos de la solicitud
   * @returns {string} - Clave de caché
   */
  generateCacheKey(path, data) {
    return `${path}:${JSON.stringify(data)}`;
  }

  /**
   * Generar ID único para solicitud
   * @returns {string} - ID de solicitud
   */
  generateRequestId() {
    return `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Almacenar respuesta en caché
   * @param {string} key - Clave de caché
   * @param {any} response - Respuesta a almacenar
   * @param {number} ttl - Tiempo de vida en segundos
   */
  cacheResponse(key, response, ttl) {
    try {
      const item = {
        data: response,
        expires: Date.now() + (ttl * 1000)
      };
      
      localStorage.setItem(`internal_api_cache:${key}`, JSON.stringify(item));
    } catch (error) {
      console.error('Error al almacenar en caché:', error);
    }
  }

  /**
   * Obtener respuesta de caché
   * @param {string} key - Clave de caché
   * @returns {any|null} - Respuesta almacenada o null si no existe o expiró
   */
  getCachedResponse(key) {
    try {
      const cached = localStorage.getItem(`internal_api_cache:${key}`);
      
      if (!cached) return null;
      
      const item = JSON.parse(cached);
      
      // Verificar si expiró
      if (Date.now() > item.expires) {
        localStorage.removeItem(`internal_api_cache:${key}`);
        return null;
      }
      
      return item.data;
    } catch (error) {
      console.error('Error al obtener de caché:', error);
      return null;
    }
  }

  /**
   * Limpiar caché para un endpoint específico o toda la caché
   * @param {string} path - Ruta del endpoint (opcional)
   */
  clearCache(path = null) {
    try {
      if (path) {
        // Eliminar caché de un endpoint específico
        const prefix = `internal_api_cache:${path}:`;
        
        // Obtener todas las claves de localStorage
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          
          if (key.startsWith(prefix)) {
            localStorage.removeItem(key);
          }
        }
      } else {
        // Eliminar toda la caché
        const prefix = 'internal_api_cache:';
        
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          
          if (key.startsWith(prefix)) {
            localStorage.removeItem(key);
          }
        }
      }
    } catch (error) {
      console.error('Error al limpiar caché:', error);
    }
  }

  /**
   * Configurar servicio de API interna
   * @param {Object} config - Configuración
   */
  configure(config = {}) {
    if (config.debug !== undefined) {
      this.debug = !!config.debug;
    }
    
    if (config.simulateLatency !== undefined) {
      this.simulateLatency = !!config.simulateLatency;
    }
    
    if (config.latencyRange) {
      this.latencyRange = config.latencyRange;
    }
  }

  /**
   * Obtener lista de endpoints registrados
   * @returns {Array<string>} - Lista de endpoints
   */
  getRegisteredEndpoints() {
    return Array.from(this.endpoints.keys());
  }
}

// Crear instancia única
const internalApi = new InternalApiService();

// Congelar constructor para prevenir instancias adicionales
Object.freeze(InternalApiService);

export default internalApi;
export { API_EVENTS }; 