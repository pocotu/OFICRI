/**
 * Validation middleware
 * Centralizes request validation logic using express-validator
 */

const { validationResult } = require('express-validator');

/**
 * Middleware to check validation results
 * @param {Array} validations - Array of express-validator validation chains
 * @returns {Function} Middleware function
 */
const validate = (validations) => {
  return async (req, res, next) => {
    // Run all validations
    for (let validation of validations) {
      const result = await validation.run(req);
    }

    // Check if there are validation errors
    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    // Return validation errors
    return res.status(400).json({
      success: false,
      message: 'Error de validación de datos',
      errors: errors.array()
    });
  };
};

/**
 * Middleware para validar solicitudes usando esquemas Joi
 * @param {Object} schema - Esquema Joi para validar la solicitud
 * @returns {Function} Middleware function
 */
const validateSchema = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, { 
      abortEarly: false,
      stripUnknown: true 
    });
    
    if (error) {
      const errorMessages = error.details.map(detail => ({
        message: detail.message,
        path: detail.path
      }));
      
      return res.status(400).json({
        success: false,
        message: 'Error de validación de datos',
        errors: errorMessages
      });
    }
    
    // Actualizar req.body con los datos validados
    req.body = value;
    return next();
  };
};

module.exports = {
  validate,
  validateSchema
}; 