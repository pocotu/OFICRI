/**
 * Authentication validators
 * Input validation for authentication-related routes
 */

const { body } = require('express-validator');

// Login validation
const loginValidator = [
  body('codigoCIP')
    .notEmpty().withMessage('El código CIP es obligatorio')
    .isLength({ min: 3, max: 50 }).withMessage('El código CIP debe tener entre 3 y 50 caracteres')
    .trim(),
  
  body('password')
    .notEmpty().withMessage('La contraseña es obligatoria')
    .isLength({ min: 8 }).withMessage('La contraseña debe tener al menos 8 caracteres')
];

module.exports = {
  loginValidator
}; 