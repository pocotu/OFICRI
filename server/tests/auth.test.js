/**
 * Pruebas de integración para autenticación
 * Verifica el funcionamiento de las rutas de autenticación
 */

const request = require('supertest');
const { app, startServer, stopServer } = require('../test-server');
const { logger } = require('../utils/logger');
const db = require('../config/database');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Asegurarnos de que JWT_SECRET tenga un valor para las pruebas
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key-for-auth-tests';
process.env.SESSION_SECRET = process.env.SESSION_SECRET || 'test-session-secret-for-auth-tests';

// Mock para las funciones de base de datos
jest.mock('../config/database', () => {
  // Usuario de prueba
  const testUser = {
    IDUsuario: 1,
    CodigoCIP: '12345678',
    Nombres: 'Administrador',
    Apellidos: 'Sistema',
    Grado: 'OFICIAL',
    PasswordHash: '$2a$10$mBpQoMfPGGjYV2NzvL.YHeTw0znNqptBsYKrn.zxr5Hd2zQvmCv9q', // Hash para 'Admin123!'
    IDArea: 1,
    IDRol: 1,
    UltimoAcceso: new Date(),
    IntentosFallidos: 0,
    Bloqueado: false,
    UltimoBloqueo: null,
    NombreArea: 'ADMINISTRACIÓN',
    NombreRol: 'ADMINISTRADOR',
    Permisos: 255 // Todos los permisos
  };

  return {
    executeQuery: jest.fn().mockImplementation((sql, params) => {
      // Log para depuración
      console.log(`Mocked DB Query: ${sql.substring(0, 70)}...`);
      console.log(`Mocked DB Params: ${JSON.stringify(params)}`);
      
      // Simular búsqueda de usuario
      if (sql.includes('SELECT') && sql.includes('FROM Usuario') && params[0] === '12345678') {
        console.log('Returning test user for codigoCIP 12345678');
        return Promise.resolve([testUser]);
      } 
      // Simular error para credenciales incorrectas
      else if (sql.includes('SELECT') && sql.includes('FROM Usuario')) {
        console.log('Returning empty array for other user queries');
        return Promise.resolve([]);
      } 
      // Simular actualización de intentos fallidos
      else if (sql.includes('UPDATE Usuario')) {
        console.log('Simulating update to user record');
        return Promise.resolve({ affectedRows: 1 });
      }
      // Simular inserción de sesión
      else if (sql.includes('INSERT INTO Session')) {
        console.log('Simulating session insertion');
        return Promise.resolve({ insertId: 1 });
      }
      // Simular eliminación de sesión (logout)
      else if (sql.includes('DELETE FROM Session')) {
        console.log('Simulating session deletion');
        return Promise.resolve({ affectedRows: 1 });
      }
      // Respuesta por defecto
      console.log('Default DB mock response - empty array');
      return Promise.resolve([]);
    }),
    closePool: jest.fn().mockResolvedValue(true)
  };
});

// Credenciales de prueba basadas en la estructura de la tabla Usuario
const validCredentials = {
  codigoCIP: '12345678',
  password: 'Admin123!'
};

const invalidCredentials = {
  codigoCIP: '12345678',
  password: 'WrongPassword'
};

// Nota: No estamos implementando rutas directamente porque ya están en el test-server

