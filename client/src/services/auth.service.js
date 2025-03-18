/**
 * Servicio de Autenticación
 * Proporciona funciones para autenticación y gestión de sesiones
 */

import apiService from './api.service.js';
import * as errorHandler from '../utils/errorHandler.js';
import storageService from './storage.service.js';
import redirectionService from './redirection.service.js';
import cacheService from './cache.service.js';

class AuthService {
    constructor() {
        this.tokenKey = storageService.tokenKey;
        this.userKey = storageService.userKey;
        this.isCheckingAuth = false;
        
        errorHandler.log('AUTH', 'Servicio de autenticación inicializado', null, errorHandler.LOG_LEVEL.DEBUG);
    }

    /**
     * Realiza el login de un usuario
     * @param {string} codigoCIP - Código CIP del usuario
     * @param {string} password - Contraseña del usuario
     * @returns {Promise<Object>} - Objeto con {success: true, user: datos} o {success: false, message: error}
     */
    async login(codigoCIP, password) {
        try {
            errorHandler.log('AUTH', 'Iniciando login para CIP: ' + codigoCIP, null, errorHandler.LOG_LEVEL.INFO);
            
            // Limpiar cualquier sesión existente, pero sin redireccionar
            cacheService.clearAll(storageService);
            
            // Realizar la petición de login
            const data = await this._executeLoginRequest(codigoCIP, password);
            
            // Validar y extraer los datos de respuesta
            const { token, user } = this._extractLoginResponseData(data);
            
            // Guardar datos en almacenamiento
            const storageSaved = storageService.saveToStorage(token, user);
            if (!storageSaved) {
                throw new Error('Error al guardar datos de sesión en el almacenamiento');
            }
            
            // Normalizar datos del usuario
            const userData = this.normalizeUserData(user);
            
            // Verificar almacenamiento de token
            storageService.verifyTokenStorage();
            
            // Determinar URL de redirección según el rol
            const redirectTo = redirectionService.getRedirectUrlByRole(userData);
            
            // Registrar login exitoso
            errorHandler.log('AUTH', 'Login completado con éxito para: ' + userData.Nombres, 
                { idUsuario: userData.IDUsuario, idRol: userData.IDRol }, 
                errorHandler.LOG_LEVEL.INFO);
            
            // Devolver objeto con toda la información necesaria para el cliente
            return {
                success: true,
                user: userData,
                token: token,
                redirectTo: redirectTo
            };
        } catch (error) {
            errorHandler.handleError('AUTH', error, 'login', true);
            
            // Devolver objeto con formato compatible con el código existente
            return {
                success: false,
                message: error.message || 'Error en la autenticación'
            };
        }
    }
    
    /**
     * Ejecuta la petición de login al servidor
     * @param {string} codigoCIP - Código CIP del usuario
     * @param {string} password - Contraseña del usuario
     * @returns {Promise<Object>} - Datos de la respuesta
     * @private
     */
    async _executeLoginRequest(codigoCIP, password) {
            errorHandler.log('AUTH', 'Enviando petición a /auth/login', { codigoCIP }, errorHandler.LOG_LEVEL.DEBUG);
        
            const data = await apiService.post('/auth/login', { 
                codigoCIP: codigoCIP.trim(), 
                password: password.trim() 
            }, false);
            
            errorHandler.log('AUTH', 'Respuesta de API recibida', { 
                tieneToken: data && data.token ? 'SÍ' : 'NO',
                tieneUser: data && data.user ? 'SÍ' : 'NO',
                status: data && data.status,
                mensaje: data && data.message
            }, errorHandler.LOG_LEVEL.DEBUG);
            
            if (!data) {
                throw new Error('Respuesta vacía del servidor');
            }
            
        return data;
    }
    
    /**
     * Extrae y valida token y datos de usuario de la respuesta
     * @param {Object} data - Datos de la respuesta
     * @returns {Object} - Objeto con token y user
     * @private
     */
    _extractLoginResponseData(data) {
            // Comprobar si la respuesta tiene una estructura anidada (algunos APIs lo devuelven así)
            let token = data.token;
            let user = data.user;
            
            if (!token && data.data) {
                // Intentar encontrar el token en data.data (estructura común en algunas APIs)
                token = data.data.token;
                errorHandler.log('AUTH', 'Token encontrado en data.data', null, errorHandler.LOG_LEVEL.DEBUG);
            }
            
            if (!user && data.data) {
                // Intentar encontrar el usuario en data.data
                user = data.data.user || data.data;
                errorHandler.log('AUTH', 'Usuario encontrado en data.data', null, errorHandler.LOG_LEVEL.DEBUG);
            }
            
            if (!token) {
                errorHandler.log('AUTH', 'Error: token no encontrado en la respuesta', data, errorHandler.LOG_LEVEL.ERROR);
                throw new Error('Token no proporcionado por el servidor');
            }
            
            if (!user) {
                errorHandler.log('AUTH', 'Error: datos de usuario no encontrados en la respuesta', data, errorHandler.LOG_LEVEL.ERROR);
                throw new Error('Datos de usuario no proporcionados por el servidor');
            }
            
        return { token, user };
    }

