/**
 * Tests para el middleware de manejo de archivos (index.js)
 * Enfocados en cubrir todas las líneas de código y lógica de negocio
 */

// Mock dependencies before importing any modules
jest.mock('fs', () => ({
  existsSync: jest.fn(),
  promises: {
    mkdir: jest.fn().mockResolvedValue(undefined)
  },
  createReadStream: jest.fn(),
  createWriteStream: jest.fn(),
  mkdirSync: jest.fn()
}));

jest.mock('path', () => ({
  join: jest.fn((...args) => args.join('/')),
  extname: jest.fn((filePath) => {
    const parts = filePath.split('.');
    return parts.length > 1 ? '.' + parts[parts.length - 1] : '';
  }),
  basename: jest.fn((filePath) => {
    const parts = filePath.split('/');
    return parts[parts.length - 1];
  })
}));

jest.mock('multer', () => {
  const multerMock = jest.fn(() => ({
    single: jest.fn(() => (req, res, next) => next()),
    array: jest.fn(() => (req, res, next) => next()),
    fields: jest.fn(() => (req, res, next) => next()),
    none: jest.fn(() => (req, res, next) => next())
  }));
  
  multerMock.diskStorage = jest.fn(() => ({}));
  multerMock.memoryStorage = jest.fn(() => ({}));
  
  // Definir los errores de multer
  multerMock.MulterError = class MulterError extends Error {
    constructor(code, field) {
      super(`MulterError: ${code}`);
      this.code = code;
      this.field = field;
      this.name = 'MulterError';
    }
  };
  
  return multerMock;
});

jest.mock('crypto', () => ({
  randomBytes: jest.fn(() => ({
    toString: jest.fn(() => 'random-filename')
  }))
}));

// Mock del logger
const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn()
};

jest.mock('../../utils/logger', () => ({ 
  logger: mockLogger 
}));

// Mock process.cwd() without modifying global.process
jest.spyOn(process, 'cwd').mockReturnValue('/test/root');

// Import dependencies after mocking
const fs = require('fs');
const path = require('path');
const multer = require('multer');

// Constantes para los tests
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'text/csv'
];

