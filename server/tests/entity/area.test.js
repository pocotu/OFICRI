/**
 * Pruebas para la entidad AreaEspecializada
 * Verifica operaciones CRUD en la tabla AreaEspecializada
 */

const db = require('../../config/database');
const { logger } = require('../../utils/logger');

describe('Pruebas de Entidad AreaEspecializada', () => {
  // Datos de prueba
  const testAreaData = {
    NombreArea: 'Área de Prueba Automatizada',
    CodigoIdentificacion: `TEST-AUTO-AREA-${Date.now()}`, // Garantiza un código único
    TipoArea: 'ESPECIALIZADA',
    Descripcion: 'Área creada para pruebas automatizadas',
    IsActive: true
  };

  // ID del área creada en las pruebas
  let testAreaId = null;
  
  // Verificar si podemos ejecutar la prueba
  beforeAll(async () => {
    try {
      // Desactivar temporalmente las restricciones de clave foránea
      await db.executeQuery('SET FOREIGN_KEY_CHECKS = 0');
      
      // Verificar si el área de prueba ya existe
      const existingArea = await db.executeQuery(
        'SELECT IDArea FROM AreaEspecializada WHERE CodigoIdentificacion = ?', 
        [testAreaData.CodigoIdentificacion]
      );
      
      if (existingArea.length > 0) {
        logger.info(`El área de prueba ya existe con ID: ${existingArea[0].IDArea}`);
        // Usamos esta área para las pruebas
        testAreaId = existingArea[0].IDArea;
      }
    } catch (error) {
      logger.error('Error al verificar el área de prueba', { error });
    }
  });

  // Limpiar después de todas las pruebas
  afterAll(async () => {
    try {
      // Eliminar el área de prueba si existe
      if (testAreaId) {
        await db.executeQuery('DELETE FROM AreaEspecializada WHERE IDArea = ?', [testAreaId]);
      }
      
      // Reactivar las restricciones de clave foránea
      await db.executeQuery('SET FOREIGN_KEY_CHECKS = 1');

      // Cerrar conexión a la base de datos
      await db.closePool();
    } catch (error) {
      logger.error('Error al limpiar pruebas de AreaEspecializada', { error });
    }
  });

  test('Debería crear una nueva área especializada', async () => {
    try {
      // Primero eliminar cualquier área de prueba anterior con el mismo código
      await db.executeQuery('DELETE FROM AreaEspecializada WHERE CodigoIdentificacion = ?', [testAreaData.CodigoIdentificacion]);

      // Insertar el área de prueba
      const result = await db.executeQuery(
        'INSERT INTO AreaEspecializada (NombreArea, CodigoIdentificacion, TipoArea, Descripcion, IsActive) VALUES (?, ?, ?, ?, ?)',
        [
          testAreaData.NombreArea,
          testAreaData.CodigoIdentificacion,
          testAreaData.TipoArea,
          testAreaData.Descripcion,
          testAreaData.IsActive
        ]
      );

      expect(result.affectedRows).toBe(1);
      expect(result.insertId).toBeGreaterThan(0);

      // Guardar el ID para pruebas posteriores
      testAreaId = result.insertId;
    } catch (error) {
      expect(error).toBeNull();
    }
  });

  test('Debería obtener un área por ID', async () => {
    // Solo ejecutar si se creó el área correctamente
    if (!testAreaId) {
      return;
    }

    try {
      const areas = await db.executeQuery('SELECT * FROM AreaEspecializada WHERE IDArea = ?', [testAreaId]);
      
      expect(areas).toHaveLength(1);
      expect(areas[0].NombreArea).toBe(testAreaData.NombreArea);
      expect(areas[0].CodigoIdentificacion).toBe(testAreaData.CodigoIdentificacion);
      expect(areas[0].TipoArea).toBe(testAreaData.TipoArea);
    } catch (error) {
      expect(error).toBeNull();
    }
  });

  test('Debería obtener un área por código de identificación', async () => {
    try {
      const areas = await db.executeQuery('SELECT * FROM AreaEspecializada WHERE CodigoIdentificacion = ?', [testAreaData.CodigoIdentificacion]);
      
      expect(areas).toHaveLength(1);
      expect(areas[0].IDArea).toBe(testAreaId);
      expect(areas[0].NombreArea).toBe(testAreaData.NombreArea);
    } catch (error) {
      expect(error).toBeNull();
    }
  });

  test('Debería actualizar datos de un área', async () => {
    // Solo ejecutar si se creó el área correctamente
    if (!testAreaId) {
      return;
    }

    const nuevoNombre = 'Área Actualizada';
    const nuevaDescripcion = 'Descripción actualizada para pruebas';
    
    try {
      const result = await db.executeQuery(
        'UPDATE AreaEspecializada SET NombreArea = ?, Descripcion = ? WHERE IDArea = ?',
        [nuevoNombre, nuevaDescripcion, testAreaId]
      );

      expect(result.affectedRows).toBe(1);

      // Verificar que se actualizó correctamente
      const areas = await db.executeQuery('SELECT * FROM AreaEspecializada WHERE IDArea = ?', [testAreaId]);
      expect(areas).toHaveLength(1);
      expect(areas[0].NombreArea).toBe(nuevoNombre);
      expect(areas[0].Descripcion).toBe(nuevaDescripcion);
      // Verificar que el resto de datos se mantiene igual
      expect(areas[0].CodigoIdentificacion).toBe(testAreaData.CodigoIdentificacion);
    } catch (error) {
      expect(error).toBeNull();
    }
  });

  test('Debería desactivar un área', async () => {
    // Solo ejecutar si se creó el área correctamente
    if (!testAreaId) {
      return;
    }

    try {
      // En lugar de eliminar físicamente, marcamos como inactiva
      const result = await db.executeQuery(
        'UPDATE AreaEspecializada SET IsActive = FALSE WHERE IDArea = ?',
        [testAreaId]
      );

      expect(result.affectedRows).toBe(1);

      // Verificar que se desactivó correctamente
      const areas = await db.executeQuery('SELECT * FROM AreaEspecializada WHERE IDArea = ?', [testAreaId]);
      expect(areas).toHaveLength(1);
      expect(areas[0].IsActive).toBe(0); // 0 = FALSE en MySQL
    } catch (error) {
      expect(error).toBeNull();
    }
  });

  test('Debería eliminar físicamente un área', async () => {
    // Solo ejecutar si se creó el área correctamente
    if (!testAreaId) {
      return;
    }

    try {
      // Primero verificamos si el área tiene dependencias
      // Si un área tiene usuarios u otros registros asociados, no se debería eliminar
      const usuariosAsociados = await db.executeQuery(
        'SELECT COUNT(*) as count FROM Usuario WHERE IDArea = ?', 
        [testAreaId]
      );
      
      // Solo eliminamos si no hay usuarios asociados
      if (usuariosAsociados[0].count === 0) {
        const result = await db.executeQuery('DELETE FROM AreaEspecializada WHERE IDArea = ?', [testAreaId]);
        
        expect(result.affectedRows).toBe(1);

        // Verificar que se eliminó correctamente
        const areas = await db.executeQuery('SELECT * FROM AreaEspecializada WHERE IDArea = ?', [testAreaId]);
        expect(areas).toHaveLength(0);

        // Marcamos como null porque ya eliminamos el área
        testAreaId = null;
      } else {
        // Si hay usuarios asociados, debemos saltarnos esta prueba
        console.log(`No se puede eliminar el área ${testAreaId} porque tiene usuarios asociados`);
      }
    } catch (error) {
      expect(error).toBeNull();
    }
  });

  test('Debería listar todas las áreas activas', async () => {
    try {
      const areas = await db.executeQuery('SELECT * FROM AreaEspecializada WHERE IsActive = TRUE');
      
      // Verificamos que la consulta funciona, pero no podemos asegurar cuántas áreas hay
      expect(Array.isArray(areas)).toBe(true);
    } catch (error) {
      expect(error).toBeNull();
    }
  });
}); 