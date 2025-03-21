/**
 * Pruebas para la entidad Derivacion
 * Verifica operaciones CRUD en la tabla Derivacion
 */

const db = require('../../config/database');
const { logger } = require('../../utils/logger');

describe('Pruebas de Entidad Derivacion', () => {
  // IDs de registros necesarios para las pruebas
  let testMesaPartesId = null;
  let testAreaOrigenId = null;
  let testAreaDestinoId = null;
  let testUsuarioDerivaId = null;
  let testUsuarioRecibeId = null;
  let testDocumentoId = null;
  
  // ID de la derivación creada en las pruebas
  let testDerivacionId = null;

  // Datos de prueba para derivación
  const testDerivacionData = {
    FechaDerivacion: new Date().toISOString().slice(0, 19).replace('T', ' '), // Formato MySQL DATETIME
    EstadoDerivacion: 'PENDIENTE',
    Observacion: 'Derivación creada para pruebas automatizadas'
  };

  // Configurar datos necesarios antes de las pruebas
  beforeAll(async () => {
    let puedeEjecutarPruebas = true;
    
    try {
      // Desactivar temporalmente las restricciones de clave foránea
      await db.executeQuery('SET FOREIGN_KEY_CHECKS = 0');
      
      // 1. Obtener una Mesa de Partes
      const mesaPartesResult = await db.executeQuery('SELECT IDMesaPartes FROM MesaPartes LIMIT 1');
      if (mesaPartesResult.length === 0) {
        logger.info('No se encontraron Mesas de Partes. Se requiere al menos una Mesa de Partes para las pruebas.');
        puedeEjecutarPruebas = false;
      } else {
        testMesaPartesId = mesaPartesResult[0].IDMesaPartes;
      }

      // 2. Obtener Áreas 
      const areasResult = await db.executeQuery('SELECT IDArea FROM AreaEspecializada LIMIT 2');
      if (areasResult.length < 2) {
        logger.info('No se encontraron suficientes Áreas. Se requieren al menos dos Áreas para las pruebas de derivación.');
        puedeEjecutarPruebas = false;
      } else {
        testAreaOrigenId = areasResult[0].IDArea;
        testAreaDestinoId = areasResult[1].IDArea;
      }

      // 3. Obtener Usuarios
      const usuariosResult = await db.executeQuery('SELECT IDUsuario FROM Usuario LIMIT 2');
      if (usuariosResult.length < 2) {
        logger.info('No se encontraron suficientes Usuarios. Se requieren al menos dos Usuarios para las pruebas de derivación.');
        puedeEjecutarPruebas = false;
      } else {
        testUsuarioDerivaId = usuariosResult[0].IDUsuario;
        testUsuarioRecibeId = usuariosResult[1].IDUsuario;
      }

      // 4. Obtener un Documento existente o crear uno
      const documentosResult = await db.executeQuery('SELECT IDDocumento FROM Documento LIMIT 1');
      if (documentosResult.length > 0) {
        testDocumentoId = documentosResult[0].IDDocumento;
      } else if (puedeEjecutarPruebas) {
        // No hay documentos, intentamos crear uno
        const nroRegistro = `TEST-REG-DERIV-${Date.now()}`;
        const insertDocumento = await db.executeQuery(
          `INSERT INTO Documento (
            IDMesaPartes, IDAreaActual, IDUsuarioCreador, 
            NroRegistro, NumeroOficioDocumento, FechaDocumento, 
            OrigenDocumento, Estado, Observaciones
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            testMesaPartesId,
            testAreaOrigenId,
            testUsuarioDerivaId,
            nroRegistro,
            `TEST-OFI-DERIV-${Date.now()}`,
            new Date().toISOString().split('T')[0],
            'EXTERNO',
            'REGISTRADO',
            'Documento para pruebas de derivación'
          ]
        );
        
        if (insertDocumento.affectedRows === 1) {
          testDocumentoId = insertDocumento.insertId;
          logger.info(`Documento de prueba creado con ID: ${testDocumentoId}`);
        } else {
          logger.warn('No se pudo crear un documento de prueba para las derivaciones.');
          puedeEjecutarPruebas = false;
        }
      }
      
      if (puedeEjecutarPruebas) {
        logger.info(`Usando Mesa ID: ${testMesaPartesId}, Áreas ID: ${testAreaOrigenId}/${testAreaDestinoId}, Usuarios ID: ${testUsuarioDerivaId}/${testUsuarioRecibeId}, Documento ID: ${testDocumentoId}`);
      } else {
        logger.warn('No se pueden ejecutar todas las pruebas de Derivación debido a la falta de datos necesarios.');
      }
    } catch (error) {
      logger.error('Error en la configuración inicial de pruebas de Derivacion', { error });
      expect(error).toBeNull();
    }
  });

  // Limpiar después de todas las pruebas
  afterAll(async () => {
    try {
      // Eliminar la derivación de prueba si se creó
      if (testDerivacionId) {
        await db.executeQuery('DELETE FROM Derivacion WHERE IDDerivacion = ?', [testDerivacionId]);
      }
      
      // Eliminar el documento de prueba si se creó
      if (testDocumentoId) {
        await db.executeQuery('DELETE FROM Documento WHERE IDDocumento = ?', [testDocumentoId]);
      }
      
      // Reactivar las restricciones de clave foránea
      await db.executeQuery('SET FOREIGN_KEY_CHECKS = 1');
    } catch (error) {
      logger.error('Error al limpiar pruebas de Derivacion', { error });
    }
  });

  test('Debería crear una nueva derivación', async () => {
    // Verificar que tenemos todos los datos necesarios
    if (!testDocumentoId || !testAreaOrigenId || !testAreaDestinoId || !testUsuarioDerivaId) {
      console.log('Falta configuración previa para la prueba de derivación');
      return;
    }

    try {
      // Eliminar cualquier derivación previa del mismo documento (por si acaso)
      await db.executeQuery(
        'DELETE FROM Derivacion WHERE IDDocumento = ? AND IDAreaOrigen = ? AND IDAreaDestino = ?',
        [testDocumentoId, testAreaOrigenId, testAreaDestinoId]
      );

      // Insertar la derivación de prueba
      const result = await db.executeQuery(
        `INSERT INTO Derivacion (
          IDDocumento, IDMesaPartes, IDAreaOrigen, IDAreaDestino, 
          IDUsuarioDeriva, EstadoDerivacion, Observacion
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          testDocumentoId,
          testMesaPartesId,
          testAreaOrigenId,
          testAreaDestinoId,
          testUsuarioDerivaId,
          testDerivacionData.EstadoDerivacion,
          testDerivacionData.Observacion
        ]
      );

      expect(result.affectedRows).toBe(1);
      expect(result.insertId).toBeGreaterThan(0);

      // Guardar el ID para pruebas posteriores
      testDerivacionId = result.insertId;
    } catch (error) {
      logger.error(`Error al crear derivación: ${error.message}`);
      expect(error).toBeNull();
    }
  });

  test('Debería obtener una derivación por ID', async () => {
    // Solo ejecutar si se creó la derivación correctamente
    if (!testDerivacionId) {
      return;
    }

    try {
      const derivaciones = await db.executeQuery('SELECT * FROM Derivacion WHERE IDDerivacion = ?', [testDerivacionId]);
      
      expect(derivaciones).toHaveLength(1);
      expect(derivaciones[0].IDDocumento).toBe(testDocumentoId);
      expect(derivaciones[0].IDAreaOrigen).toBe(testAreaOrigenId);
      expect(derivaciones[0].IDAreaDestino).toBe(testAreaDestinoId);
      expect(derivaciones[0].EstadoDerivacion).toBe(testDerivacionData.EstadoDerivacion);
    } catch (error) {
      logger.error(`Error al obtener derivación: ${error.message}`);
      expect(error).toBeNull();
    }
  });

  test('Debería actualizar el estado de una derivación', async () => {
    // Solo ejecutar si se creó la derivación correctamente
    if (!testDerivacionId) {
      return;
    }

    const nuevoEstado = 'RECIBIDO';
    const nuevaObservacion = 'Derivación actualizada en pruebas';
    
    try {
      const fechaRecepcion = new Date().toISOString().slice(0, 19).replace('T', ' ');
      
      const result = await db.executeQuery(
        'UPDATE Derivacion SET EstadoDerivacion = ?, Observacion = ?, FechaRecepcion = ?, IDUsuarioRecibe = ? WHERE IDDerivacion = ?',
        [nuevoEstado, nuevaObservacion, fechaRecepcion, testUsuarioRecibeId, testDerivacionId]
      );

      expect(result.affectedRows).toBe(1);

      // Verificar que se actualizó correctamente
      const derivaciones = await db.executeQuery('SELECT * FROM Derivacion WHERE IDDerivacion = ?', [testDerivacionId]);
      expect(derivaciones).toHaveLength(1);
      expect(derivaciones[0].EstadoDerivacion).toBe(nuevoEstado);
      expect(derivaciones[0].Observacion).toBe(nuevaObservacion);
      expect(derivaciones[0].IDUsuarioRecibe).toBe(testUsuarioRecibeId);
      expect(derivaciones[0].FechaRecepcion).not.toBeNull();
    } catch (error) {
      logger.error(`Error al actualizar derivación: ${error.message}`);
      expect(error).toBeNull();
    }
  });

  test('Debería listar derivaciones pendientes', async () => {
    try {
      const derivaciones = await db.executeQuery(
        'SELECT * FROM Derivacion WHERE EstadoDerivacion = ? LIMIT 10',
        ['PENDIENTE']
      );
      
      // Verificamos que la consulta funciona
      expect(Array.isArray(derivaciones)).toBe(true);
    } catch (error) {
      logger.error(`Error al listar derivaciones pendientes: ${error.message}`);
      expect(error).toBeNull();
    }
  });

  test('Debería listar derivaciones por área de destino', async () => {
    try {
      const derivaciones = await db.executeQuery(
        'SELECT * FROM Derivacion WHERE IDAreaDestino = ? LIMIT 10',
        [testAreaDestinoId]
      );
      
      // Verificamos que la consulta funciona
      expect(Array.isArray(derivaciones)).toBe(true);
    } catch (error) {
      logger.error(`Error al listar derivaciones por área: ${error.message}`);
      expect(error).toBeNull();
    }
  });

  test('Debería eliminar una derivación', async () => {
    // Solo ejecutar si se creó la derivación correctamente
    if (!testDerivacionId) {
      return;
    }

    try {
      const result = await db.executeQuery('DELETE FROM Derivacion WHERE IDDerivacion = ?', [testDerivacionId]);
      
      expect(result.affectedRows).toBe(1);

      // Verificar que se eliminó correctamente
      const derivaciones = await db.executeQuery('SELECT * FROM Derivacion WHERE IDDerivacion = ?', [testDerivacionId]);
      expect(derivaciones).toHaveLength(0);

      // Marcamos como null porque ya eliminamos la derivación
      testDerivacionId = null;
    } catch (error) {
      logger.error(`Error al eliminar derivación: ${error.message}`);
      expect(error).toBeNull();
    }
  });
}); 