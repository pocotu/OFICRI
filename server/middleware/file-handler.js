/**
 * Middleware de manejo de archivos
 * Implementa la gestión de subida y descarga de archivos con FilePond
 */

const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { logger } = require('../utils/logger');
const ipInfoFinder = require('ip-info-finder');
const { pool } = require('../config/database');

/**
 * Configuración de almacenamiento
 */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, process.env.UPLOAD_DIR || 'uploads');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

/**
 * Filtro de tipos de archivo
 */
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Tipo de archivo no permitido. Solo se permiten archivos JPG, PNG y PDF.'), false);
  }
};

/**
 * Configuración de multer
 */
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  }
});

/**
 * Función para guardar información de IP en la tabla UsuarioLog
 */
const saveIPInfo = async (userId, ipAddress, tipoEvento = 'UPLOAD_FILE', exitoso = true) => {
  try {
    // Obtener información detallada de la IP
    const ipInfo = await ipInfoFinder.getIPInfo(ipAddress);
    
    // Preparar los datos para insertar en la tabla UsuarioLog
    const query = `
      INSERT INTO UsuarioLog (
        IDUsuario, TipoEvento, IPOrigen, 
        IPCountry, IPCountryCode, IPRegion, IPRegionName, 
        IPCity, IPZip, IPLat, IPLon, IPTimezone, 
        IPISP, IPOrg, IPAs, IPHostname, 
        IPIsProxy, IPIsVPN, IPIsTor, DispositivoInfo, Exitoso
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      userId,
      tipoEvento,
      ipAddress,
      ipInfo.country || null,
      ipInfo.countryCode || null,
      ipInfo.region || null,
      ipInfo.regionName || null,
      ipInfo.city || null,
      ipInfo.zip || null,
      ipInfo.lat || null,
      ipInfo.lon || null,
      ipInfo.timezone || null,
      ipInfo.isp || null,
      ipInfo.org || null,
      ipInfo.as || null,
      ipInfo.hostname || null,
      ipInfo.proxy || false,
      ipInfo.vpn || false,
      ipInfo.tor || false,
      'Navegador web', // Esto podría obtenerse del user-agent
      exitoso
    ];

    const [result] = await pool.query(query, params);
    
    logger.info('Información IP guardada en UsuarioLog:', {
      userId,
      ipAddress,
      logId: result.insertId
    });
    
    return result.insertId;
  } catch (error) {
    logger.error('Error al guardar información de IP:', {
      error: error.message,
      ipAddress,
      userId
    });
    return null;
  }
};

/**
 * Middleware para procesar archivos de FilePond
 */
const processFilePond = async (req, res, next) => {
  // FilePond envía archivos como 'filepond' en el campo de formulario
  if (!req.file && req.files && req.files.filepond) {
    req.file = req.files.filepond[0];
  }
  
  // Si hay un usuario autenticado, registrar la información IP
  if (req.user && req.user.id) {
    const ipAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    await saveIPInfo(req.user.id, ipAddress, 'UPLOAD_FILE', true);
  }
  
  next();
};

/**
 * Middleware para validar archivos
 */
const validateFile = async (req, res, next) => {
  if (!req.file) {
    logger.warn('No se ha subido ningún archivo');
    return res.status(400).json({
      error: 'No se ha subido ningún archivo',
      timestamp: new Date().toISOString()
    });
  }

  // Verificar tamaño
  if (req.file.size > 5 * 1024 * 1024) {
    logger.warn('Archivo demasiado grande:', {
      filename: req.file.originalname,
      size: req.file.size
    });
    
    // Registrar evento fallido de carga en UsuarioLog si hay usuario
    if (req.user && req.user.id) {
      const ipAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
      await saveIPInfo(req.user.id, ipAddress, 'FILE_SIZE_ERROR', false);
    }
    
    return res.status(400).json({
      error: 'El archivo excede el tamaño máximo permitido (5MB)',
      timestamp: new Date().toISOString()
    });
  }

  // Verificar tipo
  const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
  if (!allowedTypes.includes(req.file.mimetype)) {
    logger.warn('Tipo de archivo no permitido:', {
      filename: req.file.originalname,
      mimetype: req.file.mimetype
    });
    
    // Registrar evento fallido de carga en UsuarioLog si hay usuario
    if (req.user && req.user.id) {
      const ipAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
      await saveIPInfo(req.user.id, ipAddress, 'FILE_TYPE_ERROR', false);
    }
    
    return res.status(400).json({
      error: 'Tipo de archivo no permitido. Solo se permiten archivos JPG, PNG y PDF.',
      timestamp: new Date().toISOString()
    });
  }

  logger.info('Archivo validado correctamente:', {
    filename: req.file.originalname,
    size: req.file.size,
    mimetype: req.file.mimetype
  });

  next();
};

/**
 * Middleware para eliminar archivos
 */
const deleteFile = async (req, res, next) => {
  try {
    const filePath = req.params.filePath;
    await fs.unlink(filePath);
    
    // Registrar evento de eliminación en UsuarioLog si hay usuario
    if (req.user && req.user.id) {
      const ipAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
      await saveIPInfo(req.user.id, ipAddress, 'DELETE_FILE', true);
    }
    
    logger.info('Archivo eliminado:', {
      path: filePath,
      timestamp: new Date().toISOString()
    });

    next();
  } catch (error) {
    logger.error('Error al eliminar archivo:', {
      error: error.message,
      path: req.params.filePath,
      timestamp: new Date().toISOString()
    });
    
    // Registrar evento fallido en UsuarioLog si hay usuario
    if (req.user && req.user.id) {
      const ipAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
      await saveIPInfo(req.user.id, ipAddress, 'DELETE_FILE_ERROR', false);
    }
    
    next(error);
  }
};

/**
 * Middleware para mover archivos
 */
const moveFile = async (req, res, next) => {
  try {
    const { sourcePath, destinationPath } = req.body;
    
    // Verificar que el archivo existe
    await fs.access(sourcePath);
    
    // Crear directorio de destino si no existe
    await fs.mkdir(path.dirname(destinationPath), { recursive: true });
    
    // Mover archivo
    await fs.rename(sourcePath, destinationPath);
    
    // Registrar evento de movimiento en UsuarioLog si hay usuario
    if (req.user && req.user.id) {
      const ipAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
      await saveIPInfo(req.user.id, ipAddress, 'MOVE_FILE', true);
    }
    
    logger.info('Archivo movido:', {
      from: sourcePath,
      to: destinationPath,
      timestamp: new Date().toISOString()
    });

    next();
  } catch (error) {
    logger.error('Error al mover archivo:', {
      error: error.message,
      source: req.body.sourcePath,
      destination: req.body.destinationPath,
      timestamp: new Date().toISOString()
    });
    
    // Registrar evento fallido en UsuarioLog si hay usuario
    if (req.user && req.user.id) {
      const ipAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
      await saveIPInfo(req.user.id, ipAddress, 'MOVE_FILE_ERROR', false);
    }
    
    next(error);
  }
};

/**
 * Middleware para copiar archivos
 */
const copyFile = async (req, res, next) => {
  try {
    const { sourcePath, destinationPath } = req.body;
    
    // Verificar que el archivo existe
    await fs.access(sourcePath);
    
    // Crear directorio de destino si no existe
    await fs.mkdir(path.dirname(destinationPath), { recursive: true });
    
    // Copiar archivo
    await fs.copyFile(sourcePath, destinationPath);
    
    // Registrar evento de copia en UsuarioLog si hay usuario
    if (req.user && req.user.id) {
      const ipAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
      await saveIPInfo(req.user.id, ipAddress, 'COPY_FILE', true);
    }
    
    logger.info('Archivo copiado:', {
      from: sourcePath,
      to: destinationPath,
      timestamp: new Date().toISOString()
    });

    next();
  } catch (error) {
    logger.error('Error al copiar archivo:', {
      error: error.message,
      source: req.body.sourcePath,
      destination: req.body.destinationPath,
      timestamp: new Date().toISOString()
    });
    
    // Registrar evento fallido en UsuarioLog si hay usuario
    if (req.user && req.user.id) {
      const ipAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
      await saveIPInfo(req.user.id, ipAddress, 'COPY_FILE_ERROR', false);
    }
    
    next(error);
  }
};

/**
 * Middleware para verificar existencia de archivo
 */
const checkFileExists = async (req, res, next) => {
  try {
    const { filepath } = req.params;

    if (!filepath) {
      return res.status(400).json({
        error: 'Ruta de archivo no especificada',
        timestamp: new Date().toISOString()
      });
    }

    const fullPath = path.join(__dirname, '../../uploads', filepath);

    await fs.access(fullPath);

    next();
  } catch (error) {
    logger.error('Archivo no encontrado:', {
      filepath: req.params.filepath,
      timestamp: new Date().toISOString()
    });
    res.status(404).json({
      error: 'Archivo no encontrado',
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Middleware específico para procesar cargas de FilePond
 */
const handleFilePondUpload = (req, res, next) => {
  upload.single('filepond')(req, res, async (err) => {
    if (err instanceof multer.MulterError) {
      logger.error('Error de Multer con FilePond:', err);
      
      // Registrar evento fallido en UsuarioLog si hay usuario
      if (req.user && req.user.id) {
        const ipAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
        await saveIPInfo(req.user.id, ipAddress, 'FILEPOND_UPLOAD_ERROR', false);
      }
      
      return res.status(400).json({
        error: {
          message: 'Error al subir archivo',
          details: err.message
        }
      });
    } else if (err) {
      logger.error('Error al manejar archivo con FilePond:', err);
      
      // Registrar evento fallido en UsuarioLog si hay usuario
      if (req.user && req.user.id) {
        const ipAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
        await saveIPInfo(req.user.id, ipAddress, 'FILEPOND_UPLOAD_ERROR', false);
      }
      
      return res.status(500).json({
        error: {
          message: 'Error al procesar archivo',
          details: err.message
        }
      });
    }
    
    // FilePond espera un ID en texto plano como respuesta
    if (req.file) {
      // Registrar información IP
      if (req.user && req.user.id) {
        const ipAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
        await saveIPInfo(req.user.id, ipAddress, 'FILEPOND_UPLOAD_SUCCESS', true);
      }
      
      // Responder con el ID del archivo (nombre)
      return res.send(req.file.filename);
    }
    
    next();
  });
};

// Middleware de manejo de archivos
const fileHandlerMiddleware = (req, res, next) => {
  // Solo procesar rutas que manejan archivos
  if (!req.path.includes('/upload')) {
    return next();
  }

  // Detectar si es una solicitud de FilePond
  const isFilePond = req.headers['x-filepond'] === '1' || 
                     req.path.includes('/filepond');
  
  if (isFilePond) {
    return handleFilePondUpload(req, res, next);
  }

  upload.single('file')(req, res, async (err) => {
    if (err instanceof multer.MulterError) {
      logger.error('Error de Multer:', err);
      
      // Registrar evento fallido en UsuarioLog si hay usuario
      if (req.user && req.user.id) {
        const ipAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
        await saveIPInfo(req.user.id, ipAddress, 'UPLOAD_ERROR', false);
      }
      
      return res.status(400).json({
        error: {
          message: 'Error al subir archivo',
          details: err.message
        }
      });
    } else if (err) {
      logger.error('Error al manejar archivo:', err);
      
      // Registrar evento fallido en UsuarioLog si hay usuario
      if (req.user && req.user.id) {
        const ipAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
        await saveIPInfo(req.user.id, ipAddress, 'UPLOAD_ERROR', false);
      }
      
      return res.status(500).json({
        error: {
          message: 'Error al procesar archivo',
          details: err.message
        }
      });
    }
    
    // Si hay un usuario autenticado, registrar la información IP
    if (req.file && req.user && req.user.id) {
      const ipAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
      await saveIPInfo(req.user.id, ipAddress, 'UPLOAD_SUCCESS', true);
    }
    
    next();
  });
};

module.exports = {
  upload,
  validateFile,
  deleteFile,
  moveFile,
  copyFile,
  checkFileExists,
  fileHandlerMiddleware,
  processFilePond,
  handleFilePondUpload
}; 