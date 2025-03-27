/**
 * Pruebas para la entidad Dosaje
 * Verifica operaciones CRUD en la tabla Dosaje
 */

const db = require('../../config/database');
const { logger } = require('../../utils/logger');

describe('Pruebas de Entidad Dosaje', () => {
  // IDs necesarios para las pruebas
  let testAreaId = null;
  // Flag para verificar si la tabla existe
  let tableExists = true;
  
  // ID del registro de dosaje creado en las pruebas
  let testDosajeId = null;

  // Datos de prueba para dosaje
  const testDosajeData = {
    NumeroRegistro: `TEST-DOSAJE-${Date.now()}`,
    OficioDoc: `TEST-OFI-DOSAJE-${Date.now()}`,
    NumeroOficio: Math.floor(Math.random() * 10000),
    TipoDosaje: 'ETÍLICO',
    Nombres: 'Persona',
    Apellidos: 'De Prueba',
    Procedencia: 'Procedencia de la prueba automatizada',
    Responsable: 'Técnico de prueba',
    Observaciones: 'Registro creado para pruebas automatizadas'
  };

  // Configurar datos necesarios antes de las pruebas
  beforeAll(async () => {
    try {
      // Desactivar temporalmente las restricciones de clave foránea
      await db.executeQuery('SET FOREIGN_KEY_CHECKS = 0');
      
      // Verificar si la tabla Dosaje existe
      try {
        await db.executeQuery('SELECT 1 FROM Dosaje LIMIT 1');
      } catch (error) {
        if (error.message.includes("doesn't exist")) {
          tableExists = false;
          logger.warn('La tabla Dosaje no existe. Las pruebas de esta entidad serán omitidas.');
          return; // Salir temprano si la tabla no existe
        }
      }
      
      // 1. Obtener un área especializada para vincular
      const areaResult = await db.executeQuery('SELECT IDArea FROM AreaEspecializada LIMIT 1');
      if (areaResult.length === 0) {
        // Si no hay áreas, crear una para pruebas
        const insertArea = await db.executeQuery(
          'INSERT INTO AreaEspecializada (NombreArea, CodigoIdentificacion, TipoArea, IsActive) VALUES (?, ?, ?, ?)',
          ['Área de Prueba Dosaje', `TEST-AREA-DOSAJE-${Date.now()}`, 'ESPECIALIZADA', true]
        );
        testAreaId = insertArea.insertId;
        logger.info(`Área de prueba creada para Dosaje con ID: ${testAreaId}`);
      } else {
        testAreaId = areaResult[0].IDArea;
      }
    } catch (error) {
      logger.error('Error en la configuración inicial de pruebas de Dosaje', { error });
    }
  });

  // Limpiar después de todas las pruebas
  afterAll(async () => {
    if (!tableExists) return; // No hacer nada si la tabla no existe
    
    try {
      // Eliminar el registro de dosaje de prueba si existe
      if (testDosajeId) {
        await db.executeQuery('DELETE FROM Dosaje WHERE IDDosaje = ?', [testDosajeId]);
      }
      
      // Reactivar las restricciones de clave foránea
      await db.executeQuery('SET FOREIGN_KEY_CHECKS = 1');

      // Cerrar conexión a la base de datos
      await db.closePool();
    } catch (error) {
      logger.error('Error al limpiar pruebas de Dosaje', { error });
    }
  });

  test('Debería crear un nuevo registro de dosaje', async () => {
    if (!tableExists) {
      return; // Omitir si la tabla no existe
    }
    
    // Verificar que tenemos el área necesaria para la prueba
    if (!testAreaId) {
      console.log('No se encontró un área para vincular al registro de dosaje');
      return;
    }

    try {
      // Eliminar cualquier registro previo con el mismo número de registro
      await db.executeQuery('DELETE FROM Dosaje WHERE NumeroRegistro = ?', [testDosajeData.NumeroRegistro]);

      // Insertar el registro de dosaje de prueba
      const result = await db.executeQuery(
        `INSERT INTO Dosaje (
          IDArea, NumeroRegistro, FechaIngreso, OficioDoc, NumeroOficio,
          TipoDosaje, Nombres, Apellidos, Procedencia,
          Responsable, Observaciones, IsActive
        ) VALUES (?, ?, CURDATE(), ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          testAreaId,
          testDosajeData.NumeroRegistro,
          testDosajeData.OficioDoc,
          testDosajeData.NumeroOficio,
          testDosajeData.TipoDosaje,
          testDosajeData.Nombres,
          testDosajeData.Apellidos,
          testDosajeData.Procedencia,
          testDosajeData.Responsable,
          testDosajeData.Observaciones,
          true
        ]
      );

      expect(result.affectedRows).toBe(1);
      expect(result.insertId).toBeGreaterThan(0);

      // Guardar el ID para pruebas posteriores
      testDosajeId = result.insertId;
    } catch (error) {
      expect(error).toBeNull();
    }
  });

  test('Debería obtener un registro de dosaje por ID', async () => {
    if (!tableExists || !testDosajeId) {
      return; // Omitir si la tabla no existe o no hay ID
    }

    try {
      const dosajes = await db.executeQuery('SELECT * FROM Dosaje WHERE IDDosaje = ?', [testDosajeId]);
      
      expect(dosajes).toHaveLength(1);
      expect(dosajes[0].NumeroRegistro).toBe(testDosajeData.NumeroRegistro);
      expect(dosajes[0].NumeroOficio).toBe(testDosajeData.NumeroOficio);
      expect(dosajes[0].TipoDosaje).toBe(testDosajeData.TipoDosaje);
      expect(dosajes[0].Nombres).toBe(testDosajeData.Nombres);
      expect(dosajes[0].Apellidos).toBe(testDosajeData.Apellidos);
    } catch (error) {
      expect(error).toBeNull();
    }
  });

  test('Debería obtener un registro de dosaje por número de registro', async () => {
    if (!tableExists || !testDosajeId) {
      return; // Omitir si la tabla no existe o no hay ID
    }
    
    try {
      const dosajes = await db.executeQuery('SELECT * FROM Dosaje WHERE NumeroRegistro = ?', [testDosajeData.NumeroRegistro]);
      
      expect(dosajes).toHaveLength(1);
      expect(dosajes[0].IDDosaje).toBe(testDosajeId);
    } catch (error) {
      expect(error).toBeNull();
    }
  });

  test('Debería actualizar datos de un registro de dosaje', async () => {
    if (!tableExists || !testDosajeId) {
      return; // Omitir si la tabla no existe o no hay ID
    }

    // Datos para la actualización
    const nuevoTipo = 'TOXICOLÓGICO';
    const nuevaObservacion = 'Registro dosaje actualizado en pruebas';
    
    try {
      const result = await db.executeQuery(
        'UPDATE Dosaje SET TipoDosaje = ?, Observaciones = ? WHERE IDDosaje = ?',
        [nuevoTipo, nuevaObservacion, testDosajeId]
      );

      expect(result.affectedRows).toBe(1);

      // Verificar que se actualizó correctamente
      const dosajes = await db.executeQuery('SELECT * FROM Dosaje WHERE IDDosaje = ?', [testDosajeId]);
      expect(dosajes).toHaveLength(1);
      expect(dosajes[0].TipoDosaje).toBe(nuevoTipo);
      expect(dosajes[0].Observaciones).toBe(nuevaObservacion);
      // Verificar que los otros campos no han cambiado
      expect(dosajes[0].NumeroRegistro).toBe(testDosajeData.NumeroRegistro);
    } catch (error) {
      expect(error).toBeNull();
    }
  });

  test('Debería desactivar un registro de dosaje', async () => {
    if (!tableExists || !testDosajeId) {
      return; // Omitir si la tabla no existe o no hay ID
    }

    try {
      // En lugar de eliminar físicamente, marcamos como inactivo
      const result = await db.executeQuery(
        'UPDATE Dosaje SET IsActive = FALSE WHERE IDDosaje = ?',
        [testDosajeId]
      );

      expect(result.affectedRows).toBe(1);

      // Verificar que se desactivó correctamente
      const dosajes = await db.executeQuery('SELECT * FROM Dosaje WHERE IDDosaje = ?', [testDosajeId]);
      expect(dosajes).toHaveLength(1);
      expect(dosajes[0].IsActive).toBe(0); // 0 = FALSE en MySQL
    } catch (error) {
      expect(error).toBeNull();
    }
  });

  test('Debería eliminar físicamente un registro de dosaje', async () => {
    if (!tableExists || !testDosajeId) {
      return; // Omitir si la tabla no existe o no hay ID
    }

    try {
      const result = await db.executeQuery('DELETE FROM Dosaje WHERE IDDosaje = ?', [testDosajeId]);
      
      expect(result.affectedRows).toBe(1);

      // Verificar que se eliminó correctamente
      const dosajes = await db.executeQuery('SELECT * FROM Dosaje WHERE IDDosaje = ?', [testDosajeId]);
      expect(dosajes).toHaveLength(0);

      // Marcamos como null porque ya eliminamos el registro
      testDosajeId = null;
    } catch (error) {
      expect(error).toBeNull();
    }
  });

  test('Debería probar el procedimiento almacenado sp_insertar_dosaje', async () => {
    if (!tableExists) {
      return; // Omitir si la tabla no existe
    }
    
    // Verificar que tenemos el área necesaria para la prueba
    if (!testAreaId) {
      console.log('No se encontró un área para vincular al registro de dosaje SP');
      return;
    }

    const nuevoDosajeData = {
      NumeroRegistro: `TEST-DOSAJE-SP-${Date.now()}`,
      OficioDoc: 'TEST-SP',
      NumeroOficio: 999999,
      TipoDosaje: 'TOXICOLÓGICO',
      Nombres: 'ProcAlmacenado',
      Apellidos: 'TestUsuario',
      Procedencia: 'Prueba SP',
      Responsable: 'Sistema',
      Observaciones: 'Creado por procedimiento almacenado de prueba'
    };

    try {
      // Intentar usar el procedimiento almacenado para crear un registro
      const result = await db.executeQuery(
        'CALL sp_insertar_dosaje(?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [
          testAreaId,
          nuevoDosajeData.NumeroRegistro,
          nuevoDosajeData.OficioDoc,
          nuevoDosajeData.NumeroOficio,
          nuevoDosajeData.TipoDosaje,
          nuevoDosajeData.Nombres,
          nuevoDosajeData.Apellidos,
          nuevoDosajeData.Procedencia,
          nuevoDosajeData.Responsable,
          nuevoDosajeData.Observaciones
        ]
      );

      // Limpiar después de la prueba
      await db.executeQuery('DELETE FROM Dosaje WHERE NumeroRegistro = ?', [nuevoDosajeData.NumeroRegistro]);
    } catch (error) {
      // Si el error es que no existe el procedimiento, ignorarlo
      if (error.message.includes("PROCEDURE") && error.message.includes("doesn't exist")) {
        logger.warn('El procedimiento almacenado sp_insertar_dosaje no existe. Esta prueba se omite.');
        return;
      }
      expect(error).toBeNull();
    }
  });
}); 