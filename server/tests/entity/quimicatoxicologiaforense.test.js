/**
 * Pruebas para la entidad QuimicaToxicologiaForense
 * Verifica operaciones CRUD en la tabla QuimicaToxicologiaForense
 */

const db = require('../../config/database');
const { logger } = require('../../utils/logger');

describe('Pruebas de Entidad QuimicaToxicologiaForense', () => {
  // IDs necesarios para las pruebas
  let testAreaId = null;
  
  // ID del registro químico/toxicológico creado en las pruebas
  let testQuimicaId = null;

  // Datos de prueba para químico/toxicológico
  const testQuimicaData = {
    NumeroRegistro: `TEST-QUIMICA-${Date.now()}`,
    OficioDoc: `TEST-OFI-QUIMICA-${Date.now()}`,
    NumeroOficio: Math.floor(Math.random() * 10000),
    Examen: 'TOXICOLOGÍA',
    Nombres: 'Sujeto',
    Apellidos: 'De Prueba',
    DelitoInfraccion: 'PRUEBA AUTOMATIZADA',
    Como: 'SUSTANCIA INCAUTADA',
    Responsable: 'Químico de prueba',
    Observaciones: 'Registro creado para pruebas automatizadas'
  };

  // Configurar datos necesarios antes de las pruebas
  beforeAll(async () => {
    try {
      // Desactivar temporalmente las restricciones de clave foránea
      await db.executeQuery('SET FOREIGN_KEY_CHECKS = 0');
      
      // 1. Obtener un área especializada para vincular
      const areaResult = await db.executeQuery('SELECT IDArea FROM AreaEspecializada LIMIT 1');
      if (areaResult.length === 0) {
        // Si no hay áreas, crear una para pruebas
        const insertArea = await db.executeQuery(
          'INSERT INTO AreaEspecializada (NombreArea, CodigoIdentificacion, TipoArea, IsActive) VALUES (?, ?, ?, ?)',
          ['Área de Prueba Química', `TEST-AREA-QUIMICA-${Date.now()}`, 'ESPECIALIZADA', true]
        );
        testAreaId = insertArea.insertId;
        logger.info(`Área de prueba creada para QuimicaToxicologiaForense con ID: ${testAreaId}`);
      } else {
        testAreaId = areaResult[0].IDArea;
      }
    } catch (error) {
      logger.error('Error en la configuración inicial de pruebas de QuimicaToxicologiaForense', { error });
      expect(error).toBeNull();
    }
  });

  // Limpiar después de todas las pruebas
  afterAll(async () => {
    try {
      // Eliminar el registro químico/toxicológico de prueba si existe
      if (testQuimicaId) {
        await db.executeQuery('DELETE FROM QuimicaToxicologiaForense WHERE IDQuimicaToxForense = ?', [testQuimicaId]);
      }
      
      // Reactivar las restricciones de clave foránea
      await db.executeQuery('SET FOREIGN_KEY_CHECKS = 1');

      // Cerrar conexión a la base de datos
      await db.closePool();
    } catch (error) {
      logger.error('Error al limpiar pruebas de QuimicaToxicologiaForense', { error });
    }
  });

  test('Debería crear un nuevo registro químico/toxicológico', async () => {
    // Verificar que tenemos el área necesaria para la prueba
    if (!testAreaId) {
      console.log('No se encontró un área para vincular al registro químico/toxicológico');
      return;
    }

    try {
      // Eliminar cualquier registro previo con el mismo número de registro
      await db.executeQuery('DELETE FROM QuimicaToxicologiaForense WHERE NumeroRegistro = ?', [testQuimicaData.NumeroRegistro]);

      // Insertar el registro químico/toxicológico de prueba
      const result = await db.executeQuery(
        `INSERT INTO QuimicaToxicologiaForense (
          IDArea, NumeroRegistro, FechaIngreso, OficioDoc, NumeroOficio,
          Examen, Nombres, Apellidos, DelitoInfraccion, Como,
          Responsable, Observaciones, IsActive
        ) VALUES (?, ?, CURDATE(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          testAreaId,
          testQuimicaData.NumeroRegistro,
          testQuimicaData.OficioDoc,
          testQuimicaData.NumeroOficio,
          testQuimicaData.Examen,
          testQuimicaData.Nombres,
          testQuimicaData.Apellidos,
          testQuimicaData.DelitoInfraccion,
          testQuimicaData.Como,
          testQuimicaData.Responsable,
          testQuimicaData.Observaciones,
          true
        ]
      );

      expect(result.affectedRows).toBe(1);
      expect(result.insertId).toBeGreaterThan(0);

      // Guardar el ID para pruebas posteriores
      testQuimicaId = result.insertId;
    } catch (error) {
      expect(error).toBeNull();
    }
  });

  test('Debería obtener un registro químico/toxicológico por ID', async () => {
    // Solo ejecutar si se creó el registro correctamente
    if (!testQuimicaId) {
      return;
    }

    try {
      const quimicas = await db.executeQuery('SELECT * FROM QuimicaToxicologiaForense WHERE IDQuimicaToxForense = ?', [testQuimicaId]);
      
      expect(quimicas).toHaveLength(1);
      expect(quimicas[0].NumeroRegistro).toBe(testQuimicaData.NumeroRegistro);
      expect(quimicas[0].NumeroOficio).toBe(testQuimicaData.NumeroOficio);
      expect(quimicas[0].Examen).toBe(testQuimicaData.Examen);
      expect(quimicas[0].Nombres).toBe(testQuimicaData.Nombres);
      expect(quimicas[0].Apellidos).toBe(testQuimicaData.Apellidos);
    } catch (error) {
      expect(error).toBeNull();
    }
  });

  test('Debería obtener un registro químico/toxicológico por número de registro', async () => {
    try {
      const quimicas = await db.executeQuery('SELECT * FROM QuimicaToxicologiaForense WHERE NumeroRegistro = ?', [testQuimicaData.NumeroRegistro]);
      
      expect(quimicas).toHaveLength(1);
      expect(quimicas[0].IDQuimicaToxForense).toBe(testQuimicaId);
    } catch (error) {
      expect(error).toBeNull();
    }
  });

  test('Debería actualizar datos de un registro químico/toxicológico', async () => {
    // Solo ejecutar si se creó el registro correctamente
    if (!testQuimicaId) {
      return;
    }

    // Datos para la actualización
    const nuevoExamen = 'ANÁLISIS QUÍMICO';
    const nuevaObservacion = 'Registro químico actualizado en pruebas';
    
    try {
      const result = await db.executeQuery(
        'UPDATE QuimicaToxicologiaForense SET Examen = ?, Observaciones = ? WHERE IDQuimicaToxForense = ?',
        [nuevoExamen, nuevaObservacion, testQuimicaId]
      );

      expect(result.affectedRows).toBe(1);

      // Verificar que se actualizó correctamente
      const quimicas = await db.executeQuery('SELECT * FROM QuimicaToxicologiaForense WHERE IDQuimicaToxForense = ?', [testQuimicaId]);
      expect(quimicas).toHaveLength(1);
      expect(quimicas[0].Examen).toBe(nuevoExamen);
      expect(quimicas[0].Observaciones).toBe(nuevaObservacion);
      // Verificar que los otros campos no han cambiado
      expect(quimicas[0].NumeroRegistro).toBe(testQuimicaData.NumeroRegistro);
    } catch (error) {
      expect(error).toBeNull();
    }
  });

  test('Debería desactivar un registro químico/toxicológico', async () => {
    // Solo ejecutar si se creó el registro correctamente
    if (!testQuimicaId) {
      return;
    }

    try {
      // En lugar de eliminar físicamente, marcamos como inactivo
      const result = await db.executeQuery(
        'UPDATE QuimicaToxicologiaForense SET IsActive = FALSE WHERE IDQuimicaToxForense = ?',
        [testQuimicaId]
      );

      expect(result.affectedRows).toBe(1);

      // Verificar que se desactivó correctamente
      const quimicas = await db.executeQuery('SELECT * FROM QuimicaToxicologiaForense WHERE IDQuimicaToxForense = ?', [testQuimicaId]);
      expect(quimicas).toHaveLength(1);
      expect(quimicas[0].IsActive).toBe(0); // 0 = FALSE en MySQL
    } catch (error) {
      expect(error).toBeNull();
    }
  });

  test('Debería eliminar físicamente un registro químico/toxicológico', async () => {
    // Solo ejecutar si se creó el registro correctamente
    if (!testQuimicaId) {
      return;
    }

    try {
      const result = await db.executeQuery('DELETE FROM QuimicaToxicologiaForense WHERE IDQuimicaToxForense = ?', [testQuimicaId]);
      
      expect(result.affectedRows).toBe(1);

      // Verificar que se eliminó correctamente
      const quimicas = await db.executeQuery('SELECT * FROM QuimicaToxicologiaForense WHERE IDQuimicaToxForense = ?', [testQuimicaId]);
      expect(quimicas).toHaveLength(0);

      // Marcamos como null porque ya eliminamos el registro
      testQuimicaId = null;
    } catch (error) {
      expect(error).toBeNull();
    }
  });
}); 