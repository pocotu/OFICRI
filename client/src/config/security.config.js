/**
 * Configuración de Seguridad
 * 
 * Este archivo define las configuraciones de seguridad del sistema
 * siguiendo los controles de ISO 27001.
 */

// Configuración de autenticación (A.9.2, A.9.4)
export const AUTH_CONFIG = {
    // Política de contraseñas (A.9.2.4)
    PASSWORD_POLICY: {
        MIN_LENGTH: 8,
        REQUIRE_UPPERCASE: true,
        REQUIRE_LOWERCASE: true,
        REQUIRE_NUMBERS: true,
        REQUIRE_SPECIAL: true,
        MAX_AGE_DAYS: 90,
        PREVENT_REUSE: 5, // Últimas 5 contraseñas
        MAX_FAILED_ATTEMPTS: 5,
        LOCKOUT_DURATION: 15 * 60 * 1000 // 15 minutos
    },

    // Gestión de sesiones (A.9.4.2)
    SESSION: {
        TIMEOUT: 30 * 60 * 1000, // 30 minutos
        WARNING_TIME: 5 * 60 * 1000, // 5 minutos antes del timeout
        MAX_CONCURRENT_SESSIONS: 1,
        RENEWAL_INTERVAL: 15 * 60 * 1000 // 15 minutos
    },

    // Tokens y seguridad de comunicación (A.9.4.3)
    TOKEN: {
        ACCESS_TOKEN_EXPIRY: 30 * 60 * 1000, // 30 minutos
        REFRESH_TOKEN_EXPIRY: 7 * 24 * 60 * 60 * 1000, // 7 días
        CSRF_TOKEN_LENGTH: 32,
        TOKEN_HEADER: 'X-CSRF-Token'
    }
};

// Configuración de logging (A.12.4)
export const LOGGING_CONFIG = {
    // Niveles de log
    LEVELS: {
        DEBUG: 'DEBUG',
        INFO: 'INFO',
        WARN: 'WARN',
        ERROR: 'ERROR',
        SECURITY: 'SECURITY'
    },

    // Eventos de seguridad a registrar
    SECURITY_EVENTS: {
        LOGIN_SUCCESS: 'LOGIN_SUCCESS',
        LOGIN_FAILURE: 'LOGIN_FAILURE',
        LOGOUT: 'LOGOUT',
        PASSWORD_CHANGE: 'PASSWORD_CHANGE',
        PERMISSION_CHANGE: 'PERMISSION_CHANGE',
        USER_LOCKED: 'USER_LOCKED',
        SESSION_EXPIRED: 'SESSION_EXPIRED',
        ACCESS_DENIED: 'ACCESS_DENIED',
        DATA_ACCESS: 'DATA_ACCESS',
        SYSTEM_CONFIG_CHANGE: 'SYSTEM_CONFIG_CHANGE'
    },

    // Configuración de almacenamiento de logs
    STORAGE: {
        MAX_LOGS: 1000,
        LOG_RETENTION_DAYS: 90,
        AUTO_CLEANUP: true
    }
};

// Configuración de validación de entrada (A.12.6.1)
export const VALIDATION_CONFIG = {
    // Patrones de validación
    PATTERNS: {
        CIP: /^[0-9]{8}$/,
        EMAIL: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
        PHONE: /^[0-9]{9}$/,
        DOCUMENT_NUMBER: /^[A-Z0-9-]+$/
    },

    // Límites de longitud
    LENGTH_LIMITS: {
        MIN_USERNAME: 4,
        MAX_USERNAME: 50,
        MIN_PASSWORD: 8,
        MAX_PASSWORD: 128,
        MAX_COMMENT: 500,
        MAX_DESCRIPTION: 1000
    },

    // Caracteres permitidos
    ALLOWED_CHARS: {
        USERNAME: /^[a-zA-Z0-9._-]+$/,
        PASSWORD: /^[a-zA-Z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+$/,
        TEXT: /^[a-zA-Z0-9áéíóúñÁÉÍÓÚÑ.,;:¿?¡!()\s-]+$/
    }
};

// Configuración de protección contra ataques (A.14.2.5)
export const SECURITY_PROTECTION = {
    // Protección XSS
    XSS: {
        ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br'],
        ALLOWED_ATTR: ['href', 'title', 'target'],
        SANITIZE_HTML: true
    },

    // Protección CSRF
    CSRF: {
        ENABLED: true,
        TOKEN_HEADER: 'X-CSRF-Token',
        TOKEN_COOKIE: 'csrf_token'
    },

    // Protección contra inyección
    INJECTION: {
        BLOCKED_PATTERNS: [
            /<script\b[^>]*>/i,
            /javascript:/i,
            /on\w+\s*=/i,
            /data:/i,
            /vbscript:/i
        ]
    },

    // Headers de seguridad
    HEADERS: {
        'X-Frame-Options': 'DENY',
        'X-Content-Type-Options': 'nosniff',
        'X-XSS-Protection': '1; mode=block',
        'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:;"
    }
};

// Configuración de auditoría (A.12.4.3)
export const AUDIT_CONFIG = {
    // Eventos a auditar
    EVENTS: {
        USER_MANAGEMENT: true,
        ROLE_CHANGES: true,
        PERMISSION_CHANGES: true,
        DOCUMENT_ACCESS: true,
        SYSTEM_CONFIG: true,
        SECURITY_EVENTS: true
    },

    // Detalles a registrar
    DETAILS: {
        USER_ID: true,
        IP_ADDRESS: true,
        USER_AGENT: true,
        TIMESTAMP: true,
        ACTION: true,
        RESOURCE: true,
        STATUS: true,
        DETAILS: true
    },

    // Retención de auditoría
    RETENTION: {
        DAYS: 365,
        AUTO_CLEANUP: true,
        ARCHIVE_ENABLED: true
    }
};

// Exportar configuración por defecto
export default {
    AUTH_CONFIG,
    LOGGING_CONFIG,
    VALIDATION_CONFIG,
    SECURITY_PROTECTION,
    AUDIT_CONFIG
}; 