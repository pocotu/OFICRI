/**
 * Servicio de Autenticación - OFICRI
 * Maneja la autenticación de usuarios y gestión de sesiones
 * VERSIÓN STANDALONE: Implementa funciones críticas sin dependencias externas
 * 
 * @TODO: Cuando Webpack esté configurado correctamente, este archivo debería:
 * 1. Importar los módulos reales en lugar de las implementaciones temporales
 * 2. Eliminar las implementaciones locales de utilidades
 * 3. Mantener la misma interfaz pública para compatibilidad
 */

// Configuración del entorno
const CONFIG = {
    // Cambiar a 'false' en producción para desactivar logs
    DEBUG: true,
    // Tiempo por defecto para comprobación de sesión (30 segundos)
    AUTH_CHECK_INTERVAL: 30000,
    // Expiración de la sesión (24 horas)
    SESSION_EXPIRY_MS: 24 * 60 * 60 * 1000
};

// Sistema de logs configurable
const logger = {
    log: (message, ...data) => {
        if (CONFIG.DEBUG) console.log(message, ...data);
    },
    warn: (message, ...data) => {
        if (CONFIG.DEBUG) console.warn(message, ...data);
    },
    error: (message, ...data) => {
        // Los errores siempre se registran, incluso en producción
        console.error(message, ...data);
    }
};

// Utilidades de seguridad implementadas directamente para evitar dependencias
const securityUtils = {
    // Versión simple de encriptación (para desarrollo)
    encryptData: async (data) => {
        try {
            return JSON.stringify(data);
        } catch (e) {
            logger.error('Error al encriptar datos:', e);
            return '{}';
        }
    },
    
    // Versión simple de desencriptación (para desarrollo)
    decryptData: async (data) => {
        try {
            return JSON.parse(data);
        } catch (e) {
            logger.error('Error al desencriptar datos:', e);
            return null;
        }
    },
    
    // Hash de contraseña simple (para desarrollo)
    hashPassword: async (password) => {
        return password; // En producción, esto debería usar un algoritmo real
    }
};

// Logger de seguridad simple
const securityLogger = {
    logSecurityEvent: (eventType, data = {}) => {
        logger.log(`[Seguridad] ${eventType}:`, data);
    }
};

// Cliente API simple para desarrollo
const apiClient = {
    post: async (url, data) => {
        logger.log(`[API] Llamada POST a ${url}`, data);
        
        // En ambiente de desarrollo, simular respuestas
        if (url === '/auth/login') {
            return {
                success: true,
                message: 'Login exitoso',
                data: {
                    id: 1,
                    username: data.username,
                    Nombres: 'Usuario',
                    Apellidos: 'De Prueba',
                    token: 'token_simulado_' + Date.now(),
                    permisos: 255, // Admin para pruebas
                    idRol: 1
                }
            };
        }
        
        return { success: false, message: 'Endpoint no implementado' };
    }
};

// Variable global para mantener referencia del intervalo de autenticación
let authCheckerIntervalId = null;

// Variable para controlar si estamos en un proceso de redirección
let isRedirecting = false;

/**
 * Detecta si la página actual es la página de login
 * @returns {boolean} true si es la página de login
 */
function isLoginPage() {
    const currentPath = window.location.pathname.toLowerCase();
    return currentPath.endsWith('/index.html') || 
           currentPath === '/' || 
           currentPath === '/index';
}

/**
 * Detecta si hay un parámetro en la URL que indique que proviene de una redirección por autenticación
 * @returns {boolean} true si tiene parámetro de auth
 */
function hasAuthParam() {
    return window.location.search.includes('auth=') || 
           window.location.search.includes('logout=') ||
           window.location.search.includes('nocache=');
}

/**
 * Realiza el login del usuario
 * @param {string} username - Nombre de usuario (CIP)
 * @param {string} password - Contraseña
 * @returns {Promise<Object>} - Datos del usuario y token
 */
