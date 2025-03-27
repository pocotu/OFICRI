/**
 * Tests para middleware de caché
 */

jest.mock('../../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  }
}));

// Mock de la caché global
const mockCache = {
  _data: new Map(),
  has: function(key) { 
    return this._data.has(key); 
  },
  get: function(key) { 
    return this._data.get(key); 
  },
  set: function(key, value) { 
    return this._data.set(key, value); 
  },
  delete: function(key) { 
    return this._data.delete(key); 
  },
  clear: function() { 
    return this._data.clear(); 
  },
  keys: function() { 
    return Array.from(this._data.keys()); 
  },
  size: 0
};

// Mock el Map global que usa el archivo middleware/cache.js
global.Map = jest.fn().mockImplementation(() => {
  return mockCache;
});

const { 
  cacheMiddleware, 
  invalidateCache, 
  clearCache, 
  parameterizedCache 
} = require('../../middleware/cache');
const { logger } = require('../../utils/logger');

describe('Cache Middleware', () => {
  let req, res, next, jsonSpy;

  beforeEach(() => {
    // Resetear mocks
    jest.clearAllMocks();
    
    // Limpiar caché entre tests
    mockCache.clear();
    mockCache.size = 0;
    
    // Mock objects
    jsonSpy = jest.fn();
    
    // Mock request object
    req = {
      method: 'GET',
      originalUrl: '/api/test',
      path: '/api/test',
      query: {}
    };
    
    // Mock response object
    res = {
      json: jsonSpy,
      setHeader: jest.fn()
    };
    
    // Mock next function
    next = jest.fn();
    
    // Spy on setTimeout
    jest.spyOn(global, 'setTimeout').mockImplementation((fn) => {
      // No ejecutar el callback, solo simular el timer
      return 123; // simulando un ID de timeout
    });
  });

  afterEach(() => {
    // Restore setTimeout
    global.setTimeout.mockRestore();
  });

  describe('cacheMiddleware', () => {
    test('debe pasar sin caché para métodos que no son GET', () => {
      req.method = 'POST';
      
      cacheMiddleware(req, res, next);
      
      expect(res.setHeader).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalled();
    });

    test('debe devolver respuesta en caché cuando existe', () => {
      // Configurar cache mock con datos previos
      const cacheKey = `cache:${req.originalUrl}`;
      const responseData = { success: true, data: 'test' };
      mockCache.set(cacheKey, responseData);
      
      // Ejecutar middleware - debe obtener del caché
      cacheMiddleware(req, res, next);
      
      expect(res.setHeader).toHaveBeenCalledWith('X-Cache', 'HIT');
      expect(res.json).toHaveBeenCalledWith(responseData);
      expect(next).not.toHaveBeenCalled();
    });

    test('debe configurar caché y continuar cuando no hay cache', () => {
      cacheMiddleware(req, res, next);
      
      expect(res.setHeader).toHaveBeenCalledWith('X-Cache', 'MISS');
      expect(next).toHaveBeenCalled();
      
      // Probar que la función json ha sido modificada
      expect(res.json).not.toBe(jsonSpy);
      
      // Verificar comportamiento de la función modificada
      const responseData = { success: true, data: 'test' };
      res.json(responseData);
      
      // Verificar que los datos se agregaron a la caché
      expect(mockCache.has(`cache:${req.originalUrl}`)).toBe(true);
      expect(mockCache.get(`cache:${req.originalUrl}`)).toEqual(responseData);
      
      // Verificar que setTimeout fue llamado para eliminar el caché después del TTL
      expect(setTimeout).toHaveBeenCalled();
    });
  });

  describe('invalidateCache', () => {
    test('debe eliminar entradas que coinciden con el patrón', () => {
      // Configurar el cache con datos de prueba
      mockCache.set('cache:/api/users', { data: 'users' });
      mockCache.set('cache:/api/users/1', { data: 'user1' });
      mockCache.set('cache:/api/test', { data: 'test' });
      mockCache.size = 3;
      
      // Ejecutar middleware de invalidación para '/api/users'
      const middleware = invalidateCache('/api/users');
      middleware(req, res, next);
      
      // Verificar que se eliminaron las entradas correctas
      expect(mockCache.has('cache:/api/users')).toBe(false);
      expect(mockCache.has('cache:/api/users/1')).toBe(false);
      expect(mockCache.has('cache:/api/test')).toBe(true);
      
      // Verificar que se llamó a logger.info con el mensaje correcto
      expect(logger.info).toHaveBeenCalledWith('Caché invalidado: 2 entradas eliminadas para /api/users');
      expect(next).toHaveBeenCalled();
    });

    test('debe manejar errores al invalidar caché', () => {
      // Simular error
      const originalKeys = mockCache.keys;
      const errorObj = new Error('Cache error');
      mockCache.keys = jest.fn().mockImplementation(() => {
        throw errorObj;
      });
      
      try {
        const middleware = invalidateCache('/api/test');
        middleware(req, res, next);
        
        // En el código real se pasa el objeto error directamente
        expect(logger.error).toHaveBeenCalledWith('Error al invalidar caché:', errorObj);
        expect(next).toHaveBeenCalled();
      } finally {
        // Restaurar función original
        mockCache.keys = originalKeys;
      }
    });

    test('no debe hacer nada si no hay coincidencias', () => {
      // Configurar el cache con datos de prueba que no coinciden
      mockCache.set('cache:/api/products', { data: 'products' });
      
      const middleware = invalidateCache('/api/users');
      middleware(req, res, next);
      
      expect(mockCache.has('cache:/api/products')).toBe(true);
      expect(logger.info).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalled();
    });
  });

  describe('clearCache', () => {
    test('debe limpiar toda la caché', () => {
      // Configurar el cache con datos de prueba
      mockCache.set('cache:/api/users', { data: 'users' });
      mockCache.set('cache:/api/test', { data: 'test' });
      mockCache.size = 2;
      
      // Verificar que hay elementos en caché antes de limpiar
      expect(mockCache.keys().length).toBe(2);
      
      // Ejecutar middleware para limpiar caché
      clearCache(req, res, next);
      
      // Verificar que se limpió
      expect(mockCache.keys().length).toBe(0);
      
      // Verificar el mensaje exacto
      expect(logger.info).toHaveBeenCalledWith('Caché limpiado: 2 entradas eliminadas');
      expect(next).toHaveBeenCalled();
    });

    test('debe manejar errores al limpiar caché', () => {
      // Simular error
      const originalClear = mockCache.clear;
      const errorObj = new Error('Cache clear error');
      mockCache.clear = jest.fn().mockImplementation(() => {
        throw errorObj;
      });
      
      try {
        clearCache(req, res, next);
        
        // En el código real se pasa el objeto error directamente
        expect(logger.error).toHaveBeenCalledWith('Error al limpiar caché:', errorObj);
        expect(next).toHaveBeenCalled();
      } finally {
        // Restaurar función original
        mockCache.clear = originalClear;
      }
    });
  });

  describe('parameterizedCache', () => {
    test('debe usar TTL personalizado', () => {
      const customTTL = 60000; // 1 minuto
      const middleware = parameterizedCache(customTTL);
      middleware(req, res, next);
      
      // Verificar comportamiento de caché
      expect(res.setHeader).toHaveBeenCalledWith('X-Cache', 'MISS');
      expect(next).toHaveBeenCalled();
      
      // Agregar datos al caché
      const responseData = { success: true };
      res.json(responseData);
      
      // Verificar que se usó el TTL personalizado
      expect(setTimeout).toHaveBeenCalledWith(expect.any(Function), customTTL);
    });

    test('debe usar parámetros de consulta para generar clave de caché', () => {
      // Test simplificado que verifica el comportamiento principal sin depender
      // de los detalles de implementación del mock
      
      // Primera solicitud
      req.path = '/api/items';
      req.originalUrl = '/api/items?page=1&limit=10';
      req.query = { page: 1, limit: 10 };
      
      const middleware = parameterizedCache();
      
      // Primera llamada (MISS)
      middleware(req, res, next);
      expect(res.setHeader).toHaveBeenCalledWith('X-Cache', 'MISS');
      
      // Guardar algo en caché manualmente
      const cacheKey = `cache:${req.originalUrl}`;
      const responseData = { data: 'test' };
      mockCache.set(cacheKey, responseData);
      
      // Resetear mocks
      jest.clearAllMocks();
      
      // Segunda llamada (HIT)
      middleware(req, res, next);
      expect(res.setHeader).toHaveBeenCalledWith('X-Cache', 'HIT');
      
      // Cambiar query param para tercera llamada
      req.originalUrl = '/api/items?page=2&limit=10';
      req.query = { page: 2, limit: 10 };
      
      // Resetear mocks
      jest.clearAllMocks();
      
      // Tercera llamada (MISS por nuevo param)
      middleware(req, res, next);
      expect(res.setHeader).toHaveBeenCalledWith('X-Cache', 'MISS');
    });

    test('debe pasar sin caché para métodos que no son GET', () => {
      req.method = 'POST';
      
      const middleware = parameterizedCache();
      middleware(req, res, next);
      
      expect(res.setHeader).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalled();
    });
  });
}); 