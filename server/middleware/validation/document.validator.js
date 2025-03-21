/**
 * Document validation middleware
 * Validates document-related requests
 * ISO/IEC 27001 compliant implementation
 */

const { body } = require('express-validator');

/**
 * Validates document creation request
 */
const createDocumentValidator = [
  body('mesaPartesId')
    .notEmpty().withMessage('Se requiere el ID de Mesa de Partes')
    .isInt().withMessage('El ID de Mesa de Partes debe ser un número entero'),

  body('areaActualId')
    .notEmpty().withMessage('Se requiere el ID de Área Actual')
    .isInt().withMessage('El ID de Área Actual debe ser un número entero'),

  body('nroRegistro')
    .notEmpty().withMessage('Se requiere el Número de Registro')
    .isString().withMessage('El Número de Registro debe ser una cadena de texto')
    .isLength({ min: 5, max: 50 }).withMessage('El Número de Registro debe tener entre 5 y 50 caracteres'),

  body('numeroOficioDocumento')
    .notEmpty().withMessage('Se requiere el Número de Oficio')
    .isString().withMessage('El Número de Oficio debe ser una cadena de texto')
    .isLength({ min: 3, max: 50 }).withMessage('El Número de Oficio debe tener entre 3 y 50 caracteres'),

  body('fechaDocumento')
    .notEmpty().withMessage('Se requiere la Fecha del Documento')
    .isDate().withMessage('Formato de fecha inválido. Utilice YYYY-MM-DD'),

  body('origenDocumento')
    .notEmpty().withMessage('Se requiere el Origen del Documento')
    .isIn(['INTERNO', 'EXTERNO']).withMessage('El Origen debe ser INTERNO o EXTERNO'),

  body('procedencia')
    .optional()
    .isString().withMessage('La Procedencia debe ser una cadena de texto')
    .isLength({ max: 255 }).withMessage('La Procedencia no debe exceder los 255 caracteres'),

  body('contenido')
    .optional()
    .isString().withMessage('El Contenido debe ser una cadena de texto'),

  body('observaciones')
    .optional()
    .isString().withMessage('Las Observaciones deben ser una cadena de texto')
    .isLength({ max: 500 }).withMessage('Las Observaciones no deben exceder los 500 caracteres'),

  body('prioridad')
    .optional()
    .isIn(['ALTA', 'NORMAL', 'BAJA']).withMessage('La Prioridad debe ser ALTA, NORMAL o BAJA')
];

/**
 * Validates document update request
 */
const updateDocumentValidator = [
  body('numeroOficioDocumento')
    .optional()
    .isString().withMessage('El Número de Oficio debe ser una cadena de texto')
    .isLength({ min: 3, max: 50 }).withMessage('El Número de Oficio debe tener entre 3 y 50 caracteres'),

  body('fechaDocumento')
    .optional()
    .isDate().withMessage('Formato de fecha inválido. Utilice YYYY-MM-DD'),

  body('origenDocumento')
    .optional()
    .isIn(['INTERNO', 'EXTERNO']).withMessage('El Origen debe ser INTERNO o EXTERNO'),

  body('procedencia')
    .optional()
    .isString().withMessage('La Procedencia debe ser una cadena de texto')
    .isLength({ max: 255 }).withMessage('La Procedencia no debe exceder los 255 caracteres'),

  body('contenido')
    .optional()
    .isString().withMessage('El Contenido debe ser una cadena de texto'),

  body('observaciones')
    .optional()
    .isString().withMessage('Las Observaciones deben ser una cadena de texto')
    .isLength({ max: 500 }).withMessage('Las Observaciones no deben exceder los 500 caracteres'),

  body('prioridad')
    .optional()
    .isIn(['ALTA', 'NORMAL', 'BAJA']).withMessage('La Prioridad debe ser ALTA, NORMAL o BAJA')
];

/**
 * Validates document status update request
 */
const updateStatusValidator = [
  body('estado')
    .notEmpty().withMessage('Se requiere el Estado del Documento')
    .isIn(['REGISTRADO', 'EN_PROCESO', 'OBSERVADO', 'FINALIZADO', 'ARCHIVADO', 'CANCELADO'])
    .withMessage('Estado no válido. Debe ser REGISTRADO, EN_PROCESO, OBSERVADO, FINALIZADO, ARCHIVADO o CANCELADO'),

  body('observaciones')
    .optional()
    .isString().withMessage('Las Observaciones deben ser una cadena de texto')
    .isLength({ max: 500 }).withMessage('Las Observaciones no deben exceder los 500 caracteres'),

  body('idUsuarioAsignado')
    .optional()
    .isInt().withMessage('El ID del Usuario Asignado debe ser un número entero')
];

/**
 * Validates document derivation request
 */
const deriveDocumentValidator = [
  body('areaDestinoId')
    .notEmpty().withMessage('Se requiere el ID del Área de Destino')
    .isInt().withMessage('El ID del Área de Destino debe ser un número entero'),

  body('observaciones')
    .optional()
    .isString().withMessage('Las Observaciones deben ser una cadena de texto')
    .isLength({ max: 500 }).withMessage('Las Observaciones no deben exceder los 500 caracteres'),

  body('urgente')
    .optional()
    .isBoolean().withMessage('El campo Urgente debe ser un valor booleano'),

  body('motivo')
    .optional()
    .isString().withMessage('El Motivo debe ser una cadena de texto')
    .isLength({ max: 255 }).withMessage('El Motivo no debe exceder los 255 caracteres')
];

module.exports = {
  createDocumentValidator,
  updateDocumentValidator,
  updateStatusValidator,
  deriveDocumentValidator
}; 