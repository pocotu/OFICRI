/**
 * CSRF Middleware Tests
 * Comprehensive tests for CSRF protection middleware
 */

// Mock the logger
jest.mock('../../../utils/logger', () => ({
  logSecurityEvent: jest.fn()
}));

const { logSecurityEvent } = require('../../../utils/logger');
const { csrfMiddleware, generateCsrfToken } = require('../../../middleware/security/csrf.middleware');
const express = require('express');
const request = require('supertest');
const crypto = require('crypto');

describe('CSRF Middleware', () => {
  let app;
  let mockHmac;
  let validToken;
  
  beforeAll(() => {
    jest.useFakeTimers();
  });

  afterAll(() => {
    jest.useRealTimers();
  });
  
  beforeEach(() => {
    app = express();
    jest.clearAllMocks();
    
    // Set up CSRF_SECRET for tests
    process.env.CSRF_SECRET = 'test-csrf-secret';
    
    // Mock crypto for deterministic results
    mockHmac = {
      update: jest.fn().mockReturnThis(),
      digest: jest.fn().mockReturnValue('mockedcsrftoken')
    };

    // Generate a valid token for tests
    validToken = generateCsrfToken('test-session-id');
  });

  afterEach(() => {
    // Clean up environment variables
    delete process.env.CSRF_SECRET;
    jest.restoreAllMocks();
  });

  describe('CSRF Protection', () => {
    test('should allow GET requests without CSRF token', async () => {
      app.use(csrfMiddleware);
      app.get('/test', (req, res) => res.json({ success: true }));

      const response = await request(app).get('/test');
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ success: true });
      expect(logSecurityEvent).not.toHaveBeenCalled();
    });

    test('should allow HEAD requests without CSRF token', async () => {
      app.use(csrfMiddleware);
      app.head('/test', (req, res) => res.status(200).end());

      const response = await request(app).head('/test');
      expect(response.status).toBe(200);
      expect(logSecurityEvent).not.toHaveBeenCalled();
    });

    test('should allow OPTIONS requests without CSRF token', async () => {
      app.use(csrfMiddleware);
      app.options('/test', (req, res) => res.status(200).end());

      const response = await request(app).options('/test');
      expect(response.status).toBe(200);
      expect(logSecurityEvent).not.toHaveBeenCalled();
    });

    test('should reject POST requests without CSRF token', async () => {
      app.use(csrfMiddleware);
      app.post('/test', (req, res) => res.json({ success: true }));

      const response = await request(app).post('/test');
      expect(response.status).toBe(403);
      expect(response.body).toEqual({
        success: false,
        message: 'Token CSRF no proporcionado'
      });
      expect(logSecurityEvent).toHaveBeenCalledWith('CSRF_TOKEN_MISSING', {
        ip: expect.any(String),
        method: 'POST',
        path: '/test'
      });
    });

    test('should reject PUT requests without CSRF token', async () => {
      app.use(csrfMiddleware);
      app.put('/test', (req, res) => res.json({ success: true }));

      const response = await request(app).put('/test');
      expect(response.status).toBe(403);
      expect(response.body).toEqual({
        success: false,
        message: 'Token CSRF no proporcionado'
      });
      expect(logSecurityEvent).toHaveBeenCalledWith('CSRF_TOKEN_MISSING', {
        ip: expect.any(String),
        method: 'PUT',
        path: '/test'
      });
    });

    test('should reject DELETE requests without CSRF token', async () => {
      app.use(csrfMiddleware);
      app.delete('/test', (req, res) => res.json({ success: true }));

      const response = await request(app).delete('/test');
      expect(response.status).toBe(403);
      expect(response.body).toEqual({
        success: false,
        message: 'Token CSRF no proporcionado'
      });
      expect(logSecurityEvent).toHaveBeenCalledWith('CSRF_TOKEN_MISSING', {
        ip: expect.any(String),
        method: 'DELETE',
        path: '/test'
      });
    });

    test('should reject PATCH requests without CSRF token', async () => {
      app.use(csrfMiddleware);
      app.patch('/test', (req, res) => res.json({ success: true }));

      const response = await request(app).patch('/test');
      expect(response.status).toBe(403);
      expect(response.body).toEqual({
        success: false,
        message: 'Token CSRF no proporcionado'
      });
      expect(logSecurityEvent).toHaveBeenCalledWith('CSRF_TOKEN_MISSING', {
        ip: expect.any(String),
        method: 'PATCH',
        path: '/test'
      });
    });

    test('should reject requests with invalid CSRF token', async () => {
      app.use(csrfMiddleware);
      app.post('/test', (req, res) => res.json({ success: true }));

      const response = await request(app)
        .post('/test')
        .set('x-csrf-token', 'invalid-token');

      expect(response.status).toBe(403);
      expect(response.body).toEqual({
        success: false,
        message: 'Token CSRF inválido'
      });
      expect(logSecurityEvent).toHaveBeenCalledWith('CSRF_TOKEN_INVALID', {
        ip: expect.any(String),
        method: 'POST',
        path: '/test',
        token: 'invalid-token'
      });
    });

    test('should allow requests with valid CSRF token', async () => {
      app.use(csrfMiddleware);
      app.post('/test', (req, res) => res.json({ success: true }));

      const response = await request(app)
        .post('/test')
        .set('x-csrf-token', validToken);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ success: true });
      expect(logSecurityEvent).not.toHaveBeenCalled();
    });

    test('should handle requests with empty CSRF token', async () => {
      app.use(csrfMiddleware);
      app.post('/test', (req, res) => res.json({ success: true }));

      const response = await request(app)
        .post('/test')
        .set('x-csrf-token', '');

      expect(response.status).toBe(403);
      expect(response.body).toEqual({
        success: false,
        message: 'Token CSRF no proporcionado'
      });
      expect(logSecurityEvent).toHaveBeenCalledWith('CSRF_TOKEN_MISSING', {
        ip: expect.any(String),
        method: 'POST',
        path: '/test'
      });
    });
  });

  describe('CSRF Token Generation', () => {
    test('should generate valid CSRF token', () => {
      jest.spyOn(crypto, 'createHmac').mockReturnValue(mockHmac);
      
      const token = generateCsrfToken('test-session-id');
      
      expect(crypto.createHmac).toHaveBeenCalledWith('sha256', 'test-csrf-secret');
      expect(mockHmac.update).toHaveBeenCalledWith(expect.stringContaining('test-session-id'));
      expect(mockHmac.digest).toHaveBeenCalledWith('hex');
      expect(token).toBe('mockedcsrftoken');
    });

    test('should generate unique tokens for different sessions', () => {
      const token1 = generateCsrfToken('session1');
      const token2 = generateCsrfToken('session2');
      
      expect(token1).not.toBe(token2);
    });

    test('should generate unique tokens for same session at different times', () => {
      const token1 = generateCsrfToken('session1');
      
      // Simulate time passing
      jest.advanceTimersByTime(1000);
      
      const token2 = generateCsrfToken('session1');
      
      expect(token1).not.toBe(token2);
    });

    test('should handle missing CSRF_SECRET environment variable', () => {
      delete process.env.CSRF_SECRET;
      
      expect(() => generateCsrfToken('test-session')).toThrow('CSRF_SECRET no está configurado');
    });

    test('should handle invalid session ID', () => {
      expect(() => generateCsrfToken('')).toThrow('Session ID es requerido');
      expect(() => generateCsrfToken(null)).toThrow('Session ID es requerido');
      expect(() => generateCsrfToken(undefined)).toThrow('Session ID es requerido');
    });
  });
}); 