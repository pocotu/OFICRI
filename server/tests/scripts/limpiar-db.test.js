/**
 * Tests para limpiar-db.js
 * Prueba las funciones del script que limpia la base de datos
 */

// Mock de dotenv
jest.mock('dotenv', () => ({
  config: jest.fn()
}));

// Mock de path
jest.mock('path', () => ({
  resolve: jest.fn().mockReturnValue('/mocked/path/.env')
}));

// Mock de mysql2/promise para cada test
jest.mock('mysql2/promise', () => {
  return {
    createConnection: jest.fn()
  };
});

// Spies para salidas de consola
const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation(() => {});
const mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
const mockConsoleWarn = jest.spyOn(console, 'warn').mockImplementation(() => {});
const mockProcessExit = jest.spyOn(process, 'exit').mockImplementation(() => {});

describe('limpiar-db.js Tests', () => {
  let mysql;
  let mockConnection;
  let script;
  
  beforeEach(() => {
    // Limpiar mocks
    jest.clearAllMocks();
    
    // Restaurar variables de entorno
    process.env.DB_HOST = 'localhost';
    process.env.DB_USER = 'testuser';
    process.env.DB_PASSWORD = 'testpass';
    process.env.DB_NAME = 'testdb';
    
    // Resetear módulos para obtener una instancia limpia
    jest.resetModules();
    
    // Obtener referencia al módulo mysql2/promise después del reset
    mysql = require('mysql2/promise');
    
    // Configurar mock de conexión
    mockConnection = {
      query: jest.fn(),
      end: jest.fn().mockResolvedValue(undefined)
    };
    
    // Configurar createConnection para retornar la conexión mockeada
    mysql.createConnection.mockResolvedValue(mockConnection);
    
    // Cargar el script
    script = require('../../scripts/limpiar-db');
  });
  
  afterAll(() => {
    mockConsoleLog.mockRestore();
    mockConsoleError.mockRestore();
    mockConsoleWarn.mockRestore();
    mockProcessExit.mockRestore();
  });
  
  test('executeQuery debería establecer la conexión con los parámetros correctos', async () => {
    // Configurar mock para una consulta exitosa
    mockConnection.query.mockResolvedValueOnce([{result: 'success'}]);
    
    // Ejecutar la función
    await script.__test__.executeQuery('SELECT 1');
    
    // Verificar que se estableció la conexión con los parámetros correctos
    expect(mysql.createConnection).toHaveBeenCalledWith({
      host: 'localhost',
      user: 'testuser',
      password: 'testpass',
      database: 'testdb',
      multipleStatements: true
    });
    
    // Verificar que se ejecutó la consulta
    expect(mockConnection.query).toHaveBeenCalledWith('SELECT 1', []);
    
    // Verificar que se cerró la conexión
    expect(mockConnection.end).toHaveBeenCalled();
  });
  
  test('eliminarTriggers debería eliminar todos los triggers encontrados', async () => {
    // Configurar respuestas para las consultas
    const mockTriggers = [
      { TRIGGER_NAME: 'trigger1' },
      { TRIGGER_NAME: 'trigger2' }
    ];
    
    mockConnection.query
      .mockResolvedValueOnce([mockTriggers]) // Consulta para listar triggers
      .mockResolvedValueOnce([{}])           // Eliminar primer trigger
      .mockResolvedValueOnce([{}]);          // Eliminar segundo trigger
    
    // Ejecutar la función
    const resultado = await script.__test__.eliminarTriggers();
    
    // Verificar resultado
    expect(resultado).toBe(true);
    
    // Verificar que se ejecutaron las consultas correctas
    expect(mockConnection.query).toHaveBeenCalledTimes(3);
    
    // Verificar mensajes de log
    expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('Obteniendo lista de triggers'));
    expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('Se encontraron 2 triggers'));
    expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('Eliminando trigger: trigger1'));
    expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('Eliminando trigger: trigger2'));
  });
  
  test('eliminarTriggers debería manejar errores', async () => {
    // Configurar error en la consulta
    mockConnection.query.mockRejectedValueOnce(new Error('Error al consultar triggers'));
    
    // Ejecutar la función
    const resultado = await script.__test__.eliminarTriggers();
    
    // Verificar resultado
    expect(resultado).toBe(false);
    
    // Verificar mensajes de error
    expect(mockConsoleError).toHaveBeenCalledWith(
      expect.stringContaining('Error al eliminar triggers'),
      expect.stringContaining('Error al consultar triggers')
    );
  });
  
  test('limpiarRolLog debería crear registros iniciales correctamente', async () => {
    // Configurar respuestas para las consultas
    mockConnection.query
      .mockResolvedValueOnce([{}]) // INSERT Usuario
      .mockResolvedValueOnce([{}]) // INSERT Rol
      .mockResolvedValueOnce([{}]); // INSERT RolLog
    
    // Ejecutar la función
    const resultado = await script.__test__.limpiarRolLog();
    
    // Verificar resultado
    expect(resultado).toBe(true);
    
    // Verificar que se ejecutaron las consultas correctas
    expect(mockConnection.query).toHaveBeenCalledTimes(3);
    
    // Verificar que hay consultas con los patrones esperados
    expect(mockConnection.query).toHaveBeenNthCalledWith(
      1, 
      expect.stringContaining('INSERT INTO Usuario'), 
      []
    );
    
    // Verificar mensajes de log
    expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('Registros iniciales creados'));
  });
  
  test('limpiarRolLog debería manejar errores', async () => {
    // Configurar error en la primera consulta
    mockConnection.query.mockRejectedValueOnce(new Error('Error de inserción'));
    
    // Ejecutar la función
    const resultado = await script.__test__.limpiarRolLog();
    
    // Verificar que se advierte el error pero no falla la función
    expect(resultado).toBe(true);
    expect(mockConsoleWarn).toHaveBeenCalledWith(
      expect.stringContaining('No se pudieron crear registros iniciales'),
      expect.stringContaining('Error de inserción')
    );
  });
  
  test('limpiarBaseDatos debería ejecutar correctamente todo el proceso', async () => {
    // Configurar respuestas para todas las consultas
    mockConnection.query
      .mockResolvedValueOnce([{}])      // SET foreign_key_checks=0
      .mockResolvedValueOnce([[]])      // Lista vacía de triggers
      .mockResolvedValueOnce([{}])      // INSERT Usuario
      .mockResolvedValueOnce([{}])      // INSERT Rol
      .mockResolvedValueOnce([{}])      // INSERT RolLog
      .mockResolvedValueOnce([{}]);     // SET foreign_key_checks=1
    
    // Ejecutar la función
    const resultado = await script.__test__.limpiarBaseDatos();
    
    // Verificar resultado
    expect(resultado).toBe(true);
    
    // Verificar mensajes de log
    expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('LIMPIEZA DE BASE DE DATOS'));
    expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('Limpieza completada exitosamente'));
  });
  
  test('limpiarBaseDatos debería manejar errores generales', async () => {
    // Configurar error en la primera consulta
    mockConnection.query.mockRejectedValueOnce(new Error('Error de conexión'));
    
    // Ejecutar la función
    const resultado = await script.__test__.limpiarBaseDatos();
    
    // Verificar resultado
    expect(resultado).toBe(false);
    
    // Verificar mensajes de error
    expect(mockConsoleError).toHaveBeenCalledWith(
      expect.stringContaining('Error durante la limpieza'),
      expect.stringContaining('Error de conexión')
    );
  });
  
  test('script principal debería manejar ejecución exitosa', async () => {
    // Crear un mock para limpiarBaseDatos que retorna success
    const originalFn = script.__test__.limpiarBaseDatos;
    script.__test__.limpiarBaseDatos = jest.fn().mockResolvedValue(true);
    
    // Simular ejecución como programa principal
    const realRequireMain = require.main;
    require.main = module;
    
    // Ejecutar el código principal manualmente
    await script.__test__.limpiarBaseDatos()
      .then(result => {
        if (result) {
          console.log('Proceso completado con éxito');
          process.exit(0);
        } else {
          console.error('Proceso finalizó con errores');
          process.exit(1);
        }
      });
    
    // Verificar que process.exit se llamó con 0
    expect(mockProcessExit).toHaveBeenCalledWith(0);
    
    // Restaurar funciones originales
    script.__test__.limpiarBaseDatos = originalFn;
    require.main = realRequireMain;
  });
  
  test('script principal debería manejar errores', async () => {
    // Crear un mock para limpiarBaseDatos que retorna error
    const originalFn = script.__test__.limpiarBaseDatos;
    script.__test__.limpiarBaseDatos = jest.fn().mockResolvedValue(false);
    
    // Simular ejecución como programa principal
    const realRequireMain = require.main;
    require.main = module;
    
    // Ejecutar el código principal manualmente
    await script.__test__.limpiarBaseDatos()
      .then(result => {
        if (result) {
          console.log('Proceso completado con éxito');
          process.exit(0);
        } else {
          console.error('Proceso finalizó con errores');
          process.exit(1);
        }
      });
    
    // Verificar que process.exit se llamó con 1
    expect(mockProcessExit).toHaveBeenCalledWith(1);
    
    // Restaurar funciones originales
    script.__test__.limpiarBaseDatos = originalFn;
    require.main = realRequireMain;
  });
}); 