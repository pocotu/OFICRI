/**
 * Middleware de validación de datos
 * Implementa validación de datos de entrada usando Joi
 */

const Joi = require('joi');
const { logger } = require('../utils/logger');

/**
 * Esquemas de validación comunes
 */
const schemas = {
  // Esquema de paginación
  pagination: Joi.object({
    page: Joi.number().min(1).default(1),
    limit: Joi.number().min(1).max(100).default(10),
    sortBy: Joi.string(),
    sortOrder: Joi.string().valid('asc', 'desc').default('asc')
  }),

  // Esquema de búsqueda
  search: Joi.object({
    query: Joi.string().min(2).max(100),
    filters: Joi.object(),
    page: Joi.number().min(1).default(1),
    limit: Joi.number().min(1).max(100).default(10)
  }),

  // Esquema de ID
  id: Joi.object({
    id: Joi.number().integer().positive().required()
  }),

  // Esquema de rango de fechas
  dateRange: Joi.object({
    startDate: Joi.date().iso().required(),
    endDate: Joi.date().iso().min(Joi.ref('startDate')).required()
  }),

  // Esquema de usuario
  user: Joi.object({
    username: Joi.string().min(3).max(50).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).max(100).required(),
    role: Joi.string().valid('ADMIN', 'USER', 'MANAGER').default('USER'),
    isActive: Joi.boolean().default(true)
  }),

  // Esquema de documento
  document: Joi.object({
    title: Joi.string().min(3).max(200).required(),
    description: Joi.string().max(1000),
    type: Joi.string().valid('PDF', 'DOC', 'DOCX', 'IMAGE').required(),
    areaId: Joi.number().integer().positive().required(),
    status: Joi.string().valid('DRAFT', 'PENDING', 'APPROVED', 'REJECTED').default('DRAFT')
  }),

  // Esquema de área
  area: Joi.object({
    name: Joi.string().min(3).max(100).required(),
    code: Joi.string().min(2).max(10).required(),
    description: Joi.string().max(500),
    isActive: Joi.boolean().default(true)
  }),

  // Esquema de rol
  role: Joi.object({
    name: Joi.string().min(3).max(50).required(),
    code: Joi.string().min(2).max(20).required(),
    description: Joi.string().max(500),
    permissions: Joi.array().items(Joi.string()),
    isActive: Joi.boolean().default(true)
  })
};

/**
 * Middleware para validar datos
 */
const validateData = (schema, source = 'body') => {
  return (req, res, next) => {
    try {
      const { error } = schema.validate(req[source], {
        abortEarly: false,
        allowUnknown: true,
        stripUnknown: true
      });

      if (error) {
        const errors = error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }));

        logger.warn('Error de validación:', {
          errors,
          source,
          path: req.path,
          method: req.method,
          timestamp: new Date().toISOString()
        });

        return res.status(400).json({
          success: false,
          message: 'Error de validación',
          errors
        });
      }

      next();
    } catch (error) {
      logger.error('Error en validación:', {
        error: error.message,
        source,
        path: req.path,
        method: req.method,
        timestamp: new Date().toISOString()
      });

      res.status(500).json({
        success: false,
        message: 'Error al validar datos'
      });
    }
  };
};

/**
 * Middleware para sanitizar datos
 */
const sanitizeData = (req, res, next) => {
  try {
    // Sanitizar query params
    if (req.query) {
      Object.keys(req.query).forEach(key => {
        if (typeof req.query[key] === 'string') {
          req.query[key] = req.query[key].trim();
        }
      });
    }

    // Sanitizar body
    if (req.body) {
      Object.keys(req.body).forEach(key => {
        if (typeof req.body[key] === 'string') {
          req.body[key] = req.body[key].trim();
        }
      });
    }

    // Sanitizar params
    if (req.params) {
      Object.keys(req.params).forEach(key => {
        if (typeof req.params[key] === 'string') {
          req.params[key] = req.params[key].trim();
        }
      });
    }

    next();
  } catch (error) {
    logger.error('Error al sanitizar datos:', {
      error: error.message,
      path: req.path,
      method: req.method,
      timestamp: new Date().toISOString()
    });

    next();
  }
};

/**
 * Middleware para validar tipo de archivo
 */
const validateFileType = (allowedTypes) => {
  return (req, res, next) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No se ha proporcionado ningún archivo'
        });
      }

      if (!allowedTypes.includes(req.file.mimetype)) {
        logger.warn('Tipo de archivo no permitido:', {
          mimetype: req.file.mimetype,
          allowedTypes,
          path: req.path,
          method: req.method,
          timestamp: new Date().toISOString()
        });

        return res.status(400).json({
          success: false,
          message: 'Tipo de archivo no permitido'
        });
      }

      next();
    } catch (error) {
      logger.error('Error al validar tipo de archivo:', {
        error: error.message,
        path: req.path,
        method: req.method,
        timestamp: new Date().toISOString()
      });

      res.status(500).json({
        success: false,
        message: 'Error al validar tipo de archivo'
      });
    }
  };
};

// Middleware de validación básico
const validatorMiddleware = (req, res, next) => {
  // Validar que el body sea un objeto si es POST, PUT o PATCH
  if (['POST', 'PUT', 'PATCH'].includes(req.method) && !req.is('application/json')) {
    return res.status(400).json({
      error: {
        message: 'Content-Type debe ser application/json'
      }
    });
  }

  next();
};

module.exports = {
  schemas,
  validateData,
  sanitizeData,
  validateFileType,
  validatorMiddleware
}; 