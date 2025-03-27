/**
 * Tests para las rutas de seguridad
 * Verifica la estructura básica del archivo de rutas de seguridad
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
jest.mock('../../controllers/security.controller', () => ({
  getSecurityEvents: jest.fn(),
  getSecurityPolicies: jest.fn(),
  updateSecurityPolicy: jest.fn(),
  blockIP: jest.fn(),
  unblockIP: jest.fn(),
  getBlockedIPs: jest.fn()
}));

// Mock del middleware de autenticación
jest.mock('../../middleware/auth', () => ({
  verifyToken: jest.fn(),
  validatePermissions: jest.fn(() => jest.fn()),
  checkRole: jest.fn(() => jest.fn())
}));

// Mock del middleware de validación
jest.mock('../../middleware/validation', () => ({
  validateSchema: jest.fn(() => jest.fn())
}));

// Mock para el validator de seguridad
jest.mock('../../middleware/validation/security.validator', () => ({
  securityPolicySchema: { type: 'object' },
  ipBlockSchema: { type: 'object' }
}), { virtual: true });

describe('Security Routes', () => {
  let express;
  let securityRoutes;
  let router;
  
  beforeEach(() => {
    // Limpiar mocks
    jest.clearAllMocks();
    
    // Importar dependencias
    express = require('express');
    router = express.Router();
    
    // Cargar el módulo de rutas con los mocks configurados
    jest.isolateModules(() => {
      securityRoutes = require('../../routes/security.routes');
    });
  });
  
  test('debe configurar rutas de seguridad y administración', () => {
    // Verificar que se configuró un router
    expect(express.Router).toHaveBeenCalled();
    
    // Verificar que se llama a router.get al menos una vez para eventos de seguridad
    expect(router.get).toHaveBeenCalled();
    
    // Simplemente verificar que el módulo de rutas existe
    expect(securityRoutes).toBeDefined();
  });
}); 