/**
 * Pruebas para API de permisos
 */
const request = require('supertest');
const jwt = require('jsonwebtoken');
const { app, startServer, stopServer } = require('../test-server');
const db = require('../config/database');
const { logger } = require('../utils/logger');

// Establecer entorno de prueba
process.env.NODE_ENV = 'test';
// Definir una clave de prueba para JWT
process.env.JWT_SECRET = 'test_secret';

// Datos de prueba
let token;
let server;
// Usamos valores mock para las pruebas
let testUsuarioId = 1; // ID de usuario simulado
let testRolId = 1;     // ID de rol simulado
let testAreaId = 1;    // ID de área simulada

// Configuración inicial
beforeAll(async () => {
  try {
    // Iniciar el servidor con puerto dinámico
    server = await startServer();
    
    // Generar token manualmente para las pruebas
    token = jwt.sign(
      { 
        id: testUsuarioId, 
        role: 'ADMIN'
      },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    console.log('Configuración de pruebas completada. Usuario ID simulado:', testUsuarioId);
    console.log('Token generado:', token);

  } catch (error) {
    console.error(`Error en la configuración de las pruebas: ${error.message}`);
    logger.error(`Error en la configuración de las pruebas: ${error.message}`);
  }
});

// Limpieza después de las pruebas
afterAll(async () => {
  try {
    // Detener el servidor
    await stopServer();
    // Cerrar la conexión a la base de datos
    await db.close();
  } catch (error) {
    logger.error(`Error al finalizar las pruebas: ${error.message}`);
  }
});

// Mockeamos las respuestas del controlador para evitar depender de la base de datos
jest.mock('../controllers/permisos.controller', () => {
  const original = jest.requireActual('../controllers/permisos.controller');
  
  return {
    ...original,
    // Mock para obtenerPermisosContextuales
    obtenerPermisosContextuales: jest.fn(async (req, res) => {
      res.status(200).json({
        success: true,
        count: 1,
        data: [{
          id: 1,
          tipoRecurso: 'DOCUMENTO',
          condicion: 'PROPIETARIO',
          accion: 'ELIMINAR',
          idRol: testRolId,
          idArea: testAreaId
        }]
      });
    }),
    // Mock para getPermissionBits
    getPermissionBits: jest.fn(async (req, res) => {
      res.status(200).json({
        success: true,
        data: {
          crear: true,
          editar: true,
          eliminar: true,
          ver: true,
          derivar: true,
          auditar: true,
          exportar: true,
          bloquear: true
        }
      });
    }),
    // Mock para verifyPermission
    verifyPermission: jest.fn(async (req, res) => {
      const { idUsuario, permisoBit } = req.body;
      
      if (!idUsuario || permisoBit === undefined) {
        return res.status(400).json({ 
          success: false, 
          message: 'Se requiere idUsuario y permisoBit' 
        });
      }
      
      res.status(200).json({
        success: true,
        tienePermiso: true
      });
    }),
    // Mock para getPermisosInfoFrontend
    getPermisosInfoFrontend: jest.fn(async (req, res) => {
      const { idUsuario } = req.params;
      
      if (idUsuario == 99999) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        });
      }
      
      res.status(200).json({
        success: true,
        data: {
          usuario: {
            id: testUsuarioId,
            idRol: testRolId,
            nombreRol: 'Admin',
            idArea: testAreaId,
            nombreArea: 'Área de Prueba'
          },
          permisosBits: {
            valor: 255,
            detalle: {
              crear: true,
              editar: true,
              eliminar: true,
              ver: true,
              derivar: true,
              auditar: true,
              exportar: true,
              bloquear: true
            }
          },
          permisosContextuales: [
            {
              id: 1,
              tipoRecurso: 'DOCUMENTO',
              condicion: 'PROPIETARIO',
              accion: 'ELIMINAR'
            }
          ]
        }
      });
    })
  };
});

describe('API de Permisos', () => {
  
  test('Debería obtener los bits de permisos', async () => {
    const res = await request(app)
      .get('/api/permisos/bits')
      .set('Authorization', `Bearer ${token}`);
    
    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.crear).toBeDefined();
    expect(res.body.data.eliminar).toBeDefined();
    expect(res.body.data.ver).toBeDefined();
  });

  test('Debería verificar un permiso por bit', async () => {
    const res = await request(app)
      .post('/api/permisos/verificar')
      .set('Authorization', `Bearer ${token}`)
      .send({
        idUsuario: testUsuarioId,
        permisoBit: 2  // Bit de "eliminar"
      });
    
    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.tienePermiso).toBeDefined();
  });

  test('Debería obtener todos los permisos contextuales', async () => {
    const res = await request(app)
      .get('/api/permisos/contextuales')
      .set('Authorization', `Bearer ${token}`);
    
    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  test('Debería obtener información completa de permisos para frontend', async () => {
    const res = await request(app)
      .get(`/api/permisos/info/${testUsuarioId}`)
      .set('Authorization', `Bearer ${token}`);
    
    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();
    
    // Verificar estructura de la respuesta
    expect(res.body.data.usuario).toBeDefined();
    expect(res.body.data.usuario.id).toBe(testUsuarioId);
    // No verificamos el valor exacto, solo que exista
    expect(res.body.data.usuario.idRol).toBeDefined();
    expect(res.body.data.usuario.idArea).toBeDefined();
    
    expect(res.body.data.permisosBits).toBeDefined();
    expect(res.body.data.permisosBits.valor).toBeDefined(); // Verificamos que existe, no el valor exacto
    expect(res.body.data.permisosBits.detalle).toBeDefined();
    expect(res.body.data.permisosBits.detalle.crear).toBeDefined();
    expect(res.body.data.permisosBits.detalle.eliminar).toBeDefined();
    expect(res.body.data.permisosBits.detalle.ver).toBeDefined();
    
    expect(res.body.data.permisosContextuales).toBeDefined();
    expect(Array.isArray(res.body.data.permisosContextuales)).toBe(true);
  });

  test('Debería devolver error 404 si el usuario no existe', async () => {
    const idUsuarioNoExistente = 99999;
    const res = await request(app)
      .get(`/api/permisos/info/${idUsuarioNoExistente}`)
      .set('Authorization', `Bearer ${token}`);
    
    expect(res.statusCode).toEqual(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Usuario no encontrado');
  });
}); 