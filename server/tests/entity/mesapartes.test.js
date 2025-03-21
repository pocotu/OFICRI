/**
 * Pruebas para la entidad MesaPartes
 * Verifica operaciones CRUD en la tabla MesaPartes
 */

const db = require('../../config/database');
const { logger } = require('../../utils/logger');

describe('Pruebas de Entidad MesaPartes', () => {
  // Datos de prueba
  const testMesaPartesData = {
    Descripcion: 'Mesa de Partes de Prueba Automatizada',
    CodigoIdentificacion: `TEST-MP-${Date.now()}`, // Garantiza un código único
    IsActive: true
  };

  // ID de la mesa de partes creada en las pruebas
  let testMesaPartesId = null;

  // Configurar antes de todas las pruebas
  beforeAll(async () => {
    try {
      // Desactivar temporalmente las restricciones de clave foránea para las pruebas
      await db.executeQuery('SET FOREIGN_KEY_CHECKS = 0');
    } catch (error) {
      logger.error('Error al configurar las pruebas de MesaPartes', { error });
    }
  });

  // Limpiar después de todas las pruebas
  afterAll(async () => {
    try {
      // Eliminar la mesa de partes de prueba si existe
      if (testMesaPartesId) {
        await db.executeQuery('DELETE FROM MesaPartes WHERE IDMesaPartes = ?', [testMesaPartesId]);
      }
      
      // Reactivar las restricciones de clave foránea
      await db.executeQuery('SET FOREIGN_KEY_CHECKS = 1');
      
      // Cerrar conexión a la base de datos
      await db.closePool();
    } catch (error) {
      logger.error('Error al limpiar pruebas de MesaPartes', { error });
    }
  });

  test('Debería crear una nueva mesa de partes', async () => {
    try {
      // Primero eliminar cualquier mesa de partes de prueba anterior con el mismo código
      await db.executeQuery('DELETE FROM MesaPartes WHERE CodigoIdentificacion = ?', [testMesaPartesData.CodigoIdentificacion]);

      // Insertar la mesa de partes de prueba
      const result = await db.executeQuery(
        'INSERT INTO MesaPartes (Descripcion, CodigoIdentificacion, IsActive) VALUES (?, ?, ?)',
        [
          testMesaPartesData.Descripcion,
          testMesaPartesData.CodigoIdentificacion,
          testMesaPartesData.IsActive
        ]
      );

      expect(result.affectedRows).toBe(1);
      expect(result.insertId).toBeGreaterThan(0);

      // Guardar el ID para pruebas posteriores
      testMesaPartesId = result.insertId;
    } catch (error) {
      expect(error).toBeNull();
    }
  });

  test('Debería obtener una mesa de partes por ID', async () => {
    // Solo ejecutar si se creó la mesa de partes correctamente
    if (!testMesaPartesId) {
      logger.warn('Prueba de obtener mesa de partes por ID omitida - la mesa de partes no fue creada');
      return;
    }

    try {
      const mesasPartes = await db.executeQuery('SELECT * FROM MesaPartes WHERE IDMesaPartes = ?', [testMesaPartesId]);
      
      expect(mesasPartes).toHaveLength(1);
      expect(mesasPartes[0].Descripcion).toBe(testMesaPartesData.Descripcion);
      expect(mesasPartes[0].CodigoIdentificacion).toBe(testMesaPartesData.CodigoIdentificacion);
    } catch (error) {
      expect(error).toBeNull();
    }
  });

  test('Debería obtener una mesa de partes por código de identificación', async () => {
    // Solo ejecutar si se creó la mesa de partes correctamente
    if (!testMesaPartesId) {
      logger.warn('Prueba de obtener mesa de partes por código omitida - la mesa de partes no fue creada');
      return;
    }
    
    try {
      const mesasPartes = await db.executeQuery('SELECT * FROM MesaPartes WHERE CodigoIdentificacion = ?', [testMesaPartesData.CodigoIdentificacion]);
      
      expect(mesasPartes).toHaveLength(1);
      expect(mesasPartes[0].IDMesaPartes).toBe(testMesaPartesId);
    } catch (error) {
      expect(error).toBeNull();
    }
  });

  test('Debería actualizar datos de una mesa de partes', async () => {
    // Solo ejecutar si se creó la mesa de partes correctamente
    if (!testMesaPartesId) {
      logger.warn('Prueba de actualizar mesa de partes omitida - la mesa de partes no fue creada');
      return;
    }

    const nuevaDescripcion = 'Mesa de Partes Actualizada';
    
    try {
      const result = await db.executeQuery(
        'UPDATE MesaPartes SET Descripcion = ? WHERE IDMesaPartes = ?',
        [nuevaDescripcion, testMesaPartesId]
      );

      expect(result.affectedRows).toBe(1);

      // Verificar que se actualizó correctamente
      const mesasPartes = await db.executeQuery('SELECT * FROM MesaPartes WHERE IDMesaPartes = ?', [testMesaPartesId]);
      expect(mesasPartes).toHaveLength(1);
      expect(mesasPartes[0].Descripcion).toBe(nuevaDescripcion);
      // Verificar que el resto de datos se mantiene igual
      expect(mesasPartes[0].CodigoIdentificacion).toBe(testMesaPartesData.CodigoIdentificacion);
    } catch (error) {
      expect(error).toBeNull();
    }
  });

  test('Debería desactivar una mesa de partes', async () => {
    // Solo ejecutar si se creó la mesa de partes correctamente
    if (!testMesaPartesId) {
      logger.warn('Prueba de desactivar mesa de partes omitida - la mesa de partes no fue creada');
      return;
    }

    try {
      // En lugar de eliminar físicamente, marcamos como inactiva
      const result = await db.executeQuery(
        'UPDATE MesaPartes SET IsActive = FALSE WHERE IDMesaPartes = ?',
        [testMesaPartesId]
      );

      expect(result.affectedRows).toBe(1);

      // Verificar que se desactivó correctamente
      const mesasPartes = await db.executeQuery('SELECT * FROM MesaPartes WHERE IDMesaPartes = ?', [testMesaPartesId]);
      expect(mesasPartes).toHaveLength(1);
      expect(mesasPartes[0].IsActive).toBe(0); // 0 = FALSE en MySQL
    } catch (error) {
      expect(error).toBeNull();
    }
  });

  test('Debería eliminar físicamente una mesa de partes', async () => {
    // Solo ejecutar si se creó la mesa de partes correctamente
    if (!testMesaPartesId) {
      logger.warn('Prueba de eliminar mesa de partes omitida - la mesa de partes no fue creada');
      return;
    }

    try {
      // Primero verificamos si la mesa de partes tiene dependencias
      // Si una mesa de partes tiene documentos u otros registros asociados, no se debería eliminar
      const documentosAsociados = await db.executeQuery(
        'SELECT COUNT(*) as count FROM Documento WHERE IDMesaPartes = ?', 
        [testMesaPartesId]
      );
      
      // Solo eliminamos si no hay documentos asociados
      if (documentosAsociados[0].count === 0) {
        const result = await db.executeQuery('DELETE FROM MesaPartes WHERE IDMesaPartes = ?', [testMesaPartesId]);
        
        expect(result.affectedRows).toBe(1);

        // Verificar que se eliminó correctamente
        const mesasPartes = await db.executeQuery('SELECT * FROM MesaPartes WHERE IDMesaPartes = ?', [testMesaPartesId]);
        expect(mesasPartes).toHaveLength(0);

        // Marcamos como null porque ya eliminamos la mesa de partes
        testMesaPartesId = null;
      } else {
        // Si hay documentos asociados, debemos saltarnos esta prueba
        console.log(`No se puede eliminar la mesa de partes ${testMesaPartesId} porque tiene documentos asociados`);
      }
    } catch (error) {
      expect(error).toBeNull();
    }
  });

  test('Debería listar todas las mesas de partes activas', async () => {
    try {
      const mesasPartes = await db.executeQuery('SELECT * FROM MesaPartes WHERE IsActive = TRUE');
      
      // Verificamos que la consulta funciona, pero no podemos asegurar cuántas mesas hay
      expect(Array.isArray(mesasPartes)).toBe(true);
    } catch (error) {
      expect(error).toBeNull();
    }
  });
}); 