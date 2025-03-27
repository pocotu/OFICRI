/**
 * Tests para middleware de auditoría
 */

jest.mock('../../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  }
}));

const { 
  AUDIT_TYPES, 
  auditLog, 
  failedAccessAudit, 
  permissionChangeAudit, 
  roleChangeAudit 
} = require('../../middleware/audit');
const { logger } = require('../../utils/logger');

describe('Audit Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    // Resetear mocks
    jest.clearAllMocks();
    
    // Mock request object
    req = {
      user: {
        id: 1,
        username: 'admin',
        role: 'ADMIN'
      },
      ip: '127.0.0.1',
      get: jest.fn().mockReturnValue('Mozilla/5.0 Test'),
      method: 'POST',
      path: '/api/users',
      query: { page: 1 },
      body: { name: 'Test User' }
    };
    
    // Mock response object
    res = {
      statusCode: 200,
      json: jest.fn()
    };
    
    // Mock next function
    next = jest.fn();
  });

  describe('AUDIT_TYPES', () => {
    test('debe tener todos los tipos de auditoría definidos', () => {
      expect(AUDIT_TYPES).toBeDefined();
      expect(AUDIT_TYPES.CREATE).toBe('CREATE');
      expect(AUDIT_TYPES.READ).toBe('READ');
      expect(AUDIT_TYPES.UPDATE).toBe('UPDATE');
      expect(AUDIT_TYPES.DELETE).toBe('DELETE');
      expect(AUDIT_TYPES.LOGIN).toBe('LOGIN');
      expect(AUDIT_TYPES.LOGOUT).toBe('LOGOUT');
      expect(AUDIT_TYPES.FAILED_LOGIN).toBe('FAILED_LOGIN');
      expect(AUDIT_TYPES.PASSWORD_CHANGE).toBe('PASSWORD_CHANGE');
      expect(AUDIT_TYPES.PERMISSION_CHANGE).toBe('PERMISSION_CHANGE');
      expect(AUDIT_TYPES.ROLE_CHANGE).toBe('ROLE_CHANGE');
    });
  });

  describe('auditLog', () => {
    test('debe registrar la acción y llamar a next', () => {
      const middleware = auditLog(AUDIT_TYPES.CREATE, 'user');
      middleware(req, res, next);
      
      expect(logger.info).toHaveBeenCalledWith('Audit Log:', expect.objectContaining({
        action: AUDIT_TYPES.CREATE,
        resource: 'user',
        user: {
          id: 1,
          username: 'admin',
          role: 'ADMIN'
        },
        ip: '127.0.0.1'
      }));
      expect(next).toHaveBeenCalled();
    });

    test('debe manejar el caso cuando req.user es null', () => {
      req.user = null;
      const middleware = auditLog(AUDIT_TYPES.READ, 'document');
      middleware(req, res, next);
      
      expect(logger.info).toHaveBeenCalledWith('Audit Log:', expect.objectContaining({
        action: AUDIT_TYPES.READ,
        resource: 'document',
        user: null
      }));
      expect(next).toHaveBeenCalled();
    });

    test('debe capturar errores y continuar', () => {
      const error = new Error('Test error');
      logger.info.mockImplementationOnce(() => { throw error; });
      
      const middleware = auditLog(AUDIT_TYPES.UPDATE, 'profile');
      middleware(req, res, next);
      
      expect(logger.error).toHaveBeenCalledWith('Error en auditoría:', expect.objectContaining({
        error: 'Test error',
        action: AUDIT_TYPES.UPDATE,
        resource: 'profile'
      }));
      expect(next).toHaveBeenCalled();
    });
  });

  describe('failedAccessAudit', () => {
    test('debe registrar el intento fallido y llamar a next', () => {
      req.body = { username: 'test' };
      failedAccessAudit(req, res, next);
      
      expect(logger.warn).toHaveBeenCalledWith('Failed Access Attempt:', expect.objectContaining({
        action: AUDIT_TYPES.FAILED_LOGIN,
        resource: 'auth',
        ip: '127.0.0.1',
        body: { username: 'test' }
      }));
      expect(next).toHaveBeenCalled();
    });

    test('debe capturar errores y continuar', () => {
      const error = new Error('Test error');
      logger.warn.mockImplementationOnce(() => { throw error; });
      
      failedAccessAudit(req, res, next);
      
      expect(logger.error).toHaveBeenCalledWith('Error en auditoría de acceso fallido:', expect.objectContaining({
        error: 'Test error'
      }));
      expect(next).toHaveBeenCalled();
    });
  });

  describe('permissionChangeAudit', () => {
    test('debe registrar el cambio de permisos y llamar a next', () => {
      permissionChangeAudit(req, res, next);
      
      expect(logger.info).toHaveBeenCalledWith('Permission Change:', expect.objectContaining({
        action: AUDIT_TYPES.PERMISSION_CHANGE,
        resource: 'permissions',
        user: {
          id: 1,
          username: 'admin',
          role: 'ADMIN'
        }
      }));
      expect(next).toHaveBeenCalled();
    });

    test('debe manejar el caso cuando req.user es null', () => {
      req.user = null;
      permissionChangeAudit(req, res, next);
      
      expect(logger.info).toHaveBeenCalledWith('Permission Change:', expect.objectContaining({
        user: null
      }));
      expect(next).toHaveBeenCalled();
    });

    test('debe capturar errores y continuar', () => {
      const error = new Error('Test error');
      logger.info.mockImplementationOnce(() => { throw error; });
      
      permissionChangeAudit(req, res, next);
      
      expect(logger.error).toHaveBeenCalledWith('Error en auditoría de cambios de permisos:', expect.objectContaining({
        error: 'Test error'
      }));
      expect(next).toHaveBeenCalled();
    });
  });

  describe('roleChangeAudit', () => {
    test('debe registrar el cambio de rol y llamar a next', () => {
      roleChangeAudit(req, res, next);
      
      expect(logger.info).toHaveBeenCalledWith('Role Change:', expect.objectContaining({
        action: AUDIT_TYPES.ROLE_CHANGE,
        resource: 'roles',
        user: {
          id: 1,
          username: 'admin',
          role: 'ADMIN'
        }
      }));
      expect(next).toHaveBeenCalled();
    });

    test('debe manejar el caso cuando req.user es null', () => {
      req.user = null;
      roleChangeAudit(req, res, next);
      
      expect(logger.info).toHaveBeenCalledWith('Role Change:', expect.objectContaining({
        user: null
      }));
      expect(next).toHaveBeenCalled();
    });

    test('debe capturar errores y continuar', () => {
      const error = new Error('Test error');
      logger.info.mockImplementationOnce(() => { throw error; });
      
      roleChangeAudit(req, res, next);
      
      expect(logger.error).toHaveBeenCalledWith('Error en auditoría de cambios de roles:', expect.objectContaining({
        error: 'Test error'
      }));
      expect(next).toHaveBeenCalled();
    });
  });
}); 