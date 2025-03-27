/**
 * Tests para error.middleware.js
 * Prueba el middleware de manejo de errores de la aplicación
 */

// Mocks
jest.mock('../../utils/logger', () => ({
  logger: {
    error: jest.fn()
  }
}));

// Importaciones
const { logger } = require('../../utils/logger');
const errorMiddleware = require('../../middleware/error.middleware');

describe('Error Middleware', () => {
  // Configuración inicial
  let req;
  let res;
  let next;
  
  // Variables para controlar el entorno
  let originalNodeEnv;
  
  beforeEach(() => {
    // Guardar el entorno original
    originalNodeEnv = process.env.NODE_ENV;
    
    // Reiniciar mocks
    jest.clearAllMocks();
    
    // Mocks para req, res y next
    req = {
      path: '/api/test',
      method: 'GET'
    };
    
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    
    next = jest.fn();
  });
  
  afterEach(() => {
    // Restaurar entorno original
    process.env.NODE_ENV = originalNodeEnv;
  });
  
  test('debería registrar el error y enviar respuesta de error', () => {
    // Crear error de prueba
    const error = new Error('Test error');
    
    // Ejecutar middleware
    errorMiddleware(error, req, res, next);
    
    // Verificar que se registra el error
    expect(logger.error).toHaveBeenCalledWith('Error processing request', expect.objectContaining({
      path: '/api/test',
      method: 'GET',
      error: 'Test error'
    }));
    
    // Verificar respuesta de error
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: false,
      message: 'Test error'
    }));
  });
  
  test('debería respetar el código de estado del error', () => {
    // Crear error con código personalizado
    const error = new Error('Not found');
    error.statusCode = 404;
    
    // Ejecutar middleware
    errorMiddleware(error, req, res, next);
    
    // Verificar respuesta con código personalizado
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: false,
      message: 'Not found'
    }));
  });
  
  test('debería incluir la pila en modo desarrollo', () => {
    // Establecer entorno de desarrollo
    process.env.NODE_ENV = 'development';
    
    // Crear error con pila
    const error = new Error('Development error');
    error.stack = 'Error: Development error\n   at test.js:10:20';
    
    // Ejecutar middleware
    errorMiddleware(error, req, res, next);
    
    // Verificar que la respuesta incluye la pila
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      error: error.stack
    }));
  });
  
  test('debería ocultar la pila en modo producción', () => {
    // Establecer entorno de producción
    process.env.NODE_ENV = 'production';
    
    // Crear error con pila
    const error = new Error('Production error');
    error.stack = 'Error: Production error\n   at test.js:10:20';
    
    // Ejecutar middleware
    errorMiddleware(error, req, res, next);
    
    // Verificar que la respuesta no incluye la pila
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      error: undefined
    }));
  });
  
  test('debería mostrar mensaje genérico para errores 500 en producción', () => {
    // Establecer entorno de producción
    process.env.NODE_ENV = 'production';
    
    // Crear error de servidor
    const error = new Error('Internal server error');
    
    // Ejecutar middleware
    errorMiddleware(error, req, res, next);
    
    // Verificar mensaje genérico
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      message: 'Error interno del servidor'
    }));
  });
  
  test('debería mostrar mensaje real para errores no 500 en producción', () => {
    // Establecer entorno de producción
    process.env.NODE_ENV = 'production';
    
    // Crear error no 500
    const error = new Error('Bad request');
    error.statusCode = 400;
    
    // Ejecutar middleware
    errorMiddleware(error, req, res, next);
    
    // Verificar mensaje real
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      message: 'Bad request'
    }));
  });
}); 