/**
 * Login Layout Renderer
 * Módulo para la renderización del layout principal de la página de login
 */

/**
 * Crea y renderiza el HTML del layout de login con el diseño institucional de OFICRI
 * @param {HTMLElement} container - Contenedor donde se renderizará el layout
 * @returns {HTMLElement} - Elemento del contenedor interno donde irá el formulario
 */
export function renderLoginLayout(container) {
  if (!container) {
    console.error('[LoginLayoutRenderer] No se proporcionó un contenedor válido');
    return null;
  }

  // Generar HTML del layout de login según el diseño institucional
  const loginLayoutHTML = `
    <div class="oficri-login-page">
      <header class="oficri-header">
        <div class="header-logo-left">
          <img src="assets/img/logoOficri2x2.png" alt="Logo OFICRI" class="logo-oficri">
        </div>
        <div class="header-title">
          <h1>OFICINA DE CRIMINALÍSTICA CUSCO</h1>
        </div>
        <div class="header-logo-right">
          <img src="assets/img/logoPolicia2x2.png" alt="Logo Policía Nacional del Perú" class="logo-pnp">
        </div>
      </header>
      
      <main class="oficri-login-content">
        <div id="login-form-container" class="login-form-container">
          <!-- El formulario de login se renderizará aquí -->
        </div>
      </main>
      
      <footer class="oficri-footer">
        <p>&copy; ${new Date().getFullYear()} OFICRI Cusco - Todos los derechos reservados</p>
      </footer>
    </div>
  `;

  // Insertar el HTML en el contenedor
  container.innerHTML = loginLayoutHTML;
  
  // Devolver el contenedor interno donde irá el formulario
  return document.getElementById('login-form-container');
} 