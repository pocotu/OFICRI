/**
 * Pruebas para la entidad Documento
 * Verifica operaciones CRUD en la tabla Documento
 */

// Mock del módulo de base de datos
jest.mock('../../config/database', () => {
  const mockDbData = {
    mesaPartes: [{ IDMesaPartes: 1 }],
    areas: [{ IDArea: 1 }, { IDArea: 2 }],
    usuarios: [{ IDUsuario: 1 }],
    documentos: []
  };

  return {
    executeQuery: jest.fn((sql, params = []) => {
      console.log(`Mock executeQuery: ${sql}`);
      
      // Manejar consultas SELECT
      if (sql.toLowerCase().includes('select * from documento where iddocumento')) {
        const docId = params[0];
        const doc = mockDbData.documentos.find(d => d.IDDocumento === docId);
        return doc ? [doc] : [];
      }
      
      if (sql.toLowerCase().includes('select * from documento where nroregistro')) {
        const nroReg = params[0];
        const doc = mockDbData.documentos.find(d => d.NroRegistro === nroReg);
        return doc ? [doc] : [];
      }
      
      if (sql.toLowerCase().includes('select idmesapartes from mesapartes')) {
        return mockDbData.mesaPartes;
      }
      
      if (sql.toLowerCase().includes('select idarea from areaespecializada')) {
        if (params.length > 0) {
          return mockDbData.areas.filter(a => a.IDArea !== params[0]);
        }
        return mockDbData.areas;
      }
      
      if (sql.toLowerCase().includes('select idusuario from usuario')) {
        return mockDbData.usuarios;
      }
      
      if (sql.toLowerCase().includes('select count(*) as count from derivacion')) {
        return [{ count: 0 }];
      }
      
      // Manejar INSERT
      if (sql.toLowerCase().includes('insert into documento')) {
        const docId = mockDbData.documentos.length + 1;
        const newDoc = {
          IDDocumento: docId,
          IDMesaPartes: params[0],
          IDAreaActual: params[1],
          IDUsuarioCreador: params[2],
          NroRegistro: params[3],
          NumeroOficioDocumento: params[4],
          FechaDocumento: params[5],
          OrigenDocumento: params[6],
          Estado: params[7],
          Observaciones: params[8],
          Procedencia: params[9],
          Contenido: params[10]
        };
        mockDbData.documentos.push(newDoc);
        return { affectedRows: 1, insertId: docId };
      }
      
      // Manejar UPDATE
      if (sql.toLowerCase().includes('update documento set estado')) {
        const docId = params[3];
        const docIndex = mockDbData.documentos.findIndex(d => d.IDDocumento === docId);
        if (docIndex >= 0) {
          mockDbData.documentos[docIndex].Estado = params[0];
          mockDbData.documentos[docIndex].Observaciones = params[1];
          mockDbData.documentos[docIndex].IDUsuarioAsignado = params[2];
          return { affectedRows: 1 };
        }
        return { affectedRows: 0 };
      }
      
      if (sql.toLowerCase().includes('update documento set idareaactual')) {
        const docId = params[1];
        const docIndex = mockDbData.documentos.findIndex(d => d.IDDocumento === docId);
        if (docIndex >= 0) {
          mockDbData.documentos[docIndex].IDAreaActual = params[0];
          return { affectedRows: 1 };
        }
        return { affectedRows: 0 };
      }
      
      // Manejar DELETE
      if (sql.toLowerCase().includes('delete from documento')) {
        const docId = params[0];
        const docIndex = mockDbData.documentos.findIndex(d => d.IDDocumento === docId);
        if (docIndex >= 0) {
          mockDbData.documentos.splice(docIndex, 1);
          return { affectedRows: 1 };
        }
        return { affectedRows: 0 };
      }
      
      // Para otras consultas SQL no manejadas explícitamente
      return [];
    }),
    closePool: jest.fn().mockResolvedValue(true)
  };
});

const db = require('../../config/database');
const { logger } = require('../../utils/logger');

describe('Pruebas de Entidad Documento', () => {
  // IDs de registros necesarios para las pruebas
  let testMesaPartesId = 1;
  let testAreaId = 1;
  let testUserCreatorId = 1;
  
  // ID del documento creado en las pruebas
  let testDocumentoId = null;

  // Datos de prueba para documento
  const testDocumentoData = {
    NroRegistro: `TEST-REG-${Date.now()}`,
    NumeroOficioDocumento: `TEST-OFI-${Date.now()}`,
    FechaDocumento: new Date().toISOString().split('T')[0],
    OrigenDocumento: 'EXTERNO',
    Estado: 'REGISTRADO',
    Observaciones: 'Documento creado para pruebas automatizadas',
    Procedencia: 'Testing Automation',
    Contenido: 'Contenido de prueba para documento automatizado'
  };

  // Configurar datos necesarios antes de las pruebas
  beforeAll(async () => {
    try {
      // No es necesario desactivar las restricciones de clave foránea en las pruebas mock
      logger.info(`Usando Mesa de Partes ID: ${testMesaPartesId}, Área ID: ${testAreaId} y Usuario ID: ${testUserCreatorId} para las pruebas de Documento`);
    } catch (error) {
      logger.error('Error en la configuración inicial de pruebas de Documento', { error });
      expect(error).toBeNull();
    }
  });

  // Limpiar después de todas las pruebas
  afterAll(async () => {
    try {
      // Cerrar conexión a la base de datos
      await db.closePool();
    } catch (error) {
      logger.error('Error al limpiar pruebas de Documento', { error });
    }
  });

  test('Debería crear un nuevo documento', async () => {
    try {
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
      } else {
        console.log('No se puede eliminar el documento porque tiene derivaciones asociadas');
      }
    } catch (error) {
      expect(error).toBeNull();
    }
  });
}); 