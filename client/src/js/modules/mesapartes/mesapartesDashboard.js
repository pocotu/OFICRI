// Namespace para los módulos de mesa de partes
window.mesapartesModules = window.mesapartesModules || {};

// Función principal de inicialización
window.mesapartesModules.initDashboard = function() {
    // Verificar autenticación
    if (!window.isAuthenticated()) {
        window.location.href = '/login.html';
        return;
    }

    // Cargar información del usuario
    loadUserInfo();

    // Inicializar módulos
    initializeModules();

    // Configurar navegación
    setupNavigation();

    // Configurar eventos globales
    setupGlobalEvents();
};

// Cargar información del usuario
function loadUserInfo() {
    const userInfo = window.getCurrentUser();
    if (userInfo) {
        document.getElementById('username').textContent = userInfo.username;
        document.getElementById('user-role').textContent = userInfo.role;
    }
}

// Inicializar todos los módulos
function initializeModules() {
    // Inicializar gestión de documentos
    if (window.mesapartesModules.initDocumentManagement) {
        window.mesapartesModules.initDocumentManagement();
    }

    // Inicializar gestión de derivaciones
    if (window.mesapartesModules.initDerivacionManagement) {
        window.mesapartesModules.initDerivacionManagement();
    }

    // Inicializar seguimiento
    if (window.mesapartesModules.initSeguimientoManagement) {
        window.mesapartesModules.initSeguimientoManagement();
    }

    // Inicializar reportes
    if (window.mesapartesModules.initReportesManagement) {
        window.mesapartesModules.initReportesManagement();
    }
}

// Configurar navegación entre secciones
function setupNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    const sections = document.querySelectorAll('.content-section');

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const targetSection = item.getAttribute('data-section');
            
            // Actualizar navegación
            navItems.forEach(navItem => navItem.classList.remove('active'));
            item.classList.add('active');

            // Mostrar sección correspondiente
            sections.forEach(section => {
                if (section.id === `${targetSection}-section`) {
                    section.classList.add('active');
                } else {
                    section.classList.remove('active');
                }
            });
        });
    });
}

// Configurar eventos globales
function setupGlobalEvents() {
    // Configurar botón de cerrar sesión
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            try {
                await window.logout();
                window.location.href = '/login.html';
            } catch (error) {
                console.error('Error al cerrar sesión:', error);
                window.showErrorMessage('Error al cerrar sesión');
            }
        });
    }

    // Configurar botón de nuevo documento
    const nuevoDocumentoBtn = document.getElementById('nuevo-documento-btn');
    if (nuevoDocumentoBtn) {
        nuevoDocumentoBtn.addEventListener('click', () => {
            const modal = new bootstrap.Modal(document.getElementById('nuevoDocumentoModal'));
            modal.show();
        });
    }

    // Manejar eventos de búsqueda global
    const searchInput = document.querySelector('.search-bar input');
    if (searchInput) {
        searchInput.addEventListener('input', debounce((e) => {
            const searchTerm = e.target.value.trim();
            if (searchTerm.length >= 3) {
                window.mesapartesModules.searchDocuments(searchTerm);
            }
        }, 300));
    }
}

// Utilidad para debounce
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Exportar funciones útiles para otros módulos
window.mesapartesModules.refreshDashboard = function() {
    loadUserInfo();
    if (window.mesapartesModules.refreshDocuments) {
        window.mesapartesModules.refreshDocuments();
    }
    if (window.mesapartesModules.refreshDerivaciones) {
        window.mesapartesModules.refreshDerivaciones();
    }
    if (window.mesapartesModules.refreshReportes) {
        window.mesapartesModules.refreshReportes();
    }
};

// Función para mostrar mensajes de error
window.mesapartesModules.showError = function(message) {
    // Implementar según el sistema de notificaciones que uses
    console.error(message);
    alert(message);
};

// Función para mostrar mensajes de éxito
window.mesapartesModules.showSuccess = function(message) {
    // Implementar según el sistema de notificaciones que uses
    console.log(message);
    alert(message);
}; 