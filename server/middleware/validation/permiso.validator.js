/**
 * Permiso Validator
 * Implementa validación para operaciones relacionadas con permisos
 * ISO/IEC 27001 compliant
 */

const Joi = require('joi');

// Esquema para crear/actualizar permisos contextuales
const permisoContextualSchema = Joi.object({
  nombre: Joi.string().min(3).max(50).required()
    .messages({
      'string.base': 'El nombre debe ser texto',
      'string.min': 'El nombre debe tener al menos 3 caracteres',
      'string.max': 'El nombre no debe exceder los 50 caracteres',
      'any.required': 'El nombre es obligatorio'
    }),
  descripcion: Joi.string().min(5).max(255).required()
    .messages({
      'string.base': 'La descripción debe ser texto',
      'string.min': 'La descripción debe tener al menos 5 caracteres',
      'string.max': 'La descripción no debe exceder los 255 caracteres',
      'any.required': 'La descripción es obligatoria'
    }),
  condicion: Joi.string().valid('PROPIETARIO', 'MISMA_AREA', 'ASIGNADO', 'SUPERVISOR').required()
    .messages({
      'string.base': 'La condición debe ser texto',
      'any.only': 'La condición debe ser uno de los valores permitidos',
      'any.required': 'La condición es obligatoria'
    }),
  tipo: Joi.string().valid('DOCUMENTO', 'USUARIO', 'AREA', 'GLOBAL').required()
    .messages({
      'string.base': 'El tipo debe ser texto',
      'any.only': 'El tipo debe ser uno de los valores permitidos',
      'any.required': 'El tipo es obligatorio'
    }),
  permisos: Joi.number().integer().min(0).max(255).required()
    .messages({
      'number.base': 'Los permisos deben ser un número',
      'number.integer': 'Los permisos deben ser un entero',
      'number.min': 'Los permisos no pueden ser negativos',
      'number.max': 'Los permisos no pueden exceder 255',
      'any.required': 'Los permisos son obligatorios'
    }),
  activo: Joi.boolean()
    .messages({
      'boolean.base': 'Activo debe ser un valor booleano'
    })
});

// Esquema para crear/actualizar permisos especiales
const permisoEspecialSchema = Joi.object({
  idUsuario: Joi.number().integer().positive().required()
    .messages({
      'number.base': 'El ID de usuario debe ser un número',
      'number.integer': 'El ID de usuario debe ser un entero',
      'number.positive': 'El ID de usuario debe ser positivo',
      'any.required': 'El ID de usuario es obligatorio'
    }),
  idRecurso: Joi.number().integer().positive().required()
    .messages({
      'number.base': 'El ID de recurso debe ser un número',
      'number.integer': 'El ID de recurso debe ser un entero',
      'number.positive': 'El ID de recurso debe ser positivo',
      'any.required': 'El ID de recurso es obligatorio'
    }),
  tipoRecurso: Joi.string().valid('DOCUMENTO', 'AREA', 'USUARIO').required()
    .messages({
      'string.base': 'El tipo de recurso debe ser texto',
      'any.only': 'El tipo de recurso debe ser uno de los valores permitidos',
      'any.required': 'El tipo de recurso es obligatorio'
    }),
  permisos: Joi.number().integer().min(0).max(255).required()
    .messages({
      'number.base': 'Los permisos deben ser un número',
      'number.integer': 'Los permisos deben ser un entero',
      'number.min': 'Los permisos no pueden ser negativos',
      'number.max': 'Los permisos no pueden exceder 255',
      'any.required': 'Los permisos son obligatorios'
    }),
  fechaExpiracion: Joi.date().iso().allow(null)
    .messages({
      'date.base': 'La fecha de expiración debe ser una fecha válida',
      'date.format': 'La fecha de expiración debe tener formato ISO'
    })
});

// Esquema para verificar permisos
const verificarPermisoSchema = Joi.object({
  idUsuario: Joi.number().integer().positive().required()
    .messages({
      'number.base': 'El ID de usuario debe ser un número',
      'number.integer': 'El ID de usuario debe ser un entero',
      'number.positive': 'El ID de usuario debe ser positivo',
      'any.required': 'El ID de usuario es obligatorio'
    }),
  idRecurso: Joi.number().integer().positive()
    .messages({
      'number.base': 'El ID de recurso debe ser un número',
      'number.integer': 'El ID de recurso debe ser un entero',
      'number.positive': 'El ID de recurso debe ser positivo'
    }),
  tipoRecurso: Joi.string().valid('DOCUMENTO', 'AREA', 'USUARIO', 'GLOBAL')
    .messages({
      'string.base': 'El tipo de recurso debe ser texto',
      'any.only': 'El tipo de recurso debe ser uno de los valores permitidos'
    }),
  permisoBit: Joi.number().integer().min(0).max(7)
    .messages({
      'number.base': 'El bit de permiso debe ser un número',
      'number.integer': 'El bit de permiso debe ser un entero',
      'number.min': 'El bit de permiso no puede ser menor a 0',
      'number.max': 'El bit de permiso no puede ser mayor a 7'
    })
});

module.exports = {
  permisoContextualSchema,
  permisoEspecialSchema,
  verificarPermisoSchema
}; 