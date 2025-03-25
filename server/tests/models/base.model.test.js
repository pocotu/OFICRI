/**
 * Tests para BaseModel
 * Pruebas unitarias para verificar la funcionalidad del modelo base
 */

// IMPORTANTE: mockear primero antes de importar BaseModel
// Mock del módulo database
jest.mock('../../config/database', () => ({
  executeQuery: jest.fn()
}));

// Mock del módulo logger
jest.mock('../../utils/logger', () => ({
  logger: {
    error: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn()
  }
}));

// Importar módulos después de mockearlos
const BaseModel = require('../../models/base.model');
const database = require('../../config/database');
const { logger } = require('../../utils/logger');

describe('BaseModel', () => {
  let model;
  
  // Configuración antes de cada test
  beforeEach(() => {
    // Limpiar los mocks antes de cada test
    jest.clearAllMocks();
    
    // Crear una instancia del modelo con configuración de prueba
    model = new BaseModel('TestTable', {
      primaryKey: 'IDTest',
      softDelete: true,
      requiredFields: ['name', 'description'],
      uniqueFields: ['code'],
      sensitiveFields: ['password'],
      defaultValues: { isActive: true }
    });
    
    // Agregar método _sanitizeOutput si no existe
    if (!model._sanitizeOutput) {
      model._sanitizeOutput = jest.fn(data => data);
    }
  });
  
  describe('findById', () => {
    test('debe generar la consulta SQL correcta', async () => {
      // Configurar el mock para devolver un resultado
      database.executeQuery.mockResolvedValueOnce([{ IDTest: 1, name: 'Test', isActive: true }]);
      
      // Ejecutar el método a probar
      const result = await model.findById(1);
      
      // Verificar que executeQuery fue llamado con los parámetros correctos
      expect(database.executeQuery).toHaveBeenCalledWith(
        'SELECT * FROM TestTable WHERE IDTest = ? AND IsActive = TRUE',
        [1]
      );
      
      // Verificar el resultado
      expect(result).toEqual({ IDTest: 1, name: 'Test', isActive: true });
    });
    
    test('debe incluir registros eliminados si se especifica en las opciones', async () => {
      // Configurar el mock
      database.executeQuery.mockResolvedValueOnce([{ IDTest: 1, name: 'Test', isActive: false }]);
      
      // Ejecutar con opción includeSoftDeleted
      await model.findById(1, { includeSoftDeleted: true });
      
      // Verificar que no se añade la condición de IsActive
      expect(database.executeQuery).toHaveBeenCalledWith(
        'SELECT * FROM TestTable WHERE IDTest = ?',
        [1]
      );
    });
    
    test('debe devolver null si no se encuentra el registro', async () => {
      // Configurar el mock para devolver un array vacío
      database.executeQuery.mockResolvedValueOnce([]);
      
      // Ejecutar el método
      const result = await model.findById(999);
      
      // Verificar que el resultado es null
      expect(result).toBeNull();
    });
    
    test('debe permitir seleccionar campos específicos', async () => {
      // Configurar el mock
      database.executeQuery.mockResolvedValueOnce([{ IDTest: 1, name: 'Test' }]);
      
      // Ejecutar el método con campos específicos
      await model.findById(1, { fields: 'IDTest, name' });
      
      // Verificar la consulta generada
      expect(database.executeQuery).toHaveBeenCalledWith(
        'SELECT IDTest, name FROM TestTable WHERE IDTest = ? AND IsActive = TRUE',
        [1]
      );
    });
  });
  
  describe('findAll', () => {
    test('debe generar la consulta SQL correcta con criterios', async () => {
      // Configurar el mock
      database.executeQuery.mockResolvedValueOnce([
        { IDTest: 1, name: 'Test 1', type: 'A' },
        { IDTest: 2, name: 'Test 2', type: 'A' }
      ]);
      
      // Ejecutar el método con criterios
      const result = await model.findAll({ type: 'A' });
      
      // Verificar la consulta generada
      expect(database.executeQuery).toHaveBeenCalledWith(
        expect.stringContaining('WHERE type = ? AND IsActive = TRUE'),
        ['A']
      );
      
      // Verificar el resultado
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Test 1');
    });
    
    test('debe aplicar correctamente limit y offset', async () => {
      // Configurar el mock
      database.executeQuery.mockResolvedValueOnce([{ IDTest: 2, name: 'Test 2' }]);
      
      // Ejecutar el método con paginación
      await model.findAll({}, { limit: 10, offset: 10 });
      
      // Verificar la consulta generada
      expect(database.executeQuery).toHaveBeenCalledWith(
        expect.stringContaining('LIMIT 10 OFFSET 10'),
        expect.anything()
      );
    });
    
    test('debe aplicar correctamente el ordenamiento', async () => {
      // Configurar el mock
      database.executeQuery.mockResolvedValueOnce([]);
      
      // Ejecutar el método con ordenamiento personalizado
      await model.findAll({}, { orderBy: 'name', orderDir: 'DESC' });
      
      // Verificar la consulta generada
      expect(database.executeQuery).toHaveBeenCalledWith(
        expect.stringContaining('ORDER BY name DESC'),
        expect.anything()
      );
    });
  });
  
  describe('_validateRequiredFields', () => {
    test('debe lanzar error si faltan campos requeridos', () => {
      // Crear datos con campos faltantes
      const invalidData = { name: 'Test' }; // Falta 'description'
      
      // Verificar que se lanza un error
      expect(() => {
        model._validateRequiredFields(invalidData);
      }).toThrow(/required/i);
    });
    
    test('debe pasar la validación con todos los campos requeridos', () => {
      // Crear datos con todos los campos requeridos
      const validData = { name: 'Test', description: 'Description' };
      
      // Verificar que no se lanza error
      expect(() => {
        model._validateRequiredFields(validData);
      }).not.toThrow();
    });
  });
}); 