/**
 * Tests para el middleware de autenticación (auth/index.js)
 * Pruebas unitarias para verificar el funcionamiento del middleware de autenticación
 */

const jwt = require('jsonwebtoken');
const { verifyToken, checkRole } = require('../../middleware/auth/index');

// Mock del módulo logger
jest.mock('../../utils/logger', () => ({
  logSecurityEvent: jest.fn()
}));

// Mock de JWT
jest.mock('jsonwebtoken');

describe('Auth/index Middleware', () => {
  let req, res, next;
  
  beforeEach(() => {
    // Limpiar todos los mocks
    jest.clearAllMocks();
    
    // Variable de entorno para JWT
    process.env.JWT_SECRET = 'test-secret-key';
    
    // Mock objects
    req = {
      headers: {},
      ip: '127.0.0.1',
      originalUrl: '/api/test',
      method: 'GET',
      user: null
    };
    
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    
    next = jest.fn();
  });
  
  describe('verifyToken', () => {
    test('debe rechazar peticiones sin token', () => {
      // Ejecutar middleware sin token
      verifyToken(req, res, next);
      
      // Verificar respuesta
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        message: expect.stringContaining('token')
      }));
      expect(next).not.toHaveBeenCalled();
    });
    
    test('debe rechazar peticiones con formato de token incorrecto', () => {
      // Configurar header con formato incorrecto
      req.headers.authorization = 'InvalidTokenFormat';
      
      // Ejecutar middleware
      verifyToken(req, res, next);
      
      // Verificar respuesta
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        message: expect.stringContaining('token')
      }));
      expect(next).not.toHaveBeenCalled();
    });
    
    test('debe aceptar peticiones con token válido', () => {
      // Configurar token válido
      req.headers.authorization = 'Bearer valid-token';
      
      // Mock de jwt.verify para que retorne un usuario válido
      const mockUser = { id: 1, role: 'ADMIN' };
      jwt.verify = jest.fn().mockReturnValue(mockUser);
      
      // Ejecutar middleware
      verifyToken(req, res, next);
      
      // Verificar respuesta
      expect(jwt.verify).toHaveBeenCalledWith('valid-token', 'test-secret-key');
      expect(req.user).toEqual(mockUser);
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });
    
    test('debe rechazar peticiones con token inválido', () => {
      // Configurar token
      req.headers.authorization = 'Bearer invalid-token';
      
      // Mock de jwt.verify para que lance error
      jwt.verify = jest.fn().mockImplementation(() => {
        throw new Error('Token inválido');
      });
      
      // Ejecutar middleware
      verifyToken(req, res, next);
      
      // Verificar respuesta
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        message: expect.stringContaining('inválido')
      }));
      expect(next).not.toHaveBeenCalled();
    });
  });
  
  describe('checkRole', () => {
    test('debe rechazar peticiones sin usuario autenticado', () => {
      // No configurar usuario en req
      req.user = null;
      
      // Crear middleware para un rol específico
      const middleware = checkRole(['ADMIN']);
      
      // Ejecutar middleware
      middleware(req, res, next);
      
      // Verificar respuesta
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        message: expect.stringContaining('no autenticado')
      }));
      expect(next).not.toHaveBeenCalled();
    });
    
    test('debe permitir acceso si el usuario tiene el rol requerido', () => {
      // Configurar usuario con rol válido
      req.user = { id: 1, role: 'ADMIN' };
      
      // Crear middleware para un rol específico
      const middleware = checkRole(['ADMIN', 'MANAGER']);
      
      // Ejecutar middleware
      middleware(req, res, next);
      
      // Verificar respuesta
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });
    
    test('debe rechazar acceso si el usuario no tiene el rol requerido', () => {
      // Configurar usuario con rol no autorizado
      req.user = { id: 1, role: 'USER' };
      
      // Crear middleware para un rol específico
      const middleware = checkRole(['ADMIN', 'MANAGER']);
      
      // Ejecutar middleware
      middleware(req, res, next);
      
      // Verificar respuesta
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        message: expect.stringContaining('denegado')
      }));
      expect(next).not.toHaveBeenCalled();
    });
  });
}); 