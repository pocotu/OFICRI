/**
 * Página de login
 * Maneja la lógica y renderizado del formulario de login
 */

// Importar servicios
import { authService } from '../../services/services.js';
import * as errorHandler from '../../utils/errorHandler.js';
import * as navigation from '../../utils/navigation.js';
import * as sessionManager from '../../services/sessionManager.js';
import { AuthHeader } from '../../components/AuthHeader/AuthHeader.js';
import { AuthFooter } from '../../components/AuthFooter/AuthFooter.js';

// Variable para evitar múltiples verificaciones
let isCheckingAuth = false;

// Variable para indicar que la página se ha cargado completamente
let isPageLoaded = false;

// Verificar si ya estamos autenticados al cargar la página
document.addEventListener('DOMContentLoaded', async () => {
    console.log('[LOGIN-DEBUG] ==================== INICIO CARGA PÁGINA ====================');
    console.log('[LOGIN-DEBUG] DOMContentLoaded - Iniciando verificación de autenticación');
    console.log('[LOGIN-DEBUG] URL actual:', window.location.pathname);
    console.log('[LOGIN-DEBUG] Search params:', window.location.search);
    console.log('[LOGIN-DEBUG] Hash:', window.location.hash);
    
    // Inicializar error handler
    if (errorHandler && errorHandler.setLogLevel && errorHandler.LOG_LEVEL) {
        errorHandler.setLogLevel(errorHandler.LOG_LEVEL.DEBUG);
    }
    
    // Renderizar el header de autenticación
    const authHeader = new AuthHeader();
    const authHeaderContainer = document.getElementById('authHeaderContainer');
    if (authHeaderContainer) {
        authHeader.render(authHeaderContainer);
    }
    
    // Renderizar el footer de autenticación
    const authFooter = new AuthFooter();
    const authFooterContainer = document.getElementById('authFooterContainer');
    if (authFooterContainer) {
        authFooter.render(authFooterContainer);
    }
    
    // Detectar navegador
    const browserInfo = detectBrowser();
    console.log('[LOGIN-DEBUG] Navegador detectado:', JSON.stringify(browserInfo));
    console.log('[LOGIN-DEBUG] Cookies habilitadas:', navigator.cookieEnabled);
    console.log('[LOGIN-DEBUG] LocalStorage disponible:', testLocalStorage());
    console.log('[LOGIN-DEBUG] SessionStorage disponible:', testSessionStorage());
    
    try {
        // Obtener referencias a elementos del DOM
        const loginForm = document.getElementById('loginForm');
        const loginMessage = document.getElementById('loginMessage');
        
        // Resetear mensaje de error si existe
        if (loginMessage) {
            loginMessage.style.display = 'none';
            loginMessage.innerHTML = '';
            console.log('[LOGIN-DEBUG] Mensaje de login oculto');
        }
        
        // Verificar si estamos en la página de login
        const isLoginPage = window.location.pathname === '/' || 
                            window.location.pathname === '/index.html';
        console.log('[LOGIN-DEBUG] ¿Es página de login?:', isLoginPage);
        
        // Si no estamos en la página de login, redirigir
        if (!isLoginPage) {
            console.log('[LOGIN-DEBUG] No estamos en la página de login, redirigiendo');
            window.location.replace('/');
            return;
        }
        
        // Verificar si ya ha ocurrido una redirección (para prevenir bucles)
        const redirectionOccurred = sessionStorage.getItem('redirectionOccurred');
        console.log('[LOGIN-DEBUG] Valor actual de redirectionOccurred:', redirectionOccurred === 'true');
        
        // Si es la primera carga de la página, resetear el flag
        if (!redirectionOccurred && window.performance) {
            const navEntries = window.performance.getEntriesByType('navigation');
            const navigationType = navEntries.length > 0 
                ? navEntries[0].type 
                : (window.performance.navigation ? 
                    (window.performance.navigation.type === 0 ? 'navigate' : 'other') 
                    : 'unknown');
                    
            if (navigationType === 'navigate' || navigationType === 0) {
                console.log('[LOGIN-DEBUG] Primera navegación a la página, reseteando flag');
                sessionStorage.removeItem('redirectionOccurred');
            }
        }
        
        // Verificar si el usuario ya está autenticado
        try {
            console.log('[LOGIN-DEBUG] Llamando a authService.isAuthenticated()');
            if (authService && typeof authService.isAuthenticated === 'function') {
                const isLoggedIn = authService.isAuthenticated(true);
                console.log('[LOGIN-DEBUG] Resultado isAuthenticated:', isLoggedIn);
            } else {
                console.warn('[LOGIN-DEBUG] authService o su método isAuthenticated no disponible');
            }
        } catch (authError) {
            console.error('[LOGIN-DEBUG] Error al verificar autenticación:', authError);
        }
        
        // Inicializar el formulario solo si existe en el DOM
        if (loginForm) {
            console.log('[LOGIN-DEBUG] Mostrando formulario de login');
            initializeLoginForm();
            
            // Configurar el toggle de la contraseña
            setupPasswordToggle();
        } else {
            console.warn('[LOGIN-DEBUG] Formulario de login no encontrado en el DOM');
        }
        
        console.log('[LOGIN-DEBUG] ==================== FIN CARGA PÁGINA (MOSTRANDO FORM) ====================');
    } catch (error) {
        console.error('[LOGIN-DEBUG] Error en inicio de página:', error);
        console.error('[LOGIN-DEBUG] Stack trace:', error.stack);
    } finally {
        isPageLoaded = true;
    }
});

