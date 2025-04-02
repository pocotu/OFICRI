/**
 * OFICRI - Página de Login
 * Implementa el acceso seguro al sistema mediante Código CIP y contraseña
 * Cumple con ISO/IEC 27001 para el control de acceso
 */

// Importar dependencias
import { authService } from '../services/authService.js';
import { validateInput } from '../utils/validators.js';
import { uiManager } from '../utils/uiManager.js';
import { appConfig } from '../config/appConfig.js';

// Inicializar namespace
window.OFICRI = window.OFICRI || {};

// Login Page Module
const loginPage = (function() {
  'use strict';
  
  // Referencias a elementos DOM
  let _form = null;
  let _cipInput = null;
  let _passwordInput = null;
  let _rememberCheck = null;
  let _submitButton = null;
  let _errorContainer = null;
  
  // Estado del formulario
  let _isSubmitting = false;
  let _loginAttempts = 0;
  let _maxLoginAttempts = 5;
  let _isBlocked = false;
  let _blockTimeout = null;
  
  /**
   * Inicializa la página de login
   */
  const init = function() {
    console.log('[LOGIN] Inicializando página de login');
    
    // Si ya está autenticado, redirigir al dashboard
    _checkAuthentication();
    
    // Capturar referencias a elementos
    _form = document.getElementById('login-form');
    _cipInput = document.getElementById('cip-input');
    _passwordInput = document.getElementById('password-input');
    _rememberCheck = document.getElementById('remember-check');
    _submitButton = document.querySelector('#login-form button[type="submit"]');
    _errorContainer = document.getElementById('login-error');
    
    // Si alguno no existe, mostrar error
    if (!_form || !_cipInput || !_passwordInput || !_submitButton) {
      console.error('[LOGIN] Error al inicializar: faltan elementos en el DOM');
      return;
    }
    
    // Configurar eventos
    _setupEvents();
    
    // Restaurar cip de localStorage si existe
    _restoreSavedCip();
    
    // Enfocar en el primer campo vacío
    if (_cipInput.value) {
      _passwordInput.focus();
    } else {
      _cipInput.focus();
    }
    
    // Verificar si hay error en la URL
    _checkUrlParams();
  };
  
  /**
   * Configura los eventos de la página
   * @private
   */
  const _setupEvents = function() {
    // Evento de envío del formulario
    _form.addEventListener('submit', _handleSubmit);
    
    // Validación en tiempo real
    _cipInput.addEventListener('input', function() {
      const isValid = validateInput(this.value, 'codigoCIP');
      _updateFieldValidation(this, isValid);
    });
    
    _passwordInput.addEventListener('input', function() {
      const isValid = validateInput(this.value, 'password');
      _updateFieldValidation(this, isValid);
    });
    
    // Mostrar u ocultar contraseña
    const togglePasswordBtn = document.getElementById('toggle-password');
    if (togglePasswordBtn) {
      togglePasswordBtn.addEventListener('click', function() {
        if (_passwordInput.type === 'password') {
          _passwordInput.type = 'text';
          this.innerHTML = '<i class="fas fa-eye-slash"></i>';
        } else {
          _passwordInput.type = 'password';
          this.innerHTML = '<i class="fas fa-eye"></i>';
        }
      });
    }
  };
  
  /**
   * Verifica si el usuario ya está autenticado
   * @private
   */
  const _checkAuthentication = function() {
    // Si ya está autenticado, redirigir al dashboard
    if (authService.isAuthenticated()) {
      console.log('[LOGIN] Usuario ya autenticado, redirigiendo al dashboard');
      window.location.href = '/dashboard';
    }
  };
    
  /**
   * Restaura el CIP guardado en localStorage
   * @private
   */
  const _restoreSavedCip = function() {
    const savedCip = localStorage.getItem('saved_cip');
    if (savedCip) {
      _cipInput.value = savedCip;
      if (_rememberCheck) {
        _rememberCheck.checked = true;
    }
    }
  };
  
  /**
   * Verifica parámetros en la URL para mensajes de error
   * @private
   */
  const _checkUrlParams = function() {
    const urlParams = new URLSearchParams(window.location.search);
    const error = urlParams.get('error');
    const message = urlParams.get('message');
    
    if (error) {
      let errorMessage = 'Error de autenticación';
      
      switch (error) {
        case 'session_expired':
          errorMessage = 'Su sesión ha expirado. Por favor inicie sesión nuevamente.';
          break;
        case 'unauthorized':
          errorMessage = 'No tiene permisos para acceder a este recurso.';
          break;
        case 'invalid_token':
          errorMessage = 'Token de autenticación inválido. Por favor inicie sesión nuevamente.';
          break;
        default:
          errorMessage = message || errorMessage;
    }
    
      _showError(errorMessage);
      
      // Limpiar URL para evitar que el error persista en recargas
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);
    }
  };
  
  /**
   * Maneja el envío del formulario de login
   * @param {Event} event - Evento de submit
   * @private
   */
  const _handleSubmit = async function(event) {
    event.preventDefault();
    
    // Si ya está enviando o bloqueado, no hacer nada
    if (_isSubmitting || _isBlocked) {
      return;
    }
    
    // Obtener valores del formulario
    const cip = _cipInput.value.trim();
    const password = _passwordInput.value;
    const remember = _rememberCheck ? _rememberCheck.checked : false;
    
    // Validar campos
    if (!cip) {
      _showError('Por favor ingrese su Código CIP');
      _cipInput.focus();
      return;
    }
    
    if (!password) {
      _showError('Por favor ingrese su contraseña');
      _passwordInput.focus();
      return;
    }
    
    // Validación de CIP
    if (!validateInput(cip, 'codigoCIP')) {
      _showError('El Código CIP debe ser numérico y tener máximo 8 dígitos');
      _cipInput.focus();
      return;
    }
    
    // Mostrar loading y deshabilitar botón
    _isSubmitting = true;
    _showLoading();
    
    try {
      // Intentar login
      const loginData = {
        codigoCIP: cip,
        password: password,
        remember: remember
      };
      
      const user = await authService.login(loginData);
      
      // Si llegamos aquí, el login fue exitoso
      console.log('[LOGIN] Login exitoso, redirigiendo...');
      
      // Guardar CIP si remember está marcado
      if (remember) {
        localStorage.setItem('saved_cip', cip);
      } else {
        localStorage.removeItem('saved_cip');
      }
      
      // Resetear contadores de intentos
      _loginAttempts = 0;
      
      // Redirigir según rol si está configurado
      _redirectBasedOnRole(user);
    } catch (error) {
      // Incrementar contador de intentos fallidos
      _loginAttempts++;
      
      // Mostrar error
      _showError(_formatErrorMessage(error));
      
      // Si excedió intentos máximos, bloquear temporalmente
      if (_loginAttempts >= _maxLoginAttempts) {
        _blockLogin();
      }
      
      // Log del error (sin contraseña)
      console.error('[LOGIN] Error de login:', error.message);
    } finally {
      // Restaurar estado del botón
      _hideLoading();
      _isSubmitting = false;
    }
  };
  
  /**
   * Formatea el mensaje de error para mostrar al usuario
   * @param {Error} error - Error ocurrido
   * @returns {string} Mensaje formateado
   * @private
   */
  const _formatErrorMessage = function(error) {
    // Si el error tiene un mensaje específico, usarlo
    if (error.message) {
      // Mensajes de error comunes
      if (error.message.includes('Password incorrect') || 
          error.message.includes('contraseña incorrecta')) {
        return 'Contraseña incorrecta. Por favor verifique e intente nuevamente.';
      }
      
      if (error.message.includes('User not found') || 
          error.message.includes('usuario no encontrado')) {
        return 'El Código CIP ingresado no está registrado en el sistema.';
      }
      
      if (error.message.includes('Account is locked') || 
          error.message.includes('cuenta está bloqueada')) {
        return 'Esta cuenta está bloqueada. Por favor contacte al administrador.';
      }
      
      if (error.message.includes('Account is inactive') || 
          error.message.includes('cuenta está inactiva')) {
        return 'Esta cuenta está inactiva. Por favor contacte al administrador.';
      }
      
      if (error.message.includes('Too many failed attempts') || 
          error.message.includes('demasiados intentos fallidos')) {
        return 'Demasiados intentos fallidos. Por favor intente más tarde.';
      }
      
      if (error.message.includes('Network error') || 
          error.message.includes('Error de red') ||
          error.message.includes('Failed to fetch')) {
        return 'Error de conexión. Por favor verifique su conexión a Internet e intente nuevamente.';
      }
      
      return error.message;
    }
    
    // Mensaje genérico por defecto
    return 'Error de autenticación. Por favor intente nuevamente.';
  };
  
  /**
   * Redirige al usuario basado en su rol
   * @param {Object} user - Datos del usuario autenticado
   * @private
   */
  const _redirectBasedOnRole = function(user) {
    // URL por defecto
    let redirectUrl = '/dashboard';
    
    // Verificar si hay rutas específicas por rol
    if (user && user.NombreRol && appConfig.auth && appConfig.auth.roleRedirects) {
      const roleRedirect = appConfig.auth.roleRedirects[user.NombreRol];
      if (roleRedirect) {
        redirectUrl = roleRedirect;
      }
    }
    
    // Verificar si hay URL de retorno guardada
    const returnUrl = sessionStorage.getItem('return_url');
    if (returnUrl) {
      redirectUrl = returnUrl;
      sessionStorage.removeItem('return_url');
    }
    
    // Usar timeout para evitar problemas de redirección simultánea
    setTimeout(() => {
      console.log('[LOGIN] Redirigiendo a:', redirectUrl);
      window.location.href = redirectUrl;
    }, 300);
  };
  
  /**
   * Bloquea el formulario después de múltiples intentos fallidos
   * @private
   */
  const _blockLogin = function() {
    // Bloquear formulario
    _isBlocked = true;
    
    // Tiempo de bloqueo en segundos
    const blockTime = 60;
    let timeLeft = blockTime;
    
    // Mostrar mensaje y deshabilitar botón
    _submitButton.disabled = true;
    _showError(`Demasiados intentos fallidos. Por favor espere ${blockTime} segundos antes de intentar nuevamente.`);
    
    // Actualizar contador cada segundo
    _blockTimeout = setInterval(() => {
      timeLeft--;
      
      if (timeLeft <= 0) {
        // Desbloquear después del tiempo
        clearInterval(_blockTimeout);
        _isBlocked = false;
        _submitButton.disabled = false;
        _showError('Ya puede intentar nuevamente.');
        
        // Resetear contador de intentos
        _loginAttempts = 0;
      } else {
        // Actualizar mensaje con tiempo restante
        _showError(`Demasiados intentos fallidos. Por favor espere ${timeLeft} segundos antes de intentar nuevamente.`);
        }
    }, 1000);
  };
  
  /**
   * Muestra un mensaje de error
   * @param {string} message - Mensaje de error
   * @private
   */
  const _showError = function(message) {
    if (_errorContainer) {
      _errorContainer.textContent = message;
      _errorContainer.style.display = 'block';
      
      // Agregar clase para animación
      _errorContainer.classList.remove('shake');
      void _errorContainer.offsetWidth; // Forzar reflow para reiniciar animación
      _errorContainer.classList.add('shake');
    } else {
      // Fallback si no existe el contenedor
      alert(message);
    }
  };
  
  /**
   * Oculta el mensaje de error
   * @private
   */
  const _hideError = function() {
    if (_errorContainer) {
      _errorContainer.style.display = 'none';
      _errorContainer.textContent = '';
    }
  };
  
  /**
   * Muestra indicador de carga en el botón
   * @private
   */
  const _showLoading = function() {
    if (_submitButton) {
      const originalText = _submitButton.textContent;
      _submitButton.dataset.originalText = originalText;
      _submitButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Verificando...';
      _submitButton.disabled = true;
    }
  };
  
  /**
   * Oculta indicador de carga en el botón
   * @private
   */
  const _hideLoading = function() {
    if (_submitButton) {
      const originalText = _submitButton.dataset.originalText || 'Ingresar';
      _submitButton.innerHTML = originalText;
      _submitButton.disabled = false;
    }
  };
  
  /**
   * Actualiza la validación visual de un campo
   * @param {HTMLElement} field - Campo a validar
   * @param {boolean} isValid - Si el campo es válido
   * @private
   */
  const _updateFieldValidation = function(field, isValid) {
    // Ocultar error al empezar a escribir
    _hideError();
    
    // Si el campo está vacío, no mostrar validación
    if (!field.value.trim()) {
      field.classList.remove('is-valid', 'is-invalid');
      return;
    }
    
    // Actualizar clases según validez
    if (isValid) {
      field.classList.add('is-valid');
      field.classList.remove('is-invalid');
    } else {
      field.classList.add('is-invalid');
      field.classList.remove('is-valid');
    }
  };
  
  // API pública
  return {
    init
  };
})();

// Inicializar al cargar el DOM
document.addEventListener('DOMContentLoaded', function() {
  loginPage.init();
}); 

// Para compatibilidad con módulos y scripts globales
window.OFICRI.loginPage = loginPage;
export { loginPage }; 