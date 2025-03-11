/**
 * Módulo de gestión de sesiones
 * Proporciona funciones específicas para manejo de sesiones (login, logout, verificación)
 */

// Importar el servicio de autenticación (es una instancia ya creada, no una clase)
import authService from './auth.service.js';

console.log('[SESSION-MANAGER-DEBUG] Inicializando módulo sessionManager');
console.log('[SESSION-MANAGER-DEBUG] AuthService importado:', authService ? 'OK' : 'NO');

// Verificar métodos disponibles en authService
if (authService) {
    console.log('[SESSION-MANAGER-DEBUG] Métodos disponibles en authService:', 
        Object.keys(authService).filter(key => typeof authService[key] === 'function'));
}

/**
 * Constantes para las claves de almacenamiento
 */
const STORAGE_KEYS = {
    TOKEN: 'token',
    USER: 'user',
    LAST_PATH: 'lastPath'
};

/**
 * Cierra la sesión del usuario actual y redirige al login
 * Implementación robusta que garantiza la limpieza de todas las formas de almacenamiento
 * @param {boolean} redirect - Si debe redirigir al login (por defecto true)
 * @param {string} redirectUrl - URL a la que redirigir (por defecto '/index.html')
 * @returns {boolean} - true si se completó con éxito, false en caso contrario
 */
export const cerrarSesion = (redirect = true, redirectUrl = '/index.html') => {
    console.log('[SESSION-DEBUG] Iniciando cierre de sesión desde sessionManager');
    
    try {
        // Guardar la última ruta antes de cerrar sesión (si no vamos al login)
        const currentPath = window.location.pathname;
        if (currentPath !== '/' && currentPath !== '/index.html') {
            localStorage.setItem(STORAGE_KEYS.LAST_PATH, currentPath);
        }

        // PASO 1: Intentar usar el servicio de autenticación si está disponible
        let authServiceSuccess = false;
        try {
            if (authService && typeof authService.logout === 'function') {
                console.log('[SESSION-DEBUG] Intentando cerrar sesión con authService');
                // Llamar al método sin redirección, gestionaremos eso nosotros
                authService.logout(false);
                authServiceSuccess = true;
                console.log('[SESSION-DEBUG] Cierre de sesión con authService exitoso');
            }
        } catch (authError) {
            console.warn('[SESSION-DEBUG] Error al usar authService:', authError);
        }

        // PASO 2: Limpieza manual exhaustiva (siempre se ejecuta como refuerzo)
        
        // Limpiar localStorage
        console.log('[SESSION-DEBUG] Limpiando localStorage');
        try {
            localStorage.removeItem(STORAGE_KEYS.TOKEN);
            localStorage.removeItem(STORAGE_KEYS.USER);
            localStorage.removeItem(STORAGE_KEYS.LAST_PATH);
            localStorage.removeItem('redirectionOccurred');
        } catch (localStorageError) {
            console.warn('[SESSION-DEBUG] Error al limpiar localStorage:', localStorageError);
        }
        
        // Limpiar sessionStorage
        console.log('[SESSION-DEBUG] Limpiando sessionStorage');
        try {
            sessionStorage.removeItem(STORAGE_KEYS.TOKEN);
            sessionStorage.removeItem(STORAGE_KEYS.USER);
            sessionStorage.removeItem('redirectionOccurred');
        } catch (sessionStorageError) {
            console.warn('[SESSION-DEBUG] Error al limpiar sessionStorage:', sessionStorageError);
        }
        
        // Limpiar todas las cookies (método exhaustivo)
        console.log('[SESSION-DEBUG] Limpiando cookies');
        try {
            // Método 1: Limpiar cookies específicas con diferentes rutas
            const cookieNames = [STORAGE_KEYS.TOKEN, STORAGE_KEYS.USER, 'redirectionOccurred'];
            const paths = ['/', '/admin.html', '/dashboard.html', '/index.html', ''];
            
            cookieNames.forEach(name => {
                paths.forEach(path => {
                    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path};`;
                });
            });
            
            // Método 2: Limpiar todas las cookies (más agresivo)
            document.cookie.split(';').forEach(function(c) {
                document.cookie = c.trim().split('=')[0] + '=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
            });
            
        } catch (cookieError) {
            console.warn('[SESSION-DEBUG] Error al limpiar cookies:', cookieError);
        }
        
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
                alert('Error al cerrar sesión. Por favor, recarga la página.');
                return false;
            }
        }
        
        console.log('[SESSION-DEBUG] Cierre de sesión completado con éxito');
        return true;
    } catch (error) {
        console.error('[SESSION-DEBUG] Error general en cerrarSesion:', error);
        
        // Último intento en caso de error grave
        if (redirect) {
            try {
                window.location.href = redirectUrl;
            } catch (finalError) {
                console.error('[SESSION-DEBUG] Error final en redirección:', finalError);
                alert('Error al cerrar sesión. Por favor, recarga la página manualmente.');
            }
        }
        return false;
    }
};

/**
 * Verifica si hay una sesión activa
 * @returns {boolean} - true si el usuario está autenticado, false en caso contrario
 */
export const haySesionActiva = () => {
    console.log('[SESSION-DEBUG] Verificando sesión activa');
    
    try {
        // Verificar que authService exista y tenga el método requerido
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
 * Obtiene el usuario actual de la sesión
 * @returns {Object|null} - Objeto con datos del usuario si está autenticado, null en caso contrario
 */
export const obtenerUsuarioActual = () => {
    console.log('[SESSION-DEBUG] Obteniendo usuario actual');
    
    try {
        // Verificar que authService exista y tenga el método requerido
        if (authService && typeof authService.getCurrentUser === 'function') {
            console.log('[SESSION-DEBUG] Usando authService.getCurrentUser()');
            return authService.getCurrentUser();
        } else {
            console.warn('[SESSION-DEBUG] authService.getCurrentUser no disponible, usando método básico');
            
            // Obtención básica
            let userStr = localStorage.getItem(STORAGE_KEYS.USER);
            if (!userStr) {
                userStr = sessionStorage.getItem(STORAGE_KEYS.USER);
            }
            
            if (!userStr) {
                console.log('[SESSION-DEBUG] No se encontraron datos de usuario');
                return null;
            }
            
            try {
                return JSON.parse(userStr);
            } catch (parseError) {
                console.error('[SESSION-DEBUG] Error al parsear datos de usuario:', parseError);
                return null;
            }
        }
    } catch (error) {
        console.error('[SESSION-DEBUG] Error al obtener usuario de sesión:', error);
        return null;
    }
};

/**
 * Obtiene el token de autenticación actual
 * @returns {string|null} - Token de autenticación si existe, null en caso contrario
 */
export const obtenerToken = () => {
    console.log('[SESSION-DEBUG] Obteniendo token');
    
    try {
        // Verificar que authService exista y tenga el método requerido
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
export const actualizarUsuarioSesion = (userData) => {
    if (!userData) return;
    
    try {
        // Obtener usuario actual
        const currentUser = obtenerUsuarioActual();
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
export const limpiarSesion = () => {
    console.log('[SESSION-DEBUG] Limpiando sesión sin redirección');
    
    try {
        // Verificar que authService exista y tenga el método requerido
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
            document.cookie = `${STORAGE_KEYS.TOKEN}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
            document.cookie = `${STORAGE_KEYS.USER}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
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