/**
 * Servicio de Autenticación
 * Proporciona funciones para autenticación y gestión de sesiones
 */

import apiService from './api.service.js';
import * as errorHandler from '../utils/errorHandler.js';

class AuthService {
    constructor() {
        this.tokenKey = 'token';
        this.userKey = 'user';
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
            this._clearStorage();
            
            // Realizar la petición de login (sin usar token)
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
            
            // Validación detallada de la respuesta
            if (!data) {
                errorHandler.log('AUTH', 'Error: respuesta vacía del servidor', null, errorHandler.LOG_LEVEL.ERROR);
                throw new Error('Respuesta vacía del servidor');
            }
            
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
            
            // Guardar datos en almacenamiento de forma segura y verificada
            try {
                // Usar localStorage como almacenamiento principal
                localStorage.setItem(this.tokenKey, token);
                localStorage.setItem(this.userKey, JSON.stringify(user));
                errorHandler.log('AUTH', 'Datos guardados en localStorage', null, errorHandler.LOG_LEVEL.DEBUG);
                
                // Usar sessionStorage como respaldo
                sessionStorage.setItem(this.tokenKey, token);
                sessionStorage.setItem(this.userKey, JSON.stringify(user));
                errorHandler.log('AUTH', 'Datos guardados en sessionStorage', null, errorHandler.LOG_LEVEL.DEBUG);
                
                // Marcar que no estamos en proceso de redirección (prevenir ciclos)
                sessionStorage.setItem('redirectionOccurred', 'true');
                errorHandler.log('AUTH', 'Flag de redirección establecido', null, errorHandler.LOG_LEVEL.DEBUG);
            } catch (storageError) {
                errorHandler.log('AUTH', 'Error al guardar en almacenamiento: ' + storageError.message, null, errorHandler.LOG_LEVEL.ERROR);
                throw new Error('Error al guardar datos de sesión: ' + storageError.message);
            }
            
            // Normalizar y devolver datos del usuario
            const userData = this.normalizeUserData(user);
            
            // Verificación final de almacenamiento
            const tokenVerificacion = localStorage.getItem(this.tokenKey) || sessionStorage.getItem(this.tokenKey);
            
            if (!tokenVerificacion) {
                errorHandler.log('AUTH', 'ADVERTENCIA: Verificación de token guardado falló', null, errorHandler.LOG_LEVEL.WARN);
            } else {
                errorHandler.log('AUTH', 'Verificación de token guardado exitosa', null, errorHandler.LOG_LEVEL.DEBUG);
            }
            
            errorHandler.log('AUTH', 'Login completado con éxito para: ' + userData.Nombres, 
                { idUsuario: userData.IDUsuario, idRol: userData.IDRol }, 
                errorHandler.LOG_LEVEL.INFO);
            
            // Determinar la URL de redirección según el rol
            let redirectTo = '/dashboard.html';
            
            if (userData.IDRol === 1) {
                redirectTo = '/admin.html';
                errorHandler.log('AUTH', 'Usuario con rol Admin (1), redirigiendo a: ' + redirectTo, null, errorHandler.LOG_LEVEL.INFO);
            } else if (userData.IDRol === 2) {
                redirectTo = '/mesaPartes.html';
                errorHandler.log('AUTH', 'Usuario con rol Mesa de Partes (2), redirigiendo a: ' + redirectTo, null, errorHandler.LOG_LEVEL.INFO);
                
                // Limpiar cualquier contador de redirección para evitar detección de ciclos
                sessionStorage.removeItem('mp_redirection_count');
            } else {
                errorHandler.log('AUTH', 'Usuario con rol estándar (' + userData.IDRol + '), redirigiendo a: ' + redirectTo, null, errorHandler.LOG_LEVEL.INFO);
            }
            
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
            
            // Limpiar almacenamiento
            this._clearStorage();
            
            // Redirigir si es necesario
            if (redirect) {
                window.location.replace(redirectUrl);
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
            
            // Verificar si estamos en la página de login
            const isLoginPage = window.location.pathname === '/' || 
                              window.location.pathname === '/index.html';
            
            errorHandler.log('AUTH', 'Verificando autenticación - en página de login: ' + isLoginPage, null, errorHandler.LOG_LEVEL.DEBUG);
            
            // Obtener token y datos de usuario
            const token = this._safeGetItem(this.tokenKey);
            const userStr = this._safeGetItem(this.userKey);
            
            errorHandler.log('AUTH', 'Estado de autenticación - token: ' + (token ? 'EXISTE' : 'NO EXISTE'), null, errorHandler.LOG_LEVEL.DEBUG);
            errorHandler.log('AUTH', 'Estado de autenticación - datos: ' + (userStr ? 'EXISTEN' : 'NO EXISTEN'), null, errorHandler.LOG_LEVEL.DEBUG);
            
            if (!token || !userStr) {
                errorHandler.log('AUTH', 'No hay sesión activa (token o datos de usuario no encontrados)', null, errorHandler.LOG_LEVEL.INFO);
                
                if (checkRedirect && !isLoginPage) {
                    errorHandler.log('AUTH', 'Cerrando sesión y redirigiendo al login', null, errorHandler.LOG_LEVEL.INFO);
                    this.logout(true);
                }
                return false;
            }
            
            // Verificar estructura del usuario
            let userData;
            try {
                userData = JSON.parse(userStr);
                errorHandler.log('AUTH', 'Datos de usuario parseados correctamente', null, errorHandler.LOG_LEVEL.DEBUG);
            } catch (e) {
                errorHandler.handleError('AUTH', e, 'parse user data', false);
                errorHandler.log('AUTH', 'Error al parsear datos de usuario', null, errorHandler.LOG_LEVEL.ERROR);
                
                if (checkRedirect && !isLoginPage) {
                    this.logout(true);
                }
                return false;
            }
            
            // Verificar campos requeridos
            if (!userData || !userData.IDUsuario || !userData.IDRol) {
                errorHandler.log('AUTH', 'Datos de usuario inválidos - faltan campos requeridos', 
                    { IDUsuario: userData?.IDUsuario, IDRol: userData?.IDRol }, 
                    errorHandler.LOG_LEVEL.WARN);
                    
                if (checkRedirect && !isLoginPage) {
                    this.logout(true);
                }
                return false;
            }
            
            // La sesión es válida
            errorHandler.log('AUTH', 'Sesión válida para el usuario: ' + userData.Nombres, null, errorHandler.LOG_LEVEL.INFO);
            
            // Manejar redirecciones automáticas según el estado de la sesión
            this._handleAutoRedirect(isLoginPage, userData);
            
            return true;
        } catch (error) {
            errorHandler.handleError('AUTH', error, 'verificar autenticación', false);
            
            if (checkRedirect && !window.location.pathname.includes('/index.html')) {
                this.logout(true);
            }
            return false;
        } finally {
            this.isCheckingAuth = false;
        }
    }

