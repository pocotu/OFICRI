/**
 * Índice de servicios
 * Exporta todos los servicios disponibles para facilitar su importación
 * 
 * NOTA: Este archivo centraliza la exportación de servicios para evitar
 * dependencias circulares entre los módulos.
 */

// Para prevenir dependencias circulares, primero importamos y exportamos apiService
// que no tiene dependencias circulares
import apiService from './api.service.js';
export { apiService };

// Importamos la instancia de AuthService
import authService from './auth.service.js';
export { authService };

// Finalmente importamos y exportamos los módulos que dependen de los anteriores
import * as sessionManager from './sessionManager.js';
export { sessionManager };

import userService from './user.service.js';
export { userService };

// Exportamos un objeto por defecto con todas las referencias
export default {
    apiService,
    authService,
    sessionManager,
    userService
}; 