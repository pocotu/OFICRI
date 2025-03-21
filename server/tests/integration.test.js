/**
 * Pruebas de integración básicas
 * Verifica solo la estructura básica del proyecto
 */

const request = require('supertest');
const app = require('../app');
const { logger } = require('../utils/logger');
const db = require('../config/database');

// Mock de Redis para las pruebas
jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => {
    return {
      flushall: jest.fn().mockResolvedValue('OK'),
      quit: jest.fn().mockResolvedValue('OK'),
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn().mockResolvedValue('OK'),
      del: jest.fn().mockResolvedValue(1)
    };
  });
});

// Mock de JWT para evitar errores de validación
jest.mock('jsonwebtoken', () => ({
  verify: jest.fn().mockImplementation(() => ({ id: 1, role: 'admin' })),
  sign: jest.fn().mockReturnValue('valid-test-token')
}));

describe('Pruebas de Estructura Básica', () => {
  beforeAll(async () => {
    // No hay necesidad de configuración especial
  });

  afterAll(async () => {
    // Cerrar conexión a la base de datos
    await db.closePool();
  });

  test('La aplicación Express está definida', () => {
    expect(app).toBeDefined();
  });

  test('La conexión a la base de datos está definida', () => {
    expect(db).toBeDefined();
    expect(typeof db.executeQuery).toBe('function');
  });

  test('El logger está definido', () => {
    expect(logger).toBeDefined();
    expect(typeof logger.info).toBe('function');
    expect(typeof logger.error).toBe('function');
  });
}); 