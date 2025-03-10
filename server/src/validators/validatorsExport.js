/**
 * Exportación centralizada de todos los validadores
 * Este archivo facilita la importación de validadores en otros archivos del proyecto
 * 
 * Ejemplo de uso:
 * const { authValidator, userValidator } = require('../validators/validatorsExport');
 */

const authValidator = require('./authValidator');
const userValidator = require('./userValidator');

module.exports = {
    authValidator,
    userValidator
}; 