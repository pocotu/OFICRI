/**
 * Índice de servicios API
 * 
 * Este archivo centraliza la exportación de todos los servicios relacionados
 * con la comunicación con la API para facilitar su importación.
 */

// Cliente API principal
import apiClient from './apiClient.js';

// Exportar cliente API para importación normal
export { apiClient };

// Exportar cliente API como exportación por defecto
export default apiClient; 