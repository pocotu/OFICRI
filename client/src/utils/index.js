/**
 * Archivo de índice para exportar todas las utilidades
 * Facilita la importación de utilidades en otros archivos
 */

// Importar utilidades
import * as permissionUtils from './permissions.js';
import * as navigationUtils from './navigation.js';
import * as errorHandler from './errorHandler.js';

// Exportar utilidades
export {
    permissionUtils,
    navigationUtils,
    errorHandler
};

// Exportación por defecto de todas las utilidades
export default {
    permissionUtils,
    navigationUtils,
    errorHandler
}; 