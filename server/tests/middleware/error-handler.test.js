/**
 * Error Handler Middleware Tests
 * Pruebas unitarias para middleware de manejo de errores
 */

// Mocks para las dependencias
jest.mock('../../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
  }
}));

// Importamos el logger mockeado para verificaciones
const { logger } = require('../../utils/logger');

// Importamos el código bajo prueba
const {
  errorHandler,
  validationErrorHandler,
  authErrorHandler,
  dbErrorHandler,
  fileErrorHandler,
  joiErrorHandler,
  jsonSyntaxErrorHandler
} = require('../../middleware/error-handler');

describe('Error Handler Middleware', () => {
  let mockRequest;
  let mockResponse;
  let nextFunction;

  beforeEach(() => {
    // Limpiamos todos los mocks
    jest.clearAllMocks();

    // Creamos objetos mock para request, response y next
    mockRequest = {
      path: '/test/path',
      method: 'GET',
      ip: '127.0.0.1',
      body: { test: 'data' }
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    nextFunction = jest.fn();

    // Configurar NODE_ENV para pruebas
    process.env.NODE_ENV = 'test';
  });

  describe('Main Error Handler', () => {
    it('debe manejar errores generales con código de estado personalizado', () => {
      // Crear un error de prueba
      const testError = new Error('Test error');
      testError.statusCode = 400;

      // Ejecutar el middleware
      errorHandler(testError, mockRequest, mockResponse, nextFunction);

      // Verificar el comportamiento
      expect(logger.error).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: {
          message: 'Test error'
        }
      });
    });

    it('debe usar código 500 para errores sin código de estado', () => {
      // Crear un error de prueba sin código de estado
      const testError = new Error('Internal server error');

      // Ejecutar el middleware
      errorHandler(testError, mockRequest, mockResponse, nextFunction);

      // Verificar el comportamiento
      expect(logger.error).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: {
          message: 'Internal server error'
        }
      });
    });

    it('debe incluir stack trace en modo desarrollo', () => {
      // Cambiar a modo desarrollo
      process.env.NODE_ENV = 'development';

      // Crear un error de prueba
      const testError = new Error('Development error');
      testError.stack = 'Error stack trace';

      // Ejecutar el middleware
      errorHandler(testError, mockRequest, mockResponse, nextFunction);

      // Verificar que se incluye el stack trace
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: {
          message: 'Development error',
          stack: 'Error stack trace'
        }
      });
    });
  });

  describe('Validation Error Handler', () => {
    it('debe manejar errores de validación', () => {
      // Crear un error de validación
      const validationError = new Error('Validation failed');
      validationError.name = 'ValidationError';

      // Ejecutar el middleware
      validationErrorHandler(validationError, mockRequest, mockResponse, nextFunction);

      // Verificar el comportamiento
      expect(logger.error).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Error de validación',
          details: 'Validation failed'
        })
      );
    });

    it('debe pasar el error al siguiente middleware si no es un error de validación', () => {
      // Crear un error que no es de validación
      const otherError = new Error('Not a validation error');
      otherError.name = 'OtherError';

      // Ejecutar el middleware
      validationErrorHandler(otherError, mockRequest, mockResponse, nextFunction);

      // Verificar que se pasa al siguiente middleware
      expect(nextFunction).toHaveBeenCalledWith(otherError);
      expect(mockResponse.status).not.toHaveBeenCalled();
    });
  });

  describe('Auth Error Handler', () => {
    it('debe manejar errores de autenticación', () => {
      // Crear un error de autenticación
      const authError = new Error('Authentication failed');
      authError.name = 'UnauthorizedError';

      // Ejecutar el middleware
      authErrorHandler(authError, mockRequest, mockResponse, nextFunction);

      // Verificar el comportamiento
      expect(logger.error).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'No autorizado',
          message: 'Authentication failed'
        })
      );
    });

    it('debe pasar el error al siguiente middleware si no es un error de autenticación', () => {
      // Crear un error que no es de autenticación
      const otherError = new Error('Not an auth error');
      otherError.name = 'OtherError';

      // Ejecutar el middleware
      authErrorHandler(otherError, mockRequest, mockResponse, nextFunction);

      // Verificar que se pasa al siguiente middleware
      expect(nextFunction).toHaveBeenCalledWith(otherError);
      expect(mockResponse.status).not.toHaveBeenCalled();
    });
  });

  describe('DB Error Handler', () => {
    it('debe manejar errores de duplicación de base de datos', () => {
      // Crear un error de base de datos
      const dbError = new Error('Duplicate entry');
      dbError.code = 'ER_DUP_ENTRY';

      // Ejecutar el middleware
      dbErrorHandler(dbError, mockRequest, mockResponse, nextFunction);

      // Verificar el comportamiento
      expect(logger.error).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(409);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Registro duplicado',
          details: 'Duplicate entry'
        })
      );
    });

    it('debe manejar errores de referencia inválida', () => {
      // Crear un error de referencia
      const dbError = new Error('Invalid reference');
      dbError.code = 'ER_NO_REFERENCED_ROW';

      // Ejecutar el middleware
      dbErrorHandler(dbError, mockRequest, mockResponse, nextFunction);

      // Verificar el comportamiento
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Referencia no válida'
        })
      );
    });

    it('debe manejar errores de campos requeridos', () => {
      // Crear un error de campo nulo
      const dbError = new Error('Column cannot be null');
      dbError.code = 'ER_BAD_NULL_ERROR';

      // Ejecutar el middleware
      dbErrorHandler(dbError, mockRequest, mockResponse, nextFunction);

      // Verificar el comportamiento
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Campo requerido no proporcionado'
        })
      );
    });

    it('debe pasar el error al siguiente middleware si no es un error de base de datos', () => {
      // Crear un error que no es de base de datos
      const otherError = new Error('Not a DB error');
      otherError.code = 'OTHER_ERROR';

      // Ejecutar el middleware
      dbErrorHandler(otherError, mockRequest, mockResponse, nextFunction);

      // Verificar que se pasa al siguiente middleware
      expect(nextFunction).toHaveBeenCalledWith(otherError);
      expect(mockResponse.status).not.toHaveBeenCalled();
    });
  });

  describe('File Error Handler', () => {
    it('debe manejar errores de archivo no encontrado', () => {
      // Crear un error de archivo no encontrado
      const fileError = new Error('File not found');
      fileError.code = 'ENOENT';

      // Ejecutar el middleware
      fileErrorHandler(fileError, mockRequest, mockResponse, nextFunction);

      // Verificar el comportamiento
      expect(logger.error).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Archivo no encontrado',
          details: 'File not found'
        })
      );
    });

    it('debe manejar errores de permiso denegado', () => {
      // Crear un error de permiso
      const fileError = new Error('Permission denied');
      fileError.code = 'EACCES';

      // Ejecutar el middleware
      fileErrorHandler(fileError, mockRequest, mockResponse, nextFunction);

      // Verificar el comportamiento
      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Permiso denegado'
        })
      );
    });

    it('debe pasar el error al siguiente middleware si no es un error de archivo', () => {
      // Crear un error que no es de archivo
      const otherError = new Error('Not a file error');
      otherError.code = 'OTHER_ERROR';

      // Ejecutar el middleware
      fileErrorHandler(otherError, mockRequest, mockResponse, nextFunction);

      // Verificar que se pasa al siguiente middleware
      expect(nextFunction).toHaveBeenCalledWith(otherError);
      expect(mockResponse.status).not.toHaveBeenCalled();
    });
  });

  describe('Joi Error Handler', () => {
    it('debe manejar errores de validación de Joi', () => {
      // Crear un error de Joi
      const joiError = new Error('Joi validation error');
      joiError.isJoi = true;
      joiError.details = [
        { path: ['nombre'], message: 'El nombre es requerido' },
        { path: ['email'], message: 'Email no válido' }
      ];

      // Ejecutar el middleware
      joiErrorHandler(joiError, mockRequest, mockResponse, nextFunction);

      // Verificar el comportamiento
      expect(logger.error).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Error de validación',
          details: [
            { field: 'nombre', message: 'El nombre es requerido' },
            { field: 'email', message: 'Email no válido' }
          ]
        })
      );
    });

    it('debe pasar el error al siguiente middleware si no es un error de Joi', () => {
      // Crear un error que no es de Joi
      const otherError = new Error('Not a Joi error');

      // Ejecutar el middleware
      joiErrorHandler(otherError, mockRequest, mockResponse, nextFunction);

      // Verificar que se pasa al siguiente middleware
      expect(nextFunction).toHaveBeenCalledWith(otherError);
      expect(mockResponse.status).not.toHaveBeenCalled();
    });
  });

  describe('JSON Syntax Error Handler', () => {
    it('debe manejar errores de sintaxis JSON', () => {
      // Crear un error de sintaxis JSON
      const jsonError = new Error('Invalid JSON');
      jsonError.name = 'SyntaxError';
      jsonError.status = 400;

      // Ejecutar el middleware
      jsonSyntaxErrorHandler(jsonError, mockRequest, mockResponse, nextFunction);

      // Verificar el comportamiento
      expect(logger.error).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Error de sintaxis JSON',
          message: 'Invalid JSON'
        })
      );
    });

    it('debe pasar el error al siguiente middleware si no es un error de sintaxis JSON', () => {
      // Crear un error que no es de sintaxis JSON
      const otherError = new Error('Not a JSON syntax error');
      otherError.name = 'OtherError';

      // Ejecutar el middleware
      jsonSyntaxErrorHandler(otherError, mockRequest, mockResponse, nextFunction);

      // Verificar que se pasa al siguiente middleware
      expect(nextFunction).toHaveBeenCalledWith(otherError);
      expect(mockResponse.status).not.toHaveBeenCalled();
    });
  });
}); 