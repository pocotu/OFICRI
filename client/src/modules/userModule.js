/**
 * ARCHIVO DE COMPATIBILIDAD
 * 
 * Este archivo ha sido modularizado para mejorar la mantenibilidad.
 * Ahora las funcionalidades están divididas en archivos especializados
 * dentro de la carpeta client/src/modules/user/
 * 
 * Se mantiene este archivo para compatibilidad con código existente.
 */

// Re-exportar todas las funciones desde el nuevo módulo modularizado
export * from './user/indexUser.js';

// Permitir la importación directa desde el módulo bundle para carga dinámica
import * as userModule from './user/index-bundle.js';
export default userModule;

// Mensaje en consola para ayudar en la migración
console.warn(
    '[DEPRECATED] El archivo userModule.js ha sido modularizado. ' +
    'Por favor, actualice sus importaciones para usar las funcionalidades ' +
    'desde client/src/modules/user/indexUser.js'
); 