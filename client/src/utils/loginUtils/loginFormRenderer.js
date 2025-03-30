/**
 * Login Form Renderer
 * Módulo para la renderización del formulario de login
 */

/**
 * Crea y renderiza el HTML del formulario de login
 * @param {HTMLElement} container - Contenedor donde se renderizará el formulario
 * @returns {HTMLElement} - Elemento del formulario renderizado
 */
export function renderLoginForm(container) {
  if (!container) {
    console.error('[LoginFormRenderer] No se proporcionó un contenedor válido');
    return null;
  }

  // Generar HTML del formulario de login
  const loginHTML = `
    <div class="login-card">
      <div class="login-header">
        <img src="assets/img/logoOficri2x2.png" alt="Logo OFICRI" class="login-logo">
        <h2 class="login-title">Sistema de Gestión OFICRI</h2>
      </div>

      <div class="alert alert-danger d-none" id="login-general-error" role="alert"></div>
      <div class="alert alert-success d-none" id="login-success-message" role="alert"></div>

      <form id="login-form" class="login-form" novalidate>
        <div class="form-group">
          <label for="codigoCIP">CIP</label>
          <div class="input-group">
            <span class="input-icon-container">
              <i class="fas fa-id-card input-icon"></i>
            </span>
            <input 
              type="text" 
              class="form-control" 
              id="codigoCIP" 
              name="codigoCIP" 
              placeholder="Ingrese su CIP" 
              autocomplete="off" 
              required
            >
          </div>
          <div id="codigoCIP-feedback" class="invalid-feedback"></div>
        </div>

        <div class="form-group">
          <label for="password">Contraseña</label>
          <div class="input-group">
            <span class="input-icon-container">
              <i class="fas fa-lock input-icon"></i>
            </span>
            <input 
              type="password" 
              class="form-control" 
              id="password" 
              name="password" 
              placeholder="Ingrese su contraseña" 
              required
            >
            <span class="password-toggle-container">
              <i class="fas fa-eye-slash password-toggle" id="password-toggle"></i>
            </span>
          </div>
          <div id="password-feedback" class="invalid-feedback"></div>
        </div>

        <div class="form-actions">
          <button type="submit" id="login-submit" class="login-btn">
            <i class="fas fa-sign-in-alt"></i> Iniciar Sesión
          </button>
        </div>
      </form>
    </div>
  `;

  // Insertar el HTML en el contenedor
  container.innerHTML = loginHTML;
  
  // Devolver el formulario para su uso
  return document.getElementById('login-form');
}

/**
 * Configura el toggle de visibilidad de la contraseña
 * @returns {void}
 */
export function setupPasswordToggle() {
  const passwordToggle = document.getElementById('password-toggle');
  const passwordInput = document.getElementById('password');
  
  if (!passwordToggle || !passwordInput) {
    console.error('[LoginFormRenderer] No se encontraron los elementos para el toggle de contraseña');
    return;
  }
  
  let passwordVisible = false;
  
  passwordToggle.addEventListener('click', function() {
    passwordVisible = !passwordVisible;
    passwordInput.type = passwordVisible ? 'text' : 'password';
    passwordToggle.classList.toggle('fa-eye', passwordVisible);
    passwordToggle.classList.toggle('fa-eye-slash', !passwordVisible);
  });
}

/**
 * Configura la validación en tiempo real para los campos del formulario
 * @param {Function} validateFn - Función para validar los campos
 * @returns {void}
 */
export function setupFormValidation(validateFn) {
  const codigoCIPInput = document.getElementById('codigoCIP');
  
  if (!codigoCIPInput || typeof validateFn !== 'function') {
    console.error('[LoginFormRenderer] No se pueden configurar las validaciones');
    return;
  }
  
  codigoCIPInput.addEventListener('blur', function() {
    if (this.value) {
      if (!validateFn(this.value, 'codigoCIP')) {
        showFieldError('codigoCIP', 'El código CIP debe ser numérico y tener máximo 8 dígitos');
      } else {
        clearFieldError('codigoCIP');
      }
    }
  });
}

/**
 * Muestra un mensaje de error para un campo específico
 * @param {string} fieldId - ID del campo
 * @param {string} message - Mensaje de error
 */
export function showFieldError(fieldId, message) {
  const field = document.getElementById(fieldId);
  if (!field) return;

  // Añadir clase de error al campo
  field.classList.add('is-invalid');

  // Mostrar mensaje de error
  const feedbackElement = document.getElementById(`${fieldId}-feedback`);
  if (feedbackElement) {
    feedbackElement.textContent = message;
  }
}

/**
 * Limpia el error de un campo específico
 * @param {string} fieldId - ID del campo
 */
export function clearFieldError(fieldId) {
  const field = document.getElementById(fieldId);
  if (!field) return;

  // Remover clase de error
  field.classList.remove('is-invalid');

  // Limpiar mensaje de error
  const feedbackElement = document.getElementById(`${fieldId}-feedback`);
  if (feedbackElement) {
    feedbackElement.textContent = '';
  }
}

/**
 * Muestra un mensaje de error general en el formulario
 * @param {string} message - Mensaje de error
 */
export function showGeneralError(message) {
  const generalError = document.getElementById('login-general-error');
  if (!generalError) return;
  
  generalError.textContent = message;
  generalError.classList.remove('d-none');
  
  // Añadir animación de shake para llamar la atención
  generalError.classList.add('shake-error');
  setTimeout(() => {
    generalError.classList.remove('shake-error');
  }, 500);
}

/**
 * Muestra un mensaje de éxito en el formulario
 * @param {string} message - Mensaje de éxito
 */
export function showSuccessMessage(message) {
  const successElement = document.getElementById('login-success-message');
  if (!successElement) return;
  
  successElement.textContent = message;
  successElement.classList.remove('d-none');
}

/**
 * Limpia todos los mensajes de error en el formulario
 */
export function clearAllErrors() {
  // Remover mensajes de error generales
  const generalError = document.getElementById('login-general-error');
  if (generalError) {
    generalError.textContent = '';
    generalError.classList.add('d-none');
  }

  // Limpiar errores de campos individuales
  const errorElements = document.querySelectorAll('.invalid-feedback');
  errorElements.forEach(element => {
    element.textContent = '';
  });

  // Remover clases de error de los campos
  const inputElements = document.querySelectorAll('.form-control');
  inputElements.forEach(element => {
    element.classList.remove('is-invalid');
  });
}

/**
 * Prepara el formulario para un nuevo intento de login, limpiando errores
 * y estados de autenticación pendientes
 * @param {Function} authStateCleanerFn - Función para limpiar estados de autenticación
 */
export function prepareLoginForm(authStateCleanerFn) {
  // Limpiar todos los errores visibles
  clearAllErrors();
  
  // Habilitar el botón de submit si estaba deshabilitado
  const submitButton = document.getElementById('login-submit');
  if (submitButton) {
    submitButton.disabled = false;
    submitButton.innerHTML = '<i class="fas fa-sign-in-alt"></i> Iniciar Sesión';
  }
  
  // Si se proporcionó una función para limpiar estados de autenticación, usarla
  if (typeof authStateCleanerFn === 'function') {
    const cleaned = authStateCleanerFn();
    if (cleaned) {
      console.log('[LoginFormRenderer] Se limpió un estado de autenticación pendiente');
    }
  }
} 