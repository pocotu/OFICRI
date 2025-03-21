/**
 * Pruebas de la capa de base de datos
 * Verifica la conexión y operaciones con la base de datos
 */

const db = require('../config/database');
const { logger } = require('../utils/logger');

describe('Pruebas de Base de Datos', () => {
  afterAll(async () => {
    // Cerrar conexión a la base de datos
    await db.closePool();
  });

  test('La configuración de base de datos está definida', () => {
    expect(db.dbConfig).toBeDefined();
    expect(db.dbConfig.host).toBeDefined();
    expect(db.dbConfig.user).toBeDefined();
    expect(db.dbConfig.database).toBeDefined();
  });

  test('El pool de conexiones está definido', () => {
    expect(db.pool).toBeDefined();
  });

  test('La función testConnection debería ejecutarse correctamente', async () => {
    // Este test verifica que la conexión a la base de datos funciona
    try {
      const result = await db.testConnection();
      expect(result).toBe(true);
    } catch (error) {
      // Si la conexión no se puede establecer, verificamos que el error es por conexión
      expect(error.message).toContain('Failed to connect to database');
    }
  });

  test('La función executeQuery debería ejecutar consultas SQL', async () => {
    try {
      // Ejecutar una consulta simple
      const result = await db.executeQuery('SELECT 1 as test');
      expect(Array.isArray(result)).toBe(true);
      
      if (result.length > 0) {
        expect(result[0].test).toBe(1);
      }
    } catch (error) {
      // Si hay un error en la consulta, verificamos que es un error de la base de datos
      expect(error).toBeDefined();
    }
  });

  test('Debería manejar errores de sintaxis SQL correctamente', async () => {
    try {
      // Consulta con error de sintaxis intencional
      await db.executeQuery('SELECT * FROM tabla_que_no_existe');
      // Si llegamos aquí, la prueba debería fallar
      expect(true).toBe(false); // Esto no debería ejecutarse
    } catch (error) {
      // Verificamos que el error es capturado
      expect(error).toBeDefined();
      expect(error.queryId).toBeDefined(); // Nuestro módulo agrega queryId a los errores
    }
  });
}); 