/**
 * Tests para el middleware de manejo de errores
 * Prueba el manejo centralizado de diferentes tipos de errores
 */

// Mock del logger
jest.mock('../../utils/logger', () => ({
  logger: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn()
  }
}));

// Importar logger mock para verificaciones
const { logger } = require('../../utils/logger');

// Importar funciones del middleware
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
  let req, res, next;

  beforeEach(() => {
    // Reiniciar mocks
    jest.clearAllMocks();
    
    // Configurar objetos mock
    req = {
      path: '/api/test',
      method: 'POST',
      ip: '127.0.0.1',
      body: { test: 'data' }
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    next = jest.fn();
    
    // Configurar variable de entorno
    process.env.NODE_ENV = 'production';
  });

  describe('errorHandler', () => {
    it('debe manejar errores genéricos con código 500 por defecto', () => {
      // Crear un error genérico
      const err = new Error('Error genérico');
      
      // Ejecutar middleware
      errorHandler(err, req, res, next);
      
      // Verificar respuesta
      expect(logger.error).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            message: 'Error genérico'
          })
        })
      );
      expect(next).not.toHaveBeenCalled();
    });
    
    it('debe respetar el código de estado del error', () => {
      // Crear un error con código de estado
      const err = new Error('Error con código');
      err.statusCode = 400;
      
      // Ejecutar middleware
      errorHandler(err, req, res, next);
      
      // Verificar respuesta
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            message: 'Error con código'
          })
        })
      );
    });
    
    it('debe incluir stack en modo development', () => {
      // Cambiar a modo development
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      
      // Crear un error
      const err = new Error('Error en desarrollo');
      
      // Ejecutar middleware
      errorHandler(err, req, res, next);
      
      // Verificar respuesta
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            message: 'Error en desarrollo',
            stack: expect.any(String)
          })
        })
      );
      
      // Restaurar modo
      process.env.NODE_ENV = originalEnv;
    });
  });
  
  describe('validationErrorHandler', () => {
    it('debe manejar errores de validación', () => {
      // Crear un error de validación
      const err = new Error('Datos inválidos');
      err.name = 'ValidationError';
      
      // Ejecutar middleware
      validationErrorHandler(err, req, res, next);
      
      // Verificar respuesta
      expect(logger.error).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Error de validación',
          details: 'Datos inválidos'
        })
      );
      expect(next).not.toHaveBeenCalled();
    });
    
    it('debe pasar al siguiente middleware si no es un error de validación', () => {
      // Crear un error de otro tipo
      const err = new Error('Otro error');
      
      // Ejecutar middleware
      validationErrorHandler(err, req, res, next);
      
      // Verificar que se pasa al siguiente middleware
      expect(next).toHaveBeenCalledWith(err);
      expect(res.status).not.toHaveBeenCalled();
    });
  });
  
  describe('authErrorHandler', () => {
    it('debe manejar errores de autenticación', () => {
      // Crear un error de autenticación
      const err = new Error('Token inválido');
      err.name = 'UnauthorizedError';
      
      // Ejecutar middleware
      authErrorHandler(err, req, res, next);
      
      // Verificar respuesta
      expect(logger.error).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'No autorizado',
          message: 'Token inválido'
        })
      );
      expect(next).not.toHaveBeenCalled();
    });
    
    it('debe pasar al siguiente middleware si no es un error de autenticación', () => {
      // Crear un error de otro tipo
      const err = new Error('Otro error');
      
      // Ejecutar middleware
      authErrorHandler(err, req, res, next);
      
      // Verificar que se pasa al siguiente middleware
      expect(next).toHaveBeenCalledWith(err);
      expect(res.status).not.toHaveBeenCalled();
    });
  });
  
  describe('dbErrorHandler', () => {
    it('debe manejar errores de base de datos genéricos', () => {
      // Crear un error de base de datos
      const err = new Error('Error de conexión');
      err.code = 'ER_CONNECTION_FAILED';
      
      // Ejecutar middleware
      dbErrorHandler(err, req, res, next);
      
      // Verificar respuesta
      expect(logger.error).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Error de base de datos'
        })
      );
    });
    
    it('debe manejar error de duplicado', () => {
      const err = new Error('Entrada duplicada');
      err.code = 'ER_DUP_ENTRY';
      
      dbErrorHandler(err, req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Registro duplicado'
        })
      );
    });
    
    it('debe manejar error de referencia', () => {
      const err = new Error('Referencia no válida');
      err.code = 'ER_NO_REFERENCED_ROW';
      
      dbErrorHandler(err, req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Referencia no válida'
        })
      );
    });
    
    it('debe manejar error de null no permitido', () => {
      const err = new Error('Null no permitido');
      err.code = 'ER_BAD_NULL_ERROR';
      
      dbErrorHandler(err, req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Campo requerido no proporcionado'
        })
      );
    });
    
    it('debe manejar error de datos muy largos', () => {
      const err = new Error('Datos muy largos');
      err.code = 'ER_DATA_TOO_LONG';
      
      dbErrorHandler(err, req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Datos demasiado largos'
        })
      );
    });
    
    it('debe manejar errores de timeout de bloqueo', () => {
      const err = new Error('Timeout de bloqueo');
      err.code = 'ER_LOCK_WAIT_TIMEOUT';
      
      dbErrorHandler(err, req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(503);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Timeout de bloqueo'
        })
      );
    });
    
    it('debe manejar errores de deadlock', () => {
      const err = new Error('Deadlock');
      err.code = 'ER_DEADLOCK';
      
      dbErrorHandler(err, req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(503);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Deadlock detectado'
        })
      );
    });
    
    it('debe pasar al siguiente middleware si no es un error de base de datos', () => {
      // Crear un error de otro tipo
      const err = new Error('Otro error');
      
      // Ejecutar middleware
      dbErrorHandler(err, req, res, next);
      
      // Verificar que se pasa al siguiente middleware
      expect(next).toHaveBeenCalledWith(err);
      expect(res.status).not.toHaveBeenCalled();
    });
  });
  
  describe('fileErrorHandler', () => {
    it('debe manejar errores de archivo genéricos', () => {
      // Crear un error de archivo
      const err = new Error('Error de archivo');
      err.code = 'EOTHER';
      
      // Ejecutar middleware
      fileErrorHandler(err, req, res, next);
      
      // Verificar respuesta
      expect(logger.error).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Error de archivo'
        })
      );
    });
    
    it('debe manejar error de archivo no encontrado', () => {
      const err = new Error('Archivo no encontrado');
      err.code = 'ENOENT';
      
      fileErrorHandler(err, req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Archivo no encontrado'
        })
      );
    });
    
    it('debe manejar error de permiso denegado', () => {
      const err = new Error('Permiso denegado');
      err.code = 'EACCES';
      
      fileErrorHandler(err, req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Permiso denegado'
        })
      );
    });
    
    it('debe manejar error de archivo existente', () => {
      const err = new Error('Archivo ya existe');
      err.code = 'EEXIST';
      
      fileErrorHandler(err, req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Archivo ya existe'
        })
      );
    });
    
    it('debe manejar error de espacio insuficiente', () => {
      const err = new Error('Sin espacio');
      err.code = 'ENOSPC';
      
      fileErrorHandler(err, req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(507);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Espacio insuficiente'
        })
      );
    });
    
    it('debe pasar al siguiente middleware si no es un error de archivo', () => {
      // Crear un error de otro tipo
      const err = new Error('Otro error');
      
      // Ejecutar middleware
      fileErrorHandler(err, req, res, next);
      
      // Verificar que se pasa al siguiente middleware
      expect(next).toHaveBeenCalledWith(err);
      expect(res.status).not.toHaveBeenCalled();
    });
  });
  
  describe('joiErrorHandler', () => {
    it('debe manejar errores de validación Joi', () => {
      // Crear un error Joi
      const err = new Error('Error de validación');
      err.isJoi = true;
      err.details = [
        { path: ['name'], message: 'Name is required' },
        { path: ['email'], message: 'Invalid email' }
      ];
      
      // Ejecutar middleware
      joiErrorHandler(err, req, res, next);
      
      // Verificar respuesta
      expect(logger.error).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Error de validación',
          details: [
            { field: 'name', message: 'Name is required' },
            { field: 'email', message: 'Invalid email' }
          ]
        })
      );
      expect(next).not.toHaveBeenCalled();
    });
    
    it('debe pasar al siguiente middleware si no es un error Joi', () => {
      // Crear un error de otro tipo
      const err = new Error('Otro error');
      
      // Ejecutar middleware
      joiErrorHandler(err, req, res, next);
      
      // Verificar que se pasa al siguiente middleware
      expect(next).toHaveBeenCalledWith(err);
      expect(res.status).not.toHaveBeenCalled();
    });
  });
  
  describe('jsonSyntaxErrorHandler', () => {
    it('debe manejar errores de sintaxis JSON', () => {
      // Crear un error de sintaxis JSON
      const err = new Error('JSON inválido');
      err.name = 'SyntaxError';
      err.status = 400;
      
      // Ejecutar middleware
      jsonSyntaxErrorHandler(err, req, res, next);
      
      // Verificar respuesta
      expect(logger.error).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Error de sintaxis JSON',
          message: 'JSON inválido'
        })
      );
      expect(next).not.toHaveBeenCalled();
    });
    
    it('debe pasar al siguiente middleware si no es un error de sintaxis JSON', () => {
      // Crear un error de otro tipo
      const err = new Error('Otro error');
      
      // Ejecutar middleware
      jsonSyntaxErrorHandler(err, req, res, next);
      
      // Verificar que se pasa al siguiente middleware
      expect(next).toHaveBeenCalledWith(err);
      expect(res.status).not.toHaveBeenCalled();
    });
  });
}); 