/**
 * Detecta el navegador actual
 */
function detectBrowser() {
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
    
    // Intentar obtener versión
    const match = userAgent.match(/(chrome|firefox|safari|opera|msie|trident|edge|brave(?=\/))\/?\s*(\d+)/i) || [];
    if (match.length > 2) {
        browserVersion = match[2];
    }
    
    return {
        browser: browserName,
        version: browserVersion,
        userAgent: userAgent,
        cookiesEnabled: navigator.cookieEnabled,
        localStorage: testLocalStorage(),
        sessionStorage: testSessionStorage()
    };
}

/**
 * Prueba si localStorage está disponible
 */
function testLocalStorage() {
    try {
        localStorage.setItem('test', 'test');
        localStorage.removeItem('test');
        return true;
    } catch (e) {
        return false;
    }
}

/**
 * Prueba si sessionStorage está disponible
 */
function testSessionStorage() {
    try {
        sessionStorage.setItem('test', 'test');
        sessionStorage.removeItem('test');
        return true;
    } catch (e) {
        return false;
    }
}

/**
 * Redirección segura con manejo de errores
 */
function safeRedirect(url) {
    console.log('[LOGIN-DEBUG] ==================== INICIO SAFE REDIRECT ====================');
    console.log('[LOGIN-DEBUG] Intentando redireccionar a:', url);
    console.log('[LOGIN-DEBUG] URL actual:', window.location.href);
    
    // Verificar CORS
    try {
        const currentOrigin = window.location.origin;
        const urlObj = new URL(url, currentOrigin);
        const targetOrigin = urlObj.origin;
        console.log('[LOGIN-DEBUG] Origen actual:', currentOrigin);
        console.log('[LOGIN-DEBUG] Origen destino:', targetOrigin);
        console.log('[LOGIN-DEBUG] URL completa destino:', urlObj.href);
        console.log('[LOGIN-DEBUG] ¿Misma origen?:', currentOrigin === targetOrigin);
    } catch (e) {
        console.error('[LOGIN-DEBUG] Error al analizar URL:', e);
    }
    
    // Intentar redirección
    try {
        console.log('[LOGIN-DEBUG] Intentando window.location.replace');
        window.location.replace(url);
        console.log('[LOGIN-DEBUG] window.location.replace ejecutado sin errores');
    } catch (e) {
        console.error('[LOGIN-DEBUG] Error al redireccionar con replace:', e);
        console.error('[LOGIN-DEBUG] Stack trace replace:', e.stack);
        // Intentar con otro método
        try {
            console.log('[LOGIN-DEBUG] Intentando window.location.href');
            window.location.href = url;
            console.log('[LOGIN-DEBUG] window.location.href establecido sin errores');
        } catch (e2) {
            console.error('[LOGIN-DEBUG] Error al redireccionar con href:', e2);
            console.error('[LOGIN-DEBUG] Stack trace href:', e2.stack);
            // Último recurso
            try {
                console.log('[LOGIN-DEBUG] Intentando window.location asignación directa');
                window.location = url;
                console.log('[LOGIN-DEBUG] window.location asignado sin errores');
            } catch (e3) {
                console.error('[LOGIN-DEBUG] Error en último recurso de redirección:', e3);
                console.error('[LOGIN-DEBUG] Stack trace último recurso:', e3.stack);
                
                // Intento final: crear un enlace y hacer clic
                try {
                    console.log('[LOGIN-DEBUG] Intentando redirección mediante enlace');
                    const link = document.createElement('a');
                    link.href = url;
                    link.style.display = 'none';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    console.log('[LOGIN-DEBUG] Redirección mediante enlace completada');
                } catch (e4) {
                    console.error('[LOGIN-DEBUG] Error en redirección mediante enlace:', e4);
                }
            }
        }
    }
    console.log('[LOGIN-DEBUG] ==================== FIN SAFE REDIRECT ====================');
}

