/**
 * Servicio de Redirección
 * Proporciona funciones para manejar redirecciones seguras y detección de páginas
 */

import * as errorHandler from '../utils/errorHandler.js';
import storageService from './storage.service.js';

class RedirectionService {
    constructor() {
        errorHandler.log('REDIRECT', 'Servicio de redirección inicializado', null, errorHandler.LOG_LEVEL.DEBUG);
    }

    /**
     * Verifica si la página actual es exactamente la página de login
     * @returns {boolean} - Si estamos en la página exacta de login
     */
    isExactlyLoginPage() {
        const currentPath = window.location.pathname;
        const isExactlyLoginPage = currentPath === '/' || 
                                 currentPath === '/index.html' || 
                                 currentPath.endsWith('/OFICRI/') || 
                                 currentPath.endsWith('/OFICRI/index.html');
        
        errorHandler.log('REDIRECT', `Verificación exacta de página de login: ${isExactlyLoginPage}`, 
            { ruta: currentPath }, errorHandler.LOG_LEVEL.DEBUG);
            
        return isExactlyLoginPage;
    }
    
    /**
     * Determina la URL de redirección según el rol del usuario
     * @param {Object} userData - Datos del usuario
     * @returns {string} - URL de redirección
     */
    getRedirectUrlByRole(userData) {
        let redirectTo = '/dashboard.html';
        
        if (userData.IDRol === 1) {
            redirectTo = '/admin.html';
            errorHandler.log('REDIRECT', 'Usuario con rol Admin (1), redirigiendo a: ' + redirectTo, null, errorHandler.LOG_LEVEL.INFO);
        } else if (userData.IDRol === 2) {
            redirectTo = '/mesaPartes.html';
            errorHandler.log('REDIRECT', 'Usuario con rol Mesa de Partes (2), redirigiendo a: ' + redirectTo, null, errorHandler.LOG_LEVEL.INFO);
            
            // Limpiar cualquier contador de redirección para evitar detección de ciclos
            storageService.clearMesaPartesRedirectionCounter();
        } else {
            errorHandler.log('REDIRECT', 'Usuario con rol estándar (' + userData.IDRol + '), redirigiendo a: ' + redirectTo, null, errorHandler.LOG_LEVEL.INFO);
        }
        
        return redirectTo;
    }
    
    /**
     * Verifica si se debe redirigir a la última ruta visitada
     * @param {string} lastPath - Última ruta visitada
     * @returns {boolean} - Si se debe redirigir a la última ruta
     */
    shouldRedirectToLastPath(lastPath) {
        return lastPath && 
               lastPath !== '/' && 
               lastPath !== '/index.html' && 
               !lastPath.endsWith('/OFICRI/') && 
               !lastPath.endsWith('/OFICRI/index.html');
    }
    
    /**
     * Redirige a la última ruta visitada
     * @param {string} lastPath - Última ruta visitada
     * @returns {boolean} - Si se realizó la redirección
     */
    redirectToLastPath(lastPath) {
        errorHandler.log('REDIRECT', 'Redirigiendo a última ruta: ' + lastPath, null, errorHandler.LOG_LEVEL.INFO);
        
        try {
            localStorage.removeItem('lastPath');
            errorHandler.log('REDIRECT', 'lastPath eliminado de localStorage', null, errorHandler.LOG_LEVEL.DEBUG);
        } catch (storageError) {
            errorHandler.log('REDIRECT', 'Error al eliminar lastPath: ' + storageError.message, null, errorHandler.LOG_LEVEL.WARN);
        }
        
        // Realizar la redirección
        return this.safeRedirect(lastPath);
    }
    
