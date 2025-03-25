/**
 * Security Middleware Index Module Tests
 * Tests para el módulo principal de seguridad
 */

// Mock the logger
jest.mock('../../../utils/logger', () => ({
  logSecurityEvent: jest.fn()
}));

// Configuramos los handlers que se van a capturar
let mockHandlers = {};

// Mock express-rate-limit antes de importar el módulo de seguridad
jest.mock('express-rate-limit', () => {
  return function mockRateLimit(config) {
    // Guardamos el handler según su configuración
    if (config && config.windowMs) {
      if (config.max === 100) {
        mockHandlers.standard = config.handler;
      } else if (config.max === 10) {
        mockHandlers.auth = config.handler;
      } else if (config.max === 3) {
        mockHandlers.passwordReset = config.handler;
      }
    }
    
    // Retornamos una función middleware simulada
    return function middleware(req, res, next) {
      if (next) next();
    };
  };
});

// Importamos las dependencias después de configurar los mocks
const { logSecurityEvent } = require('../../../utils/logger');

// Ahora importamos el módulo que vamos a probar
// Importante: Este require ejecutará el código del módulo, creando los rate limiters
const securityModule = require('../../../middleware/security/index');

describe('Security Middleware Index Module', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should export rateLimitMiddleware with all required limiters', () => {
    // Verificar que el módulo exporte correctamente la estructura esperada
    expect(securityModule).toBeDefined();
    expect(securityModule.rateLimitMiddleware).toBeDefined();
    expect(securityModule.rateLimitMiddleware.standard).toBeDefined();
    expect(securityModule.rateLimitMiddleware.auth).toBeDefined();
    expect(securityModule.rateLimitMiddleware.passwordReset).toBeDefined();
  });

  test('should configure rate limit middleware with correct parameters', () => {
    // Verificamos que los handlers hayan sido capturados durante la creación de los limiters
    expect(mockHandlers.standard).toBeDefined();
    expect(mockHandlers.auth).toBeDefined();
    expect(mockHandlers.passwordReset).toBeDefined();
  });

  test('should handle rate limit scenarios correctly', () => {
    // Test para verificar el comportamiento de los handlers
    
    const mockReq = {
      ip: '127.0.0.1',
      originalUrl: '/test',
      method: 'POST'
    };
    
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    // Standard limiter handler
    mockHandlers.standard(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(429);
    expect(mockRes.json).toHaveBeenCalledWith({
      success: false,
      message: 'Demasiadas solicitudes, por favor intente más tarde'
    });
    expect(logSecurityEvent).toHaveBeenCalledWith('RATE_LIMIT_EXCEEDED', {
      ip: '127.0.0.1',
      path: '/test',
      method: 'POST'
    });

    // Reset mocks
    mockRes.status.mockClear();
    mockRes.json.mockClear();
    logSecurityEvent.mockClear();

    // Auth limiter handler
    mockHandlers.auth(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(429);
    expect(mockRes.json).toHaveBeenCalledWith({
      success: false,
      message: 'Demasiados intentos de autenticación, por favor intente más tarde'
    });
    expect(logSecurityEvent).toHaveBeenCalledWith('AUTH_RATE_LIMIT_EXCEEDED', {
      ip: '127.0.0.1',
      path: '/test',
      method: 'POST'
    });

    // Reset mocks
    mockRes.status.mockClear();
    mockRes.json.mockClear();
    logSecurityEvent.mockClear();

    // Password reset limiter handler
    mockHandlers.passwordReset(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(429);
    expect(mockRes.json).toHaveBeenCalledWith({
      success: false,
      message: 'Demasiados intentos de restablecimiento de contraseña, por favor intente más tarde'
    });
    expect(logSecurityEvent).toHaveBeenCalledWith('PASSWORD_RESET_RATE_LIMIT_EXCEEDED', {
      ip: '127.0.0.1',
      path: '/test',
      method: 'POST'
    });
  });
}); 