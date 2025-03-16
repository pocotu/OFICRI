/**
 * Sistema de Navegación - OFICRI
 * Maneja la navegación entre páginas y redirecciones basadas en permisos
 */

import { securityLogger } from '../services/security/logging.js';
import { securityUtils } from '../services/security/securityUtils.js';

// Mapeo de rutas por rol
const ROUTES = {
    ADMIN: {
        default: '/admin.html',
        allowed: ['/admin.html', '/mesaPartes.html']
    },
    MESA_PARTES: {
        default: '/mesaPartes.html',
        allowed: ['/mesaPartes.html']
    },
    AREA: {
        default: '/mesaPartes.html',
        allowed: ['/mesaPartes.html']
    }
};

/**
 * Verifica si una ruta está permitida para el usuario actual
 * @param {string} route - Ruta a verificar
 * @param {number} userPermissions - Permisos del usuario
 * @returns {boolean} - Si la ruta está permitida
 */
export function isRouteAllowed(route, userPermissions) {
    const role = getHighestRole(userPermissions);
    return ROUTES[role]?.allowed.includes(route) || false;
}

/**
 * Obtiene el rol más alto del usuario basado en sus permisos
 * @param {number} userPermissions - Permisos del usuario
 * @returns {string} - Rol más alto del usuario
 */
function getHighestRole(userPermissions) {
    // Si tiene todos los permisos, es ADMIN
    if (userPermissions === 255) return 'ADMIN';
    
    // Si tiene permisos de Mesa de Partes
    if ((userPermissions & 89) === 89) return 'MESA_PARTES';
    
    // Si tiene permisos de Área
    if ((userPermissions & 89) === 89) return 'AREA';
    
    return 'GUEST';
}

/**
 * Redirige al usuario a la página por defecto según su rol
 * @param {number} userPermissions - Permisos del usuario
 */
export function redirectToDefault(userPermissions) {
    const role = getHighestRole(userPermissions);
    const defaultRoute = ROUTES[role]?.default || '/index.html';
    
    securityLogger.logSecurityEvent('NAVIGATION', {
        action: 'REDIRECT_TO_DEFAULT',
        role,
        route: defaultRoute
    });
    
    window.location.href = defaultRoute;
}

/**
 * Navega a una ruta específica si está permitida
 * @param {string} route - Ruta a navegar
 * @param {number} userPermissions - Permisos del usuario
 */
export function navigateTo(route, userPermissions) {
    if (!isRouteAllowed(route, userPermissions)) {
        securityLogger.logSecurityEvent('SECURITY_VIOLATION', {
            action: 'UNAUTHORIZED_NAVIGATION',
            attemptedRoute: route,
            userPermissions
        });
        
        showError('No tiene permisos para acceder a esta página');
        return;
    }
    
    securityLogger.logSecurityEvent('NAVIGATION', {
        action: 'NAVIGATE_TO',
        route,
        userPermissions
    });
    
    window.location.href = route;
}

/**
 * Verifica la sesión actual y redirige si es necesario
 * @returns {Promise<boolean>} - Si la sesión es válida
 */
export async function checkSession() {
    try {
        const session = await securityUtils.getCurrentSession();
        if (!session || !session.isValid) {
            securityLogger.logSecurityEvent('SESSION_EXPIRED', {
                action: 'CHECK_SESSION',
                result: 'EXPIRED'
            });
            
            window.location.href = '/index.html';
            return false;
        }
        
        return true;
    } catch (error) {
        securityLogger.logSecurityEvent('ERROR', {
            action: 'CHECK_SESSION',
            error: error.message
        });
        
        window.location.href = '/index.html';
        return false;
    }
}

/**
 * Muestra un mensaje de error al usuario
 * @param {string} message - Mensaje de error
 */
function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'alert alert-danger alert-dismissible fade show';
    errorDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    
    const container = document.querySelector('.container') || document.body;
    container.insertBefore(errorDiv, container.firstChild);
    
    // Auto-cerrar después de 5 segundos
    setTimeout(() => {
        errorDiv.remove();
    }, 5000);
} 