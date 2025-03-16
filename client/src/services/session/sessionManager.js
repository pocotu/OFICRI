/**
 * Gestor de Sesiones - OFICRI
 * Maneja la validación y expiración de sesiones de usuario
 */

import { securityLogger } from '../security/logging.js';
import { securityUtils } from '../security/SecurityUtils.js';
import { authService } from '../auth/authService.js';

// Configuración de sesión
const SESSION_CONFIG = {
    MAX_DURATION: 24 * 60 * 60 * 1000, // 24 horas
    WARNING_TIME: 5 * 60 * 1000, // 5 minutos antes de expirar
    CHECK_INTERVAL: 60 * 1000 // Verificar cada minuto
};

let sessionCheckInterval = null;

/**
 * Inicializa el gestor de sesiones
 * @returns {Promise<void>}
 */
export async function initSessionManager() {
    try {
        // Verificar sesión actual
        const session = await getCurrentSession();
        if (!session) {
            redirectToLogin();
            return;
        }

        // Iniciar monitoreo de sesión
        startSessionMonitoring(session);
    } catch (error) {
        securityLogger.logSecurityEvent('SESSION_INIT_ERROR', {
            error: error.message,
            timestamp: new Date().toISOString()
        });
        redirectToLogin();
    }
}

/**
 * Obtiene la sesión actual
 * @returns {Promise<Object|null>} - Datos de la sesión o null si no existe
 */
export async function getCurrentSession() {
    try {
        const sessionData = localStorage.getItem('session');
        const expiryTime = parseInt(localStorage.getItem('sessionExpiry') || '0');

        if (!sessionData || new Date().getTime() > expiryTime) {
            await clearSession();
            return null;
        }

        // Desencriptar datos
        const session = await securityUtils.decryptData(sessionData);
        
        // Validar integridad de la sesión
        if (!isValidSession(session)) {
            await clearSession();
            return null;
        }

        return session;
    } catch (error) {
        securityLogger.logSecurityEvent('SESSION_GET_ERROR', {
            error: error.message,
            timestamp: new Date().toISOString()
        });
        return null;
    }
}

/**
 * Valida la integridad de una sesión
 * @param {Object} session - Datos de la sesión
 * @returns {boolean} - Si la sesión es válida
 */
function isValidSession(session) {
    // Verificar estructura básica
    if (!session || !session.username || !session.permisos) {
        return false;
    }

    // Verificar permisos válidos
    if (typeof session.permisos !== 'number' || session.permisos < 0 || session.permisos > 255) {
        return false;
    }

    // Verificar timestamp de creación
    if (!session.createdAt || new Date(session.createdAt).toString() === 'Invalid Date') {
        return false;
    }

    return true;
}

/**
 * Inicia el monitoreo de la sesión
 * @param {Object} session - Datos de la sesión
 */
function startSessionMonitoring(session) {
    // Limpiar intervalo existente si hay uno
    if (sessionCheckInterval) {
        clearInterval(sessionCheckInterval);
    }

    // Crear nuevo intervalo de verificación
    sessionCheckInterval = setInterval(async () => {
        try {
            const currentSession = await getCurrentSession();
            if (!currentSession) {
                handleSessionExpired();
                return;
            }

            // Verificar tiempo restante
            const expiryTime = parseInt(localStorage.getItem('sessionExpiry') || '0');
            const timeLeft = expiryTime - new Date().getTime();

            // Mostrar advertencia si está cerca de expirar
            if (timeLeft <= SESSION_CONFIG.WARNING_TIME && timeLeft > 0) {
                showSessionWarning(timeLeft);
            }
        } catch (error) {
            securityLogger.logSecurityEvent('SESSION_CHECK_ERROR', {
                error: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }, SESSION_CONFIG.CHECK_INTERVAL);
}

/**
 * Maneja la expiración de la sesión
 */
async function handleSessionExpired() {
    // Limpiar intervalo
    if (sessionCheckInterval) {
        clearInterval(sessionCheckInterval);
        sessionCheckInterval = null;
    }

    // Registrar evento
    securityLogger.logSecurityEvent('SESSION_EXPIRED', {
        action: 'SESSION_EXPIRED',
        timestamp: new Date().toISOString()
    });

    // Limpiar sesión
    await clearSession();

    // Mostrar mensaje al usuario
    showSessionExpired();

    // Redirigir al login
    redirectToLogin();
}

/**
 * Muestra advertencia de sesión próxima a expirar
 * @param {number} timeLeft - Tiempo restante en milisegundos
 */
function showSessionWarning(timeLeft) {
    const minutes = Math.ceil(timeLeft / 60000);
    const warningDiv = document.createElement('div');
    warningDiv.className = 'alert alert-warning alert-dismissible fade show';
    warningDiv.innerHTML = `
        <strong>¡Advertencia!</strong> Su sesión expirará en ${minutes} minutos.
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;

    const container = document.querySelector('.container') || document.body;
    container.insertBefore(warningDiv, container.firstChild);
}

/**
 * Muestra mensaje de sesión expirada
 */
function showSessionExpired() {
    const expiredDiv = document.createElement('div');
    expiredDiv.className = 'alert alert-danger alert-dismissible fade show';
    expiredDiv.innerHTML = `
        <strong>¡Sesión Expirada!</strong> Por favor, inicie sesión nuevamente.
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;

    const container = document.querySelector('.container') || document.body;
    container.insertBefore(expiredDiv, container.firstChild);
}

/**
 * Limpia la sesión actual
 * @returns {Promise<void>}
 */
export async function clearSession() {
    try {
        // Limpiar intervalo de monitoreo
        if (sessionCheckInterval) {
            clearInterval(sessionCheckInterval);
            sessionCheckInterval = null;
        }

        // Limpiar datos de sesión
        localStorage.removeItem('session');
        localStorage.removeItem('sessionExpiry');

        // Registrar evento
        securityLogger.logSecurityEvent('SESSION_CLEARED', {
            action: 'SESSION_CLEARED',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        securityLogger.logSecurityEvent('SESSION_CLEAR_ERROR', {
            error: error.message,
            timestamp: new Date().toISOString()
        });
        throw error;
    }
}

/**
 * Redirige al usuario a la página de login
 */
function redirectToLogin() {
    window.location.href = '/index.html';
} 