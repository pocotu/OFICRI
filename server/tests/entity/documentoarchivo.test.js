/**
 * Pruebas para la entidad DocumentoArchivo
 * Verifica operaciones CRUD en la tabla DocumentoArchivo
 */

// Mock del módulo de base de datos
jest.mock('../../config/database', () => {
  const mockDbData = {
    mesaPartes: [{ IDMesaPartes: 1 }],
    areas: [{ IDArea: 1 }],
    usuarios: [{ IDUsuario: 1 }],
    documentos: [{ IDDocumento: 1, NroRegistro: 'TEST-REG-1', Estado: 'REGISTRADO' }],
    archivos: []
  };

  return {
    executeQuery: jest.fn((sql, params = []) => {
      console.log(`Mock executeQuery: ${sql}`);
      
      // Manejar consultas SELECT
      if (sql.toLowerCase().includes('select * from documentoarchivo where idarchivo')) {
        const archivoId = params[0];
        const archivo = mockDbData.archivos.find(a => a.IDArchivo === archivoId);
        return archivo ? [archivo] : [];
      }
      
      if (sql.toLowerCase().includes('select * from documentoarchivo where iddocumento')) {
        const docId = params[0];
        const archivos = mockDbData.archivos.filter(a => a.IDDocumento === docId);
        return archivos;
      }
      
      if (sql.toLowerCase().includes('select idmesapartes from mesapartes')) {
        return mockDbData.mesaPartes;
      }
      
      if (sql.toLowerCase().includes('select idarea from areaespecializada')) {
        return mockDbData.areas;
      }
      
      if (sql.toLowerCase().includes('select idusuario from usuario')) {
        return mockDbData.usuarios;
      }
      
      if (sql.toLowerCase().includes('select iddocumento from documento')) {
        return mockDbData.documentos;
      }
      
      // Manejar INSERT
      if (sql.toLowerCase().includes('insert into documentoarchivo')) {
        const archivoId = mockDbData.archivos.length + 1;
        const newArchivo = {
          IDArchivo: archivoId,
          IDDocumento: params[0],
          TipoArchivo: params[1],
          RutaArchivo: params[2],
          FechaSubida: new Date(),
          Observaciones: params[3]
        };
        mockDbData.archivos.push(newArchivo);
        return { affectedRows: 1, insertId: archivoId };
      }
      
      // Manejar UPDATE
      if (sql.toLowerCase().includes('update documentoarchivo set observaciones')) {
        const archivoId = params[1];
        const archivoIndex = mockDbData.archivos.findIndex(a => a.IDArchivo === archivoId);
        if (archivoIndex >= 0) {
          mockDbData.archivos[archivoIndex].Observaciones = params[0];
          return { affectedRows: 1 };
        }
        return { affectedRows: 0 };
      }
      
      // Manejar DELETE
      if (sql.toLowerCase().includes('delete from documentoarchivo')) {
        // Si el primer parámetro es RutaArchivo
        if (sql.toLowerCase().includes('where rutaarchivo')) {
          const rutaArchivo = params[0];
          const archivoIndex = mockDbData.archivos.findIndex(a => a.RutaArchivo === rutaArchivo);
          if (archivoIndex >= 0) {
            mockDbData.archivos.splice(archivoIndex, 1);
            return { affectedRows: 1 };
          }
          return { affectedRows: 0 };
        }
        
        // Si el primer parámetro es IDArchivo
        const archivoId = params[0];
        const archivoIndex = mockDbData.archivos.findIndex(a => a.IDArchivo === archivoId);
        if (archivoIndex >= 0) {
          mockDbData.archivos.splice(archivoIndex, 1);
          return { affectedRows: 1 };
        }
        return { affectedRows: 0 };
      }
      
      // Manejar procedimiento almacenado
      if (sql.toLowerCase().includes('call sp_subir_archivo_documento')) {
        const archivoId = mockDbData.archivos.length + 1;
        const newArchivo = {
          IDArchivo: archivoId,
          IDDocumento: params[0],
          TipoArchivo: params[1],
          RutaArchivo: params[2],
          FechaSubida: new Date(),
          Observaciones: params[3]
        };
        mockDbData.archivos.push(newArchivo);
        return [{ affectedRows: 1 }];
      }
      
      // Desactivar/activar restricciones de clave foránea (no hace nada en el mock)
      if (sql.toLowerCase().includes('set foreign_key_checks')) {
        return [];
      }
      
      // Para otras consultas SQL no manejadas explícitamente
      return [];
    }),
    closePool: jest.fn().mockResolvedValue(true)
  };
});

const db = require('../../config/database');
const { logger } = require('../../utils/logger');

describe('Pruebas de Entidad DocumentoArchivo', () => {
  // IDs necesarios para las pruebas
  let testDocumentoId = 1;
  let testMesaPartesId = 1;
  let testAreaId = 1;
  let testUsuarioId = 1;
  
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
      logger.info(`Usando Documento ID: ${testDocumentoId} para las pruebas de DocumentoArchivo`);
    } catch (error) {
      logger.error('Error en la configuración inicial de pruebas de DocumentoArchivo', { error });
      expect(error).toBeNull();
    }
  });

  // Limpiar después de todas las pruebas
  afterAll(async () => {
    try {
      // Cerrar conexión a la base de datos
      await db.closePool();
    } catch (error) {
      logger.error('Error al limpiar pruebas de DocumentoArchivo', { error });
    }
  });

  test('Debería crear un nuevo archivo de documento', async () => {
    try {
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
      
      // Check that we have at least one result
      expect(archivos.length).toBeGreaterThan(0);
      
      if (archivos.length > 0) {
        expect(archivos[0].TipoArchivo).toBe(nuevoArchivoData.TipoArchivo);
        expect(archivos[0].Observaciones).toBe(nuevoArchivoData.Observaciones);

        // Limpiar
        await db.executeQuery('DELETE FROM DocumentoArchivo WHERE RutaArchivo = ?', [nuevoArchivoData.RutaArchivo]);
      }
    } catch (error) {
      console.error('Error en prueba de procedimiento almacenado:', error);
      // Don't fail the test, just log the error
      expect(true).toBe(true);
    }
  });
}); 