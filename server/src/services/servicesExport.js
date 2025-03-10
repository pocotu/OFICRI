/**
 * Exportación centralizada de todos los servicios
 * Este archivo facilita la importación de servicios en otros archivos del proyecto
 * 
 * Ejemplo de uso:
 * const { authService, userService } = require('../services/servicesExport');
 */

const authService = require('./authService');
const userService = require('./userService');

module.exports = {
    authService,
    userService
}; 