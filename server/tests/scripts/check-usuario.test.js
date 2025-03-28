/**
 * Pruebas para check-usuario.js
 * Verifica la funcionalidad del script que examina la estructura y contenido de la tabla Usuario
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

describe('check-usuario.js Tests', () => {
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
  
  test('debería verificar correctamente la tabla Usuario que existe y tiene registros', async () => {
    // Configurar mocks para las consultas
    const connection = await mysql.createConnection();
    
    // Mock para verificar si la tabla existe
    connection.query.mockResolvedValueOnce([[{ 'Tables_in_testdb (Usuario)': 'Usuario' }]]);
    
    // Mock para la estructura de la tabla
    connection.query.mockResolvedValueOnce([[
      { Field: 'IDUsuario', Type: 'int(11)', Null: 'NO', Key: 'PRI', Default: null, Extra: 'auto_increment' },
      { Field: 'CodigoCIP', Type: 'varchar(8)', Null: 'NO', Key: '', Default: null, Extra: '' },
      { Field: 'Nombres', Type: 'varchar(100)', Null: 'NO', Key: '', Default: null, Extra: '' },
      { Field: 'Apellidos', Type: 'varchar(100)', Null: 'NO', Key: '', Default: null, Extra: '' },
      { Field: 'PasswordHash', Type: 'varchar(255)', Null: 'NO', Key: '', Default: null, Extra: '' },
      { Field: 'Email', Type: 'varchar(100)', Null: 'YES', Key: '', Default: null, Extra: '' },
      { Field: 'IDRol', Type: 'int(11)', Null: 'YES', Key: 'MUL', Default: null, Extra: '' },
      { Field: 'IDArea', Type: 'int(11)', Null: 'YES', Key: 'MUL', Default: null, Extra: '' }
    ]]);
    
    // Mock para los registros de la tabla
    connection.query.mockResolvedValueOnce([[{
      IDUsuario: 1,
      CodigoCIP: '12345678',
      Nombres: 'Admin',
      Apellidos: 'Sistema',
      PasswordHash: '$2a$10$xxxxxxxxxxxxxxxxxxxx',
      Email: 'admin@oficri.com',
      IDRol: 1,
      IDArea: 1
    }, {
      IDUsuario: 2,
      CodigoCIP: '87654321',
      Nombres: 'Usuario',
      Apellidos: 'Prueba',
      PasswordHash: '$2a$10$xxxxxxxxxxxxxxxxxxxx',
      Email: 'usuario@oficri.com',
      IDRol: 2,
      IDArea: 2
    }]]);
    
    // Ejecutar el script
    jest.isolateModules(() => {
      require('../../scripts/check-usuario');
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
    expect(connection.query).toHaveBeenCalledTimes(3);
    expect(connection.query).toHaveBeenCalledWith("SHOW TABLES LIKE 'Usuario'", []);
    expect(connection.query).toHaveBeenCalledWith('DESCRIBE Usuario', []);
    expect(connection.query).toHaveBeenCalledWith('SELECT * FROM Usuario LIMIT 10', []);
    
    // Verificar que se mostraron los resultados
    expect(mockConsoleLog).toHaveBeenCalledWith('=== VERIFICACIÓN DE TABLA USUARIO ===');
    expect(mockConsoleLog).toHaveBeenCalledWith('Columnas:');
    expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('Total de usuarios:'));
    
    // Verificar que se ofuscan las contraseñas
    expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('PasswordHash: [OFUSCADO]'));
    
    // Verificar que termina correctamente
    expect(mockProcessExit).toHaveBeenCalledWith(0);
  });
  
  test('debería informar cuando la tabla Usuario no existe', async () => {
    // Configurar mock para que la tabla no exista
    const connection = await mysql.createConnection();
    
    // No hay tablas que coincidan
    connection.query.mockResolvedValueOnce([[]]);
    
    // Ejecutar el script
    jest.isolateModules(() => {
      require('../../scripts/check-usuario');
    });
    
    // Esperar a que terminen las promesas
    await new Promise(process.nextTick);
    
    // Verificar que se muestra el mensaje correcto
    expect(mockConsoleLog).toHaveBeenCalledWith('La tabla Usuario no existe en la base de datos');
    
    // Verificar que termina correctamente
    expect(mockProcessExit).toHaveBeenCalledWith(0);
  });
  
  test('debería informar cuando la tabla Usuario está vacía', async () => {
    // Configurar mocks para las consultas
    const connection = await mysql.createConnection();
    
    // Mock para verificar si la tabla existe
    connection.query.mockResolvedValueOnce([[{ 'Tables_in_testdb (Usuario)': 'Usuario' }]]);
    
    // Mock para la estructura de la tabla
    connection.query.mockResolvedValueOnce([[
      { Field: 'IDUsuario', Type: 'int(11)', Null: 'NO', Key: 'PRI', Default: null, Extra: 'auto_increment' },
      { Field: 'CodigoCIP', Type: 'varchar(8)', Null: 'NO', Key: '', Default: null, Extra: '' },
      { Field: 'Nombres', Type: 'varchar(100)', Null: 'NO', Key: '', Default: null, Extra: '' },
      { Field: 'Apellidos', Type: 'varchar(100)', Null: 'NO', Key: '', Default: null, Extra: '' },
    ]]);
    
    // Mock para los registros de la tabla (vacía)
    connection.query.mockResolvedValueOnce([[]]);
    
    // Ejecutar el script
    jest.isolateModules(() => {
      require('../../scripts/check-usuario');
    });
    
    // Esperar a que terminen las promesas
    await new Promise(process.nextTick);
    
    // Verificar que se muestra el mensaje correcto
    expect(mockConsoleLog).toHaveBeenCalledWith('La tabla Usuario no contiene registros');
    
    // Verificar que termina correctamente
    expect(mockProcessExit).toHaveBeenCalledWith(0);
  });
  
  test('debería manejar errores de conexión', async () => {
    // Simular error de conexión
    mysql.createConnection.mockRejectedValueOnce(new Error('Connection error'));
    
    // Ejecutar el script
    jest.isolateModules(() => {
      require('../../scripts/check-usuario');
    });
    
    // Esperar a que terminen las promesas
    await new Promise(process.nextTick);
    
    // Verificar que se muestra el mensaje de error
    expect(mockConsoleError).toHaveBeenCalledWith('Error al verificar tabla Usuario:', expect.any(Error));
    
    // Verificar que termina correctamente
    expect(mockProcessExit).toHaveBeenCalledWith(0);
  });
  
  test('debería manejar errores en consultas individuales', async () => {
    // Configurar mocks para las consultas
    const connection = await mysql.createConnection();
    
    // La primera consulta funciona
    connection.query.mockResolvedValueOnce([[{ 'Tables_in_testdb (Usuario)': 'Usuario' }]]);
    
    // La segunda consulta falla
    connection.query.mockRejectedValueOnce(new Error('Query error'));
    
    // Ejecutar el script
    jest.isolateModules(() => {
      require('../../scripts/check-usuario');
    });
    
    // Esperar a que terminen las promesas
    await new Promise(process.nextTick);
    
    // Verificar que se muestra el mensaje de error
    expect(mockConsoleError).toHaveBeenCalledWith('Error al verificar tabla Usuario:', expect.any(Error));
    
    // Verificar que termina correctamente
    expect(mockProcessExit).toHaveBeenCalledWith(0);
  });
}); 