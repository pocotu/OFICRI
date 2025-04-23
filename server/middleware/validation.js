/**
 * Middleware para la validación de datos de entrada
 * Utiliza express-validator para validar y sanitizar datos de entrada
 * ISO/IEC 27001 compliant
 */

const { validationResult, matchedData } = require('express-validator');
const { logSecurityEvent } = require('../utils/logger/index');

/**
 * Middleware para validar datos de entrada según reglas especificadas
 * @param {Object} req - Objeto de solicitud de Express
 * @param {Object} res - Objeto de respuesta de Express
 * @param {Function} next - Función para pasar al siguiente middleware
 */
exports.validateInput = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    // Registrar intento de envío de datos inválidos
    logSecurityEvent('SECURITY_INVALID_INPUT', 'Datos de entrada inválidos', {
      endpoint: req.originalUrl,
      method: req.method,
      errors: errors.array(),
      ip: req.ip,
      user: req.user ? req.user.id : 'unauthenticated'
    });
    
    return res.status(422).json({
      success: false,
      message: 'Error de validación de datos',
      errors: errors.array()
    });
  }
  
  // Si llegamos aquí, todos los datos son válidos
  // Opcional: podemos extraer solo los datos validados con matchedData
  req.validatedData = matchedData(req);
  next();
};

/**
 * Middleware para sanitizar datos antes de procesarlos
 * @param {Object} req - Objeto de solicitud de Express
 * @param {Object} res - Objeto de respuesta de Express
 * @param {Function} next - Función para pasar al siguiente middleware
 */
exports.sanitizeInput = (req, res, next) => {
  // Implementación básica: simplemente eliminamos campos no esperados
  if (req.body && typeof req.body === 'object') {
    const allowedFields = req.allowedFields || [];
    const sanitizedBody = {};
    
    if (allowedFields.length > 0) {
      // Solo conservar campos permitidos
      for (const field of allowedFields) {
        if (req.body[field] !== undefined) {
          sanitizedBody[field] = req.body[field];
        }
      }
      req.body = sanitizedBody;
    }
  }
  
  next();
};

/**
 * Middleware para establecer campos permitidos en el body
 * @param {string[]} fields - Lista de campos permitidos
 * @returns {Function} Middleware
 */
exports.allowFields = (fields) => {
  return (req, res, next) => {
    req.allowedFields = fields;
    next();
  };
};

/**
 * Middleware para validar que ciertos campos sean requeridos
 * @param {string[]} requiredFields - Lista de campos requeridos
 * @returns {Function} Middleware
 */
exports.requireFields = (requiredFields) => {
  return (req, res, next) => {
    if (!req.body || typeof req.body !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'Se requiere un cuerpo de solicitud válido',
        errors: [{ msg: 'Body de solicitud inválido' }]
      });
    }
    
    const missingFields = [];
    
    for (const field of requiredFields) {
      if (req.body[field] === undefined || req.body[field] === null || req.body[field] === '') {
        missingFields.push(field);
      }
    }
    
    if (missingFields.length > 0) {
      // Registrar intento de envío de datos incompletos
      logSecurityEvent('SECURITY_MISSING_FIELDS', 'Campos requeridos faltantes', {
        endpoint: req.originalUrl,
        method: req.method,
        missingFields,
        ip: req.ip,
        user: req.user ? req.user.id : 'unauthenticated'
      });
      
      return res.status(422).json({
        success: false,
        message: 'Campos requeridos faltantes',
        errors: missingFields.map(field => ({ 
          param: field, 
          msg: `El campo ${field} es requerido`
        }))
      });
    }
    
    next();
  };
};

/**
 * Validación de tipos de datos básicos
 * @param {Object} schema - Esquema de validación con formato { campo: tipo }
 * @returns {Function} Middleware
 */
