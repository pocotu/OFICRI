/**
 * Alias para permission.js para mantener compatibilidad
 * Este archivo solo redirige al módulo permission.js 
 */

import * as permissionModule from './permission.js';

// Reexportar todas las exportaciones de permission.js
export const permissionUtils = permissionModule.permissionUtils || {
    hasPermission: () => true,
    checkPermission: () => true
};

// Reexportar el resto de exportaciones
export default permissionModule.default || permissionModule; 