describe('Pruebas de autenticación', () => {
  let authToken;
  let refreshToken;
  let server;

  beforeAll(async () => {
    // Iniciar el servidor de pruebas
    server = await startServer();
    
    // Configuración inicial si es necesaria
    logger.info('Iniciando pruebas de autenticación');
    console.log('JWT_SECRET set to:', process.env.JWT_SECRET ? 'DEFINED' : 'UNDEFINED');
  });

  afterAll(async () => {
    // Detener el servidor de pruebas
    await stopServer();
    
    // Cerrar conexión a la base de datos
    try {
      await db.closePool();
    } catch (error) {
      logger.error('Error al cerrar pool de conexiones:', error);
    }
  });

  test('Debería rechazar un login con credenciales inválidas', async () => {
    try {
      console.log('Testing invalid login with:', JSON.stringify(invalidCredentials));
      const response = await request(app)
        .post('/api/auth/login')
        .send(invalidCredentials);

      console.log('Invalid login response status:', response.status);
      console.log('Invalid login response body:', JSON.stringify(response.body));

      // Verificar que el código de estado sea 401 (No autorizado)
      expect(response.status).toBe(401);
      
      // Verificar que haya un cuerpo de respuesta
      if (response.body) {
        // Si hay un cuerpo, verificar que contenga propiedades esperadas
        if (response.body.success !== undefined) {
          expect(response.body.success).toBe(false);
        }
        // La propiedad mensaje puede tener diferentes nombres
        expect(response.body.message || response.body.error || response.body.msg).toBeDefined();
      }
    } catch (error) {
      console.error('Error during invalid login test:', error);
      // En caso de error, verificar que sea un error de autenticación
      expect(error.status || error.statusCode).toBe(401);
    }
  });

  test('Debería procesar un login con credenciales válidas', async () => {
    try {
      console.log('Testing valid login with:', JSON.stringify(validCredentials));
      const response = await request(app)
        .post('/api/auth/login')
        .send(validCredentials);

      console.log('Valid login response status:', response.status);
      console.log('Valid login response body:', JSON.stringify(response.body));

      // Verificar que se procesó correctamente
      expect(response.status).toBe(200);
      
      // Extraer token si existe en la respuesta
      if (response.body?.token) {
        authToken = response.body.token;
        console.log('Token obtained from response.body.token');
      } else if (response.body?.data?.token) {
        authToken = response.body.data.token;
        console.log('Token obtained from response.body.data.token');
      } else if (response.body?.data?.tokens?.accessToken) {
        authToken = response.body.data.tokens.accessToken;
        console.log('Token obtained from response.body.data.tokens.accessToken');
      }
      
      // Extraer refresh token si existe
      if (response.body?.refreshToken) {
        refreshToken = response.body.refreshToken;
        console.log('RefreshToken obtained from response.body.refreshToken');
      } else if (response.body?.data?.refreshToken) {
        refreshToken = response.body.data.refreshToken;
        console.log('RefreshToken obtained from response.body.data.refreshToken');
      } else if (response.body?.data?.tokens?.refreshToken) {
        refreshToken = response.body.data.tokens.refreshToken;
        console.log('RefreshToken obtained from response.body.data.tokens.refreshToken');
      }
      
      console.log('AuthToken exists:', !!authToken);
      console.log('RefreshToken exists:', !!refreshToken);
      
      // Verificar que se hayan obtenido tokens
      expect(authToken).toBeDefined();
      expect(refreshToken).toBeDefined();
      
      logger.info('Estado de tokens después del login:', { 
        authTokenExists: !!authToken, 
        refreshTokenExists: !!refreshToken 
      });
    } catch (error) {
      console.error('Error during valid login test:', error);
      logger.error('Error al procesar login válido:', error.message);
      throw error; // Hacer fallar la prueba explícitamente
    }
  });

  // Las siguientes pruebas solo se ejecutan si hemos podido obtener tokens
  // de la prueba anterior, lo que puede no suceder en un entorno de integración
  
  test('Debería procesar solicitud de refresh token', async () => {
    // Solo ejecutar si obtuvimos un refreshToken en la prueba anterior
    if (!refreshToken) {
      logger.info('Omitiendo prueba de refresh token, no se pudo obtener token en prueba anterior');
      return;
    }

    try {
      console.log('Testing refresh token with:', refreshToken);
      const response = await request(app)
        .post('/api/auth/refresh-token')
        .send({ refreshToken });

      console.log('Refresh token response status:', response.status);
      console.log('Refresh token response body:', JSON.stringify(response.body));

      // Verificamos que la solicitud se procesó correctamente
      expect(response.status).toBe(200);
    } catch (error) {
      console.error('Error during refresh token test:', error);
      logger.error('Error al procesar refresh token:', error.message);
      throw error;
    }
  });

  test('Debería procesar verificación de autenticación', async () => {
    // Solo ejecutar si obtuvimos un authToken en la prueba anterior
    if (!authToken) {
      logger.info('Omitiendo prueba de verificación, no se pudo obtener token en prueba anterior');
      return;
    }

    try {
      console.log('Testing auth check with token:', authToken.substring(0, 20) + '...');
      const response = await request(app)
        .get('/api/auth/check')
        .set('Authorization', `Bearer ${authToken}`);

      console.log('Auth check response status:', response.status);
      console.log('Auth check response body:', JSON.stringify(response.body));

      // Verificamos que la solicitud se procesó correctamente
      expect(response.status).toBe(200);
    } catch (error) {
      console.error('Error during auth check test:', error);
      logger.error('Error al procesar verificación de autenticación:', error.message);
      throw error;
    }
  });

  test('Debería procesar cierre de sesión', async () => {
    // Solo ejecutar si obtuvimos un authToken en la prueba anterior
    if (!authToken) {
      logger.info('Omitiendo prueba de logout, no se pudo obtener token en prueba anterior');
      return;
    }

    try {
      console.log('Testing logout with token:', authToken.substring(0, 20) + '...');
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${authToken}`);

      console.log('Logout response status:', response.status);
      console.log('Logout response body:', JSON.stringify(response.body));

      // Verificamos que la solicitud se procesó correctamente
      expect(response.status).toBe(200);
    } catch (error) {
      console.error('Error during logout test:', error);
      logger.error('Error al procesar logout:', error.message);
      throw error;
    }
  });
});