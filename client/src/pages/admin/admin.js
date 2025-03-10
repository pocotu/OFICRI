/**
 * Página de administración
 * Maneja la lógica y renderizado del panel de administración
 */

import AuthService from '../../services/auth.service.js';

// Verificar autenticación antes de cargar cualquier módulo
if (!AuthService.isAuthenticated()) {
    AuthService.redirectToLogin();
    throw new Error('No autenticado');
}

const user = AuthService.getCurrentUser();
if (!user || !(user.idRol === 1 || user.IDRol === 1)) {
    AuthService.redirectToLogin();
    throw new Error('No autorizado');
}

let loadingModules = false;
let modules = null;

// Importar módulos de manera dinámica para evitar problemas de carga
async function loadModules() {
    if (loadingModules) return null;
    if (modules) return modules;

    loadingModules = true;

    try {
        const imports = await Promise.all([
            import('../../modules/dashboardModule.js'),
            import('./users.js'),
            import('../../utils/permissions.js'),
            import('../../components/Header/Header.js'),
            import('../../components/Sidebar/Sidebar.js')
        ]);

        modules = {
            dashboardModule: imports[0],
            usersPage: imports[1],
            permissionUtils: imports[2],
            Header: imports[3].default,
            Sidebar: imports[4].default
        };

        return modules;
    } catch (error) {
        console.error('Error al cargar módulos:', error);
        AuthService.redirectToLogin();
        return null;
    } finally {
        loadingModules = false;
    }
}

// Inicialización cuando el DOM está listo
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Cargar módulos
        const loadedModules = await loadModules();
        if (!loadedModules) {
            throw new Error('No se pudieron cargar los módulos');
        }

        // Mostrar la interfaz de administración
        document.querySelector('.admin-layout').style.display = 'block';
        document.getElementById('loadingOverlay').style.display = 'none';

        // Inicializar componentes
        await initializeComponents(loadedModules);

        // Inicializar eventos de navegación
        initNavigation(loadedModules);
        
        // Cargar la ruta inicial
        await handleRoute(loadedModules);

    } catch (error) {
        console.error('Error al inicializar página de administración:', error);
        AuthService.redirectToLogin();
    }
});

/**
 * Inicializa los componentes principales
 */
async function initializeComponents({ Header, Sidebar }) {
    try {
        // Inicializar Header
        const header = new Header();
        await header.render(document.getElementById('headerComponent'));

        // Inicializar Sidebar
        const sidebar = new Sidebar();
        await sidebar.render(document.getElementById('sidebarComponent'));

    } catch (error) {
        console.error('Error al inicializar componentes:', error);
        throw error;
    }
}

// Manejador de rutas
async function handleRoute({ dashboardModule, usersPage }) {
    const path = window.location.pathname;
    const mainContent = document.getElementById('mainContent');
    const statsContainer = document.querySelector('.stats-container');

    try {
        // Mostrar u ocultar las estadísticas según la ruta
        if (statsContainer) {
            statsContainer.style.display = 
                (path === '/admin.html' || path === '/admin' || path === '/admin/dashboard.html') 
                ? 'grid' : 'none';
        }

        // Manejar las diferentes rutas
        switch (path) {
            case '/admin.html':
            case '/admin':
            case '/admin/dashboard.html':
                mainContent.innerHTML = dashboardModule.renderDashboardContent();
                await dashboardModule.initDashboard();
                break;
            case '/admin/users.html':
                mainContent.innerHTML = usersPage.renderUsersContent();
                await usersPage.initUsersPage();
                break;
            case '/admin/roles.html':
                mainContent.innerHTML = '<h2>Gestión de Roles</h2>';
                break;
            case '/admin/areas.html':
                mainContent.innerHTML = '<h2>Gestión de Áreas</h2>';
                break;
            case '/admin/documents.html':
                mainContent.innerHTML = '<h2>Gestión de Documentos</h2>';
                break;
            case '/admin/audit.html':
                mainContent.innerHTML = '<h2>Registros / Auditoría</h2>';
                break;
            case '/admin/export.html':
                mainContent.innerHTML = '<h2>Exportar</h2>';
                break;
            default:
                mainContent.innerHTML = '<h2>Página no encontrada</h2>';
        }
    } catch (error) {
        console.error('Error al manejar ruta:', error);
        mainContent.innerHTML = `
            <div class="alert alert-danger">
                Error al cargar el contenido: ${error.message}
            </div>
        `;
    }
}

// Inicializar eventos de navegación
function initNavigation(modules) {
    // Manejar clics en enlaces del menú
    document.addEventListener('click', (e) => {
        const link = e.target.closest('a');
        if (link && link.href) {
            e.preventDefault();
            const url = new URL(link.href);
            window.history.pushState({}, '', url.pathname);
            handleRoute(modules);
        }
    });

    // Manejar navegación del navegador
    window.addEventListener('popstate', () => handleRoute(modules));
} 