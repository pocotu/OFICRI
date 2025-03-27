/**
 * Tests para las rutas de documentos
 * Verifica la estructura básica del archivo de rutas de documentos
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

// Mock de multer
jest.mock('multer', () => {
  const mockMulter = jest.fn().mockReturnValue({
    array: jest.fn().mockReturnValue(jest.fn()),
    single: jest.fn().mockReturnValue(jest.fn())
  });
  
  mockMulter.diskStorage = jest.fn().mockReturnValue({});
  
  return mockMulter;
});

// Mock de los controladores
jest.mock('../../controllers/document.controller', () => ({
  listarDocumentos: jest.fn(),
  obtenerDocumento: jest.fn(),
  crearDocumento: jest.fn(),
  actualizarDocumento: jest.fn(),
  eliminarDocumento: jest.fn(),
  derivarDocumento: jest.fn(),
  adjuntarArchivo: jest.fn(),
  descargarArchivo: jest.fn(),
  buscarDocumentos: jest.fn()
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

// Mock para el validator de documentos
jest.mock('../../middleware/validation/documento.validator', () => ({
  documentoSchema: { type: 'object' },
  derivacionSchema: { type: 'object' }
}), { virtual: true });

describe('Document Routes', () => {
  let express;
  let documentRoutes;
  let router;
  let multer;
  let auth;
  let validation;
  
  beforeEach(() => {
    // Limpiar mocks
    jest.clearAllMocks();
    
    // Importar dependencias
    express = require('express');
    router = express.Router();
    multer = require('multer');
    auth = require('../../middleware/auth');
    validation = require('../../middleware/validation');
    
    // Cargar el módulo de rutas con los mocks configurados
    jest.isolateModules(() => {
      documentRoutes = require('../../routes/document.routes');
    });
  });
  
  test('debe configurar rutas GET para listar y obtener documentos', () => {
    // Verificar que se configuró un router
    expect(express.Router).toHaveBeenCalled();
    
    // Verificar que se llama a router.get al menos una vez
    expect(router.get).toHaveBeenCalled();
    
    // Simplemente verificar que el módulo de rutas existe
    expect(documentRoutes).toBeDefined();
  });
  
  test('debe configurar multer para la subida de archivos', () => {
    // Verificar que se configuró multer.diskStorage
    expect(multer.diskStorage).toHaveBeenCalled();
    expect(multer.diskStorage).toHaveBeenCalledWith(expect.objectContaining({
      destination: expect.any(Function),
      filename: expect.any(Function)
    }));
    
    // Verificar que se llamó a multer con la configuración
    expect(multer).toHaveBeenCalled();
    expect(multer).toHaveBeenCalledWith(expect.objectContaining({
      storage: expect.any(Object),
      limits: expect.objectContaining({
        fileSize: expect.any(Number),
        files: expect.any(Number)
      }),
      fileFilter: expect.any(Function)
    }));
    
    // Probar la función de destination
    const destinationFn = multer.diskStorage.mock.calls[0][0].destination;
    const cb = jest.fn();
    destinationFn({}, {}, cb);
    expect(cb).toHaveBeenCalledWith(null, './uploads/documents');
    
    // Probar la función de filename
    const filenameFn = multer.diskStorage.mock.calls[0][0].filename;
    const file = { originalname: 'test.pdf' };
    filenameFn({}, file, cb);
    expect(cb).toHaveBeenCalledWith(null, expect.stringContaining('-test.pdf'));
    
    // Verificar que se configura al menos una ruta POST
    expect(router.post).toHaveBeenCalled();
  });
  
  test('debe configurar el filtrado de tipos de archivo', () => {
    // Obtener la función fileFilter de la configuración de multer
    const fileFilterFn = multer.mock.calls[0][0].fileFilter;
    const cb = jest.fn();
    
    // Caso: tipo de archivo permitido (PDF)
    fileFilterFn({}, { mimetype: 'application/pdf' }, cb);
    expect(cb).toHaveBeenCalledWith(null, true);
    
    // Caso: tipo de archivo permitido (imagen)
    fileFilterFn({}, { mimetype: 'image/png' }, cb);
    expect(cb).toHaveBeenCalledWith(null, true);
    
    // Caso: tipo de archivo permitido (documento Word)
    fileFilterFn({}, { mimetype: 'application/msword' }, cb);
    expect(cb).toHaveBeenCalledWith(null, true);
    
    // Caso: tipo de archivo no permitido
    fileFilterFn({}, { mimetype: 'application/javascript' }, cb);
    expect(cb).toHaveBeenCalledWith(expect.any(Error), false);
  });
}); 