/**
 * Módulo de login
 * Proporciona funciones modulares para la autenticación de usuarios
 */

import AuthService from '../services/auth.service.js';
import * as permissionUtils from '../utils/permissions.js';

// ════════════════════════════════════════════════════════════════
// FUNCIONES DE INICIALIZACIÓN
// ════════════════════════════════════════════════════════════════

/**
 * Inicializa el módulo de login
 */
export const initLoginModule = () => {
    // Verificar si el usuario ya está autenticado
    const user = AuthService.getCurrentUser();
    if (user) {
        redirectBasedOnRole(user);
        return;
    }

    // Inicializar eventos
    initLoginEvents();
};

/**
 * Inicializa los eventos del formulario de login
 */
export const initLoginEvents = () => {
    const loginForm = document.getElementById('login-form');
    if (!loginForm) return;

    loginForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        await handleLogin();
    });
};

// ════════════════════════════════════════════════════════════════
// FUNCIONES DE AUTENTICACIÓN
// ════════════════════════════════════════════════════════════════

/**
 * Maneja el evento de login
 */
export const handleLogin = async () => {
    try {
        // Obtener elementos del formulario
        const codigoCIP = document.getElementById('codigo-cip').value;
        const password = document.getElementById('password').value;
        const submitButton = document.getElementById('login-button');
        const errorMessage = document.getElementById('login-error');
        
        // Validar campos
        if (!codigoCIP || !password) {
            showLoginError('Por favor, ingrese su código CIP y contraseña');
            return;
        }
        
        // Deshabilitar botón y mostrar estado de carga
        submitButton.disabled = true;
        submitButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Iniciando sesión...';
        
        // Limpiar mensaje de error previo
        errorMessage.textContent = '';
        errorMessage.classList.add('d-none');
        
        // Intentar login
        const response = await AuthService.login(codigoCIP, password);
        
        // Redirigir según el rol del usuario
        redirectBasedOnRole(response.user);
    } catch (error) {
        console.error('Error al iniciar sesión:', error);
        showLoginError(error.message || 'Error al iniciar sesión');
        
        // Habilitar botón nuevamente
        const submitButton = document.getElementById('login-button');
        if (submitButton) {
            submitButton.disabled = false;
            submitButton.innerHTML = 'Iniciar Sesión';
        }
    }
};

/**
 * Muestra un mensaje de error en el formulario de login
 * @param {string} message - Mensaje de error
 */
export const showLoginError = (message) => {
    const errorMessage = document.getElementById('login-error');
    if (!errorMessage) return;
    
    errorMessage.textContent = message;
    errorMessage.classList.remove('d-none');
};

/**
 * Redirige al usuario según su rol
 * @param {Object} user - Objeto de usuario
 */
export const redirectBasedOnRole = (user) => {
    if (!user) {
        window.location.href = '/';
        return;
    }
    
    window.location.href = permissionUtils.getRedirectPath(user);
};

// ════════════════════════════════════════════════════════════════
// FUNCIONES DE RENDERIZADO
// ════════════════════════════════════════════════════════════════

/**
 * Renderiza el formulario de login
 * @returns {string} - HTML del formulario de login
 */
export const renderLoginForm = () => {
    return `
    <div class="login-container">
        <div class="login-card">
            <div class="login-header">
                <img src="/assets/img/logo.png" alt="Logo" class="login-logo">
                <h2>OFICRI</h2>
                <p>Sistema de Gestión Documental</p>
            </div>
            
            <form id="login-form" class="needs-validation" novalidate>
                <div class="alert alert-danger d-none" id="login-error"></div>
                
                <div class="mb-3">
                    <label for="codigo-cip" class="form-label">Código CIP</label>
                    <div class="input-group">
                        <span class="input-group-text"><i class="fas fa-user"></i></span>
                        <input type="text" class="form-control" id="codigo-cip" placeholder="Ingrese su código CIP" required>
                        <div class="invalid-feedback">Por favor, ingrese su código CIP</div>
                    </div>
                </div>
                
                <div class="mb-3">
                    <label for="password" class="form-label">Contraseña</label>
                    <div class="input-group">
                        <span class="input-group-text"><i class="fas fa-lock"></i></span>
                        <input type="password" class="form-control" id="password" placeholder="Ingrese su contraseña" required>
                        <button class="btn btn-outline-secondary" type="button" id="toggle-password">
                            <i class="fas fa-eye"></i>
                        </button>
                        <div class="invalid-feedback">Por favor, ingrese su contraseña</div>
                    </div>
                </div>
                
                <div class="d-grid gap-2">
                    <button type="submit" class="btn btn-primary" id="login-button">Iniciar Sesión</button>
                </div>
            </form>
            
            <div class="login-footer">
                <p>© ${new Date().getFullYear()} OFICRI - Todos los derechos reservados</p>
            </div>
        </div>
    </div>
    `;
};

/**
 * Añade funcionalidad para mostrar/ocultar la contraseña
 */
export const initPasswordToggle = () => {
    const toggleButton = document.getElementById('toggle-password');
    const passwordInput = document.getElementById('password');
    
    if (!toggleButton || !passwordInput) return;
    
    toggleButton.addEventListener('click', () => {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        
        // Cambiar el icono
        const icon = toggleButton.querySelector('i');
        if (type === 'text') {
            icon.classList.remove('fa-eye');
            icon.classList.add('fa-eye-slash');
        } else {
            icon.classList.remove('fa-eye-slash');
            icon.classList.add('fa-eye');
        }
    });
}; 