    /**
     * Cierra la sesión del usuario actual
     * @param {boolean} redirect - Si debe redirigir al login
     * @param {string} redirectUrl - URL a la que redirigir
     * @returns {boolean} - Si se cerró la sesión con éxito
     */
    logout(redirect = true, redirectUrl = '/index.html') {
        try {
            errorHandler.log('AUTH', 'Cerrando sesión', null, errorHandler.LOG_LEVEL.INFO);
            
            // Guardar la ruta actual para después del login si es necesario
            if (redirect && window.location.pathname !== '/' && window.location.pathname !== '/index.html') {
                localStorage.setItem('lastPath', window.location.pathname);
            }
            
            // Limpiar almacenamiento y caché
            cacheService.clearAll(storageService);
            
            // Redirigir si es necesario
            if (redirect) {
                redirectionService.safeRedirect(redirectUrl);
            }
            
            return true;
        } catch (error) {
            errorHandler.handleError('AUTH', error, 'logout', false);
            
            // Último intento de redirección en caso de error
            if (redirect) {
                try {
                    window.location.href = redirectUrl;
                } catch (e) {
                    // Ignorar errores en este punto
                }
            }
            
            return false;
        }
    }

    /**
     * Verifica si hay un usuario autenticado
     * @param {boolean} checkRedirect - Si debe redirigir según la página actual
     * @returns {boolean} - Si hay un usuario autenticado
     */
    isAuthenticated(checkRedirect = false) {
        try {
            // Evitar múltiples verificaciones simultáneas
            if (this.isCheckingAuth) {
                errorHandler.log('AUTH', 'Ya hay una verificación en progreso, omitiendo...', null, errorHandler.LOG_LEVEL.DEBUG);
                return false;
            }
            this.isCheckingAuth = true;
            
            // Verificar token
            const token = storageService.getToken();
            
            // Si no hay token, no está autenticado
            if (!token) {
                errorHandler.log('AUTH', 'No hay token de autenticación, considerando sesión no válida', null, errorHandler.LOG_LEVEL.INFO);
                
                // Si se solicita redirección, redirigir a la página de login
                if (checkRedirect && !redirectionService.isExactlyLoginPage()) {
                    errorHandler.log('AUTH', 'Redirigiendo a login debido a sesión inválida', null, errorHandler.LOG_LEVEL.INFO);
                    this.logout(true);
                }
                
                this.isCheckingAuth = false;
                return false;
            }
            
            // Obtener datos de usuario
            const userData = this.getCurrentUser();
            
            // Verificar si se tienen datos de usuario
            if (!userData) {
                errorHandler.log('AUTH', 'Token encontrado pero datos de usuario faltantes o inválidos', null, errorHandler.LOG_LEVEL.WARN);
                
                // Si se solicita verificación con redirección, cerrar sesión y redirigir
                if (checkRedirect) {
                    errorHandler.log('AUTH', 'Cerrando sesión debido a inconsistencia de datos', null, errorHandler.LOG_LEVEL.INFO);
                    this.logout(true);
                }
                
                this.isCheckingAuth = false;
                return false;
            }
            
            // Si llegamos aquí, el usuario está autenticado
            errorHandler.log('AUTH', 'Verificación exitosa - usuario autenticado: ' + userData.Nombres, null, errorHandler.LOG_LEVEL.INFO);
            
            // Si se solicita verificación con redirección, manejar redirección automática
            if (checkRedirect) {
                redirectionService.handleAutoRedirect(redirectionService.isExactlyLoginPage(), userData);
            }
            
            this.isCheckingAuth = false;
            return true;
        } catch (error) {
            errorHandler.handleError('AUTH', error, 'verificar autenticación', false);
            this.isCheckingAuth = false;
            return false;
        }
    }

