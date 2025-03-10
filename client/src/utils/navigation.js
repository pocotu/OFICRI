/**
 * Módulo de navegación
 * Proporciona funciones para la navegación y redirección basada en roles y permisos
 */

import AuthService from '../services/auth.service.js';
import * as sessionManager from '../services/sessionManager.js';
import * as permissionUtils from './permissions.js';

/**
 * Verifica si el usuario está autenticado
 * @returns {Object|null} - Objeto de usuario si está autenticado, null en caso contrario
 */
export const getAuthenticatedUser = () => {
    if (!sessionManager.haySesionActiva()) {
        return null;
    }
    return sessionManager.obtenerUsuarioActual();
};

/**
 * Verifica la autenticación y redirige si es necesario
 * @param {number|null} requiredRoleId - ID del rol requerido (opcional)
 * @returns {Object|null} - Objeto de usuario si está autenticado y tiene el rol requerido, null en caso contrario
 */
export const checkAuth = (requiredRoleId = null) => {
    const user = getAuthenticatedUser();
    
    if (!user) {
        redirectToLogin();
        return null;
    }
    
    if (requiredRoleId !== null && user.IDRol !== requiredRoleId) {
        redirectBasedOnRole(user);
        return null;
    }
    
    return user;
};

/**
 * Redirige al usuario a la página de login
 */
export const redirectToLogin = () => {
    window.location.href = '/';
};

/**
 * Redirige al usuario según su rol
 * @param {Object} user - Objeto de usuario
 */
export const redirectBasedOnRole = (user) => {
    if (!user) {
        redirectToLogin();
        return;
    }
    
    window.location.href = permissionUtils.getRedirectPath(user);
};

/**
 * Carga un módulo dinámicamente
 * @param {string} modulePath - Ruta del módulo a cargar
 * @returns {Promise<any>} - Promesa que resuelve al módulo cargado
 */
export const loadModule = async (modulePath) => {
    try {
        const module = await import(modulePath);
        return module.default || module;
    } catch (error) {
        console.error(`Error al cargar el módulo ${modulePath}:`, error);
        throw error;
    }
};

/**
 * Maneja la navegación entre páginas
 * @param {Event} event - Evento de clic
 */
export const handleNavigation = (event) => {
    const target = event.target.closest('a[data-route]');
    if (!target) return;
    
    event.preventDefault();
    const route = target.getAttribute('data-route');
    navigateTo(route);
};

/**
 * Navega a una ruta específica
 * @param {string} route - Ruta a la que navegar
 */
export const navigateTo = (route) => {
    history.pushState(null, null, route);
    handleRoute();
};

/**
 * Maneja la ruta actual
 */
export const handleRoute = async () => {
    const path = window.location.pathname;
    const contentContainer = document.getElementById('content');
    
    if (!contentContainer) {
        console.error('No se encontró el contenedor de contenido');
        return;
    }
    
    try {
        // Aquí se cargaría el contenido según la ruta
        // Este es un ejemplo simplificado
        let moduleContent = '';
        
        if (path.includes('/admin')) {
            const adminModule = await loadModule('../pages/admin/admin.js');
            moduleContent = await adminModule.render();
        } else if (path.includes('/mesaPartes')) {
            const mesaPartesModule = await loadModule('../pages/mesaPartes/mesaPartes.js');
            moduleContent = await mesaPartesModule.render();
        } else if (path.includes('/area')) {
            const areaModule = await loadModule('../pages/area/area.js');
            moduleContent = await areaModule.render();
        }
        
        contentContainer.innerHTML = moduleContent;
    } catch (error) {
        console.error('Error al manejar la ruta:', error);
        contentContainer.innerHTML = '<div class="alert alert-danger">Error al cargar el contenido</div>';
    }
};

/**
 * Inicializa los eventos de navegación
 */
export const initNavigation = () => {
    window.addEventListener('popstate', handleRoute);
    document.addEventListener('click', handleNavigation);
    handleRoute();
}; 