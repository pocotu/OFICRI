/**
 * Servicio de Almacenamiento
 * Proporciona funciones para gestionar el almacenamiento local y de sesión
 */

import * as errorHandler from '../utils/errorHandler.js';

class StorageService {
    constructor() {
        this.tokenKey = 'token';
        this.userKey = 'user';
        
        errorHandler.log('STORAGE', 'Servicio de almacenamiento inicializado', null, errorHandler.LOG_LEVEL.DEBUG);
    }

    /**
     * Guarda los datos de sesión en el almacenamiento
     * @param {string} token - Token de autenticación
     * @param {Object} user - Datos del usuario
     * @returns {boolean} - Si se guardó correctamente
     */
    saveToStorage(token, user) {
        try {
            // Verificar que el token y usuario sean válidos
            if (!token || typeof token !== 'string') {
                errorHandler.log('STORAGE', 'Error al guardar: token inválido', null, errorHandler.LOG_LEVEL.ERROR);
                return false;
            }
            
            if (!user || typeof user !== 'object') {
                errorHandler.log('STORAGE', 'Error al guardar: usuario inválido', null, errorHandler.LOG_LEVEL.ERROR);
                return false;
            }
            
            // Convertir usuario a string para almacenamiento
            const userStr = JSON.stringify(user);
            errorHandler.log('STORAGE', 'Guardando sesión - token: ' + token.substring(0, 15) + '...', null, errorHandler.LOG_LEVEL.DEBUG);
            
            // Guardar en ambos almacenamientos
            const localSaved = this.saveToSpecificStorage('localStorage', localStorage, token, userStr);
            const sessionSaved = this.saveToSpecificStorage('sessionStorage', sessionStorage, token, userStr);
            
            return localSaved || sessionSaved;
        } catch (error) {
            errorHandler.handleError('STORAGE', error, 'guardar en almacenamiento', false);
            return false;
        }
    }
    
    /**
     * Guarda datos en un almacenamiento específico
     * @param {string} storageName - Nombre del almacenamiento para logs
     * @param {Storage} storage - Objeto de almacenamiento (localStorage o sessionStorage)
     * @param {string} token - Token a guardar
     * @param {string} userStr - String con los datos del usuario
     * @returns {boolean} - Si se guardó correctamente
     */
    saveToSpecificStorage(storageName, storage, token, userStr) {
        try {
            storage.setItem(this.tokenKey, token);
            storage.setItem(this.userKey, userStr);
            
            // Verificar que se guardó correctamente
            const savedToken = storage.getItem(this.tokenKey);
            const savedUser = storage.getItem(this.userKey);
            
            if (savedToken && savedUser) {
                errorHandler.log('STORAGE', `Datos guardados correctamente en ${storageName}`, null, errorHandler.LOG_LEVEL.DEBUG);
                return true;
            } else {
                errorHandler.log('STORAGE', `Error al verificar datos guardados en ${storageName}`, null, errorHandler.LOG_LEVEL.WARN);
                return false;
            }
        } catch (e) {
            errorHandler.log('STORAGE', `Error al guardar en ${storageName}: ${e.message}`, null, errorHandler.LOG_LEVEL.WARN);
            return false;
        }
    }
    
    /**
     * Obtiene un elemento del almacenamiento de forma segura
     * @param {string} key - Clave del elemento a obtener
     * @returns {string|null} - Valor del elemento o null si no existe
     */
    safeGetItem(key) {
        try {
            // Intentar obtener del localStorage primero
            let value = localStorage.getItem(key);
            
            // Si no está en localStorage, intentar en sessionStorage
            if (!value) {
                value = sessionStorage.getItem(key);
            }
            
            return value;
        } catch (error) {
            errorHandler.handleError('STORAGE', error, 'obtener elemento de almacenamiento', false);
            return null;
        }
    }
    
    /**
     * Obtiene el token de autenticación actual
     * @returns {string|null} - Token de autenticación o null si no hay token
     */
    getToken() {
        try {
            errorHandler.log('STORAGE', 'Obteniendo token de autenticación', null, errorHandler.LOG_LEVEL.DEBUG);
            
            // Intentar obtener desde localStorage primero
            let token = localStorage.getItem(this.tokenKey);
            
            // Si no está en localStorage, intentar en sessionStorage
            if (!token) {
                token = sessionStorage.getItem(this.tokenKey);
                
                if (token) {
                    errorHandler.log('STORAGE', 'Token obtenido de sessionStorage', null, errorHandler.LOG_LEVEL.DEBUG);
                }
            } else {
                errorHandler.log('STORAGE', 'Token obtenido de localStorage', null, errorHandler.LOG_LEVEL.DEBUG);
            }
            
            if (!token) {
                errorHandler.log('STORAGE', 'No se encontró token de autenticación', null, errorHandler.LOG_LEVEL.WARN);
            }
            
            return token;
        } catch (error) {
            errorHandler.handleError('STORAGE', error, 'obtener token', false);
            return null;
        }
    }
    
