/**
 * Pruebas para check-tables.js
 * Verifica la funcionalidad del script que examina la estructura de todas las tablas
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
const mockProcessExit = jest.spyOn(process, 'exit').mockImplementation(() => {});

describe('check-tables.js Tests', () => {
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
    mockProcessExit.mockRestore();
  });
  
  test('debería verificar correctamente la estructura de múltiples tablas', async () => {
    // Configurar mocks para las consultas
    const connection = await mysql.createConnection();
    
    // Mock para obtener todas las tablas
    connection.query.mockResolvedValueOnce([[
      { 'Tables_in_testdb': 'Usuario' },
      { 'Tables_in_testdb': 'Rol' },
      { 'Tables_in_testdb': 'AreaEspecializada' }
    ]]);
    
    // Mock para la estructura de la tabla 'Usuario'
    connection.query.mockResolvedValueOnce([[
      { Field: 'IDUsuario', Type: 'int(11)', Null: 'NO', Key: 'PRI', Default: null, Extra: 'auto_increment' },
      { Field: 'CodigoCIP', Type: 'varchar(8)', Null: 'NO', Key: '', Default: null, Extra: '' },
      { Field: 'Nombres', Type: 'varchar(100)', Null: 'NO', Key: '', Default: null, Extra: '' }
    ]]);
    
    // Mock para la estructura de la tabla 'Rol'
    connection.query.mockResolvedValueOnce([[
      { Field: 'IDRol', Type: 'int(11)', Null: 'NO', Key: 'PRI', Default: null, Extra: 'auto_increment' },
      { Field: 'NombreRol', Type: 'varchar(50)', Null: 'NO', Key: '', Default: null, Extra: '' },
      { Field: 'NivelAcceso', Type: 'int(11)', Null: 'NO', Key: '', Default: null, Extra: '' }
    ]]);
    
    // Mock para la estructura de la tabla 'AreaEspecializada'
    connection.query.mockResolvedValueOnce([[
      { Field: 'IDArea', Type: 'int(11)', Null: 'NO', Key: 'PRI', Default: null, Extra: 'auto_increment' },
      { Field: 'NombreArea', Type: 'varchar(100)', Null: 'NO', Key: '', Default: null, Extra: '' },
      { Field: 'CodigoIdentificacion', Type: 'varchar(10)', Null: 'NO', Key: '', Default: null, Extra: '' }
    ]]);
    
    // Ejecutar el script
    jest.isolateModules(() => {
      require('../../scripts/check-tables');
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
    expect(connection.query).toHaveBeenCalledTimes(4);
    expect(connection.query).toHaveBeenCalledWith('SHOW TABLES', []);
    expect(connection.query).toHaveBeenCalledWith('DESCRIBE Usuario', []);
    expect(connection.query).toHaveBeenCalledWith('DESCRIBE Rol', []);
    expect(connection.query).toHaveBeenCalledWith('DESCRIBE AreaEspecializada', []);
    
    // Verificar que se mostraron los resultados de cada tabla
    expect(mockConsoleLog).toHaveBeenCalledWith('=== VERIFICACIÓN DE ESTRUCTURA DE TABLAS ===');
    expect(mockConsoleLog).toHaveBeenCalledWith('\n-- ESTRUCTURA DE TABLA: Usuario --');
    expect(mockConsoleLog).toHaveBeenCalledWith('\n-- ESTRUCTURA DE TABLA: Rol --');
    expect(mockConsoleLog).toHaveBeenCalledWith('\n-- ESTRUCTURA DE TABLA: AreaEspecializada --');
    
    // Verificar que termina correctamente
    expect(mockProcessExit).toHaveBeenCalledWith(0);
  });
  
  test('debería manejar correctamente cuando no hay tablas', async () => {
    // Configurar mock para que no haya tablas
    const connection = await mysql.createConnection();
    
    // No hay tablas
    connection.query.mockResolvedValueOnce([[]]);
    
    // Ejecutar el script
    jest.isolateModules(() => {
      require('../../scripts/check-tables');
    });
    
    // Esperar a que terminen las promesas
    await new Promise(process.nextTick);
    
    // Verificar que se ejecutó la consulta pero no hubo resultados
    expect(connection.query).toHaveBeenCalledTimes(1);
    expect(connection.query).toHaveBeenCalledWith('SHOW TABLES', []);
    
    // Verificar que termina correctamente
    expect(mockProcessExit).toHaveBeenCalledWith(0);
  });
  
  test('debería manejar errores de conexión', async () => {
    // Simular error de conexión
    mysql.createConnection.mockRejectedValueOnce(new Error('Connection error'));
    
    // Ejecutar el script
    jest.isolateModules(() => {
      require('../../scripts/check-tables');
    });
    
    // Esperar a que terminen las promesas
    await new Promise(process.nextTick);
    
    // Verificar que se muestra el mensaje de error
    expect(mockConsoleError).toHaveBeenCalledWith('Error al verificar estructura de tablas:', expect.any(Error));
    
    // Verificar que termina correctamente
    expect(mockProcessExit).toHaveBeenCalledWith(0);
  });
  
  test('debería manejar errores al describir una tabla específica', async () => {
    // Configurar mocks para las consultas
    const connection = await mysql.createConnection();
    
    // Mock para obtener todas las tablas
    connection.query.mockResolvedValueOnce([[
      { 'Tables_in_testdb': 'Usuario' },
      { 'Tables_in_testdb': 'Rol' }
    ]]);
    
    // Mock para la estructura de la tabla 'Usuario'
    connection.query.mockResolvedValueOnce([[
      { Field: 'IDUsuario', Type: 'int(11)', Null: 'NO', Key: 'PRI', Default: null, Extra: 'auto_increment' }
    ]]);
    
    // Error al describir la tabla 'Rol'
    connection.query.mockRejectedValueOnce(new Error('Error al describir la tabla Rol'));
    
    // Ejecutar el script
    jest.isolateModules(() => {
      require('../../scripts/check-tables');
    });
    
    // Esperar a que terminen las promesas
    await new Promise(process.nextTick);
    
    // Verificar que se muestra el mensaje de error
    expect(mockConsoleError).toHaveBeenCalledWith('Error al verificar estructura de tablas:', expect.any(Error));
    
    // Verificar que termina correctamente
    expect(mockProcessExit).toHaveBeenCalledWith(0);
  });
}); 