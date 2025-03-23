/**
 * Area Controller Tests
 * Unit tests for area controller functions
 */

// Mocking the database
jest.mock('../../config/database', () => {
  return {
    pool: {
      query: jest.fn()
    }
  };
});

// Import the database mock
const db = require('../../config/database');

// Mock the logger
jest.mock('../../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
  }
}));

// Import the logger mock
const { logger } = require('../../utils/logger');

// Import the controller
const areaController = require('../../controllers/area.controller');

describe('Area Controller', () => {
  let mockRequest;
  let mockResponse;
  
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Setup request and response objects
    mockRequest = {
      query: {},
      params: {},
      body: {}
    };
    
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    
    // Default implementation for db.pool.query
    db.pool.query.mockImplementation((sql, params) => {
      if (sql.includes('COUNT')) {
        return Promise.resolve({
          rows: [{ total: 5 }]
        });
      }
      
      if (sql.includes('WHERE a.id = $1')) {
        // Simular el comportamiento cuando se busca un área por ID
        if (params && params[0] === '1') {
          return Promise.resolve({
            rows: [{
              id: 1,
              nombre: 'Administración',
              descripcion: 'Descripción del área de administración',
              idResponsable: 1,
              responsableNombre: 'Juan',
              responsableApellido: 'Pérez',
              fechaCreacion: new Date(),
              fechaActualizacion: new Date()
            }]
          });
        } else {
          // Si el ID no existe
          return Promise.resolve({
            rows: []
          });
        }
      }
      
      // Simular el comportamiento para obtener todas las áreas
      return Promise.resolve({
        rows: [
          {
            id: 1,
            nombre: 'Administración',
            descripcion: 'Descripción del área de administración',
            idResponsable: 1,
            responsableNombre: 'Juan',
            responsableApellido: 'Pérez',
            fechaCreacion: new Date(),
            fechaActualizacion: new Date()
          },
          {
            id: 2,
            nombre: 'Finanzas',
            descripcion: 'Descripción del área de finanzas',
            idResponsable: 2,
            responsableNombre: 'María',
            responsableApellido: 'González',
            fechaCreacion: new Date(),
            fechaActualizacion: new Date()
          }
        ]
      });
    });
  });
  
  describe('getAllAreas', () => {
    it('should get all areas with pagination and return 200 status', async () => {
      // Set up pagination query parameters
      mockRequest.query = { limit: 10, offset: 0 };
      
      // Execute function
      await areaController.getAllAreas(mockRequest, mockResponse);
      
      // Assert that the response status was 200
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      
      // Assert JSON response structure
      expect(mockResponse.json).toHaveBeenCalled();
      const response = mockResponse.json.mock.calls[0][0];
      expect(response.success).toBe(true);
      expect(Array.isArray(response.data)).toBe(true);
      expect(typeof response.count).toBe('number');
      expect(typeof response.message).toBe('string');
    });
    
    it('should handle database errors and return 500 status', async () => {
      // Make the query function throw an error
      db.pool.query.mockImplementationOnce(() => {
        throw new Error('Database connection error');
      });
      
      // Execute function
      await areaController.getAllAreas(mockRequest, mockResponse);
      
      // Assert that the response status was 500
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      
      // Assert JSON error response
      expect(mockResponse.json).toHaveBeenCalled();
      const response = mockResponse.json.mock.calls[0][0];
      expect(response.success).toBe(false);
      expect(response.message).toBe('Error al obtener áreas');
      expect(response.error).toBe('Error en el servidor');
      
      // Verify that the error was logged
      expect(logger.error).toHaveBeenCalled();
    });
  });
  
  describe('getAreaById', () => {
    it('should get an area by id and return 200 status', async () => {
      // Set up request parameters with a valid ID
      mockRequest.params = { id: '1' };
      
      // Execute function
      await areaController.getAreaById(mockRequest, mockResponse);
      
      // Assert that the response status was 200
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      
      // Assert JSON response
      expect(mockResponse.json).toHaveBeenCalled();
      const response = mockResponse.json.mock.calls[0][0];
      expect(response.success).toBe(true);
      expect(response.data).toBeDefined();
      expect(response.data.id).toBe(1);
      expect(response.message).toBe('Área obtenida correctamente');
    });
    
    it('should return 404 if area not found', async () => {
      // Set up request parameters with a non-existent ID
      mockRequest.params = { id: '999' };
      
      // Execute function
      await areaController.getAreaById(mockRequest, mockResponse);
      
      // Assert that the response status was 404
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      
      // Assert JSON error response
      expect(mockResponse.json).toHaveBeenCalled();
      const response = mockResponse.json.mock.calls[0][0];
      expect(response.success).toBe(false);
      expect(response.message).toBe('Área no encontrada');
    });
    
    it('should return 400 for invalid id', async () => {
      // Set up request parameters with an invalid ID
      mockRequest.params = { id: 'invalid' };
      
      // Execute function
      await areaController.getAreaById(mockRequest, mockResponse);
      
      // Assert that the response status was 400
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      
      // Assert JSON error response
      expect(mockResponse.json).toHaveBeenCalled();
      const response = mockResponse.json.mock.calls[0][0];
      expect(response.success).toBe(false);
      expect(response.message).toBe('ID de área inválido');
    });
    
    it('should handle database errors and return 500 status', async () => {
      // Set up request parameters
      mockRequest.params = { id: '1' };
      
      // Make the query function throw an error
      db.pool.query.mockImplementationOnce(() => {
        throw new Error('Database connection error');
      });
      
      // Execute function
      await areaController.getAreaById(mockRequest, mockResponse);
      
      // Assert that the response status was 500
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      
      // Assert JSON error response
      expect(mockResponse.json).toHaveBeenCalled();
      const response = mockResponse.json.mock.calls[0][0];
      expect(response.success).toBe(false);
      expect(response.message).toBe('Error al obtener área');
      expect(response.error).toBe('Error en el servidor');
      
      // Verify that the error was logged
      expect(logger.error).toHaveBeenCalled();
    });
  });
}); 