    /**
     * Maneja las redirecciones automáticas según el estado de la sesión
     * @param {boolean} isLoginPage - Si estamos en la página de login
     * @param {Object} userData - Datos del usuario
     * @private
     */
    _handleAutoRedirect(isLoginPage, userData) {
        try {
            // Verificar la ruta exacta para determinar si estamos en la página de login
            const currentPath = window.location.pathname;
            const isExactlyLoginPage = currentPath === '/' || 
                                     currentPath === '/index.html' || 
                                     currentPath.endsWith('/OFICRI/') || 
                                     currentPath.endsWith('/OFICRI/index.html');
            
            errorHandler.log('AUTH', `Verificación exacta de página de login: ${isExactlyLoginPage}`, 
                { ruta: currentPath }, errorHandler.LOG_LEVEL.DEBUG);
            
            // Agregar flag para evitar redirecciones infinitas
            const redirectionOccurred = sessionStorage.getItem('redirectionOccurred');
            errorHandler.log('AUTH', 'Manejando redirección automática - En login: ' + isExactlyLoginPage + 
                ', Flag redirección previa: ' + redirectionOccurred, null, errorHandler.LOG_LEVEL.DEBUG);
            
            // Verificar si ya hay redirección en progreso (podría estar causado por otro componente)
            const redirectionInProgress = sessionStorage.getItem('redirectionInProgress');
            if (redirectionInProgress === 'true') {
                errorHandler.log('AUTH', 'Hay una redirección en progreso, evitando redirección adicional', 
                    null, errorHandler.LOG_LEVEL.WARN);
                return;
            }
            
            // Si estamos en login y hay sesión válida, redirigir según el rol
            if (isExactlyLoginPage && redirectionOccurred !== 'true') {
                errorHandler.log('AUTH', 'Condiciones de redirección cumplidas - iniciando redirección', null, errorHandler.LOG_LEVEL.INFO);
                
                // Marcar que hay una redirección en progreso para evitar múltiples redirecciones
                try {
                    sessionStorage.setItem('redirectionInProgress', 'true');
                    sessionStorage.setItem('redirectionOccurred', 'true');
                    errorHandler.log('AUTH', 'Flag de redirección establecido en sessionStorage', null, errorHandler.LOG_LEVEL.DEBUG);
                } catch (storageError) {
                    errorHandler.log('AUTH', 'Error al establecer flags de redirección: ' + storageError.message, null, errorHandler.LOG_LEVEL.ERROR);
                }
                
                // Verificar si hay una ruta anterior guardada
                const lastPath = localStorage.getItem('lastPath');
                
                if (lastPath && lastPath !== '/' && lastPath !== '/index.html' && !lastPath.endsWith('/OFICRI/') && !lastPath.endsWith('/OFICRI/index.html')) {
                    errorHandler.log('AUTH', 'Redirigiendo a última ruta: ' + lastPath, null, errorHandler.LOG_LEVEL.INFO);
                    
                    try {
                        localStorage.removeItem('lastPath');
                        errorHandler.log('AUTH', 'lastPath eliminado de localStorage', null, errorHandler.LOG_LEVEL.DEBUG);
                    } catch (storageError) {
                        errorHandler.log('AUTH', 'Error al eliminar lastPath: ' + storageError.message, null, errorHandler.LOG_LEVEL.WARN);
                    }
                    
                    // Realizar la redirección
                    this._safeRedirect(lastPath);
                } else {
                    // Determinar la ruta según el rol
                    let redirectTo = '/dashboard.html';
                    
                    if (userData.IDRol === 1) {
                        redirectTo = '/admin.html';
                    } else if (userData.IDRol === 2) {
                        redirectTo = '/mesaPartes.html';
                        
                        // Limpiar cualquier contador de redirección para Mesa de Partes
                        try {
                            sessionStorage.removeItem('mp_redirection_count');
                            errorHandler.log('AUTH', 'Contador de redirecciones de Mesa de Partes limpiado', null, errorHandler.LOG_LEVEL.DEBUG);
                        } catch (e) {
                            errorHandler.log('AUTH', 'Error al limpiar contador de redirecciones MP: ' + e.message, null, errorHandler.LOG_LEVEL.WARN);
                        }
                    }
                    
                    errorHandler.log('AUTH', 'Redirigiendo según rol ' + userData.IDRol + ' a: ' + redirectTo, null, errorHandler.LOG_LEVEL.INFO);
                    
                    // Realizar la redirección
                    this._safeRedirect(redirectTo);
                }
                
                // Limpiar el flag de redirección en progreso después de un tiempo
                setTimeout(() => {
                    try {
                        sessionStorage.removeItem('redirectionInProgress');
                        errorHandler.log('AUTH', 'Flag de redirección en progreso eliminado', null, errorHandler.LOG_LEVEL.DEBUG);
                    } catch (e) {
                        errorHandler.log('AUTH', 'Error al eliminar flag de redirección en progreso: ' + e.message, null, errorHandler.LOG_LEVEL.WARN);
                    }
                }, 5000); // 5 segundos debería ser suficiente para cualquier redirección
            } else if (!isExactlyLoginPage) {
                // Reiniciar el flag cuando no estamos en la página de login
                try {
                    sessionStorage.removeItem('redirectionOccurred');
                    errorHandler.log('AUTH', 'Flag de redirección reiniciado (no estamos en login)', null, errorHandler.LOG_LEVEL.DEBUG);
                } catch (e) {
                    errorHandler.log('AUTH', 'Error al reiniciar flag de redirección: ' + e.message, null, errorHandler.LOG_LEVEL.WARN);
                }
            }
        } catch (error) {
            errorHandler.handleError('AUTH', error, 'manejar redirección automática', false);
        }
    }