describe('File Handler Middleware (index.js)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    fs.existsSync.mockReturnValue(true);
    fs.promises.mkdir.mockResolvedValue(undefined);
  });

  describe('Inicialización del módulo', () => {
    test('debe crear los directorios de upload si no existen', async () => {
      // Simular que los directorios no existen
      fs.existsSync.mockReturnValue(false);
      
      // Re-importar el módulo para que se ejecute la inicialización
      jest.isolateModules(() => {
        require('../../middleware/file-handler/index');
      });
      
      // Verificar que se intenta crear los directorios
      expect(fs.mkdirSync).toHaveBeenCalledWith(
        expect.stringContaining('uploads'),
        expect.objectContaining({ recursive: true })
      );
    });
    
    test('no debe crear directorios si ya existen', async () => {
      // Simular que los directorios existen
      fs.existsSync.mockReturnValue(true);
      
      // Re-importar el módulo
      jest.isolateModules(() => {
        require('../../middleware/file-handler/index');
      });
      
      // Verificar que no se intenta crear los directorios
      expect(fs.mkdirSync).not.toHaveBeenCalled();
    });
  });
  
  describe('Configuración de almacenamiento', () => {
    test('debe configurar multer storage con destination y filename correctos', () => {
      // Re-importar el módulo
      jest.isolateModules(() => {
        require('../../middleware/file-handler/index');
      });
      
      // Verificar que se configuró diskStorage
      expect(multer.diskStorage).toHaveBeenCalledWith(
        expect.objectContaining({
          destination: expect.any(Function),
          filename: expect.any(Function)
        })
      );
      
      // Probar la función destination
      const destinationFn = multer.diskStorage.mock.calls[0][0].destination;
      const req = { params: { id: '123' } };
      const file = {};
      const cb = jest.fn();
      
      destinationFn(req, file, cb);
      expect(cb).toHaveBeenCalled();
      
      // Probar la función filename
      const filenameFn = multer.diskStorage.mock.calls[0][0].filename;
      filenameFn(req, { originalname: 'test.pdf' }, cb);
      expect(cb).toHaveBeenCalled();
    });
    
    test('debe crear directorio específico para documento si no existe', () => {
      // Re-importar el módulo
      let storage;
      jest.isolateModules(() => {
        const module = require('../../middleware/file-handler/index');
        storage = multer.diskStorage.mock.calls[0][0];
      });
      
      // Simular que el directorio específico no existe
      fs.existsSync.mockReturnValue(false);
      
      // Probar la función destination cuando el directorio no existe
      const destinationFn = storage.destination;
      const req = { params: { id: '456' } };
      const file = {};
      const cb = jest.fn();
      
      destinationFn(req, file, cb);
      
      // Verificar que se crea el directorio
      expect(fs.mkdirSync).toHaveBeenCalledWith(
        expect.stringContaining('doc-456'),
        expect.objectContaining({ recursive: true })
      );
      expect(cb).toHaveBeenCalled();
    });
  });
  
  describe('Filtrado de archivos', () => {
    let fileFilter;
    
    beforeEach(() => {
      jest.isolateModules(() => {
        const fileHandlerModule = require('../../middleware/file-handler/index');
        fileFilter = fileHandlerModule._fileFilter;
      });
    });
    
    test('debe aceptar archivos con MIME types permitidos', () => {
      // Probar el filtro directamente
      const file = { mimetype: 'application/pdf', originalname: 'test.pdf' };
      const cb = jest.fn();
      
      fileFilter({}, file, cb);
      
      expect(cb).toHaveBeenCalledWith(null, true);
    });
    
    test('debe rechazar archivos con MIME types no permitidos', () => {
      // Probar el filtro con un tipo no permitido
      const file = { mimetype: 'application/javascript', originalname: 'test.js' };
      const cb = jest.fn();
      
      fileFilter({}, file, cb);
      
      expect(cb).toHaveBeenCalledWith(
        expect.objectContaining({ message: expect.stringContaining('no permitido') }),
        false
      );
    });
    
    test('debe rechazar archivos con extensiones no permitidas', () => {
      // MIME type permitido pero extensión incorrecta
      const file = { mimetype: 'application/pdf', originalname: 'test.exe' };
      const cb = jest.fn();
      
      fileFilter({}, file, cb);
      
      expect(cb).toHaveBeenCalledWith(
        expect.objectContaining({ message: expect.stringContaining('no permitida') }),
        false
      );
    });
  });
  
  describe('Manejo de errores', () => {
    let fileHandlerModule;
    
    beforeEach(() => {
      jest.isolateModules(() => {
        fileHandlerModule = require('../../middleware/file-handler/index');
      });
    });
    
    test('debe manejar errores de límite de tamaño de archivo', () => {
      // Simular error de límite de tamaño
      const err = new multer.MulterError('LIMIT_FILE_SIZE');
      const req = {};
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();
      
      // Ejecutar el middleware de error
      fileHandlerModule.multerErrorHandler(err, req, res, next);
      
      // Verificar respuesta
      expect(res.status).toHaveBeenCalledWith(413);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('tamaño máximo')
        })
      );
    });
    
    test('debe manejar errores de límite de cantidad de archivos', () => {
      // Simular error de límite de archivos
      const err = new multer.MulterError('LIMIT_FILE_COUNT');
      const req = {};
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();
      
      // Ejecutar el middleware de error
      fileHandlerModule.multerErrorHandler(err, req, res, next);
      
      // Verificar respuesta
      expect(res.status).toHaveBeenCalledWith(413);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('No se pueden subir más de')
        })
      );
    });
    
    test('debe manejar otros errores de multer', () => {
      // Simular otro error de multer
      const err = new multer.MulterError('LIMIT_UNEXPECTED_FILE');
      const req = {};
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();
      
      // Ejecutar el middleware de error
      fileHandlerModule.multerErrorHandler(err, req, res, next);
      
      // Verificar respuesta
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('Error al subir archivo')
        })
      );
    });
    
    test('debe manejar errores generales', () => {
      // Simular un error general
      const err = new Error('Error general');
      const req = {};
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();
      
      // Ejecutar el middleware de error
      fileHandlerModule.multerErrorHandler(err, req, res, next);
      
      // Verificar respuesta
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Error general'
        })
      );
      expect(mockLogger.error).toHaveBeenCalled();
    });
    
    test('debe usar mensaje por defecto cuando err.message es undefined', () => {
      // Simular un error sin mensaje
      const err = new Error();
      err.message = undefined;
      
      const req = {};
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();
      
      // Ejecutar el middleware de error
      fileHandlerModule.multerErrorHandler(err, req, res, next);
      
      // Verificar que se usa el mensaje por defecto
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Error al procesar el archivo'
        })
      );
      expect(mockLogger.error).toHaveBeenCalled();
    });
    
    test('debe pasar al siguiente middleware si no hay error', () => {
      const req = {};
      const res = {};
      const next = jest.fn();
      
      // Ejecutar el middleware de error sin error
      fileHandlerModule.multerErrorHandler(null, req, res, next);
      
      // Verificar que se pasó al siguiente middleware
      expect(next).toHaveBeenCalled();
    });
  });
  
  describe('Middleware principal', () => {
    let fileHandlerModule;
    
    beforeEach(() => {
      jest.isolateModules(() => {
        fileHandlerModule = require('../../middleware/file-handler/index');
      });
    });
    
    test('debe aplicar el middleware de multer para rutas de subida de archivos', () => {
      // Crear mocks
      const req = { 
        path: '/api/documents/123/attachments',
        method: 'POST'
      };
      const res = {};
      const next = jest.fn();
      
      // Ejecutar el middleware
      fileHandlerModule.fileHandlerMiddleware(req, res, next);
      
      // Verificar que se aplicó el middleware de multer
      expect(next).toHaveBeenCalled();
    });
    
    test('debe omitir el middleware para rutas que no son de subida de archivos', () => {
      // Crear mocks para una ruta que no es de archivos
      const req = { 
        path: '/api/usuarios',
        method: 'GET'
      };
      const res = {};
      const next = jest.fn();
      
      // Ejecutar el middleware
      fileHandlerModule.fileHandlerMiddleware(req, res, next);
      
      // Verificar que simplemente pasó al siguiente middleware
      expect(next).toHaveBeenCalled();
    });
    
    test('debe manejar errores desde el middleware de multer', () => {
      // Mock the single middleware to simulate an error
      const mockError = new Error('Error from multer');
      const mockSingleHandler = jest.fn((req, res, cb) => cb(mockError));
      
      // Replace the single method in uploadMiddleware
      const originalSingle = fileHandlerModule.uploadMiddleware.single;
      fileHandlerModule.uploadMiddleware.single = jest.fn().mockReturnValue(mockSingleHandler);
      
      // Set up request and response mocks
      const req = { 
        path: '/api/documents/123/attachments',
        method: 'POST'
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();
      
      // Call the middleware function
      fileHandlerModule.fileHandlerMiddleware(req, res, next);
      
      // Verify that mockSingleHandler was called
      expect(fileHandlerModule.uploadMiddleware.single).toHaveBeenCalledWith('file');
      expect(mockSingleHandler).toHaveBeenCalledWith(req, res, expect.any(Function));
      
      // Restore the original single method
      fileHandlerModule.uploadMiddleware.single = originalSingle;
    });
  });
}); 