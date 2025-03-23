/**
 * Pruebas para middleware de manejo de errores
 * Verifica que los errores se capturen y formateen adecuadamente
 */

const { errorHandler, validationErrorHandler, authErrorHandler, dbErrorHandler } = require('../../middleware/error-handler');
const { logger } = require('../../utils/logger');

// Configurar NODE_ENV para testing
process.env.NODE_ENV = 'test';

// Mock del logger
jest.mock('../../utils/logger');

describe('Error Handler Middleware', () => {
  let req, res, next;
  
  beforeEach(() => {
    // Limpiar mocks
    jest.clearAllMocks();
    
    // Configurar mocks de logger manualmente
    logger.error = jest.fn();
    logger.info = jest.fn();
    logger.warn = jest.fn();
    logger.debug = jest.fn();
    
    // Crear objetos mock
    req = {
      path: '/api/test',
      method: 'GET',
      ip: '127.0.0.1',
      headers: {
        'user-agent': 'test-agent'
      },
      body: {}
    };
    
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      headersSent: false
    };
    
    next = jest.fn();
  });
  
  test('debe capturar y formatear errores genéricos', () => {
    const error = new Error('Error de prueba');
    
    errorHandler(error, req, res, next);
    
    expect(logger.error).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      error: expect.objectContaining({
        message: 'Error de prueba'
      })
    }));
  });
  
  test('debe mantener el código de estado de errores HTTP', () => {
    const error = new Error('Recurso no encontrado');
    error.statusCode = 404;
    
    errorHandler(error, req, res, next);
    
    expect(logger.error).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      error: expect.objectContaining({
        message: 'Recurso no encontrado'
      })
    }));
  });
  
  test('debe manejar errores de validación', () => {
    const error = new Error('Error de validación');
    error.name = 'ValidationError';
    
    validationErrorHandler(error, req, res, next);
    
    expect(logger.error).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      error: 'Error de validación',
      details: error.message
    }));
  });
  
  test('debe pasar al siguiente middleware si no es error de validación', () => {
    const error = new Error('Otro tipo de error');
    
    validationErrorHandler(error, req, res, next);
    
    expect(next).toHaveBeenCalledWith(error);
    expect(res.status).not.toHaveBeenCalled();
  });

  test('debe manejar errores de autenticación', () => {
    const error = new Error('Token inválido');
    error.name = 'UnauthorizedError';
    
    authErrorHandler(error, req, res, next);
    
    expect(logger.error).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalled();
  });
  
  test('debe manejar errores de base de datos', () => {
    const error = new Error('Error en la consulta');
    error.code = 'ER_FAILED_QUERY';
    
    dbErrorHandler(error, req, res, next);
    
    expect(logger.error).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalled();
  });
  
  test('debe pasar al siguiente middleware para errores no manejados', () => {
    const error = new Error('Error no manejado');
    
    // Simular que ningún handler específico procesa el error
    authErrorHandler(error, req, res, next);
    
    expect(next).toHaveBeenCalledWith(error);
  });
}); 