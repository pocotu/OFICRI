/**
 * Índice de servicios centralizados
 * 
 * Este archivo centraliza la exportación de todos los servicios principales
 * de la aplicación para facilitar su importación y evitar dependencias circulares.
 */

// Importar servicios API
import apiClient from './api/index.js';
export { apiClient };

// Importar servicios de seguridad
import * as security from './security/index.js';
export { security };

// Importar servicios de autenticación (cuando estén disponibles)
// import * as auth from './auth/index.js';
// export { auth };

// Exportar objeto con todos los servicios para importación simplificada
const services = {
  api: apiClient,
  security
  // auth (cuando esté disponible)
};

export default services; 