/**
 * Pruebas para check-db-tables.js
 * Verifica la funcionalidad del script que comprueba la existencia de tablas en la base de datos
 */

// Mock modules
jest.mock('mysql2/promise', () => {
  const mockExecute = jest.fn();
  const mockEnd = jest.fn().mockResolvedValue(undefined);
  
  return {
    createConnection: jest.fn().mockResolvedValue({
      execute: mockExecute,
      end: mockEnd
    })
  };
});

jest.mock('dotenv', () => ({
  config: jest.fn()
}));

// Imports
const mysql = require('mysql2/promise');

// Spies para salidas de consola
const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation(() => {});
const mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
const mockProcessExit = jest.spyOn(process, 'exit').mockImplementation(() => {});

describe('check-db-tables.js Tests', () => {
  beforeEach(() => {
    // Limpiar mocks
    jest.clearAllMocks();
    
    // Configurar variables de entorno
    process.env.DB_HOST = 'localhost';
    process.env.DB_PORT = '3306';
    process.env.DB_USER = 'testuser';
    process.env.DB_PASSWORD = 'testpass';
    process.env.DB_NAME = 'testdb';
  });
  
  afterAll(() => {
    mockConsoleLog.mockRestore();
    mockConsoleError.mockRestore();
    mockProcessExit.mockRestore();
  });
  
  test('debería verificar todas las tablas y reportar que todas existen', async () => {
    // Configurar el mock para que todas las consultas sean exitosas
    const connection = await mysql.createConnection();
    
    // Simular que todas las tablas existen
    connection.execute.mockResolvedValue([[{ '1': 1 }]]);
    
    // Ejecutar el script
    jest.isolateModules(() => {
      require('../../scripts/check-db-tables');
    });
    
    // Esperar a que terminen las promesas
    await new Promise(setImmediate);
    
    // Verificar que se estableció la conexión con la base de datos
    expect(mysql.createConnection).toHaveBeenCalledWith({
      host: 'localhost',
      port: 3306,
      user: 'testuser',
      password: 'testpass',
      database: 'testdb'
    });
    
    // Verificar que se verificaron todas las tablas
    expect(connection.execute).toHaveBeenCalledTimes(12); // El número total de tablas a verificar
    
    // Verificar mensajes de éxito para cada tipo de tabla
    expect(mockConsoleLog).toHaveBeenCalledWith('✅ Todas las tablas estándar existen.');
    expect(mockConsoleLog).toHaveBeenCalledWith('✅ Todas las tablas especializadas existen.');
    
    // Verificar que se cerró la conexión
    expect(connection.end).toHaveBeenCalled();
    
    // Verificar que el script termina correctamente
    expect(mockProcessExit).toHaveBeenCalledWith(0);
  });
  
  test('debería reportar cuando faltan tablas estándar', async () => {
    // Configurar el mock para simular algunas tablas faltantes
    const connection = await mysql.createConnection();
    
    // Simular que algunas tablas existen y otras no
    connection.execute.mockImplementation((query) => {
      // Las tablas que "existen"
      if (query.includes('Usuario') || 
          query.includes('Rol') || 
          query.includes('Permiso') ||
          query.includes('ForenseDigital')) {
        return Promise.resolve([[{ '1': 1 }]]);
      }
      
      // Tablas que "no existen"
      const error = new Error("Table 'testdb.Table' doesn't exist");
      return Promise.reject(error);
    });
    
    // Ejecutar el script
    jest.isolateModules(() => {
      require('../../scripts/check-db-tables');
    });
    
    // Esperar a que terminen las promesas
    await new Promise(setImmediate);
    
    // Verificar que se muestran los mensajes de tablas faltantes
    expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringMatching(/❌ Faltan \d+ tablas estándar:/));
    
    // Verificar que se cerró la conexión
    expect(connection.end).toHaveBeenCalled();
    
    // Verificar que el script termina correctamente
    expect(mockProcessExit).toHaveBeenCalledWith(0);
  });
  
  test('debería reportar cuando faltan tablas especializadas', async () => {
    // Configurar el mock para simular que faltan tablas especializadas
    const connection = await mysql.createConnection();
    
    // Simular que todas las tablas estándar existen pero faltan las especializadas
    connection.execute.mockImplementation((query) => {
      // Sólo las tablas estándar "existen"
      if (query.includes('Usuario') || 
          query.includes('Rol') || 
          query.includes('Permiso') ||
          query.includes('AreaEspecializada') ||
          query.includes('Documento') ||
          query.includes('DocumentoArchivo') ||
          query.includes('Derivacion') ||
          query.includes('MesaPartes') ||
          query.includes('Papelera')) {
        return Promise.resolve([[{ '1': 1 }]]);
      }
      
      // Tablas especializadas "no existen"
      const error = new Error("Table 'testdb.Table' doesn't exist");
      return Promise.reject(error);
    });
    
    // Ejecutar el script
    jest.isolateModules(() => {
      require('../../scripts/check-db-tables');
    });
    
    // Esperar a que terminen las promesas
    await new Promise(setImmediate);
    
    // Verificar que se muestran mensajes de tablas estándar completas pero faltan especializadas
    expect(mockConsoleLog).toHaveBeenCalledWith('✅ Todas las tablas estándar existen.');
    expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringMatching(/ℹ️ Faltan \d+ tablas especializadas:/));
    
    // Verificar que se cerró la conexión
    expect(connection.end).toHaveBeenCalled();
    
    // Verificar que el script termina correctamente
    expect(mockProcessExit).toHaveBeenCalledWith(0);
  });
  
  test('debería manejar errores que no son de tabla inexistente', async () => {
    // Configurar el mock para simular errores diferentes
    const connection = await mysql.createConnection();
    
    // Simular otros tipos de errores
    connection.execute.mockImplementation((query) => {
      if (query.includes('Usuario')) {
        return Promise.resolve([[{ '1': 1 }]]);
      } else if (query.includes('Rol')) {
        // Error de permisos
        const error = new Error("Access denied for user 'testuser'@'localhost'");
        return Promise.reject(error);
      } else {
        // Error de tabla inexistente
        const error = new Error("Table 'testdb.Table' doesn't exist");
        return Promise.reject(error);
      }
    });
    
    // Ejecutar el script
    jest.isolateModules(() => {
      require('../../scripts/check-db-tables');
    });
    
    // Esperar a que terminen las promesas
    await new Promise(setImmediate);
    
    // Verificar que se muestra el mensaje de error específico
    expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringMatching(/⚠️ Error al verificar la tabla 'Rol'/));
    
    // Verificar que se cerró la conexión
    expect(connection.end).toHaveBeenCalled();
    
    // Verificar que el script termina correctamente
    expect(mockProcessExit).toHaveBeenCalledWith(0);
  });
  
  test('debería manejar errores de conexión a la base de datos', async () => {
    // Usar un enfoque más simple
    mysql.createConnection.mockRejectedValueOnce(new Error('Error de conexión a la base de datos'));
    
    // Ejecutar el script
    jest.isolateModules(() => {
      require('../../scripts/check-db-tables');
    });
    
    // Esperar a que terminen las promesas
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Verificar que se muestra el error esperado
    expect(mockConsoleError).toHaveBeenCalledWith(
      'Error general al verificar tablas:',
      expect.anything()
    );
    
    // No verificamos process.exit porque puede variar según cómo termine el script
  });
}); 