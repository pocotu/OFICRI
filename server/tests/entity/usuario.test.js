/**
 * Pruebas para la entidad Usuario
 * Verifica operaciones CRUD en la tabla Usuario
 */

const db = require('../../config/database');
const { logger } = require('../../utils/logger');

describe('Pruebas de Entidad Usuario', () => {
  // Datos de prueba para un usuario
  const testUserData = {
    CodigoCIP: 'TEST123456',
    Nombres: 'Usuario',
    Apellidos: 'De Prueba',
    Rango: 'Suboficial',
    PasswordHash: '$2a$10$mBpQoMfPGGjYV2NzvL.YHeTw0znNqptBsYKrn.zxr5Hd2zQvmCv9q', // hash de 'Test1234'
    Salt: 'testSalt123',
    IDArea: 999,
    IDRol: 999
  };

  // ID del usuario creado en las pruebas
  let testUserId = null;

  // Asegurar que existen el área y rol necesarios para las pruebas
  beforeAll(async () => {
    try {
      // Desactivar temporalmente las restricciones de clave foránea
      await db.executeQuery('SET FOREIGN_KEY_CHECKS = 0');
      
      // Verificar si el área y rol existen
      const areaResult = await db.executeQuery('SELECT IDArea FROM AreaEspecializada WHERE IDArea = 999');
      const rolResult = await db.executeQuery('SELECT IDRol FROM Rol WHERE IDRol = 999');
      
      // Si no existe el área, crear una
      if (areaResult.length === 0) {
        await db.executeQuery(
          'INSERT INTO AreaEspecializada (IDArea, NombreArea, CodigoIdentificacion, TipoArea, IsActive, Descripcion) VALUES (?, ?, ?, ?, ?, ?)',
          [999, 'Área de Prueba', 'TEST-AREA', 'PRUEBA', 1, 'Área creada para pruebas']
        );
      }
      
      // Si no existe el rol, crear uno
      if (rolResult.length === 0) {
        await db.executeQuery(
          'INSERT INTO Rol (IDRol, NombreRol, Descripcion, NivelAcceso, Permisos) VALUES (?, ?, ?, ?, ?)',
          [999, 'Rol de Prueba', 'Rol creado para pruebas', 1, 255]
        );
      }
      
      logger.info(`Usando Área ID: 999 y Rol ID: 999 para las pruebas de Usuario`);
      
      // Limpiar cualquier registro previo
      try {
        // Primero eliminar registros relacionados en UsuarioLog si existen
        await db.executeQuery('DELETE FROM UsuarioLog WHERE IDUsuario IN (SELECT IDUsuario FROM Usuario WHERE CodigoCIP = ?)', 
          [testUserData.CodigoCIP]);
        // Luego eliminar el usuario
        await db.executeQuery('DELETE FROM Usuario WHERE CodigoCIP = ?', [testUserData.CodigoCIP]);
      } catch (error) {
        logger.debug(`Error al limpiar datos previos: ${error.message}`);
        // No es un error crítico, podemos continuar
      }
    } catch (error) {
      logger.error(`Error en la configuración de las pruebas: ${error.message}`);
      throw error;
    }
  });

  // Limpiar después de todas las pruebas
  afterAll(async () => {
    try {
      // Limpiar registros creados durante las pruebas
      if (testUserId) {
        // Primero eliminar registros relacionados en UsuarioLog si existen
        await db.executeQuery('DELETE FROM UsuarioLog WHERE IDUsuario = ?', [testUserId]);
        // Luego eliminar el usuario
        await db.executeQuery('DELETE FROM Usuario WHERE IDUsuario = ?', [testUserId]);
      }
      
      // Reactivar las restricciones de clave foránea
      await db.executeQuery('SET FOREIGN_KEY_CHECKS = 1');
    } catch (error) {
      logger.error(`Error al limpiar datos de prueba: ${error.message}`);
    } finally {
      // Cerrar la conexión a la base de datos
      await db.closePool();
    }
  });

  test('Debería crear un nuevo usuario', async () => {
    try {
      // Primero eliminar cualquier usuario de prueba anterior
      await db.executeQuery('DELETE FROM Usuario WHERE CodigoCIP = ?', [testUserData.CodigoCIP]);

      // Insertar el usuario de prueba
      const result = await db.executeQuery(
        'INSERT INTO Usuario (CodigoCIP, Nombres, Apellidos, Rango, PasswordHash, Salt, IDArea, IDRol) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [
          testUserData.CodigoCIP,
          testUserData.Nombres,
          testUserData.Apellidos,
          testUserData.Rango,
          testUserData.PasswordHash,
          testUserData.Salt,
          testUserData.IDArea,
          testUserData.IDRol
        ]
      );

      expect(result.affectedRows).toBe(1);
      expect(result.insertId).toBeGreaterThan(0);

      // Guardar el ID para pruebas posteriores
      testUserId = result.insertId;
    } catch (error) {
      logger.error(`Error al crear usuario: ${error.message}`);
      expect(error).toBeNull(); // Esta línea fallará la prueba si hay un error
    }
  });

  test('Debería obtener un usuario por ID', async () => {
    // Solo ejecutar si se creó el usuario correctamente
    if (!testUserId) {
      return;
    }

    try {
      const users = await db.executeQuery('SELECT * FROM Usuario WHERE IDUsuario = ?', [testUserId]);
      
      expect(users).toHaveLength(1);
      expect(users[0].CodigoCIP).toBe(testUserData.CodigoCIP);
      expect(users[0].Nombres).toBe(testUserData.Nombres);
      expect(users[0].Apellidos).toBe(testUserData.Apellidos);
    } catch (error) {
      logger.error(`Error al obtener usuario: ${error.message}`);
      expect(error).toBeNull();
    }
  });

  test('Debería obtener un usuario por CodigoCIP', async () => {
    try {
      const users = await db.executeQuery('SELECT * FROM Usuario WHERE CodigoCIP = ?', [testUserData.CodigoCIP]);
      
      expect(users).toHaveLength(1);
      expect(users[0].IDUsuario).toBe(testUserId);
      expect(users[0].Nombres).toBe(testUserData.Nombres);
      expect(users[0].Apellidos).toBe(testUserData.Apellidos);
    } catch (error) {
      logger.error(`Error al obtener usuario por CIP: ${error.message}`);
      expect(error).toBeNull();
    }
  });

  test('Debería actualizar datos de usuario', async () => {
    // Solo ejecutar si se creó el usuario correctamente
    if (!testUserId) {
      return;
    }

    const nuevoNombre = 'NombreActualizado';
    
    try {
      const result = await db.executeQuery(
        'UPDATE Usuario SET Nombres = ? WHERE IDUsuario = ?',
        [nuevoNombre, testUserId]
      );

      expect(result.affectedRows).toBe(1);

      // Verificar que se actualizó correctamente
      const users = await db.executeQuery('SELECT * FROM Usuario WHERE IDUsuario = ?', [testUserId]);
      expect(users).toHaveLength(1);
      expect(users[0].Nombres).toBe(nuevoNombre);
    } catch (error) {
      logger.error(`Error al actualizar usuario: ${error.message}`);
      expect(error).toBeNull();
    }
  });

  test('Debería eliminar un usuario', async () => {
    // Solo ejecutar si se creó el usuario correctamente
    if (!testUserId) {
      return;
    }

    try {
      const result = await db.executeQuery('DELETE FROM Usuario WHERE IDUsuario = ?', [testUserId]);
      
      expect(result.affectedRows).toBe(1);

      // Verificar que se eliminó correctamente
      const users = await db.executeQuery('SELECT * FROM Usuario WHERE IDUsuario = ?', [testUserId]);
      expect(users).toHaveLength(0);

      // Marcamos como null porque ya eliminamos el usuario
      testUserId = null;
    } catch (error) {
      logger.error(`Error al eliminar usuario: ${error.message}`);
      expect(error).toBeNull();
    }
  });
}); 