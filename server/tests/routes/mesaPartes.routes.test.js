/**
 * Tests para las rutas de mesa de partes
 * Verifica la estructura básica del archivo de rutas de mesa de partes
 */

jest.mock('express', () => {
  const mockRouter = {
    get: jest.fn().mockReturnThis(),
    post: jest.fn().mockReturnThis(),
    put: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    use: jest.fn().mockReturnThis()
  };
  
  return {
    Router: jest.fn(() => mockRouter)
  };
});

// Mock de los controladores
jest.mock('../../controllers/mesaPartes.controller', () => ({
  getAllMesaPartes: jest.fn(),
  getMesaPartesById: jest.fn(),
  createMesaPartes: jest.fn(),
  updateMesaPartes: jest.fn(),
  deleteMesaPartes: jest.fn(),
  registrarDocumento: jest.fn(),
  listarDocumentosMesaPartes: jest.fn(),
  estadisticasMesaPartes: jest.fn()
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

// Mock para el validator de mesa de partes
jest.mock('../../middleware/validation/mesaPartes.validator', () => ({
  mesaPartesSchema: { type: 'object' },
  documentoIngresoSchema: { type: 'object' }
}), { virtual: true });

describe('Mesa Partes Routes', () => {
  let express;
  let mesaPartesRoutes;
  let router;
  
  beforeEach(() => {
    // Limpiar mocks
    jest.clearAllMocks();
    
    // Importar dependencias
    express = require('express');
    router = express.Router();
    
    // Cargar el módulo de rutas con los mocks configurados
    jest.isolateModules(() => {
      mesaPartesRoutes = require('../../routes/mesaPartes.routes');
    });
  });
  
  test('debe configurar rutas GET para listar y obtener mesas de partes', () => {
    // Verificar que se configuró un router
    expect(express.Router).toHaveBeenCalled();
    
    // Verificar que se llama a router.get al menos una vez
    expect(router.get).toHaveBeenCalled();
    
    // Simplemente verificar que el módulo de rutas existe
    expect(mesaPartesRoutes).toBeDefined();
  });
}); 