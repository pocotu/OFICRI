/**
 * Pruebas para el módulo base de logger
 * server/utils/logger.js
 */

// Mocks
const mockWinstonLogger = {
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
  log: jest.fn()
};

jest.mock('winston', () => {
  const mockFormat = {
    timestamp: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    combine: jest.fn().mockReturnThis(),
    colorize: jest.fn().mockReturnThis(),
    simple: jest.fn().mockReturnThis()
  };

  return {
    format: mockFormat,
    transports: {
      Console: jest.fn(),
      File: jest.fn()
    },
    createLogger: jest.fn().mockReturnValue(mockWinstonLogger)
  };
});

// Importación después de los mocks
const winston = require('winston');

// Guardar variables de entorno originales
const originalEnv = { ...process.env };

describe('Módulo Logger Base', () => {
  // Referencia al módulo que se va a probar
  let loggerModule;

  beforeEach(() => {
    // Limpiar todas las simulaciones
    jest.clearAllMocks();
    
    // Restablecer variables de entorno
    process.env = { ...originalEnv };
    delete process.env.LOG_FILE;
    delete process.env.LOG_LEVEL;
    
    // Cargar el módulo para cada prueba
    jest.isolateModules(() => {
      loggerModule = require('../../utils/logger');
    });
  });

  afterAll(() => {
    // Restaurar variables de entorno
    process.env = originalEnv;
  });

  describe('Inicialización', () => {
    test('debería crear un logger con configuración por defecto', () => {
      // Verificar que se crea el logger
      expect(winston.createLogger).toHaveBeenCalled();
      
      // Verificar que el logger está expuesto
      expect(loggerModule.logger).toBeDefined();
    });

    test('debería usar level de log desde variable de entorno', () => {
      // Establecer nivel de log en la variable de entorno
      process.env.LOG_LEVEL = 'debug';
      
      // Recargar el módulo para que use la variable de entorno
      jest.isolateModules(() => {
        require('../../utils/logger');
      });
      
      // Verificar que se crea el logger con el nivel correcto
      expect(winston.createLogger).toHaveBeenCalledWith(
        expect.objectContaining({
          level: 'debug'
        })
      );
    });

    test('debería agregar transport de archivo si se especifica LOG_FILE', () => {
      // Establecer ruta de archivo de log en la variable de entorno
      process.env.LOG_FILE = 'app.log';
      
      // Recargar el módulo para que use la variable de entorno
      jest.isolateModules(() => {
        require('../../utils/logger');
      });
      
      // Verificar que se crea el transport para archivo
      expect(winston.transports.File).toHaveBeenCalled();
      expect(winston.transports.File).toHaveBeenCalledWith(
        expect.objectContaining({
          filename: expect.stringContaining('app.log')
        })
      );
    });
  });

  describe('Métodos del Logger', () => {
    test('el logger debería tener los métodos necesarios', () => {
      const { logger } = loggerModule;
      
      // Verificar que los métodos están definidos
      expect(typeof logger.error).toBe('function');
      expect(typeof logger.warn).toBe('function');
      expect(typeof logger.info).toBe('function');
      expect(typeof logger.debug).toBe('function');
    });

    test('los métodos deberían funcionar sin lanzar errores', () => {
      const { logger } = loggerModule;
      
      // Verificar que los métodos no lanzan errores
      expect(() => logger.info('Test info')).not.toThrow();
      expect(() => logger.error('Test error')).not.toThrow();
      expect(() => logger.warn('Test warning')).not.toThrow();
      expect(() => logger.debug('Test debug')).not.toThrow();
    });

    test('los métodos deberían llamar a las funciones correspondientes de winston', () => {
      const { logger } = loggerModule;
      
      // Ejecutar métodos del logger
      logger.info('Test info');
      logger.error('Test error');
      logger.warn('Test warning');
      logger.debug('Test debug');
      
      // Verificar que se llaman a los métodos correspondientes del logger
      expect(mockWinstonLogger.info).toHaveBeenCalledWith('Test info');
      expect(mockWinstonLogger.error).toHaveBeenCalledWith('Test error');
      expect(mockWinstonLogger.warn).toHaveBeenCalledWith('Test warning');
      expect(mockWinstonLogger.debug).toHaveBeenCalledWith('Test debug');
    });
  });
}); 