/**
 * Índice de servicios
 * Exporta todos los servicios disponibles para facilitar su importación
 */

// Importar servicios
import AuthService from './auth.service.js';
import * as sessionManager from './sessionManager.js';

// Exportar servicios
export {
    AuthService,
    sessionManager
};

// Exportación por defecto de todos los servicios
export default {
    AuthService,
    sessionManager
}; 