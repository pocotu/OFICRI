/**
 * sessionUI.js - Módulo para manejar aspectos de UI relacionados con la sesión
 * 
 * Este módulo proporciona funcionalidades para gestionar elementos de UI
 * relacionados con la sesión de usuario, como por ejemplo, la inicialización
 * del botón de cerrar sesión y la actualización de datos de usuario en la interfaz.
 * 
 * @TODO: Este módulo debe refactorizarse cuando Webpack esté configurado correctamente:
 * 1. Eliminar la duplicación de código de verificación de autenticación
 * 2. Consolidar la gestión de la sesión en un único lugar
 * 3. Eliminar código de depuración en producción
 */

import * as authService from '../services/auth/authService.js';

// Configuración del módulo
const CONFIG = {
    // Cambiar a false en producción
    DEBUG: true
};

// Logger para depuración
const logger = {
    log: (message, ...data) => {
        if (CONFIG.DEBUG) console.log(message, ...data);
    },
    warn: (message, ...data) => {
        if (CONFIG.DEBUG) console.warn(message, ...data);
    },
    error: (message, ...data) => {
        // Los errores siempre se registran
        console.error(message, ...data);
    }
};

// Verificar existencia de authService
const verifyAuthService = () => {
    if (!authService) {
        logger.error('authService no está disponible. Asegúrate de que está importado correctamente.');
        return false;
    }
    
    if (typeof authService.logout !== 'function') {
        logger.error('authService.logout no es una función', authService);
        return false;
    }
    
    if (typeof authService.isAuthenticated !== 'function') {
        logger.error('authService.isAuthenticated no es una función', authService);
        return false;
    }
    
    return true;
};

/**
 * Detecta si la página actual es la página de login
 * @returns {boolean} true si es la página de login
 */
const isLoginPage = () => {
    const currentPath = window.location.pathname.toLowerCase();
    return currentPath.endsWith('/index.html') || 
           currentPath === '/' || 
           currentPath === '/index';
};

/**
 * Inicializa los controladores de UI relacionados con la sesión
 * @param {Object} options - Opciones de configuración
 * @param {string} options.logoutButtonSelector - Selector CSS para el botón de logout
 * @param {string} options.userNameSelector - Selector CSS para el elemento que muestra el nombre de usuario
 * @param {function} options.onLogoutSuccess - Callback opcional a ejecutar tras cerrar sesión exitosamente
 * @param {function} options.onLogoutError - Callback opcional a ejecutar si hay error al cerrar sesión
 * @param {function} options.debugLogger - Función opcional para loggear mensajes de depuración
 * @param {boolean} options.skipAuthCheck - Si es true, omite la verificación de autenticación automática
 * @returns {Object} - Objeto con métodos y propiedades de la instancia inicializada
 */
