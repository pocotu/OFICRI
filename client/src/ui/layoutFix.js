/**
 * OFICRI Layout Fix
 * Script específico para solucionar problemas visuales con el sidebar
 */

// Estado global
let applied = false;
let observer = null;

/**
 * Aplica las correcciones de layout
 */
function applyFixes() {
  if (applied) return;
  console.log('LayoutFix: Aplicando correcciones de layout');
  
  // Inyectar estilos de corrección
  injectFixStyles();
  
  // Configurar observer para monitores de cambios de clase
  setupObserver();
  
  // Agregar listener para el evento resize
  window.addEventListener('resize', handleResize);
  
  // Marcar como aplicado
  applied = true;
  
  // Forzar una corrección inmediata
  fixLayout();
}

/**
 * Inyecta estilos CSS específicos para corregir problemas visuales
 */
function injectFixStyles() {
  // Crear o recuperar elemento de estilo
  let styleEl = document.getElementById('layout-fixes');
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = 'layout-fixes';
    document.head.appendChild(styleEl);
  }
  
  // Definir reglas CSS críticas
  styleEl.textContent = `
    /* Correcciones críticas para el layout */
    .oficri-app {
      width: 100% !important;
      display: flex !important;
      flex-direction: column !important;
      overflow-x: hidden !important;
    }
    
    .oficri-container {
      width: 100% !important;
      display: flex !important;
      overflow-x: hidden !important;
    }
    
    /* Estado expandido */
    .oficri-sidebar {
      flex: 0 0 260px !important;
      width: 260px !important;
      min-width: 260px !important;
      display: block !important;
    }
    
    .oficri-main {
      flex: 1 !important;
      width: calc(100% - 260px) !important;
    }
    
    /* Estado colapsado */
    .sidebar-collapsed .oficri-sidebar {
      flex: 0 0 0 !important;
      width: 0 !important;
      min-width: 0 !important;
      margin-left: -260px !important;
      display: none !important;
      overflow: hidden !important;
    }
    
    .sidebar-collapsed .oficri-main {
      width: 100% !important;
      flex: 1 !important;
      margin-left: 0 !important;
    }
    
    /* Correcciones para móvil */
    @media (max-width: 992px) {
      .oficri-main {
        width: 100% !important;
        flex: 1 !important;
        margin-left: 0 !important;
      }
    }
  `;
  
  console.log('LayoutFix: Estilos de corrección inyectados');
}

/**
 * Configura un observer para detectar cambios de clase
 */
function setupObserver() {
  if (observer) {
    observer.disconnect();
  }
  
  const appContainer = document.querySelector('.oficri-app');
  if (!appContainer) {
    console.error('LayoutFix: No se encontró el contenedor .oficri-app');
    return;
  }
  
  observer = new MutationObserver(mutations => {
    let needsFixing = false;
    
    for (const mutation of mutations) {
      if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
        needsFixing = true;
        break;
      }
    }
    
    if (needsFixing) {
      console.log('LayoutFix: Cambio en clases detectado, aplicando correcciones');
      fixLayout();
    }
  });
  
  observer.observe(appContainer, {
    attributes: true,
    attributeFilter: ['class']
  });
  
  console.log('LayoutFix: Observer configurado');
}

/**
 * Maneja el evento de cambio de tamaño de ventana
 */
function handleResize() {
  console.log('LayoutFix: Cambio de tamaño detectado, aplicando correcciones');
  fixLayout();
}

/**
 * Corrige el layout basado en el estado actual
 */
function fixLayout() {
  const appContainer = document.querySelector('.oficri-app');
  const sidebar = document.querySelector('.oficri-sidebar');
  const mainContent = document.querySelector('.oficri-main');
  
  if (!appContainer || !sidebar || !mainContent) {
    console.error('LayoutFix: No se encontraron los elementos necesarios');
    return;
  }
  
  const isCollapsed = appContainer.classList.contains('sidebar-collapsed');
  const isMobile = window.innerWidth < 992;
  
  console.log('LayoutFix: Corrigiendo layout', { isCollapsed, isMobile });
  
  if (isCollapsed || isMobile) {
    // Sidebar colapsado o móvil
    mainContent.style.width = '100%';
    mainContent.style.marginLeft = '0';
    mainContent.style.flex = '1';
    mainContent.style.left = '0';
    
    sidebar.style.flex = '0 0 0';
    sidebar.style.width = '0';
    sidebar.style.minWidth = '0';
    sidebar.style.marginLeft = '-260px';
    sidebar.style.display = 'none';
  } else {
    // Sidebar expandido en desktop
    mainContent.style.width = 'calc(100% - 260px)';
    mainContent.style.marginLeft = '0';
    mainContent.style.flex = '1';
    
    sidebar.style.flex = '0 0 260px';
    sidebar.style.width = '260px';
    sidebar.style.minWidth = '260px';
    sidebar.style.marginLeft = '0';
    sidebar.style.display = 'block';
  }
  
  // Forzar recálculo
  void mainContent.offsetWidth;
  
  console.log('LayoutFix: Layout corregido');
}

// Exponer API pública
const layoutFix = {
  applyFixes,
  fixLayout
};

// Exponer globalmente
if (typeof window !== 'undefined') {
  window.layoutFix = layoutFix;
  console.log('LayoutFix: API expuesta globalmente');
  
  // Auto-aplicar después de que el DOM esté listo
  window.addEventListener('DOMContentLoaded', () => {
    setTimeout(applyFixes, 100);
  });
  
  // Y también después de que todo el contenido esté cargado
  window.addEventListener('load', () => {
    setTimeout(fixLayout, 500);
  });
}

export default layoutFix; 