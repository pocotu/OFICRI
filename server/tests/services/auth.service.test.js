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
    
    test('debe desbloquear automáticamente una cuenta si el periodo de bloqueo ha expirado', async () => {
      // Fecha de bloqueo pasada (más allá del periodo de bloqueo)
      const pastDate = new Date();
      pastDate.setHours(pastDate.getHours() - 2); // 2 horas atrás
      
      // Usuario mockado con cuenta bloqueada
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
        IntentosFallidos: 5,
        Bloqueado: true,
        UltimoBloqueo: pastDate
      };
      
      // Sobrescribir la configuración de bloqueo para la prueba
      const originalLockoutDuration = require('../../config/security').accountLockout.lockoutDuration;
      require('../../config/security').accountLockout.lockoutDuration = 60 * 60 * 1000; // 1 hora en ms
      
      // Simular que la consulta retorna un usuario bloqueado
      executeQuery.mockResolvedValueOnce([mockUser]);
      
      // Simular que se desbloquea la cuenta
      executeQuery.mockResolvedValueOnce({ affectedRows: 1 });
      
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
      
      // Verificar que se intentó desbloquear la cuenta
      expect(executeQuery).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE Usuario'),
        expect.arrayContaining([1])
      );
      
      // Verificar que se generó un token
      expect(result).toHaveProperty('token', 'mock-jwt-token');
      
      // Restaurar configuración original
      require('../../config/security').accountLockout.lockoutDuration = originalLockoutDuration;
    });
    
    test('debe rechazar el login si la cuenta está bloqueada y el periodo no ha expirado', async () => {
      // Fecha de bloqueo reciente (dentro del periodo de bloqueo)
      const recentDate = new Date();
      recentDate.setMinutes(recentDate.getMinutes() - 5); // 5 minutos atrás
      
      // Usuario mockado con cuenta bloqueada
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
        IntentosFallidos: 5,
        Bloqueado: true,
        UltimoBloqueo: recentDate
      };
      
      // Sobrescribir la configuración de bloqueo para la prueba
      const originalLockoutDuration = require('../../config/security').accountLockout.lockoutDuration;
      require('../../config/security').accountLockout.lockoutDuration = 30 * 60 * 1000; // 30 minutos en ms
      
      // Simular que la consulta retorna un usuario bloqueado
      executeQuery.mockResolvedValueOnce([mockUser]);
      
      // Intentar login con cuenta bloqueada
      await expect(authService.login('12345678', 'correct-password'))
        .rejects.toThrow('Cuenta bloqueada. Intente nuevamente en');
      
      // No debería intentar verificar la contraseña
      expect(bcrypt.compare).not.toHaveBeenCalled();
      
      // Restaurar configuración original
      require('../../config/security').accountLockout.lockoutDuration = originalLockoutDuration;
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
    
    test('debe propagar otros errores durante la verificación del token', async () => {
      // Simular un error genérico durante la verificación
      const genericError = new Error('Error de base de datos');
      jwt.verify.mockReturnValueOnce({
        sub: 1,
        cip: '12345678'
      });
      
      // Simular error en la consulta a la base de datos
      executeQuery.mockRejectedValueOnce(genericError);
      
      // Verificar que se propaga el error
      await expect(authService.verifyToken('valid-token')).rejects.toThrow('Error de base de datos');
      
      // Verificar que se registró el error
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('Error en verifyToken'),
        expect.any(Object)
      );
    });
    
    test('debe manejar errores específicos al verificar token', async () => {
      // Simulamos que el token es válido pero no tiene la propiedad sub
      const malformedToken = new Error('Token malformado');
      malformedToken.name = 'OtherTokenError';
      
      jwt.verify.mockImplementationOnce(() => {
        throw malformedToken;
      });
      
      // Verificar que se lanza el error modificado
      await expect(authService.verifyToken('invalid-format-token')).rejects.toThrow('Token malformado');
      
      // Verificar que se registró el error
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('Error en verifyToken'),
        expect.any(Object)
      );
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
  
  describe('resetPassword', () => {
    test('debe retornar falso cuando hay problemas para verificar el token', async () => {
      // Simular que el token no existe o es inválido
      jest.spyOn(authService, 'verifyPasswordResetToken').mockResolvedValueOnce(null);
      
      // Intentar resetear la contraseña
      const result = await authService.resetPassword('invalid-token', 'newSecurePassword');
      
      // Verificar que falla correctamente
      expect(result).toBe(false);
    });
  });
  
  describe('requestPasswordReset', () => {
    test('debe siempre retornar éxito por razones de seguridad, incluso para email inexistente', async () => {
      // Simular que la consulta no encuentra el usuario
      executeQuery.mockResolvedValueOnce([]);
      
      // Solicitar reseteo para email inexistente
      const result = await authService.requestPasswordReset('noexiste@example.com');
      
      // Verificar que devuelve un mensaje de "éxito" incluso si no existe
      expect(result).toEqual({
        success: true,
        message: expect.stringContaining('Si el usuario existe')
      });
      
      // Verificar consulta a la base de datos
      expect(executeQuery).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        expect.arrayContaining(['noexiste@example.com'])
      );
    });
    
    test('debe generar token de recuperación exitosamente', async () => {
      // Simular usuario encontrado
      executeQuery.mockResolvedValueOnce([{
        IDUsuario: 1,
        CodigoCIP: 'usuario@example.com',
        Nombres: 'Usuario',
        Apellidos: 'Prueba'
      }]);
      
      // Simular generación de token único
      crypto.randomBytes.mockImplementation((size) => {
        return {
          toString: () => 'generated-token-123456'
        };
      });
      
      // Simular creación de nuevo token
      executeQuery.mockResolvedValueOnce({ insertId: 1 });
      
      // Guardar entorno original
      const originalEnv = process.env.NODE_ENV;
      
      // Simular entorno de desarrollo para ver el token en la respuesta
      process.env.NODE_ENV = 'development';
      
      // Solicitar reseteo de contraseña
      const result = await authService.requestPasswordReset('usuario@example.com');
      
      // Restaurar entorno
      process.env.NODE_ENV = originalEnv;
      
      // Verificar que se consultó el usuario
      expect(executeQuery).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        expect.arrayContaining(['usuario@example.com'])
      );
      
      // Verificar que se creó un nuevo token
      expect(executeQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO'),
        expect.arrayContaining([1, 'generated-token-123456', expect.any(Date)])
      );
      
      // Verificar resultado exitoso
      expect(result).toEqual(expect.objectContaining({
        success: true,
        message: expect.stringContaining('Se ha enviado')
      }));
      
      // En entorno de desarrollo, debería incluir el token
      if (originalEnv !== 'production') {
        expect(result).toHaveProperty('resetToken', 'generated-token-123456');
      }
    });
  });
  
  describe('refreshToken', () => {
    test('debe rechazar cuando no se proporciona token de refresco', async () => {
      // Intentar renovar token sin token de refresco
      await expect(authService.refreshToken(null)).rejects.toThrow('Token de refresco requerido');
      
      // Verificar que no se consultó la base de datos
      expect(executeQuery).not.toHaveBeenCalled();
    });
    
    test('debe rechazar cuando el token de refresco no existe en la base de datos', async () => {
      // Simular que la consulta no encuentra el token de refresco
      executeQuery.mockResolvedValueOnce([]);
      
      // Intentar renovar con token inexistente
      await expect(authService.refreshToken('non-existent-refresh-token')).rejects.toThrow('Token de refresco inválido o expirado');
      
      // Verificar consulta a la base de datos
      expect(executeQuery).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        expect.arrayContaining(['non-existent-refresh-token'])
      );
    });
    
    test('debe renovar tokens exitosamente', async () => {
      // Fecha futura para un token válido
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7); // 7 días en el futuro
      
      // Simular que la consulta retorna una sesión válida
      executeQuery.mockResolvedValueOnce([{
        IDSession: 1,
        IDUsuario: 1,
        FechaInicio: new Date(),
        Expiracion: futureDate,
        CodigoCIP: '12345678',
        IDRol: 2,
        Permisos: ['READ', 'WRITE']
      }]);
      
      // Simular generación de nuevos tokens
      jwt.sign.mockReturnValueOnce('new-access-token');
      
      // Simular la generación de token aleatorio
      crypto.randomBytes.mockReturnValueOnce({
        toString: jest.fn().mockReturnValue('new-refresh-token')
      });
      
      // Simular actualización de sesión
      executeQuery.mockResolvedValueOnce({ affectedRows: 1 });
      
      // Renovar tokens
      const result = await authService.refreshToken('valid-refresh-token');
      
      // Verificar que se generó el nuevo token JWT
      expect(jwt.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          sub: 1,
          cip: '12345678',
          rol: 2,
          permisos: ['READ', 'WRITE']
        }),
        process.env.JWT_SECRET,
        expect.objectContaining({
          expiresIn: expect.any(String)
        })
      );
      
      // Verificar que se actualizó la sesión
      expect(executeQuery).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE Session'),
        expect.arrayContaining([expect.any(String), expect.any(Date), 1])
      );
      
      // Verificar resultado exitoso
      expect(result).toEqual(expect.objectContaining({
        success: true,
        token: 'new-access-token',
        refreshToken: expect.any(String)
      }));
    });
  });

  describe('logout', () => {
    test('debe manejar caso sin tokens', async () => {
      const result = await authService.logout();
      
      expect(result).toEqual({
        success: true,
        message: 'Sesión cerrada'
      });
      
      expect(executeQuery).not.toHaveBeenCalled();
    });
    
    test('debe invalidar refresh token', async () => {
      // Simular eliminación de token de refresco
      executeQuery.mockResolvedValueOnce({ affectedRows: 1 });
      
      const result = await authService.logout(null, 'valid-refresh-token');
      
      expect(result).toEqual({
        success: true,
        message: 'Sesión cerrada correctamente'
      });
      
      expect(executeQuery).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM Session'),
        expect.arrayContaining(['valid-refresh-token'])
      );
    });
    
    test('debe manejar JWT token inválido', async () => {
      // Simular un error en la verificación de JWT
      jwt.verify.mockImplementationOnce(() => {
        throw new Error('Invalid token');
      });
      
      const result = await authService.logout('invalid-jwt-token', null);
      
      expect(result).toEqual({
        success: true,
        message: 'Sesión cerrada correctamente'
      });
      
      expect(jwt.verify).toHaveBeenCalledWith('invalid-jwt-token', 'test-jwt-secret');
      expect(logger.warn).toHaveBeenCalled();
    });
    
    test('debe cerrar todas las sesiones del usuario si la configuración lo permite', async () => {
      // Guardar configuración original
      const originalEnv = process.env.LOGOUT_ALL_SESSIONS;
      
      // Configurar para cerrar todas las sesiones
      process.env.LOGOUT_ALL_SESSIONS = 'true';
      
      // Simular token JWT válido
      jwt.verify.mockReturnValueOnce({
        sub: 1 // ID de usuario
      });
      
      // Simular eliminación de todas las sesiones
      executeQuery.mockResolvedValueOnce({ affectedRows: 3 });
      
      const result = await authService.logout('valid-jwt-token', null);
      
      expect(result).toEqual({
        success: true,
        message: 'Sesión cerrada correctamente'
      });
      
      expect(jwt.verify).toHaveBeenCalledWith('valid-jwt-token', 'test-jwt-secret');
      expect(executeQuery).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM Session'),
        expect.arrayContaining([1])
      );
      
      // Restaurar configuración original
      process.env.LOGOUT_ALL_SESSIONS = originalEnv;
    });
  });

  describe('changePassword', () => {
    test('debe fallar si el usuario no existe', async () => {
      // Simular que no se encuentra el usuario
      executeQuery.mockResolvedValueOnce([]);
      
      const result = await authService.changePassword(999, 'oldPassword', 'newPassword');
      
      expect(result).toBe(false);
      expect(logger.warn).toHaveBeenCalled();
    });
    
    test('debe fallar si la contraseña actual es incorrecta', async () => {
      // Simular usuario encontrado
      executeQuery.mockResolvedValueOnce([{
        IDUsuario: 1,
        passwordHash: 'hashed-old-password'
      }]);
      
      // Simular verificación de contraseña fallida
      bcrypt.compare.mockResolvedValueOnce(false);
      
      const result = await authService.changePassword(1, 'wrongOldPassword', 'newPassword');
      
      expect(result).toBe(false);
      expect(bcrypt.compare).toHaveBeenCalledWith('wrongOldPassword', 'hashed-old-password');
      expect(logger.warn).toHaveBeenCalled();
    });
    
    test('debe cambiar la contraseña exitosamente', async () => {
      // Simular usuario encontrado
      executeQuery.mockResolvedValueOnce([{
        IDUsuario: 1,
        passwordHash: 'hashed-old-password'
      }]);
      
      // Simular verificación de contraseña exitosa
      bcrypt.compare.mockResolvedValueOnce(true);
      
      // Simular generación de hash
      const originalHash = bcrypt.hash;
      bcrypt.hash = jest.fn().mockResolvedValue('hashed-new-password');
      
      // Simular actualización en la base de datos
      executeQuery.mockResolvedValueOnce({ affectedRows: 1 });
      
      const result = await authService.changePassword(1, 'correctOldPassword', 'newStrongPassword123!');
      
      expect(result).toBe(true);
      expect(bcrypt.hash).toHaveBeenCalledWith('newStrongPassword123!', 10);
      expect(executeQuery).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE Usuario'),
        expect.arrayContaining(['hashed-new-password', 1])
      );
      
      // Restaurar función original
      bcrypt.hash = originalHash;
    });
    
    test('debe manejar errores durante el cambio de contraseña', async () => {
      // Simular usuario encontrado
      executeQuery.mockResolvedValueOnce([{
        IDUsuario: 1,
        passwordHash: 'hashed-old-password'
      }]);
      
      // Simular verificación de contraseña exitosa
      bcrypt.compare.mockResolvedValueOnce(true);
      
      // Simular error en generación de hash
      const originalHash = bcrypt.hash;
      bcrypt.hash = jest.fn().mockRejectedValue(new Error('Hash error'));
      
      const result = await authService.changePassword(1, 'correctOldPassword', 'newStrongPassword123!');
      
      expect(result).toBe(false);
      expect(logger.error).toHaveBeenCalled();
      
      // Restaurar función original
      bcrypt.hash = originalHash;
    });
  });

  describe('getUserByCIP', () => {
    test('debe retornar null si el usuario no existe', async () => {
      // Simular que no se encuentra el usuario
      executeQuery.mockResolvedValueOnce([]);
      
      const result = await authService.getUserByCIP('nonexistent');
      
      expect(result).toBeNull();
      expect(executeQuery).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        expect.arrayContaining(['nonexistent'])
      );
    });
    
    test('debe retornar datos de usuario si existe', async () => {
      // Simular usuario encontrado
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
        UltimoAcceso: new Date()
      };
      
      executeQuery.mockResolvedValueOnce([mockUser]);
      
      const result = await authService.getUserByCIP('12345678');
      
      expect(result).toEqual(expect.objectContaining({
        IDUsuario: 1,
        CodigoCIP: '12345678',
        Nombres: 'Usuario',
        Apellidos: 'Prueba'
      }));
      
      expect(executeQuery).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        expect.arrayContaining(['12345678'])
      );
    });
    
    test('debe manejar errores en la consulta', async () => {
      // Simular error en la consulta
      executeQuery.mockRejectedValueOnce(new Error('Database error'));
      
      await expect(authService.getUserByCIP('12345678')).rejects.toThrow('Database error');
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('updatePassword', () => {
    test('debe actualizar la contraseña exitosamente', async () => {
      // Simular generación de hash
      const originalHash = bcrypt.hash;
      bcrypt.hash = jest.fn().mockResolvedValue('new-hashed-password');
      
      // Simular actualización en la base de datos
      executeQuery.mockResolvedValueOnce({ affectedRows: 1 });
      
      const result = await authService.updatePassword(1, 'newSecurePassword123!');
      
      expect(result).toBe(true);
      expect(bcrypt.hash).toHaveBeenCalledWith('newSecurePassword123!', 10);
      expect(executeQuery).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE Usuario'),
        expect.arrayContaining(['new-hashed-password', 1])
      );
      
      // Restaurar función original
      bcrypt.hash = originalHash;
    });
    
    test('debe manejar errores durante la actualización', async () => {
      // Simular error en la generación de hash
      const originalHash = bcrypt.hash;
      bcrypt.hash = jest.fn().mockRejectedValue(new Error('Hash error'));
      
      const result = await authService.updatePassword(1, 'newPassword');
      
      expect(result).toBe(false);
      expect(logger.error).toHaveBeenCalled();
      
      // Restaurar función original
      bcrypt.hash = originalHash;
    });
  });

  describe('checkUserExists', () => {
    test('debe retornar true si el usuario existe', async () => {
      // Simular que se encuentra el usuario
      executeQuery.mockResolvedValueOnce([{ IDUsuario: 1 }]);
      
      const result = await authService.checkUserExists('12345678');
      
      expect(result).toBe(true);
      expect(executeQuery).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        expect.arrayContaining(['12345678'])
      );
    });
    
    test('debe retornar false si el usuario no existe', async () => {
      // Simular que no se encuentra el usuario
      executeQuery.mockResolvedValueOnce([]);
      
      const result = await authService.checkUserExists('nonexistent');
      
      expect(result).toBe(false);
      expect(executeQuery).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        expect.arrayContaining(['nonexistent'])
      );
    });
    
    test('debe manejar errores en la consulta', async () => {
      // Simular error en la consulta
      executeQuery.mockRejectedValueOnce(new Error('Database error'));
      
      await expect(authService.checkUserExists('12345678')).rejects.toThrow('Database error');
      expect(logger.error).toHaveBeenCalled();
    });
    
    test('debe manejar errores específicos en la comprobación de existencia', async () => {
      // Simular un error específico que activa el catch pero no el bloque de código específico
      const specificError = new Error('Error específico en base de datos');
      specificError.code = 'SPECIFIC_ERROR';
      executeQuery.mockRejectedValueOnce(specificError);
      
      // Verificar que se propaga correctamente
      await expect(authService.checkUserExists('test-user')).rejects.toThrow('Error específico en base de datos');
      
      // Verificar que se registró correctamente
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('Error al verificar existencia de usuario'),
        expect.any(Object)
      );
    });
  });

  describe('registerUser', () => {
    test('debe registrar un nuevo usuario exitosamente', async () => {
      // Datos de usuario para registro
      const userData = {
        codigoCIP: '87654321',
        nombres: 'Nuevo',
        apellidos: 'Usuario',
        grado: 'OFICIAL',
        password: 'SecurePassword123!',
        idRol: 2,
        idArea: 3
      };
      
      // Mock para la validación de contraseña (simulamos que pasa)
      jest.spyOn(authService, 'validatePassword').mockImplementationOnce(() => true);
      
      // Mock para generar salt
      bcrypt.genSalt.mockResolvedValueOnce('salt');
      
      // Mock para hash de contraseña
      bcrypt.hash.mockResolvedValueOnce('hashed-password');
      
      // Mock para inserción en base de datos
      executeQuery.mockResolvedValueOnce({ insertId: 10 });
      
      const result = await authService.registerUser(userData);
      
      expect(result).toEqual({
        success: true,
        userId: 10
      });
      
      expect(bcrypt.hash).toHaveBeenCalledWith(userData.password, 'salt');
      expect(executeQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO Usuario'),
        expect.arrayContaining([
          userData.codigoCIP,
          userData.nombres,
          userData.apellidos,
          userData.grado,
          'hashed-password',
          userData.idArea,
          userData.idRol
        ])
      );
    });
    
    test('debe rechazar contraseñas que no cumplen con la política', async () => {
      // Datos de usuario con contraseña débil
      const userData = {
        codigoCIP: '87654321',
        nombres: 'Nuevo',
        apellidos: 'Usuario',
        grado: 'OFICIAL',
        password: 'weak',
        idRol: 2,
        idArea: 3
      };
      
      // Mock para la validación de contraseña (simulamos que falla)
      jest.spyOn(authService, 'validatePassword').mockImplementationOnce(() => {
        throw new Error('La contraseña debe tener al menos 8 caracteres');
      });
      
      await expect(authService.registerUser(userData)).rejects.toThrow('al menos 8 caracteres');
      
      // Verificar que no se intentó hacer hash ni consultar la base de datos
      expect(bcrypt.hash).not.toHaveBeenCalled();
      expect(executeQuery).not.toHaveBeenCalled();
    });
    
    test('debe rechazar CIP duplicados', async () => {
      // Datos de usuario con CIP existente
      const userData = {
        codigoCIP: '12345678', // CIP que ya existe
        nombres: 'Duplicado',
        apellidos: 'Usuario',
        grado: 'OFICIAL',
        password: 'SecurePassword123!',
        idRol: 2,
        idArea: 3
      };
      
      // Mock para la validación de contraseña (simulamos que pasa)
      jest.spyOn(authService, 'validatePassword').mockImplementationOnce(() => true);
      
      // Mock para generar salt
      bcrypt.genSalt.mockResolvedValueOnce('salt');
      
      // Mock para hash de contraseña
      bcrypt.hash.mockResolvedValueOnce('hashed-password');
      
      // Simular error de duplicidad
      const duplicateError = new Error('Duplicate entry');
      duplicateError.code = 'ER_DUP_ENTRY';
      executeQuery.mockRejectedValueOnce(duplicateError);
      
      await expect(authService.registerUser(userData)).rejects.toThrow('El código CIP ya está registrado');
      
      expect(bcrypt.hash).toHaveBeenCalledWith(userData.password, 'salt');
      expect(executeQuery).toHaveBeenCalled();
    });
    
    test('debe manejar otros errores durante el registro', async () => {
      // Datos de usuario válidos
      const userData = {
        codigoCIP: '87654321',
        nombres: 'Nuevo',
        apellidos: 'Usuario',
        grado: 'OFICIAL',
        password: 'SecurePassword123!',
        idRol: 2,
        idArea: 3
      };
      
      // Mock para la validación de contraseña (simulamos que pasa)
      jest.spyOn(authService, 'validatePassword').mockImplementationOnce(() => true);
      
      // Mock para generar salt
      bcrypt.genSalt.mockResolvedValueOnce('salt');
      
      // Mock para hash de contraseña
      bcrypt.hash.mockResolvedValueOnce('hashed-password');
      
      // Simular otro tipo de error
      executeQuery.mockRejectedValueOnce(new Error('Database error'));
      
      await expect(authService.registerUser(userData)).rejects.toThrow('Database error');
      
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('blockUser', () => {
    test('debe rechazar bloquear la propia cuenta', async () => {
      await expect(authService.blockUser(1, 1)).rejects.toThrow('No puede bloquear su propia cuenta');
      
      expect(executeQuery).not.toHaveBeenCalled();
    });
    
    test('debe rechazar si el usuario no existe', async () => {
      // Simular que no se encuentra el usuario
      executeQuery.mockResolvedValueOnce([]);
      
      await expect(authService.blockUser(999, 1)).rejects.toThrow('Usuario no encontrado');
      
      expect(executeQuery).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        expect.arrayContaining([999])
      );
    });
    
    test('debe retornar éxito si el usuario ya está bloqueado', async () => {
      // Simular usuario ya bloqueado
      executeQuery.mockResolvedValueOnce([{
        IDUsuario: 2,
        CodigoCIP: '87654321',
        Bloqueado: true,
        IDRol: 2
      }]);
      
      const result = await authService.blockUser(2, 1);
      
      expect(result).toEqual({
        success: true,
        message: 'El usuario ya estaba bloqueado'
      });
      
      // No debería intentar actualizar
      expect(executeQuery).toHaveBeenCalledTimes(1);
    });
    
    test('debe rechazar bloquear usuarios administradores', async () => {
      // Simular usuario administrador
      executeQuery.mockResolvedValueOnce([{
        IDUsuario: 2,
        CodigoCIP: '87654321',
        Bloqueado: false,
        IDRol: 1 // Rol de administrador
      }]);
      
      await expect(authService.blockUser(2, 1)).rejects.toThrow('No se puede bloquear un usuario administrador');
      
      expect(executeQuery).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        expect.arrayContaining([2])
      );
    });
    
    test('debe bloquear usuario exitosamente', async () => {
      // Simular usuario válido para bloquear
      executeQuery.mockResolvedValueOnce([{
        IDUsuario: 2,
        CodigoCIP: '87654321',
        Bloqueado: false,
        IDRol: 2
      }]);
      
      // Simular actualización en la base de datos
      executeQuery.mockResolvedValueOnce({ affectedRows: 1 });
      
      // Simular eliminación de sesiones
      executeQuery.mockResolvedValueOnce({ affectedRows: 2 });
      
      const result = await authService.blockUser(2, 1);
      
      expect(result).toEqual({
        success: true,
        message: 'Usuario bloqueado correctamente'
      });
      
      // Verificar actualización del usuario
      expect(executeQuery).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE Usuario'),
        expect.arrayContaining([2])
      );
      
      // Verificar eliminación de sesiones
      expect(executeQuery).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM Session'),
        expect.arrayContaining([2])
      );
    });
    
    test('debe manejar errores durante el bloqueo', async () => {
      // Simular usuario válido para bloquear
      executeQuery.mockResolvedValueOnce([{
        IDUsuario: 2,
        CodigoCIP: '87654321',
        Bloqueado: false,
        IDRol: 2
      }]);
      
      // Simular error en la actualización
      executeQuery.mockRejectedValueOnce(new Error('Database error'));
      
      await expect(authService.blockUser(2, 1)).rejects.toThrow('Database error');
      
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('unblockUser', () => {
    test('debe rechazar si el usuario no existe', async () => {
      // Simular que no se encuentra el usuario
      executeQuery.mockResolvedValueOnce([]);
      
      await expect(authService.unblockUser(999, 1)).rejects.toThrow('Usuario no encontrado');
      
      expect(executeQuery).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        expect.arrayContaining([999])
      );
    });
    
    test('debe retornar éxito si el usuario ya está desbloqueado', async () => {
      // Simular usuario ya desbloqueado
      executeQuery.mockResolvedValueOnce([{
        IDUsuario: 2,
        CodigoCIP: '87654321',
        Bloqueado: false
      }]);
      
      const result = await authService.unblockUser(2, 1);
      
      expect(result).toEqual({
        success: true,
        message: 'El usuario ya estaba desbloqueado'
      });
      
      // No debería intentar actualizar
      expect(executeQuery).toHaveBeenCalledTimes(1);
    });
    
    test('debe desbloquear usuario exitosamente', async () => {
      // Simular usuario bloqueado
      executeQuery.mockResolvedValueOnce([{
        IDUsuario: 2,
        CodigoCIP: '87654321',
        Bloqueado: true
      }]);
      
      // Simular actualización en la base de datos
      executeQuery.mockResolvedValueOnce({ affectedRows: 1 });
      
      const result = await authService.unblockUser(2, 1);
      
      expect(result).toEqual({
        success: true,
        message: 'Usuario desbloqueado correctamente'
      });
      
      // Verificar actualización del usuario
      expect(executeQuery).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE Usuario'),
        expect.arrayContaining([2])
      );
    });
    
    test('debe manejar errores durante el desbloqueo', async () => {
      // Simular usuario bloqueado
      executeQuery.mockResolvedValueOnce([{
        IDUsuario: 2,
        CodigoCIP: '87654321',
        Bloqueado: true
      }]);
      
      // Simular error en la actualización
      executeQuery.mockRejectedValueOnce(new Error('Database error'));
      
      await expect(authService.unblockUser(2, 1)).rejects.toThrow('Database error');
      
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('getActiveSessions', () => {
    test('debe retornar lista de sesiones activas', async () => {
      // Simular sesiones activas
      const mockSessions = [
        {
          IDSession: 1,
          FechaInicio: new Date(),
          UltimoAcceso: new Date(),
          Expiracion: new Date(Date.now() + 3600000),
          IPOrigen: '192.168.1.1'
        },
        {
          IDSession: 2,
          FechaInicio: new Date(),
          UltimoAcceso: new Date(),
          Expiracion: new Date(Date.now() + 7200000),
          IPOrigen: '192.168.1.2'
        }
      ];
      
      executeQuery.mockResolvedValueOnce(mockSessions);
      
      const result = await authService.getActiveSessions(1);
      
      expect(result).toEqual(mockSessions);
      expect(executeQuery).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        expect.arrayContaining([1])
      );
    });
    
    test('debe manejar errores al obtener sesiones', async () => {
      // Simular error en la consulta
      executeQuery.mockRejectedValueOnce(new Error('Database error'));
      
      await expect(authService.getActiveSessions(1)).rejects.toThrow('Database error');
      
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('closeAllSessions', () => {
    test('debe cerrar todas las sesiones de un usuario', async () => {
      // Simular eliminación de sesiones
      executeQuery.mockResolvedValueOnce({ affectedRows: 3 });
      
      const result = await authService.closeAllSessions(1);
      
      expect(result).toEqual({
        success: true,
        message: 'Sesiones cerradas correctamente',
        count: 3
      });
      
      expect(executeQuery).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM Session'),
        expect.arrayContaining([1])
      );
    });
    
    test('debe manejar errores al cerrar sesiones', async () => {
      // Simular error en la consulta
      executeQuery.mockRejectedValueOnce(new Error('Database error'));
      
      await expect(authService.closeAllSessions(1)).rejects.toThrow('Database error');
      
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('Funciones auxiliares', () => {
    // Omitir pruebas detalladas de funciones auxiliares expuestas solo para testing
    test('mapUsuarioResponse debe mapear correctamente', () => {
      const user = {
        IDUsuario: 1,
        CodigoCIP: '12345678',
        Nombres: 'Juan',
        Apellidos: 'Pérez',
        Grado: 'OFICIAL',
        IDArea: 2,
        NombreArea: 'Sistemas',
        IDRol: 3,
        NombreRol: 'Tecnico',
        Permisos: 'READ,WRITE',
        UltimoAcceso: '2023-01-01',
        PasswordHash: 'hash-secreto'
      };
      
      const mapped = authService.mapUsuarioResponse(user);
      
      expect(mapped).toEqual({
        IDUsuario: 1,
        CodigoCIP: '12345678',
        Nombres: 'Juan',
        Apellidos: 'Pérez',
        Grado: 'OFICIAL',
        IDArea: 2,
        NombreArea: 'Sistemas',
        IDRol: 3,
        NombreRol: 'Tecnico',
        Permisos: 'READ,WRITE',
        UltimoAcceso: '2023-01-01',
        passwordHash: 'hash-secreto'
      });
    });
  });
}); 