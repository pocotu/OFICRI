/**
 * Gestor de sesiones - Versión refactorizada
 * Este módulo proporciona funciones para gestionar la sesión de usuario
 * Utiliza la interfaz proporcionada por authService como capa principal,
 * pero también ofrece funcionalidad directa como respaldo
 */

// Las dependencias circulares se manejan mediante importación dinámica
// o accediendo a los objetos en tiempo de ejecución
import * as errorHandler from '../utils/errorHandler.js';

// Inicialización básica
console.log('[SESSION-MANAGER-DEBUG] Inicializando módulo sessionManager');

/**
 * Constantes para las claves de almacenamiento
 */
const STORAGE_KEYS = {
    TOKEN: 'token',
    USER: 'user',
    LAST_PATH: 'lastPath'
};

// Variable para almacenar una referencia al servicio de autenticación
let authServiceRef = null;

// Función para obtener el servicio de autenticación cuando sea necesario
// De esta forma evitamos las dependencias circulares
const getAuthService = async () => {
    if (!authServiceRef) {
        try {
            // Intentar obtener la referencia desde el módulo services usando import dinámico
            const services = await import('./services.js');
            authServiceRef = services.authService;
            
            console.log('[SESSION-MANAGER-DEBUG] AuthService obtenido correctamente:', 
                authServiceRef ? 'OK' : 'NO');
                
            // Verificar métodos disponibles
            if (authServiceRef) {
                console.log('[SESSION-MANAGER-DEBUG] Métodos disponibles en authService:',
                    Object.keys(authServiceRef).filter(key => typeof authServiceRef[key] === 'function'));
            }
        } catch (e) {
            console.error('[SESSION-MANAGER-DEBUG] Error al obtener authService:', e);
            authServiceRef = null;
        }
    }
    return authServiceRef;
};

/**
 * Cierra la sesión del usuario actual y redirige al login
 * Esta función utiliza authService.logout internamente, pero proporciona
 * una capa adicional de robustez en caso de fallos.
 *
 * @param {boolean} redirect - Si debe redirigir al login (por defecto true)
 * @param {string} redirectUrl - URL a la que redirigir (por defecto '/index.html')
 * @returns {Promise<boolean>} - true si se completó con éxito, false en caso contrario
 */
export const cerrarSesion = async (redirect = true, redirectUrl = '/index.html') => {
    console.log('[SESSION-DEBUG] Iniciando cierre de sesión desde sessionManager');

    try {
        // Guardar la última ruta antes de cerrar sesión (si no vamos al login)
        const currentPath = window.location.pathname;
        if (currentPath !== '/' && currentPath !== '/index.html') {
            localStorage.setItem(STORAGE_KEYS.LAST_PATH, currentPath);
        }

        // Intentar obtener el servicio de autenticación
        const authService = await getAuthService();

        // Usar el servicio de autenticación para el logout principal si está disponible
        if (authService && typeof authService.logout === 'function') {
            console.log('[SESSION-DEBUG] Ejecutando authService.logout()');
            
            // Limpiar caché local antes de llamar a authService
            limpiarCacheCompleto();
            
            // Si authService maneja la redirección, no necesitamos hacer nada más
            if (redirect) {
                return authService.logout(redirect, redirectUrl);
            } else {
                // Si no queremos redirección, aseguramos que authService no redirija
                return authService.logout(false);
            }
        } else {
            console.warn('[SESSION-DEBUG] authService.logout no disponible, usando limpieza alternativa');

            // Realizar una limpieza completa del caché y almacenamiento
            limpiarCacheCompleto();

            // PASO 3: Redirigir si es necesario
            if (redirect) {
                console.log(`[SESSION-DEBUG] Redirigiendo a ${redirectUrl}`);

                try {
                    // Usar setTimeout para asegurar que la limpieza se complete antes de redirigir
                    setTimeout(() => {
                        try {
                            window.location.href = redirectUrl;
                        } catch (redirectError) {
                            console.error('[SESSION-DEBUG] Error en redirección con location.href:', redirectError);
                            // Alternativa si falla location.href
                            try {
                                window.location.replace(redirectUrl);
                            } catch (replaceError) {
                                console.error('[SESSION-DEBUG] Error en redirección con location.replace:', replaceError);
                                window.location = redirectUrl; // Último intento
                            }
                        }
                    }, 100);
                } catch (error) {
                    console.error('[SESSION-DEBUG] Error al programar redirección:', error);
                }
            }
        }

        return true;
    } catch (error) {
        console.error('[SESSION-DEBUG] Error general en cerrarSesion:', error);

        // Intentar la limpieza básica incluso si hay error
        limpiarCacheBasico();

        if (redirect) {
            try {
                window.location.href = redirectUrl;
            } catch (e) {}
        }

        return false;
    }
};

