/**
 * Índice de módulos
 * Exporta todos los módulos disponibles para facilitar su importación
 */

// Importar módulos
import * as userModule from './userModule.js';
import * as documentModule from './documentModule.js';
import * as areaModule from './areaModule.js';
import * as auditModule from './auditModule.js';
import * as adminModule from './adminModule.js';
import * as loginModule from './loginModule.js';
import sidebarToggle from './sidebarToggle.js';

// Exportar módulos
export {
    userModule,
    documentModule,
    areaModule,
    auditModule,
    adminModule,
    loginModule,
    sidebarToggle
};

// Exportación por defecto de todos los módulos
export default {
    userModule,
    documentModule,
    areaModule,
    auditModule,
    adminModule,
    loginModule,
    sidebarToggle
}; 