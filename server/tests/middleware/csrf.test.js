/**
 * Tests para CSRF Middleware
 * Pruebas unitarias para el middleware de protección CSRF
 */

// Mock de utils/logger antes de importar el middleware
jest.mock('../../utils/logger', () => ({
  logSecurityEvent: jest.fn()
}));

const { csrfMiddleware, generateCsrfToken } = require('../../middleware/security/csrf.middleware');
const { logSecurityEvent } = require('../../utils/logger');
const crypto = require('crypto');

describe('CSRF Middleware', () => {
  let req, res, next;
  let mockHmac;
  
  beforeEach(() => {
    // Configurar objetos mock para req, res y next
    req = {
      method: 'POST',
      headers: {},
      ip: '127.0.0.1',
      originalUrl: '/api/test',
      session: {
        id: 'test-session-id'
      }
    };
    
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    
    next = jest.fn();
    
    // Establecer variable de entorno necesaria para los tests
    process.env.CSRF_SECRET = 'test-csrf-secret';
    
    // Limpiar mocks
    jest.clearAllMocks();
    
    // Configurar crypto mock para resultado determinista
    mockHmac = {
      update: jest.fn().mockReturnThis(),
      digest: jest.fn().mockReturnValue('mockedcsrftoken')
    };
  });
  
  describe('csrfMiddleware', () => {
    test('debe permitir métodos HTTP seguros sin token CSRF', () => {
      // Configurar un método HTTP seguro
      req.method = 'GET';
      
      // Ejecutar el middleware
      csrfMiddleware(req, res, next);
      
      // Verificar que next fue llamado (no bloqueado)
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });
    
    test('debe rechazar peticiones POST sin token CSRF', () => {
      // No incluir token CSRF
      req.method = 'POST';
      
      // Ejecutar el middleware
      csrfMiddleware(req, res, next);
      
      // Verificar respuesta de error
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('CSRF')
        })
      );
      expect(next).not.toHaveBeenCalled();
      expect(logSecurityEvent).toHaveBeenCalledWith('CSRF_TOKEN_MISSING', expect.any(Object));
    });
    
    test('debe rechazar peticiones con token CSRF inválido', () => {
      // Incluir un token CSRF inválido (muy corto)
      req.headers['x-csrf-token'] = 'invalid';
      
      // Ejecutar el middleware
      csrfMiddleware(req, res, next);
      
      // Verificar respuesta de error
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('inválido')
        })
      );
      expect(next).not.toHaveBeenCalled();
      expect(logSecurityEvent).toHaveBeenCalledWith('CSRF_TOKEN_INVALID', expect.any(Object));
    });
    
    test('debe aceptar peticiones con token CSRF válido', () => {
      // Configurar un token CSRF válido (más de 20 caracteres)
      req.headers['x-csrf-token'] = 'a'.repeat(30);
      
      // Ejecutar el middleware
      csrfMiddleware(req, res, next);
      
      // Verificar que next fue llamado (middleware pasado)
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    test('debe manejar correctamente cuando no hay sesión', () => {
      // Eliminar la sesión
      req.session = null;
      req.headers['x-csrf-token'] = 'a'.repeat(30);
      
      // Ejecutar el middleware
      csrfMiddleware(req, res, next);
      
      // Debe seguir verificando el token, sin error por falta de sesión
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    test('debe rechazar operaciones PUT sin token CSRF', () => {
      req.method = 'PUT';
      
      // Ejecutar el middleware
      csrfMiddleware(req, res, next);
      
      // Verificar respuesta de error
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('CSRF')
        })
      );
      expect(logSecurityEvent).toHaveBeenCalledWith('CSRF_TOKEN_MISSING', expect.any(Object));
    });

    test('debe rechazar operaciones DELETE sin token CSRF', () => {
      req.method = 'DELETE';
      
      // Ejecutar el middleware
      csrfMiddleware(req, res, next);
      
      // Verificar respuesta de error
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('CSRF')
        })
      );
      expect(logSecurityEvent).toHaveBeenCalledWith('CSRF_TOKEN_MISSING', expect.any(Object));
    });

    test('debe rechazar operaciones PATCH sin token CSRF', () => {
      req.method = 'PATCH';
      
      // Ejecutar el middleware
      csrfMiddleware(req, res, next);
      
      // Verificar respuesta de error
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('CSRF')
        })
      );
      expect(logSecurityEvent).toHaveBeenCalledWith('CSRF_TOKEN_MISSING', expect.any(Object));
    });

    test('debe permitir operaciones OPTIONS sin token CSRF', () => {
      req.method = 'OPTIONS';
      
      // Ejecutar el middleware
      csrfMiddleware(req, res, next);
      
      // Verificar que next fue llamado (middleware pasado)
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    test('debe permitir operaciones HEAD sin token CSRF', () => {
      req.method = 'HEAD';
      
      // Ejecutar el middleware
      csrfMiddleware(req, res, next);
      
      // Verificar que next fue llamado (middleware pasado)
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });
  });
  
  describe('generateCsrfToken', () => {
    test('debe generar un token CSRF con formato correcto', () => {
      // Aplicar mock solo para este test
      jest.spyOn(crypto, 'createHmac').mockReturnValue(mockHmac);
      
      // Generar token
      const token = generateCsrfToken('test-session-id');
      
      // Verificar que se usó crypto correctamente
      expect(crypto.createHmac).toHaveBeenCalledWith('sha256', 'test-csrf-secret');
      expect(mockHmac.update).toHaveBeenCalled();
      expect(mockHmac.digest).toHaveBeenCalledWith('hex');
      
      // Verificar formato del token
      expect(token).toBe('mockedcsrftoken');
      
      // Restaurar el mock para los siguientes tests
      crypto.createHmac.mockRestore();
    });
    
    test('debe generar tokens diferentes para cada llamada', () => {
      // Para este test usamos la implementación real de crypto
      // Simulamos el comportamiento de Date.now() para que devuelva valores diferentes
      const originalDateNow = Date.now;
      try {
        let counter = 1;
        Date.now = jest.fn(() => counter++);
        
        const token1 = generateCsrfToken('session1');
        const token2 = generateCsrfToken('session1'); // Misma sesión, diferente momento
        
        // Verificar que los tokens son diferentes
        expect(token1).not.toBe(token2);
      } finally {
        // Restaurar Date.now
        Date.now = originalDateNow;
      }
    });
    
    test('debe generar tokens diferentes para sesiones diferentes', () => {
      // Para este test usamos la implementación real de crypto
      const token1 = generateCsrfToken('session1');
      const token2 = generateCsrfToken('session2');
      
      // Verificar que los tokens son diferentes
      expect(token1).not.toBe(token2);
    });
  });
}); 