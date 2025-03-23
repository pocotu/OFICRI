/**
 * Pruebas unitarias para el módulo logger
 * Verifica la configuración y funcionalidad del sistema de logs
 */

const mockCreateLogger = jest.fn();
const mockConsoleTransport = jest.fn();
const mockFileTransport = jest.fn();
const mockFormat = {
  timestamp: jest.fn().mockReturnValue('timestamp-format'),
  json: jest.fn().mockReturnValue('json-format'),
  combine: jest.fn().mockImplementation((...args) => args),
  colorize: jest.fn().mockReturnValue('colorize-format'),
  simple: jest.fn().mockReturnValue('simple-format')
};

// Mockear winston
jest.mock('winston', () => {
  const mockLogger = {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
  };

  return {
    format: mockFormat,
    transports: {
      Console: mockConsoleTransport.mockImplementation(() => ({
        name: 'console-transport'
      })),
      File: mockFileTransport.mockImplementation(() => ({
        name: 'file-transport'
      }))
    },
    createLogger: mockCreateLogger.mockReturnValue(mockLogger)
  };
});

// Mockear fs para simular existencia de directorio
jest.mock('fs', () => ({
  existsSync: jest.fn().mockReturnValue(true),
  mkdirSync: jest.fn()
}));

// Guardar variables de entorno originales
const originalEnv = { ...process.env };

describe('Logger Module', () => {
  let originalConsoleError;
  
  beforeAll(() => {
    // Capturar console.error para evitar mensajes durante las pruebas
    originalConsoleError = console.error;
    console.error = jest.fn();
  });
  
  afterAll(() => {
    // Restaurar console.error
    console.error = originalConsoleError;
  });
  
  beforeEach(() => {
    // Limpiar mocks antes de cada prueba
    jest.clearAllMocks();
    
    // Restaurar variables de entorno originales
    process.env = { ...originalEnv };
  });

  test('debe crear un logger con configuración por defecto', () => {
    // Borrar variables de entorno relacionadas con logs
    delete process.env.LOG_FILE;
    delete process.env.LOG_LEVEL;
    
    // Requerir el módulo después de limpiar las variables de entorno
    jest.isolateModules(() => {
      const { logger } = require('../../utils/logger');
      
      // Verificar que createLogger fue llamado
      expect(mockCreateLogger).toHaveBeenCalled();
      
      // Verificar configuración por defecto
      expect(mockCreateLogger.mock.calls[0][0]).toHaveProperty('level', 'info');
      
      // Verificar que se usó la consola como transporte
      expect(mockConsoleTransport).toHaveBeenCalled();
      
      // Verificar que el logger tiene los métodos necesarios
      expect(logger.info).toBeDefined();
      expect(logger.error).toBeDefined();
      expect(logger.warn).toBeDefined();
      expect(logger.debug).toBeDefined();
    });
  });

  test('debe usar el nivel de log especificado en LOG_LEVEL', () => {
    // Establecer variable de entorno
    process.env.LOG_LEVEL = 'debug';
    
    jest.isolateModules(() => {
      require('../../utils/logger');
      
      // Verificar que se usó el nivel especificado
      expect(mockCreateLogger).toHaveBeenCalled();
      expect(mockCreateLogger.mock.calls[0][0]).toHaveProperty('level', 'debug');
    });
  });

  test('debe agregar transporte de archivo si LOG_FILE está definido', () => {
    // Establecer variable de entorno
    process.env.LOG_FILE = 'logs/test.log';
    
    jest.isolateModules(() => {
      require('../../utils/logger');
      
      // Verificar que se agregó el transporte de archivo
      expect(mockFileTransport).toHaveBeenCalled();
      expect(mockFileTransport.mock.calls[0][0]).toHaveProperty('filename', 'logs/test.log');
    });
  });

  test('los métodos del logger deben funcionar correctamente', () => {
    jest.isolateModules(() => {
      const { logger } = require('../../utils/logger');
      
      // Probar métodos del logger
      logger.info('Test info message');
      logger.error('Test error message');
      logger.warn('Test warning message');
      logger.debug('Test debug message');
      
      // Verificar que los métodos fueron llamados
      expect(logger.info).toHaveBeenCalledWith('Test info message');
      expect(logger.error).toHaveBeenCalledWith('Test error message');
      expect(logger.warn).toHaveBeenCalledWith('Test warning message');
      expect(logger.debug).toHaveBeenCalledWith('Test debug message');
    });
  });
}); 