/**
 * Tests para el servicio de autenticación
 * Pruebas unitarias para auth.service.js
 */

// Mock para dependencias
jest.mock('jsonwebtoken');
jest.mock('bcryptjs');
jest.mock('crypto');
jest.mock('../../config/database', () => {
  return {
    executeQuery: jest.fn(),
    closePool: jest.fn().mockResolvedValue(true)
  };
});
jest.mock('../../utils/logger', () => ({
  logger: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn()
  }
}));

// Importaciones
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { executeQuery } = require('../../config/database');
const authService = require('../../services/auth/auth.service');
const { logger } = require('../../utils/logger');

describe('Auth Service', () => {
  // Configuración previa a todas las pruebas
  beforeAll(() => {
    // Configurar variables de entorno
    process.env.JWT_SECRET = 'test-jwt-secret';
  });
  
  // Limpieza después de todas las pruebas
  afterAll(async () => {
    // Limpiar el mock de executeQuery para evitar fugas de memoria
    if (executeQuery.mockClear) {
      executeQuery.mockClear();
    }
    
    // Llamar explícitamente a closePool para cerrar conexiones
    const { closePool } = require('../../config/database');
    if (typeof closePool === 'function') {
      await closePool();
    }
    
    // Reestablecer los módulos mockeados
    jest.resetModules();
    
    // Asegurarse de que no quedan conexiones abiertas
    jest.resetAllMocks();
  });
  
  // Configuración antes de cada prueba
  beforeEach(() => {
    // Limpiar todos los mocks
    jest.clearAllMocks();
  });
  
  describe('login', () => {
    test('debe rechazar login sin credenciales', async () => {
      // Intentar login sin credenciales
      await expect(authService.login()).rejects.toThrow('CIP y contraseña son requeridos');
      await expect(authService.login('12345678')).rejects.toThrow('CIP y contraseña son requeridos');
      await expect(authService.login(null, 'password')).rejects.toThrow('CIP y contraseña son requeridos');
      
      // Verificar que no se consultó la base de datos
      expect(executeQuery).not.toHaveBeenCalled();
    });
    
    test('debe rechazar login para usuario no existente', async () => {
      // Simular que la consulta no retorna usuarios
      executeQuery.mockResolvedValueOnce([]);
      
      // Intentar login con usuario inexistente
      await expect(authService.login('inexistente', 'password')).rejects.toThrow('Credenciales incorrectas');
      
      // Verificar que se consultó la base de datos
      expect(executeQuery).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        expect.arrayContaining(['inexistente'])
      );
    });
    
    test('debe rechazar login con contraseña incorrecta', async () => {
      // Usuario mockado en la base de datos
      const mockUser = {
        IDUsuario: 1,
        CodigoCIP: '12345678',
        PasswordHash: 'hashed-password',
        IntentosFallidos: 0
      };
      
      // Simular que la consulta retorna un usuario
      executeQuery.mockResolvedValueOnce([mockUser]);
      
      // Simular que la verificación de contraseña falla
      bcrypt.compare.mockResolvedValueOnce(false);
      
      // Simular la actualización de intentos fallidos
      executeQuery.mockResolvedValueOnce({ affectedRows: 1 });
      
      // Intentar login con contraseña incorrecta
      await expect(authService.login('12345678', 'wrong-password')).rejects.toThrow('Credenciales incorrectas');
      
      // Verificar que se intentó verificar la contraseña
      expect(bcrypt.compare).toHaveBeenCalledWith('wrong-password', 'hashed-password');
      
      // Verificar que se actualizaron los intentos fallidos
      expect(executeQuery).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE Usuario'),
        expect.arrayContaining([1, false, 1])
      );
    });
    
    test('debe bloquear cuenta después de múltiples intentos fallidos', async () => {
      // Usuario mockado con varios intentos fallidos
      const mockUser = {
        IDUsuario: 1,
        CodigoCIP: '12345678',
        PasswordHash: 'hashed-password',
        IntentosFallidos: 4 // Un intento más llevará al bloqueo con MAX_ATTEMPTS = 5
      };
      
      // Sobrescribir la configuración de seguridad para la prueba
      const originalMaxAttempts = require('../../config/security').accountLockout.maxLoginAttempts;
      require('../../config/security').accountLockout.maxLoginAttempts = 5;
      
      // Simular que la consulta retorna un usuario
      executeQuery.mockResolvedValueOnce([mockUser]);
      
      // Simular que la verificación de contraseña falla
      bcrypt.compare.mockResolvedValueOnce(false);
      
      // Simular la actualización de intentos fallidos
      executeQuery.mockResolvedValueOnce({ affectedRows: 1 });
      
      // Intentar login con contraseña incorrecta
      await expect(authService.login('12345678', 'wrong-password')).rejects.toThrow('Demasiados intentos fallidos');
      
      // Verificar que se actualizaron los intentos fallidos y se bloqueó la cuenta
      expect(executeQuery).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE Usuario'),
        expect.arrayContaining([5, true, 1])
      );
      
      // Restaurar la configuración original
      require('../../config/security').accountLockout.maxLoginAttempts = originalMaxAttempts;
    });
    
    test('debe permitir login con credenciales correctas', async () => {
      // Usuario mockado en la base de datos
      const mockUser = {
        IDUsuario: 1,
        CodigoCIP: '12345678',
        Nombres: 'Usuario',
        Apellidos: 'Prueba',
        Grado: 'SUBOFICIAL',
        PasswordHash: 'hashed-password',
        IDArea: 1,
        IDRol: 2,
        NombreArea: 'SISTEMAS',
        NombreRol: 'USUARIO',
        Permisos: 15,
        UltimoAcceso: new Date(),
        IntentosFallidos: 0
      };
      
      // Simular que la consulta retorna un usuario
      executeQuery.mockResolvedValueOnce([mockUser]);
      
      // Simular que la verificación de contraseña es exitosa
      bcrypt.compare.mockResolvedValueOnce(true);
      
      // Simular la actualización de intentos fallidos
      executeQuery.mockResolvedValueOnce({ affectedRows: 1 });
      
      // Simular la generación de token JWT
      jwt.sign.mockReturnValueOnce('mock-jwt-token');
      
      // Simular la generación de refresh token
      crypto.randomBytes.mockReturnValueOnce({
        toString: jest.fn().mockReturnValue('mock-refresh-token')
      });
      
      // Simular que se guarda el refresh token
      executeQuery.mockResolvedValueOnce({ insertId: 1 });
      
      // Realizar login con credenciales correctas
      const result = await authService.login('12345678', 'correct-password');
      
      // Verificar que se verificó la contraseña
      expect(bcrypt.compare).toHaveBeenCalledWith('correct-password', 'hashed-password');
      
      // Verificar que se generó un token JWT
      expect(jwt.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          sub: 1,
          cip: '12345678',
          rol: 2,
          permisos: 15
        }),
        'test-jwt-secret',
        expect.any(Object)
      );
      
      // Verificar la respuesta
      expect(result).toEqual(expect.objectContaining({
        success: true,
        token: 'mock-jwt-token',
        refreshToken: 'mock-refresh-token',
        user: expect.objectContaining({
          IDUsuario: 1,
          CodigoCIP: '12345678',
          Nombres: 'Usuario',
          Apellidos: 'Prueba'
        })
      }));
    });
  });
  
  describe('verifyToken', () => {
    test('debe rechazar cuando no se proporciona token', async () => {
      await expect(authService.verifyToken()).rejects.toThrow('Token requerido');
      await expect(authService.verifyToken(null)).rejects.toThrow('Token requerido');
      await expect(authService.verifyToken('')).rejects.toThrow('Token requerido');
      
      expect(jwt.verify).not.toHaveBeenCalled();
    });
    
    test('debe rechazar token inválido', async () => {
      // Simular que el token es inválido
      jwt.verify.mockImplementation(() => {
        throw new Error('Token inválido');
      });
      
      await expect(authService.verifyToken('invalid-token')).rejects.toThrow('Token inválido');
      
      expect(jwt.verify).toHaveBeenCalledWith('invalid-token', 'test-jwt-secret');
    });
    
    test('debe rechazar token expirado', async () => {
      // Simular que el token está expirado
      const tokenExpiredError = new Error('Token expirado');
      tokenExpiredError.name = 'TokenExpiredError';
      jwt.verify.mockImplementation(() => {
        throw tokenExpiredError;
      });
      
      await expect(authService.verifyToken('expired-token')).rejects.toThrow('Token inválido o expirado');
      
      expect(jwt.verify).toHaveBeenCalledWith('expired-token', 'test-jwt-secret');
    });
    
    test('debe rechazar si el usuario no existe o está bloqueado', async () => {
      // Simular que el token es válido
      jwt.verify.mockReturnValueOnce({
        sub: 999, // ID de usuario inexistente
        cip: '12345678'
      });
      
      // Simular que no se encuentra el usuario
      executeQuery.mockResolvedValueOnce([]);
      
      await expect(authService.verifyToken('valid-token')).rejects.toThrow('Usuario no encontrado o bloqueado');
      
      expect(executeQuery).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        expect.arrayContaining([999])
      );
    });
    
    test('debe devolver información de usuario para token válido', async () => {
      // Simular que el token es válido
      jwt.verify.mockReturnValueOnce({
        sub: 1,
        cip: '12345678',
        rol: 2
      });
      
      // Simular que se encuentra el usuario
      const mockUser = {
        IDUsuario: 1,
        CodigoCIP: '12345678',
        Nombres: 'Usuario',
        Apellidos: 'Prueba',
        Grado: 'SUBOFICIAL',
        IDArea: 1,
        IDRol: 2,
        NombreRol: 'USUARIO',
        Permisos: 15
      };
      executeQuery.mockResolvedValueOnce([mockUser]);
      
      // Verificar token
      const result = await authService.verifyToken('valid-token');
      
      // Verificar que se verificó el token
      expect(jwt.verify).toHaveBeenCalledWith('valid-token', 'test-jwt-secret');
      
      // Verificar la respuesta
      expect(result).toEqual(expect.objectContaining({
        user: expect.objectContaining({
          IDUsuario: 1,
          CodigoCIP: '12345678',
          Nombres: 'Usuario',
          Apellidos: 'Prueba'
        }),
        token: expect.objectContaining({
          sub: 1,
          cip: '12345678',
          rol: 2
        })
      }));
    });
  });
  
  describe('validatePassword', () => {
    test('debe rechazar contraseñas demasiado cortas', () => {
      // Configurar longitud mínima
      const originalMinLength = require('../../config/security').passwordPolicy.minLength;
      require('../../config/security').passwordPolicy.minLength = 8;
      
      // Probar contraseñas demasiado cortas
      expect(() => authService.validatePassword('')).toThrow('al menos 8 caracteres');
      expect(() => authService.validatePassword('short')).toThrow('al menos 8 caracteres');
      
      // Restaurar configuración original
      require('../../config/security').passwordPolicy.minLength = originalMinLength;
    });
    
    test('debe rechazar contraseñas que no cumplen con los requisitos de complejidad', () => {
      // Configurar requisitos de complejidad
      const originalPolicy = { ...require('../../config/security').passwordPolicy };
      const securityConfig = require('../../config/security').passwordPolicy;
      securityConfig.requireUppercase = true;
      securityConfig.requireLowercase = true;
      securityConfig.requireNumbers = true;
      securityConfig.requireSpecialChars = true;
      
      // Probar contraseñas sin mayúsculas
      expect(() => authService.validatePassword('password123!')).toThrow('al menos una mayúscula');
      
      // Probar contraseñas sin minúsculas
      expect(() => authService.validatePassword('PASSWORD123!')).toThrow('al menos una minúscula');
      
      // Probar contraseñas sin números
      expect(() => authService.validatePassword('Password!')).toThrow('al menos un número');
      
      // Probar contraseñas sin caracteres especiales
      expect(() => authService.validatePassword('Password123')).toThrow('al menos un carácter especial');
      
      // Restaurar configuración original
      Object.assign(require('../../config/security').passwordPolicy, originalPolicy);
    });
    
    test('debe aceptar contraseñas que cumplen con todos los requisitos', () => {
      // Configurar requisitos de complejidad
      const originalPolicy = { ...require('../../config/security').passwordPolicy };
      const securityConfig = require('../../config/security').passwordPolicy;
      securityConfig.minLength = 8;
      securityConfig.requireUppercase = true;
      securityConfig.requireLowercase = true;
      securityConfig.requireNumbers = true;
      securityConfig.requireSpecialChars = true;
      
      // No debería lanzar error
      expect(() => authService.validatePassword('Password123!')).not.toThrow();
      
      // Restaurar configuración original
      Object.assign(require('../../config/security').passwordPolicy, originalPolicy);
    });
  });
}); 