/**
 * Pruebas del módulo de registro (logger)
 * Verifica la funcionalidad del sistema de logs
 */

const { logger } = require('../utils/logger');

describe('Pruebas del Logger', () => {
  test('El logger está definido correctamente', () => {
    expect(logger).toBeDefined();
  });

  test('El logger tiene los métodos necesarios', () => {
    expect(typeof logger.info).toBe('function');
    expect(typeof logger.error).toBe('function');
    expect(typeof logger.warn).toBe('function');
    expect(typeof logger.debug).toBe('function');
  });

  test('El logger puede registrar mensajes sin lanzar errores', () => {
    // No deberían lanzar excepciones
    expect(() => logger.info('Test info message')).not.toThrow();
    expect(() => logger.error('Test error message')).not.toThrow();
    expect(() => logger.warn('Test warning message')).not.toThrow();
    expect(() => logger.debug('Test debug message')).not.toThrow();
  });

  test('El logger puede registrar objetos complejos sin lanzar errores', () => {
    const testObj = {
      user: {
        id: 1,
        name: 'Test User',
        roles: ['admin', 'user']
      },
      action: 'test',
      timestamp: new Date().toISOString()
    };

    expect(() => logger.info('Test message with object', testObj)).not.toThrow();
    expect(() => logger.error('Test error with object', { error: new Error('Test error'), ...testObj })).not.toThrow();
  });
}); 