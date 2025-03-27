/**
 * Tests para cache-handler.js
 * Prueba las funciones de middleware para caché de respuestas HTTP
 */

// Mocks
jest.mock('ioredis', () => {
  const mockRedis = {
    get: jest.fn(),
    setex: jest.fn().mockResolvedValue('OK'),
    keys: jest.fn(),
    del: jest.fn()
  };
  
  // Guardamos la última estrategia de reintento utilizada
  let lastRetryStrategy = null;
  
  const mockRedisConstructor = jest.fn((options) => {
    if (options && options.retryStrategy) {
      lastRetryStrategy = options.retryStrategy;
    }
    return mockRedis;
  });
  
  // Exponemos la estrategia para las pruebas
  mockRedisConstructor.getLastRetryStrategy = () => lastRetryStrategy;
  
  return mockRedisConstructor;
});

jest.mock('../../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn()
  }
}));

// Importar dependencias
const Redis = require('ioredis');
const { logger } = require('../../utils/logger');
const { 
  cacheResponse, 
  invalidateCache, 
  clearCache, 
  cacheWithParams 
} = require('../../middleware/cache-handler');

describe('Cache Handler Middleware', () => {
  // Cliente Redis mockado
  let mockRedisClient;
  
  // Objetos mockados para las pruebas
  let req;
  let res;
  let next;
  
  beforeEach(() => {
    // Reiniciar todos los mocks
    jest.clearAllMocks();
    
    // Obtener el cliente Redis mockado
    mockRedisClient = new Redis();
    
    // Crear mocks para req, res y next
    req = {
      method: 'GET',
      originalUrl: '/api/test',
      path: '/api/test',
      query: {}
    };
    
    // Mock de res.json
    res = {
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis()
    };
    
    // Mock de next
    next = jest.fn();
  });
  
  describe('Redis Connection', () => {
    test('debería configurar la estrategia de reintento correctamente', () => {
      // Obtener la estrategia de reintento
      const retryStrategy = Redis.getLastRetryStrategy();
      
      // Verificar que existe
      expect(retryStrategy).toBeDefined();
      
      // Probar con diferentes tiempos
      const delay1 = retryStrategy(1);  // 1 * 50 = 50ms
      const delay10 = retryStrategy(10); // 10 * 50 = 500ms
      const delay100 = retryStrategy(100); // Debería usar el máximo (2000ms)
      
      expect(delay1).toBe(50);
      expect(delay10).toBe(500);
      expect(delay100).toBe(2000);
    });
  });
  
  describe('cacheResponse', () => {
    test('debería pasar al siguiente middleware para métodos no GET', async () => {
      // Cambiar método a POST
      req.method = 'POST';
      
      // Ejecutar middleware
      const middleware = cacheResponse();
      await middleware(req, res, next);
      
      // Verificar que se llama a next sin usar Redis
      expect(next).toHaveBeenCalled();
      expect(mockRedisClient.get).not.toHaveBeenCalled();
    });
    
    test('debería devolver respuesta cacheada si existe', async () => {
      // Simular respuesta cacheada
      const cachedData = JSON.stringify({ success: true, data: [1, 2, 3] });
      mockRedisClient.get.mockResolvedValue(cachedData);
      
      // Ejecutar middleware
      const middleware = cacheResponse();
      await middleware(req, res, next);
      
      // Verificar que se obtiene la respuesta cacheada
      expect(mockRedisClient.get).toHaveBeenCalledWith('cache:/api/test');
      expect(res.json).toHaveBeenCalledWith(JSON.parse(cachedData));
      expect(next).not.toHaveBeenCalled();
      expect(logger.info).toHaveBeenCalled();
    });
    
    test('debería interceptar res.json si no hay caché', async () => {
      // Simular que no hay respuesta cacheada
      mockRedisClient.get.mockResolvedValue(null);
      
      // Datos para la respuesta
      const responseData = { success: true, data: [1, 2, 3] };
      
      // Ejecutar middleware
      const middleware = cacheResponse(60);
      await middleware(req, res, next);
      
      // Verificar que se intercepta res.json
      expect(mockRedisClient.get).toHaveBeenCalledWith('cache:/api/test');
      expect(next).toHaveBeenCalled();
      
      // Simular llamada a res.json con datos
      res.json(responseData);
      
      // Verificar que se cachea la respuesta
      expect(mockRedisClient.setex).toHaveBeenCalledWith(
        'cache:/api/test',
        60,
        JSON.stringify(responseData)
      );
    });
    
    test('debería manejar errores de Redis', async () => {
      // Simular error de Redis
      mockRedisClient.get.mockRejectedValue(new Error('Redis error'));
      
      // Ejecutar middleware
      const middleware = cacheResponse();
      await middleware(req, res, next);
      
      // Verificar que se maneja el error y se continúa
      expect(logger.error).toHaveBeenCalled();
      expect(next).toHaveBeenCalled();
    });
    
    test('debería manejar errores al cachear respuesta', async () => {
      // Simular que no hay respuesta cacheada
      mockRedisClient.get.mockResolvedValue(null);
      
      // Simular error en setex
      mockRedisClient.setex.mockRejectedValue(new Error('Redis error'));
      
      // Ejecutar middleware
      const middleware = cacheResponse();
      await middleware(req, res, next);
      
      // Simular llamada a res.json con datos
      await res.json({ test: true });
      
      // El error ocurre de forma asíncrona, por lo que debemos esperar un poco
      // para que se llame a logger.error
      await new Promise(resolve => setTimeout(resolve, 10));
      
      // Verificar que se registra el error pero la respuesta se envía
      expect(logger.error).toHaveBeenCalled();
    });
  });
  
  describe('invalidateCache', () => {
    test('debería invalidar caché según patrones', async () => {
      // Simular claves en Redis
      const keys = [
        'cache:/api/users',
        'cache:/api/products',
        'cache:/api/orders'
      ];
      mockRedisClient.keys.mockResolvedValue(keys);
      
      // Ejecutar middleware con patrón que coincide con la primera clave
      const middleware = invalidateCache('/api/users');
      await middleware(req, res, next);
      
      // Verificar que se eliminan las claves que coinciden
      expect(mockRedisClient.keys).toHaveBeenCalledWith('cache:*');
      expect(mockRedisClient.del).toHaveBeenCalledWith('cache:/api/users');
      expect(mockRedisClient.del).toHaveBeenCalledTimes(1);
      expect(next).toHaveBeenCalled();
      expect(logger.info).toHaveBeenCalled();
    });
    
    test('debería aceptar múltiples patrones', async () => {
      // Simular claves en Redis
      const keys = [
        'cache:/api/users',
        'cache:/api/products',
        'cache:/api/orders'
      ];
      mockRedisClient.keys.mockResolvedValue(keys);
      
      // Ejecutar middleware con varios patrones
      const middleware = invalidateCache(['/api/users', '/api/products']);
      await middleware(req, res, next);
      
      // Verificar que se eliminan todas las claves que coinciden
      expect(mockRedisClient.del).toHaveBeenCalledTimes(2);
      expect(next).toHaveBeenCalled();
    });
    
    test('debería manejar errores', async () => {
      // Simular error de Redis
      mockRedisClient.keys.mockRejectedValue(new Error('Redis error'));
      
      // Ejecutar middleware
      const middleware = invalidateCache('/api/test');
      await middleware(req, res, next);
      
      // Verificar que se maneja el error y se continúa
      expect(logger.error).toHaveBeenCalled();
      expect(next).toHaveBeenCalled();
    });
  });
  
  describe('clearCache', () => {
    test('debería limpiar todo el caché', async () => {
      // Simular claves en Redis
      const keys = [
        'cache:/api/users',
        'cache:/api/products',
        'cache:/api/orders'
      ];
      mockRedisClient.keys.mockResolvedValue(keys);
      
      // Ejecutar middleware
      await clearCache(req, res, next);
      
      // Verificar que se eliminan todas las claves
      expect(mockRedisClient.keys).toHaveBeenCalledWith('cache:*');
      expect(mockRedisClient.del).toHaveBeenCalledWith(keys);
      expect(next).toHaveBeenCalled();
      expect(logger.info).toHaveBeenCalled();
    });
    
    test('debería manejar el caso sin claves', async () => {
      // Simular que no hay claves
      mockRedisClient.keys.mockResolvedValue([]);
      
      // Ejecutar middleware
      await clearCache(req, res, next);
      
      // Verificar que no se llama a del
      expect(mockRedisClient.del).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalled();
    });
    
    test('debería manejar errores', async () => {
      // Simular error de Redis
      mockRedisClient.keys.mockRejectedValue(new Error('Redis error'));
      
      // Ejecutar middleware
      await clearCache(req, res, next);
      
      // Verificar que se maneja el error y se continúa
      expect(logger.error).toHaveBeenCalled();
      expect(next).toHaveBeenCalled();
    });
  });
  
  describe('cacheWithParams', () => {
    test('debería cachear respuestas con parámetros de consulta', async () => {
      // Configurar request con query params
      req.query = { page: 1, limit: 10 };
      
      // Simular que no hay respuesta cacheada
      mockRedisClient.get.mockResolvedValue(null);
      
      // Ejecutar middleware
      const middleware = cacheWithParams(120);
      await middleware(req, res, next);
      
      // Verificar que se busca con la clave correcta
      expect(mockRedisClient.get).toHaveBeenCalledWith('cache:/api/test?page=1&limit=10');
      expect(next).toHaveBeenCalled();
      
      // Simular respuesta
      res.json({ data: [1, 2, 3] });
      
      // Verificar que se cachea con la clave correcta
      expect(mockRedisClient.setex).toHaveBeenCalledWith(
        'cache:/api/test?page=1&limit=10',
        120,
        JSON.stringify({ data: [1, 2, 3] })
      );
    });
    
    test('debería devolver respuesta cacheada con parámetros si existe', async () => {
      // Configurar request con query params
      req.query = { page: 1, limit: 10 };
      
      // Simular respuesta cacheada
      const cachedData = JSON.stringify({ data: [1, 2, 3] });
      mockRedisClient.get.mockResolvedValue(cachedData);
      
      // Ejecutar middleware
      const middleware = cacheWithParams();
      await middleware(req, res, next);
      
      // Verificar que se devuelve la respuesta cacheada
      expect(mockRedisClient.get).toHaveBeenCalledWith('cache:/api/test?page=1&limit=10');
      expect(res.json).toHaveBeenCalledWith(JSON.parse(cachedData));
      expect(next).not.toHaveBeenCalled();
    });
    
    test('debería omitir caché para métodos no GET', async () => {
      // Cambiar método a POST
      req.method = 'POST';
      
      // Ejecutar middleware
      const middleware = cacheWithParams();
      await middleware(req, res, next);
      
      // Verificar que se omite caché
      expect(mockRedisClient.get).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalled();
    });
    
    test('debería manejar errores', async () => {
      // Simular error de Redis
      mockRedisClient.get.mockRejectedValue(new Error('Redis error'));
      
      // Ejecutar middleware
      const middleware = cacheWithParams();
      await middleware(req, res, next);
      
      // Verificar que se maneja el error y se continúa
      expect(logger.error).toHaveBeenCalled();
      expect(next).toHaveBeenCalled();
    });
  });
}); 