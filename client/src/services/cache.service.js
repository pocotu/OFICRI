/**
 * Servicio de Caché
 * Proporciona funciones para limpiar la caché del navegador
 */

import * as errorHandler from '../utils/errorHandler.js';

class CacheService {
    constructor() {
        errorHandler.log('CACHE', 'Servicio de caché inicializado', null, errorHandler.LOG_LEVEL.DEBUG);
    }

    /**
     * Limpia las cookies del navegador
     */
    clearCookies() {
        try {
            errorHandler.log('CACHE', 'Limpiando cookies', null, errorHandler.LOG_LEVEL.DEBUG);
            
            // Método 1: Limpiar cookies específicas
            this.clearSpecificCookies();
            
            // Método 2: Limpiar todas las cookies (más agresivo)
            this.clearAllCookies();
            
            errorHandler.log('CACHE', 'Cookies limpiadas correctamente', null, errorHandler.LOG_LEVEL.DEBUG);
        } catch (e) {
            errorHandler.log('CACHE', 'Error al limpiar cookies: ' + e.message, null, errorHandler.LOG_LEVEL.WARN);
        }
    }
    
    /**
     * Limpia cookies específicas relacionadas con la autenticación
     */
    clearSpecificCookies() {
        const cookiesToClear = ['token', 'user', 'redirectionOccurred'];
        const paths = ['/', '/admin', '/admin.html', '/dashboard', '/dashboard.html', '/index.html', ''];
        
        cookiesToClear.forEach(name => {
            paths.forEach(path => {
                document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path};`;
            });
        });
    }
    
    /**
     * Limpia todas las cookies
     */
    clearAllCookies() {
        document.cookie.split(';').forEach(cookie => {
            const name = cookie.trim().split('=')[0];
            if (name) {
                document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
            }
        });
    }
    
    /**
     * Intenta limpiar la caché del navegador
     */
    clearBrowserCache() {
        try {
            errorHandler.log('CACHE', 'Intentando limpiar caché del navegador', null, errorHandler.LOG_LEVEL.DEBUG);
            
            // Intentar limpiar caché si el navegador lo soporta
            this.clearCachesAPI();
            
            // Intentar invalidar caché de solicitudes
            this.invalidateFetchCache();
            
            errorHandler.log('CACHE', 'Proceso de limpieza de caché finalizado', null, errorHandler.LOG_LEVEL.DEBUG);
        } catch (e) {
            errorHandler.log('CACHE', 'Error al limpiar caché: ' + e.message, null, errorHandler.LOG_LEVEL.WARN);
        }
    }
    
    /**
     * Limpia la caché usando la API de Caches (si está disponible)
     */
    clearCachesAPI() {
        if (window.caches && typeof window.caches.keys === 'function') {
            // Usar promesa para limpiar caché sin bloquear
            window.caches.keys().then(cacheNames => {
                cacheNames.forEach(cacheName => {
                    window.caches.delete(cacheName)
                        .then(() => errorHandler.log('CACHE', `Caché ${cacheName} eliminada correctamente`, null, errorHandler.LOG_LEVEL.DEBUG))
                        .catch(err => errorHandler.log('CACHE', `Error al eliminar caché ${cacheName}: ${err}`, null, errorHandler.LOG_LEVEL.WARN));
                });
            }).catch(err => {
                errorHandler.log('CACHE', 'Error al enumerar cachés: ' + err, null, errorHandler.LOG_LEVEL.WARN);
            });
        } else {
            errorHandler.log('CACHE', 'API de Cache no disponible en este navegador', null, errorHandler.LOG_LEVEL.DEBUG);
        }
    }
    
    /**
     * Intenta invalidar la caché de fetch para URLs específicas
     */
    invalidateFetchCache() {
        if (window.fetch && typeof window.fetch === 'function') {
            // Esta técnica puede ayudar a invalidar la caché de fetch
            const urls = ['/api/users', '/api/roles', '/api/areas', '/api/auth/status'];
            urls.forEach(url => {
                try {
                    fetch(url, { 
                        method: 'HEAD', 
                        cache: 'no-store',
                        headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' }
                    }).catch(() => {});
                } catch (fetchError) {
                    // Ignorar errores, solo estamos intentando invalidar la caché
                }
            });
        }
    }
    
    /**
     * Realiza una limpieza completa del almacenamiento y caché del navegador
     * @param {Object} storageService - Servicio de almacenamiento para limpiar localStorage y sessionStorage
     */
    clearAll(storageService) {
        try {
            errorHandler.log('CACHE', 'Iniciando limpieza completa de almacenamiento y caché', null, errorHandler.LOG_LEVEL.INFO);
            
            // Limpiar almacenamiento
            storageService.clearLocalStorage();
            storageService.clearSessionStorage();
            
            // Limpiar cookies y caché
            this.clearCookies();
            this.clearBrowserCache();
            
            errorHandler.log('CACHE', 'Limpieza completa finalizada', null, errorHandler.LOG_LEVEL.INFO);
            
            return true;
        } catch (error) {
            errorHandler.handleError('CACHE', error, 'limpiar almacenamiento y caché', false);
            return false;
        }
    }
}

// Singleton
const cacheService = new CacheService();
export default cacheService; 