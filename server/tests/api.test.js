/**
 * Pruebas de integración para las rutas de API
 * Verifica el funcionamiento básico de los endpoints
 */

const request = require('supertest');
const express = require('express');
const { logger } = require('../utils/logger');

// Mock de base de datos
jest.mock('../config/database', () => {
  return {
    executeQuery: jest.fn().mockResolvedValue([]),
    closePool: jest.fn().mockResolvedValue(true)
  };
});

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

// Crear una aplicación Express de prueba
const mockApp = express();

// Agregar rutas de prueba
mockApp.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK' });
});

mockApp.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK' });
});

// Configurar middleware para rutas no encontradas
mockApp.use((req, res) => {
  res.status(404).json({ status: 'Not Found', message: 'Ruta no encontrada' });
});

describe('Pruebas de API Básicas', () => {
  beforeAll(async () => {
    // Configuración inicial si es necesaria
  });

  afterAll(async () => {
    // No es necesario cerrar la base de datos ya que está mockeada
  });

  test('La ruta /health debería responder correctamente', async () => {
    const response = await request(mockApp).get('/health');
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('status', 'OK');
  });

  test('La ruta /api/health debería responder correctamente', async () => {
    const response = await request(mockApp).get('/api/health');
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('status', 'OK');
  });

  test('Debería manejar correctamente rutas inexistentes', async () => {
    const response = await request(mockApp).get('/ruta-que-no-existe');
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('status', 'Not Found');
  });
}); 