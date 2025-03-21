/**
 * Middleware de validación de datos de entrada
 * Implementa validación de datos usando Joi
 */

const Joi = require('joi');
const { logger } = require('../utils/logger');

/**
 * Esquemas de validación comunes
 */
const commonSchemas = {
  // Esquema para paginación
  pagination: Joi.object({
    page: Joi.number().min(1).default(1),
    limit: Joi.number().min(1).max(100).default(10),
    sortBy: Joi.string(),
    sortOrder: Joi.string().valid('asc', 'desc').default('asc')
  }),

  // Esquema para búsqueda
  search: Joi.object({
    query: Joi.string().min(1).required(),
    filters: Joi.object().default({}),
    page: Joi.number().min(1).default(1),
    limit: Joi.number().min(1).max(100).default(10)
  }),

  // Esquema para ID
  id: Joi.object({
    id: Joi.number().integer().positive().required()
  }),

  // Esquema para fechas
  dateRange: Joi.object({
    startDate: Joi.date().iso().required(),
    endDate: Joi.date().iso().min(Joi.ref('startDate')).required()
  }),

  // Esquema para usuario
  user: Joi.object({
    username: Joi.string().min(3).max(50).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(8).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/).required(),
    role: Joi.string().valid('ADMIN', 'MANAGER', 'SUPERVISOR', 'USER', 'GUEST').required(),
    isActive: Joi.boolean().default(true)
  }),

  // Esquema para documento
  document: Joi.object({
    title: Joi.string().min(1).max(200).required(),
    description: Joi.string().max(1000),
    type: Joi.string().valid('INTERNAL', 'EXTERNAL').required(),
    priority: Joi.string().valid('LOW', 'MEDIUM', 'HIGH', 'URGENT').required(),
    areaId: Joi.number().integer().positive().required(),
    assignedTo: Joi.number().integer().positive(),
    dueDate: Joi.date().iso().min('now'),
    tags: Joi.array().items(Joi.string()),
    attachments: Joi.array().items(Joi.object({
      name: Joi.string().required(),
      type: Joi.string().required(),
      size: Joi.number().max(5 * 1024 * 1024).required() // 5MB
    }))
  }),

  // Esquema para área
  area: Joi.object({
    name: Joi.string().min(1).max(100).required(),
    code: Joi.string().min(1).max(20).required(),
    description: Joi.string().max(500),
    isActive: Joi.boolean().default(true)
  }),

  // Esquema para rol
  role: Joi.object({
    name: Joi.string().min(1).max(50).required(),
    code: Joi.string().min(1).max(20).required(),
    description: Joi.string().max(200),
    permissions: Joi.array().items(Joi.string()),
    isActive: Joi.boolean().default(true)
  })
};

/**
 * Middleware para validar datos de entrada
 * @param {Object} schema - Esquema de validación Joi
 * @param {string} property - Propiedad del request a validar ('body', 'query', 'params')
 * @returns {Function} Middleware de validación
 */
const validateInput = (schema, property = 'body') => {
  return (req, res, next) => {
    try {
      const { error } = schema.validate(req[property], {
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
          path: req.path,
          method: req.method,
          property,
          ip: req.ip,
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
      logger.error('Error en middleware de validación:', {
        error: error.message,
        path: req.path,
        method: req.method,
        property,
        ip: req.ip,
        timestamp: new Date().toISOString()
      });

      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  };
};

/**
 * Middleware para sanitizar datos de entrada
 */
const sanitizeInput = (req, res, next) => {
  try {
    // Sanitizar query parameters
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
      ip: req.ip,
      timestamp: new Date().toISOString()
    });

    next();
  }
};

/**
 * Middleware para validar tipos de archivo
 */
const validateFileType = (allowedTypes) => {
  return (req, res, next) => {
    try {
      if (!req.file) {
        return next();
      }

      if (!allowedTypes.includes(req.file.mimetype)) {
        logger.warn('Tipo de archivo no permitido:', {
          type: req.file.mimetype,
          allowedTypes,
          path: req.path,
          method: req.method,
          ip: req.ip,
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
        ip: req.ip,
        timestamp: new Date().toISOString()
      });

      next();
    }
  };
};

module.exports = {
  commonSchemas,
  validateInput,
  sanitizeInput,
  validateFileType
}; 