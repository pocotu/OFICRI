class AuthService {
    constructor() {
        this.baseUrl = '/api';
        this.tokenKey = 'token';
        this.userKey = 'user';
        this.isCheckingAuth = false;
    }

    async login(codigoCIP, password) {
        try {
            console.log('[AUTH-DEBUG] ==================== INICIO LOGIN ====================');
            console.log('[AUTH-DEBUG] Navegador detectado:', this._detectBrowser());
            console.log('[AUTH-DEBUG] Iniciando login para CIP:', codigoCIP);
            console.log('[AUTH-DEBUG] URL base API:', this.baseUrl);
            
            // Limpiar cualquier sesión existente
            this.logout(false);
            
            console.log('[AUTH-DEBUG] Preparando solicitud fetch con credenciales:', 'same-origin');
            
            // Realizar la petición de login con opciones más compatibles
            const response = await fetch(`${this.baseUrl}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache'
                },
                credentials: 'same-origin', // Cambiado de 'include' para mejor compatibilidad
                cache: 'no-store',
                body: JSON.stringify({ 
                    codigoCIP: codigoCIP.trim(), 
                    password: password.trim() 
                })
            });

            console.log('[AUTH-DEBUG] Fetch completado, estado de respuesta:', response.status, response.statusText);
            console.log('[AUTH-DEBUG] Headers de respuesta:', this._headersToString(response.headers));
            
            // Obtener el texto de la respuesta primero
            const responseText = await response.text();
            console.log('[AUTH-DEBUG] Respuesta del servidor (texto):', responseText);

            // Intentar parsear como JSON
            let data;
            try {
                console.log('[AUTH-DEBUG] Intentando parsear respuesta como JSON');
                data = JSON.parse(responseText);
                console.log('[AUTH-DEBUG] JSON parseado correctamente');
            } catch (e) {
                console.error('[AUTH-DEBUG] Error al parsear respuesta JSON:', e);
                throw new Error('Respuesta del servidor no válida');
            }

            if (!response.ok) {
                console.error('[AUTH-DEBUG] Respuesta de servidor no OK:', response.status, data.message);
                throw new Error(data.message || 'Error en la autenticación');
            }

            console.log('[AUTH-DEBUG] Respuesta del servidor:', data);
            console.log('[AUTH-DEBUG] Token recibido:', data.token ? (data.token.substring(0, 20) + '...') : 'NO HAY TOKEN');
            console.log('[AUTH-DEBUG] Datos de usuario recibidos:', data.user ? JSON.stringify(data.user) : 'NO HAY USUARIO');

            if (!data.token || !data.user) {
                console.error('[AUTH-DEBUG] Faltan datos críticos en la respuesta');
                throw new Error('Respuesta inválida del servidor');
            }

            // Validar estructura del usuario
            if (!data.user.IDUsuario && !data.user.id) {
                console.error('[AUTH-DEBUG] Estructura inválida del usuario:', data.user);
                throw new Error('Estructura de usuario inválida');
            }

            // Normalizar datos del usuario
            const normalizedUser = this.normalizeUserData(data.user);
            console.log('[AUTH-DEBUG] Usuario normalizado:', JSON.stringify(normalizedUser));

            // Guardar datos en localStorage y sessionStorage
            const storageResult = this._saveToStorage(data.token, normalizedUser);
            console.log('[AUTH-DEBUG] Resultado de guardar en almacenamiento:', storageResult);
            
            console.log('[AUTH-DEBUG] ==================== FIN LOGIN ====================');

            return {
                success: true,
                user: normalizedUser,
                token: data.token
            };
        } catch (error) {
            console.error('[AUTH-DEBUG] Error en login:', error);
            console.error('[AUTH-DEBUG] Stack trace:', error.stack);
            this.logout(false);
            return {
                success: false,
                message: error.message || 'Error en la autenticación'
            };
        }
    }

    normalizeUserData(user) {
        try {
            const normalized = {
                IDUsuario: parseInt(user.IDUsuario || user.id || user.ID, 10),
                IDRol: parseInt(user.IDRol || user.idRol || user.rolId || '0', 10),
                IDArea: parseInt(user.IDArea || user.idArea || user.areaId || '0', 10),
                Nombres: user.Nombres || user.nombres || user.name || user.firstName,
                Apellidos: user.Apellidos || user.apellidos || user.lastName,
                CodigoCIP: user.CodigoCIP || user.codigoCIP || user.cip,
                UltimoAcceso: user.UltimoAcceso || new Date().toISOString()
            };

            // Validar que los IDs sean números válidos
            if (isNaN(normalized.IDUsuario) || isNaN(normalized.IDRol) || isNaN(normalized.IDArea)) {
                throw new Error('IDs inválidos en datos de usuario');
            }

            return normalized;
        } catch (error) {
            console.error('[AUTH] Error al normalizar datos:', error);
            throw new Error('Error al procesar datos del usuario');
        }
    }

    async logout(redirect = true) {
        try {
            console.log('[AUTH-DEBUG] ==================== INICIANDO CIERRE DE SESIÓN ====================');
            console.log('[AUTH-DEBUG] Ubicación actual:', window.location.pathname);
            
            const token = this._safeGetItem(this.tokenKey);
            if (token) {
                try {
                    console.log('[AUTH-DEBUG] Intentando cerrar sesión en el servidor');
                    const response = await fetch(`${this.baseUrl}/auth/logout`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json',
                            'Accept': 'application/json',
                            'Cache-Control': 'no-cache'
                        },
                        credentials: 'same-origin', // Usar same-origin para mayor compatibilidad
                        cache: 'no-store'
                    });
                    
                    console.log('[AUTH-DEBUG] Respuesta del servidor (logout):', response.status);
                } catch (error) {
                    console.warn('[AUTH-DEBUG] Error al cerrar sesión en el servidor:', error);
                    // Continuar con el proceso de logout aunque falle la comunicación con el servidor
                }
            } else {
                console.log('[AUTH-DEBUG] No hay token disponible para enviar al servidor');
            }
        } catch (error) {
            console.error('[AUTH-DEBUG] Error en logout:', error);
        } finally {
            // Limpiar datos de sesión
            console.log('[AUTH-DEBUG] Limpiando datos de sesión...');
            this._clearStorage();
            
            // Forzar redirección a login independientemente de la ruta actual
            if (redirect) {
                console.log('[AUTH-DEBUG] Redirigiendo a página de login...');
                // Usar timeout para asegurar que la limpieza se complete antes de redirigir
                setTimeout(() => {
                    window.location.href = '/index.html';
                }, 100);
            } else {
                console.log('[AUTH-DEBUG] Redirección desactivada por parámetro');
            }
            
            console.log('[AUTH-DEBUG] ==================== FIN CIERRE DE SESIÓN ====================');
        }
    }

    isAuthenticated() {
        // Evitar verificaciones recursivas
        if (this.isCheckingAuth) {
            console.log('[AUTH] Verificación en progreso, evitando recursión');
            return true;
        }

        try {
            this.isCheckingAuth = true;
            console.log('[AUTH] Verificando autenticación...');
            
            // Verificar si estamos en la página de login
            const currentPath = window.location.pathname;
            const isLoginPage = currentPath === '/' || currentPath === '/index.html';
            
            // Obtener datos de sesión
            const token = this._safeGetItem(this.tokenKey);
            const userStr = this._safeGetItem(this.userKey);
            
            console.log('[AUTH] Datos encontrados:', { 
                tieneToken: !!token, 
                tieneUsuario: !!userStr,
                enLogin: isLoginPage
            });

            if (!token || !userStr) {
                if (!isLoginPage) {
                    console.log('[AUTH] No hay datos de sesión, redirigiendo a login');
                    this.logout(true);
                }
                return false;
            }

            // Verificar estructura del usuario
            let userData;
            try {
                userData = JSON.parse(userStr);
            } catch (e) {
                console.error('[AUTH] Error al parsear datos del usuario:', e);
                this.logout(!isLoginPage);
                return false;
            }

            if (!userData || !userData.IDUsuario || !userData.IDRol) {
                console.log('[AUTH] Datos de usuario inválidos');
                this.logout(!isLoginPage);
                return false;
            }

            // Agregar flag para evitar redirecciones infinitas
            const redirectionOccurred = sessionStorage.getItem('redirectionOccurred');
            
            // Si estamos en login y hay sesión válida, redirigir según el rol pero solo si no se ha producido ya una redirección
            if (isLoginPage && !redirectionOccurred) {
                // Marcar que ya se ha producido una redirección
                sessionStorage.setItem('redirectionOccurred', 'true');
                
                const lastPath = localStorage.getItem('lastPath');
                if (lastPath && lastPath !== '/' && lastPath !== '/index.html') {
                    console.log('[AUTH] Redirigiendo a última ruta:', lastPath);
                    localStorage.removeItem('lastPath');
                    window.location.replace(lastPath);
                } else {
                    console.log('[AUTH] Redirigiendo según rol');
                    window.location.replace(userData.IDRol === 1 ? '/admin.html' : '/dashboard.html');
                }
            } else if (!isLoginPage) {
                // Reiniciar el flag cuando no estamos en la página de login
                sessionStorage.removeItem('redirectionOccurred');
            }

            return true;
        } catch (error) {
            console.error('[AUTH] Error al verificar autenticación:', error);
            this.logout(!window.location.pathname.includes('/index.html'));
            return false;
        } finally {
            this.isCheckingAuth = false;
        }
    }

    getCurrentUser() {
        try {
            const userStr = this._safeGetItem(this.userKey);
            if (!userStr) return null;
            
            const userData = JSON.parse(userStr);
            return this.normalizeUserData(userData);
        } catch (error) {
            console.error('[AUTH] Error al obtener usuario:', error);
            return null;
        }
    }

    getToken() {
        return this._safeGetItem(this.tokenKey);
    }

    _saveToStorage(token, user) {
        console.log('[AUTH-DEBUG] ==================== INICIO SAVE STORAGE ====================');
        console.log('[AUTH-DEBUG] Intentando guardar token y usuario en almacenamiento');
        
        try {
            const userStr = JSON.stringify(user);
            console.log('[AUTH-DEBUG] Usuario serializado a JSON, longitud:', userStr.length);
            
            // Intentar guardar en localStorage con manejo de errores específico
            try {
                console.log('[AUTH-DEBUG] Intentando guardar en localStorage');
                localStorage.setItem(this.tokenKey, token);
                localStorage.setItem(this.userKey, userStr);
                console.log('[AUTH-DEBUG] Datos guardados en localStorage correctamente');
                
                // Verificar que se guardaron correctamente
                const testToken = localStorage.getItem(this.tokenKey);
                const testUser = localStorage.getItem(this.userKey);
                console.log('[AUTH-DEBUG] Verificación localStorage - token:', testToken ? 'EXISTE' : 'FALLO', 
                            'usuario:', testUser ? 'EXISTE' : 'FALLO');
            } catch (localError) {
                console.warn('[AUTH-DEBUG] Error al guardar en localStorage:', localError);
                console.warn('[AUTH-DEBUG] Stack trace localStorage:', localError.stack);
            }
            
            // Intentar guardar en sessionStorage como respaldo
            try {
                console.log('[AUTH-DEBUG] Intentando guardar en sessionStorage');
                sessionStorage.setItem(this.tokenKey, token);
                sessionStorage.setItem(this.userKey, userStr);
                console.log('[AUTH-DEBUG] Datos guardados en sessionStorage correctamente');
                
                // Verificar que se guardaron correctamente
                const testToken = sessionStorage.getItem(this.tokenKey);
                const testUser = sessionStorage.getItem(this.userKey);
                console.log('[AUTH-DEBUG] Verificación sessionStorage - token:', testToken ? 'EXISTE' : 'FALLO',
                           'usuario:', testUser ? 'EXISTE' : 'FALLO');
            } catch (sessionError) {
                console.warn('[AUTH-DEBUG] Error al guardar en sessionStorage:', sessionError);
                console.warn('[AUTH-DEBUG] Stack trace sessionStorage:', sessionError.stack);
            }
            
            // Intentar guardar en cookies como último recurso
            if (this._canUseCookies()) {
                console.log('[AUTH-DEBUG] Cookies disponibles, intentando guardar');
                this._setCookie(this.tokenKey, token, 1); // 1 día
                this._setCookie(this.userKey, userStr, 1);
                
                // Verificar que se guardaron correctamente
                const testToken = this._getCookie(this.tokenKey);
                const testUser = this._getCookie(this.userKey);
                console.log('[AUTH-DEBUG] Verificación cookies - token:', testToken ? 'EXISTE' : 'FALLO',
                          'usuario:', testUser ? 'EXISTE' : 'FALLO');
                console.log('[AUTH-DEBUG] Datos guardados en cookies');
            } else {
                console.warn('[AUTH-DEBUG] Cookies no disponibles o bloqueadas');
            }
            
            console.log('[AUTH-DEBUG] ==================== FIN SAVE STORAGE ====================');
            return true;
        } catch (error) {
            console.error('[AUTH-DEBUG] Error general al guardar en storage:', error);
            console.error('[AUTH-DEBUG] Stack trace general:', error.stack);
            return false;
        }
    }

    _clearStorage() {
        try {
            console.log('[AUTH-DEBUG] Iniciando limpieza de almacenamiento');
            
            // Limpiar datos de localStorage
            try {
                console.log('[AUTH-DEBUG] Limpiando localStorage');
                localStorage.removeItem(this.tokenKey);
                localStorage.removeItem(this.userKey);
                localStorage.removeItem('lastPath');
            } catch (e) {
                console.warn('[AUTH-DEBUG] Error al limpiar localStorage:', e);
            }
            
            // Limpiar datos de sessionStorage
            try {
                console.log('[AUTH-DEBUG] Limpiando sessionStorage');
                sessionStorage.removeItem(this.tokenKey);
                sessionStorage.removeItem(this.userKey);
                sessionStorage.removeItem('redirectionOccurred');
            } catch (e) {
                console.warn('[AUTH-DEBUG] Error al limpiar sessionStorage:', e);
            }
            
            // Limpiar cookies
            console.log('[AUTH-DEBUG] Intentando limpiar cookies');
            if (this._canUseCookies()) {
                console.log('[AUTH-DEBUG] Eliminando cookie:', this.tokenKey);
                this._deleteCookie(this.tokenKey);
                console.log('[AUTH-DEBUG] Eliminando cookie:', this.userKey);
                this._deleteCookie(this.userKey);
                
                // Forzar la eliminación de cookies también por path
                console.log('[AUTH-DEBUG] Forzando eliminación de cookies con diferentes paths');
                document.cookie = `${this.tokenKey}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
                document.cookie = `${this.userKey}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
                document.cookie = `${this.tokenKey}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/admin.html;`;
                document.cookie = `${this.userKey}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/admin.html;`;
                document.cookie = `${this.tokenKey}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/dashboard.html;`;
                document.cookie = `${this.userKey}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/dashboard.html;`;
            } else {
                console.warn('[AUTH-DEBUG] Las cookies no están disponibles en este navegador');
            }
            
            console.log('[AUTH-DEBUG] Almacenamiento limpiado correctamente');
            return true;
        } catch (error) {
            console.error('[AUTH-DEBUG] Error al limpiar almacenamiento:', error);
            return false;
        }
    }

    _safeGetItem(key) {
        let value = null;
        
        // Intentar obtener de localStorage
        try {
            value = localStorage.getItem(key);
            if (value) return value;
        } catch (e) {
            console.warn('[AUTH] Error al acceder a localStorage:', e);
        }
        
        // Intentar obtener de sessionStorage
        try {
            value = sessionStorage.getItem(key);
            if (value) return value;
        } catch (e) {
            console.warn('[AUTH] Error al acceder a sessionStorage:', e);
        }
        
        // Intentar obtener de cookies
        if (this._canUseCookies()) {
            value = this._getCookie(key);
        }
        
        return value;
    }

    // Métodos auxiliares para manejo de cookies
    _setCookie(name, value, days) {
        const date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        const expires = "; expires=" + date.toUTCString();
        document.cookie = name + "=" + encodeURIComponent(value) + expires + "; path=/; SameSite=Lax";
    }

    _getCookie(name) {
        const nameEQ = name + "=";
        const ca = document.cookie.split(';');
        for (let i = 0; i < ca.length; i++) {
            let c = ca[i];
            while (c.charAt(0) === ' ') c = c.substring(1, c.length);
            if (c.indexOf(nameEQ) === 0) {
                return decodeURIComponent(c.substring(nameEQ.length, c.length));
            }
        }
        return null;
    }

    _deleteCookie(name) {
        try {
            console.log('[AUTH-DEBUG] Eliminando cookie:', name);
            
            // Eliminar la cookie con diferentes combinaciones de path y domain
            // Esto asegura que se elimine independientemente de cómo se haya configurado
            const paths = ['/', '/admin.html', '/dashboard.html', '/index.html', ''];
            
            paths.forEach(path => {
                document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path};`;
            });
            
            // También intentar con Max-Age
            document.cookie = `${name}=; Max-Age=-99999999; path=/;`;
            
            return true;
        } catch (error) {
            console.error('[AUTH-DEBUG] Error al eliminar cookie:', error);
            return false;
        }
    }

    _canUseCookies() {
        try {
            console.log('[AUTH-DEBUG] Verificando disponibilidad de cookies');
            // Verificar si podemos usar cookies
            document.cookie = "testcookie=1; SameSite=Lax; path=/";
            const canUse = document.cookie.indexOf("testcookie") !== -1;
            document.cookie = "testcookie=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
            console.log('[AUTH-DEBUG] Resultado verificación cookies:', canUse ? 'DISPONIBLES' : 'NO DISPONIBLES');
            return canUse;
        } catch (e) {
            console.error('[AUTH-DEBUG] Error al verificar cookies:', e);
            return false;
        }
    }

    // Método auxiliar para detectar el navegador
    _detectBrowser() {
        const userAgent = navigator.userAgent;
        let browserName = "Desconocido";
        let browserVersion = "Desconocido";
        
        if (userAgent.match(/chrome|chromium|crios/i)) {
            browserName = "Chrome";
            if (userAgent.indexOf("Edg") > -1) browserName = "Edge";
            if (userAgent.indexOf("OPR") > -1) browserName = "Opera";
            if (userAgent.indexOf("Brave") > -1 || navigator.brave) browserName = "Brave";
        } else if (userAgent.match(/firefox|fxios/i)) {
            browserName = "Firefox";
        } else if (userAgent.match(/safari/i) && !userAgent.match(/chrome|chromium|crios/i)) {
            browserName = "Safari";
        } else if (userAgent.match(/opr\//i)) {
            browserName = "Opera";
        } else if (userAgent.match(/edg/i)) {
            browserName = "Edge";
        }
        
        return {
            browser: browserName,
            version: userAgent,
            cookiesEnabled: navigator.cookieEnabled,
            localStorage: this._testStorage('localStorage'),
            sessionStorage: this._testStorage('sessionStorage')
        };
    }

    // Método auxiliar para probar almacenamiento
    _testStorage(type) {
        try {
            const storage = window[type];
            const testKey = `test_${Date.now()}`;
            storage.setItem(testKey, "test");
            const result = storage.getItem(testKey) === "test";
            storage.removeItem(testKey);
            return result;
        } catch (e) {
            return false;
        }
    }

    // Método auxiliar para convertir headers a string
    _headersToString(headers) {
        let result = '';
        headers.forEach((value, key) => {
            result += `${key}: ${value}\n`;
        });
        return result;
    }
}

// Crear y exportar una instancia única
const authService = new AuthService();
export default authService; 