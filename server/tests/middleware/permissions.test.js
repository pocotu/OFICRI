/**
 * Tests para middleware de permisos
 * Verifica la correcta validación de permisos de usuarios
 */

// Mock del logger - hay que mockear antes de importar cualquier módulo que use el logger
jest.mock('../../utils/logger', () => ({
  logger: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn()
  }
}));

// Importar módulos originales
const { logger } = require('../../utils/logger');
const permissions = require('../../middleware/permissions');

// Crear referencias a funciones e importar constantes
const { 
  PERMISSION_TYPES, 
  ROLE_TYPES, 
  DEFAULT_ROLE_PERMISSIONS,
  validatePermissions,
  validateRoles,
  validateResourcePermissions
} = permissions;

describe('Permissions Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    // Reiniciar todos los mocks
    jest.clearAllMocks();

    // Configuración de objetos mock
    req = {
      user: {
        id: 1,
        role: ROLE_TYPES.USER,
        permissions: [
          PERMISSION_TYPES.CREATE,
          PERMISSION_TYPES.READ,
          PERMISSION_TYPES.UPDATE,
          PERMISSION_TYPES.VIEW
        ]
      },
      path: '/api/documents',
      method: 'GET',
      params: {},
      baseUrl: '/api/documents'
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    next = jest.fn();
  });

  describe('validatePermissions', () => {
    test('debe permitir acceso cuando el usuario tiene todos los permisos requeridos', () => {
      // Middleware que requiere permisos que el usuario tiene
      const middleware = validatePermissions([PERMISSION_TYPES.READ, PERMISSION_TYPES.VIEW]);

      // Ejecutar middleware
      middleware(req, res, next);

      // Verificar que se permite el acceso
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    test('debe rechazar acceso cuando el usuario no tiene todos los permisos requeridos', () => {
      // Middleware que requiere permisos que el usuario no tiene
      const middleware = validatePermissions([PERMISSION_TYPES.DELETE, PERMISSION_TYPES.MANAGE]);

      // Ejecutar middleware
      middleware(req, res, next);

      // Verificar que se rechaza el acceso
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('permisos')
        })
      );
      // Verificar que se llama a logger.warn
      expect(logger.warn).toHaveBeenCalled();
    });

    test('debe rechazar acceso cuando el usuario no está autenticado', () => {
      // Eliminar usuario de la petición
      req.user = null;

      // Middleware que requiere cualquier permiso
      const middleware = validatePermissions([PERMISSION_TYPES.READ]);

      // Ejecutar middleware
      middleware(req, res, next);

      // Verificar que se rechaza el acceso
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('no autenticado')
        })
      );
    });

    test('debe manejar errores durante la validación', () => {
      // Forzar un error modificando el objeto req.user
      req.user = {};
      
      // Crear una propiedad que lance error al accederla
      Object.defineProperty(req.user, 'permissions', {
        get: function() { 
          throw new Error('Error simulado');
        }
      });
      
      // Middleware que requiere cualquier permiso
      const middleware = validatePermissions([PERMISSION_TYPES.READ]);

      // Ejecutar middleware
      middleware(req, res, next);

      // Verificar que se maneja el error
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('Error')
        })
      );
      expect(logger.error).toHaveBeenCalled();
    });

    test('debe usar permisos por defecto basados en rol cuando no hay permisos específicos', () => {
      // Eliminar permisos específicos del usuario, dejando solo el rol
      delete req.user.permissions;
      
      // Middleware que requiere permisos que el rol USER tiene por defecto
      const middleware = validatePermissions([PERMISSION_TYPES.READ, PERMISSION_TYPES.VIEW]);

      // Ejecutar middleware
      middleware(req, res, next);

      // Verificar que se permite el acceso usando permisos por defecto del rol
      expect(next).toHaveBeenCalled();
    });
  });

  describe('validateRoles', () => {
    test('debe permitir acceso cuando el usuario tiene un rol permitido', () => {
      // Middleware que permite el rol USER
      const middleware = validateRoles([ROLE_TYPES.USER, ROLE_TYPES.ADMIN]);

      // Ejecutar middleware
      middleware(req, res, next);

      // Verificar que se permite el acceso
      expect(next).toHaveBeenCalled();
    });

    test('debe rechazar acceso cuando el usuario no tiene un rol permitido', () => {
      // Middleware que solo permite roles ADMIN y MANAGER
      const middleware = validateRoles([ROLE_TYPES.ADMIN, ROLE_TYPES.MANAGER]);
      
      // Cambiar el rol a GUEST
      req.user.role = ROLE_TYPES.GUEST;

      // Ejecutar middleware
      middleware(req, res, next);

      // Verificar que se rechaza el acceso
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('rol')
        })
      );
      expect(logger.warn).toHaveBeenCalled();
    });

    test('debe rechazar acceso cuando el usuario no está autenticado', () => {
      // Eliminar usuario de la petición
      req.user = null;

      // Middleware que permite cualquier rol
      const middleware = validateRoles([ROLE_TYPES.USER]);

      // Ejecutar middleware
      middleware(req, res, next);

      // Verificar que se rechaza el acceso
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
    });

    test('debe manejar errores durante la validación de roles', () => {
      // Forzar un error accediendo a role
      req.user = {};
      
      // Crear una propiedad que lance error al accederla
      Object.defineProperty(req.user, 'role', {
        get: function() {
          throw new Error('Error simulado en roles');
        }
      });
      
      // Middleware que permite cualquier rol
      const middleware = validateRoles([ROLE_TYPES.USER]);

      // Ejecutar middleware
      middleware(req, res, next);

      // Verificar que se maneja el error
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(500);
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('validateResourcePermissions', () => {
    test('debe permitir acceso cuando el recurso no tiene permisos definidos', () => {
      // Configurar un recurso sin permisos definidos
      const resourcePermissions = {
        'other-resource': {
          GET: [PERMISSION_TYPES.READ]
        }
      };
      
      const middleware = validateResourcePermissions(resourcePermissions);

      // Ejecutar middleware
      middleware(req, res, next);

      // Verificar que se permite el acceso
      expect(next).toHaveBeenCalled();
    });

    test('debe permitir acceso cuando el usuario tiene los permisos necesarios para el recurso', () => {
      // Configurar permisos para el recurso "documents"
      const resourcePermissions = {
        'documents': {
          GET: [PERMISSION_TYPES.READ, PERMISSION_TYPES.VIEW]
        }
      };
      
      const middleware = validateResourcePermissions(resourcePermissions);

      // Ejecutar middleware
      middleware(req, res, next);

      // Verificar que se permite el acceso
      expect(next).toHaveBeenCalled();
    });

    // Verificamos que el logger se llama correctamente cuando enviamos una petición con permisos que el usuario no debería tener
    test('debe registrar advertencias cuando falta un permiso necesario', () => {
      // Eliminar el permiso DELETE del usuario si lo tuviera
      req.user.permissions = req.user.permissions.filter(p => p !== PERMISSION_TYPES.DELETE);
      
      // Configurar el método de la solicitud para que coincida con los permisos configurados
      req.method = 'GET';
      
      // Modificar baseUrl para que sea más identificable y se pueda extraer correctamente el recurso
      req.baseUrl = '/api/documents';
      
      // Configurar permisos para recursos que requieren DELETE
      const resourcePermissions = {
        'documents': {
          GET: [PERMISSION_TYPES.READ, PERMISSION_TYPES.DELETE]
        }
      };
      
      // Ejecutar middleware
      const middleware = validateResourcePermissions(resourcePermissions);
      middleware(req, res, next);
      
      // Verificar que se rechaza el acceso
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('permisos')
        })
      );
      
      // Verificar que se llama a logger.warn
      expect(logger.warn).toHaveBeenCalled();
    });

    test('debe usar el parámetro resource si está disponible', () => {
      // Agregar parámetro resource
      req.params.resource = 'files';
      
      // Configurar permisos para el recurso "files"
      const resourcePermissions = {
        'files': {
          GET: [PERMISSION_TYPES.READ]
        }
      };
      
      const middleware = validateResourcePermissions(resourcePermissions);

      // Ejecutar middleware
      middleware(req, res, next);

      // Verificar que se permite el acceso
      expect(next).toHaveBeenCalled();
    });

    test('debe manejar errores durante la validación de permisos por recurso', () => {
      // Configurar el middleware
      const resourcePermissions = {};
      const middleware = validateResourcePermissions(resourcePermissions);
      
      // Forzar un error en baseUrl
      Object.defineProperty(req, 'baseUrl', {
        get: function() {
          throw new Error('Error simulado en recurso');
        }
      });

      // Ejecutar middleware
      middleware(req, res, next);

      // Verificar que se maneja el error
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(500);
      expect(logger.error).toHaveBeenCalled();
    });
  });
}); 