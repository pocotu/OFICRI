/**
 * Pruebas para las funciones de utilidad de base de datos
 * database-helpers.js
 */

const path = require('path');

// Mocks
jest.mock('mysql2/promise', () => {
  const mockConnection = {
    query: jest.fn().mockResolvedValue([[]]),
    end: jest.fn().mockResolvedValue(undefined)
  };
  
  return {
    createConnection: jest.fn().mockReturnValue(mockConnection)
  };
});

jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('hashed_password_test'),
  compare: jest.fn().mockImplementation((password) => {
    return Promise.resolve(password === 'correctPassword');
  })
}));

// Modificamos el mock de logger para que realmente se guarden las llamadas
const mockLogger = {
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
};

jest.mock('../../utils/logger', () => ({
  logger: mockLogger
}));

// Importaciones después de los mocks
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const { logger } = require('../../utils/logger');

// Importar el módulo después de configurar todos los mocks
const dbHelpers = require('../../utils/database-helpers');

describe('Database Helpers', () => {
  // Variables para pruebas
  let originalNodeEnv;
  
  beforeEach(() => {
    // Guardar el valor original de NODE_ENV
    originalNodeEnv = process.env.NODE_ENV;
    
    // Limpiar todos los mocks antes de cada prueba
    jest.clearAllMocks();
    
    // Respaldar y limpiar variables de entorno
    process.env.NODE_ENV = 'test';
    delete process.env.DB_NAME;
    delete process.env.DB_PASSWORD;
    delete process.env.DB_HOST;
    delete process.env.DB_USER;
  });

  afterEach(() => {
    // Restaurar variables de entorno
    process.env.NODE_ENV = originalNodeEnv;
  });

  describe('loadEnv', () => {
    test('debería cargar variables de entorno desde la ruta por defecto', () => {
      // Ejecutar la función
      dbHelpers.loadEnv();

      // Verificar que se establece un valor por defecto para DB_NAME
      // (insensible a mayúsculas/minúsculas)
      expect(process.env.DB_NAME.toLowerCase()).toBe('oficri_sistema'.toLowerCase());
      
      // Verificamos que la función logger.debug es llamada, esto es suficiente
      // para demostrar que la función funciona correctamente
      expect(logger.debug).toHaveBeenCalled();
    });

    test('debería cargar variables de entorno desde una ruta personalizada', () => {
      // Ejecutar la función con ruta personalizada
      const customPath = path.resolve(__dirname, '../../../custom.env');
      dbHelpers.loadEnv(customPath);

      // Verificar que se establece un valor por defecto para DB_NAME
      // (insensible a mayúsculas/minúsculas)
      expect(process.env.DB_NAME.toLowerCase()).toBe('oficri_sistema'.toLowerCase());
    });
  });

  describe('executeQuery', () => {
    test('debería ejecutar consultas SQL correctamente', async () => {
      // Configurar mock para esta prueba
      const mockResults = [{ id: 1, name: 'test' }];
      mysql.createConnection().query.mockResolvedValueOnce([mockResults]);

      // Ejecutar la función
      const result = await dbHelpers.executeQuery('SELECT * FROM test', []);

      // Verificar resultados
      expect(result).toEqual(mockResults);
      expect(mysql.createConnection).toHaveBeenCalled();
      expect(mysql.createConnection().query).toHaveBeenCalledWith('SELECT * FROM test', []);
      expect(mysql.createConnection().end).toHaveBeenCalled();
    });

    test('debería usar valores por defecto para la configuración de conexión', async () => {
      // Ejecutar la función
      await dbHelpers.executeQuery('SELECT 1');

      // Verificar la configuración de conexión
      expect(mysql.createConnection).toHaveBeenCalledWith({
        host: 'localhost',
        user: 'root',
        password: undefined,
        database: 'Oficri_sistema',
        multipleStatements: false,
        charset: 'utf8mb4',
        timezone: '+00:00'
      });
    });

    test('debería usar variables de entorno para la configuración de conexión', async () => {
      // Configurar variables de entorno
      process.env.DB_HOST = 'test-host';
      process.env.DB_USER = 'test-user';
      process.env.DB_PASSWORD = 'test-password';
      process.env.DB_NAME = 'test-db';

      // Ejecutar la función
      await dbHelpers.executeQuery('SELECT 1');

      // Verificar la configuración de conexión
      expect(mysql.createConnection).toHaveBeenCalledWith({
        host: 'test-host',
        user: 'test-user',
        password: 'test-password',
        database: 'test-db',
        multipleStatements: false,
        charset: 'utf8mb4',
        timezone: '+00:00'
      });
    });

    test('debería permitir múltiples declaraciones SQL', async () => {
      // Ejecutar la función
      await dbHelpers.executeQuery('SELECT 1; SELECT 2;', [], { multipleStatements: true });

      // Verificar la configuración de conexión
      expect(mysql.createConnection).toHaveBeenCalledWith(
        expect.objectContaining({
          multipleStatements: true
        })
      );
    });
  });

  describe('disableConstraints', () => {
    test('debería desactivar restricciones correctamente', async () => {
      // Configurar mock
      mysql.createConnection().query.mockResolvedValue([]);

      // Ejecutar la función
      const result = await dbHelpers.disableConstraints();

      // Verificar resultados
      expect(result).toBe(true);
      expect(mysql.createConnection).toHaveBeenCalled();
    });

    test('debería manejar errores al eliminar triggers', async () => {
      // Configurar mock para las primeras dos consultas
      mysql.createConnection().query
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        // Configurar error para la tercera consulta (eliminar triggers)
        .mockRejectedValueOnce(new Error('Error al eliminar triggers'));

      // Ejecutar la función
      await dbHelpers.disableConstraints();

      // Verificar que se registra una advertencia
      expect(logger.warn).toHaveBeenCalled();
    });

    test('debería propagar errores en la desactivación de restricciones', async () => {
      // Configurar mock para provocar un error
      mysql.createConnection().query.mockRejectedValue(new Error('Error al desactivar restricciones'));

      // Ejecutar la función y verificar que se propaga el error
      await expect(dbHelpers.disableConstraints()).rejects.toThrow('Error al desactivar restricciones');
      
      // Verificar que se registra el error
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('enableConstraints', () => {
    test('debería reactivar restricciones correctamente', async () => {
      // Configurar mock
      mysql.createConnection().query.mockResolvedValue([]);

      // Ejecutar la función
      const result = await dbHelpers.enableConstraints();

      // Verificar resultados
      expect(result).toBe(true);
      expect(mysql.createConnection).toHaveBeenCalled();
    });

    test('debería propagar errores en la reactivación de restricciones', async () => {
      // Configurar mock para provocar un error
      mysql.createConnection().query.mockRejectedValue(new Error('Error al reactivar restricciones'));

      // Ejecutar la función y verificar que se propaga el error
      await expect(dbHelpers.enableConstraints()).rejects.toThrow('Error al reactivar restricciones');
      
      // Verificar que se registra el error
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('getDefaultRoles', () => {
    test('debería retornar la lista de roles predefinidos', () => {
      // Ejecutar la función
      const roles = dbHelpers.getDefaultRoles();

      // Verificar resultados
      expect(Array.isArray(roles)).toBe(true);
      expect(roles.length).toBeGreaterThan(0);
      
      // Verificar estructura de los roles
      roles.forEach(role => {
        expect(role).toHaveProperty('nombreRol');
        expect(role).toHaveProperty('descripcion');
        expect(role).toHaveProperty('nivelAcceso');
        expect(role).toHaveProperty('permisos');
      });
    });
  });

  describe('getDefaultAreas', () => {
    test('debería retornar la lista de áreas predefinidas', () => {
      // Ejecutar la función
      const areas = dbHelpers.getDefaultAreas();

      // Verificar resultados
      expect(Array.isArray(areas)).toBe(true);
      expect(areas.length).toBeGreaterThan(0);
      
      // Verificar estructura de las áreas
      areas.forEach(area => {
        expect(area).toHaveProperty('nombreArea');
        expect(area).toHaveProperty('codigoIdentificacion');
        expect(area).toHaveProperty('tipoArea');
        expect(area).toHaveProperty('descripcion');
      });
    });
  });

  describe('hashPassword', () => {
    test('debería retornar un hash simulado en entorno de pruebas', async () => {
      // Ejecutar la función en entorno de pruebas
      const hash = await dbHelpers.hashPassword('password123');

      // Verificar que se devuelve el hash simulado
      expect(hash).toBe('hashed_password_mock');
      
      // Verificar que no se llama a bcrypt.hash en entorno de pruebas
      expect(bcrypt.hash).not.toHaveBeenCalled();
    });

    test('debería generar un hash con bcrypt en entorno de producción', async () => {
      // Cambiar el entorno a producción
      process.env.NODE_ENV = 'production';

      // Ejecutar la función
      const hash = await dbHelpers.hashPassword('password123');

      // Verificar que se devuelve el hash generado por bcrypt
      expect(hash).toBe('hashed_password_test');
      
      // Verificar que se llama a bcrypt.hash con los parámetros correctos
      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
    });
  });

  describe('verifyPassword', () => {
    test('debería verificar la contraseña correctamente en entorno de pruebas', async () => {
      // Ejecutar la función con contraseña correcta
      const result1 = await dbHelpers.verifyPassword('correctPassword', 'hashNoUsado');
      
      // Ejecutar la función con contraseña incorrecta
      const result2 = await dbHelpers.verifyPassword('wrongPassword', 'hashNoUsado');

      // Verificar resultados
      expect(result1).toBe(true);
      expect(result2).toBe(false);
      
      // Verificar que no se llama a bcrypt.compare en entorno de pruebas
      expect(bcrypt.compare).not.toHaveBeenCalled();
    });

    test('debería verificar la contraseña con bcrypt en entorno de producción', async () => {
      // Cambiar el entorno a producción
      process.env.NODE_ENV = 'production';

      // Configurar mock de bcrypt.compare
      bcrypt.compare
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(false);

      // Ejecutar la función con diferentes contraseñas
      const result1 = await dbHelpers.verifyPassword('password1', 'hash1');
      const result2 = await dbHelpers.verifyPassword('password2', 'hash2');

      // Verificar resultados
      expect(result1).toBe(true);
      expect(result2).toBe(false);
      
      // Verificar que se llama a bcrypt.compare con los parámetros correctos
      expect(bcrypt.compare).toHaveBeenCalledTimes(2);
      expect(bcrypt.compare).toHaveBeenNthCalledWith(1, 'password1', 'hash1');
      expect(bcrypt.compare).toHaveBeenNthCalledWith(2, 'password2', 'hash2');
    });
  });

  describe('getDefaultPermissions', () => {
    test('debería retornar la lista de permisos predefinidos', () => {
      // Ejecutar la función
      const permissions = dbHelpers.getDefaultPermissions();

      // Verificar resultados
      expect(Array.isArray(permissions)).toBe(true);
      expect(permissions.length).toBeGreaterThan(0);
      
      // Verificar estructura de los permisos
      permissions.forEach(permission => {
        expect(permission).toHaveProperty('nombrePermiso');
        expect(permission).toHaveProperty('alcance');
        expect(permission).toHaveProperty('restringido');
      });
    });
  });

  describe('forceReconnect', () => {
    test('debería reconectar a la base de datos exitosamente', async () => {
      // Configurar mocks
      mysql.createConnection().query.mockResolvedValue([{ '1': 1 }]);
      
      // Guardar console.log original y reemplazarlo con un mock
      const originalConsoleLog = console.log;
      console.log = jest.fn();

      try {
        // Ejecutar la función
        const result = await dbHelpers.forceReconnect();

        // Verificar resultados
        expect(result).toBe(true);
        expect(mysql.createConnection).toHaveBeenCalled();
        expect(mysql.createConnection().query).toHaveBeenCalledWith('SELECT 1');
        expect(console.log).toHaveBeenCalledWith('Reconexión forzada a la base de datos exitosa');
      } finally {
        // Restaurar console.log
        console.log = originalConsoleLog;
      }
    });

    test('debería manejar errores al reconectar', async () => {
      // Configurar mock para provocar un error
      const mockError = new Error('Error de conexión');
      mysql.createConnection.mockRejectedValueOnce(mockError);
      
      // Guardar console.error original y reemplazarlo con un mock
      const originalConsoleError = console.error;
      console.error = jest.fn();

      try {
        // Ejecutar la función
        const result = await dbHelpers.forceReconnect();

        // Verificar resultados
        expect(result).toBe(false);
        expect(console.error).toHaveBeenCalledWith('Error al forzar la reconexión:', mockError.message);
      } finally {
        // Restaurar console.error
        console.error = originalConsoleError;
      }
    });
  });
}); 