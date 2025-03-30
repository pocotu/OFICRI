/**
 * Login Page Controller
 * Controlador para la página de login del sistema OFICRI
 */

import { authService } from '../../services/authService.js';
import { notifications } from '../../ui/notifications.js';
import { validateInput } from '../../utils/validators.js';
import { authStateManager } from '../../utils/authStateManager.js';
import { 
  renderLoginForm,
  setupPasswordToggle,
  setupFormValidation,
  showFieldError,
  clearFieldError,
  showGeneralError,
  showSuccessMessage,
  clearAllErrors,
  prepareLoginForm
} from '../../utils/loginUtils/loginFormRenderer.js';

// Create namespace
window.OFICRI = window.OFICRI || {};

/**
 * Módulo para manejar la página de login
 */
const loginPage = (function() {
  'use strict';
  
  // Variables privadas
  let _form = null;
  let _cipInput = null;
  let _passwordInput = null;
  let _submitButton = null;
  let _rememberCheck = null;
  let _loginContainer = null;
  let _isSubmitting = false;
  let _loginAttempts = 0;
  const MAX_LOGIN_ATTEMPTS = 5;
  // Bandera para asegurar una única inicialización
  let _isInitialized = false;

  /**
   * Maneja el evento de envío del formulario de login
   * @param {Event} event - Evento del formulario
   */
  const _handleSubmit = function(event) {
    event.preventDefault();
    
    // Preparar formulario para el intento de login
    // Esto limpia errores y estados de autenticación pendientes
    prepareLoginForm(authStateManager.clearAuthenticationState);
    
    // Verificar si ya hay un login en curso después de intentar limpiar
    if (authStateManager.getState() === authStateManager.STATES.AUTHENTICATING) {
      console.warn('[Login] Ya hay un proceso de login en curso que no se pudo limpiar');
      showGeneralError('El sistema está procesando una solicitud, por favor espere...');
      return;
    }
    
    // Obtener valores de los campos
    const codigoCIP = document.getElementById('codigoCIP').value;
    const password = document.getElementById('password').value;
    
    // Validar campos
    const errors = {};
    
    // Validar codigoCIP
    if (!codigoCIP) {
      errors.codigoCIP = 'El código CIP es obligatorio';
    } else if (!validateInput(codigoCIP, 'codigoCIP')) {
      errors.codigoCIP = 'El código CIP debe ser numérico y tener máximo 8 dígitos';
    }
    
    // Validar password
    if (!password) {
      errors.password = 'La contraseña es obligatoria';
    }
    
    // Si hay errores, mostrarlos y detener el envío
    if (Object.keys(errors).length > 0) {
      // Mostrar errores de campos individuales
      Object.keys(errors).forEach(field => {
        if (field !== 'general') {
          showFieldError(field, errors[field]);
        }
      });
      
      // Mostrar error general si existe
      if (errors.general) {
        showGeneralError(errors.general);
      }
      
      return;
    }
    
    // Desactivar botón para evitar múltiples envíos
    const submitButton = document.getElementById('login-submit');
    submitButton.disabled = true;
    submitButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Procesando...';
    
    // Marcar como autenticando
    authStateManager.setState(authStateManager.STATES.AUTHENTICATING);
    
    // Crear objeto de credenciales
    const credentials = {
      codigoCIP: codigoCIP,
      password: password
    };
    
    // Enviar solicitud de login
    authService.login(credentials)
      .then(response => {
        console.log('[Login] Login exitoso, redirigiendo...');
        
        // Mostrar mensaje de éxito
        showSuccessMessage('Bienvenido al sistema OFICRI');
        
        // Esperar un momento antes de redirigir para que se vea el mensaje
        setTimeout(() => {
          // Solo redirigir si es seguro hacerlo
          if (authStateManager.canRedirect('dashboard')) {
            window.location.href = 'dashboard.html';
          }
        }, 800);
      })
      .catch(error => {
        console.error('[Login] Error en login:', error);
        
        // Mostrar mensaje de error
        showGeneralError(error.error || 'Error al iniciar sesión. Por favor intente nuevamente.');
        
        // Reset de estados
        authStateManager.setState(null);
        
        // Incrementar contador de intentos fallidos
        _loginAttempts++;
        
        // Si hay demasiados intentos fallidos, bloquear temporalmente
        if (_loginAttempts >= MAX_LOGIN_ATTEMPTS) {
          const blockTime = Math.min(30, Math.pow(2, _loginAttempts - MAX_LOGIN_ATTEMPTS + 1));
          showGeneralError(`Demasiados intentos fallidos. Por favor espere ${blockTime} segundos antes de intentar nuevamente.`);
          submitButton.disabled = true;
          
          setTimeout(() => {
            submitButton.disabled = false;
            clearAllErrors();
          }, blockTime * 1000);
        }
      })
      .finally(() => {
        // Reactivar botón
        submitButton.disabled = false;
        submitButton.innerHTML = 'Iniciar Sesión';
      });
  };

  /**
   * Inicializa la página de login
   */
  const _init = function() {
    // Evitar múltiples inicializaciones
    if (_isInitialized) {
      console.warn('[Login] La página de login ya fue inicializada');
      return;
    }
    
    console.log('[Login] Inicializando página de login...');
    
    // Registrar carga de página para detección de ciclos
    authStateManager.registerPageLoad('login');
    
    // Limpiar estado de autenticación y cualquier error al cargar la página
    prepareLoginForm(authStateManager.clearAuthenticationState);
    
    // Verificar si venimos de un rescate de ciclo
    if (authStateManager.getState() === authStateManager.STATES.RESCUED) {
      console.warn('[Login] Entrando en modo recuperación después de ciclo detectado');
    }
    
    // Limpiar cualquier estado de autenticación en sessionStorage
    sessionStorage.removeItem('oficri_user');
    sessionStorage.removeItem('oficri_last_page');
    
    // Obtener el contenedor de login
    _loginContainer = document.getElementById('login-container');
    if (!_loginContainer) {
      console.error('[Login] No se encontró el contenedor de login (#login-container)');
      return;
    }
    
    // Renderizar el formulario de login usando el módulo
    _form = renderLoginForm(_loginContainer);
    
    // Configurar toggle de contraseña
    setupPasswordToggle();
    
    // Configurar validación de formulario
    setupFormValidation(validateInput);
    
    // Configurar manejador de eventos para el formulario
    if (_form) {
      _form.addEventListener('submit', _handleSubmit);
    } else {
      console.error('[Login] No se encontró el formulario de login (#login-form)');
    }
    
    // Marcar como inicializado
    _isInitialized = true;
    console.log('[Login] Página de login inicializada correctamente');
    
    // Si hay error previo, mostrarlo
    const errorParam = new URLSearchParams(window.location.search).get('error');
    if (errorParam) {
      showGeneralError(decodeURIComponent(errorParam));
    }
  };

  // Retornar API pública
  return {
    init: _init
  };
})();

// Asignar al namespace global
window.OFICRI.loginPage = loginPage;

// Autoejecutar cuando DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
  loginPage.init();
}); 