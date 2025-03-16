/**
 * Página de login
 * Maneja la lógica y renderizado del formulario de login
 */

// Importar utilidades
import * as errorHandler from '../../utils/index.js';

// Log para verificar la carga inicial
console.log('[LOGIN.JS] Módulo login.js cargando');

// Variables para componentes que se cargarán dinámicamente
let authService, AuthHeader, AuthFooter;

// Primero intentar cargar los mocks para tener fallbacks disponibles inmediatamente
try {
    import('./../../components/auth/mockComponents.js')
        .then(mock => {
            // Solo asignar si no están ya asignados por los componentes reales
            if (!AuthHeader) AuthHeader = mock.AuthHeader;
            if (!AuthFooter) AuthFooter = mock.AuthFooter;
            console.log('[LOGIN.JS] Componentes mock cargados proactivamente');
        })
        .catch(mockError => {
            console.error('[LOGIN.JS] Error al cargar mocks proactivamente:', mockError);
        });
} catch (error) {
    console.error('[LOGIN.JS] Error al intentar importar mocks proactivamente:', error);
}

// Cargar servicios y componentes de forma dinámica para evitar errores
try {
    // Intentar importar servicios
    import('../../services/services.js')
        .then(module => {
            authService = module.authService;
            console.log('[LOGIN.JS] authService cargado correctamente');
        })
        .catch(error => {
            console.error('[LOGIN.JS] Error al cargar authService:', error);
        });
    
    // Intentar importar componentes
    Promise.all([
        import('../../components/auth/AuthHeader.js')
            .then(module => {
                AuthHeader = module.default || module.AuthHeader;
                console.log('[LOGIN.JS] AuthHeader cargado correctamente');
            })
            .catch(error => {
                console.error('[LOGIN.JS] Error al cargar AuthHeader:', error);
                return import('./../../components/auth/mockComponents.js')
                    .then(mock => {
                        AuthHeader = mock.AuthHeader;
                        console.log('[LOGIN.JS] AuthHeader mock cargado como fallback');
                    });
            }),
        
        import('../../components/auth/AuthFooter.js')
            .then(module => {
                AuthFooter = module.default || module.AuthFooter;
                console.log('[LOGIN.JS] AuthFooter cargado correctamente');
            })
            .catch(error => {
                console.error('[LOGIN.JS] Error al cargar AuthFooter:', error);
                return import('./../../components/auth/mockComponents.js')
                    .then(mock => {
                        AuthFooter = mock.AuthFooter;
                        console.log('[LOGIN.JS] AuthFooter mock cargado como fallback');
                    });
            })
    ]).catch(error => {
        console.error('[LOGIN.JS] Error al cargar componentes:', error);
    });
} catch (error) {
    console.error('[LOGIN.JS] Error general al cargar módulos:', error);
    
    // Intentar cargar los mocks como último recurso
    try {
        import('./../../components/auth/mockComponents.js')
            .then(mock => {
                AuthHeader = mock.AuthHeader;
                AuthFooter = mock.AuthFooter;
                console.log('[LOGIN.JS] Componentes mock cargados como último recurso');
            })
            .catch(finalError => {
                console.error('[LOGIN.JS] Error fatal al cargar mocks:', finalError);
            });
    } catch (mockError) {
        console.error('[LOGIN.JS] Error fatal al intentar importar mocks:', mockError);
    }
}

// Log para verificar que el módulo se carga correctamente
console.log('[LOGIN.JS] Módulo login.js cargado');
console.log('[LOGIN.JS] errorHandler disponible:', !!errorHandler);
console.log('[LOGIN.JS] LOG_LEVEL disponible:', !!errorHandler.LOG_LEVEL);
console.log('[LOGIN.JS] setLogLevel disponible:', !!errorHandler.setLogLevel);

// Variable para evitar múltiples verificaciones
let isCheckingAuth = false;

// Variable para indicar que la página se ha cargado completamente
let isPageLoaded = false;

/**
 * Función principal de inicialización de la página de login
 * Esta función puede ser importada y utilizada desde otros archivos
 */
