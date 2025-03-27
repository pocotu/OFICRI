/**
 * Tests para middleware de logger
 */

jest.mock('../../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  }
}));

const { 
  httpLogger, 
  errorLogger, 
  authLogger, 
  accessLogger, 
  fileLogger 
} = require('../../middleware/logger');
const { logger } = require('../../utils/logger');

describe('Logger Middleware', () => {
  let req, res, next, finishCallback;

  beforeEach(() => {
    // Resetear mocks
    jest.clearAllMocks();
    
    // Capturar el callback de res.on('finish')
    finishCallback = null;
    
    // Mock request object
    req = {
      method: 'GET',
      path: '/api/test',
      query: { page: 1 },
      body: { test: true },
      ip: '127.0.0.1',
      get: jest.fn().mockReturnValue('Mozilla/5.0 Test'),
      user: { id: 1, username: 'admin' },
      file: null
    };
    
    // Mock response object
    res = {
      statusCode: 200,
      on: jest.fn().mockImplementation((event, callback) => {
        if (event === 'finish') {
          finishCallback = callback;
        }
      })
    };
    
    // Mock next function
    next = jest.fn();
    
    // Spy on Date.now para controlar tiempos
    jest.spyOn(Date, 'now')
      .mockReturnValueOnce(1000) // Primera llamada (inicio)
      .mockReturnValueOnce(1500); // Segunda llamada (fin, duración = 500ms)
  });

  afterEach(() => {
    // Restaurar Date.now
    Date.now.mockRestore();
  });

  describe('httpLogger', () => {
    test('debe registrar el inicio de petición y llamar a next', () => {
      httpLogger(req, res, next);
      
      expect(logger.info).toHaveBeenCalledWith('Inicio de petición:', expect.objectContaining({
        method: 'GET',
        path: '/api/test',
        query: { page: 1 },
        ip: '127.0.0.1'
      }));
      expect(next).toHaveBeenCalled();
    });

    test('debe registrar el fin de petición cuando termina', () => {
      httpLogger(req, res, next);
      
      // Ejecutar callback de finalización
      finishCallback();
      
      expect(logger.info).toHaveBeenCalledWith('Fin de petición:', expect.objectContaining({
        method: 'GET',
        path: '/api/test',
        status: 200,
        duration: 500
      }));
    });

    test('debe registrar error cuando el status es >= 400', () => {
      res.statusCode = 404;
      
      httpLogger(req, res, next);
      finishCallback();
      
      expect(logger.error).toHaveBeenCalledWith('Error HTTP:', expect.objectContaining({
        method: 'GET',
        path: '/api/test',
        status: 404
      }));
    });

    test('debe registrar advertencia cuando la petición es lenta', () => {
      // Modificar la duración simulada
      Date.now.mockRestore();
      jest.spyOn(Date, 'now')
        .mockReturnValueOnce(1000) // Primera llamada (inicio)
        .mockReturnValueOnce(2500); // Segunda llamada (fin, duración = 1500ms > 1000ms)
      
      httpLogger(req, res, next);
      finishCallback();
      
      expect(logger.warn).toHaveBeenCalledWith('Petición lenta:', expect.objectContaining({
        method: 'GET',
        path: '/api/test',
        duration: 1500
      }));
    });
  });

  describe('errorLogger', () => {
    test('debe registrar errores y llamar a next con el error', () => {
      const error = new Error('Test error');
      
      errorLogger(error, req, res, next);
      
      expect(logger.error).toHaveBeenCalledWith('Error en la aplicación:', expect.objectContaining({
        error: 'Test error',
        stack: error.stack,
        method: 'GET',
        path: '/api/test'
      }));
      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('authLogger', () => {
    test('debe registrar intentos de autenticación', () => {
      req.path = '/api/auth/login';
      
      authLogger(req, res, next);
      finishCallback();
      
      expect(logger.info).toHaveBeenCalledWith('Intento de autenticación:', expect.objectContaining({
        path: '/api/auth/login',
        status: 200
      }));
    });

    test('debe registrar advertencia para autenticación fallida', () => {
      req.path = '/api/auth/login';
      res.statusCode = 401;
      
      authLogger(req, res, next);
      finishCallback();
      
      expect(logger.warn).toHaveBeenCalledWith('Autenticación fallida:', expect.objectContaining({
        path: '/api/auth/login',
        ip: '127.0.0.1'
      }));
    });

    test('no debe registrar para rutas no relacionadas con auth', () => {
      req.path = '/api/products';
      
      authLogger(req, res, next);
      finishCallback();
      
      expect(logger.info).not.toHaveBeenCalledWith('Intento de autenticación:', expect.any(Object));
    });
  });

  describe('accessLogger', () => {
    test('debe registrar acceso a recursos sensibles', () => {
      req.path = '/api/admin/settings';
      
      accessLogger(req, res, next);
      finishCallback();
      
      expect(logger.info).toHaveBeenCalledWith('Acceso a recurso sensible:', expect.objectContaining({
        path: '/api/admin/settings',
        user: 1
      }));
    });

    test('debe registrar advertencia para acceso denegado', () => {
      req.path = '/api/users/1';
      res.statusCode = 403;
      
      accessLogger(req, res, next);
      finishCallback();
      
      expect(logger.warn).toHaveBeenCalledWith('Acceso denegado a recurso sensible:', expect.objectContaining({
        path: '/api/users/1',
        user: 1
      }));
    });

    test('no debe registrar para rutas no sensibles', () => {
      req.path = '/api/products';
      
      accessLogger(req, res, next);
      finishCallback();
      
      expect(logger.info).not.toHaveBeenCalledWith('Acceso a recurso sensible:', expect.any(Object));
    });
  });

  describe('fileLogger', () => {
    test('debe registrar operaciones con archivos', () => {
      req.file = {
        filename: 'test.pdf',
        size: 1024,
        mimetype: 'application/pdf'
      };
      
      fileLogger(req, res, next);
      finishCallback();
      
      expect(logger.info).toHaveBeenCalledWith('Operación con archivo:', expect.objectContaining({
        filename: 'test.pdf',
        size: 1024,
        mimetype: 'application/pdf',
        user: 1
      }));
    });

    test('no debe registrar si no hay archivo', () => {
      req.file = null;
      
      fileLogger(req, res, next);
      finishCallback();
      
      expect(logger.info).not.toHaveBeenCalledWith('Operación con archivo:', expect.any(Object));
    });
  });
}); 