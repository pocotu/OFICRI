/**
 * OFICRI Login Page Module
 * Handles login page functionality
 */

// Create namespace if it doesn't exist
window.OFICRI = window.OFICRI || {};

// Login Page Module
OFICRI.loginPage = (function() {
  'use strict';
  
  // Private variables
  let _isLoading = false;
  let _passwordVisible = false;
  let _loginForm = null;
  
  /**
   * Initializes the login page
   */
  const _init = function() {
    // Render login page
    _renderLoginPage();
    
    // Initialize form elements
    _loginForm = document.getElementById('login-form');
    
    // Add event listeners
    _setupEventListeners();
    
    // Check if user is already logged in
    if (OFICRI.authService.isAuthenticated()) {
      _redirectToApp();
    }
  };
  
  /**
   * Renders the login page HTML
   */
  const _renderLoginPage = function() {
    const loginContainer = document.getElementById('login-container');
    
    if (!loginContainer) {
      console.error('Login container not found');
      return;
    }
    
    // Set login container class for styling
    loginContainer.className = 'login-container';
    
    // Render login form
    loginContainer.innerHTML = `
      <div class="login-card">
        <div class="login-header">
          <img src="assets/img/logo.png" alt="OFICRI Logo" class="login-logo" onerror="this.src='https://via.placeholder.com/180x60?text=OFICRI'; this.onerror=null;">
          <h1 class="login-title">OFICRI</h1>
          <p class="login-subtitle">Sistema de Gestión Documental</p>
        </div>
        
        <form id="login-form" class="login-form">
          <!-- Alert for errors -->
          <div id="login-alert" class="login-alert" style="display: none;">
            <i class="fa-solid fa-circle-exclamation login-alert-icon"></i>
            <span id="login-alert-message"></span>
          </div>
          
          <!-- Username (CIP) field -->
          <div class="form-group">
            <label for="codigoCIP">Código CIP</label>
            <i class="fa-solid fa-user input-icon"></i>
            <input type="text" id="codigoCIP" name="codigoCIP" placeholder="Ingrese su código CIP" autocomplete="username" required>
            <div class="invalid-feedback" id="codigoCIP-error"></div>
          </div>
          
          <!-- Password field -->
          <div class="form-group">
            <label for="password">Contraseña</label>
            <i class="fa-solid fa-lock input-icon"></i>
            <input type="password" id="password" name="password" placeholder="Ingrese su contraseña" autocomplete="current-password" required>
            <span class="password-toggle" id="password-toggle">
              <i class="fa-regular fa-eye"></i>
            </span>
            <div class="invalid-feedback" id="password-error"></div>
          </div>
          
          <!-- Remember me -->
          <div class="d-flex justify-content-between align-items-center mb-4">
            <div class="form-check">
              <input class="form-check-input" type="checkbox" id="rememberMe" name="rememberMe">
              <label class="form-check-label" for="rememberMe">Recordarme</label>
            </div>
            <a href="#" id="forgot-password">¿Olvidó su contraseña?</a>
          </div>
          
          <!-- Submit button -->
          <div class="form-actions">
            <button type="submit" id="login-button" class="btn btn-oficri-primary login-btn">
              <span id="login-button-text">Iniciar Sesión</span>
              <span id="login-spinner" class="spinner-border spinner-border-sm ms-2" role="status" style="display: none;">
                <span class="visually-hidden">Cargando...</span>
              </span>
            </button>
          </div>
        </form>
        
        <div class="login-footer">
          <p>Oficina Central de Informática © ${new Date().getFullYear()}</p>
          <p>Para soporte técnico contactar a <a href="mailto:soporte@oficri.gob.pe">soporte@oficri.gob.pe</a></p>
        </div>
      </div>
    `;
  };
  
  /**
   * Sets up event listeners
   */
  const _setupEventListeners = function() {
    // Login form submission
    _loginForm.addEventListener('submit', _handleLogin);
    
    // Password visibility toggle
    const passwordToggle = document.getElementById('password-toggle');
    if (passwordToggle) {
      passwordToggle.addEventListener('click', _togglePasswordVisibility);
    }
    
    // Forgot password link
    const forgotPassword = document.getElementById('forgot-password');
    if (forgotPassword) {
      forgotPassword.addEventListener('click', _handleForgotPassword);
    }
    
    // Form input validation on blur
    const codigoCIP = document.getElementById('codigoCIP');
    const password = document.getElementById('password');
    
    if (codigoCIP) {
      codigoCIP.addEventListener('blur', () => _validateField('codigoCIP'));
    }
    
    if (password) {
      password.addEventListener('blur', () => _validateField('password'));
    }
  };
  
  /**
   * Handles login form submission
   * @param {Event} event - Form submit event
   */
  const _handleLogin = async function(event) {
    event.preventDefault();
    
    // Prevent multiple submissions
    if (_isLoading) {
      return;
    }
    
    // Clear previous alerts
    _showAlert(null);
    
    // Validate form fields
    const isValid = _validateForm();
    if (!isValid) {
      return;
    }
    
    // Get form data
    const formData = new FormData(_loginForm);
    const credentials = {
      codigoCIP: formData.get('codigoCIP').trim(),
      password: formData.get('password'),
      remember: formData.get('rememberMe') === 'on'
    };
    
    // Show loading state
    _setLoading(true);
    
    try {
      // Attempt login
      await OFICRI.authService.login(credentials);
      
      // Success - redirect to app
      _redirectToApp();
    } catch (error) {
      console.error('Login error:', error);
      
      // Show error message
      _showAlert(error.message || 'Credenciales inválidas. Por favor, intente nuevamente.');
      
      // Reset loading state
      _setLoading(false);
    }
  };
  
  /**
   * Toggles password visibility
   */
  const _togglePasswordVisibility = function() {
    const passwordInput = document.getElementById('password');
    const passwordToggle = document.getElementById('password-toggle');
    
    if (!passwordInput || !passwordToggle) {
      return;
    }
    
    _passwordVisible = !_passwordVisible;
    
    // Update input type
    passwordInput.type = _passwordVisible ? 'text' : 'password';
    
    // Update icon
    passwordToggle.innerHTML = _passwordVisible 
      ? '<i class="fa-regular fa-eye-slash"></i>' 
      : '<i class="fa-regular fa-eye"></i>';
  };
  
  /**
   * Handles forgot password link click
   * @param {Event} event - Click event
   */
  const _handleForgotPassword = function(event) {
    event.preventDefault();
    
    OFICRI.notifications.info(
      'Póngase en contacto con el administrador del sistema para restablecer su contraseña.',
      { title: 'Recuperación de Contraseña' }
    );
  };
  
  /**
   * Validates a specific form field
   * @param {string} fieldName - Field name to validate
   * @returns {boolean} - Validation result
   */
  const _validateField = function(fieldName) {
    const field = document.getElementById(fieldName);
    const errorElement = document.getElementById(`${fieldName}-error`);
    
    if (!field || !errorElement) {
      return false;
    }
    
    const value = field.value.trim();
    let isValid = true;
    let errorMessage = '';
    
    // Field-specific validation
    switch (fieldName) {
      case 'codigoCIP':
        if (!OFICRI.validators.required(value)) {
          isValid = false;
          errorMessage = 'El código CIP es requerido';
        } else if (!OFICRI.validators.codigoCIP(value)) {
          isValid = false;
          errorMessage = 'Ingrese un código CIP válido';
        }
        break;
        
      case 'password':
        if (!OFICRI.validators.required(value)) {
          isValid = false;
          errorMessage = 'La contraseña es requerida';
        }
        break;
    }
    
    // Update UI based on validation
    if (isValid) {
      field.classList.remove('is-invalid');
      errorElement.textContent = '';
    } else {
      field.classList.add('is-invalid');
      errorElement.textContent = errorMessage;
    }
    
    return isValid;
  };
  
  /**
   * Validates the entire form
   * @returns {boolean} - Validation result
   */
  const _validateForm = function() {
    const isCodigoCIPValid = _validateField('codigoCIP');
    const isPasswordValid = _validateField('password');
    
    return isCodigoCIPValid && isPasswordValid;
  };
  
  /**
   * Shows or hides alert message
   * @param {string|null} message - Alert message or null to hide
   */
  const _showAlert = function(message) {
    const alertElement = document.getElementById('login-alert');
    const alertMessage = document.getElementById('login-alert-message');
    
    if (!alertElement || !alertMessage) {
      return;
    }
    
    if (message) {
      alertMessage.textContent = message;
      alertElement.style.display = 'block';
    } else {
      alertElement.style.display = 'none';
      alertMessage.textContent = '';
    }
  };
  
  /**
   * Sets loading state for the form
   * @param {boolean} isLoading - Whether form is in loading state
   */
  const _setLoading = function(isLoading) {
    _isLoading = isLoading;
    
    const loginButton = document.getElementById('login-button');
    const loginButtonText = document.getElementById('login-button-text');
    const loginSpinner = document.getElementById('login-spinner');
    
    if (!loginButton || !loginButtonText || !loginSpinner) {
      return;
    }
    
    if (isLoading) {
      loginButton.disabled = true;
      loginButtonText.textContent = 'Iniciando sesión...';
      loginSpinner.style.display = 'inline-block';
    } else {
      loginButton.disabled = false;
      loginButtonText.textContent = 'Iniciar Sesión';
      loginSpinner.style.display = 'none';
    }
  };
  
  /**
   * Redirects to the appropriate app page based on user role
   */
  const _redirectToApp = function() {
    const user = OFICRI.authService.getUser();
    
    if (!user) {
      console.error('User data not found');
      return;
    }
    
    let redirectUrl = 'dashboard.html';
    
    // Redirect based on role
    switch (user.role) {
      case 'admin':
        redirectUrl = 'admin.html';
        break;
      case 'mesa_partes':
        redirectUrl = 'mesaPartes.html';
        break;
      case 'area':
        redirectUrl = 'area.html';
        break;
    }
    
    // Perform redirect
    window.location.href = redirectUrl;
  };
  
  // Return public API
  return {
    init: _init
  };
})();

// Initialize login page on DOM content loaded
document.addEventListener('DOMContentLoaded', function() {
  OFICRI.loginPage.init();
}); 