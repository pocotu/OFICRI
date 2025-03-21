/**
 * File Handler Middleware
 * Handles file uploads securely with validation
 * ISO/IEC 27001 compliant implementation
 */

const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { logger } = require('../../utils/logger');

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(process.cwd(), 'uploads');
const documentsDir = path.join(uploadsDir, 'documents');

// Ensure upload directories exist
[uploadsDir, documentsDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    logger.info(`Created upload directory: ${dir}`);
  }
});

// Define file size limits (in bytes)
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_FILES_PER_REQUEST = 5;

// Allowed file types (MIME types)
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'image/jpeg',
  'image/png',
  'text/plain'
];

// Allowed file extensions (corresponding to MIME types)
const ALLOWED_FILE_EXTENSIONS = [
  '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.jpg', '.jpeg', '.png', '.txt'
];

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Get the document ID from the request parameters
    const documentId = req.params.id;
    
    // Create a directory for this document if it doesn't exist
    const documentDir = path.join(documentsDir, `doc-${documentId}`);
    if (!fs.existsSync(documentDir)) {
      fs.mkdirSync(documentDir, { recursive: true });
    }
    
    cb(null, documentDir);
  },
  filename: (req, file, cb) => {
    // Generate a secure random filename to prevent path traversal attacks
    const randomString = crypto.randomBytes(16).toString('hex');
    const fileExtension = path.extname(file.originalname).toLowerCase();
    
    // Store original filename in the file object for later reference
    file.originalFilename = file.originalname;
    
    // Format: timestamp-randomhash-originalname.ext
    const secureFilename = `${Date.now()}-${randomString}${fileExtension}`;
    
    cb(null, secureFilename);
  }
});

// File filter function
const fileFilter = (req, file, cb) => {
  // Check MIME type
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    return cb(new Error(`Tipo de archivo no permitido. Tipos permitidos: ${ALLOWED_FILE_EXTENSIONS.join(', ')}`), false);
  }
  
  // Check file extension
  const fileExtension = path.extname(file.originalname).toLowerCase();
  if (!ALLOWED_FILE_EXTENSIONS.includes(fileExtension)) {
    return cb(new Error(`Extensión de archivo no permitida. Extensiones permitidas: ${ALLOWED_FILE_EXTENSIONS.join(', ')}`), false);
  }
  
  // File is valid
  cb(null, true);
};

// Create multer upload middleware
const uploadMiddleware = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: MAX_FILES_PER_REQUEST
  }
});

// Error handler for multer
const multerErrorHandler = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    // A Multer error occurred when uploading
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({
        success: false,
        message: `El archivo excede el tamaño máximo permitido de ${MAX_FILE_SIZE / (1024 * 1024)}MB`
      });
    }
    
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(413).json({
        success: false,
        message: `No se pueden subir más de ${MAX_FILES_PER_REQUEST} archivos a la vez`
      });
    }
    
    return res.status(400).json({
      success: false,
      message: `Error al subir archivo: ${err.message}`
    });
  }
  
  if (err) {
    // Some other error occurred
    logger.error('Error en el manejo de archivos', { error: err.message });
    
    return res.status(400).json({
      success: false,
      message: err.message || 'Error al procesar el archivo'
    });
  }
  
  // No error, continue
  next();
};

// Main file handler middleware - includes error handling
const fileHandlerMiddleware = (req, res, next) => {
  // Only apply this middleware to routes that handle file uploads
  if (req.path.includes('/attachments') && req.method === 'POST') {
    // This will be caught by the error handler above
    return uploadMiddleware.single('file')(req, res, err => {
      if (err) {
        multerErrorHandler(err, req, res, next);
      } else {
        next();
      }
    });
  }
  
  // For all other routes, just continue
  next();
};

module.exports = {
  uploadMiddleware,
  multerErrorHandler,
  fileHandlerMiddleware
}; 