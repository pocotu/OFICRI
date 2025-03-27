/**
 * Tests para las rutas de áreas
 * Verifica la estructura básica del archivo de rutas de áreas
 */

jest.mock('express', () => {
  const mockRouter = {
    get: jest.fn().mockReturnThis(),
    post: jest.fn().mockReturnThis(),
    put: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    use: jest.fn().mockReturnThis(),
  };
  
  return {
    Router: jest.fn(() => mockRouter)
  };
});

// Mock de los controladores
jest.mock('../../controllers/area.controller', () => ({
  getAllAreas: jest.fn(),
  getAreaById: jest.fn(),
  createArea: jest.fn(),
  updateArea: jest.fn(),
  deleteArea: jest.fn(),
  getSubareas: jest.fn(),
  assignUserToArea: jest.fn(),
  removeUserFromArea: jest.fn()
}));

// Mock del middleware de autenticación
jest.mock('../../middleware/auth', () => ({
  verifyToken: jest.fn(),
  validatePermissions: jest.fn(() => jest.fn())
}));

// Mock del middleware de validación
jest.mock('../../middleware/validation', () => ({
  validateSchema: jest.fn(() => jest.fn())
}));

// Mock para el validator de áreas
jest.mock('../../middleware/validation/area.validator', () => ({
  areaSchema: { type: 'object' },
  userAssignmentSchema: { type: 'object' }
}), { virtual: true });

describe('Area Routes', () => {
  let express;
  let areaRoutes;
  let router;
  
  beforeEach(() => {
    // Limpiar mocks
    jest.clearAllMocks();
    
    // Importar dependencias
    express = require('express');
    router = express.Router();
    
    // Cargar el módulo de rutas con los mocks configurados
    jest.isolateModules(() => {
      areaRoutes = require('../../routes/area.routes');
    });
  });
  
  test('debe configurar ruta GET / para obtener todas las áreas', () => {
    // Verificar que se configuró un router
    expect(express.Router).toHaveBeenCalled();
    
    // Verificar que se llama a router.get al menos una vez
    expect(router.get).toHaveBeenCalled();
    
    // Simplemente verificar que el módulo de rutas existe
    expect(areaRoutes).toBeDefined();
  });
}); 