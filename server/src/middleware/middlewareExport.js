/**
 * Exportación centralizada de todos los middlewares
 * Este archivo facilita la importación de middlewares en otros archivos del proyecto
 * 
 * Ejemplo de uso:
 * const { authMiddleware, hasPermission, hasRole } = require('../middleware/middlewareExport');
 */

const { authMiddleware, hasPermission, hasRole } = require('./auth.middleware');
const { errorMiddleware } = require('../utils/utilsExport');

module.exports = {
    authMiddleware,
    hasPermission,
    hasRole,
    errorMiddleware
}; 