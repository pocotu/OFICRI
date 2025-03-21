/**
 * Pruebas para la entidad Documento
 * Verifica operaciones CRUD en la tabla Documento
 */

const db = require('../../config/database');
const { logger } = require('../../utils/logger');
const { fail } = require('jest-mock');

describe('Pruebas de Entidad Documento', () => {
  // IDs de registros necesarios para las pruebas
  let testMesaPartesId = null;
  let testAreaId = null;
  let testUserCreatorId = null;
  
  // ID del documento creado en las pruebas
  let testDocumentoId = null;

  // Datos de prueba para documento
  const testDocumentoData = {
    NroRegistro: `TEST-REG-${Date.now()}`, // Garantiza un número de registro único
    NumeroOficioDocumento: `TEST-OFI-${Date.now()}`, // Garantiza un número de oficio único
    FechaDocumento: new Date().toISOString().split('T')[0], // Fecha actual en formato YYYY-MM-DD
    OrigenDocumento: 'EXTERNO',
    Estado: 'REGISTRADO',
    Observaciones: 'Documento creado para pruebas automatizadas',
    Procedencia: 'Testing Automation',
    Contenido: 'Contenido de prueba para documento automatizado'
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

      // 2. Obtener un Área
      const areaResult = await db.executeQuery('SELECT IDArea FROM AreaEspecializada LIMIT 1');
      if (areaResult.length === 0) {
        logger.info('No se encontraron Áreas. Se requiere al menos un Área para las pruebas.');
        puedeEjecutarPruebas = false;
      } else {
        testAreaId = areaResult[0].IDArea;
      }

      // 3. Obtener un Usuario
      const usuarioResult = await db.executeQuery('SELECT IDUsuario FROM Usuario LIMIT 1');
      if (usuarioResult.length === 0) {
        logger.info('No se encontraron Usuarios. Se requiere al menos un Usuario para las pruebas.');
        puedeEjecutarPruebas = false;
      } else {
        testUserCreatorId = usuarioResult[0].IDUsuario;
      }
      
      if (puedeEjecutarPruebas) {
        logger.info(`Usando Mesa de Partes ID: ${testMesaPartesId}, Área ID: ${testAreaId} y Usuario ID: ${testUserCreatorId} para las pruebas de Documento`);
      } else {
        logger.warn('No se pueden ejecutar todas las pruebas de Documento debido a la falta de datos necesarios.');
      }
    } catch (error) {
      logger.error('Error en la configuración inicial de pruebas de Documento', { error });
      expect(error).toBeNull();
    }
  });

  // Limpiar después de todas las pruebas
  afterAll(async () => {
    try {
      // Eliminar el documento de prueba si existe
      if (testDocumentoId) {
        await db.executeQuery('DELETE FROM Documento WHERE IDDocumento = ?', [testDocumentoId]);
      }
      
      // Reactivar las restricciones de clave foránea
      await db.executeQuery('SET FOREIGN_KEY_CHECKS = 1');

      // Cerrar conexión a la base de datos
      await db.closePool();
    } catch (error) {
      logger.error('Error al limpiar pruebas de Documento', { error });
    }
  });

  test('Debería crear un nuevo documento', async () => {
    // Verificar que tenemos todos los datos necesarios
    if (!testMesaPartesId || !testAreaId || !testUserCreatorId) {
      expect(error).toBeNull();
      return;
    }

    try {
      // Eliminar cualquier documento de prueba anterior con el mismo número de registro
      await db.executeQuery('DELETE FROM Documento WHERE NroRegistro = ?', [testDocumentoData.NroRegistro]);

      // Insertar el documento de prueba
      const result = await db.executeQuery(
        `INSERT INTO Documento (
          IDMesaPartes, IDAreaActual, IDUsuarioCreador, 
          NroRegistro, NumeroOficioDocumento, FechaDocumento, 
          OrigenDocumento, Estado, Observaciones, Procedencia, Contenido
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          testMesaPartesId,
          testAreaId,
          testUserCreatorId,
          testDocumentoData.NroRegistro,
          testDocumentoData.NumeroOficioDocumento,
          testDocumentoData.FechaDocumento,
          testDocumentoData.OrigenDocumento,
          testDocumentoData.Estado,
          testDocumentoData.Observaciones,
          testDocumentoData.Procedencia,
          testDocumentoData.Contenido
        ]
      );

      expect(result.affectedRows).toBe(1);
      expect(result.insertId).toBeGreaterThan(0);

      // Guardar el ID para pruebas posteriores
      testDocumentoId = result.insertId;
    } catch (error) {
      expect(error).toBeNull();
    }
  });

  test('Debería obtener un documento por ID', async () => {
    // Solo ejecutar si se creó el documento correctamente
    if (!testDocumentoId) {
      return;
    }

    try {
      const documentos = await db.executeQuery('SELECT * FROM Documento WHERE IDDocumento = ?', [testDocumentoId]);
      
      expect(documentos).toHaveLength(1);
      expect(documentos[0].NroRegistro).toBe(testDocumentoData.NroRegistro);
      expect(documentos[0].NumeroOficioDocumento).toBe(testDocumentoData.NumeroOficioDocumento);
      expect(documentos[0].Estado).toBe(testDocumentoData.Estado);
    } catch (error) {
      expect(error).toBeNull();
    }
  });

  test('Debería obtener un documento por número de registro', async () => {
    try {
      const documentos = await db.executeQuery('SELECT * FROM Documento WHERE NroRegistro = ?', [testDocumentoData.NroRegistro]);
      
      expect(documentos).toHaveLength(1);
      expect(documentos[0].IDDocumento).toBe(testDocumentoId);
      expect(documentos[0].NumeroOficioDocumento).toBe(testDocumentoData.NumeroOficioDocumento);
    } catch (error) {
      expect(error).toBeNull();
    }
  });

  test('Debería actualizar estado de un documento', async () => {
    try {
      // Datos para la actualización
      const nuevoEstado = 'EN_PROCESO';
      const nuevaObservacion = 'Documento actualizado en pruebas';
      
      // Actualizar el documento
      const updateResult = await db.executeQuery(
        'UPDATE Documento SET Estado = ?, Observaciones = ?, IDUsuarioAsignado = ? WHERE IDDocumento = ?',
        [nuevoEstado, nuevaObservacion, testUserCreatorId, testDocumentoId]
      );
      
      expect(updateResult.affectedRows).toBe(1);
      
      // Verificar que se haya actualizado correctamente
      const documentos = await db.executeQuery('SELECT * FROM Documento WHERE IDDocumento = ?', [testDocumentoId]);
      expect(documentos.length).toBe(1);
      expect(documentos[0].Estado).toBe(nuevoEstado);
      expect(documentos[0].Observaciones).toBe(nuevaObservacion);
      expect(documentos[0].IDUsuarioAsignado).toBe(testUserCreatorId);
    } catch (error) {
      expect(error).toBeNull();
    }
  });

  test('Debería cambiar el área de un documento', async () => {
    // Solo ejecutar si se creó el documento correctamente
    if (!testDocumentoId) {
      return;
    }

    // Primero verificamos si existe otra área disponible para cambiar
    try {
      const areasResult = await db.executeQuery(
        'SELECT IDArea FROM AreaEspecializada WHERE IDArea != ? LIMIT 1',
        [testAreaId]
      );
      
      if (areasResult.length > 0) {
        const nuevaAreaId = areasResult[0].IDArea;
        
        const result = await db.executeQuery(
          'UPDATE Documento SET IDAreaActual = ? WHERE IDDocumento = ?',
          [nuevaAreaId, testDocumentoId]
        );

        expect(result.affectedRows).toBe(1);

        // Verificar que se actualizó correctamente
        const documentos = await db.executeQuery('SELECT * FROM Documento WHERE IDDocumento = ?', [testDocumentoId]);
        expect(documentos).toHaveLength(1);
        expect(documentos[0].IDAreaActual).toBe(nuevaAreaId);
      } else {
        console.log('No hay otra área disponible para la prueba de cambio de área');
      }
    } catch (error) {
      expect(error).toBeNull();
    }
  });

  test('Debería eliminar un documento', async () => {
    // Solo ejecutar si se creó el documento correctamente
    if (!testDocumentoId) {
      return;
    }

    try {
      // Primero verificamos si el documento tiene derivaciones u otros registros asociados
      const derivacionesAsociadas = await db.executeQuery(
        'SELECT COUNT(*) as count FROM Derivacion WHERE IDDocumento = ?', 
        [testDocumentoId]
      );
      
      // Solo eliminamos si no hay derivaciones asociadas
      if (derivacionesAsociadas[0].count === 0) {
        const result = await db.executeQuery('DELETE FROM Documento WHERE IDDocumento = ?', [testDocumentoId]);
        
        expect(result.affectedRows).toBe(1);

        // Verificar que se eliminó correctamente
        const documentos = await db.executeQuery('SELECT * FROM Documento WHERE IDDocumento = ?', [testDocumentoId]);
        expect(documentos).toHaveLength(0);

        // Marcamos como null porque ya eliminamos el documento
        testDocumentoId = null;
      } else {
        // Si hay derivaciones asociadas, debemos saltarnos esta prueba
        console.log(`No se puede eliminar el documento ${testDocumentoId} porque tiene derivaciones asociadas`);
      }
    } catch (error) {
      expect(error).toBeNull();
    }
  });

  test('Debería listar documentos por estado', async () => {
    try {
      const documentos = await db.executeQuery(
        'SELECT * FROM Documento WHERE Estado = ? LIMIT 10',
        ['REGISTRADO']
      );
      
      // Verificamos que la consulta funciona
      expect(Array.isArray(documentos)).toBe(true);
    } catch (error) {
      expect(error).toBeNull();
    }
  });

  test('Debería listar documentos por área', async () => {
    try {
      const documentos = await db.executeQuery(
        'SELECT * FROM Documento WHERE IDAreaActual = ? LIMIT 10',
        [testAreaId]
      );
      
      // Verificamos que la consulta funciona
      expect(Array.isArray(documentos)).toBe(true);
    } catch (error) {
      expect(error).toBeNull();
    }
  });
}); 