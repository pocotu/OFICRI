/**
 * Módulo de login
 * Maneja la autenticación de usuarios
 */

// Importar módulos directamente
import AuthService from '../../services/auth.service.js';
import * as navigation from '../../utils/navigation.js';
import * as sessionManager from '../../services/sessionManager.js';

// Verificar si ya estamos autenticados al cargar la página
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOMContentLoaded - Iniciando verificación de autenticación');
    console.log('Ruta actual:', window.location.pathname);

    // Limpiar cualquier mensaje de error previo
    const loginMessage = document.getElementById('loginMessage');
    if (loginMessage) {
        loginMessage.style.display = 'none';
    }

    // Solo verificar autenticación si estamos en la página de login
    if (window.location.pathname === '/' || window.location.pathname === '/index.html') {
        console.log('En página de login, verificando autenticación');
        if (AuthService.isAuthenticated()) {
            const user = AuthService.getCurrentUser();
            console.log('¿Está autenticado?:', user);

            if (user && (user.idRol === 1 || user.IDRol === 1)) {
                console.log('Usuario es administrador, redirigiendo a admin.html');
                AuthService.redirectToAdmin();
            } else {
                console.log('Usuario no es administrador, redirigiendo a dashboard.html');
                AuthService.redirectToDashboard();
            }
            return;
        } else {
            console.log('Usuario no autenticado, mostrando formulario de login');
        }
    } else {
        console.log('No estamos en la página de login');
    }

    initializeLoginForm();
    setupPasswordToggle();
});

/**
 * Inicializa el formulario de login
 */
function initializeLoginForm() {
    console.log('Inicializando formulario de login');
    const loginForm = document.getElementById('loginForm');
    
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            console.log('Formulario enviado');
            
            // Validar el formulario usando Bootstrap
            if (!loginForm.checkValidity()) {
                console.log('Formulario inválido');
                e.stopPropagation();
                loginForm.classList.add('was-validated');
                return;
            }

            try {
                const cipInput = document.getElementById('cip');
                const passwordInput = document.getElementById('password');
                console.log('Intentando login con CIP:', cipInput.value);
                
                // Deshabilitar el botón de submit
                const submitButton = loginForm.querySelector('button[type="submit"]');
                submitButton.disabled = true;
                submitButton.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Iniciando sesión...';
                
                // Limpiar cualquier mensaje previo
                const loginMessage = document.getElementById('loginMessage');
                if (loginMessage) {
                    loginMessage.style.display = 'none';
                }
                
                // Intentar login
                console.log('Llamando a AuthService.login');
                const response = await AuthService.login(cipInput.value, passwordInput.value);
                console.log('Respuesta de login:', response);
                
                if (response.success) {
                    // Mostrar mensaje de éxito
                    await Swal.fire({
                        icon: 'success',
                        title: '¡Bienvenido!',
                        text: 'Iniciando sesión...',
                        timer: 1500,
                        showConfirmButton: false
                    });
                    
                    // Obtener el usuario de la respuesta
                    const user = response.user;
                    console.log('Usuario autenticado:', user);
                    
                    if (!user) {
                        throw new Error('No se pudo obtener la información del usuario');
                    }
                    
                    // Redirigir según el rol
                    if (user.idRol === 1 || user.IDRol === 1) {
                        console.log('Redirigiendo a admin.html');
                        AuthService.redirectToAdmin();
                    } else {
                        console.log('Redirigiendo a dashboard.html');
                        AuthService.redirectToDashboard();
                    }
                } else {
                    throw new Error(response.message || 'Error al iniciar sesión');
                }
            } catch (error) {
                console.error('Error detallado en login:', error);
                
                // Mostrar mensaje de error
                await Swal.fire({
                    icon: 'error',
                    title: 'Error de autenticación',
                    text: error.message || 'Credenciales incorrectas',
                    confirmButtonText: 'Intentar nuevamente'
                });
                
                // Limpiar el campo de contraseña
                passwordInput.value = '';
            } finally {
                // Restaurar el botón de submit
                submitButton.disabled = false;
                submitButton.innerHTML = '<i class="fas fa-sign-in-alt me-2"></i>Iniciar Sesión';
            }
        });
    } else {
        console.error('No se encontró el formulario de login');
    }
}

/**
 * Configura el botón de mostrar/ocultar contraseña
 */
function setupPasswordToggle() {
    console.log('Configurando toggle de contraseña');
    const togglePassword = document.getElementById('togglePassword');
    const password = document.getElementById('password');
    
    if (togglePassword && password) {
        togglePassword.addEventListener('click', function () {
            // Cambiar el tipo de input
            const type = password.getAttribute('type') === 'password' ? 'text' : 'password';
            password.setAttribute('type', type);
            
            // Cambiar el icono
            const icon = this.querySelector('i');
            icon.classList.toggle('fa-eye');
            icon.classList.toggle('fa-eye-slash');
        });
    } else {
        console.error('No se encontraron elementos para el toggle de contraseña');
    }
} 