export async function login(username, password) {
    logger.log(`[Auth] Iniciando login para usuario: ${username}`);
    
    try {
        // Validar entrada
        if (!username || !password) {
            throw new Error('Usuario y contraseña son requeridos');
        }

        // Registrar intento de login
        logger.log('[Auth] Registrando intento de login');
        securityLogger.logSecurityEvent('LOGIN_ATTEMPT', {
            username,
            timestamp: new Date().toISOString()
        });

        logger.log('[Auth] Enviando solicitud al API');
        
        try {
            // Hash de la contraseña y llamada al API
            const hashedPassword = await securityUtils.hashPassword(password);
            const response = await apiClient.post('/auth/login', {
                username,
                password: hashedPassword
            });
            
            if (!response || !response.success) {
                logger.error('[Auth] Error en respuesta:', response);
                throw new Error(response?.message || 'Error en la autenticación');
            }
            
            // Registrar login exitoso
            logger.log('[Auth] Login exitoso, guardando sesión');
            securityLogger.logSecurityEvent('LOGIN_SUCCESS', {
                username,
                timestamp: new Date().toISOString()
            });
            
            // Guardar token directo para compatibilidad
            localStorage.setItem('token', response.data.token || 'token_simulado_' + Date.now());
            localStorage.setItem('user', JSON.stringify(response.data));
            
            // Guardar sesión en formato nuevo
            await saveSession(response.data);
            
            // Iniciar verificador de autenticación
            startAuthChecker();
            
            // Redirigir según permisos
            logger.log('[Auth] Redirigiendo a ruta por defecto');
            const defaultRoute = getDefaultRoute(response.data.permisos || 255);
            logger.log('[Auth] Ruta de redirección:', defaultRoute);
            
            setTimeout(() => {
                window.location.href = defaultRoute;
            }, 200);
            
            return response.data;
        } catch (error) {
            logger.error('[Auth] Error durante login:', error);
            throw error;
        }
    } catch (error) {
        // Registrar error de login
        logger.error('[Auth] Error durante login:', error);
        securityLogger.logSecurityEvent('LOGIN_ERROR', {
            username,
            error: error.message,
            timestamp: new Date().toISOString()
        });

        throw error;
    }
}

/**
 * Cierra la sesión del usuario
 * @returns {Promise<boolean>} - true si la operación tuvo éxito
 */
export async function logout() {
    logger.log('[Auth] Iniciando proceso de cierre de sesión');
    
    try {
        // Detener el verificador de autenticación
        stopAuthChecker();
        
        // Intentar cerrar sesión en el servidor
        try {
            logger.log('[Auth] Intentando cerrar sesión en el servidor...');
            const response = await fetch('/api/auth/logout', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                logger.log('[Auth] Sesión cerrada correctamente en el servidor');
            } else {
                logger.warn('[Auth] No se pudo cerrar sesión en el servidor, continuando con cierre local');
            }
        } catch (serverError) {
            logger.warn('[Auth] Error al comunicarse con el servidor para cerrar sesión:', serverError);
        }
        
        logger.log('[Auth] Limpiando localStorage y sessionStorage...');
        
        // Limpiar localStorage
        await clearSession();
        
        // Eliminar cualquier token que pueda existir en localStorage
        const keysToRemove = ['token', 'user', 'redirectionOccurred', 'session', 'sessionExpiry'];
        keysToRemove.forEach(key => {
            if (localStorage.getItem(key)) {
                localStorage.removeItem(key);
            }
            
            if (sessionStorage.getItem(key)) {
                sessionStorage.removeItem(key);
            }
        });
        
        // Limpiar cualquier otra información almacenada que comience con 'oficri_'
        Object.keys(localStorage).forEach(key => {
            if (key.startsWith('oficri_')) {
                localStorage.removeItem(key);
            }
        });
        
        Object.keys(sessionStorage).forEach(key => {
            if (key.startsWith('oficri_')) {
                sessionStorage.removeItem(key);
            }
        });
        
        // Limpiar cookies relacionadas
        logger.log('[Auth] Limpiando cookies...');
        document.cookie.split(';').forEach(c => {
            document.cookie = c.trim().split('=')[0] + '=;expires=' + new Date().toUTCString() + ';path=/';
        });
        
        logger.log('[Auth] Sesión cerrada localmente con éxito, redirigiendo al login...');
        
        // Redirigir al login después de un breve retraso
        setTimeout(() => {
            window.location.href = '/index.html?nocache=' + Date.now();
        }, 100);
        
        return true;
    } catch (error) {
        logger.error('[Auth] Error al cerrar sesión:', error);
        securityLogger.logSecurityEvent('LOGOUT_ERROR', {
            error: error.message,
            timestamp: new Date().toISOString()
        });
        
        // Redirigir igualmente en caso de error
        setTimeout(() => {
            window.location.href = '/index.html?nocache=' + Date.now();
        }, 100);
        
        throw error;
    }
}

/**
 * Guarda la sesión del usuario
 * @param {Object} sessionData - Datos de la sesión
 * @returns {Promise<void>}
 */
