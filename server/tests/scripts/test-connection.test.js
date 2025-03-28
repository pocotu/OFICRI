/**
 * Pruebas para test-connection.js
 * Verifica la funcionalidad del script que prueba la conexión a la base de datos
 */

// Mock modules
jest.mock('dotenv', () => ({
  config: jest.fn()
}));

jest.mock('path', () => ({
  resolve: jest.fn().mockReturnValue('/path/to/.env')
}));

// Mock de la función createConnection de mysql2/promise
jest.mock('mysql2/promise', () => {
  // Mock de connection.query para las pruebas
  const mockQuery = jest.fn();
  // Mock de connection.end para las pruebas
  const mockEnd = jest.fn().mockResolvedValue(undefined);
  
  // Mock createConnection para devolver la conexión
  return {
    createConnection: jest.fn().mockImplementation(() => {
      return Promise.resolve({
        query: mockQuery,
        end: mockEnd
      });
    })
  };
});

// Imports
const dotenv = require('dotenv');
const path = require('path');
const mysql = require('mysql2/promise');

// Spies para salidas de consola
const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation(() => {});
const mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

describe('test-connection.js Tests', () => {
  beforeEach(() => {
    // Limpiar mocks
    jest.clearAllMocks();
    
    // Configurar variables de entorno
    process.env.DB_HOST = 'localhost';
    process.env.DB_USER = 'testuser';
    process.env.DB_PASSWORD = 'testpass';
    process.env.DB_NAME = 'testdb';
  });
  
  afterAll(() => {
    mockConsoleLog.mockRestore();
    mockConsoleError.mockRestore();
  });
  
  test('debería conectarse correctamente y mostrar tablas', async () => {
    // Configurar mock para respuestas exitosas
    const connection = await mysql.createConnection();
    
    // Respuesta para consulta de prueba
    connection.query.mockResolvedValueOnce([[{ test: 1 }]]);
    
    // Respuesta para consulta de tablas
    connection.query.mockResolvedValueOnce([[
      { Tables_in_testdb: 'Usuario' },
      { Tables_in_testdb: 'Rol' },
      { Tables_in_testdb: 'AreaEspecializada' }
    ]]);
    
    // Ejecutar el script
    jest.isolateModules(() => {
      require('../../scripts/test-connection');
    });
    
    // Esperar a que terminen las promesas
    await new Promise(process.nextTick);
    
    // Verificar que se cargaron las variables de entorno
    expect(dotenv.config).toHaveBeenCalledWith({ path: '/path/to/.env' });
    
    // Verificar que se estableció la conexión con la base de datos
    expect(mysql.createConnection).toHaveBeenCalledWith({
      host: 'localhost',
      user: 'testuser',
      password: 'testpass',
      database: 'testdb'
    });
    
    // Verificar que se ejecutaron las consultas esperadas
    expect(connection.query).toHaveBeenCalledWith('SELECT 1 as test');
    expect(connection.query).toHaveBeenCalledWith('SHOW TABLES');
    
    // Verificar que se mostró el mensaje correcto
    expect(mockConsoleLog).toHaveBeenCalledWith('Conexión establecida exitosamente');
    
    // Verificar que se cerró la conexión
    expect(connection.end).toHaveBeenCalled();
  });
  
  test('debería manejar credenciales incorrectas', async () => {
    // Simular error de acceso denegado
    const accessError = new Error('Access denied for user');
    accessError.code = 'ER_ACCESS_DENIED_ERROR';
    mysql.createConnection.mockRejectedValueOnce(accessError);
    
    // Ejecutar el script
    jest.isolateModules(() => {
      require('../../scripts/test-connection');
    });
    
    // Esperar a que terminen las promesas
    await new Promise(process.nextTick);
    
    // Verificar que se mostró el mensaje de error
    expect(mockConsoleError).toHaveBeenCalledWith('Error en la conexión:', accessError.message);
    expect(mockConsoleError).toHaveBeenCalledWith('Credenciales de acceso incorrectas. Verifique usuario y contraseña.');
  });
  
  test('debería manejar errores de conexión rechazada', async () => {
    // Simular error de conexión rechazada
    const connError = new Error('Connection refused');
    connError.code = 'ECONNREFUSED';
    mysql.createConnection.mockRejectedValueOnce(connError);
    
    // Ejecutar el script
    jest.isolateModules(() => {
      require('../../scripts/test-connection');
    });
    
    // Esperar a que terminen las promesas
    await new Promise(process.nextTick);
    
    // Verificar que se mostró el mensaje de error
    expect(mockConsoleError).toHaveBeenCalledWith('Error en la conexión:', connError.message);
    expect(mockConsoleError).toHaveBeenCalledWith('No se pudo conectar al servidor MySQL. Verifique que el servidor esté en ejecución.');
  });
  
  test('debería manejar errores de base de datos inexistente', async () => {
    // Simular error de base de datos inexistente
    const dbError = new Error('Unknown database');
    dbError.code = 'ER_BAD_DB_ERROR';
    mysql.createConnection.mockRejectedValueOnce(dbError);
    
    // Ejecutar el script
    jest.isolateModules(() => {
      require('../../scripts/test-connection');
    });
    
    // Esperar a que terminen las promesas
    await new Promise(process.nextTick);
    
    // Verificar que se mostró el mensaje de error
    expect(mockConsoleError).toHaveBeenCalledWith('Error en la conexión:', dbError.message);
    expect(mockConsoleError).toHaveBeenCalledWith('La base de datos no existe. Necesita crearla primero.');
  });
  
  test('debería manejar errores genéricos de conexión', async () => {
    // Simular error genérico
    const genericError = new Error('Generic error');
    mysql.createConnection.mockRejectedValueOnce(genericError);
    
    // Ejecutar el script
    jest.isolateModules(() => {
      require('../../scripts/test-connection');
    });
    
    // Esperar a que terminen las promesas
    await new Promise(process.nextTick);
    
    // Verificar que se mostró el mensaje de error
    expect(mockConsoleError).toHaveBeenCalledWith('Error en la conexión:', genericError.message);
  });
}); 