    /**
     * Maneja las redirecciones automáticas según el estado de la sesión
     * @param {boolean} isLoginPage - Si estamos en la página de login
     * @param {Object} userData - Datos del usuario
     * @returns {boolean} - Si se realizó alguna redirección
     */
    handleAutoRedirect(isLoginPage, userData) {
        try {
            // Verificar si estamos exactamente en la página de login
            const isExactlyLoginPage = this.isExactlyLoginPage();
            
            // Verificar si hay redirección en progreso
            if (storageService.isRedirectionInProgress()) {
                return false;
            }
            
            // Realizar redirección si estamos en página de login y no hay redirección previa
            if (isExactlyLoginPage && sessionStorage.getItem('redirectionOccurred') !== 'true') {
                return this.performRedirection(userData);
            } else if (!isExactlyLoginPage) {
                // Reiniciar el flag cuando no estamos en la página de login
                storageService.resetRedirectionFlag();
            }
            
            return false;
        } catch (error) {
            errorHandler.handleError('REDIRECT', error, 'manejar redirección automática', false);
            return false;
        }
    }
    
    /**
     * Realiza la redirección según el rol del usuario o a la última ruta
     * @param {Object} userData - Datos del usuario 
     * @returns {boolean} - Si se realizó la redirección
     */
    performRedirection(userData) {
        errorHandler.log('REDIRECT', 'Condiciones de redirección cumplidas - iniciando redirección', null, errorHandler.LOG_LEVEL.INFO);
        
        // Marcar que hay una redirección en progreso
        storageService.setRedirectionFlags();
        
        // Verificar si hay una ruta anterior guardada
        const lastPath = localStorage.getItem('lastPath');
        
        let redirected = false;
        
        if (this.shouldRedirectToLastPath(lastPath)) {
            redirected = this.redirectToLastPath(lastPath);
        } else {
            redirected = this.redirectBasedOnRole(userData);
        }
        
        // Limpiar el flag de redirección en progreso después de un tiempo
        storageService.scheduleRedirectionFlagCleanup();
        
        return redirected;
    }
    
    /**
     * Redirige basado en el rol del usuario
     * @param {Object} userData - Datos del usuario
     * @returns {boolean} - Si se realizó la redirección
     */
    redirectBasedOnRole(userData) {
        // Determinar la ruta según el rol
        const redirectTo = this.getRedirectUrlByRole(userData);
        
        // Realizar la redirección
        return this.safeRedirect(redirectTo);
    }
    
    /**
     * Redirige de forma segura a una URL
     * @param {string} url - URL a la que redirigir
     * @returns {boolean} - Si la redirección tuvo éxito
     */
    safeRedirect(url) {
        try {
            errorHandler.log('REDIRECT', 'Iniciando redirección a: ' + url, null, errorHandler.LOG_LEVEL.INFO);
            
            // Limpiar contadores específicos si es necesario
            this.cleanupCountersBeforeRedirect(url);
            
            // Normalizar la URL para asegurar un formato correcto
            const normalizedUrl = this.normalizeUrl(url);
            
            // Log del contexto de la redirección
            this.logRedirectionContext(normalizedUrl);
            
            // Intentar redirección con varios métodos en cascada
            return this.attemptRedirectionWithFallbacks(normalizedUrl);
        } catch (error) {
            errorHandler.handleError('REDIRECT', error, 'redirección segura', false);
            return false;
        }
    }
    
    /**
     * Limpia contadores específicos antes de la redirección
     * @param {string} url - URL a la que se va a redirigir
     */
    cleanupCountersBeforeRedirect(url) {
        // Detección específica para Mesa de Partes
        if (url.includes('mesaPartes.html')) {
            // Asegurarse que el contador está limpio para evitar falsos positivos
            storageService.clearMesaPartesRedirectionCounter();
        }
    }
    
    /**
     * Normaliza una URL para asegurar un formato correcto
     * @param {string} url - URL a normalizar
     * @returns {string} - URL normalizada
     */
    normalizeUrl(url) {
        let normalizedUrl = url;
        
        // Verificar si es una ruta relativa que necesita ajuste
        if (url.startsWith('/') && !url.startsWith('//')) {
            // Construir la URL completa basada en el origen
            const base = window.location.origin;
            normalizedUrl = `${base}${url}`;
            errorHandler.log('REDIRECT', 'URL normalizada: ' + normalizedUrl, null, errorHandler.LOG_LEVEL.DEBUG);
        }
        
        return normalizedUrl;
    }
    
