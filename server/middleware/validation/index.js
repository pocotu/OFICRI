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

module.exports = {
  validate
}; 