/**
 * Rate Limiting Middleware Tests
 * Unit tests for rate limiting middleware functions
 */

// Mock the logger
jest.mock('../../../utils/logger', () => ({
  logger: {
    warn: jest.fn(),
    error: jest.fn()
  }
}));

// Mock express-rate-limit
const mockRateLimitMiddleware = jest.fn();
jest.mock('express-rate-limit', () => {
  return jest.fn().mockImplementation((config) => {
    mockRateLimitMiddleware(config);
    return (req, res, next) => {
      // Simulate rate limiting based on mock state
      const mockState = req._mockRateLimit || { count: 0 };
      mockState.count++;
      
      if (mockState.count > config.max) {
        config.handler(req, res);
        return res.status(429).json(config.message);
      } else {
        return next();
      }
    };
  });
});

// Import modules after mocking
const { logger } = require('../../../utils/logger');

describe('Rate Limiting Middleware', () => {
  let mockNext;
  let mockRes;
  let mockReq;

  beforeEach(() => {
    jest.clearAllMocks();
    mockNext = jest.fn();
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    mockReq = {
      ip: '127.0.0.1',
      path: '/test',
      method: 'GET',
      _mockRateLimit: { count: 0 }
    };
  });
  
  describe('Rate Limit Configuration', () => {
    test('should configure standard limiter with correct window and max', () => {
      jest.isolateModules(() => {
        require('../../../middleware/security');
        
        expect(mockRateLimitMiddleware).toHaveBeenCalledWith(expect.objectContaining({
          windowMs: 15 * 60 * 1000,
          max: 100,
          standardHeaders: true,
          legacyHeaders: false
        }));
      });
    });
    
    test('should configure auth limiter with correct window and max', () => {
      jest.isolateModules(() => {
        require('../../../middleware/security');
        
        // Find the call that matches the auth limiter configuration
        const authLimiterCall = mockRateLimitMiddleware.mock.calls.find(call => 
          call[0].max === 5 && call[0].windowMs === 60 * 60 * 1000
        );
        
        expect(authLimiterCall).toBeDefined();
        expect(authLimiterCall[0]).toEqual(expect.objectContaining({
          windowMs: 60 * 60 * 1000,
          max: 5,
          standardHeaders: true,
          legacyHeaders: false,
          message: {
            success: false,
            message: 'Demasiados intentos de autenticación, por favor intente más tarde'
          }
        }));
      });
    });
  });
  
  describe('Standard Rate Limiter', () => {
    test('should allow requests within limit', () => {
      const { rateLimiter } = require('../../../middleware/security');
      rateLimiter(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalled();
    });
    
    test('should block requests exceeding limit', () => {
      const { rateLimiter } = require('../../../middleware/security');
      // Exhaust the limit
      mockReq._mockRateLimit.count = 100;
      
      // Next request should be blocked
      rateLimiter(mockReq, mockRes, mockNext);
      expect(mockRes.status).toHaveBeenCalledWith(429);
      expect(logger.warn).toHaveBeenCalledWith('Rate limit excedido:', expect.any(Object));
    });
  });
  
  describe('Auth Rate Limiter', () => {
    test('should allow auth requests within limit', () => {
      const { authRateLimiter } = require('../../../middleware/security');
      authRateLimiter(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalled();
    });
    
    test('should block auth requests exceeding limit', () => {
      const { authRateLimiter } = require('../../../middleware/security');
      // Exhaust the limit
      mockReq._mockRateLimit.count = 5;
      
      // Next request should be blocked
      authRateLimiter(mockReq, mockRes, mockNext);
      expect(mockRes.status).toHaveBeenCalledWith(429);
      expect(logger.warn).toHaveBeenCalledWith('Rate limit de autenticación excedido:', expect.any(Object));
    });
  });
}); 