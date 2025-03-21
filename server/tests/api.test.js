/**
 * Pruebas de integración para las rutas de API
 * Verifica el funcionamiento básico de los endpoints
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

describe('Pruebas de API Básicas', () => {
  beforeAll(async () => {
    // Configuración inicial si es necesaria
  });

  afterAll(async () => {
    // Cerrar conexión a la base de datos
    await db.closePool();
  });

  test('La ruta /health debería responder correctamente', async () => {
    const response = await request(app).get('/health');
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('status', 'OK');
  });

  test('La ruta /api/health debería responder correctamente', async () => {
    const response = await request(app).get('/api/health');
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('status', 'OK');
  });

  test('Debería manejar correctamente rutas inexistentes', async () => {
    const response = await request(app).get('/ruta-que-no-existe');
    // La aplicación devuelve 401 para rutas inexistentes debido a la protección de autenticación
    expect(response.status).toBe(401);
  });
}); 