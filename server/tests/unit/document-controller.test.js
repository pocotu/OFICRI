/**
 * Document Controller Tests
 * Unit tests for document controller functions
 */

// Mock database antes de importar el controlador
jest.mock('../../config/database', () => {
  return {
    executeQuery: jest.fn(),
    logger: {
      debug: jest.fn()
    }
  };
});

// Mock logger antes de importarlo
jest.mock('../../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
  },
  logSecurityEvent: jest.fn()
}));

// Ahora importamos el controlador (después de los mocks)
const documentController = require('../../controllers/document.controller');

// Importamos los módulos mockeados
const db = require('../../config/database');
const { logger } = require('../../utils/logger');

describe('Document Controller', () => {
  let mockRequest;
  let mockResponse;
  
  beforeEach(() => {
    // Reset all mocks and their implementations
    jest.clearAllMocks();
    
    // Setup mockResponse first
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    
    // Setup request object with datos por defecto
    mockRequest = {
      query: {
        page: 1, 
        limit: 10
      },
      params: {},
      body: {},
      user: {
        id: 1,
        role: 'admin'
      }
    };
    
    // Default implementation for db.executeQuery
    db.executeQuery.mockImplementation((sql, params = []) => {
      // Para consultas de conteo
      if (sql.includes('COUNT')) {
        return Promise.resolve([{ total: 2 }]);
      } 
      // Para consultas filtradas por estado
      else if (sql.includes('estado') && params.includes('RECIBIDO')) {
        return Promise.resolve([
          {
            IDDocumento: 1,
            NroRegistro: 'DOC-2023-001',
            NumeroOficioDocumento: 'OF-2023-001',
            FechaDocumento: new Date(),
            FechaRegistro: new Date(),
            OrigenDocumento: 'EXTERNO',
            Estado: 'RECIBIDO',
            Procedencia: 'Empresa A',
            AreaActual: 'Administración'
          }
        ]);
      } 
      // Respuesta por defecto para consultas de documentos
      else {
        return Promise.resolve([
          {
            IDDocumento: 1,
            NroRegistro: 'DOC-2023-001',
            NumeroOficioDocumento: 'OF-2023-001',
            FechaDocumento: new Date(),
            FechaRegistro: new Date(),
            OrigenDocumento: 'EXTERNO',
            Estado: 'RECIBIDO',
            Procedencia: 'Empresa A',
            AreaActual: 'Administración'
          },
          {
            IDDocumento: 2,
            NroRegistro: 'DOC-2023-002',
            NumeroOficioDocumento: 'OF-2023-002',
            FechaDocumento: new Date(),
            FechaRegistro: new Date(),
            OrigenDocumento: 'INTERNO',
            Estado: 'DERIVADO',
            Procedencia: 'Empresa B',
            AreaActual: 'Finanzas'
          }
        ]);
      }
    });
  });
  
  describe('getAllDocuments', () => {
    it('should get all documents with default pagination', async () => {
      // Execute controller method
      await documentController.getAllDocuments(mockRequest, mockResponse);
      
      // Verify status is called with 200
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      
      // Verify json is called with success response
      expect(mockResponse.json).toHaveBeenCalled();
      const responseJson = mockResponse.json.mock.calls[0][0];
      expect(responseJson.success).toBe(true);
      expect(responseJson.data).toBeTruthy();
    });
    
    it('should apply filters when provided in query params', async () => {
      // Setup request query params
      mockRequest.query = {
        page: '1',
        limit: '10',
        estado: 'RECIBIDO',
        search: 'test'
      };
      
      // Execute controller method
      await documentController.getAllDocuments(mockRequest, mockResponse);
      
      // Verify status is called with 200
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      
      // Verify json is called with success response
      expect(mockResponse.json).toHaveBeenCalled();
      const responseJson = mockResponse.json.mock.calls[0][0];
      expect(responseJson.success).toBe(true);
      expect(responseJson.data).toBeTruthy();
    });
    
    it('should handle database errors', async () => {
      // Override the mock for this specific test
      db.executeQuery.mockImplementationOnce(() => {
        throw new Error('Database error');
      });
      
      // Execute controller method
      await documentController.getAllDocuments(mockRequest, mockResponse);
      
      // Verify status is called with 500
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      
      // Verify json is called with error response
      expect(mockResponse.json).toHaveBeenCalled();
      const responseJson = mockResponse.json.mock.calls[0][0];
      expect(responseJson.success).toBe(false);
      expect(responseJson.message).toBeTruthy();
      
      // Verify logger is called
      expect(logger.error).toHaveBeenCalled();
    });
  });
}); 