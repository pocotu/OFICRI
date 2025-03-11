/**
 * Módulo de login
 * Maneja la autenticación de usuarios
 */

// Importar módulos directamente
import AuthService from '../../services/auth.service.js';
import * as navigation from '../../utils/navigation.js';
import * as sessionManager from '../../services/sessionManager.js';

// Variable para evitar múltiples verificaciones
let isCheckingAuth = false;

// Verificar si ya estamos autenticados al cargar la página
document.addEventListener('DOMContentLoaded', async () => {
    console.log('[LOGIN-DEBUG] ==================== INICIO CARGA PÁGINA ====================');
    console.log('[LOGIN-DEBUG] DOMContentLoaded - Iniciando verificación de autenticación');
    console.log('[LOGIN-DEBUG] URL actual:', window.location.pathname);
    console.log('[LOGIN-DEBUG] Search params:', window.location.search);
    console.log('[LOGIN-DEBUG] Hash:', window.location.hash);
    
    // Detectar navegador
    const browserInfo = detectBrowser();
    console.log('[LOGIN-DEBUG] Navegador detectado:', JSON.stringify(browserInfo));
    console.log('[LOGIN-DEBUG] Cookies habilitadas:', navigator.cookieEnabled);
    console.log('[LOGIN-DEBUG] LocalStorage disponible:', testLocalStorage());
    console.log('[LOGIN-DEBUG] SessionStorage disponible:', testSessionStorage());
    
    try {
        // Evitar verificaciones múltiples
        if (isCheckingAuth) {
            console.log('[LOGIN-DEBUG] Ya hay una verificación en progreso, abortando');
            return;
        }
        isCheckingAuth = true;

        // Limpiar cualquier mensaje de error previo
        const loginMessage = document.getElementById('loginMessage');
        if (loginMessage) {
            loginMessage.style.display = 'none';
            console.log('[LOGIN-DEBUG] Mensaje de login oculto');
        }

        // Si estamos en la página de login y ya estamos autenticados, redirigir
        const isLoginPage = window.location.pathname === '/' || window.location.pathname === '/index.html';
        console.log('[LOGIN-DEBUG] ¿Es página de login?:', isLoginPage);

        if (!isLoginPage) {
            console.log('[LOGIN-DEBUG] No estamos en la página de login, terminando verificación');
            isCheckingAuth = false;
            return;
        }

        // Verificar si ya se realizó una redirección para evitar bucles
        let redirectionOccurred = false;
        try {
            redirectionOccurred = sessionStorage.getItem('redirectionOccurred') === 'true';
            console.log('[LOGIN-DEBUG] Valor actual de redirectionOccurred:', redirectionOccurred);
        } catch (e) {
            console.error('[LOGIN-DEBUG] Error al leer redirectionOccurred de sessionStorage:', e);
        }
        
        if (redirectionOccurred) {
            console.log('[LOGIN-DEBUG] Ya se produjo una redirección, evitando bucle');
            try {
                sessionStorage.removeItem('redirectionOccurred');
                console.log('[LOGIN-DEBUG] Flag redirectionOccurred limpiado de sessionStorage');
            } catch (e) {
                console.error('[LOGIN-DEBUG] Error al limpiar redirectionOccurred:', e);
            }
            console.log('[LOGIN-DEBUG] Inicializando formulario de login');
            initializeLoginForm();
            setupPasswordToggle();
            isCheckingAuth = false;
            console.log('[LOGIN-DEBUG] ==================== FIN CARGA PÁGINA (EVITANDO BUCLE) ====================');
            return;
        }

        // Verificar autenticación
        console.log('[LOGIN-DEBUG] Llamando a AuthService.isAuthenticated()');
        const isAuthenticated = AuthService.isAuthenticated();
        console.log('[LOGIN-DEBUG] Resultado isAuthenticated:', isAuthenticated);

        if (isAuthenticated) {
            console.log('[LOGIN-DEBUG] Usuario autenticado, obteniendo datos');
            const user = AuthService.getCurrentUser();
            console.log('[LOGIN-DEBUG] Datos del usuario obtenidos:', user ? JSON.stringify(user) : 'NULL');

            if (user && user.IDRol) {
                // Marcar que se ha producido una redirección
                try {
                    console.log('[LOGIN-DEBUG] Marcando flag de redirección en sessionStorage');
                    sessionStorage.setItem('redirectionOccurred', 'true');
                    console.log('[LOGIN-DEBUG] Flag establecido correctamente');
                } catch (e) {
                    console.error('[LOGIN-DEBUG] No se pudo guardar flag en sessionStorage:', e);
                }
                
                // Obtener la última ruta visitada
                let lastPath = null;
                try {
                    lastPath = localStorage.getItem('lastPath');
                    console.log('[LOGIN-DEBUG] Última ruta visitada obtenida:', lastPath);
                } catch (e) {
                    console.error('[LOGIN-DEBUG] Error al obtener lastPath:', e);
                }

                if (lastPath && lastPath !== '/' && lastPath !== '/index.html') {
                    console.log('[LOGIN-DEBUG] Redirigiendo a última ruta:', lastPath);
                    try {
                        localStorage.removeItem('lastPath');
                        console.log('[LOGIN-DEBUG] lastPath eliminado de localStorage');
                    } catch (e) {
                        console.warn('[LOGIN-DEBUG] Error al eliminar lastPath:', e);
                    }
                    console.log('[LOGIN-DEBUG] Llamando a safeRedirect() para:', lastPath);
                    safeRedirect(lastPath);
                } else {
                    // Redirigir según el rol
                    const route = user.IDRol === 1 ? '/admin.html' : '/dashboard.html';
                    console.log('[LOGIN-DEBUG] Redirigiendo según rol a:', route);
                    console.log('[LOGIN-DEBUG] Llamando a safeRedirect() para:', route);
                    safeRedirect(route);
                }
                console.log('[LOGIN-DEBUG] ==================== FIN CARGA PÁGINA (REDIRIGIENDO) ====================');
                return;
            } else {
                console.log('[LOGIN-DEBUG] Usuario autenticado pero sin datos válidos');
                AuthService.logout(false);
            }
        }

        console.log('[LOGIN-DEBUG] Usuario no autenticado, mostrando formulario de login');
        initializeLoginForm();
        setupPasswordToggle();
        console.log('[LOGIN-DEBUG] ==================== FIN CARGA PÁGINA (MOSTRANDO FORM) ====================');
    } catch (error) {
        console.error('[LOGIN-DEBUG] Error en la verificación inicial:', error);
        console.error('[LOGIN-DEBUG] Stack trace:', error.stack);
        AuthService.logout(false);
    } finally {
        isCheckingAuth = false;
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
    const loginForm = document.getElementById('loginForm');
    
    if (!loginForm) {
        console.error('[LOGIN-DEBUG] No se encontró el formulario de login');
        console.log('[LOGIN-DEBUG] ==================== FIN INIT LOGIN FORM (ERROR) ====================');
        return;
    }

    // Eliminar listener previo si existe
    const oldForm = loginForm.cloneNode(true);
    loginForm.parentNode.replaceChild(oldForm, loginForm);
    
    console.log('[LOGIN-DEBUG] Formulario clonado para eliminar listeners previos');
    
    // Referencia al nuevo formulario
    const newForm = document.getElementById('loginForm');
    
    newForm.addEventListener('submit', async (e) => {
        console.log('[LOGIN-DEBUG] ==================== INICIO SUBMIT FORM ====================');
        console.log('[LOGIN-DEBUG] Evento submit del formulario capturado');
        e.preventDefault();
        
        // Validar el formulario usando Bootstrap
        if (!newForm.checkValidity()) {
            console.log('[LOGIN-DEBUG] Formulario inválido según validación HTML5');
            e.stopPropagation();
            newForm.classList.add('was-validated');
            console.log('[LOGIN-DEBUG] ==================== FIN SUBMIT FORM (INVÁLIDO) ====================');
            return;
        }

        const submitButton = newForm.querySelector('button[type="submit"]');
        const cipInput = document.getElementById('cip');
        const passwordInput = document.getElementById('password');
        
        console.log('[LOGIN-DEBUG] Datos de formulario - CIP:', cipInput.value, 'Password length:', passwordInput.value.length);

        try {
            // Deshabilitar el botón y mostrar loading
            submitButton.disabled = true;
            submitButton.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Iniciando sesión...';
            console.log('[LOGIN-DEBUG] Botón deshabilitado, mostrando spinner');
            
            console.log('[LOGIN-DEBUG] Llamando a AuthService.login');
            const response = await AuthService.login(cipInput.value, passwordInput.value);
            console.log('[LOGIN-DEBUG] Respuesta del método login:', JSON.stringify(response));
            
            if (!response.success) {
                console.error('[LOGIN-DEBUG] Login fallido:', response.message);
                throw new Error(response.message || 'Error al iniciar sesión');
            }

            // Verificar que tenemos un usuario válido
            const user = response.user;
            console.log('[LOGIN-DEBUG] Datos del usuario recibidos:', user ? JSON.stringify(user) : 'NULL');
            
            if (!user || !user.IDRol) {
                console.error('[LOGIN-DEBUG] Datos de usuario incompletos');
                throw new Error('Datos de usuario incompletos');
            }

            // Mostrar mensaje de éxito
            console.log('[LOGIN-DEBUG] Mostrando alerta de éxito');
            await Swal.fire({
                icon: 'success',
                title: '¡Bienvenido!',
                text: 'Iniciando sesión...',
                timer: 1500,
                showConfirmButton: false
            });

            // Redirigir según el rol
            const route = user.IDRol === 1 ? '/admin.html' : '/dashboard.html';
            console.log('[LOGIN-DEBUG] Redirigiendo a:', route);
            
            // Marcar redirección para evitar bucles
            try {
                sessionStorage.setItem('redirectionOccurred', 'true');
                console.log('[LOGIN-DEBUG] Flag de redirección establecido');
            } catch (e) {
                console.warn('[LOGIN-DEBUG] Error al establecer flag de redirección:', e);
            }
            
            safeRedirect(route);
            console.log('[LOGIN-DEBUG] ==================== FIN SUBMIT FORM (ÉXITO) ====================');

        } catch (error) {
            console.error('[LOGIN-DEBUG] Error en login:', error);
            console.error('[LOGIN-DEBUG] Stack trace:', error.stack);
            
            // Mostrar mensaje de error
            console.log('[LOGIN-DEBUG] Mostrando alerta de error');
            await Swal.fire({
                icon: 'error',
                title: 'Error de autenticación',
                text: error.message || 'Credenciales incorrectas',
                confirmButtonText: 'Intentar nuevamente'
            });
            
            // Limpiar el campo de contraseña
            passwordInput.value = '';
            console.log('[LOGIN-DEBUG] Campo de contraseña limpiado');
            
            console.log('[LOGIN-DEBUG] ==================== FIN SUBMIT FORM (ERROR) ====================');
        } finally {
            // Restaurar el botón de submit
            submitButton.disabled = false;
            submitButton.innerHTML = '<i class="fas fa-sign-in-alt me-2"></i>Iniciar Sesión';
            console.log('[LOGIN-DEBUG] Botón de submit restaurado');
        }
    });
    
    console.log('[LOGIN-DEBUG] Listener de submit agregado al formulario');
    console.log('[LOGIN-DEBUG] ==================== FIN INIT LOGIN FORM ====================');
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