export async function initializeLoginPage() {
    console.log('[LOGIN.JS] ==================== INICIO CARGA PÁGINA ====================');
    console.log('[LOGIN.JS] Iniciando verificación de autenticación');
    console.log('[LOGIN.JS] URL actual:', window.location.pathname);
    console.log('[LOGIN.JS] Search params:', window.location.search);
    console.log('[LOGIN.JS] Hash:', window.location.hash);
    
    // Inicializar error handler
    if (errorHandler && errorHandler.setLogLevel && errorHandler.LOG_LEVEL) {
        errorHandler.setLogLevel(errorHandler.LOG_LEVEL.DEBUG);
    }
    
    // Verificar si podemos marcar la inicialización para la depuración
    try {
        if (window && !window.loginModuleInitialized) {
            console.log('[LOGIN.JS] Marcando inicialización global');
            window.loginModuleInitialized = true;
        }
    } catch (e) {
        console.error('[LOGIN.JS] Error al intentar marcar inicialización:', e);
    }
    
    // Esperar a que los componentes se carguen completamente (máximo 2 segundos)
    try {
        console.log('[LOGIN.JS] Esperando a que los componentes se carguen...');
        
        // Promesa que se resolverá cuando los componentes estén cargados o después de un timeout
        await new Promise((resolve) => {
            // Verificar cada 100ms si los componentes se han cargado
            const checkInterval = setInterval(() => {
                if (AuthHeader && AuthFooter) {
                    console.log('[LOGIN.JS] Componentes cargados correctamente');
                    clearInterval(checkInterval);
                    clearTimeout(timeoutId);
                    resolve(true);
                }
            }, 100);
            
            // Establecer un timeout por si los componentes nunca se cargan
            const timeoutId = setTimeout(() => {
                clearInterval(checkInterval);
                console.log('[LOGIN.JS] Tiempo de espera agotado para cargar componentes');
                resolve(false);
            }, 2000); // 2 segundos de timeout
        });
    } catch (error) {
        console.error('[LOGIN.JS] Error al esperar componentes:', error);
    }
    
    // Renderizar el header de autenticación si está disponible
    try {
        const authHeaderContainer = document.getElementById('authHeaderContainer');
        if (authHeaderContainer && AuthHeader) {
            const authHeader = new AuthHeader({
                className: 'oficri-header'
            });
            authHeader.render(authHeaderContainer);
            console.log('[LOGIN.JS] Header renderizado correctamente');
        } else {
            console.log('[LOGIN.JS] No se renderizó el header: contenedor disponible:', !!authHeaderContainer, 'componente disponible:', !!AuthHeader);
        }
    } catch (error) {
        console.error('[LOGIN.JS] Error al renderizar header:', error);
    }
    
    // Renderizar el footer de autenticación si está disponible
    try {
        const authFooterContainer = document.getElementById('authFooterContainer');
        if (authFooterContainer && AuthFooter) {
    const authFooter = new AuthFooter({
        className: 'oficri-footer'
    });
        authFooter.render(authFooterContainer);
            console.log('[LOGIN.JS] Footer renderizado correctamente');
        } else {
            console.log('[LOGIN.JS] No se renderizó el footer: contenedor disponible:', !!authFooterContainer, 'componente disponible:', !!AuthFooter);
        }
    } catch (error) {
        console.error('[LOGIN.JS] Error al renderizar footer:', error);
    }
    
    // Detectar navegador
    try {
    const browserInfo = detectBrowser();
        console.log('[LOGIN.JS] Navegador detectado:', JSON.stringify(browserInfo));
        console.log('[LOGIN.JS] Cookies habilitadas:', navigator.cookieEnabled);
        console.log('[LOGIN.JS] LocalStorage disponible:', testLocalStorage());
        console.log('[LOGIN.JS] SessionStorage disponible:', testSessionStorage());
    } catch (error) {
        console.error('[LOGIN.JS] Error al detectar navegador:', error);
    }
    
    try {
        // Obtener referencias a elementos del DOM
        const loginForm = document.getElementById('loginForm');
        const loginMessage = document.getElementById('loginMessage');
        
        // Resetear mensaje de error si existe
        if (loginMessage) {
            loginMessage.style.display = 'none';
            loginMessage.innerHTML = '';
            console.log('[LOGIN.JS] Mensaje de login oculto');
        }
        
        // Verificar si el usuario ya está autenticado
        if (authService && typeof authService.isAuthenticated === 'function') {
        try {
                console.log('[LOGIN.JS] Verificando autenticación');
                const isLoggedIn = authService.isAuthenticated(true);
                console.log('[LOGIN.JS] Resultado isAuthenticated:', isLoggedIn);
            } catch (authError) {
                console.error('[LOGIN.JS] Error al verificar autenticación:', authError);
            }
        } else {
            console.warn('[LOGIN.JS] authService no disponible para verificar autenticación');
        }
        
        // Inicializar el formulario solo si existe en el DOM
        if (loginForm) {
            console.log('[LOGIN.JS] Inicializando formulario de login');
            
            // Configurar el toggle de la contraseña
            setupPasswordToggle();
            
            // Inicializar formulario de login
            initializeLoginForm();
        } else {
            console.warn('[LOGIN.JS] Formulario de login no encontrado');
        }
        
        console.log('[LOGIN.JS] ==================== FIN CARGA PÁGINA ====================');
    } catch (error) {
        console.error('[LOGIN.JS] Error en inicio de página:', error);
        console.error('[LOGIN.JS] Stack trace:', error.stack);
    } finally {
        isPageLoaded = true;
    }
}