async function saveSession(sessionData) {
    try {
        // Encriptar datos sensibles
        const encryptedData = await securityUtils.encryptData(sessionData);
        
        // Guardar en localStorage
        localStorage.setItem('session', encryptedData);
        
        // Guardar timestamp de expiración
        const expiryTime = new Date().getTime() + CONFIG.SESSION_EXPIRY_MS;
        localStorage.setItem('sessionExpiry', expiryTime.toString());
    } catch (error) {
        logger.error('[Auth] Error al guardar sesión:', error);
        securityLogger.logSecurityEvent('SESSION_SAVE_ERROR', {
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
}

/**
 * Obtiene la sesión actual
 * @returns {Promise<Object|null>} - Datos de la sesión o null si no existe
 */
export async function getCurrentSession() {
    try {
        const sessionData = localStorage.getItem('session');
        const expiryTime = parseInt(localStorage.getItem('sessionExpiry') || '0');

        if (!sessionData || new Date().getTime() > expiryTime) {
            await clearSession();
            return null;
        }

        // Desencriptar datos
        return await securityUtils.decryptData(sessionData);
    } catch (error) {
        logger.error('[Auth] Error al obtener sesión:', error);
        securityLogger.logSecurityEvent('SESSION_GET_ERROR', {
            error: error.message,
            timestamp: new Date().toISOString()
        });
        return null;
    }
}

/**
 * Limpia la sesión actual
 * @returns {Promise<void>}
 */
async function clearSession() {
    try {
        localStorage.removeItem('session');
        localStorage.removeItem('sessionExpiry');
    } catch (error) {
        logger.error('[Auth] Error al limpiar sesión:', error);
        securityLogger.logSecurityEvent('SESSION_CLEAR_ERROR', {
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
}

/**
 * Verifica si el usuario está autenticado
 * @param {boolean} redirect - Si es true, redirige al login si no está autenticado
 * @returns {Promise<boolean>} - true si está autenticado, false en caso contrario
 */
export async function isAuthenticated(redirect = false) {
    try {
        // Si ya estamos en proceso de redirección, evitar comprobaciones adicionales
        if (isRedirecting) {
            logger.log('[Auth] Omitiendo verificación durante redirección en curso');
            return false;
        }
        
        // Si estamos en la página de login y tiene parámetros de auth, evitar comprobaciones adicionales
        if (isLoginPage() && hasAuthParam()) {
            logger.log('[Auth] Página de login con parámetros de auth detectada, omitiendo verificación');
            return false;
        }
        
        const session = await getCurrentSession();
        const isValid = !!session;
        
        if (!isValid && redirect) {
            // Verificar si ya estamos en la página de login para evitar redirección innecesaria
            if (isLoginPage()) {
                logger.log('[Auth] Ya estamos en página de login, omitiendo redirección');
                return false;
            }
            
            // Marcar que estamos en proceso de redirección
            isRedirecting = true;
            
            // Redirigir al login con parámetro para evitar bucles
            logger.log('[Auth] Redirigiendo a página de login por sesión inválida');
            window.location.href = '/index.html?auth=expired&nocache=' + Date.now();
        }
        
        return isValid;
    } catch (error) {
        logger.error('[Auth] Error al verificar autenticación:', error);
        securityLogger.logSecurityEvent('AUTH_CHECK_ERROR', {
            error: error.message,
            timestamp: new Date().toISOString()
        });
        
        if (redirect && !isLoginPage()) {
            // Marcar que estamos en proceso de redirección
            isRedirecting = true;
            
            logger.log('[Auth] Redirigiendo a página de login por error en verificación');
            window.location.href = '/index.html?auth=error&nocache=' + Date.now();
        }
        
        return false;
    }
}

/**
 * Inicia un verificador de autenticación centralizado que se ejecuta periódicamente
 * @param {number} interval - Intervalo en milisegundos (opcional)
 * @returns {number} - ID del intervalo para poder cancelarlo
 * 
 * NOTA: Esta función es singleton - solo debe llamarse una vez en toda la aplicación,
 * preferiblemente desde el punto de entrada principal o tras un login exitoso.
 */
export function startAuthChecker(interval = CONFIG.AUTH_CHECK_INTERVAL) {
    // No iniciar el verificador en la página de login
    if (isLoginPage()) {
        logger.log('[Auth] Omitiendo inicialización de verificador en página de login');
        return null;
    }
    
    // Detener cualquier verificador existente para evitar duplicados
    stopAuthChecker();
    
    // Restablecer el estado de redirección
    isRedirecting = false;
    
    // Verificación inicial
    isAuthenticated(true);
    
    // Configurar verificación periódica
    logger.log(`[Auth] Iniciando verificador de autenticación (intervalo: ${interval}ms)`);
    authCheckerIntervalId = setInterval(() => {
        // Verificar que no estemos en la página de login
        if (!isLoginPage()) {
            isAuthenticated(true);
        } else {
            // Si en algún momento llegamos a la página de login, detener el verificador
            stopAuthChecker();
        }
    }, interval);
    
    return authCheckerIntervalId;
}

/**
 * Detiene el verificador de autenticación centralizado
 */
export function stopAuthChecker() {
    if (authCheckerIntervalId) {
        logger.log('[Auth] Deteniendo verificador de autenticación');
        clearInterval(authCheckerIntervalId);
        authCheckerIntervalId = null;
    }
}

/**
 * Obtiene la ruta por defecto según los permisos
 * @param {number} permissions - Permisos del usuario
 * @returns {string} - Ruta por defecto
 */
function getDefaultRoute(permissions) {
    // Si tiene todos los permisos, es ADMIN
    if (permissions === 255) return '/admin.html';
    
    // Si tiene permisos de Mesa de Partes
    if ((permissions & 89) === 89) return '/mesaPartes.html';
    
    // Si tiene permisos de Área
    if ((permissions & 16) === 16) return '/area.html';
    
    return '/index.html';
} 