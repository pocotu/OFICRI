/**
 * Tests for the file handler middleware module
 * Specifically targeting server/middleware/file-handler/index.js
 */

// Mock dependencies before requiring the module under test
jest.mock('fs');
jest.mock('path');
jest.mock('crypto');
jest.mock('multer');
jest.mock('../../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn()
  }
}));

// Import dependencies after mocking
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');
const { logger } = require('../../utils/logger');

// Create mock for multer
const mockMiddleware = jest.fn((req, res, next) => next());
const mockSingle = jest.fn().mockReturnValue(mockMiddleware);
const mockUpload = {
  single: mockSingle
};

// Set up the multer mock
multer.mockReturnValue(mockUpload);

// Set up multer.diskStorage
multer.diskStorage = jest.fn((options) => {
  return {
    getDestination: function(req, file, cb) {
      return options.destination(req, file, cb);
    },
    getFilename: function(req, file, cb) {
      return options.filename(req, file, cb);
    }
  };
});

multer.MulterError = class MulterError extends Error {
  constructor(code) {
    super(`MulterError: ${code}`);
    this.code = code;
    this.name = 'MulterError';
  }
};

describe('File Handler Middleware', () => {
  let fileHandler;
  let req, res, next;
  
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Setup fs mock
    fs.existsSync = jest.fn().mockReturnValue(false);
    fs.mkdirSync = jest.fn();
    
    // Setup path mock
    path.join = jest.fn((...args) => args.join('/'));
    path.extname = jest.fn((filename) => {
      const parts = filename.split('.');
      return parts.length > 1 ? `.${parts[parts.length - 1]}` : '';
    });
    
    // Setup crypto mock
    crypto.randomBytes = jest.fn().mockReturnValue({
      toString: jest.fn().mockReturnValue('randomstring')
    });
    
    // Create a mock for process.cwd()
    global.process.cwd = jest.fn().mockReturnValue('/root');
    
    // Reset middleware behavior
    mockMiddleware.mockImplementation((req, res, next) => next());
    
    // Setup request, response, and next function
    req = {
      path: '/api/documents/123/attachments',
      method: 'POST',
      params: {
        id: '123'
      },
      file: {
        originalname: 'test.pdf',
        mimetype: 'application/pdf'
      }
    };
    
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    
    next = jest.fn();
    
    // Reset and reload the module under test - use the explicit path
    jest.isolateModules(() => {
      fileHandler = require('../../middleware/file-handler/index.js');
    });
  });
  
  describe('Directory initialization', () => {
    it('should create upload directories if they do not exist', () => {
      // Verify the module initialized and tried to create directories
      expect(path.join).toHaveBeenCalledWith('/root', 'uploads');
      expect(fs.existsSync).toHaveBeenCalled();
      expect(fs.mkdirSync).toHaveBeenCalled();
      expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('Created upload directory'));
    });
    
    it('should not create directories if they already exist', () => {
      // Reset and mock existsSync to return true
      jest.clearAllMocks();
      fs.existsSync.mockReturnValue(true);
      
      // Re-require the module to trigger initialization with existing directories
      jest.isolateModules(() => {
        require('../../middleware/file-handler/index.js');
      });
      
      // Verify directory creation was not attempted
      expect(fs.existsSync).toHaveBeenCalled();
      expect(fs.mkdirSync).not.toHaveBeenCalled();
    });
  });
  
  describe('Storage configuration', () => {
    it('should configure storage with correct destination and filename functions', () => {
      // Verify diskStorage was configured correctly
      expect(multer.diskStorage).toHaveBeenCalledWith(
        expect.objectContaining({
          destination: expect.any(Function),
          filename: expect.any(Function)
        })
      );
      
      // Test the destination function
      const options = multer.diskStorage.mock.calls[0][0];
      const destinationCb = jest.fn();
      
      options.destination(req, {}, destinationCb);
      
      // Verify destination logic
      expect(path.join).toHaveBeenCalled();
      expect(fs.existsSync).toHaveBeenCalled();
      expect(fs.mkdirSync).toHaveBeenCalled();
      expect(destinationCb).toHaveBeenCalledWith(null, expect.any(String));
      
      // Test the filename function
      const filenameCb = jest.fn();
      const file = { originalname: 'test.jpg' };
      
      options.filename(req, file, filenameCb);
      
      // Verify filename generation logic
      expect(crypto.randomBytes).toHaveBeenCalledWith(16);
      expect(path.extname).toHaveBeenCalledWith('test.jpg');
      expect(filenameCb).toHaveBeenCalledWith(null, expect.stringContaining('randomstring'));
      expect(file.originalFilename).toBe('test.jpg');
    });
  });
  
  describe('File filter', () => {
    it('should accept files with allowed MIME types and extensions', () => {
      const cb = jest.fn();
      const file = {
        mimetype: 'application/pdf',
        originalname: 'document.pdf'
      };
      
      fileHandler._fileFilter(req, file, cb);
      
      // Verify file was accepted
      expect(cb).toHaveBeenCalledWith(null, true);
    });
    
    it('should reject files with disallowed MIME types', () => {
      const cb = jest.fn();
      const file = {
        mimetype: 'application/x-msdownload', // .exe mimetype
        originalname: 'document.pdf'
      };
      
      fileHandler._fileFilter(req, file, cb);
      
      // Verify file was rejected with appropriate error
      expect(cb).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('Tipo de archivo no permitido')
        }),
        false
      );
    });
    
    it('should reject files with disallowed extensions', () => {
      const cb = jest.fn();
      const file = {
        mimetype: 'application/pdf',
        originalname: 'malicious.exe'
      };
      
      fileHandler._fileFilter(req, file, cb);
      
      // Verify file was rejected with appropriate error
      expect(cb).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('Extensión de archivo no permitida')
        }),
        false
      );
    });
    
    // Test the specific MIME types and extensions listed in the allowed arrays
    it('should validate all MIME types listed in ALLOWED_MIME_TYPES', () => {
      // This test targets lines 62-71 in index.js
      const mimeTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'image/jpeg',
        'image/png',
        'text/plain'
      ];
      
      const extensions = [
        '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.jpg', '.jpeg', '.png', '.txt'
      ];
      
      // Test each MIME type with its corresponding extension
      mimeTypes.forEach((mimeType, index) => {
        // Use matching extension for the MIME type (simplified mapping for testing)
        const extension = extensions[Math.min(index, extensions.length - 1)];
        const cb = jest.fn();
        const file = {
          mimetype: mimeType,
          originalname: `test${extension}`
        };
        
        fileHandler._fileFilter(req, file, cb);
        expect(cb).toHaveBeenCalledWith(null, true);
      });
    });
  });
  
  describe('Error handler', () => {
    it('should handle LIMIT_FILE_SIZE errors', () => {
      const err = new multer.MulterError('LIMIT_FILE_SIZE');
      
      fileHandler.multerErrorHandler(err, req, res, next);
      
      // Verify appropriate error response
      expect(res.status).toHaveBeenCalledWith(413);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        message: expect.stringContaining('tamaño máximo permitido')
      }));
      expect(next).not.toHaveBeenCalled();
    });
    
    it('should handle LIMIT_FILE_COUNT errors', () => {
      const err = new multer.MulterError('LIMIT_FILE_COUNT');
      
      fileHandler.multerErrorHandler(err, req, res, next);
      
      // Verify appropriate error response
      expect(res.status).toHaveBeenCalledWith(413);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        message: expect.stringContaining('No se pueden subir más de')
      }));
      expect(next).not.toHaveBeenCalled();
    });
    
    it('should handle other multer errors', () => {
      const err = new multer.MulterError('SOME_OTHER_ERROR');
      
      fileHandler.multerErrorHandler(err, req, res, next);
      
      // Verify appropriate error response
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        message: expect.stringContaining('Error al subir archivo')
      }));
      expect(next).not.toHaveBeenCalled();
    });
    
    it('should handle general errors', () => {
      const err = new Error('General error message');
      
      fileHandler.multerErrorHandler(err, req, res, next);
      
      // Verify appropriate error response and logging
      expect(logger.error).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        message: 'General error message'
      }));
      expect(next).not.toHaveBeenCalled();
    });
    
    it('should proceed if no error is provided', () => {
      fileHandler.multerErrorHandler(null, req, res, next);
      
      // Verify next is called with no errors
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });
  
  describe('File handler middleware', () => {
    it('should apply upload middleware for attachment routes', () => {
      // Reset and clear mocks to ensure clean state
      jest.clearAllMocks();
      
      // Create a spy for the single method
      const singleSpy = jest.spyOn(mockUpload, 'single');
      
      // Verify the middleware calls the single method
      fileHandler.fileHandlerMiddleware(req, res, next);
      
      // Just check that the single method was called
      expect(singleSpy).toHaveBeenCalledWith('file');
    });
    
    it('should handle upload errors via error handler', () => {
      // Reset and clear mocks
      jest.clearAllMocks();
      
      // Create an error
      const uploadError = new Error('Upload failed');
      
      // Mock res.status and res.json to verify they're called with the error
      res.status = jest.fn().mockReturnThis();
      res.json = jest.fn();
      
      // Configure middleware to trigger error
      mockMiddleware.mockImplementation((req, res, cb) => cb(uploadError));
      
      // Call the middleware
      fileHandler.fileHandlerMiddleware(req, res, next);
      
      // Verify the error is handled
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        message: 'Upload failed'
      }));
    });
    
    it('should proceed normally when upload succeeds', () => {
      // Reset and clear mocks
      jest.clearAllMocks();
      
      // Make middleware call its callback with no errors
      mockMiddleware.mockImplementation((req, res, cb) => cb(null));
      
      // Call the middleware
      fileHandler.fileHandlerMiddleware(req, res, next);
      
      // Verify next was called directly by the middleware's success path
      expect(next).toHaveBeenCalled();
    });
    
    it('should skip upload processing for non-attachment routes', () => {
      // Reset and clear mocks
      jest.clearAllMocks();
      
      // Change path to a route that doesn't handle attachments
      req.path = '/api/users';
      
      // Call the middleware
      fileHandler.fileHandlerMiddleware(req, res, next);
      
      // Verify the middleware bypassed the upload processing
      expect(mockSingle).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalled();
    });
    
    it('should skip upload processing for non-POST methods', () => {
      // Reset and clear mocks
      jest.clearAllMocks();
      
      // Keep attachment path but change method
      req.method = 'GET';
      
      // Call the middleware
      fileHandler.fileHandlerMiddleware(req, res, next);
      
      // Verify the middleware bypassed the upload processing
      expect(mockSingle).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalled();
    });
  });
  
  describe('Module exports', () => {
    it('should export the required functions and middleware', () => {
      // Check that the required functions are exported
      expect(fileHandler.uploadMiddleware).toBeDefined();
      expect(fileHandler.multerErrorHandler).toBeDefined();
      expect(fileHandler.fileHandlerMiddleware).toBeDefined();
      expect(fileHandler._fileFilter).toBeDefined();
    });
  });
}); 