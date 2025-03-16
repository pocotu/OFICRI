/**
 * Configuración de API
 * Este archivo define las configuraciones relacionadas con la API REST
 */

export const API_CONFIG = {
    // URL base para API
    BASE_URL: 'https://api.oficri.gob.pe',
    
    // URLs de endpoints principales
    ENDPOINTS: {
        AUTH: {
            LOGIN: '/auth/login',
            REFRESH: '/auth/refresh-token',
            LOGOUT: '/auth/logout'
        },
        USERS: {
            BASE: '/users',
            PROFILE: '/users/profile'
        },
        DOCUMENTS: {
            BASE: '/documents',
            SEARCH: '/documents/search'
        }
    },
    
    // Configuración de peticiones
    REQUEST: {
        TIMEOUT: 30000, // 30 segundos
        RETRY_ATTEMPTS: 3,
        RETRY_DELAY: 1000, // 1 segundo
        CACHE_ENABLED: true,
        CACHE_DURATION: 300000 // 5 minutos
    },
    
    // Opciones de cabeceras HTTP por defecto
    HEADERS: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
};

// Exportación por defecto
export default API_CONFIG; 