/**
 * Inicializa el formulario de login
 */
function initializeLoginForm() {
    console.log('[LOGIN-DEBUG] ==================== INICIO INIT LOGIN FORM ====================');
    console.log('[LOGIN-DEBUG] Inicializando formulario de login');
    
    try {
        // Obtener referencias
        const loginForm = document.getElementById('loginForm');
        
        // Clonar y reemplazar el formulario para eliminar listeners previos
        const oldForm = loginForm;
        const newForm = oldForm.cloneNode(true);
        oldForm.parentNode.replaceChild(newForm, oldForm);
        console.log('[LOGIN-DEBUG] Formulario clonado para eliminar listeners previos');
        
        // Obtener referencias actualizadas
        const formActual = document.getElementById('loginForm');
        const cipInput = document.getElementById('cip');
        const passwordInput = document.getElementById('password');
        const submitButton = formActual.querySelector('button[type="submit"]');
        const loginMessage = document.getElementById('loginMessage');
        
        // Agregar evento de envío del formulario
        formActual.addEventListener('submit', async (event) => {
            console.log('[LOGIN-DEBUG] ==================== INICIO SUBMIT FORM ====================');
            console.log('[LOGIN-DEBUG] Evento submit del formulario capturado');
            
            // Prevenir comportamiento por defecto
            event.preventDefault();
            
            try {
                // Validar formulario
                if (!formActual.checkValidity()) {
                    event.stopPropagation();
                    formActual.classList.add('was-validated');
                    console.log('[LOGIN-DEBUG] Formulario inválido, deteniendo envío');
                    return;
                }
                
                console.log('[LOGIN-DEBUG] Datos de formulario - CIP:', cipInput.value, 'Password length:', passwordInput.value.length);
                
                // Deshabilitar el botón y mostrar loading
                submitButton.disabled = true;
                submitButton.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Iniciando sesión...';
                console.log('[LOGIN-DEBUG] Botón deshabilitado, mostrando spinner');
                
                // Verificar si el servicio de autenticación está disponible
                if (!authService || typeof authService.login !== 'function') {
                    console.error('[LOGIN-DEBUG] Servicio de autenticación no disponible');
                    throw new Error('El servicio de autenticación no está disponible en este momento');
                }
                
                console.log('[LOGIN-DEBUG] Llamando a authService.login');
                try {
                    const response = await authService.login(cipInput.value, passwordInput.value);
                    console.log('[LOGIN-DEBUG] Respuesta del método login:', response ? JSON.stringify(response) : 'NULL');
                    
                    if (!response || !response.success) {
                        console.error('[LOGIN-DEBUG] Login fallido:', response ? response.message : 'Respuesta vacía');
                        throw new Error(response && response.message ? response.message : 'Error al iniciar sesión');
                    }
    
                    // Verificar que tenemos un usuario válido
                    const user = response.user;
                    console.log('[LOGIN-DEBUG] Datos del usuario recibidos:', user ? JSON.stringify(user) : 'NULL');
                    
                    if (!user || !user.IDRol) {
                        console.error('[LOGIN-DEBUG] Datos de usuario incompletos');
                        throw new Error('Datos de usuario incompletos');
                    }
                    
                    // Mostrar mensaje de éxito
                    if (window.Swal) {
                        await Swal.fire({
                            icon: 'success',
                            title: '¡Bienvenido!',
                            text: 'Iniciando sesión...',
                            timer: 1500,
                            showConfirmButton: false
                        });
                    }
                    
                    console.log('[LOGIN-DEBUG] Login exitoso, redirigiendo según rol...');
                    
                    // NUEVO: Verificaciones exhaustivas de almacenamiento
                    const tokenGuardado = localStorage.getItem('token');
                    const tokenSesion = sessionStorage.getItem('token');
                    const userGuardado = localStorage.getItem('user');
                    const userSesion = sessionStorage.getItem('user');
                    
                    console.log('[LOGIN-DEBUG] Verificación exhaustiva de almacenamiento:');
                    console.log('[LOGIN-DEBUG] Token en localStorage:', tokenGuardado ? 'EXISTE' : 'NO EXISTE');
                    console.log('[LOGIN-DEBUG] Token en sessionStorage:', tokenSesion ? 'EXISTE' : 'NO EXISTE');
                    console.log('[LOGIN-DEBUG] User en localStorage:', userGuardado ? 'EXISTE' : 'NO EXISTE');
                    console.log('[LOGIN-DEBUG] User en sessionStorage:', userSesion ? 'EXISTE' : 'NO EXISTE');
                    
                    // NUEVO: Guardar los datos nuevamente de forma directa para asegurar que existan
                    console.log('[LOGIN-DEBUG] Guardando datos nuevamente como medida de seguridad');
                    
                    try {
                        localStorage.setItem('token', response.token);
                        localStorage.setItem('user', JSON.stringify(user));
                        sessionStorage.setItem('token', response.token);
                        sessionStorage.setItem('user', JSON.stringify(user));
                        sessionStorage.setItem('redirectionOccurred', 'true');
                        
                        console.log('[LOGIN-DEBUG] Datos guardados exitosamente');
                    } catch (storageError) {
                        console.error('[LOGIN-DEBUG] Error al guardar datos:', storageError);
                    }
                    
                    // Verificar almacenamiento después de guardar nuevamente
                    const tokenVerificado = localStorage.getItem('token') || sessionStorage.getItem('token');
                    console.log('[LOGIN-DEBUG] Verificación final de token:', tokenVerificado ? 'OK' : 'FALLIDO');
                    
                    if (!tokenVerificado) {
                        console.error('[LOGIN-DEBUG] ¡ALERTA! El token no se guardó correctamente');
                        // Intentar con cookies como último recurso
                        document.cookie = `token=${response.token}; path=/; max-age=86400`;
                        console.log('[LOGIN-DEBUG] Intentando guardar token en cookie');
                    }
                    
                    // NUEVO: Obtener la URL de redirección directamente de la respuesta
                    const redirectTo = response.redirectTo || (user.IDRol === 1 ? '/admin.html' : '/dashboard.html');
                    console.log('[LOGIN-DEBUG] URL de redirección final:', redirectTo);
                    
                    // NUEVO: Utilizar un enfoque directo para la redirección
                    console.log('[LOGIN-DEBUG] Preparando redirección con timeout de seguridad');
                    
                    setTimeout(() => {
                        try {
                            console.log('[LOGIN-DEBUG] Iniciando redirección ahora');
                            
                            // Crear un elemento <a> para navegación segura
                            const link = document.createElement('a');
                            link.href = redirectTo;
                            link.style.display = 'none';
                            document.body.appendChild(link);
                            console.log('[LOGIN-DEBUG] Elemento <a> creado con href:', link.href);
                            
                            // Simular clic
                            link.click();
                            console.log('[LOGIN-DEBUG] Clic simulado en enlace');
                            
                            // Limpiar
                            setTimeout(() => document.body.removeChild(link), 100);
                            
                            // Plan B: si después de 500ms seguimos en la misma página, intentar con métodos alternativos
                            setTimeout(() => {
                                if (window.location.pathname === '/' || 
                                    window.location.pathname === '/index.html' ||
                                    window.location.pathname.endsWith('/OFICRI/') || 
                                    window.location.pathname.endsWith('/OFICRI/index.html')) {
                                    
                                    console.log('[LOGIN-DEBUG] Todavía en página de login, intentando métodos alternativos');
                                    
                                    try {
                                        console.log('[LOGIN-DEBUG] Intentando window.location.replace');
                                        window.location.replace(redirectTo);
                                    } catch (error1) {
                                        console.error('[LOGIN-DEBUG] Error con replace:', error1);
                                        
                                        try {
                                            console.log('[LOGIN-DEBUG] Intentando window.location.href');
                                            window.location.href = redirectTo;
                                        } catch (error2) {
                                            console.error('[LOGIN-DEBUG] Error con href:', error2);
                                            window.location = redirectTo;
                                        }
                                    }
                                }
                            }, 500);
                        } catch (redirectError) {
                            console.error('[LOGIN-DEBUG] Error crítico durante redirección:', redirectError);
                            
                            // Último intento
                            window.location = redirectTo;
                        }
                    }, 1000); // Aumentamos a 1 segundo para dar más tiempo
                    
                } catch (loginError) {
                    console.error('[LOGIN-DEBUG] Error durante el proceso de login:', loginError);
                    throw loginError;
                }
                
                console.log('[LOGIN-DEBUG] ==================== FIN SUBMIT FORM (ÉXITO) ====================');
            } catch (error) {
                console.error('[LOGIN-DEBUG] Error en login:', error);
                console.error('[LOGIN-DEBUG] Stack trace:', error.stack);
                
                // Mostrar mensaje de error
                console.log('[LOGIN-DEBUG] Mostrando alerta de error');
                if (window.Swal) {
                    Swal.fire({
                        title: 'Error',
                        text: error.message || 'Error al iniciar sesión',
                        icon: 'error',
                        confirmButtonText: 'Aceptar'
                    });
                } else if (loginMessage) {
                    loginMessage.innerHTML = `
                        <div class="alert alert-danger">
                            <i class="fas fa-exclamation-triangle me-2"></i>
                            ${error.message || 'Error al iniciar sesión'}
                        </div>
                    `;
                    loginMessage.style.display = 'block';
                }
                
                // Limpiar campo de contraseña
                passwordInput.value = '';
                console.log('[LOGIN-DEBUG] Campo de contraseña limpiado');
                
                console.log('[LOGIN-DEBUG] ==================== FIN SUBMIT FORM (ERROR) ====================');
            } finally {
                // Restaurar el botón
                submitButton.disabled = false;
                submitButton.innerHTML = '<i class="fas fa-sign-in-alt me-2"></i>Iniciar Sesión';
                console.log('[LOGIN-DEBUG] Botón de submit restaurado');
            }
        });
        
        console.log('[LOGIN-DEBUG] Listener de submit agregado al formulario');
        console.log('[LOGIN-DEBUG] ==================== FIN INIT LOGIN FORM ====================');
    } catch (error) {
        console.error('[LOGIN-DEBUG] Error al inicializar formulario:', error);
        console.error('[LOGIN-DEBUG] Stack trace:', error.stack);
    }
}

/**
 * Configura el botón de mostrar/ocultar contraseña
 */
function setupPasswordToggle() {
    console.log('[LOGIN] Configurando toggle de contraseña');
    const togglePassword = document.getElementById('togglePassword');
    const password = document.getElementById('password');
    
    if (!togglePassword || !password) {
        console.error('[LOGIN] No se encontraron elementos para el toggle de contraseña');
        return;
    }

    togglePassword.addEventListener('click', function () {
        // Cambiar el tipo de input
        const type = password.getAttribute('type') === 'password' ? 'text' : 'password';
        password.setAttribute('type', type);
        
        // Cambiar el icono
        const icon = this.querySelector('i');
        icon.classList.toggle('fa-eye');
        icon.classList.toggle('fa-eye-slash');
    });
} 