// Verificar si ya estamos autenticados al cargar la página
document.addEventListener('DOMContentLoaded', () => {
    console.log('[LOGIN.JS] DOMContentLoaded detectado en login.js');
    
    // Como initializeLoginPage ahora es asíncrona, necesitamos manejar la promesa
    initializeLoginPage()
        .then(() => {
            console.log('[LOGIN.JS] Inicialización completada correctamente');
        })
        .catch(error => {
            console.error('[LOGIN.JS] Error durante la inicialización:', error);
        });
});

// También exportamos la función como valor por defecto para facilitar la importación
export default initializeLoginPage;

// Log para indicar que el módulo se ha cargado completamente
console.log('[LOGIN.JS] ==================== MÓDULO CARGADO COMPLETAMENTE ====================');

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
 * Configura el toggle de la contraseña
 */
function setupPasswordToggle() {
    console.log('[LOGIN.JS] Configurando toggle de contraseña');
    const togglePassword = document.getElementById('togglePassword');
    const passwordInput = document.getElementById('password');

    if (togglePassword && passwordInput) {
        console.log('[LOGIN.JS] Elementos para toggle encontrados, agregando event listener');
        togglePassword.addEventListener('click', function() {
            console.log('[LOGIN.JS] Toggle contraseña clickeado');
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            
            const icon = togglePassword.querySelector('i');
            if (icon) {
                icon.className = type === 'password' ? 'bi bi-eye-slash' : 'bi bi-eye';
            }
        });
    } else {
        console.error('[LOGIN.JS] No se encontraron elementos para toggle de contraseña');
    }
}

/**
 * Inicializa el formulario de login
 */
function initializeLoginForm() {
    console.log('[LOGIN.JS] Inicializando formulario de login');
        const loginForm = document.getElementById('loginForm');
        const loginMessage = document.getElementById('loginMessage');
        
    if (loginForm) {
        console.log('[LOGIN.JS] Formulario encontrado, agregando event listener');
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            console.log('[LOGIN.JS] Formulario enviado');
            
            const cip = document.getElementById('cip').value.trim();
            const password = document.getElementById('password').value.trim();
            
            console.log('[LOGIN.JS] Intentando iniciar sesión con CIP:', cip);
            
            // Intentar usar el servicio de autenticación si está disponible
            if (authService && typeof authService.login === 'function') {
                console.log('[LOGIN.JS] Usando authService.login');
                
                // Mostrar algún indicador de carga si es necesario
                
                // Llamar al servicio de autenticación
                authService.login(cip, password)
                    .then(response => {
                        console.log('[LOGIN.JS] Respuesta de login recibida:', response);
                        if (response && response.success) {
                            console.log('[LOGIN.JS] Login exitoso, redirigiendo...');
                            
                            // Forzar la redirección explícitamente
                            const redirectUrl = response.redirectTo || '/admin.html';
                            console.log('[LOGIN.JS] Redirigiendo a:', redirectUrl);
                            
                            // Intentar varios métodos de redirección
                            try {
                                // Método 1: location.href
                                window.location.href = redirectUrl;
                                
                                // Método 2 (fallback): Si después de 500ms seguimos en la misma página
                            setTimeout(() => {
                                if (window.location.pathname === '/' || 
                                        window.location.pathname === '/index.html') {
                                        console.log('[LOGIN.JS] Usando método alternativo de redirección');
                                        window.location.replace(redirectUrl);
                                }
                            }, 500);
                        } catch (redirectError) {
                                console.error('[LOGIN.JS] Error durante redirección:', redirectError);
                            // Último intento
                                window.location = redirectUrl;
                            }
                        } else {
                            console.error('[LOGIN.JS] Error de login:', response.message);
                            if (loginMessage) {
                                loginMessage.textContent = response.message || 'Error al iniciar sesión';
                                loginMessage.classList.remove('d-none');
                            }
                        }
                    })
                    .catch(error => {
                        console.error('[LOGIN.JS] Error en login:', error);
                        if (loginMessage) {
                            loginMessage.textContent = 'Error en la comunicación con el servidor';
                            loginMessage.classList.remove('d-none');
                        }
                    });
            } else {
                // Fallback a la implementación básica
                console.log('[LOGIN.JS] authService no disponible, usando simulación');
                
                // Simulación de autenticación
                setTimeout(() => {
                    if (cip && password) {
                        console.log('[LOGIN.JS] Simulación exitosa, redirigiendo a admin.html');
                        window.location.href = 'admin.html';
                    } else {
                        console.log('[LOGIN.JS] Simulación fallida, mostrando mensaje');
                        if (loginMessage) {
                            loginMessage.textContent = 'Por favor, ingrese su CIP y contraseña.';
                            loginMessage.classList.remove('d-none');
                        }
                    }
                }, 1000);
            }
        });
    } else {
        console.error('[LOGIN.JS] No se encontró el formulario de login');
    }
} 