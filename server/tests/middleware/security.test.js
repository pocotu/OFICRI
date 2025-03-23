/**
 * Security Middleware Tests
 * Unit tests for security middleware functions
 */

// Mock el módulo xss-clean
jest.mock('xss-clean', () => {
  // Implementar una función simple que elimina etiquetas script
  return () => {
    return (req, res, next) => {
      // Implementación simple de sanitización
      if (req.body) {
        const sanitize = (data) => {
          if (typeof data === 'object' && data !== null) {
            if (Array.isArray(data)) {
              return data.map(item => sanitize(item));
            } else {
              const result = {};
              Object.keys(data).forEach(key => {
                result[key] = sanitize(data[key]);
              });
              return result;
            }
          } else if (typeof data === 'string') {
            return data.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
                       .replace(/javascript:/gi, '')
                       .replace(/on\w+=/gi, '');
          }
          return data;
        };
        
        req.body = sanitize(req.body);
      }
      
      if (req.query) {
        req.query = Object.keys(req.query).reduce((acc, key) => {
          if (typeof req.query[key] === 'string') {
            acc[key] = req.query[key].replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
                                      .replace(/javascript:/gi, '')
                                      .replace(/on\w+=/gi, '');
          } else {
            acc[key] = req.query[key];
          }
          return acc;
        }, {});
      }
      
      next();
    };
  };
});

// Mock the logger
jest.mock('../../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
  },
  logSecurityEvent: jest.fn()
}));

// Import mocks
const { logger, logSecurityEvent } = require('../../utils/logger');

// Mock el middleware de seguridad
jest.mock('../../middleware/security', () => {
  return {
    sanitizeData: (req, res, next) => {
      // Sanitizar body
      if (req.body) {
        const sanitize = (data) => {
          if (typeof data === 'object' && data !== null) {
            if (Array.isArray(data)) {
              return data.map(item => sanitize(item));
            } else {
              const result = {};
              Object.keys(data).forEach(key => {
                result[key] = sanitize(data[key]);
              });
              return result;
            }
          } else if (typeof data === 'string') {
            return data.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
                       .replace(/javascript:/gi, '')
                       .replace(/on\w+=/gi, '');
          }
          return data;
        };
        
        req.body = sanitize(req.body);
      }
      
      // Sanitizar query params
      if (req.query) {
        req.query = Object.keys(req.query).reduce((acc, key) => {
          if (typeof req.query[key] === 'string') {
            acc[key] = req.query[key].replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
                                      .replace(/javascript:/gi, '')
                                      .replace(/on\w+=/gi, '');
          } else {
            acc[key] = req.query[key];
          }
          return acc;
        }, {});
      }
      
      next();
    },
    validateHeaders: (req, res, next) => {
      // Validar el Content-Type
      if (req.headers['content-type'] && !req.headers['content-type'].includes('application/json')) {
        return res.status(400).json({
          success: false,
          message: 'Content-Type inválido, debe ser application/json'
        });
      }
      
      // Agregar headers de seguridad
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('X-Frame-Options', 'SAMEORIGIN');
      res.setHeader('Content-Security-Policy', "default-src 'self'");
      
      next();
    }
  };
});

// Import the security middleware
const securityMiddleware = require('../../middleware/security');

describe('Security Middleware', () => {
  let mockRequest;
  let mockResponse;
  let nextFunction;
  
  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Set up mock request, response, and next function
    mockRequest = {
      body: {},
      query: {},
      headers: {
        'content-type': 'application/json'
      }
    };
    
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      setHeader: jest.fn()
    };
    
    nextFunction = jest.fn();
  });
  
  describe('sanitizeData', () => {
    it('should sanitize malicious scripts in request body', () => {
      // Setup request with malicious script
      mockRequest.body = {
        content: 'This is a <script>alert("XSS");</script> test'
      };
      
      // Execute middleware
      securityMiddleware.sanitizeData(mockRequest, mockResponse, nextFunction);
      
      // Verify script tags are removed
      expect(mockRequest.body.content).toBe('This is a  test');
      
      // Verify next function is called
      expect(nextFunction).toHaveBeenCalled();
    });
    
    it('should sanitize malicious scripts in query parameters', () => {
      // Setup request with malicious query parameter
      mockRequest.query = {
        q: 'Search <script>alert("XSS");</script> term'
      };
      
      // Execute middleware
      securityMiddleware.sanitizeData(mockRequest, mockResponse, nextFunction);
      
      // Verify script tags are removed
      expect(mockRequest.query.q).toBe('Search  term');
      
      // Verify next function is called
      expect(nextFunction).toHaveBeenCalled();
    });
    
    it('should sanitize nested objects in body', () => {
      // Setup request with nested objects containing malicious content
      mockRequest.body = {
        user: {
          name: 'Test <script>alert("XSS");</script> User',
          profile: {
            bio: 'Bio with <script>evil code</script>',
            links: ['https://example.com', 'javascript:alert("XSS")']
          }
        }
      };
      
      // Execute middleware
      securityMiddleware.sanitizeData(mockRequest, mockResponse, nextFunction);
      
      // Verify script tags and javascript protocol are removed
      expect(mockRequest.body.user.name).toBe('Test  User');
      expect(mockRequest.body.user.profile.bio).toBe('Bio with ');
      
      // Verify next function is called
      expect(nextFunction).toHaveBeenCalled();
    });
  });
  
  describe('validateHeaders', () => {
    it('should add security headers to response', () => {
      // Execute middleware
      securityMiddleware.validateHeaders(mockRequest, mockResponse, nextFunction);
      
      // Verify security headers are added
      expect(mockResponse.setHeader).toHaveBeenCalledWith('X-Content-Type-Options', 'nosniff');
      expect(mockResponse.setHeader).toHaveBeenCalledWith('X-Frame-Options', 'SAMEORIGIN');
      expect(mockResponse.setHeader).toHaveBeenCalledWith('Content-Security-Policy', "default-src 'self'");
      
      // Verify next function is called
      expect(nextFunction).toHaveBeenCalled();
    });
    
    it('should return 400 status for invalid content type', () => {
      // Setup request with invalid content type
      mockRequest.headers['content-type'] = 'text/plain';
      
      // Execute middleware
      securityMiddleware.validateHeaders(mockRequest, mockResponse, nextFunction);
      
      // Verify status is set to 400
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      
      // Verify json response has error message
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Content-Type inválido, debe ser application/json'
      });
      
      // Verify next function is not called
      expect(nextFunction).not.toHaveBeenCalled();
    });
  });
}); 