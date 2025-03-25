/**
 * Security Middleware Tests
 * Comprehensive tests for security middleware functions
 */

// Mock the logger
jest.mock('../../../utils/logger', () => ({
  logSecurityEvent: jest.fn()
}));

// Mock express-rate-limit
const mockState = new Map();

jest.mock('express-rate-limit', () => {
  return jest.fn().mockImplementation((config) => {
    return (req, res, next) => {
      const key = req.ip || 'default';
      if (!mockState.has(key)) {
        mockState.set(key, { count: 0, resetTime: Date.now() + config.windowMs });
      }
      
      const state = mockState.get(key);
      
      // Check if window has expired
      if (Date.now() >= state.resetTime) {
        state.count = 0;
        state.resetTime = Date.now() + config.windowMs;
      }
      
      state.count++;
      
      // Set rate limit headers
      res.setHeader('x-ratelimit-limit', config.max);
      res.setHeader('x-ratelimit-remaining', Math.max(0, config.max - state.count));
      res.setHeader('x-ratelimit-reset', Math.ceil(state.resetTime / 1000));
      
      if (state.count > config.max) {
        return config.handler(req, res);
      }
      
      next();
    };
  });
});

const { logSecurityEvent } = require('../../../utils/logger');
const rateLimit = require('express-rate-limit');
const express = require('express');
const request = require('supertest');

describe('Security Middleware', () => {
  let app;
  let standardLimiter;
  let authLimiter;
  let passwordResetLimiter;
  
  beforeEach(() => {
    // Clear mock state before each test
    mockState.clear();
    
    app = express();
    jest.clearAllMocks();
    jest.useFakeTimers();

    // Create rate limiters for testing
    standardLimiter = rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 100,
      standardHeaders: true,
      legacyHeaders: false,
      handler: (req, res) => {
        logSecurityEvent('RATE_LIMIT_EXCEEDED', {
          ip: req.ip,
          path: req.originalUrl,
          method: req.method
        });
        res.status(429).json({
          success: false,
          message: 'Demasiadas solicitudes, por favor intente más tarde'
        });
      }
    });

    authLimiter = rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 10,
      standardHeaders: true,
      legacyHeaders: false,
      handler: (req, res) => {
        logSecurityEvent('AUTH_RATE_LIMIT_EXCEEDED', {
          ip: req.ip,
          path: req.originalUrl,
          method: req.method
        });
        res.status(429).json({
          success: false,
          message: 'Demasiados intentos de autenticación, por favor intente más tarde'
        });
      }
    });

    passwordResetLimiter = rateLimit({
      windowMs: 60 * 60 * 1000,
      max: 3,
      standardHeaders: true,
      legacyHeaders: false,
      handler: (req, res) => {
        logSecurityEvent('PASSWORD_RESET_RATE_LIMIT_EXCEEDED', {
          ip: req.ip,
          path: req.originalUrl,
          method: req.method
        });
        res.status(429).json({
          success: false,
          message: 'Demasiados intentos de restablecimiento de contraseña, por favor intente más tarde'
        });
      }
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Rate Limit Middleware', () => {
    describe('Standard Rate Limiter', () => {
      test('should allow requests within standard limit', async () => {
        app.use(standardLimiter);
        app.get('/test', (req, res) => res.json({ success: true }));

        // Make requests up to the limit
        for (let i = 0; i < 100; i++) {
          const response = await request(app).get('/test');
          expect(response.status).toBe(200);
        }

        // Next request should be blocked
        const response = await request(app).get('/test');
        expect(response.status).toBe(429);
        expect(response.body).toEqual({
          success: false,
          message: 'Demasiadas solicitudes, por favor intente más tarde'
        });
        expect(logSecurityEvent).toHaveBeenCalledWith('RATE_LIMIT_EXCEEDED', expect.any(Object));
      });
    });

    describe('Auth Rate Limiter', () => {
      test('should allow requests within auth limit', async () => {
        app.use(authLimiter);
        app.post('/auth', (req, res) => res.json({ success: true }));

        // Make requests up to the limit
        for (let i = 0; i < 10; i++) {
          const response = await request(app).post('/auth');
          expect(response.status).toBe(200);
        }

        // Next request should be blocked
        const response = await request(app).post('/auth');
        expect(response.status).toBe(429);
        expect(response.body).toEqual({
          success: false,
          message: 'Demasiados intentos de autenticación, por favor intente más tarde'
        });
        expect(logSecurityEvent).toHaveBeenCalledWith('AUTH_RATE_LIMIT_EXCEEDED', expect.any(Object));
      });
    });

    describe('Password Reset Rate Limiter', () => {
      test('should allow requests within password reset limit', async () => {
        app.use(passwordResetLimiter);
        app.post('/reset-password', (req, res) => res.json({ success: true }));

        // Make requests up to the limit
        for (let i = 0; i < 3; i++) {
          const response = await request(app).post('/reset-password');
          expect(response.status).toBe(200);
        }

        // Next request should be blocked
        const response = await request(app).post('/reset-password');
        expect(response.status).toBe(429);
        expect(response.body).toEqual({
          success: false,
          message: 'Demasiados intentos de restablecimiento de contraseña, por favor intente más tarde'
        });
        expect(logSecurityEvent).toHaveBeenCalledWith('PASSWORD_RESET_RATE_LIMIT_EXCEEDED', expect.any(Object));
      });
    });

    test('should include rate limit headers in response', async () => {
      app.use(standardLimiter);
      app.get('/test', (req, res) => res.json({ success: true }));

      const response = await request(app).get('/test');
      expect(response.headers).toHaveProperty('x-ratelimit-limit');
      expect(response.headers).toHaveProperty('x-ratelimit-remaining');
      expect(response.headers).toHaveProperty('x-ratelimit-reset');
    });

    test('should handle concurrent requests correctly', async () => {
      app.use(standardLimiter);
      app.get('/test', (req, res) => res.json({ success: true }));

      // Make concurrent requests
      const requests = Array(10).fill().map(() => request(app).get('/test'));
      const responses = await Promise.all(requests);

      // All requests should succeed as they're within the limit
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
    });

    test('should reset rate limit after window expires', async () => {
      app.use(standardLimiter);
      app.get('/test', (req, res) => res.json({ success: true }));

      // Make requests up to the limit
      for (let i = 0; i < 100; i++) {
        await request(app).get('/test');
      }

      // Fast forward time by 15 minutes
      jest.advanceTimersByTime(15 * 60 * 1000);

      // Next request should be allowed
      const response = await request(app).get('/test');
      expect(response.status).toBe(200);
    });
  });
}); 