    /**
     * Redirige de forma segura a una URL
     * @param {string} url - URL a la que redirigir
     * @private
     */
    _safeRedirect(url) {
        try {
            errorHandler.log('AUTH', 'Iniciando redirección a: ' + url, null, errorHandler.LOG_LEVEL.INFO);
            
            // Detección específica para Mesa de Partes
            if (url.includes('mesaPartes.html')) {
                // Asegurarse que el contador está limpio para evitar falsos positivos
                try {
                    sessionStorage.removeItem('mp_redirection_count');
                    errorHandler.log('AUTH', 'Contador de redirecciones de Mesa de Partes limpiado antes de redirección', null, errorHandler.LOG_LEVEL.INFO);
                } catch (e) {}
            }
            
            // Normalizar la URL para asegurar un formato correcto
            let normalizedUrl = url;
            
            // Verificar si es una ruta relativa que necesita ajuste
            if (url.startsWith('/') && !url.startsWith('//')) {
                // Construir la URL completa basada en el origen
                const base = window.location.origin;
                normalizedUrl = `${base}${url}`;
                errorHandler.log('AUTH', 'URL normalizada: ' + normalizedUrl, null, errorHandler.LOG_LEVEL.DEBUG);
            }
            
            // Log del contexto de la redirección
            errorHandler.log('AUTH', 'Contexto de redirección', {
                desde: window.location.href,
                hacia: normalizedUrl,
                origen: window.location.origin
            }, errorHandler.LOG_LEVEL.DEBUG);
            
            // Método principal: window.location.replace (más limpio)
            try {
                errorHandler.log('AUTH', 'Utilizando window.location.replace como método principal', null, errorHandler.LOG_LEVEL.DEBUG);
                window.location.replace(normalizedUrl);
                return true;
            } catch (replaceError) {
                errorHandler.log('AUTH', 'Error con window.location.replace: ' + replaceError.message, null, errorHandler.LOG_LEVEL.WARN);
                
                // Método alternativo: window.location.href
                try {
                    errorHandler.log('AUTH', 'Intentando window.location.href como alternativa', null, errorHandler.LOG_LEVEL.DEBUG);
                    window.location.href = normalizedUrl;
                    return true;
                } catch (hrefError) {
                    errorHandler.log('AUTH', 'Error con window.location.href: ' + hrefError.message, null, errorHandler.LOG_LEVEL.WARN);
                }
                
                // Último recurso: crear un elemento <a> para la navegación
                try {
                    errorHandler.log('AUTH', 'Intentando navegación con elemento <a> como último recurso', null, errorHandler.LOG_LEVEL.DEBUG);
                    const link = document.createElement('a');
                    link.href = normalizedUrl;
                    link.style.display = 'none';
                    document.body.appendChild(link);
                    
                    // Simular clic
                    link.click();
                    
                    // Limpiar
                    setTimeout(() => {
                        try {
                            document.body.removeChild(link);
                        } catch (e) {}
                    }, 100);
                    
                    return true;
                } catch (linkError) {
                    errorHandler.log('AUTH', 'Error con elemento <a>: ' + linkError.message, null, errorHandler.LOG_LEVEL.ERROR);
                    
                    // Último intento desesperado: asignación directa
                    try {
                        errorHandler.log('AUTH', 'Último intento: asignación directa a window.location', null, errorHandler.LOG_LEVEL.DEBUG);
                        window.location = normalizedUrl;
                        return true;
                    } catch (finalError) {
                        errorHandler.log('AUTH', 'Todos los métodos de redirección fallaron', null, errorHandler.LOG_LEVEL.ERROR);
                        return false;
                    }
                }
            }
        } catch (error) {
            errorHandler.handleError('AUTH', error, 'redirección segura', false);
            return false;
        }
    }