    /**
     * Registra información del contexto de redirección
     * @param {string} normalizedUrl - URL normalizada
     */
    logRedirectionContext(normalizedUrl) {
        errorHandler.log('REDIRECT', 'Contexto de redirección', {
            desde: window.location.href,
            hacia: normalizedUrl,
            origen: window.location.origin
        }, errorHandler.LOG_LEVEL.DEBUG);
    }
    
    /**
     * Intenta realizar la redirección usando varios métodos con fallbacks
     * @param {string} url - URL a la que redirigir
     * @returns {boolean} - Si la redirección tuvo éxito
     */
    attemptRedirectionWithFallbacks(url) {
        // Método 1: window.location.replace (más limpio)
        if (this.redirectUsingReplace(url)) {
            return true;
        }
        
        // Método 2: window.location.href
        if (this.redirectUsingHref(url)) {
            return true;
        }
        
        // Método 3: Crear un elemento <a> para la navegación
        if (this.redirectUsingLinkElement(url)) {
            return true;
        }
        
        // Método 4: Último intento desesperado con asignación directa
        return this.redirectUsingDirectAssignment(url);
    }
    
    /**
     * Intenta redirección usando window.location.replace
     * @param {string} url - URL a la que redirigir
     * @returns {boolean} - Si la redirección tuvo éxito
     */
    redirectUsingReplace(url) {
        try {
            errorHandler.log('REDIRECT', 'Utilizando window.location.replace como método principal', null, errorHandler.LOG_LEVEL.DEBUG);
            window.location.replace(url);
            return true;
        } catch (replaceError) {
            errorHandler.log('REDIRECT', 'Error con window.location.replace: ' + replaceError.message, null, errorHandler.LOG_LEVEL.WARN);
            return false;
        }
    }
    
    /**
     * Intenta redirección usando window.location.href
     * @param {string} url - URL a la que redirigir
     * @returns {boolean} - Si la redirección tuvo éxito
     */
    redirectUsingHref(url) {
        try {
            errorHandler.log('REDIRECT', 'Intentando window.location.href como alternativa', null, errorHandler.LOG_LEVEL.DEBUG);
            window.location.href = url;
            return true;
        } catch (hrefError) {
            errorHandler.log('REDIRECT', 'Error con window.location.href: ' + hrefError.message, null, errorHandler.LOG_LEVEL.WARN);
            return false;
        }
    }
    
    /**
     * Intenta redirección creando y haciendo clic en un elemento <a>
     * @param {string} url - URL a la que redirigir
     * @returns {boolean} - Si la redirección tuvo éxito
     */
    redirectUsingLinkElement(url) {
        try {
            errorHandler.log('REDIRECT', 'Intentando navegación con elemento <a> como último recurso', null, errorHandler.LOG_LEVEL.DEBUG);
            const link = document.createElement('a');
            link.href = url;
            link.style.display = 'none';
            document.body.appendChild(link);
            
            // Simular clic
            link.click();
            
            // Limpiar
            setTimeout(() => {
                try {
                    document.body.removeChild(link);
                } catch (e) {
                    // Ignorar errores de limpieza
                }
            }, 100);
            
            return true;
        } catch (linkError) {
            errorHandler.log('REDIRECT', 'Error con elemento <a>: ' + linkError.message, null, errorHandler.LOG_LEVEL.ERROR);
            return false;
        }
    }
    
    /**
     * Intenta redirección mediante asignación directa a window.location
     * @param {string} url - URL a la que redirigir
     * @returns {boolean} - Si la redirección tuvo éxito
     */
    redirectUsingDirectAssignment(url) {
        try {
            errorHandler.log('REDIRECT', 'Último intento: asignación directa a window.location', null, errorHandler.LOG_LEVEL.DEBUG);
            window.location = url;
            return true;
        } catch (finalError) {
            errorHandler.log('REDIRECT', 'Todos los métodos de redirección fallaron', null, errorHandler.LOG_LEVEL.ERROR);
            return false;
        }
    }
}

// Singleton
const redirectionService = new RedirectionService();
export default redirectionService; 