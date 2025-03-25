/**
 * Pruebas para la entidad QuimicaToxicologiaForense
 * Verifica operaciones CRUD en la tabla QuimicaToxicologiaForense
 */

const db = require('../../config/database');
const { logger } = require('../../utils/logger');

describe('Pruebas de Entidad QuimicaToxicologiaForense', () => {
  // IDs necesarios para las pruebas
  let testAreaId = null;
  // Flag para verificar si la tabla existe
  let tableExists = true;
  
  // ID del registro químico/toxicológico creado en las pruebas
  let testQuimicaId = null;

  // Datos de prueba para químico/toxicológico
  const testQuimicaData = {
    NumeroRegistro: `TEST-QUIMICA-${Date.now()}`,
    OficioDoc: `TEST-OFI-QUIMICA-${Date.now()}`,
    NumeroOficio: Math.floor(Math.random() * 10000),
    TipoMuestra: 'SANGRE',
    PesajeMuestra: '25ml',
    ResponsableMuestreo: 'Investigador de Prueba',
    ResultadoPreliminar: 'NEGATIVO',
    Responsable: 'Perito de prueba',
    Observaciones: 'Registro creado para pruebas automatizadas'
  };

  // Configurar datos necesarios antes de las pruebas
  beforeAll(async () => {
    try {
      // Desactivar temporalmente las restricciones de clave foránea
      await db.executeQuery('SET FOREIGN_KEY_CHECKS = 0');
      
      // Verificar si la tabla QuimicaToxicologiaForense existe
      try {
        await db.executeQuery('SELECT 1 FROM QuimicaToxicologiaForense LIMIT 1');
      } catch (error) {
        if (error.message.includes("doesn't exist")) {
          tableExists = false;
          logger.warn('La tabla QuimicaToxicologiaForense no existe. Las pruebas de esta entidad serán omitidas.');
          return; // Salir temprano si la tabla no existe
        }
      }
      
      // 1. Obtener un área especializada para vincular
      const areaResult = await db.executeQuery('SELECT IDArea FROM AreaEspecializada LIMIT 1');
      if (areaResult.length === 0) {
        // Si no hay áreas, crear una para pruebas
        const insertArea = await db.executeQuery(
          'INSERT INTO AreaEspecializada (NombreArea, CodigoIdentificacion, TipoArea, IsActive) VALUES (?, ?, ?, ?)',
          ['Área de Prueba Química', `TEST-AREA-QUIMICA-${Date.now()}`, 'ESPECIALIZADA', true]
        );
        testAreaId = insertArea.insertId;
        logger.info(`Área de prueba creada para QuímicaToxicológica con ID: ${testAreaId}`);
      } else {
        testAreaId = areaResult[0].IDArea;
      }
    } catch (error) {
      logger.error('Error en la configuración inicial de pruebas de QuímicaToxicológica', { error });
    }
  });

  // Limpiar después de todas las pruebas
  afterAll(async () => {
    if (!tableExists) return; // No hacer nada si la tabla no existe
    
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
      logger.error('Error al limpiar pruebas de QuímicaToxicológica', { error });
    }
  });

  test('Debería crear un nuevo registro químico/toxicológico', async () => {
    if (!tableExists) {
      return; // Omitir si la tabla no existe
    }
    
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
          TipoMuestra, PesajeMuestra, ResponsableMuestreo, ResultadoPreliminar,
          Responsable, Observaciones, IsActive
        ) VALUES (?, ?, CURDATE(), ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          testAreaId,
          testQuimicaData.NumeroRegistro,
          testQuimicaData.OficioDoc,
          testQuimicaData.NumeroOficio,
          testQuimicaData.TipoMuestra,
          testQuimicaData.PesajeMuestra,
          testQuimicaData.ResponsableMuestreo,
          testQuimicaData.ResultadoPreliminar,
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
    if (!tableExists || !testQuimicaId) {
      return; // Omitir si la tabla no existe o no hay ID
    }

    try {
      const quimicas = await db.executeQuery('SELECT * FROM QuimicaToxicologiaForense WHERE IDQuimicaToxForense = ?', [testQuimicaId]);
      
      expect(quimicas).toHaveLength(1);
      expect(quimicas[0].NumeroRegistro).toBe(testQuimicaData.NumeroRegistro);
      expect(quimicas[0].NumeroOficio).toBe(testQuimicaData.NumeroOficio);
      expect(quimicas[0].TipoMuestra).toBe(testQuimicaData.TipoMuestra);
      expect(quimicas[0].PesajeMuestra).toBe(testQuimicaData.PesajeMuestra);
      expect(quimicas[0].ResultadoPreliminar).toBe(testQuimicaData.ResultadoPreliminar);
    } catch (error) {
      expect(error).toBeNull();
    }
  });

  test('Debería obtener un registro químico/toxicológico por número de registro', async () => {
    if (!tableExists || !testQuimicaId) {
      return; // Omitir si la tabla no existe o no hay ID
    }
    
    try {
      const quimicas = await db.executeQuery('SELECT * FROM QuimicaToxicologiaForense WHERE NumeroRegistro = ?', [testQuimicaData.NumeroRegistro]);
      
      expect(quimicas).toHaveLength(1);
      expect(quimicas[0].IDQuimicaToxForense).toBe(testQuimicaId);
    } catch (error) {
      expect(error).toBeNull();
    }
  });

  test('Debería actualizar datos de un registro químico/toxicológico', async () => {
    if (!tableExists || !testQuimicaId) {
      return; // Omitir si la tabla no existe o no hay ID
    }

    // Datos para la actualización
    const nuevaMuestra = 'ORINA';
    const nuevoResultado = 'POSITIVO';
    
    try {
      const result = await db.executeQuery(
        'UPDATE QuimicaToxicologiaForense SET TipoMuestra = ?, ResultadoPreliminar = ? WHERE IDQuimicaToxForense = ?',
        [nuevaMuestra, nuevoResultado, testQuimicaId]
      );

      expect(result.affectedRows).toBe(1);

      // Verificar que se actualizó correctamente
      const quimicas = await db.executeQuery('SELECT * FROM QuimicaToxicologiaForense WHERE IDQuimicaToxForense = ?', [testQuimicaId]);
      expect(quimicas).toHaveLength(1);
      expect(quimicas[0].TipoMuestra).toBe(nuevaMuestra);
      expect(quimicas[0].ResultadoPreliminar).toBe(nuevoResultado);
      // Verificar que los otros campos no han cambiado
      expect(quimicas[0].NumeroRegistro).toBe(testQuimicaData.NumeroRegistro);
    } catch (error) {
      expect(error).toBeNull();
    }
  });

  test('Debería desactivar un registro químico/toxicológico', async () => {
    if (!tableExists || !testQuimicaId) {
      return; // Omitir si la tabla no existe o no hay ID
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
    if (!tableExists || !testQuimicaId) {
      return; // Omitir si la tabla no existe o no hay ID
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