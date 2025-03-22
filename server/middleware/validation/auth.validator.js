/**
 * Authentication validators
 * Input validation for authentication-related routes
 */

const { body } = require('express-validator');
const Joi = require('joi');

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

// Esquema para validación de login
const loginSchema = Joi.object({
  codigoCIP: Joi.string().min(3).max(20).required()
    .messages({
      'string.empty': 'El CIP es obligatorio',
      'string.min': 'El CIP debe tener al menos {#limit} caracteres',
      'string.max': 'El CIP no debe exceder {#limit} caracteres',
      'any.required': 'El CIP es obligatorio'
    }),
  password: Joi.string().min(8).required()
    .messages({
      'string.empty': 'La contraseña es obligatoria',
      'string.min': 'La contraseña debe tener al menos {#limit} caracteres',
      'any.required': 'La contraseña es obligatoria'
    })
});

// Esquema para solicitud de reset de contraseña (solo admin)
const resetRequestSchema = Joi.object({
  codigoCIP: Joi.string().min(3).max(20).required()
    .messages({
      'string.empty': 'El CIP del usuario es obligatorio',
      'string.min': 'El CIP debe tener al menos {#limit} caracteres',
      'string.max': 'El CIP no debe exceder {#limit} caracteres',
      'any.required': 'El CIP del usuario es obligatorio'
    })
});

// Esquema para reset de contraseña con token (solo admin)
const resetPasswordSchema = Joi.object({
  token: Joi.string().required()
    .messages({
      'string.empty': 'El token es obligatorio',
      'any.required': 'El token es obligatorio'
    }),
  password: Joi.string().min(8).required()
    .messages({
      'string.empty': 'La nueva contraseña es obligatoria',
      'string.min': 'La nueva contraseña debe tener al menos {#limit} caracteres',
      'any.required': 'La nueva contraseña es obligatoria'
    }),
  idUsuario: Joi.number().integer().positive().required()
    .messages({
      'number.base': 'El ID de usuario debe ser un número',
      'number.integer': 'El ID de usuario debe ser un número entero',
      'number.positive': 'El ID de usuario debe ser positivo',
      'any.required': 'El ID de usuario es obligatorio'
    })
});

// Esquema para cambio de contraseña (solo admin)
const cambioPasswordSchema = Joi.object({
  idUsuario: Joi.number().integer().positive().required()
    .messages({
      'number.base': 'El ID de usuario debe ser un número',
      'number.integer': 'El ID de usuario debe ser un número entero',
      'number.positive': 'El ID de usuario debe ser positivo',
      'any.required': 'El ID de usuario es obligatorio'
    }),
  newPassword: Joi.string().min(8).required()
    .messages({
      'string.empty': 'La nueva contraseña es obligatoria',
      'string.min': 'La nueva contraseña debe tener al menos {#limit} caracteres',
      'any.required': 'La nueva contraseña es obligatoria'
    })
});

module.exports = {
  loginValidator,
  loginSchema,
  resetRequestSchema,
  resetPasswordSchema,
  cambioPasswordSchema
}; 