export function initSessionUI(options = {}) {
    // Opciones por defecto
    const config = {
        logoutButtonSelector: '#btnLogout',
        userNameSelector: '#userName',
        authCheckInterval: 60000, // 1 minuto por defecto
        onLogoutSuccess: null,
        onLogoutError: null,
        debugLogger: message => logger.log(`[SessionUI] ${message}`),
        skipAuthCheck: isLoginPage(), // Omitir verificación automática en la página de login
        ...options
    };
    
    // Función para mostrar mensajes de depuración
    const debug = (message) => {
        if (typeof config.debugLogger === 'function') {
            config.debugLogger(message);
        }
    };
    
    // Verificar authService al inicio
    if (!verifyAuthService()) {
        debug('ADVERTENCIA: authService no está disponible o está incompleto');
    }
    
    /**
     * Actualiza la UI con la información del usuario
     * @param {Object} userData - Datos del usuario actual
     */
    const updateUserInfo = (userData) => {
        if (!userData) return;
        
        const userNameElement = document.querySelector(config.userNameSelector);
        if (userNameElement && userData.Nombres) {
            userNameElement.textContent = `${userData.Nombres} ${userData.Apellidos || ''}`;
            debug(`Nombre de usuario actualizado: ${userData.Nombres}`);
        }
    };
    
    /**
     * Maneja el evento de click en el botón de logout
     * @param {Event} e - Evento de click
     */
    const handleLogoutClick = async (e) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        
        debug('Función de cerrar sesión ejecutada');
        
        // Verificar authService
        if (!verifyAuthService()) {
            debug('No se puede cerrar sesión: authService no disponible');
            alert('Error al cerrar sesión. Por favor, recarga la página e intenta de nuevo.');
            return;
        }
        
        // Guardar referencia al botón y su texto original si está disponible
        let logoutButton = null;
        let originalText = '';
        
        if (e && e.currentTarget) {
            logoutButton = e.currentTarget;
            originalText = logoutButton.innerHTML;
            debug('Botón que inició el cierre de sesión:' + logoutButton);
            
            try {
                // Indicador visual
                logoutButton.innerHTML = '<i class="bi bi-hourglass-split"></i> Cerrando sesión...';
                logoutButton.style.pointerEvents = 'none'; // Deshabilitar más clics
            } catch (err) {
                debug('No se pudo actualizar el estilo del botón: ' + err);
            }
        }
        
        try {
            debug('Llamando a authService.logout()');
            await authService.logout();
            debug('Sesión cerrada exitosamente');
            
            // Ejecutar callback de éxito si existe
            if (typeof config.onLogoutSuccess === 'function') {
                config.onLogoutSuccess();
            }
        } catch (error) {
            debug('Error al cerrar sesión: ' + error.message);
            logger.error('Error al cerrar sesión:', error);
            
            // Restaurar el botón a su estado original en caso de error
            if (logoutButton && originalText) {
                try {
                    logoutButton.innerHTML = originalText;
                    logoutButton.style.pointerEvents = '';
                } catch (err) {
                    logger.error('Error al restaurar el estado del botón:', err);
                }
            }
            
            // Ejecutar callback de error si existe
            if (typeof config.onLogoutError === 'function') {
                config.onLogoutError(error);
            } else {
                // Comportamiento por defecto: redirigir al login aun en caso de error
                debug('Error en cierre, redirigiendo a página de login igualmente...');
                setTimeout(() => {
                    window.location.href = '/index.html?nocache=' + Date.now();
                }, 200);
            }
        }
    };
    
    /**
     * Adjunta el evento de cierre de sesión a un elemento
     * @param {HTMLElement} element - Elemento al que adjuntar el evento
     */
    const attachLogoutEvent = (element) => {
        debug('Adjuntando evento de click al botón de cerrar sesión');
        
        // Eliminar cualquier event listener existente (por si acaso)
        element.removeEventListener('click', handleLogoutClick);
        
        // Marcar el elemento visualmente para debug en desarrollo
        if (CONFIG.DEBUG) {
            element.dataset.logoutHandlerAttached = 'true';
        }
        
        // Agregar el event listener
        element.addEventListener('click', handleLogoutClick);
        
        debug('Evento de click adjuntado correctamente');
    };
    
    /**
     * Inicializa el botón de cerrar sesión
     */
    const initLogoutButton = () => {
        // No buscar botón de logout en la página de login
        if (isLoginPage()) {
            debug('Página de login detectada, omitiendo búsqueda de botón de logout');
            return;
        }
        
        debug('Buscando botón de logout con selector: ' + config.logoutButtonSelector);
        
        // Intentar primero con el selector proporcionado
        let logoutButton = document.querySelector(config.logoutButtonSelector);
        
        if (!logoutButton) {
            debug('Botón de logout no encontrado con selector estándar, probando alternativas');
            
            // Buscar usando diferentes selectores por ID
            const possibleIds = ['btnLogout', 'logout', 'btn-logout', 'logoutButton', 'cerrarSesion'];
            for (const id of possibleIds) {
                logoutButton = document.getElementById(id);
                if (logoutButton) {
                    debug(`Botón de logout encontrado por ID: ${id}`);
                    break;
                }
            }
            
            // Si aún no se encuentra, buscar por texto o clase
            if (!logoutButton) {
                debug('Botón de logout no encontrado por ID, buscando por texto o clase');
                
                // Buscar links con texto "Cerrar Sesión" o similar
                const allLinks = document.querySelectorAll('a');
                const possibleLogoutButtons = Array.from(allLinks).filter(link => {
                    return link.textContent.toLowerCase().includes('cerrar') || 
                           link.textContent.toLowerCase().includes('logout') ||
                           link.id === 'btnLogout' ||
                           link.id === 'logout' ||
                           link.classList.contains('logout') ||
                           link.classList.contains('nav-link-logout');
                });
                
                if (possibleLogoutButtons.length > 0) {
                    logoutButton = possibleLogoutButtons[0];
                    debug(`Encontrado posible botón de logout por texto/clase: ${logoutButton}`);
                } else {
                    // Último intento: buscar botones genéricos
                    const buttons = document.querySelectorAll('button, a, .btn');
                    const logoutBtns = Array.from(buttons).filter(btn => {
                        const text = btn.textContent.toLowerCase();
                        return text.includes('cerrar') || text.includes('logout') || text.includes('salir');
                    });
                    
                    if (logoutBtns.length > 0) {
                        logoutButton = logoutBtns[0];
                        debug('Encontrado botón de logout por texto genérico: ' + logoutButton);
                    }
                }
            }
        } else {
            debug('Botón de logout encontrado con selector estándar: ' + logoutButton);
        }
        
        // Si se encontró el botón, adjuntar evento
        if (logoutButton) {
            attachLogoutEvent(logoutButton);
        } else {
            debug('No se encontró ningún botón de logout. Programando búsqueda retardada.');
            
            // Programar búsqueda retardada
            setTimeout(() => {
                debug('Ejecutando búsqueda retardada de botón de logout');
                const delayedLogoutButton = document.querySelector(config.logoutButtonSelector);
                
                if (delayedLogoutButton) {
                    debug('Botón de logout encontrado en búsqueda retardada');
                    attachLogoutEvent(delayedLogoutButton);
                } else {
                    debug('Búsqueda retardada fallida. Estableciendo listener global');
                    
                    // Establecer listener global para capturar cualquier clic en elementos de cierre de sesión
                    document.addEventListener('click', (e) => {
                        const target = e.target.closest('a, button');
                        if (target && (
                            target.id === 'btnLogout' || 
                            target.classList.contains('nav-link-logout') ||
                            target.textContent.toLowerCase().includes('cerrar sesión')
                        )) {
                            debug('Interceptado clic en posible botón de logout: ' + target);
                            handleLogoutClick(e);
                        }
                    });
                }
            }, 1000);
        }
    };
    
    /**
     * Inicializa la verificación de autenticación
     * @param {boolean} redirect - Si debe redirigir en caso de no estar autenticado
     */
    const initAuthentication = async (redirect = true) => {
        debug('Inicializando verificación de autenticación');
        
        // En la página de login, no verificar autenticación con redirección
        if (isLoginPage()) {
            debug('Página de login detectada, omitiendo verificación de autenticación con redirección');
            redirect = false;
        }
        
        if (!verifyAuthService()) {
            debug('No se puede inicializar autenticación: authService no disponible');
            return;
        }
        
        try {
            // Usar authService centralizado para la verificación
            const isAuth = await authService.isAuthenticated(redirect);
            debug(`Estado de autenticación: ${isAuth ? 'Autenticado' : 'No autenticado'}`);
            
            if (isAuth) {
                // Iniciar verificador centralizado de autenticación si NO estamos en login
                if (!isLoginPage()) {
                    authService.startAuthChecker(config.authCheckInterval);
                    
                    // Si estamos autenticados en la página de login, redirigir al panel
                    if (isLoginPage()) {
                        debug('Usuario autenticado en página de login, redirigiendo...');
                        const userData = await authService.getCurrentSession();
                        const defaultRoute = userData?.permisos ? 
                            (userData.permisos === 255 ? '/admin.html' : '/mesaPartes.html') : 
                            '/admin.html';
                        window.location.href = defaultRoute;
                    }
                } else {
                    debug('Omitiendo inicio de verificador de autenticación en página de login');
                }
            }
            
            return isAuth;
        } catch (error) {
            logger.error('Error al verificar autenticación:', error);
            return false;
        }
    };
    
    // Inicializar componentes según configuración
    initLogoutButton();
    
    // Solo iniciar verificación automática si no estamos en la página de login
    // o si se ha especificado explícitamente que no se debe omitir
    if (!config.skipAuthCheck) {
        debug('Iniciando verificación de autenticación automática');
        initAuthentication();
    } else {
        debug('Omitiendo verificación de autenticación automática');
    }
    
    // Exponer API pública
    return {
        updateUserInfo,
        attachLogoutEvent,
        handleLogoutClick,
        initLogoutButton,
        initAuthentication,
        isLoginPage
    };
}

export default { initSessionUI }; 