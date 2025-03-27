/**
 * Tests para las rutas de notificaciones
 * Verifica la estructura básica del archivo de rutas de notificaciones
 */

jest.mock('express', () => {
  const mockRouter = {
    get: jest.fn().mockReturnThis(),
    post: jest.fn().mockReturnThis(),
    put: jest.fn().mockReturnThis(),
    patch: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    use: jest.fn().mockReturnThis()
  };
  
  return {
    Router: jest.fn(() => mockRouter)
  };
});

// Mock de los controladores
jest.mock('../../controllers/notification.controller', () => ({
  getAllNotifications: jest.fn(),
  getNotificationById: jest.fn(),
  getUserNotifications: jest.fn(),
  markAsRead: jest.fn(),
  createNotification: jest.fn(),
  deleteNotification: jest.fn()
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

// Mock para el validator de notificaciones
jest.mock('../../middleware/validation/notification.validator', () => ({
  notificationSchema: { type: 'object' }
}), { virtual: true });

describe('Notification Routes', () => {
  let express;
  let notificationRoutes;
  let router;
  
  beforeEach(() => {
    // Limpiar mocks
    jest.clearAllMocks();
    
    // Importar dependencias
    express = require('express');
    router = express.Router();
    
    // Cargar el módulo de rutas con los mocks configurados
    jest.isolateModules(() => {
      notificationRoutes = require('../../routes/notification.routes');
    });
  });
  
  test('debe configurar rutas GET para obtener notificaciones', () => {
    // Verificar que se configuró un router
    expect(express.Router).toHaveBeenCalled();
    
    // Verificar que se llama a router.get al menos una vez
    expect(router.get).toHaveBeenCalled();
    
    // Simplemente verificar que el módulo de rutas existe
    expect(notificationRoutes).toBeDefined();
  });
  
  test('debe configurar ruta PATCH para marcar notificaciones como leídas', () => {
    // Verificar que se llama a router.patch al menos una vez
    expect(router.patch).toHaveBeenCalled();
  });
  
  test('debe configurar ruta DELETE para eliminar notificaciones', () => {
    // Verificar que se llama a router.delete al menos una vez
    expect(router.delete).toHaveBeenCalled();
  });
}); 