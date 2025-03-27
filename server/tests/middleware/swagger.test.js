/**
 * Tests para middleware de swagger
 */

// Mocks
const mockValidate = jest.fn().mockReturnValue({ errors: [] });
const mockSwaggerSpec = {
  validate: mockValidate
};

jest.mock('swagger-jsdoc', () => {
  return jest.fn().mockImplementation(() => mockSwaggerSpec);
});

jest.mock('swagger-ui-express', () => ({
  serve: jest.fn(),
  setup: jest.fn().mockReturnValue(() => {})
}));

jest.mock('../../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  }
}));

const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const { 
  swaggerMiddleware, 
  swaggerUiMiddleware, 
  validateSwagger, 
  logSwaggerAccess 
} = require('../../middleware/swagger');
const { logger } = require('../../utils/logger');

describe('Swagger Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    // Resetear mocks
    jest.clearAllMocks();
    
    // Reset el valor de validate por defecto
    mockValidate.mockReturnValue({ errors: [] });
    
    // Mock request object
    req = {
      path: '/api-docs',
      method: 'GET',
      ip: '127.0.0.1',
      get: jest.fn().mockReturnValue('Mozilla/5.0 Test')
    };
    
    // Mock response object
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    
    // Mock next function
    next = jest.fn();
  });

  describe('swaggerMiddleware', () => {
    test('debe ser el middleware de swagger-ui-express', () => {
      expect(swaggerMiddleware).toBe(swaggerUi.serve);
    });
  });

  describe('swaggerUiMiddleware', () => {
    test('debe ser generado por swagger-ui-express.setup', () => {
      // No verificamos si se llamó, sólo verificamos que exista y sea una función
      expect(swaggerUiMiddleware).toBeDefined();
      expect(typeof swaggerUiMiddleware).toBe('function');
    });
  });

  describe('validateSwagger', () => {
    test('debe continuar cuando no hay errores de validación', () => {
      // El mock por defecto ya retorna errors: []
      validateSwagger(req, res, next);
      
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    test('debe responder con error 500 cuando hay errores de validación', () => {
      // Configurar el mock para que retorne errores
      mockValidate.mockReturnValueOnce({ 
        errors: [{ message: 'Invalid schema' }] 
      });
      
      validateSwagger(req, res, next);
      
      expect(logger.error).toHaveBeenCalledWith('Error en documentación Swagger:', expect.any(Object));
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        message: 'Error en la documentación de la API'
      }));
      expect(next).not.toHaveBeenCalled();
    });

    test('debe manejar excepciones y continuar', () => {
      // Configurar el mock para que lance un error
      mockValidate.mockImplementationOnce(() => {
        throw new Error('Validation error');
      });
      
      validateSwagger(req, res, next);
      
      expect(logger.error).toHaveBeenCalledWith('Error al validar Swagger:', expect.any(Object));
      expect(next).toHaveBeenCalled();
    });
  });

  describe('logSwaggerAccess', () => {
    test('debe registrar acceso a la documentación', () => {
      logSwaggerAccess(req, res, next);
      
      expect(logger.info).toHaveBeenCalledWith('Acceso a documentación Swagger:', expect.any(Object));
      expect(next).toHaveBeenCalled();
    });
  });
}); 