    /**
     * Verifica que el token se haya guardado correctamente
     * @returns {boolean} - Si el token existe en almacenamiento
     */
    verifyTokenStorage() {
        const tokenVerificacion = localStorage.getItem(this.tokenKey) || sessionStorage.getItem(this.tokenKey);
        
        if (!tokenVerificacion) {
            errorHandler.log('STORAGE', 'ADVERTENCIA: Verificación de token guardado falló', null, errorHandler.LOG_LEVEL.WARN);
            return false;
        } else {
            errorHandler.log('STORAGE', 'Verificación de token guardado exitosa', null, errorHandler.LOG_LEVEL.DEBUG);
            return true;
        }
    }
    
    /**
     * Limpia el localStorage
     */
    clearLocalStorage() {
        try {
            errorHandler.log('STORAGE', 'Limpiando localStorage', null, errorHandler.LOG_LEVEL.DEBUG);
            // Limpiar elementos específicos
            localStorage.removeItem(this.tokenKey);
            localStorage.removeItem(this.userKey);
            localStorage.removeItem('redirectionOccurred');
            // Opcionalmente, limpiar todo localStorage
            // localStorage.clear();
            errorHandler.log('STORAGE', 'localStorage limpiado correctamente', null, errorHandler.LOG_LEVEL.DEBUG);
        } catch (e) {
            errorHandler.log('STORAGE', 'Error al limpiar localStorage: ' + e.message, null, errorHandler.LOG_LEVEL.WARN);
        }
    }
    
    /**
     * Limpia el sessionStorage
     */
    clearSessionStorage() {
        try {
            errorHandler.log('STORAGE', 'Limpiando sessionStorage', null, errorHandler.LOG_LEVEL.DEBUG);
            // Limpiar elementos específicos
            sessionStorage.removeItem(this.tokenKey);
            sessionStorage.removeItem(this.userKey);
            sessionStorage.removeItem('redirectionOccurred');
            // Opcionalmente, limpiar todo sessionStorage
            // sessionStorage.clear();
            errorHandler.log('STORAGE', 'sessionStorage limpiado correctamente', null, errorHandler.LOG_LEVEL.DEBUG);
        } catch (e) {
            errorHandler.log('STORAGE', 'Error al limpiar sessionStorage: ' + e.message, null, errorHandler.LOG_LEVEL.WARN);
        }
    }
    
    /**
     * Establece el flag de redirección
     */
    setRedirectionFlags() {
        try {
            sessionStorage.setItem('redirectionInProgress', 'true');
            sessionStorage.setItem('redirectionOccurred', 'true');
            errorHandler.log('STORAGE', 'Flag de redirección establecido en sessionStorage', null, errorHandler.LOG_LEVEL.DEBUG);
            return true;
        } catch (storageError) {
            errorHandler.log('STORAGE', 'Error al establecer flags de redirección: ' + storageError.message, null, errorHandler.LOG_LEVEL.ERROR);
            return false;
        }
    }
    
    /**
     * Reinicia el flag de redirección
     */
    resetRedirectionFlag() {
        try {
            sessionStorage.removeItem('redirectionOccurred');
            errorHandler.log('STORAGE', 'Flag de redirección reiniciado', null, errorHandler.LOG_LEVEL.DEBUG);
            return true;
        } catch (e) {
            errorHandler.log('STORAGE', 'Error al reiniciar flag de redirección: ' + e.message, null, errorHandler.LOG_LEVEL.WARN);
            return false;
        }
    }
    
    /**
     * Verifica si hay una redirección en progreso
     * @returns {boolean} - Si hay una redirección en progreso
     */
    isRedirectionInProgress() {
        const redirectionInProgress = sessionStorage.getItem('redirectionInProgress');
        if (redirectionInProgress === 'true') {
            errorHandler.log('STORAGE', 'Hay una redirección en progreso', null, errorHandler.LOG_LEVEL.WARN);
            return true;
        }
        return false;
    }
    
    /**
     * Limpia el contador de redirección para Mesa de Partes
     */
    clearMesaPartesRedirectionCounter() {
        try {
            sessionStorage.removeItem('mp_redirection_count');
            errorHandler.log('STORAGE', 'Contador de redirecciones de Mesa de Partes limpiado', null, errorHandler.LOG_LEVEL.DEBUG);
            return true;
        } catch (e) {
            errorHandler.log('STORAGE', 'Error al limpiar contador de redirecciones MP: ' + e.message, null, errorHandler.LOG_LEVEL.WARN);
            return false;
        }
    }
    
    /**
     * Programa la limpieza del flag de redirección en progreso
     */
    scheduleRedirectionFlagCleanup() {
        setTimeout(() => {
            try {
                sessionStorage.removeItem('redirectionInProgress');
                errorHandler.log('STORAGE', 'Flag de redirección en progreso eliminado', null, errorHandler.LOG_LEVEL.DEBUG);
            } catch (e) {
                errorHandler.log('STORAGE', 'Error al eliminar flag de redirección en progreso: ' + e.message, null, errorHandler.LOG_LEVEL.WARN);
            }
        }, 5000); // 5 segundos debería ser suficiente para cualquier redirección
    }
}

// Singleton
const storageService = new StorageService();
export default storageService; 