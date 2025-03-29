/**
 * User Validator
 * Implementa validación para operaciones relacionadas con usuarios
 * ISO/IEC 27001 compliant
 */

const Joi = require('joi');

// Esquema para crear usuarios
const userCreateSchema = Joi.object({
  Nombres: Joi.string().min(2).max(100).required()
    .messages({
      'string.base': 'Los nombres deben ser texto',
      'string.empty': 'Los nombres son obligatorios',
      'string.min': 'Los nombres deben tener al menos 2 caracteres',
      'string.max': 'Los nombres no deben exceder los 100 caracteres',
      'any.required': 'Los nombres son obligatorios'
    }),
  Apellidos: Joi.string().min(2).max(100).required()
    .messages({
      'string.base': 'Los apellidos deben ser texto',
      'string.empty': 'Los apellidos son obligatorios',
      'string.min': 'Los apellidos deben tener al menos 2 caracteres',
      'string.max': 'Los apellidos no deben exceder los 100 caracteres',
      'any.required': 'Los apellidos son obligatorios'
    }),
  CodigoCIP: Joi.string().min(3).max(20).required()
    .messages({
      'string.base': 'El código CIP debe ser texto',
      'string.empty': 'El código CIP es obligatorio',
      'string.min': 'El código CIP debe tener al menos 3 caracteres',
      'string.max': 'El código CIP no debe exceder los 20 caracteres',
      'any.required': 'El código CIP es obligatorio'
    }),
  Grado: Joi.string().min(2).max(50).required()
    .messages({
      'string.base': 'El grado debe ser texto',
      'string.empty': 'El grado es obligatorio',
      'string.min': 'El grado debe tener al menos 2 caracteres',
      'string.max': 'El grado no debe exceder los 50 caracteres',
      'any.required': 'El grado es obligatorio'
    }),
  password: Joi.string().min(8).required()
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).*$/)
    .messages({
      'string.base': 'La contraseña debe ser texto',
      'string.empty': 'La contraseña es obligatoria',
      'string.min': 'La contraseña debe tener al menos 8 caracteres',
      'string.pattern.base': 'La contraseña debe contener al menos una letra mayúscula, una minúscula y un número',
      'any.required': 'La contraseña es obligatoria'
    }),
  IDRol: Joi.number().integer().positive().required()
    .messages({
      'number.base': 'El ID de rol debe ser un número',
      'number.integer': 'El ID de rol debe ser un entero',
      'number.positive': 'El ID de rol debe ser positivo',
      'any.required': 'El ID de rol es obligatorio'
    }),
  IDArea: Joi.number().integer().positive().required()
    .messages({
      'number.base': 'El ID de área debe ser un número',
      'number.integer': 'El ID de área debe ser un entero',
      'number.positive': 'El ID de área debe ser positivo',
      'any.required': 'El ID de área es obligatorio'
    })
});

// Esquema para actualizar usuarios
const userUpdateSchema = Joi.object({
  Nombres: Joi.string().min(2).max(100)
    .messages({
      'string.base': 'Los nombres deben ser texto',
      'string.min': 'Los nombres deben tener al menos 2 caracteres',
      'string.max': 'Los nombres no deben exceder los 100 caracteres'
    }),
  Apellidos: Joi.string().min(2).max(100)
    .messages({
      'string.base': 'Los apellidos deben ser texto',
      'string.min': 'Los apellidos deben tener al menos 2 caracteres',
      'string.max': 'Los apellidos no deben exceder los 100 caracteres'
    }),
  Grado: Joi.string().min(2).max(50)
    .messages({
      'string.base': 'El grado debe ser texto',
      'string.min': 'El grado debe tener al menos 2 caracteres',
      'string.max': 'El grado no debe exceder los 50 caracteres'
    }),
  IDRol: Joi.number().integer().positive()
    .messages({
      'number.base': 'El ID de rol debe ser un número',
      'number.integer': 'El ID de rol debe ser un entero',
      'number.positive': 'El ID de rol debe ser positivo'
    }),
  IDArea: Joi.number().integer().positive()
    .messages({
      'number.base': 'El ID de área debe ser un número',
      'number.integer': 'El ID de área debe ser un entero',
      'number.positive': 'El ID de área debe ser positivo'
    })
});

// Esquema para cambio de contraseña
const passwordChangeSchema = Joi.object({
  currentPassword: Joi.string().required()
    .messages({
      'string.base': 'La contraseña actual debe ser texto',
      'string.empty': 'La contraseña actual es obligatoria',
      'any.required': 'La contraseña actual es obligatoria'
    }),
  newPassword: Joi.string().min(8).required()
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).*$/)
    .messages({
      'string.base': 'La nueva contraseña debe ser texto',
      'string.empty': 'La nueva contraseña es obligatoria',
      'string.min': 'La nueva contraseña debe tener al menos 8 caracteres',
      'string.pattern.base': 'La nueva contraseña debe contener al menos una letra mayúscula, una minúscula y un número',
      'any.required': 'La nueva contraseña es obligatoria'
    })
});

// Esquema para activar/desactivar usuario
const toggleStatusSchema = Joi.object({
  active: Joi.boolean().required()
    .messages({
      'boolean.base': 'El estado debe ser un valor booleano',
      'any.required': 'El estado del usuario es obligatorio'
    })
});

/**
 * Función para validar datos de usuario
 * @param {Object} data - Datos a validar
 * @param {String} type - Tipo de validación (create, update, password)
 * @returns {Object} Resultado de validación {error, value}
 */
const validateUserData = (data, type = 'create') => {
  let schema;
  
  switch (type) {
    case 'create':
      schema = userCreateSchema;
      break;
    case 'update':
      schema = userUpdateSchema;
      break;
    case 'password':
      schema = passwordChangeSchema;
      break;
    case 'toggle':
      schema = toggleStatusSchema;
      break;
    default:
      schema = userCreateSchema;
  }
  
  return schema.validate(data, {
    abortEarly: false,
    stripUnknown: true
  });
};

module.exports = {
  userCreateSchema,
  userUpdateSchema,
  passwordChangeSchema,
  toggleStatusSchema,
  validateUserData
}; 