/**
 * Realiza una limpieza completa del caché y almacenamiento del navegador
 */
function limpiarCacheCompleto() {
    console.log('[SESSION-DEBUG] Iniciando limpieza completa de caché y almacenamiento');
    
    // Añadir marcador para indicar que venimos de un cierre de sesión
    try {
        console.log('[SESSION-DEBUG] Estableciendo marcador de cierre de sesión');
        sessionStorage.setItem('fromLogout', 'true');
    } catch (e) {
        console.warn('[SESSION-DEBUG] Error al establecer marcador de logout:', e);
    }
    
    // PASO 1: Limpiar localStorage
    try {
        console.log('[SESSION-DEBUG] Limpiando localStorage');
        // Limpiar elementos específicos
        localStorage.removeItem(STORAGE_KEYS.TOKEN);
        localStorage.removeItem(STORAGE_KEYS.USER);
        localStorage.removeItem('redirectionOccurred');
        
        // Otros elementos que podrían estar almacenados
        const keysToRemove = [
            'lastRoute', 'userPreferences', 'themeSettings', 
            'currentView', 'filters', 'sortOrder'
        ];
        
        keysToRemove.forEach(key => {
            try { localStorage.removeItem(key); } catch (e) {}
        });
        
        console.log('[SESSION-DEBUG] localStorage limpiado');
    } catch (localStorageError) {
        console.warn('[SESSION-DEBUG] Error al limpiar localStorage:', localStorageError);
    }

    // PASO 2: Limpiar sessionStorage
    try {
        console.log('[SESSION-DEBUG] Limpiando sessionStorage');
        // Limpiar elementos específicos
        sessionStorage.removeItem(STORAGE_KEYS.TOKEN);
        sessionStorage.removeItem(STORAGE_KEYS.USER);
        sessionStorage.removeItem('redirectionOccurred');
        sessionStorage.removeItem('activePage');
        sessionStorage.removeItem('cachedData');
        
        console.log('[SESSION-DEBUG] sessionStorage limpiado');
    } catch (sessionStorageError) {
        console.warn('[SESSION-DEBUG] Error al limpiar sessionStorage:', sessionStorageError);
    }

    // PASO 3: Limpiar cookies (método exhaustivo)
    try {
        console.log('[SESSION-DEBUG] Limpiando cookies');
        
        // Método 1: Limpiar cookies específicas con diferentes rutas
        const cookieNames = [
            STORAGE_KEYS.TOKEN, STORAGE_KEYS.USER, 'redirectionOccurred',
            'currentView', 'userSettings', 'lastPage'
        ];
        const paths = ['/', '/admin', '/admin.html', '/dashboard', '/dashboard.html', '/index.html', ''];

        cookieNames.forEach(name => {
            paths.forEach(path => {
                document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path};`;
            });
        });

        // Método 2: Limpiar todas las cookies (más agresivo)
        document.cookie.split(';').forEach(function(c) {
            const cookieName = c.trim().split('=')[0];
            if (cookieName) {
                document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
            }
        });
        
        console.log('[SESSION-DEBUG] Cookies limpiadas');
    } catch (cookieError) {
        console.warn('[SESSION-DEBUG] Error al limpiar cookies:', cookieError);
    }
    
    // PASO 4: Limpiar caché del navegador si es posible
    try {
        console.log('[SESSION-DEBUG] Intentando limpiar caché del navegador');
        
        // Intentar limpiar caché si el navegador lo soporta
        if (window.caches && typeof window.caches.keys === 'function') {
            window.caches.keys().then(cacheNames => {
                cacheNames.forEach(cacheName => {
                    window.caches.delete(cacheName)
                        .then(() => console.log(`[SESSION-DEBUG] Caché ${cacheName} eliminada`))
                        .catch(err => console.warn(`[SESSION-DEBUG] Error al eliminar caché ${cacheName}:`, err));
                });
            }).catch(err => {
                console.warn('[SESSION-DEBUG] Error al enumerar cachés:', err);
            });
        } else {
            console.log('[SESSION-DEBUG] API de Cache no disponible en este navegador');
        }
        
        // Invalidar caché de solicitudes fetch
        if (window.fetch && typeof window.fetch === 'function') {
            const urls = ['/api/users', '/api/roles', '/api/areas', '/api/documents', '/api/auth/status'];
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
        
        // Invalidar caché de Service Worker si existe
        if (navigator.serviceWorker && navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage({ type: 'CLEAR_CACHE' });
        }
        
        console.log('[SESSION-DEBUG] Proceso de limpieza de caché completado');
    } catch (cacheError) {
        console.warn('[SESSION-DEBUG] Error al limpiar caché:', cacheError);
    }
    
    console.log('[SESSION-DEBUG] Limpieza completa finalizada');
}

/**
 * Realiza una limpieza básica en caso de error
 */
function limpiarCacheBasico() {
    try {
        localStorage.removeItem(STORAGE_KEYS.TOKEN);
        localStorage.removeItem(STORAGE_KEYS.USER);
        sessionStorage.removeItem(STORAGE_KEYS.TOKEN);
        sessionStorage.removeItem(STORAGE_KEYS.USER);
        
        // Limpiar las cookies principales
        document.cookie = `${STORAGE_KEYS.TOKEN}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
        document.cookie = `${STORAGE_KEYS.USER}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    } catch (e) {
        console.error('[SESSION-DEBUG] Error en limpieza básica:', e);
    }
}

/**
 * Verifica si hay una sesión activa
 * @returns {Promise<boolean>} - true si el usuario está autenticado, false en caso contrario
 */
export const haySesionActiva = async () => {
    console.log('[SESSION-DEBUG] Verificando sesión activa');

    try {
        // Verificar que authService exista y tenga el método requerido
        const authService = await getAuthService();
        console.log('[SESSION-DEBUG] authService disponible:', authService ? 'SÍ' : 'NO');

        if (authService && typeof authService.isAuthenticated === 'function') {
            console.log('[SESSION-DEBUG] Usando authService.isAuthenticated()');
            return authService.isAuthenticated();
        } else {
            console.warn('[SESSION-DEBUG] authService.isAuthenticated no disponible, usando verificación básica');
            // Verificación básica
            const token = localStorage.getItem(STORAGE_KEYS.TOKEN) || sessionStorage.getItem(STORAGE_KEYS.TOKEN);
            const userStr = localStorage.getItem(STORAGE_KEYS.USER) || sessionStorage.getItem(STORAGE_KEYS.USER);
            if (!token || !userStr) {
                console.log('[SESSION-DEBUG] No hay token o datos de usuario');
                return false;
            }

            return true;
        }
    } catch (error) {
        console.error('[SESSION-DEBUG] Error al verificar sesión:', error);
        return false;
    }
};

/**
 * Obtiene el usuario actual desde el servicio de autenticación.
 * Esta función es un proxy a authService.getCurrentUser()
 *
 * @returns {Promise<Object|null>} - Datos del usuario o null si no hay sesión
 */
export const obtenerUsuarioActual = async () => {
    try {
        // Verificar que authService exista y tenga el método requerido
        const authService = await getAuthService();
        
        if (authService && typeof authService.getCurrentUser === 'function') {
            return authService.getCurrentUser();
        } else {
            console.warn('[SESSION-DEBUG] authService.getCurrentUser no disponible, usando método básico');
            // Obtención básica
            const userStr = localStorage.getItem(STORAGE_KEYS.USER) || sessionStorage.getItem(STORAGE_KEYS.USER);
            if (!userStr) return null;
            
            try {
                return JSON.parse(userStr);
            } catch (e) {
                console.error('[SESSION-DEBUG] Error al parsear datos de usuario:', e);
                return null;
            }
        }
    } catch (error) {
        console.error('[SESSION-DEBUG] Error al obtener usuario actual:', error);
        return null;
    }
};

/**
 * Obtiene el token de autenticación actual
 * @returns {Promise<string|null>} - Token de autenticación si existe, null en caso contrario
 */
export const obtenerToken = async () => {
    console.log('[SESSION-DEBUG] Obteniendo token');

    try {
        // Verificar que authService exista y tenga el método requerido
        const authService = await getAuthService();
        
        if (authService && typeof authService.getToken === 'function') {
            console.log('[SESSION-DEBUG] Usando authService.getToken()');
            return authService.getToken();
        } else {
            console.warn('[SESSION-DEBUG] authService.getToken no disponible, usando método básico');
            // Obtención básica
            const token = localStorage.getItem(STORAGE_KEYS.TOKEN) ||
                            sessionStorage.getItem(STORAGE_KEYS.TOKEN);

            return token;
        }
    } catch (error) {
        console.error('[SESSION-DEBUG] Error al obtener token:', error);
        return null;
    }
};

/**
 * Actualiza los datos del usuario en la sesión
 * @param {Object} userData - Datos actualizados del usuario
 */
export const actualizarUsuarioSesion = async (userData) => {
    if (!userData) return;

    try {
        // Obtener usuario actual
        const currentUser = await obtenerUsuarioActual();
        if (!currentUser) {
            console.warn('No hay usuario en sesión para actualizar');
            return;
        }

        // Fusionar datos actuales con los nuevos
        const updatedUser = { ...currentUser, ...userData };

        // Validar datos actualizados
        if (!updatedUser.IDUsuario || !updatedUser.IDRol) {
            console.error('Datos de usuario inválidos después de la actualización');
            return;
        }

        // Guardar usuario actualizado en ambos storages
        const userStr = JSON.stringify(updatedUser);
        localStorage.setItem(STORAGE_KEYS.USER, userStr);
        sessionStorage.setItem(STORAGE_KEYS.USER, userStr);
    } catch (error) {
        console.error('Error al actualizar usuario en sesión:', error);
    }
};

/**
 * Limpia todos los datos de la sesión
 */
export const limpiarSesion = async () => {
    console.log('[SESSION-DEBUG] Limpiando sesión sin redirección');

    try {
        // Verificar que authService exista y tenga el método requerido
        const authService = await getAuthService();
        
        if (authService && typeof authService._clearStorage === 'function') {
            console.log('[SESSION-DEBUG] Usando authService._clearStorage()');
            authService._clearStorage();
        } else {
            console.warn('[SESSION-DEBUG] authService._clearStorage no disponible, usando método básico');
            // Limpieza básica
            localStorage.removeItem(STORAGE_KEYS.TOKEN);
            localStorage.removeItem(STORAGE_KEYS.USER);
            sessionStorage.removeItem(STORAGE_KEYS.TOKEN);
            sessionStorage.removeItem(STORAGE_KEYS.USER);
            // Intentar limpiar cookies básicas
        }
    } catch (error) {
        console.error('[SESSION-DEBUG] Error al limpiar sesión:', error);
    }
};

// Exportación por defecto para permitir importación directa
export default {
    cerrarSesion,
    haySesionActiva,
    obtenerUsuarioActual,
    obtenerToken,
    actualizarUsuarioSesion,
    limpiarSesion
}; 