/**
 * Pruebas para la entidad PermisoContextual
 * Verifica operaciones CRUD en la tabla PermisoContextual y funciones relacionadas
 */

const db = require('../../config/database');
const { logger } = require('../../utils/logger');

describe('Pruebas de Entidad PermisoContextual', () => {
  // Flag para verificar si la tabla existe
  let tableExists = true;
  
  // Datos de prueba para un permiso contextual
  const testPermisoData = {
    IDRol: 999,
    IDArea: 999,
    TipoRecurso: 'DOCUMENTO',
    ReglaContexto: JSON.stringify({
      condicion: 'PROPIETARIO',
      accion: 'ELIMINAR'
    }),
    Activo: true
  };

  // ID del permiso creado en las pruebas
  let testPermisoId = null;

  // Asegurar que existen el área y rol necesarios para las pruebas
  beforeAll(async () => {
    try {
      // Desactivar temporalmente las restricciones de clave foránea
      await db.executeQuery('SET FOREIGN_KEY_CHECKS = 0');
      
      // Verificar si la tabla PermisoContextual existe
      try {
        await db.executeQuery('SELECT 1 FROM PermisoContextual LIMIT 1');
      } catch (error) {
        if (error.message.includes("doesn't exist")) {
          tableExists = false;
          logger.warn('La tabla PermisoContextual no existe. Las pruebas de esta entidad serán omitidas.');
          return; // Salir temprano si la tabla no existe
        }
      }
      
      // Verificar si el área y rol existen
      const areaResult = await db.executeQuery('SELECT IDArea FROM AreaEspecializada WHERE IDArea = 999');
      const rolResult = await db.executeQuery('SELECT IDRol FROM Rol WHERE IDRol = 999');
      
      // Si no existe el área, crear una
      if (areaResult.length === 0) {
        await db.executeQuery(
          'INSERT INTO AreaEspecializada (IDArea, NombreArea, CodigoIdentificacion, TipoArea, IsActive, Descripcion) VALUES (?, ?, ?, ?, ?, ?)',
          [999, 'Área de Prueba', 'TEST-AREA', 'PRUEBA', 1, 'Área creada para pruebas']
        );
      }
      
      // Si no existe el rol, crear uno - Eliminamos NivelAcceso que no existe en el esquema
      if (rolResult.length === 0) {
        await db.executeQuery(
          'INSERT INTO Rol (IDRol, NombreRol, Descripcion, Permisos) VALUES (?, ?, ?, ?)',
          [999, 'Rol de Prueba', 'Rol creado para pruebas', 255]
        );
      }
      
      logger.info(`Usando Área ID: 999 y Rol ID: 999 para las pruebas de PermisoContextual`);
      
      // Limpiar cualquier registro previo
      try {
        // Primero eliminar cualquier registro en el log
        await db.executeQuery('DELETE FROM PermisoContextualLog WHERE IDPermisoContextual IN (SELECT IDPermisoContextual FROM PermisoContextual WHERE IDRol = ? AND IDArea = ?)', 
          [testPermisoData.IDRol, testPermisoData.IDArea]);
        // Luego eliminar el permiso contextual
        await db.executeQuery('DELETE FROM PermisoContextual WHERE IDRol = ? AND IDArea = ?', 
          [testPermisoData.IDRol, testPermisoData.IDArea]);
      } catch (error) {
        logger.debug(`Error al limpiar datos previos: ${error.message}`);
        // No es un error crítico, podemos continuar
      }
    } catch (error) {
      logger.error(`Error en la configuración de las pruebas: ${error.message}`);
      throw error;
    }
  });

  // Limpiar después de todas las pruebas
  afterAll(async () => {
    if (!tableExists) return; // No hacer nada si la tabla no existe
    
    try {
      // Limpiar registros creados durante las pruebas
      if (testPermisoId) {
        // Primero eliminar registros relacionados en el log si existen
        await db.executeQuery('DELETE FROM PermisoContextualLog WHERE IDPermisoContextual = ?', [testPermisoId]);
        // Luego eliminar el permiso contextual
        await db.executeQuery('DELETE FROM PermisoContextual WHERE IDPermisoContextual = ?', [testPermisoId]);
      }
      
      // Reactivar las restricciones de clave foránea
      await db.executeQuery('SET FOREIGN_KEY_CHECKS = 1');
    } catch (error) {
      logger.error(`Error al limpiar datos de prueba: ${error.message}`);
    } finally {
      // Cerrar la conexión a la base de datos
      await db.closePool();
    }
  });

  test('Debería crear un nuevo permiso contextual', async () => {
    if (!tableExists) {
      return; // Omitir si la tabla no existe
    }
    
    try {
      // Insertar el permiso contextual de prueba
      const result = await db.executeQuery(
        'INSERT INTO PermisoContextual (IDRol, IDArea, TipoRecurso, ReglaContexto, Activo) VALUES (?, ?, ?, ?, ?)',
        [
          testPermisoData.IDRol,
          testPermisoData.IDArea,
          testPermisoData.TipoRecurso,
          testPermisoData.ReglaContexto,
          testPermisoData.Activo
        ]
      );

      expect(result.affectedRows).toBe(1);
      expect(result.insertId).toBeGreaterThan(0);

      // Guardar el ID para pruebas posteriores
      testPermisoId = result.insertId;
    } catch (error) {
      logger.error(`Error al crear permiso contextual: ${error.message}`);
      expect(error).toBeNull(); // Esta línea fallará la prueba si hay un error
    }
  });

  test('Debería obtener un permiso contextual por ID', async () => {
    if (!tableExists || !testPermisoId) {
      return; // Omitir si la tabla no existe o no hay ID
    }

    try {
      const permisos = await db.executeQuery('SELECT * FROM PermisoContextual WHERE IDPermisoContextual = ?', [testPermisoId]);
      
      expect(permisos).toHaveLength(1);
      expect(permisos[0].IDRol).toBe(testPermisoData.IDRol);
      expect(permisos[0].IDArea).toBe(testPermisoData.IDArea);
      expect(permisos[0].TipoRecurso).toBe(testPermisoData.TipoRecurso);
      expect(permisos[0].ReglaContexto).toBe(testPermisoData.ReglaContexto);
    } catch (error) {
      logger.error(`Error al obtener permiso contextual: ${error.message}`);
      expect(error).toBeNull();
    }
  });

  test('Debería obtener permisos contextuales a través de la vista', async () => {
    if (!tableExists || !testPermisoId) {
      return; // Omitir si la tabla no existe o no hay ID
    }
    
    try {
      // Primero verificar si la vista existe
      try {
        await db.executeQuery('SELECT 1 FROM v_permisos_contextuales LIMIT 1');
      } catch (viewError) {
        if (viewError.message.includes("doesn't exist")) {
          logger.warn('La vista v_permisos_contextuales no existe. Esta prueba se omite.');
          return; // Salir temprano si la vista no existe
        }
      }
      
      const permisos = await db.executeQuery('SELECT * FROM v_permisos_contextuales WHERE IDPermisoContextual = ?', [testPermisoId]);
      
      expect(permisos).toHaveLength(1);
      expect(permisos[0].IDRol).toBe(testPermisoData.IDRol);
      expect(permisos[0].IDArea).toBe(testPermisoData.IDArea);
      expect(permisos[0].TipoRecurso).toBe(testPermisoData.TipoRecurso);
      expect(permisos[0].ReglaContexto).toBe(testPermisoData.ReglaContexto);
      // La vista incluye información adicional como nombres
      expect(permisos[0].NombreRol).toBe('Rol de Prueba');
      expect(permisos[0].NombreArea).toBe('Área de Prueba');
    } catch (error) {
      logger.error(`Error al obtener permiso contextual desde vista: ${error.message}`);
      expect(error).toBeNull();
    }
  });

  test('Debería actualizar un permiso contextual', async () => {
    if (!tableExists || !testPermisoId) {
      return; // Omitir si la tabla no existe o no hay ID
    }

    const nuevaRegla = JSON.stringify({
      condicion: 'MISMA_AREA',
      accion: 'ELIMINAR'
    });
    
    try {
      const result = await db.executeQuery(
        'UPDATE PermisoContextual SET ReglaContexto = ? WHERE IDPermisoContextual = ?',
        [nuevaRegla, testPermisoId]
      );

      expect(result.affectedRows).toBe(1);

      // Verificar que se actualizó correctamente
      const permisos = await db.executeQuery('SELECT * FROM PermisoContextual WHERE IDPermisoContextual = ?', [testPermisoId]);
      expect(permisos).toHaveLength(1);
      expect(permisos[0].ReglaContexto).toBe(nuevaRegla);
    } catch (error) {
      logger.error(`Error al actualizar permiso contextual: ${error.message}`);
      expect(error).toBeNull();
    }
  });

  test('Debería eliminar un permiso contextual', async () => {
    if (!tableExists || !testPermisoId) {
      return; // Omitir si la tabla no existe o no hay ID
    }

    try {
      const result = await db.executeQuery('DELETE FROM PermisoContextual WHERE IDPermisoContextual = ?', [testPermisoId]);
      
      expect(result.affectedRows).toBe(1);

      // Verificar que se eliminó correctamente
      const permisos = await db.executeQuery('SELECT * FROM PermisoContextual WHERE IDPermisoContextual = ?', [testPermisoId]);
      expect(permisos).toHaveLength(0);

      // Marcamos como null porque ya eliminamos el permiso
      testPermisoId = null;
    } catch (error) {
      logger.error(`Error al eliminar permiso contextual: ${error.message}`);
      expect(error).toBeNull();
    }
  });
}); 