/**
 * Tests para el middleware de autenticación
 * Pruebas unitarias para verificar la autenticación y autorización de usuarios
 */

// Mock para jwt y logger
jest.mock('jsonwebtoken');
jest.mock('../../utils/logger', () => ({
  logger: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn()
  }
}));

const jwt = require('jsonwebtoken');
const { authenticate, verifyToken, checkRole, authMiddleware, authorize, checkPermissions } = require('../../middleware/auth');
const { logger } = require('../../utils/logger');

describe('Auth Middleware', () => {
  let req, res, next;
  
  beforeEach(() => {
    // Limpiar todos los mocks
    jest.clearAllMocks();

    // Mocks comunes
    req = {
      headers: {},
      session: {},
      user: null,
      params: {},
      path: '/api/test',
      method: 'GET'
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis()
    };
    next = jest.fn();

    // Mock del logger
    logger.info = jest.fn();
    logger.warn = jest.fn();
    logger.error = jest.fn();
    
    // Establecer variables de entorno
    process.env.JWT_SECRET = 'test-secret-key';
  });
  
  describe('authenticate', () => {
    test('debe permitir acceso en modo de prueba sin token', () => {
      // Configurar NODE_ENV para pruebas
      const originalNodeEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'test';
      
      // Ejecutar middleware
      authenticate(req, res, next);
      
      // Verificar que se crea un usuario de prueba y se permite el acceso
      expect(req.user).toBeDefined();
      expect(req.user.role).toBe('ADMIN');
      expect(next).toHaveBeenCalled();
      
      // Restaurar NODE_ENV
      process.env.NODE_ENV = originalNodeEnv;
    });
    
    test('debe rechazar peticiones sin token en modo producción', () => {
      // Configurar NODE_ENV para producción
      const originalNodeEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      
      // Ejecutar middleware
      authenticate(req, res, next);
      
      // Verificar que se rechaza la petición
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('token')
        })
      );
      expect(next).not.toHaveBeenCalled();
      
      // Restaurar NODE_ENV
      process.env.NODE_ENV = originalNodeEnv;
    });
    
    test('debe aceptar peticiones con token válido', () => {
      // Configurar NODE_ENV para producción
      const originalNodeEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      
      // Configurar token válido
      req.headers.authorization = 'Bearer valid-token';
      
      // Mockear jwt.verify para devolver un usuario válido
      jwt.verify.mockImplementation((token, secret) => {
        if (token === 'valid-token' && secret === 'test-secret-key') {
          return { id: 1, role: 'USER' };
        }
        throw new Error('Token inválido');
      });
      
      // Ejecutar middleware
      authenticate(req, res, next);
      
      // Verificar que se acepta la petición y se llama a jwt.verify
      expect(jwt.verify).toHaveBeenCalledWith('valid-token', 'test-secret-key');
      expect(req.user).toEqual({ id: 1, role: 'USER' });
      expect(next).toHaveBeenCalled();
      
      // Restaurar NODE_ENV
      process.env.NODE_ENV = originalNodeEnv;
    });
    
    test('debe rechazar peticiones con token inválido', () => {
      // Configurar NODE_ENV para producción
      const originalNodeEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      
      // Configurar token
      req.headers.authorization = 'Bearer invalid-token';
      
      // Mockear jwt.verify para lanzar error
      jwt.verify.mockImplementation(() => {
        throw new Error('Token inválido');
      });
      
      // Ejecutar middleware
      authenticate(req, res, next);
      
      // Verificar que se rechaza la petición
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('inválido')
        })
      );
      expect(next).not.toHaveBeenCalled();
      expect(logger.error).toHaveBeenCalled();
      
      // Restaurar NODE_ENV
      process.env.NODE_ENV = originalNodeEnv;
    });
  });
  
  describe('verifyToken', () => {
    test('debe rechazar peticiones sin token', () => {
      // Ejecutar middleware
      verifyToken(req, res, next);
      
      // Verificar que se rechaza la petición
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            message: expect.stringContaining('Token no proporcionado')
          })
        })
      );
      expect(next).not.toHaveBeenCalled();
    });
    
    test('debe rechazar peticiones con formato de token incorrecto', () => {
      // Configurar header con formato incorrecto
      req.headers.authorization = 'invalid-format';
      
      // Ejecutar middleware
      verifyToken(req, res, next);
      
      // Verificar que se rechaza la petición
      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });
    
    test('debe aceptar peticiones con token válido', () => {
      // Configurar token válido
      req.headers.authorization = 'Bearer valid-token';
      
      // Mockear jwt.verify para devolver un usuario válido
      jwt.verify.mockImplementation((token, secret) => {
        if (token === 'valid-token') {
          return { id: 1, role: 'USER' };
        }
        throw new Error('Token inválido');
      });
      
      // Ejecutar middleware
      verifyToken(req, res, next);
      
      // Verificar que se acepta la petición
      expect(jwt.verify).toHaveBeenCalledWith('valid-token', expect.any(String));
      expect(req.user).toEqual({ id: 1, role: 'USER' });
      expect(next).toHaveBeenCalled();
    });
  });
  
  describe('checkRole', () => {
    test('debe rechazar si el usuario no está autenticado', () => {
      // Crear middleware para roles específicos
      const roleMiddleware = checkRole('ADMIN', 'MANAGER');
      
      // Ejecutar middleware sin usuario
      roleMiddleware(req, res, next);
      
      // Verificar que se rechaza la petición
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.stringContaining('no autenticado')
        })
      );
      expect(next).not.toHaveBeenCalled();
    });
    
    test('debe rechazar si el usuario no tiene el rol requerido', () => {
      // Configurar usuario con rol no autorizado
      req.user = { id: 1, role: 'USER' };
      
      // Crear middleware para roles específicos
      const roleMiddleware = checkRole('ADMIN', 'MANAGER');
      
      // Ejecutar middleware
      roleMiddleware(req, res, next);
      
      // Verificar que se rechaza la petición
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.stringContaining('no autorizado')
        })
      );
      expect(next).not.toHaveBeenCalled();
      expect(logger.warn).toHaveBeenCalled();
    });
    
    test('debe permitir acceso si el usuario tiene el rol requerido', () => {
      // Configurar usuario con rol autorizado
      req.user = { id: 1, role: 'ADMIN' };
      
      // Crear middleware para roles específicos
      const roleMiddleware = checkRole('ADMIN', 'MANAGER');
      
      // Ejecutar middleware
      roleMiddleware(req, res, next);
      
      // Verificar que se permite acceso
      expect(next).toHaveBeenCalled();
    });
    
    test('debe manejar errores durante la verificación', () => {
      // Configurar usuario para causar error
      req.user = {};
      
      // Crear un objeto con getter que lance error
      Object.defineProperty(req.user, 'role', {
        get: function() {
          throw new Error('Error simulado');
        }
      });
      
      // Crear middleware para roles específicos
      const roleMiddleware = checkRole('ADMIN');
      
      // Ejecutar middleware
      roleMiddleware(req, res, next);
      
      // Verificar que se maneja el error
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.stringContaining('verificar roles')
        })
      );
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('checkResourceOwnership', () => {
    test('debe rechazar si el usuario no está autenticado', async () => {
      // Importar la función
      const { checkResourceOwnership } = require('../../middleware/auth');
      
      // Configurar middleware
      const ownershipMiddleware = checkResourceOwnership('document');
      
      // Ejecutar middleware sin usuario
      await ownershipMiddleware(req, res, next);
      
      // Verificar que se rechaza la petición
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.stringContaining('no autenticado')
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    test('debe rechazar si el recurso no existe', async () => {
      // Importar la función
      const { checkResourceOwnership } = require('../../middleware/auth');
      
      // Crear un mock para getResource que retorna null (recurso no existe)
      const mockGetResource = jest.fn().mockResolvedValue(null);
      
      // Configurar usuario
      req.user = { id: 1, role: 'USER' };
      req.params = { id: 123 };
      
      // Crear middleware con el mock inyectado
      const ownershipMiddleware = checkResourceOwnership('document', mockGetResource);
      
      // Ejecutar middleware
      await ownershipMiddleware(req, res, next);
      
      // Verificar que se rechaza el acceso
      expect(mockGetResource).toHaveBeenCalledWith('document', 123);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.stringContaining('no encontrado')
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    test('debe permitir acceso a administradores sin importar la propiedad', async () => {
      // Importar la función
      const { checkResourceOwnership } = require('../../middleware/auth');
      
      // Crear un mock para getResource que retorna un recurso de otro usuario
      const mockGetResource = jest.fn().mockResolvedValue({ id: 123, userId: 2 });
      
      // Configurar usuario admin
      req.user = { id: 1, role: 'ADMIN' };
      req.params = { id: 123 };
      
      // Crear middleware con el mock inyectado
      const ownershipMiddleware = checkResourceOwnership('document', mockGetResource);
      
      // Ejecutar middleware
      await ownershipMiddleware(req, res, next);
      
      // Verificar que se permite acceso al admin aunque no sea el propietario
      expect(mockGetResource).toHaveBeenCalledWith('document', 123);
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    test('debe rechazar acceso a usuarios que no son propietarios', async () => {
      // Importar la función
      const { checkResourceOwnership } = require('../../middleware/auth');
      
      // Crear un mock para getResource que retorna un recurso de otro usuario
      const mockGetResource = jest.fn().mockResolvedValue({ id: 123, userId: 2 });
      
      // Configurar usuario normal
      req.user = { id: 1, role: 'USER' };
      req.params = { id: 123 };
      
      // Crear middleware con el mock inyectado
      const ownershipMiddleware = checkResourceOwnership('document', mockGetResource);
      
      // Ejecutar middleware
      await ownershipMiddleware(req, res, next);
      
      // Verificar que se rechaza el acceso
      expect(mockGetResource).toHaveBeenCalledWith('document', 123);
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.stringContaining('No autorizado para acceder a este recurso')
        })
      );
      expect(next).not.toHaveBeenCalled();
      expect(logger.warn).toHaveBeenCalled();
    });

    test('debe permitir acceso a usuarios propietarios', async () => {
      // Importar la función
      const { checkResourceOwnership } = require('../../middleware/auth');
      
      // Crear un mock para getResource que retorna un recurso propiedad del usuario
      const mockGetResource = jest.fn().mockResolvedValue({ id: 123, userId: 1 });
      
      // Configurar usuario propietario
      req.user = { id: 1, role: 'USER' };
      req.params = { id: 123 };
      
      // Crear middleware con el mock inyectado
      const ownershipMiddleware = checkResourceOwnership('document', mockGetResource);
      
      // Ejecutar middleware
      await ownershipMiddleware(req, res, next);
      
      // Verificar que se permite acceso
      expect(mockGetResource).toHaveBeenCalledWith('document', 123);
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  describe('validatePermissions (Bit-based)', () => {
    test('debe rechazar acceso si el usuario no está autenticado', () => {
      // Importar la función específica
      const { validatePermissions } = require('../../middleware/auth');
      
      // Crear middleware para validar permiso de bit 0 (CREAR)
      const permMiddleware = validatePermissions(0);
      
      // Ejecutar middleware sin usuario
      permMiddleware(req, res, next);
      
      // Verificar que se rechaza la petición
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('no autenticado')
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    test('debe permitir acceso a administradores sin verificar bits', () => {
      // Importar la función específica
      const { validatePermissions } = require('../../middleware/auth');
      
      // Configurar usuario admin
      req.user = { id: 1, role: 'ADMIN', permisos: 0 }; // Sin permisos específicos
      
      // Crear middleware para validar permiso de bit 0 (CREAR)
      const permMiddleware = validatePermissions(0);
      
      // Ejecutar middleware
      permMiddleware(req, res, next);
      
      // Verificar que se permite acceso sin verificar bits
      expect(next).toHaveBeenCalled();
    });

    test('debe permitir acceso a usuarios con permisos totales', () => {
      // Importar la función específica
      const { validatePermissions } = require('../../middleware/auth');
      
      // Configurar usuario con todos los permisos (255 = 11111111 en binario)
      req.user = { id: 1, role: 'USER', userPermisos: 255 };
      
      // Crear middleware para validar permiso de bit 6 (EXPORTAR)
      const permMiddleware = validatePermissions(6);
      
      // Ejecutar middleware
      permMiddleware(req, res, next);
      
      // Verificar que se permite acceso
      expect(next).toHaveBeenCalled();
    });

    test('debe permitir acceso si el usuario tiene el bit requerido', () => {
      // Importar la función específica
      const { validatePermissions } = require('../../middleware/auth');
      
      // Configurar usuario con permisos específicos (bit 3 = 8 en decimal)
      req.user = { id: 1, role: 'USER', permisos: 8 }; // Solo permiso de VER (bit 3)
      
      // Crear middleware para validar permiso de bit 3 (VER)
      const permMiddleware = validatePermissions(3);
      
      // Ejecutar middleware
      permMiddleware(req, res, next);
      
      // Verificar que se permite acceso
      expect(next).toHaveBeenCalled();
    });

    test('debe rechazar acceso si el usuario no tiene el bit requerido', () => {
      // Importar la función específica
      const { validatePermissions } = require('../../middleware/auth');
      
      // Configurar usuario con permisos específicos (bit 3 = 8 en decimal)
      req.user = { id: 1, role: 'USER', permisos: 8 }; // Solo permiso de VER (bit 3)
      
      // Crear middleware para validar permiso de bit 0 (CREAR)
      const permMiddleware = validatePermissions(0);
      
      // Ejecutar middleware
      permMiddleware(req, res, next);
      
      // Verificar que se rechaza el acceso
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('No tiene el permiso')
        })
      );
      expect(next).not.toHaveBeenCalled();
      expect(logger.warn).toHaveBeenCalled();
    });

    test('debe manejar errores durante la verificación de bits', () => {
      // Importar la función específica
      const { validatePermissions } = require('../../middleware/auth');
      
      // Configurar usuario para causar error
      req.user = {};
      Object.defineProperty(req.user, 'permisos', {
        get: function() {
          throw new Error('Error simulado');
        }
      });
      
      // Crear middleware para validar permiso
      const permMiddleware = validatePermissions(0);
      
      // Ejecutar middleware
      permMiddleware(req, res, next);
      
      // Verificar que se maneja el error
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('Error al verificar permisos')
        })
      );
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('checkPermissions', () => {
    test('debe rechazar si el usuario no está autenticado', () => {
      // Crear middleware para permisos específicos
      const permMiddleware = checkPermissions('crear', 'editar');
      
      // Ejecutar middleware sin usuario
      permMiddleware(req, res, next);
      
      // Verificar que se rechaza la petición
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.stringContaining('no autenticado')
        })
      );
      expect(next).not.toHaveBeenCalled();
    });
    
    test('debe rechazar si el usuario no tiene todos los permisos requeridos', () => {
      // Configurar usuario con permisos parciales
      req.user = { 
        id: 1, 
        role: 'USER',
        permissions: ['crear', 'ver'] // Falta 'editar'
      };
      
      // Crear middleware para múltiples permisos
      const permMiddleware = checkPermissions('crear', 'editar');
      
      // Ejecutar middleware
      permMiddleware(req, res, next);
      
      // Verificar que se rechaza la petición
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.stringContaining('insuficientes')
        })
      );
      expect(next).not.toHaveBeenCalled();
      expect(logger.warn).toHaveBeenCalled();
    });
    
    test('debe permitir acceso si el usuario tiene todos los permisos requeridos', () => {
      // Configurar usuario con todos los permisos necesarios
      req.user = { 
        id: 1, 
        role: 'USER',
        permissions: ['crear', 'editar', 'ver', 'eliminar']
      };
      
      // Crear middleware para múltiples permisos
      const permMiddleware = checkPermissions('crear', 'editar');
      
      // Ejecutar middleware
      permMiddleware(req, res, next);
      
      // Verificar que se permite acceso
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });
    
    test('debe permitir acceso para un solo permiso requerido', () => {
      // Configurar usuario con permisos
      req.user = { 
        id: 1, 
        role: 'USER',
        permissions: ['ver', 'editar']
      };
      
      // Crear middleware para un solo permiso
      const permMiddleware = checkPermissions('ver');
      
      // Ejecutar middleware
      permMiddleware(req, res, next);
      
      // Verificar que se permite acceso
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });
    
    test('debe manejar errores durante la verificación de permisos', () => {
      // Configurar usuario para causar error
      req.user = {};
      Object.defineProperty(req.user, 'permissions', {
        get: function() {
          throw new Error('Error simulado');
        }
      });
      
      // Crear middleware para permisos
      const permMiddleware = checkPermissions('crear');
      
      // Ejecutar middleware
      permMiddleware(req, res, next);
      
      // Verificar que se maneja el error
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.stringContaining('verificar permisos')
        })
      );
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('authorize', () => {
    test('debe permitir acceso en modo de prueba sin verificar rol', () => {
      // Configurar NODE_ENV para pruebas
      const originalNodeEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'test';
      
      // Crear middleware para rol específico
      const authMiddleware = authorize('ADMIN');
      
      // Ejecutar middleware sin usuario
      authMiddleware(req, res, next);
      
      // Verificar que se permite acceso en modo prueba
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
      
      // Restaurar NODE_ENV
      process.env.NODE_ENV = originalNodeEnv;
    });
    
    test('debe rechazar si el usuario no está autenticado', () => {
      // Configurar NODE_ENV para producción
      const originalNodeEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      
      // Crear middleware para rol específico
      const authMiddleware = authorize('ADMIN');
      
      // Ejecutar middleware sin usuario
      authMiddleware(req, res, next);
      
      // Verificar que se rechaza la petición
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('Usuario no autenticado')
        })
      );
      expect(next).not.toHaveBeenCalled();
      
      // Restaurar NODE_ENV
      process.env.NODE_ENV = originalNodeEnv;
    });
    
    test('debe rechazar si el usuario no tiene el rol requerido', () => {
      // Configurar NODE_ENV para producción
      const originalNodeEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      
      // Configurar usuario con rol no autorizado
      req.user = { id: 1, role: 'USER' };
      
      // Crear middleware para rol específico
      const authMiddleware = authorize('MANAGER');
      
      // Ejecutar middleware
      authMiddleware(req, res, next);
      
      // Verificar que se rechaza la petición
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('No tiene permisos suficientes')
        })
      );
      expect(next).not.toHaveBeenCalled();
      
      // Restaurar NODE_ENV
      process.env.NODE_ENV = originalNodeEnv;
    });
    
    test('debe permitir acceso a administradores para cualquier rol', () => {
      // Configurar NODE_ENV para producción
      const originalNodeEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      
      // Configurar usuario como admin
      req.user = { id: 1, role: 'ADMIN' };
      
      // Crear middleware para otro rol
      const authMiddleware = authorize('MANAGER');
      
      // Ejecutar middleware
      authMiddleware(req, res, next);
      
      // Verificar que se permite acceso
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
      
      // Restaurar NODE_ENV
      process.env.NODE_ENV = originalNodeEnv;
    });
    
    test('debe permitir acceso si el usuario tiene el rol requerido', () => {
      // Configurar NODE_ENV para producción
      const originalNodeEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      
      // Configurar usuario con rol específico
      req.user = { id: 1, role: 'MANAGER' };
      
      // Crear middleware para el mismo rol
      const authMiddleware = authorize('MANAGER');
      
      // Ejecutar middleware
      authMiddleware(req, res, next);
      
      // Verificar que se permite acceso
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
      
      // Restaurar NODE_ENV
      process.env.NODE_ENV = originalNodeEnv;
    });
  });

  describe('authMiddleware', () => {
    test('debe permitir acceso a rutas públicas sin token', () => {
      // Configurar rutas públicas
      req.path = '/api/auth/login';
      
      // Ejecutar middleware
      authMiddleware(req, res, next);
      
      // Verificar que permite el acceso sin verificar token
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });
    
    test('debe permitir acceso a rutas de salud sin token', () => {
      // Configurar ruta de salud
      req.path = '/api/health';
      
      // Ejecutar middleware
      authMiddleware(req, res, next);
      
      // Verificar que permite el acceso sin verificar token
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });
    
    test('debe rechazar peticiones sin token para rutas protegidas', () => {
      // Configurar ruta protegida
      req.path = '/api/documents';
      
      // Ejecutar middleware
      authMiddleware(req, res, next);
      
      // Verificar que rechaza la petición
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            message: expect.stringContaining('Token no proporcionado')
          })
        })
      );
      expect(next).not.toHaveBeenCalled();
    });
    
    test('debe rechazar peticiones con formato de token incorrecto', () => {
      // Configurar ruta protegida
      req.path = '/api/documents';
      
      // Configurar header con formato incorrecto
      req.headers.authorization = 'invalid-format';
      
      // Ejecutar middleware
      authMiddleware(req, res, next);
      
      // Verificar que rechaza la petición
      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });
    
    test('debe aceptar peticiones con token válido', () => {
      // Configurar ruta protegida
      req.path = '/api/documents';
      
      // Configurar token válido
      req.headers.authorization = 'Bearer valid-token';
      
      // Mockear jwt.verify para devolver un usuario válido
      jwt.verify.mockImplementation((token, secret) => {
        if (token === 'valid-token') {
          return { id: 1, role: 'USER' };
        }
        throw new Error('Token inválido');
      });
      
      // Ejecutar middleware
      authMiddleware(req, res, next);
      
      // Verificar que acepta la petición
      expect(jwt.verify).toHaveBeenCalledWith('valid-token', expect.any(String));
      expect(req.user).toEqual({ id: 1, role: 'USER' });
      expect(next).toHaveBeenCalled();
    });
    
    test('debe aceptar peticiones a rutas protegidas en modo test sin token', () => {
      // Guardar NODE_ENV original
      const originalNodeEnv = process.env.NODE_ENV;
      const originalUseTestUser = process.env.USE_TEST_USER;
      
      // Configurar para modo test con usuario simulado
      process.env.NODE_ENV = 'test';
      process.env.USE_TEST_USER = 'true';
      
      // Configurar ruta protegida
      req.path = '/api/documents';
      
      // Ejecutar middleware
      authMiddleware(req, res, next);
      
      // Verificar que crea un usuario simulado y permite acceso
      expect(req.user).toBeDefined();
      expect(req.user.role).toBe('ADMIN');
      expect(next).toHaveBeenCalled();
      
      // Restaurar variables de entorno
      process.env.NODE_ENV = originalNodeEnv;
      process.env.USE_TEST_USER = originalUseTestUser;
    });
    
    test('debe rechazar peticiones con token inválido', () => {
      // Configurar ruta protegida
      req.path = '/api/documents';
      
      // Configurar token inválido
      req.headers.authorization = 'Bearer invalid-token';
      
      // Mockear jwt.verify para lanzar error
      jwt.verify.mockImplementation(() => {
        throw new Error('Token inválido');
      });
      
      // Ejecutar middleware
      authMiddleware(req, res, next);
      
      // Verificar que rechaza la petición
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            message: expect.stringContaining('Token inválido')
          })
        })
      );
      expect(next).not.toHaveBeenCalled();
      expect(logger.error).toHaveBeenCalled();
    });
  });
}); 