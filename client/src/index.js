/**
 * Archivo principal para importar y exportar todos los módulos
 * Facilita la importación de módulos en otros archivos
 */

// Importar módulos
import * as components from './components/index.js';
import * as services from './services/services.js';
import * as utils from './utils/index.js';
import * as modules from './modules/index.js';

// Exportar módulos
export {
    components,
    services,
    utils,
    modules
};

// Exportación por defecto de todos los módulos
export default {
    components,
    services,
    utils,
    modules
}; 