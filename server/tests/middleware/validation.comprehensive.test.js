/**
 * Comprehensive Validation Tests
 * Tests for all validation middleware components
 */

const { validate, validateSchema } = require('../../middleware/validation');
const { 
  loginSchema, 
  resetRequestSchema, 
  resetPasswordSchema, 
  cambioPasswordSchema 
} = require('../../middleware/validation/auth.validator');
const {
  permisoContextualSchema,
  permisoEspecialSchema,
  verificarPermisoSchema
} = require('../../middleware/validation/permiso.validator');

// Importar los validadores de documento
const {
  createDocumentValidator,
  updateDocumentValidator,
  updateStatusValidator,
  deriveDocumentValidator
} = require('../../middleware/validation/document.validator');

const Joi = require('joi');
const { validationResult } = require('express-validator');

describe('Validation Middleware - Comprehensive Tests', () => {
  let mockRequest;
  let mockResponse;
  let nextFunction;
  
  beforeEach(() => {
    mockRequest = {
      body: {}
    };
    
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    
    nextFunction = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });
  
  describe('Base validation middleware', () => {
    it('validateSchema() should call next() when Joi validation passes', () => {
      const schema = Joi.object({
        name: Joi.string().required()
      });

      mockRequest.body = { name: 'Test' };
      
      const middleware = validateSchema(schema);
      middleware(mockRequest, mockResponse, nextFunction);
      
      expect(nextFunction).toHaveBeenCalled();
    });
    
    it('validateSchema() should return 400 when Joi validation fails', () => {
      const schema = Joi.object({
        name: Joi.string().required()
      });

      mockRequest.body = { name: '' };
      
      const middleware = validateSchema(schema);
      middleware(mockRequest, mockResponse, nextFunction);
      
      expect(nextFunction).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        errors: expect.any(Array)
      }));
    });
    
    it('validateSchema() should sanitize request body by removing unknown fields', () => {
      const schema = Joi.object({
        name: Joi.string().required()
      });

      mockRequest.body = { 
        name: 'Test',
        unknownField: 'This should be removed'
      };
      
      const middleware = validateSchema(schema);
      middleware(mockRequest, mockResponse, nextFunction);
      
      expect(nextFunction).toHaveBeenCalled();
      expect(mockRequest.body).toEqual({ name: 'Test' });
      expect(mockRequest.body.unknownField).toBeUndefined();
    });
  });

  describe('Auth validators', () => {
    it('loginSchema should validate properly', () => {
      // Valid case
      const validData = { codigoCIP: '12345678', password: 'password123' };
      const validResult = loginSchema.validate(validData);
      expect(validResult.error).toBeUndefined();
      
      // Invalid case - empty CIP
      const invalidCIP = { codigoCIP: '', password: 'password123' };
      const invalidCIPResult = loginSchema.validate(invalidCIP);
      expect(invalidCIPResult.error).not.toBeUndefined();
      
      // Invalid case - short password
      const invalidPassword = { codigoCIP: '12345678', password: 'pass' };
      const invalidPasswordResult = loginSchema.validate(invalidPassword);
      expect(invalidPasswordResult.error).not.toBeUndefined();
    });
    
    it('resetRequestSchema should validate properly', () => {
      // Valid case
      const validData = { codigoCIP: '12345678' };
      const validResult = resetRequestSchema.validate(validData);
      expect(validResult.error).toBeUndefined();
      
      // Invalid case
      const invalidData = { codigoCIP: '' };
      const invalidResult = resetRequestSchema.validate(invalidData);
      expect(invalidResult.error).not.toBeUndefined();
    });
    
    it('resetPasswordSchema should validate properly', () => {
      // Valid case
      const validData = { token: 'validtoken', password: 'password123', idUsuario: 1 };
      const validResult = resetPasswordSchema.validate(validData);
      expect(validResult.error).toBeUndefined();
      
      // Invalid case - missing token
      const invalidToken = { password: 'password123', idUsuario: 1 };
      const invalidTokenResult = resetPasswordSchema.validate(invalidToken);
      expect(invalidTokenResult.error).not.toBeUndefined();
      
      // Invalid case - invalid idUsuario
      const invalidIdUsuario = { token: 'validtoken', password: 'password123', idUsuario: -1 };
      const invalidIdUsuarioResult = resetPasswordSchema.validate(invalidIdUsuario);
      expect(invalidIdUsuarioResult.error).not.toBeUndefined();
    });
    
    it('cambioPasswordSchema should validate properly', () => {
      // Valid case
      const validData = { idUsuario: 1, newPassword: 'password123' };
      const validResult = cambioPasswordSchema.validate(validData);
      expect(validResult.error).toBeUndefined();
      
      // Invalid case - missing newPassword
      const invalidPassword = { idUsuario: 1 };
      const invalidPasswordResult = cambioPasswordSchema.validate(invalidPassword);
      expect(invalidPasswordResult.error).not.toBeUndefined();
      
      // Invalid case - invalid idUsuario
      const invalidIdUsuario = { idUsuario: 'abc', newPassword: 'password123' };
      const invalidIdUsuarioResult = cambioPasswordSchema.validate(invalidIdUsuario);
      expect(invalidIdUsuarioResult.error).not.toBeUndefined();
    });
  });

  describe('Document validators', () => {
    // Verificamos la estructura de los validadores de documento
    it('createDocumentValidator array should have the correct structure', () => {
      expect(Array.isArray(createDocumentValidator)).toBe(true);
      expect(createDocumentValidator.length).toBeGreaterThan(0);
    });
    
    it('updateDocumentValidator array should have the correct structure', () => {
      expect(Array.isArray(updateDocumentValidator)).toBe(true);
      expect(updateDocumentValidator.length).toBeGreaterThan(0);
    });
    
    it('updateStatusValidator array should have the correct structure', () => {
      expect(Array.isArray(updateStatusValidator)).toBe(true);
      expect(updateStatusValidator.length).toBeGreaterThan(0);
    });
    
    it('deriveDocumentValidator array should have the correct structure', () => {
      expect(Array.isArray(deriveDocumentValidator)).toBe(true);
      expect(deriveDocumentValidator.length).toBeGreaterThan(0);
    });
  });

  describe('Permiso validators', () => {
    it('permisoContextualSchema should validate properly', () => {
      // Valid case
      const validData = {
        nombre: 'Permiso Test',
        descripcion: 'Descripción del permiso',
        condicion: 'PROPIETARIO',
        tipo: 'DOCUMENTO',
        permisos: 15,
        activo: true
      };
      const validResult = permisoContextualSchema.validate(validData);
      expect(validResult.error).toBeUndefined();
      
      // Invalid case - invalid condicion
      const invalidCondicion = {
        ...validData,
        condicion: 'INVALID_CONDITION'
      };
      const invalidCondicionResult = permisoContextualSchema.validate(invalidCondicion);
      expect(invalidCondicionResult.error).not.toBeUndefined();
      
      // Invalid case - invalid tipo
      const invalidTipo = {
        ...validData,
        tipo: 'INVALID_TYPE'
      };
      const invalidTipoResult = permisoContextualSchema.validate(invalidTipo);
      expect(invalidTipoResult.error).not.toBeUndefined();
      
      // Invalid case - out of range permisos
      const invalidPermisos = {
        ...validData,
        permisos: 300
      };
      const invalidPermisosResult = permisoContextualSchema.validate(invalidPermisos);
      expect(invalidPermisosResult.error).not.toBeUndefined();
    });
    
    it('permisoEspecialSchema should validate properly', () => {
      // Valid case
      const validData = {
        idUsuario: 1,
        idRecurso: 2,
        tipoRecurso: 'DOCUMENTO',
        permisos: 15,
        fechaExpiracion: '2023-12-31'
      };
      const validResult = permisoEspecialSchema.validate(validData);
      expect(validResult.error).toBeUndefined();
      
      // Valid case with null expiration
      const validNullExpiration = {
        ...validData,
        fechaExpiracion: null
      };
      const validNullResult = permisoEspecialSchema.validate(validNullExpiration);
      expect(validNullResult.error).toBeUndefined();
      
      // Invalid case - invalid idUsuario
      const invalidIdUsuario = {
        ...validData,
        idUsuario: -1
      };
      const invalidIdUsuarioResult = permisoEspecialSchema.validate(invalidIdUsuario);
      expect(invalidIdUsuarioResult.error).not.toBeUndefined();
      
      // Invalid case - invalid tipoRecurso
      const invalidTipoRecurso = {
        ...validData,
        tipoRecurso: 'INVALID'
      };
      const invalidTipoRecursoResult = permisoEspecialSchema.validate(invalidTipoRecurso);
      expect(invalidTipoRecursoResult.error).not.toBeUndefined();
      
      // Invalid case - invalid date format
      const invalidDate = {
        ...validData,
        fechaExpiracion: 'invalid-date'
      };
      const invalidDateResult = permisoEspecialSchema.validate(invalidDate);
      expect(invalidDateResult.error).not.toBeUndefined();
    });
    
    it('verificarPermisoSchema should validate properly', () => {
      // Valid case
      const validData = {
        idUsuario: 1,
        idRecurso: 2,
        tipoRecurso: 'DOCUMENTO',
        permisoBit: 3
      };
      const validResult = verificarPermisoSchema.validate(validData);
      expect(validResult.error).toBeUndefined();
      
      // Valid case with minimum required fields
      const validMinimum = {
        idUsuario: 1
      };
      const validMinimumResult = verificarPermisoSchema.validate(validMinimum);
      expect(validMinimumResult.error).toBeUndefined();
      
      // Invalid case - invalid idUsuario
      const invalidIdUsuario = {
        ...validData,
        idUsuario: 'not-a-number'
      };
      const invalidIdUsuarioResult = verificarPermisoSchema.validate(invalidIdUsuario);
      expect(invalidIdUsuarioResult.error).not.toBeUndefined();
      
      // Invalid case - invalid tipoRecurso
      const invalidTipoRecurso = {
        ...validData,
        tipoRecurso: 'INVALID'
      };
      const invalidTipoRecursoResult = verificarPermisoSchema.validate(invalidTipoRecurso);
      expect(invalidTipoRecursoResult.error).not.toBeUndefined();
      
      // Invalid case - permisoBit out of range
      const invalidPermisoBit = {
        ...validData,
        permisoBit: 10
      };
      const invalidPermisoBitResult = verificarPermisoSchema.validate(invalidPermisoBit);
      expect(invalidPermisoBitResult.error).not.toBeUndefined();
    });
  });
  
  // Prueba adicional para lograr mayor cobertura del archivo index.js
  describe('Middleware de validación', () => {
    it('validateSchema debe manejar múltiples errores de validación', () => {
      const schema = Joi.object({
        name: Joi.string().min(3).required(),
        age: Joi.number().min(18).required()
      });

      mockRequest.body = { name: 'A', age: 10 };
      
      const middleware = validateSchema(schema);
      middleware(mockRequest, mockResponse, nextFunction);
      
      expect(nextFunction).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      
      const jsonResponse = mockResponse.json.mock.calls[0][0];
      expect(jsonResponse.errors.length).toBeGreaterThan(1);
    });
  });
}); 