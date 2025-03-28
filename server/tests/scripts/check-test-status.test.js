/**
 * Pruebas para check-test-status.js
 * Verifica la funcionalidad del script que monitorea el estado de las pruebas
 */

// Mock modules
jest.mock('child_process', () => ({
  execSync: jest.fn()
}));

jest.mock('fs', () => ({
  readFileSync: jest.fn(),
  unlinkSync: jest.fn(),
  existsSync: jest.fn()
}));

jest.mock('path', () => ({
  join: jest.fn().mockReturnValue('/ruta/test-results.json')
}));

// Imports
const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

// Utilidades para pruebas
const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation(() => {});
const mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

describe('check-test-status.js Tests', () => {
  // Configuración inicial
  beforeEach(() => {
    // Limpiar todos los mocks
    jest.clearAllMocks();
    
    // Mock de execSync para que no ejecute realmente npm test
    execSync.mockReturnValue('Pruebas ejecutadas');
  });
  
  afterAll(() => {
    // Restaurar console.log y console.error
    mockConsoleLog.mockRestore();
    mockConsoleError.mockRestore();
  });
  
  test('debería ejecutar correctamente las pruebas y mostrar resumen cuando todas pasan', () => {
    // Mock de fs.readFileSync para que retorne un resultado de pruebas exitosas
    const testResults = {
      success: true,
      testResults: [
        {
          name: '/ruta/test1.js',
          status: 'passed',
          numFailingTests: 0,
          numPassingTests: 5,
          numPendingTests: 1,
          message: ''
        },
        {
          name: '/ruta/test2.js',
          status: 'passed',
          numFailingTests: 0,
          numPassingTests: 3,
          numPendingTests: 0,
          message: ''
        }
      ]
    };
    
    fs.readFileSync.mockReturnValue(JSON.stringify(testResults));
    fs.existsSync.mockReturnValue(true);
    
    // Ejecutar el script
    jest.isolateModules(() => {
      require('../../scripts/check-test-status');
    });
    
    // Verificar que se ejecuta npm test
    expect(execSync).toHaveBeenCalled();
    expect(execSync.mock.calls[0][0]).toContain('npm test');
    
    // Verificar que se lee el archivo de resultados
    expect(fs.readFileSync).toHaveBeenCalledWith('/ruta/test-results.json', 'utf-8');
    
    // Verificar que se muestra el mensaje de éxito
    expect(mockConsoleLog.mock.calls.some(call => 
      call[0].includes('TODAS LAS PRUEBAS PASARON CORRECTAMENTE')
    )).toBeTruthy();
    
    // Verificar que se elimina el archivo temporal
    expect(fs.unlinkSync).toHaveBeenCalledWith('/ruta/test-results.json');
  });
  
  test('debería mostrar archivos con pruebas fallidas cuando hay fallos', () => {
    // Mock de fs.readFileSync para que retorne un resultado con pruebas fallidas
    const testResults = {
      success: false,
      testResults: [
        {
          name: '/ruta/test1.js',
          status: 'passed',
          numFailingTests: 0,
          numPassingTests: 5,
          numPendingTests: 1,
          message: ''
        },
        {
          name: '/ruta/test2.js',
          status: 'failed',
          numFailingTests: 2,
          numPassingTests: 3,
          numPendingTests: 0,
          failureMessage: 'Falló la prueba X'
        }
      ]
    };
    
    fs.readFileSync.mockReturnValue(JSON.stringify(testResults));
    
    // Ejecutar el script
    jest.isolateModules(() => {
      require('../../scripts/check-test-status');
    });
    
    // Verificar que se muestra información sobre pruebas fallidas
    expect(mockConsoleLog.mock.calls.some(call => 
      call[0].includes('ARCHIVOS CON PRUEBAS FALLIDAS')
    )).toBeTruthy();
    
    // Verificar que se elimina el archivo temporal
    expect(fs.unlinkSync).toHaveBeenCalledWith('/ruta/test-results.json');
  });
  
  test('debería manejar errores en la ejecución de las pruebas', () => {
    // Mock de execSync para que lance un error
    execSync.mockImplementation(() => {
      throw new Error('Error al ejecutar pruebas');
    });
    
    // Ejecutar el script
    jest.isolateModules(() => {
      require('../../scripts/check-test-status');
    });
    
    // Verificar que se muestra el error
    expect(mockConsoleError).toHaveBeenCalled();
    expect(mockConsoleError.mock.calls[0][0]).toContain('Error al ejecutar las pruebas');
  });
  
  test('debería intentar mostrar contenido parcial del archivo si hay error pero existe el archivo', () => {
    // Mock de execSync para que lance un error
    execSync.mockImplementation(() => {
      throw new Error('Error al ejecutar pruebas');
    });
    
    // El archivo existe pero tiene contenido inválido
    fs.existsSync.mockReturnValue(true);
    fs.readFileSync.mockReturnValue('Contenido inválido');
    
    // Ejecutar el script
    jest.isolateModules(() => {
      require('../../scripts/check-test-status');
    });
    
    // Verificar que se intenta leer el archivo
    expect(fs.existsSync).toHaveBeenCalledWith('/ruta/test-results.json');
    expect(fs.readFileSync).toHaveBeenCalledWith('/ruta/test-results.json', 'utf-8');
    expect(mockConsoleLog).toHaveBeenCalled();
  });
  
  test('debería manejar errores al leer el archivo de resultados', () => {
    // Mock de execSync para que no lance errores
    execSync.mockReturnValue('Pruebas ejecutadas');
    
    // Mock de fs.readFileSync para que lance un error
    fs.readFileSync.mockImplementation(() => {
      throw new Error('Error al leer archivo');
    });
    
    // Ejecutar el script
    jest.isolateModules(() => {
      require('../../scripts/check-test-status');
    });
    
    // Verificar que se muestra el error
    expect(mockConsoleError).toHaveBeenCalled();
  });
}); 