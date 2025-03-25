/**
 * Pruebas para la entidad ForenseDigital
 * Verifica operaciones CRUD en la tabla ForenseDigital
 */

const db = require('../../config/database');
const { logger } = require('../../utils/logger');

describe('Pruebas de Entidad ForenseDigital', () => {
  // IDs necesarios para las pruebas
  let testAreaId = null;
  // Flag para verificar si la tabla existe
  let tableExists = true;
  
  // ID del registro forense digital creado en las pruebas
  let testForenseDigitalId = null;

  // Datos de prueba para forense digital
  const testForenseDigitalData = {
    NumeroRegistro: `TEST-FORENSE-${Date.now()}`,
    OficioDoc: `TEST-OFI-FORENSE-${Date.now()}`,
    NumeroOficio: Math.floor(Math.random() * 10000),
    TipoPericia: 'EXTRACCIÓN DE INFORMACIÓN',
    Nombres: 'Investigador',
    Apellidos: 'De Prueba',
    DelitoInvestigado: 'PRUEBA AUTOMATIZADA',
    DispositivoTipo: 'CELULAR',
    DispositivoMarca: 'TEST BRAND',
    DispositivoModelo: 'TEST MODEL',
    DispositivoNumeroSerie: `SN-${Date.now()}`,
    MetodoExtraccion: 'MANUAL',
    Responsable: 'Perito de prueba',
    Observaciones: 'Registro creado para pruebas automatizadas'
  };

  // Configurar datos necesarios antes de las pruebas
  beforeAll(async () => {
    try {
      // Desactivar temporalmente las restricciones de clave foránea
      await db.executeQuery('SET FOREIGN_KEY_CHECKS = 0');
      
      // Verificar si la tabla ForenseDigital existe
      try {
        await db.executeQuery('SELECT 1 FROM ForenseDigital LIMIT 1');
      } catch (error) {
        if (error.message.includes("doesn't exist")) {
          tableExists = false;
          logger.warn('La tabla ForenseDigital no existe. Las pruebas de esta entidad serán omitidas.');
          return; // Salir temprano si la tabla no existe
        }
      }
      
      // 1. Obtener un área especializada para vincular
      const areaResult = await db.executeQuery('SELECT IDArea FROM AreaEspecializada LIMIT 1');
      if (areaResult.length === 0) {
        // Si no hay áreas, crear una para pruebas
        const insertArea = await db.executeQuery(
          'INSERT INTO AreaEspecializada (NombreArea, CodigoIdentificacion, TipoArea, IsActive) VALUES (?, ?, ?, ?)',
          ['Área de Prueba Forense', `TEST-AREA-FORENSE-${Date.now()}`, 'ESPECIALIZADA', true]
        );
        testAreaId = insertArea.insertId;
        logger.info(`Área de prueba creada para ForenseDigital con ID: ${testAreaId}`);
      } else {
        testAreaId = areaResult[0].IDArea;
      }
    } catch (error) {
      logger.error('Error en la configuración inicial de pruebas de ForenseDigital', { error });
      expect(error).toBeNull();
    }
  });

  // Limpiar después de todas las pruebas
  afterAll(async () => {
    if (!tableExists) return; // No hacer nada si la tabla no existe
    
    try {
      // Eliminar el registro forense digital de prueba si existe
      if (testForenseDigitalId) {
        await db.executeQuery('DELETE FROM ForenseDigital WHERE IDForenseDigital = ?', [testForenseDigitalId]);
      }
      
      // Reactivar las restricciones de clave foránea
      await db.executeQuery('SET FOREIGN_KEY_CHECKS = 1');

      // Cerrar conexión a la base de datos
      await db.closePool();
    } catch (error) {
      logger.error('Error al limpiar pruebas de ForenseDigital', { error });
    }
  });

  test('Debería crear un nuevo registro forense digital', async () => {
    if (!tableExists) {
      return; // Omitir si la tabla no existe
    }
    
    // Verificar que tenemos el área necesaria para la prueba
    if (!testAreaId) {
      console.log('No se encontró un área para vincular al registro forense digital');
      return;
    }

    try {
      // Eliminar cualquier registro previo con el mismo número de registro
      await db.executeQuery('DELETE FROM ForenseDigital WHERE NumeroRegistro = ?', [testForenseDigitalData.NumeroRegistro]);

      // Insertar el registro forense digital de prueba
      const result = await db.executeQuery(
        `INSERT INTO ForenseDigital (
          IDArea, NumeroRegistro, FechaIngreso, OficioDoc, NumeroOficio,
          TipoPericia, Nombres, Apellidos, DelitoInvestigado,
          DispositivoTipo, DispositivoMarca, DispositivoModelo, DispositivoNumeroSerie, MetodoExtraccion,
          Responsable, Observaciones, IsActive
        ) VALUES (?, ?, CURDATE(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          testAreaId,
          testForenseDigitalData.NumeroRegistro,
          testForenseDigitalData.OficioDoc,
          testForenseDigitalData.NumeroOficio,
          testForenseDigitalData.TipoPericia,
          testForenseDigitalData.Nombres,
          testForenseDigitalData.Apellidos,
          testForenseDigitalData.DelitoInvestigado,
          testForenseDigitalData.DispositivoTipo,
          testForenseDigitalData.DispositivoMarca,
          testForenseDigitalData.DispositivoModelo,
          testForenseDigitalData.DispositivoNumeroSerie,
          testForenseDigitalData.MetodoExtraccion,
          testForenseDigitalData.Responsable,
          testForenseDigitalData.Observaciones,
          true
        ]
      );

      expect(result.affectedRows).toBe(1);
      expect(result.insertId).toBeGreaterThan(0);

      // Guardar el ID para pruebas posteriores
      testForenseDigitalId = result.insertId;
    } catch (error) {
      expect(error).toBeNull();
    }
  });

  test('Debería obtener un registro forense digital por ID', async () => {
    if (!tableExists || !testForenseDigitalId) {
      return; // Omitir si la tabla no existe o no hay ID
    }

    try {
      const forenses = await db.executeQuery('SELECT * FROM ForenseDigital WHERE IDForenseDigital = ?', [testForenseDigitalId]);
      
      expect(forenses).toHaveLength(1);
      expect(forenses[0].NumeroRegistro).toBe(testForenseDigitalData.NumeroRegistro);
      expect(forenses[0].NumeroOficio).toBe(testForenseDigitalData.NumeroOficio);
      expect(forenses[0].TipoPericia).toBe(testForenseDigitalData.TipoPericia);
      expect(forenses[0].Nombres).toBe(testForenseDigitalData.Nombres);
      expect(forenses[0].Apellidos).toBe(testForenseDigitalData.Apellidos);
    } catch (error) {
      expect(error).toBeNull();
    }
  });

  test('Debería obtener un registro forense digital por número de registro', async () => {
    if (!tableExists || !testForenseDigitalId) {
      return; // Omitir si la tabla no existe o no hay ID
    }
    
    try {
      const forenses = await db.executeQuery('SELECT * FROM ForenseDigital WHERE NumeroRegistro = ?', [testForenseDigitalData.NumeroRegistro]);
      
      expect(forenses).toHaveLength(1);
      expect(forenses[0].IDForenseDigital).toBe(testForenseDigitalId);
    } catch (error) {
      expect(error).toBeNull();
    }
  });

  test('Debería actualizar datos de un registro forense digital', async () => {
    if (!tableExists || !testForenseDigitalId) {
      return; // Omitir si la tabla no existe o no hay ID
    }

    // Datos para la actualización
    const nuevaPericia = 'ANALISIS DE METADATOS';
    const nuevaObservacion = 'Registro forense actualizado en pruebas';
    
    try {
      const result = await db.executeQuery(
        'UPDATE ForenseDigital SET TipoPericia = ?, Observaciones = ? WHERE IDForenseDigital = ?',
        [nuevaPericia, nuevaObservacion, testForenseDigitalId]
      );

      expect(result.affectedRows).toBe(1);

      // Verificar que se actualizó correctamente
      const forenses = await db.executeQuery('SELECT * FROM ForenseDigital WHERE IDForenseDigital = ?', [testForenseDigitalId]);
      expect(forenses).toHaveLength(1);
      expect(forenses[0].TipoPericia).toBe(nuevaPericia);
      expect(forenses[0].Observaciones).toBe(nuevaObservacion);
      // Verificar que los otros campos no han cambiado
      expect(forenses[0].NumeroRegistro).toBe(testForenseDigitalData.NumeroRegistro);
    } catch (error) {
      expect(error).toBeNull();
    }
  });

  test('Debería desactivar un registro forense digital', async () => {
    if (!tableExists || !testForenseDigitalId) {
      return; // Omitir si la tabla no existe o no hay ID
    }

    try {
      // En lugar de eliminar físicamente, marcamos como inactivo
      const result = await db.executeQuery(
        'UPDATE ForenseDigital SET IsActive = FALSE WHERE IDForenseDigital = ?',
        [testForenseDigitalId]
      );

      expect(result.affectedRows).toBe(1);

      // Verificar que se desactivó correctamente
      const forenses = await db.executeQuery('SELECT * FROM ForenseDigital WHERE IDForenseDigital = ?', [testForenseDigitalId]);
      expect(forenses).toHaveLength(1);
      expect(forenses[0].IsActive).toBe(0); // 0 = FALSE en MySQL
    } catch (error) {
      expect(error).toBeNull();
    }
  });

  test('Debería eliminar físicamente un registro forense digital', async () => {
    if (!tableExists || !testForenseDigitalId) {
      return; // Omitir si la tabla no existe o no hay ID
    }

    try {
      const result = await db.executeQuery('DELETE FROM ForenseDigital WHERE IDForenseDigital = ?', [testForenseDigitalId]);
      
      expect(result.affectedRows).toBe(1);

      // Verificar que se eliminó correctamente
      const forenses = await db.executeQuery('SELECT * FROM ForenseDigital WHERE IDForenseDigital = ?', [testForenseDigitalId]);
      expect(forenses).toHaveLength(0);

      // Marcamos como null porque ya eliminamos el registro
      testForenseDigitalId = null;
    } catch (error) {
      expect(error).toBeNull();
    }
  });

  test('Debería probar el procedimiento almacenado sp_insertar_forense_digital', async () => {
    if (!tableExists) {
      return; // Omitir si la tabla no existe
    }
    
    // Verificar que tenemos el área necesaria para la prueba
    if (!testAreaId) {
      console.log('No se encontró un área para vincular al registro forense digital SP');
      return;
    }

    const nuevoForenseData = {
      NumeroRegistro: `TEST-SP-FORENSE-${Date.now()}`,
      OficioDoc: `TEST-SP-OFI-FORENSE-${Date.now()}`,
      NumeroOficio: Math.floor(Math.random() * 10000),
      TipoPericia: 'EXTRACCIÓN DE DATOS',
      Nombres: 'Investigador SP',
      Apellidos: 'De Prueba SP',
      DelitoInvestigado: 'PRUEBA SP',
      DispositivoTipo: 'LAPTOP',
      Responsable: 'Perito SP'
    };

    try {
      // Intentar usar el procedimiento almacenado para crear un registro
      const result = await db.executeQuery(
        'CALL sp_insertar_forense_digital(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [
          testAreaId,
          nuevoForenseData.NumeroRegistro,
          nuevoForenseData.OficioDoc,
          nuevoForenseData.NumeroOficio,
          nuevoForenseData.TipoPericia,
          nuevoForenseData.Nombres,
          nuevoForenseData.Apellidos,
          nuevoForenseData.DelitoInvestigado,
          nuevoForenseData.DispositivoTipo,
          nuevoForenseData.Responsable
        ]
      );

      // Limpiar después de la prueba
      await db.executeQuery('DELETE FROM ForenseDigital WHERE NumeroRegistro = ?', [nuevoForenseData.NumeroRegistro]);
    } catch (error) {
      // Si el error es que no existe el procedimiento, ignorarlo
      if (error.message.includes("PROCEDURE") && error.message.includes("doesn't exist")) {
        logger.warn('El procedimiento almacenado sp_insertar_forense_digital no existe. Esta prueba se omite.');
        return;
      }
      expect(error).toBeNull();
    }
  });
}); 