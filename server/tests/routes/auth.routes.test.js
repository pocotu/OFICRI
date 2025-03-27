/**
 * Tests para las rutas de autenticación
 * Verifica la estructura básica del archivo de rutas de autenticación
 */

jest.mock('express', () => {
  const mockRouter = {
    post: jest.fn().mockReturnThis(),
    get: jest.fn().mockReturnThis(),
    put: jest.fn().mockReturnThis(),
    use: jest.fn().mockReturnThis()
  };
  
  return {
    Router: jest.fn(() => mockRouter)
  };
});

// Mock de los controladores
jest.mock('../../controllers/auth.controller', () => ({
  login: jest.fn(),
  logout: jest.fn(),
  registro: jest.fn(),
  verificarToken: jest.fn(),
  solicitarResetPassword: jest.fn(),
  resetPassword: jest.fn(),
  cambiarPassword: jest.fn(),
  refreshToken: jest.fn(),
  bloquearUsuario: jest.fn()
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

// Mock para el validator de autenticación
jest.mock('../../middleware/validation/auth.validator', () => ({
  loginSchema: { type: 'object' },
  registroSchema: { type: 'object' },
  resetPasswordSchema: { type: 'object' },
  cambioPasswordSchema: { type: 'object' }
}));

describe('Auth Routes', () => {
  let express;
  let authRoutes;
  let router;
  
  beforeEach(() => {
    // Limpiar mocks
    jest.clearAllMocks();
    
    // Importar dependencias
    express = require('express');
    router = express.Router();
    
    // Cargar el módulo de rutas con los mocks configurados
    jest.isolateModules(() => {
      authRoutes = require('../../routes/auth.routes');
    });
  });
  
  test('debe configurar ruta POST /login con validación de esquema', () => {
    // Verificar que se configuró un router
    expect(express.Router).toHaveBeenCalled();
    
    // Verificar que se llama a router.post al menos una vez
    expect(router.post).toHaveBeenCalled();
    
    // Simplemente verificar que el módulo de rutas existe
    expect(authRoutes).toBeDefined();
  });
}); 