    /**
     * Verifica la sesión actual y devuelve los datos del usuario y token si es válida
     * @returns {Object|null} - Objeto con session (si existe) o null si no hay sesión válida
     */
    getCurrentSession() {
        try {
            // Verificar token
            const token = storageService.getToken();
            
            // Si no hay token, no hay sesión
            if (!token) {
                return null;
            }
            
            // Obtener datos de usuario
            const userData = this.getCurrentUser();
            
            // Si no hay datos de usuario, no hay sesión válida
            if (!userData) {
                return null;
            }
            
            // Si llegamos aquí, hay una sesión válida
            return { user: userData, token };
        } catch (error) {
            errorHandler.handleError('AUTH', error, 'obtener sesión actual', false);
            return null;
        }
    }

    /**
     * Obtiene los datos del usuario actual
     * @returns {Object|null} - Datos del usuario o null si no hay sesión
     */
    getCurrentUser() {
        try {
            const userStr = storageService.safeGetItem(this.userKey);
            
            if (!userStr) {
                // Solo para desarrollo - en producción esto debería devolver null
                return null;
            }
            
            try {
                const userData = JSON.parse(userStr);
                return this.normalizeUserData(userData);
            } catch (parseError) {
                errorHandler.handleError('AUTH', parseError, 'parsear datos de usuario', false);
                return null;
            }
        } catch (error) {
            errorHandler.handleError('AUTH', error, 'obtener usuario actual', false);
            return null;
        }
    }

    /**
     * Normaliza los datos del usuario para mantener una estructura consistente
     * @param {Object} userData - Datos del usuario a normalizar
     * @returns {Object} - Datos del usuario normalizados
     */
    normalizeUserData(userData) {
        if (!userData) return null;
        
        // Asegurar que los campos tengan nombres consistentes
        return {
            ...userData,
            IDUsuario: userData.IDUsuario || userData.id || userData.idUsuario,
            Nombres: userData.Nombres || userData.nombres,
            Apellidos: userData.Apellidos || userData.apellidos,
            CodigoCIP: userData.CodigoCIP || userData.codigoCIP || userData.cip,
            IDRol: userData.IDRol || userData.idRol,
            IDArea: userData.IDArea || userData.idArea,
            UltimoAcceso: userData.UltimoAcceso || userData.ultimoAcceso || new Date().toISOString()
        };
    }

    /**
     * Inicia el verificador de autenticación
     * @param {number} interval - Intervalo en milisegundos entre verificaciones
     */
    startAuthChecker(interval = 60000) {
        errorHandler.log('AUTH', 'Iniciando verificador de autenticación cada ' + interval + 'ms', null, errorHandler.LOG_LEVEL.INFO);
        
        // Limpiar cualquier intervalo existente
        if (this.authCheckInterval) {
            clearInterval(this.authCheckInterval);
        }
        
        // Establecer nuevo intervalo
        this.authCheckInterval = setInterval(() => {
            this.checkAuthState();
        }, interval);
        
        // Primera verificación inmediata
        setTimeout(() => this.checkAuthState(), 1000);
    }
    
    /**
     * Detiene el verificador de autenticación
     */
    stopAuthChecker() {
        errorHandler.log('AUTH', 'Deteniendo verificador de autenticación', null, errorHandler.LOG_LEVEL.INFO);
        
        if (this.authCheckInterval) {
            clearInterval(this.authCheckInterval);
            this.authCheckInterval = null;
        }
    }

    /**
     * Verifica el estado de autenticación
     */
    checkAuthState() {
        try {
            // Evitar verificaciones múltiples
            if (this.isCheckingAuth) {
                return;
            }
            
            errorHandler.log('AUTH', 'Verificando estado de autenticación', null, errorHandler.LOG_LEVEL.DEBUG);
            
            // Realizar verificación sin redirección automática
            const isAuth = this.isAuthenticated(false);
            
            errorHandler.log('AUTH', 'Estado de autenticación: ' + (isAuth ? 'Válido' : 'Inválido'), null, errorHandler.LOG_LEVEL.DEBUG);
            
            // Si no hay autenticación válida y no estamos en la página de login, redirigir
            if (!isAuth && !redirectionService.isExactlyLoginPage()) {
                errorHandler.log('AUTH', 'Sesión expirada o inválida, redirigiendo a login', null, errorHandler.LOG_LEVEL.INFO);
                this.logout(true);
            }
        } catch (error) {
            errorHandler.handleError('AUTH', error, 'verificar estado de autenticación', false);
        }
    }
}

// Singleton
const authService = new AuthService();
export default authService; 