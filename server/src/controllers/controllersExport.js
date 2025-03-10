/**
 * Exportación centralizada de todos los controladores
 * Este archivo facilita la importación de controladores en otros archivos del proyecto
 * 
 * Ejemplo de uso:
 * const { authController, userController } = require('../controllers/controllersExport');
 */

const authController = require('./authController');
const userController = require('./userController');

module.exports = {
    authController,
    userController
}; 