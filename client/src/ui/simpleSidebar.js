/**
 * OFICRI Simple Sidebar
 * Controlador simplificado para la barra lateral
 */

// Estado global del sidebar
let sidebarVisible = true;
let initialized = false;

// Elementos DOM
let sidebar = null;
let mainContent = null;
let appContainer = null;
let toggleButton = null;

/**
 * Inicializa el sidebar
 */
function init() {
  console.log('SimpleSidebar: Intentando inicializar');
  if (initialized) {
    console.log('SimpleSidebar: Ya estaba inicializado');
    return;
  }
  
  // Obtener elementos DOM
  sidebar = document.querySelector('.oficri-sidebar');
  mainContent = document.querySelector('.oficri-main');
  appContainer = document.querySelector('.oficri-app');
  toggleButton = document.querySelector('#menu-toggle');
  
  if (!sidebar || !mainContent || !appContainer || !toggleButton) {
    console.error('SimpleSidebar: No se pudieron encontrar los elementos DOM para el sidebar', {
      sidebar: !!sidebar,
      mainContent: !!mainContent,
      appContainer: !!appContainer,
      toggleButton: !!toggleButton
    });
    return;
  }
  
  console.log('SimpleSidebar: Elementos DOM encontrados correctamente');
  
  // Verificar estado inicial en móviles
  if (window.innerWidth < 992) {
    sidebarVisible = false;
    hideSidebar();
  }
  
  // Clonar el botón para eliminar cualquier handler existente
  const newToggleButton = toggleButton.cloneNode(true);
  toggleButton.parentNode.replaceChild(newToggleButton, toggleButton);
  toggleButton = newToggleButton;
  
  // Agregar evento al botón
  toggleButton.addEventListener('click', function(e) {
    e.preventDefault();
    console.log('SimpleSidebar: Botón toggle clickeado');
    toggleSidebar();
  });
  
  // Actualizar en cambio de tamaño de ventana
  window.addEventListener('resize', function() {
    updateLayout();
  });
  
  // Inyectar estilos adicionales para solucionar el problema de espacios
  injectFixes();
  
  initialized = true;
  console.log('SimpleSidebar: Inicializado correctamente');
}

/**
 * Inyecta estilos CSS adicionales para corregir problemas
 */
function injectFixes() {
  // Crear o recuperar el elemento de estilo
  let styleEl = document.getElementById('sidebar-fixes');
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = 'sidebar-fixes';
    document.head.appendChild(styleEl);
  }
  
  // Añadir reglas CSS para corregir problemas de layout
  styleEl.textContent = `
    .sidebar-collapsed .oficri-main {
      width: 100% !important;
      margin-left: 0 !important;
      max-width: 100% !important;
      padding-left: 1.5rem !important;
    }
    
    .sidebar-collapsed .oficri-sidebar {
      width: 0 !important;
      min-width: 0 !important;
      flex: 0 0 0 !important;
      margin-left: -260px !important;
      overflow: hidden !important;
      display: none !important;
    }
    
    .oficri-container {
      width: 100% !important;
      display: flex;
      overflow-x: hidden;
    }
    
    .oficri-app {
      display: flex;
      flex-direction: column;
      min-height: 100vh;
      overflow-x: hidden;
    }
  `;
  
  console.log('SimpleSidebar: Estilos de corrección inyectados');
}

/**
 * Alterna la visibilidad del sidebar
 */
function toggleSidebar() {
  console.log('SimpleSidebar: Toggle sidebar llamado, estado actual:', sidebarVisible);
  if (sidebarVisible) {
    hideSidebar();
  } else {
    showSidebar();
  }
}

/**
 * Muestra el sidebar
 */
function showSidebar() {
  sidebarVisible = true;
  appContainer.classList.remove('sidebar-collapsed');
  
  // Aplicar estilos directamente
  if (window.innerWidth >= 992) {
    // Desktop
    mainContent.style.width = 'calc(100% - 260px)';
    mainContent.style.marginLeft = '0';
    sidebar.style.width = '260px';
    sidebar.style.minWidth = '260px';
    sidebar.style.display = 'block';
    sidebar.style.flex = '0 0 260px';
    sidebar.style.transform = 'translateX(0)';
    sidebar.style.visibility = 'visible';
    sidebar.style.marginLeft = '0';
    
    // Forzar repintado
    void mainContent.offsetWidth;
  } else {
    // Mobile
    mainContent.style.width = '100%';
    sidebar.style.transform = 'translateX(0)';
    sidebar.style.visibility = 'visible';
    sidebar.style.display = 'block';
  }
  
  console.log('SimpleSidebar: Sidebar mostrado');
}

/**
 * Oculta el sidebar
 */
function hideSidebar() {
  sidebarVisible = false;
  appContainer.classList.add('sidebar-collapsed');
  
  // Aplicar estilos directamente
  mainContent.style.width = '100%';
  mainContent.style.marginLeft = '0';
  mainContent.style.maxWidth = '100%';
  
  sidebar.style.width = '0';
  sidebar.style.minWidth = '0';
  sidebar.style.marginLeft = '-260px';
  sidebar.style.transform = 'translateX(-100%)';
  sidebar.style.visibility = 'hidden';
  sidebar.style.flex = '0 0 0';
  sidebar.style.overflow = 'hidden';
  
  // En navegadores antiguos, display:none ayuda a evitar problemas de espacio
  setTimeout(() => {
    sidebar.style.display = 'none';
  }, 300);
  
  // Forzar repintado
  void mainContent.offsetWidth;
  
  console.log('SimpleSidebar: Sidebar ocultado');
}

/**
 * Actualiza el layout según el tamaño de la ventana
 */
function updateLayout() {
  const isMobile = window.innerWidth < 992;
  
  if (isMobile && sidebarVisible) {
    // En móvil, ocultar sidebar por defecto
    hideSidebar();
  } else if (!isMobile) {
    // En desktop, actualizar según visibilidad
    if (sidebarVisible) {
      showSidebar();
    } else {
      hideSidebar();
    }
  }
}

// API para exportar
const simpleSidebarAPI = {
  init,
  toggleSidebar,
  showSidebar,
  hideSidebar,
  updateLayout,
  isVisible: () => sidebarVisible
};

// Asegurar que está disponible en el ámbito global
if (typeof window !== 'undefined') {
  window.simpleSidebar = simpleSidebarAPI;
  console.log('SimpleSidebar: API expuesta globalmente');
}

// También exportar como módulo ES6
export const simpleSidebar = simpleSidebarAPI;
export default simpleSidebarAPI;

// Auto-inicializar después de un breve retraso
if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', function() {
    console.log('SimpleSidebar: DOMContentLoaded detectado, inicializando después de un breve retraso');
    setTimeout(() => {
      if (!initialized) {
        init();
      }
    }, 100);
  });
} 