/**
 * Tests para middleware de caché de base de datos
 */

// Mocks reales para el objeto NodeCache
jest.mock('../../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  }
}));

// Importamos directamente el NodeCache real
const NodeCache = require('node-cache');

// Espiaremos los métodos de la instancia en el require
let dbCacheMock;
jest.mock('../../middleware/db-cache', () => {
  // Requerimos el módulo real
  const actualModule = jest.requireActual('../../middleware/db-cache');
  
  // Creamos un espía para la instancia dbCache que se usa internamente
  // accediendo a ella a través del módulo
  dbCacheMock = {
    get: jest.spyOn(actualModule.dbCache, 'get'),
    set: jest.spyOn(actualModule.dbCache, 'set'),
    keys: jest.spyOn(actualModule.dbCache, 'keys'),
    del: jest.spyOn(actualModule.dbCache, 'del'),
    flushAll: jest.spyOn(actualModule.dbCache, 'flushAll')
  };
  
  // Devolvemos el módulo real sin cambios
  return actualModule;
});

const { 
  cacheQuery, 
  invalidateQueryCache, 
  clearQueryCache, 
  cacheQueryWithParams,
  dbCache
} = require('../../middleware/db-cache');
const { logger } = require('../../utils/logger');

describe('DB Cache Middleware', () => {
  let req, res, next, jsonSpy;

  beforeEach(() => {
    // Resetear mocks
    jest.clearAllMocks();
    
    // Mock de los métodos de caché
    dbCacheMock.get.mockImplementation((key) => null); // Por defecto, no hay cache
    dbCacheMock.set.mockImplementation(() => true);
    dbCacheMock.keys.mockImplementation(() => ['users:list', 'users:1', 'products:list']);
    dbCacheMock.del.mockImplementation(() => true);
    dbCacheMock.flushAll.mockImplementation(() => true);
    
    // Mock objects
    jsonSpy = jest.fn();
    
    // Mock request object
    req = {
      method: 'GET',
      path: '/api/test',
      params: { id: 1 },
      query: { page: 1, limit: 10 }
    };
    
    // Mock response object
    res = {
      json: jsonSpy
    };
    
    // Mock next function
    next = jest.fn();
  });

  describe('cacheQuery', () => {
    test('debe devolver datos en caché si existen', () => {
      const cacheKey = 'test-key';
      const cachedData = { data: 'test-data' };
      
      // Configurar el mock para devolver datos en caché
      dbCacheMock.get.mockReturnValueOnce(cachedData);
      
      const middleware = cacheQuery(cacheKey, 300);
      middleware(req, res, next);
      
      expect(dbCacheMock.get).toHaveBeenCalledWith(cacheKey);
      expect(logger.info).toHaveBeenCalledWith('DB Cache Hit:', expect.any(Object));
      expect(res.json).toHaveBeenCalledWith(cachedData);
      expect(next).not.toHaveBeenCalled();
    });

    test('debe continuar y configurar caché cuando no hay cache', () => {
      const cacheKey = 'test-key';
      const responseData = { success: true, data: 'response-data' };
      
      // Configurar el mock para devolver null (sin caché)
      dbCacheMock.get.mockReturnValueOnce(null);
      
      const middleware = cacheQuery(cacheKey, 300);
      middleware(req, res, next);
      
      expect(dbCacheMock.get).toHaveBeenCalledWith(cacheKey);
      expect(next).toHaveBeenCalled();
      
      // Probar que res.json ha sido modificado
      const modifiedJson = res.json;
      modifiedJson(responseData);
      
      expect(dbCacheMock.set).toHaveBeenCalledWith(cacheKey, responseData, 300);
      expect(logger.info).toHaveBeenCalledWith('DB Cache Miss:', expect.any(Object));
    });

    test('debe manejar errores y continuar', () => {
      const cacheKey = 'test-key';
      
      // Simular error
      dbCacheMock.get.mockImplementationOnce(() => {
        throw new Error('Cache error');
      });
      
      const middleware = cacheQuery(cacheKey, 300);
      middleware(req, res, next);
      
      expect(logger.error).toHaveBeenCalledWith('Error en caché de base de datos:', expect.any(Object));
      expect(next).toHaveBeenCalled();
    });
  });

  describe('invalidateQueryCache', () => {
    test('debe invalidar las claves que coinciden con los patrones', () => {
      const patterns = ['users'];
      
      const middleware = invalidateQueryCache(patterns);
      middleware(req, res, next);
      
      // Debe eliminar 'users:list' y 'users:1'
      expect(dbCacheMock.del).toHaveBeenCalledWith('users:list');
      expect(dbCacheMock.del).toHaveBeenCalledWith('users:1');
      expect(dbCacheMock.del).not.toHaveBeenCalledWith('products:list');
      
      expect(logger.info).toHaveBeenCalledWith('DB Cache Invalidated:', expect.any(Object));
      expect(next).toHaveBeenCalled();
    });

    test('no debe hacer nada si no hay coincidencias', () => {
      // Configurar el mock para devolver claves que no coinciden
      dbCacheMock.keys.mockReturnValueOnce(['products:list', 'categories:list']);
      
      const patterns = ['users'];
      
      const middleware = invalidateQueryCache(patterns);
      middleware(req, res, next);
      
      expect(dbCacheMock.del).not.toHaveBeenCalled();
      expect(logger.info).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalled();
    });

    test('debe manejar errores y continuar', () => {
      const patterns = ['users'];
      
      // Simular error
      dbCacheMock.keys.mockImplementationOnce(() => {
        throw new Error('Cache error');
      });
      
      const middleware = invalidateQueryCache(patterns);
      middleware(req, res, next);
      
      expect(logger.error).toHaveBeenCalledWith('Error al invalidar caché de base de datos:', expect.any(Object));
      expect(next).toHaveBeenCalled();
    });
  });

  describe('clearQueryCache', () => {
    test('debe limpiar toda la caché', () => {
      clearQueryCache();
      
      expect(dbCacheMock.flushAll).toHaveBeenCalled();
      expect(logger.info).toHaveBeenCalledWith('DB Cache Cleared:', expect.any(Object));
    });

    test('debe manejar errores', () => {
      // Simular error
      dbCacheMock.flushAll.mockImplementationOnce(() => {
        throw new Error('Flush error');
      });
      
      clearQueryCache();
      
      expect(logger.error).toHaveBeenCalledWith('Error al limpiar caché de base de datos:', expect.any(Object));
    });
  });

  describe('cacheQueryWithParams', () => {
    test('debe usar generador de clave personalizado', () => {
      const keyGenerator = (req) => `${req.path}:${req.params.id}:${req.query.page}`;
      const expectedKey = '/api/test:1:1';
      const cachedData = { data: 'test-params-data' };
      
      // Configurar el mock para devolver datos en caché
      dbCacheMock.get.mockReturnValueOnce(cachedData);
      
      const middleware = cacheQueryWithParams(keyGenerator, 300);
      middleware(req, res, next);
      
      expect(dbCacheMock.get).toHaveBeenCalledWith(expectedKey);
      expect(res.json).toHaveBeenCalledWith(cachedData);
    });

    test('debe guardar en caché con la clave generada', () => {
      const keyGenerator = (req) => `${req.path}:${req.params.id}`;
      const expectedKey = '/api/test:1';
      const responseData = { success: true };
      
      // Configurar el mock para devolver null (sin caché)
      dbCacheMock.get.mockReturnValueOnce(null);
      
      const middleware = cacheQueryWithParams(keyGenerator, 300);
      middleware(req, res, next);
      
      // Ejecutar la función json modificada
      const modifiedJson = res.json;
      modifiedJson(responseData);
      
      expect(dbCacheMock.set).toHaveBeenCalledWith(expectedKey, responseData, 300);
    });

    test('debe manejar errores y continuar', () => {
      const keyGenerator = (req) => `${req.path}:${req.params.id}`;
      
      // Simular error
      dbCacheMock.get.mockImplementationOnce(() => {
        throw new Error('Params cache error');
      });
      
      const middleware = cacheQueryWithParams(keyGenerator, 300);
      middleware(req, res, next);
      
      expect(logger.error).toHaveBeenCalledWith('Error en caché de base de datos con parámetros:', expect.any(Object));
      expect(next).toHaveBeenCalled();
    });
  });
}); 