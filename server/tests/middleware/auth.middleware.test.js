/**
 * Pruebas para middleware de autenticación
 * Verifica el funcionamiento correcto de los middlewares en auth.js
 */

const jwt = require('jsonwebtoken');
const { authMiddleware, verifyToken, checkRole, checkPermissions } = require('../../middleware/auth');
const { logger } = require('../../utils/logger');

// Configurar NODE_ENV para testing
process.env.NODE_ENV = 'test';

// Mockeamos los módulos necesarios
jest.mock('jsonwebtoken');
jest.mock('../../utils/logger');

// Variables reutilizables para pruebas
const mockToken = 'mock.jwt.token';
const mockDecodedToken = { id: 1, role: 'ADMIN', permisos: 255 };

describe('Auth Middleware', () => {
  let req, res, next;

  // Setup común antes de cada prueba
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Configuración de mocks de logger
    logger.error = jest.fn();
    logger.info = jest.fn();
    logger.warn = jest.fn();
    logger.debug = jest.fn();
    
    // Objetos mockeados para req, res y next
    req = {
      headers: {},
      path: '/api/documents',
      user: null
    };
    
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    
    next = jest.fn();
    
    // Mock de la función verify de JWT
    jwt.verify = jest.fn((token, secret) => {
      if (token === mockToken) {
        return mockDecodedToken;
      }
      throw new Error('Invalid token');
    });
  });

  describe('authMiddleware', () => {
    test('debe permitir rutas públicas sin verificar token', () => {
      req.path = '/health';
      authMiddleware(req, res, next);
      expect(next).toHaveBeenCalled();
      expect(jwt.verify).not.toHaveBeenCalled();
    });

    test('debe permitir rutas de autenticación sin verificar token', () => {
      req.path = '/api/auth/login';
      authMiddleware(req, res, next);
      expect(next).toHaveBeenCalled();
      expect(jwt.verify).not.toHaveBeenCalled();
    });

    test('debe rechazar peticiones sin token', () => {
      authMiddleware(req, res, next);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        error: expect.objectContaining({
          message: expect.stringContaining('no proporcionado')
        })
      }));
      expect(next).not.toHaveBeenCalled();
    });

    test('debe rechazar peticiones con formato de token incorrecto', () => {
      req.headers.authorization = 'InvalidFormat token123';
      authMiddleware(req, res, next);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });

    test('debe aceptar peticiones con token válido', () => {
      req.headers.authorization = `Bearer ${mockToken}`;
      authMiddleware(req, res, next);
      expect(jwt.verify).toHaveBeenCalled();
      expect(req.user).toEqual(mockDecodedToken);
      expect(next).toHaveBeenCalled();
    });

    test('debe rechazar peticiones con token inválido', () => {
      req.headers.authorization = 'Bearer invalid-token';
      authMiddleware(req, res, next);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(logger.error).toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('checkRole', () => {
    test('debe permitir acceso a usuarios con el rol correcto', () => {
      req.user = { role: 'ADMIN' };
      const middleware = checkRole('ADMIN', 'SUPERVISOR');
      middleware(req, res, next);
      
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    test('debe rechazar acceso a usuarios sin el rol requerido', () => {
      req.user = { role: 'USER' };
      const middleware = checkRole('ADMIN', 'SUPERVISOR');
      middleware(req, res, next);
      
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        error: expect.anything()
      }));
    });

    test('debe manejar peticiones sin información de usuario', () => {
      req.user = null;
      const middleware = checkRole('ADMIN');
      middleware(req, res, next);
      
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
    });
  });

  describe('checkPermissions', () => {
    test('debe permitir acceso a usuarios con los permisos requeridos', () => {
      // Usuario con todos los permisos
      req.user = { 
        permissions: ['crear', 'editar', 'eliminar', 'ver', 'derivar', 'auditar'] 
      };
      const middleware = checkPermissions('ver', 'editar');
      middleware(req, res, next);
      
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    test('debe rechazar acceso a usuarios sin los permisos requeridos', () => {
      // Usuario con permisos limitados
      req.user = { 
        permissions: ['ver'] 
      };
      const middleware = checkPermissions('editar');
      middleware(req, res, next);
      
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
    });

    test('debe manejar peticiones sin información de usuario', () => {
      req.user = null;
      const middleware = checkPermissions('ver');
      middleware(req, res, next);
      
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
    });
  });
}); 