exports.validateSchema = (schema) => {
  return (req, res, next) => {
    if (!req.body || typeof req.body !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'Se requiere un cuerpo de solicitud válido',
        errors: [{ msg: 'Body de solicitud inválido' }]
      });
    }
    
    const errors = [];
    
    for (const [field, type] of Object.entries(schema)) {
      if (req.body[field] !== undefined) {
        // Solo validar campos presentes
        let valid = false;
        
        switch (type) {
          case 'string':
            valid = typeof req.body[field] === 'string';
            break;
          case 'number':
            valid = typeof req.body[field] === 'number' || 
                  (typeof req.body[field] === 'string' && !isNaN(Number(req.body[field])));
            // Convertir string a número si es válido
            if (valid && typeof req.body[field] === 'string') {
              req.body[field] = Number(req.body[field]);
            }
            break;
          case 'boolean':
            valid = typeof req.body[field] === 'boolean' ||
                   req.body[field] === 'true' ||
                   req.body[field] === 'false' ||
                   req.body[field] === '1' ||
                   req.body[field] === '0';
            // Convertir a boolean si es válido
            if (valid && typeof req.body[field] !== 'boolean') {
              req.body[field] = req.body[field] === 'true' || req.body[field] === '1';
            }
            break;
          case 'date':
            valid = req.body[field] instanceof Date ||
                  !isNaN(Date.parse(req.body[field]));
            break;
          case 'array':
            valid = Array.isArray(req.body[field]) ||
                  (typeof req.body[field] === 'string' && req.body[field].startsWith('[') && req.body[field].endsWith(']'));
            // Intentar convertir string a array si es válido
            if (valid && typeof req.body[field] === 'string') {
              try {
                req.body[field] = JSON.parse(req.body[field]);
              } catch (e) {
                valid = false;
              }
            }
            break;
          case 'object':
            valid = typeof req.body[field] === 'object' && req.body[field] !== null && !Array.isArray(req.body[field]) ||
                  (typeof req.body[field] === 'string' && req.body[field].startsWith('{') && req.body[field].endsWith('}'));
            // Intentar convertir string a objeto si es válido
            if (valid && typeof req.body[field] === 'string') {
              try {
                req.body[field] = JSON.parse(req.body[field]);
              } catch (e) {
                valid = false;
              }
            }
            break;
          default:
            // Si el tipo no está soportado, se considera válido
            valid = true;
        }
        
        if (!valid) {
          errors.push({
            param: field,
            msg: `El campo ${field} debe ser de tipo ${type}`,
            value: req.body[field]
          });
        }
      }
    }
    
    if (errors.length > 0) {
      // Registrar intento de envío de datos con tipos inválidos
      logSecurityEvent('SECURITY_INVALID_DATA_TYPES', 'Tipos de datos inválidos', {
        endpoint: req.originalUrl,
        method: req.method,
        errors,
        ip: req.ip,
        user: req.user ? req.user.id : 'unauthenticated'
      });
      
      return res.status(422).json({
        success: false,
        message: 'Tipos de datos inválidos',
        errors
      });
    }
    
    next();
  };
};

/**
 * Middleware para validar y sanitizar IDs
 * @param {string} paramName - Nombre del parámetro que contiene el ID
 * @param {string} [location='params'] - Ubicación del parámetro ('params', 'query', 'body')
 * @returns {Function} Middleware
 */
exports.validateId = (paramName, location = 'params') => {
  return (req, res, next) => {
    const id = req[location][paramName];
    
    if (!id) {
      return res.status(400).json({
        success: false,
        message: `El parámetro ${paramName} es requerido`,
        errors: [{ param: paramName, msg: `El parámetro ${paramName} es requerido` }]
      });
    }
    
    // Validar que sea un número entero positivo
    const numericId = Number(id);
    
    if (isNaN(numericId) || numericId <= 0 || !Number.isInteger(numericId)) {
      // Registrar intento de envío de ID inválido
      logSecurityEvent('SECURITY_INVALID_ID', `ID inválido para ${paramName}`, {
        endpoint: req.originalUrl,
        method: req.method,
        param: paramName,
        value: id,
        ip: req.ip,
        user: req.user ? req.user.id : 'unauthenticated'
      });
      
      return res.status(422).json({
        success: false,
        message: `El valor de ${paramName} no es un ID válido`,
        errors: [{ param: paramName, msg: `Debe ser un número entero positivo`, value: id }]
      });
    }
    
    // Convertir el ID a número y continuar
    req[location][paramName] = numericId;
    next();
  };
}; 