/**
 * Configuración de la Aplicación
 * 
 * Este archivo contiene las configuraciones centralizadas de la aplicación,
 * incluyendo rutas, endpoints, y configuraciones de almacenamiento.
 */

export const APP_CONFIG = {
    // Configuración de ambiente
    ENV: {
        PRODUCTION: window.location.protocol === 'https:',
        API_URL: window.location.protocol === 'https:' 
            ? 'https://api.oficri.com' 
            : 'http://localhost:3000'
    },

    // Rutas de la aplicación
    ROUTES: {
        LOGIN: '/login.html',
        ADMIN: '/admin.html',
        MESA_PARTES: '/mesaPartes.html',
        AREA: '/area.html',
        DASHBOARD: '/dashboard.html',
        PROFILE: '/profile.html',
        DOCUMENTS: '/documents.html',
        PENDING: '/pending.html'
    },

    // Configuración de almacenamiento
    STORAGE: {
        USER_KEY: 'oficri_user',
        TOKEN_KEY: 'oficri_token',
        THEME_KEY: 'oficri_theme'
    },

    // Configuración de la interfaz
    UI: {
        THEME: {
            LIGHT: 'light',
            DARK: 'dark'
        },
        TOAST_DURATION: 3000,
        MODAL_BACKDROP: 'static'
    },

    // Configuración de seguridad
    SECURITY: {
        SESSION_TIMEOUT: 30 * 60 * 1000, // 30 minutos
        MAX_LOGIN_ATTEMPTS: 5,
        LOCKOUT_DURATION: 15 * 60 * 1000, // 15 minutos
        PASSWORD_MIN_LENGTH: 8,
        PASSWORD_REQUIRE_SPECIAL: true,
        PASSWORD_REQUIRE_NUMBERS: true,
        PASSWORD_REQUIRE_UPPERCASE: true,
        PASSWORD_REQUIRE_LOWERCASE: true
    },

    // Configuración de API
    API: {
        ENDPOINTS: {
            AUTH: '/api/auth',
            USERS: '/api/users',
            DOCUMENTS: '/api/documents',
            AREAS: '/api/areas',
            ROLES: '/api/roles',
            LOGS: '/api/logs'
        },
        TIMEOUT: 30000, // 30 segundos
        RETRY_ATTEMPTS: 3,
        RETRY_DELAY: 1000 // 1 segundo
    }
};

// Exportar configuración por defecto
export default APP_CONFIG; 