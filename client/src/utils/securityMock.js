/**
 * Mock temporal de utilidades de seguridad
 * Para resolver errores de dependencias durante la refactorización
 */

// Definir niveles de log que espera AuthService
export const LOG_LEVEL = {
    DEBUG: 'DEBUG',
    INFO: 'INFO',
    WARN: 'WARN',
    ERROR: 'ERROR'
};

// Mock para SECURITY_EVENT
export const SECURITY_EVENT = {
    LOGIN_SUCCESS: 'LOGIN_SUCCESS',
    LOGIN_FAILED: 'LOGIN_FAILED',
    LOGOUT: 'LOGOUT',
    PERMISSION_ERROR: 'PERMISSION_ERROR',
    UNAUTHORIZED_ACCESS: 'UNAUTHORIZED_ACCESS'
};

/**
 * Función de registro mock
 * @param {string} level - Nivel de log
 * @param {string} message - Mensaje
 * @param {Object} data - Datos adicionales
 * @param {string} module - Módulo que genera el log
 */
export function log(level, message, data = null, module = 'app') {
    // Solo imprimimos en consola para depuración
    console.log(`[${level}][${module}] ${message}`, data || '');
}

/**
 * Función mock para eventos de seguridad
 * @param {string} eventType - Tipo de evento de seguridad
 * @param {Object} eventData - Datos del evento
 */
export function logSecurityEvent(eventType, eventData = {}) {
    console.log(`[SECURITY_EVENT] ${eventType}`, eventData);
}

// Exportar como objeto por defecto
export default {
    LOG_LEVEL,
    SECURITY_EVENT,
    log,
    logSecurityEvent
}; 