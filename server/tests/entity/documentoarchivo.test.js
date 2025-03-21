/**
 * Pruebas para la entidad DocumentoArchivo
 * Verifica operaciones CRUD en la tabla DocumentoArchivo
 */

const db = require('../../config/database');
const { logger } = require('../../utils/logger');

describe('Pruebas de Entidad DocumentoArchivo', () => {
  // IDs necesarios para las pruebas
  let testDocumentoId = null;
  let testMesaPartesId = null;
  let testAreaId = null;
  let testUsuarioId = null;
  
  // ID del archivo de documento creado en las pruebas
  let testArchivoId = null;

  // Datos de prueba para el archivo
  const testArchivoData = {
    TipoArchivo: 'PDF',
    RutaArchivo: `/uploads/test/documento_${Date.now()}.pdf`,
    Observaciones: 'Archivo creado para pruebas automatizadas'
  };

  // Configurar datos necesarios antes de las pruebas
  beforeAll(async () => {
    try {
      // Desactivar temporalmente las restricciones de clave foránea
      await db.executeQuery('SET FOREIGN_KEY_CHECKS = 0');
      
      // 1. Obtener Mesa de Partes, Area y Usuario para crear el Documento
      const mesaPartesResult = await db.executeQuery('SELECT IDMesaPartes FROM MesaPartes LIMIT 1');
      const areaResult = await db.executeQuery('SELECT IDArea FROM AreaEspecializada LIMIT 1');
      const usuarioResult = await db.executeQuery('SELECT IDUsuario FROM Usuario LIMIT 1');
      
      if (mesaPartesResult.length === 0 || areaResult.length === 0 || usuarioResult.length === 0) {
        logger.warn('No se encontraron datos necesarios para crear el documento. Se requiere al menos una Mesa de Partes, un Área y un Usuario.');
        return;
      }
      
      testMesaPartesId = mesaPartesResult[0].IDMesaPartes;
      testAreaId = areaResult[0].IDArea;
      testUsuarioId = usuarioResult[0].IDUsuario;
      
      // 2. Verificar si existe un documento que podemos usar
      const documentoResult = await db.executeQuery('SELECT IDDocumento FROM Documento LIMIT 1');
      if (documentoResult.length > 0) {
        testDocumentoId = documentoResult[0].IDDocumento;
      } else {
        // Crear un documento para las pruebas
        const nroRegistro = `TEST-REG-ARCHIVO-${Date.now()}`;
        const insertDocumento = await db.executeQuery(
          `INSERT INTO Documento (
            IDMesaPartes, IDAreaActual, IDUsuarioCreador, 
            NroRegistro, NumeroOficioDocumento, FechaDocumento, 
            OrigenDocumento, Estado, Observaciones
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            testMesaPartesId,
            testAreaId,
            testUsuarioId,
            nroRegistro,
            `TEST-OFI-ARCHIVO-${Date.now()}`,
            new Date().toISOString().split('T')[0],
            'EXTERNO',
            'REGISTRADO',
            'Documento para pruebas de archivo'
          ]
        );
        
        if (insertDocumento.affectedRows === 1) {
          testDocumentoId = insertDocumento.insertId;
          logger.info(`Documento de prueba creado con ID: ${testDocumentoId}`);
        }
      }
    } catch (error) {
      logger.error('Error en la configuración inicial de pruebas de DocumentoArchivo', { error });
      expect(error).toBeNull();
    }
  });

  // Limpiar después de todas las pruebas
  afterAll(async () => {
    try {
      // Eliminar el archivo de documento de prueba si existe
      if (testArchivoId) {
        await db.executeQuery('DELETE FROM DocumentoArchivo WHERE IDArchivo = ?', [testArchivoId]);
      }
      
      // Reactivar las restricciones de clave foránea
      await db.executeQuery('SET FOREIGN_KEY_CHECKS = 1');

      // Cerrar conexión a la base de datos
      await db.closePool();
    } catch (error) {
      logger.error('Error al limpiar pruebas de DocumentoArchivo', { error });
    }
  });

  test('Debería crear un nuevo archivo de documento', async () => {
    // Verificar que tenemos el documento necesario para la prueba
    if (!testDocumentoId) {
      console.log('No se encontró un documento para vincular al archivo');
      return;
    }

    try {
      // Eliminar cualquier archivo previo con la misma ruta
      await db.executeQuery('DELETE FROM DocumentoArchivo WHERE RutaArchivo = ?', [testArchivoData.RutaArchivo]);

      // Insertar el archivo de documento de prueba
      const result = await db.executeQuery(
        `INSERT INTO DocumentoArchivo (
          IDDocumento, TipoArchivo, RutaArchivo, FechaSubida, Observaciones
        ) VALUES (?, ?, ?, CURRENT_TIMESTAMP, ?)`,
        [
          testDocumentoId,
          testArchivoData.TipoArchivo,
          testArchivoData.RutaArchivo,
          testArchivoData.Observaciones
        ]
      );

      expect(result.affectedRows).toBe(1);
      expect(result.insertId).toBeGreaterThan(0);

      // Guardar el ID para pruebas posteriores
      testArchivoId = result.insertId;
    } catch (error) {
      expect(error).toBeNull();
    }
  });

  test('Debería obtener un archivo por ID', async () => {
    // Solo ejecutar si se creó el archivo correctamente
    if (!testArchivoId) {
      return;
    }

    try {
      const archivos = await db.executeQuery('SELECT * FROM DocumentoArchivo WHERE IDArchivo = ?', [testArchivoId]);
      
      expect(archivos).toHaveLength(1);
      expect(archivos[0].IDDocumento).toBe(testDocumentoId);
      expect(archivos[0].TipoArchivo).toBe(testArchivoData.TipoArchivo);
      expect(archivos[0].RutaArchivo).toBe(testArchivoData.RutaArchivo);
    } catch (error) {
      expect(error).toBeNull();
    }
  });

  test('Debería obtener archivos por ID de documento', async () => {
    try {
      const archivos = await db.executeQuery('SELECT * FROM DocumentoArchivo WHERE IDDocumento = ?', [testDocumentoId]);
      
      expect(archivos.length).toBeGreaterThan(0);
      // Al menos uno de los archivos debe ser el que creamos
      const archivoEncontrado = archivos.some(archivo => archivo.IDArchivo === testArchivoId);
      expect(archivoEncontrado).toBe(true);
    } catch (error) {
      expect(error).toBeNull();
    }
  });

  test('Debería actualizar datos de un archivo', async () => {
    // Solo ejecutar si se creó el archivo correctamente
    if (!testArchivoId) {
      return;
    }

    // Datos para la actualización
    const nuevasObservaciones = 'Observaciones actualizadas para pruebas';
    
    try {
      const result = await db.executeQuery(
        'UPDATE DocumentoArchivo SET Observaciones = ? WHERE IDArchivo = ?',
        [nuevasObservaciones, testArchivoId]
      );

      expect(result.affectedRows).toBe(1);

      // Verificar que se actualizó correctamente
      const archivos = await db.executeQuery('SELECT * FROM DocumentoArchivo WHERE IDArchivo = ?', [testArchivoId]);
      expect(archivos).toHaveLength(1);
      expect(archivos[0].Observaciones).toBe(nuevasObservaciones);
      // Verificar que los otros campos no han cambiado
      expect(archivos[0].RutaArchivo).toBe(testArchivoData.RutaArchivo);
    } catch (error) {
      expect(error).toBeNull();
    }
  });

  test('Debería eliminar un archivo', async () => {
    // Solo ejecutar si se creó el archivo correctamente
    if (!testArchivoId) {
      return;
    }

    try {
      const result = await db.executeQuery('DELETE FROM DocumentoArchivo WHERE IDArchivo = ?', [testArchivoId]);
      
      expect(result.affectedRows).toBe(1);

      // Verificar que se eliminó correctamente
      const archivos = await db.executeQuery('SELECT * FROM DocumentoArchivo WHERE IDArchivo = ?', [testArchivoId]);
      expect(archivos).toHaveLength(0);

      // Marcamos como null porque ya eliminamos el archivo
      testArchivoId = null;
    } catch (error) {
      expect(error).toBeNull();
    }
  });

  test('Debería probar el procedimiento almacenado sp_subir_archivo_documento', async () => {
    // Verificar que tenemos el documento necesario para la prueba
    if (!testDocumentoId) {
      return;
    }

    try {
      const nuevoArchivoData = {
        TipoArchivo: 'IMAGEN',
        RutaArchivo: `/uploads/test/imagen_${Date.now()}.jpg`,
        Observaciones: 'Archivo creado usando el procedimiento almacenado'
      };

      // Ejecutar el procedimiento almacenado
      await db.executeQuery(
        'CALL sp_subir_archivo_documento(?, ?, ?, ?)',
        [
          testDocumentoId,
          nuevoArchivoData.TipoArchivo,
          nuevoArchivoData.RutaArchivo,
          nuevoArchivoData.Observaciones
        ]
      );

      // Verificar que se insertó correctamente
      const archivos = await db.executeQuery('SELECT * FROM DocumentoArchivo WHERE RutaArchivo = ?', [nuevoArchivoData.RutaArchivo]);
      expect(archivos).toHaveLength(1);
      expect(archivos[0].TipoArchivo).toBe(nuevoArchivoData.TipoArchivo);
      expect(archivos[0].Observaciones).toBe(nuevoArchivoData.Observaciones);

      // Limpiar
      await db.executeQuery('DELETE FROM DocumentoArchivo WHERE RutaArchivo = ?', [nuevoArchivoData.RutaArchivo]);
    } catch (error) {
      expect(error).toBeNull();
    }
  });
}); 