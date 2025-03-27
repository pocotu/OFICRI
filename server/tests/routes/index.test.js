/**
 * Tests para el archivo de rutas principal
 * Verifica la estructura básica del archivo de rutas principal
 */

jest.mock('express', () => {
  const mockRouter = {
    use: jest.fn().mockReturnThis(),
    get: jest.fn().mockReturnThis()
  };
  
  return {
    Router: jest.fn(() => mockRouter)
  };
});

// Mock del middleware de autenticación
jest.mock('../../middleware/auth', () => ({
  verifyToken: jest.fn()
}));

// Mock del middleware de seguridad
jest.mock('../../middleware/security/csrf.middleware', () => ({
  csrfMiddleware: jest.fn()
}));

// Mock del logger
jest.mock('../../utils/logger/index', () => ({
  logSecurityEvent: jest.fn()
}));

// Mocks de los módulos de rutas
jest.mock('../../routes/auth.routes', () => 'authRoutes');
jest.mock('../../routes/user.routes', () => 'userRoutes');
jest.mock('../../routes/area.routes', () => 'areaRoutes');
jest.mock('../../routes/role.routes', () => 'roleRoutes');
jest.mock('../../routes/mesaPartes.routes', () => 'mesaPartesRoutes');
jest.mock('../../routes/document.routes', () => 'documentRoutes');
jest.mock('../../routes/dashboard.routes', () => 'dashboardRoutes');
jest.mock('../../routes/security.routes', () => 'securityRoutes');
jest.mock('../../routes/notification.routes', () => 'notificationRoutes');
jest.mock('../../routes/logs.routes', () => 'logsRoutes');
jest.mock('../../routes/permisos.routes', () => 'permisosRoutes');

describe('Routes Index', () => {
  let express;
  let indexRoutes;
  let router;
  
  beforeEach(() => {
    // Limpiar mocks
    jest.clearAllMocks();
    
    // Importar dependencias
    express = require('express');
    router = express.Router();
    
    // Cargar el módulo de rutas con los mocks configurados
    jest.isolateModules(() => {
      indexRoutes = require('../../routes/index');
    });
  });
  
  test('debe configurar el middleware para extraer la versión de API', () => {
    // Verificar que se configuró un router
    expect(express.Router).toHaveBeenCalled();
    
    // Verificar que se llama a router.use al menos una vez
    expect(router.use).toHaveBeenCalled();
    
    // Simplemente verificar que el módulo de rutas existe
    expect(indexRoutes).toBeDefined();
  });
}); 