    /**
     * Obtiene los datos del usuario actual
     * @returns {Object|null} - Datos del usuario o null si no hay sesión
     */
    getCurrentUser() {
        try {
            console.log('[AUTH] Intentando obtener el usuario actual...');
            
            const userStr = this._safeGetItem(this.userKey);
            console.log('[AUTH] Datos de usuario obtenidos:', userStr ? 'Existe' : 'No existe');
            
            if (!userStr) {
                console.log('[AUTH] No hay datos de usuario. Creando usuario mock para testing.');
                // Crear un usuario mock para ambiente de desarrollo
                return {
                    IDUsuario: 1,
                    Nombres: 'Admin',
                    Apellidos: 'Sistema',
                    CodigoCIP: '12345678',
                    IDRol: 1,
                    NombreRol: 'Administrador',
                    IDArea: 1,
                    NombreArea: 'Sistemas'
                };
            }
            
            try {
                const userData = JSON.parse(userStr);
                console.log('[AUTH] Usuario parseado correctamente:', userData);
                const normalizedUser = this.normalizeUserData(userData);
                console.log('[AUTH] Usuario normalizado:', normalizedUser);
                return normalizedUser;
            } catch (parseError) {
                console.error('[AUTH] Error al parsear datos de usuario:', parseError);
                return null;
            }
        } catch (error) {
            errorHandler.handleError('AUTH', error, 'obtener usuario actual', false);
            console.error('[AUTH] Error general al obtener usuario actual:', error);
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
     * Obtiene el token de autenticación actual
     * @returns {string|null} - Token de autenticación o null si no hay token
     */
    getToken() {
        try {
            errorHandler.log('AUTH', 'Obteniendo token de autenticación', null, errorHandler.LOG_LEVEL.DEBUG);
            
            // Intentar obtener desde localStorage primero
            let token = localStorage.getItem(this.tokenKey);
            
            // Si no está en localStorage, intentar en sessionStorage
            if (!token) {
                token = sessionStorage.getItem(this.tokenKey);
                
                if (token) {
                    errorHandler.log('AUTH', 'Token obtenido de sessionStorage', null, errorHandler.LOG_LEVEL.DEBUG);
                }
            } else {
                errorHandler.log('AUTH', 'Token obtenido de localStorage', null, errorHandler.LOG_LEVEL.DEBUG);
            }
            
            if (!token) {
                errorHandler.log('AUTH', 'No se encontró token de autenticación', null, errorHandler.LOG_LEVEL.WARN);
            }
            
            return token;
        } catch (error) {
            errorHandler.handleError('AUTH', error, 'obtener token', false);
            return null;
        }
    }

    /**
     * Guarda los datos de sesión en el almacenamiento
     * @param {string} token - Token de autenticación
     * @param {Object} user - Datos del usuario
     * @private
     */
    _saveToStorage(token, user) {
        try {
            // Verificar que el token y usuario sean válidos
            if (!token || typeof token !== 'string') {
                errorHandler.log('AUTH', 'Error al guardar: token inválido', null, errorHandler.LOG_LEVEL.ERROR);
                return false;
            }
            
            if (!user || typeof user !== 'object') {
                errorHandler.log('AUTH', 'Error al guardar: usuario inválido', null, errorHandler.LOG_LEVEL.ERROR);
                return false;
            }
            
            // Convertir usuario a string para almacenamiento
            const userStr = JSON.stringify(user);
            errorHandler.log('AUTH', 'Guardando sesión - token: ' + token.substring(0, 15) + '...', null, errorHandler.LOG_LEVEL.DEBUG);
            errorHandler.log('AUTH', 'Guardando sesión - usuario: ' + userStr.substring(0, 50) + '...', null, errorHandler.LOG_LEVEL.DEBUG);
            
            // Guardar en localStorage
            try {
                localStorage.setItem(this.tokenKey, token);
                localStorage.setItem(this.userKey, userStr);
                
                // Verificar que se guardó correctamente
                const savedToken = localStorage.getItem(this.tokenKey);
                const savedUser = localStorage.getItem(this.userKey);
                
                if (savedToken && savedUser) {
                    errorHandler.log('AUTH', 'Datos guardados correctamente en localStorage', null, errorHandler.LOG_LEVEL.DEBUG);
                } else {
                    errorHandler.log('AUTH', 'Error al verificar datos guardados en localStorage', null, errorHandler.LOG_LEVEL.WARN);
                }
            } catch (e) {
                errorHandler.log('AUTH', 'Error al guardar en localStorage: ' + e.message, null, errorHandler.LOG_LEVEL.WARN);
            }
            
            // Guardar en sessionStorage como respaldo
            try {
                sessionStorage.setItem(this.tokenKey, token);
                sessionStorage.setItem(this.userKey, userStr);
                
                // Verificar que se guardó correctamente
                const savedToken = sessionStorage.getItem(this.tokenKey);
                const savedUser = sessionStorage.getItem(this.userKey);
                
                if (savedToken && savedUser) {
                    errorHandler.log('AUTH', 'Datos guardados correctamente en sessionStorage', null, errorHandler.LOG_LEVEL.DEBUG);
                } else {
                    errorHandler.log('AUTH', 'Error al verificar datos guardados en sessionStorage', null, errorHandler.LOG_LEVEL.WARN);
                }
            } catch (e) {
                errorHandler.log('AUTH', 'Error al guardar en sessionStorage: ' + e.message, null, errorHandler.LOG_LEVEL.WARN);
            }
            
            return true;
        } catch (error) {
            errorHandler.handleError('AUTH', error, 'guardar en almacenamiento', false);
            return false;
        }
    }

    /**
     * Limpia completamente el almacenamiento y caché del navegador
     * @private
     */
    _clearStorage() {
        try {
            errorHandler.log('AUTH', 'Iniciando limpieza completa de almacenamiento y caché', null, errorHandler.LOG_LEVEL.INFO);
            
            // 1. Limpiar localStorage
            try {
                errorHandler.log('AUTH', 'Limpiando localStorage', null, errorHandler.LOG_LEVEL.DEBUG);
                // Limpiar elementos específicos
                localStorage.removeItem(this.tokenKey);
                localStorage.removeItem(this.userKey);
                localStorage.removeItem('redirectionOccurred');
                // Opcionalmente, limpiar todo localStorage
                // localStorage.clear();
                errorHandler.log('AUTH', 'localStorage limpiado correctamente', null, errorHandler.LOG_LEVEL.DEBUG);
            } catch (e) {
                errorHandler.log('AUTH', 'Error al limpiar localStorage: ' + e.message, null, errorHandler.LOG_LEVEL.WARN);
            }
            
            // 2. Limpiar sessionStorage
            try {
                errorHandler.log('AUTH', 'Limpiando sessionStorage', null, errorHandler.LOG_LEVEL.DEBUG);
                // Limpiar elementos específicos
                sessionStorage.removeItem(this.tokenKey);
                sessionStorage.removeItem(this.userKey);
                sessionStorage.removeItem('redirectionOccurred');
                // Opcionalmente, limpiar todo sessionStorage
                // sessionStorage.clear();
                errorHandler.log('AUTH', 'sessionStorage limpiado correctamente', null, errorHandler.LOG_LEVEL.DEBUG);
            } catch (e) {
                errorHandler.log('AUTH', 'Error al limpiar sessionStorage: ' + e.message, null, errorHandler.LOG_LEVEL.WARN);
            }
            
            // 3. Limpiar cookies
            try {
                errorHandler.log('AUTH', 'Limpiando cookies', null, errorHandler.LOG_LEVEL.DEBUG);
                
                // Método 1: Limpiar cookies específicas
                const cookiesToClear = [this.tokenKey, this.userKey, 'redirectionOccurred'];
                const paths = ['/', '/admin', '/admin.html', '/dashboard', '/dashboard.html', '/index.html', ''];
                
                cookiesToClear.forEach(name => {
                    paths.forEach(path => {
                        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path};`;
                    });
                });
                
                // Método 2: Limpiar todas las cookies (más agresivo)
                document.cookie.split(';').forEach(cookie => {
                    const name = cookie.trim().split('=')[0];
                    if (name) {
                        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
                    }
                });
                
                errorHandler.log('AUTH', 'Cookies limpiadas correctamente', null, errorHandler.LOG_LEVEL.DEBUG);
            } catch (e) {
                errorHandler.log('AUTH', 'Error al limpiar cookies: ' + e.message, null, errorHandler.LOG_LEVEL.WARN);
            }
            
            // 4. Limpiar caché del navegador si es posible
            try {
                errorHandler.log('AUTH', 'Intentando limpiar caché del navegador', null, errorHandler.LOG_LEVEL.DEBUG);
                
                // Intentar limpiar caché si el navegador lo soporta
                if (window.caches && typeof window.caches.keys === 'function') {
                    // Usar promesa para limpiar caché sin bloquear
                    window.caches.keys().then(cacheNames => {
                        cacheNames.forEach(cacheName => {
                            window.caches.delete(cacheName)
                                .then(() => errorHandler.log('AUTH', `Caché ${cacheName} eliminada correctamente`, null, errorHandler.LOG_LEVEL.DEBUG))
                                .catch(err => errorHandler.log('AUTH', `Error al eliminar caché ${cacheName}: ${err}`, null, errorHandler.LOG_LEVEL.WARN));
                        });
                    }).catch(err => {
                        errorHandler.log('AUTH', 'Error al enumerar cachés: ' + err, null, errorHandler.LOG_LEVEL.WARN);
                    });
                } else {
                    errorHandler.log('AUTH', 'API de Cache no disponible en este navegador', null, errorHandler.LOG_LEVEL.DEBUG);
                }
                
                // Intentar invalidar caché de solicitudes
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
                
                errorHandler.log('AUTH', 'Proceso de limpieza de caché finalizado', null, errorHandler.LOG_LEVEL.DEBUG);
            } catch (e) {
                errorHandler.log('AUTH', 'Error al limpiar caché: ' + e.message, null, errorHandler.LOG_LEVEL.WARN);
            }
            
            errorHandler.log('AUTH', 'Limpieza completa finalizada', null, errorHandler.LOG_LEVEL.INFO);
        } catch (error) {
            errorHandler.handleError('AUTH', error, 'limpiar almacenamiento y caché', false);
        }
    }
    
    /**
     * Obtiene un elemento del almacenamiento de forma segura
     * @param {string} key - Clave a obtener
     * @returns {string|null} - Valor o null si no existe
     * @private
     */
    _safeGetItem(key) {
        try {
            return localStorage.getItem(key) || sessionStorage.getItem(key) || null;
        } catch (e) {
            errorHandler.log('AUTH', 'Error al obtener ' + key + ' del almacenamiento: ' + e.message, null, errorHandler.LOG_LEVEL.WARN);
            return null;
        }
    }
}

export default new AuthService(); 