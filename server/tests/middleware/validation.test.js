/**
 * Validation Middleware Tests
 * Tests for the validation middleware functions
 */

const { validate, validateSchema } = require('../../middleware/validation');
const { body } = require('express-validator');
const Joi = require('joi');

describe('Validation Middleware', () => {
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
  
  describe('validate (Express Validator)', () => {
    it('should call next() when validation passes', async () => {
      // Setup valid request body
      mockRequest.body = { name: 'Test User', email: 'test@example.com' };
      
      // Create validation rules
      const validationRules = [
        body('name').notEmpty().withMessage('Name is required'),
        body('email').isEmail().withMessage('Invalid email format')
      ];
      
      // Execute middleware
      const middleware = validate(validationRules);
      await middleware(mockRequest, mockResponse, nextFunction);
      
      // Expect next to be called
      expect(nextFunction).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });
    
    it('should return 400 with error messages when validation fails', async () => {
      // Setup invalid request body
      mockRequest.body = { name: '', email: 'invalid-email' };
      
      // Create validation rules
      const validationRules = [
        body('name').notEmpty().withMessage('Name is required'),
        body('email').isEmail().withMessage('Invalid email format')
      ];
      
      // Execute middleware
      const middleware = validate(validationRules);
      await middleware(mockRequest, mockResponse, nextFunction);
      
      // Expect response with validation errors
      expect(nextFunction).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Error de validación de datos',
          errors: expect.any(Array)
        })
      );
      
      // Check that the errors array contains our expected errors
      const responseBody = mockResponse.json.mock.calls[0][0];
      expect(responseBody.errors.length).toBeGreaterThan(0);
      expect(responseBody.errors.some(e => e.path === 'name')).toBeTruthy();
      expect(responseBody.errors.some(e => e.path === 'email')).toBeTruthy();
    });
  });
  
  describe('validateSchema (Joi)', () => {
    it('should call next() when validation passes', () => {
      // Setup valid request body
      mockRequest.body = { name: 'Test User', age: 25 };
      
      // Create Joi schema
      const schema = Joi.object({
        name: Joi.string().required(),
        age: Joi.number().min(18).required()
      });
      
      // Execute middleware
      const middleware = validateSchema(schema);
      middleware(mockRequest, mockResponse, nextFunction);
      
      // Expect next to be called
      expect(nextFunction).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });
    
    it('should return 400 with error messages when validation fails', () => {
      // Setup invalid request body
      mockRequest.body = { name: '', age: 15 };
      
      // Create Joi schema
      const schema = Joi.object({
        name: Joi.string().required(),
        age: Joi.number().min(18).required()
      });
      
      // Execute middleware
      const middleware = validateSchema(schema);
      middleware(mockRequest, mockResponse, nextFunction);
      
      // Expect response with validation errors
      expect(nextFunction).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Error de validación de datos',
          errors: expect.any(Array)
        })
      );
      
      // Check that the errors list contains our expected errors
      const responseBody = mockResponse.json.mock.calls[0][0];
      expect(responseBody.errors.length).toBeGreaterThan(0);
    });
    
    it('should sanitize data by removing unknown fields', () => {
      // Setup request with extra unknown field
      mockRequest.body = { 
        name: 'Test User', 
        age: 25,
        extraField: 'This should be removed'
      };
      
      // Create Joi schema that doesn't include extraField
      const schema = Joi.object({
        name: Joi.string().required(),
        age: Joi.number().min(18).required()
      });
      
      // Execute middleware
      const middleware = validateSchema(schema);
      middleware(mockRequest, mockResponse, nextFunction);
      
      // Expect next to be called
      expect(nextFunction).toHaveBeenCalled();
      
      // Check that the extraField was removed
      expect(mockRequest.body).toEqual({
        name: 'Test User',
        age: 25
      });
      expect(mockRequest.body.extraField).toBeUndefined();
    });
  });
}); 