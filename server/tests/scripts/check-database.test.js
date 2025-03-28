/**
 * Pruebas para check-database.js
 * Verifica la funcionalidad del script que comprueba el estado de la base de datos
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

describe('check-database.js Tests', () => {
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
  
  test('debería verificar la base de datos completa', async () => {
    // Configurar mocks para las consultas
    const connection = await mysql.createConnection();
    
    // Mock del admin user
    connection.query.mockResolvedValueOnce([[{
      IDUsuario: 1,
      CodigoCIP: '12345678',
      Nombres: 'Admin',
      Apellidos: 'Sistema',
      IDRol: 1,
      IDArea: 1
    }]]);
    
    // Mock de roles
    connection.query.mockResolvedValueOnce([[
      { IDRol: 1, NombreRol: 'Administrador', NivelAcceso: 1, Permisos: 255 },
      { IDRol: 2, NombreRol: 'Mesa de Partes', NivelAcceso: 2, Permisos: 27 }
    ]]);
    
    // Mock de áreas
    connection.query.mockResolvedValueOnce([[
      { IDArea: 1, NombreArea: 'TI', CodigoIdentificacion: 'TI001', TipoArea: 'ADMIN' },
      { IDArea: 2, NombreArea: 'Mesa de Partes', CodigoIdentificacion: 'MP001', TipoArea: 'RECEPCION' }
    ]]);
    
    // Mock de mesa de partes
    connection.query.mockResolvedValueOnce([[
      { IDMesaPartes: 1, Descripcion: 'Mesa Principal', CodigoIdentificacion: 'MP001' }
    ]]);
    
    // Mock de asignaciones
    connection.query.mockResolvedValueOnce([[
      { NombreCompleto: 'Admin Sistema', NombreRol: 'Administrador', NombreArea: 'TI' },
      { NombreCompleto: 'Usuario Mesa', NombreRol: 'Mesa de Partes', NombreArea: 'Mesa de Partes' }
    ]]);
    
    // Ejecutar el script
    jest.isolateModules(() => {
      require('../../scripts/check-database');
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
    expect(connection.query).toHaveBeenCalledTimes(5);
    expect(connection.query).toHaveBeenCalledWith(
      'SELECT IDUsuario, CodigoCIP, Nombres, Apellidos, IDRol, IDArea FROM Usuario WHERE CodigoCIP = ?',
      ['12345678']
    );
    
    // Verificar que se mostraron los resultados
    expect(mockConsoleLog).toHaveBeenCalledWith('Usuario administrador encontrado:');
    
    // Verificar que termina correctamente
    expect(mockProcessExit).toHaveBeenCalledWith(0);
  });
  
  test('debería manejar la falta de usuario admin', async () => {
    // Configurar mock para que no encuentre el usuario admin
    const connection = await mysql.createConnection();
    
    // No hay admin
    connection.query.mockResolvedValueOnce([[]]);
    
    // Resto de consultas normales
    connection.query.mockResolvedValueOnce([[{ IDRol: 1, NombreRol: 'Administrador' }]]);
    connection.query.mockResolvedValueOnce([[{ IDArea: 1, NombreArea: 'TI' }]]);
    connection.query.mockResolvedValueOnce([[{ IDMesaPartes: 1, Descripcion: 'Mesa' }]]);
    connection.query.mockResolvedValueOnce([[]]);
    
    // Ejecutar el script
    jest.isolateModules(() => {
      require('../../scripts/check-database');
    });
    
    // Esperar a que terminen las promesas
    await new Promise(process.nextTick);
    
    // Verificar que se mostró el mensaje de error
    expect(mockConsoleLog).toHaveBeenCalledWith('Usuario administrador NO encontrado');
  });
  
  test('debería manejar error de conexión', async () => {
    // Simular error de conexión
    mysql.createConnection.mockRejectedValueOnce(new Error('Connection error'));
    
    // Ejecutar el script
    jest.isolateModules(() => {
      require('../../scripts/check-database');
    });
    
    // Esperar a que terminen las promesas
    await new Promise(process.nextTick);
    
    // Verificar que se mostró el mensaje de error
    expect(mockConsoleError).toHaveBeenCalledWith('Error al verificar la base de datos:', expect.any(Error));
  });
  
  test('debería manejar errores en las consultas individuales', async () => {
    // Configurar mocks para las consultas
    const connection = await mysql.createConnection();
    
    // Primera consulta exitosa
    connection.query.mockResolvedValueOnce([[{ 
      IDUsuario: 1, 
      CodigoCIP: '12345678', 
      Nombres: 'Admin', 
      Apellidos: 'Sistema',
      IDRol: 1,
      IDArea: 1
    }]]);
    
    // Segunda consulta falla
    connection.query.mockRejectedValueOnce(new Error('Query error'));
    
    // Ejecutar el script
    jest.isolateModules(() => {
      require('../../scripts/check-database');
    });
    
    // Esperar a que terminen las promesas
    await new Promise(process.nextTick);
    
    // Verificar que se mostró el mensaje de error
    expect(mockConsoleError).toHaveBeenCalledWith('Error al verificar la base de datos:', expect.any(Error));
  });
}); 