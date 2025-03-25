/**
 * Tests para middleware de validación de entrada
 * Prueba la validación y sanitización de datos de entrada
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
  commonSchemas,
  validateInput,
  sanitizeInput,
  validateFileType
} = require('../../middleware/input-validation');

// Importar Joi para crear esquemas de prueba
const Joi = require('joi');

describe('Input Validation Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    // Reiniciar mocks
    jest.clearAllMocks();

    // Configurar objetos mock para request, response y next
    req = {
      body: {},
      query: {},
      params: {},
      path: '/test',
      method: 'POST',
      ip: '127.0.0.1'
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    next = jest.fn();
  });

  describe('validateInput', () => {
    it('debe llamar a next() cuando la validación pasa', () => {
      // Crear un esquema simple
      const schema = Joi.object({
        name: Joi.string().required(),
        email: Joi.string().email().required()
      });

      // Configurar datos válidos
      req.body = {
        name: 'Test User',
        email: 'test@example.com'
      };

      // Ejecutar el middleware
      const middleware = validateInput(schema);
      middleware(req, res, next);

      // Verificar que next fue llamado
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('debe devolver 400 con errores cuando la validación falla', () => {
      // Crear un esquema simple
      const schema = Joi.object({
        name: Joi.string().required(),
        email: Joi.string().email().required()
      });

      // Configurar datos inválidos
      req.body = {
        name: '',
        email: 'invalid-email'
      };

      // Ejecutar el middleware
      const middleware = validateInput(schema);
      middleware(req, res, next);

      // Verificar que se devuelve error 400
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Error de validación',
          errors: expect.any(Array)
        })
      );
      expect(logger.warn).toHaveBeenCalled();
    });

    it('debe validar propiedades diferentes de body (query, params)', () => {
      // Crear un esquema para query params
      const schema = Joi.object({
        page: Joi.number().min(1).required(),
        limit: Joi.number().min(1).max(100).required()
      });

      // Configurar query params válidos
      req.query = {
        page: 1,
        limit: 10
      };

      // Ejecutar el middleware con property='query'
      const middleware = validateInput(schema, 'query');
      middleware(req, res, next);

      // Verificar que next fue llamado
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('debe manejar errores durante la validación', () => {
      // Crear un caso donde la validación genere error
      const schema = null; // Esto causará un error

      // Ejecutar el middleware
      const middleware = validateInput(schema);
      middleware(req, res, next);

      // Verificar que se maneja el error
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Error interno del servidor'
        })
      );
      expect(logger.error).toHaveBeenCalled();
    });

    it('debe validar correctamente con los esquemas comunes', () => {
      // Usar uno de los esquemas comunes
      const schema = commonSchemas.pagination;

      // Configurar datos válidos
      req.query = {
        page: 2,
        limit: 20,
        sortBy: 'name',
        sortOrder: 'desc'
      };

      // Ejecutar middleware
      const middleware = validateInput(schema, 'query');
      middleware(req, res, next);

      // Verificar que next fue llamado
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  describe('sanitizeInput', () => {
    it('debe limpiar (trim) los strings en body, query y params', () => {
      // Configurar datos con espacios
      req.body = {
        name: '  Test Name  ',
        description: '\t Trimmed description\n'
      };

      req.query = {
        search: '  search term  ',
        nonString: 123
      };

      req.params = {
        id: '  123  '
      };

      // Ejecutar middleware
      sanitizeInput(req, res, next);

      // Verificar que los strings fueron limpiados
      expect(req.body.name).toBe('Test Name');
      expect(req.body.description).toBe('Trimmed description');
      expect(req.query.search).toBe('search term');
      expect(req.query.nonString).toBe(123);
      expect(req.params.id).toBe('123');
      expect(next).toHaveBeenCalled();
    });

    it('debe manejar objetos vacíos o nulos', () => {
      // Configurar request con objetos vacíos o nulos
      req.body = null;
      req.query = {};
      req.params = {};

      // Ejecutar middleware
      sanitizeInput(req, res, next);

      // Verificar que no hubo errores
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('debe manejar errores durante sanitización', () => {
      // Causar un error de acceso a propiedad
      Object.defineProperty(req, 'body', {
        get: function() { throw new Error('Error simulado'); }
      });

      // Ejecutar middleware
      sanitizeInput(req, res, next);

      // Verificar que se manejó el error
      expect(next).toHaveBeenCalled();
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('validateFileType', () => {
    it('debe permitir tipos de archivo válidos', () => {
      // Configurar archivo con tipo válido
      req.file = {
        mimetype: 'application/pdf',
        originalname: 'document.pdf'
      };

      // Configurar tipos permitidos
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];

      // Ejecutar middleware
      const middleware = validateFileType(allowedTypes);
      middleware(req, res, next);

      // Verificar que next fue llamado
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('debe rechazar tipos de archivo no permitidos', () => {
      // Configurar archivo con tipo no permitido
      req.file = {
        mimetype: 'application/msword',
        originalname: 'document.doc'
      };

      // Configurar tipos permitidos
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];

      // Ejecutar middleware
      const middleware = validateFileType(allowedTypes);
      middleware(req, res, next);

      // Verificar que se rechaza el archivo
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Tipo de archivo no permitido'
        })
      );
      expect(logger.warn).toHaveBeenCalled();
    });

    it('debe pasar si no hay archivo', () => {
      // No configurar archivo
      req.file = null;

      // Configurar tipos permitidos
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];

      // Ejecutar middleware
      const middleware = validateFileType(allowedTypes);
      middleware(req, res, next);

      // Verificar que next fue llamado
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('debe manejar errores durante la validación', () => {
      // Causar un error de acceso a propiedad
      Object.defineProperty(req, 'file', {
        get: function() { throw new Error('Error simulado'); }
      });

      // Configurar tipos permitidos
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];

      // Ejecutar middleware
      const middleware = validateFileType(allowedTypes);
      middleware(req, res, next);

      // Verificar que se manejó el error
      expect(next).toHaveBeenCalled();
      expect(logger.error).toHaveBeenCalled();
    });
  });
}); 