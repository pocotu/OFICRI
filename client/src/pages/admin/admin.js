/**
 * Página de administración
 * Maneja la lógica y renderizado del panel de administración
 */

import { authService } from '../../services/services.js';
import * as errorHandler from '../../utils/errorHandler.js';

// Variable para evitar múltiples verificaciones
let isCheckingAuth = false;
let loadingModules = false;
let modules = null;

// Verificar autenticación al cargar la página
document.addEventListener('DOMContentLoaded', async () => {
    console.log('[ADMIN] ==================== INICIO ADMIN.JS ====================');
    console.log('[ADMIN] Iniciando carga de página de administración...');
    
    try {
        // Evitar verificaciones múltiples
        if (isCheckingAuth) {
            console.log('[ADMIN] Ya hay una verificación en progreso, omitiendo inicialización');
            return;
        }
        isCheckingAuth = true;

        // Verificar autenticación
        console.log('[ADMIN] Verificando autenticación del usuario...');
        if (!authService || typeof authService.isAuthenticated !== 'function') {
            throw new Error('El servicio de autenticación no está disponible');
        }

        if (!authService.isAuthenticated()) {
            console.warn('[ADMIN] Usuario no autenticado, redirigiendo al login');
            // Guardar la ruta actual antes de redirigir
            localStorage.setItem('lastPath', window.location.pathname);
            window.location.replace('/');
            return;
        }

        const user = authService.getCurrentUser();
        console.log('[ADMIN] Datos del usuario:', user ? JSON.stringify(user) : 'No disponible');
        
        // Verificar que el usuario existe y tiene el rol correcto
        if (!user || !user.IDRol) {
            console.warn('[ADMIN] Datos de usuario inválidos, redirigiendo al login');
            authService.logout(true);
            return;
        }

        // Verificar que sea administrador
        if (user.IDRol !== 1) {
            console.warn('[ADMIN] Usuario no tiene rol de administrador, redirigiendo al dashboard');
            window.location.replace('/dashboard.html');
            return;
        }

        console.log('[ADMIN] Usuario autenticado y autorizado como administrador');

        // Cargar módulos
        console.log('[ADMIN] Cargando módulos necesarios...');
        const loadedModules = await loadModules();
        if (!loadedModules) {
            throw new Error('No se pudieron cargar los módulos necesarios');
        }

        // Mostrar la interfaz de administración (oculta por defecto en el CSS)
        console.log('[ADMIN] Mostrando interfaz de administración');
        const adminLayout = document.querySelector('.admin-layout');
        if (adminLayout) {
            adminLayout.style.display = 'grid';
        } else {
            throw new Error('No se encontró el contenedor principal del layout (.admin-layout)');
        }
        
        // Ocultar el overlay de carga
        const loadingOverlay = document.getElementById('loadingOverlay');
        if (loadingOverlay) {
            loadingOverlay.style.display = 'none';
        } else {
            console.warn('[ADMIN] No se encontró el overlay de carga (#loadingOverlay)');
        }

        // Inicializar componentes
        console.log('[ADMIN] Inicializando componentes principales');
        await initializeComponents(loadedModules);

        // Inicializar eventos de navegación
        console.log('[ADMIN] Configurando eventos de navegación');
        initNavigation(loadedModules);
        
        // Cargar la ruta inicial
        console.log('[ADMIN] Cargando contenido inicial según la ruta');
        await handleRoute(loadedModules);
        
        console.log('[ADMIN] Inicialización completada exitosamente');
        console.log('[ADMIN] ==================== FIN INICIALIZACIÓN ADMIN.JS ====================');

    } catch (error) {
        console.error('[ADMIN] Error crítico al inicializar página de administración:', error);
        
        try {
            errorHandler.handleError('ADMIN', error, 'inicializar página de administración', true);
            
            // Intentar mostrar un mensaje de error en la página
            const mainContent = document.getElementById('mainContent');
            if (mainContent) {
                mainContent.innerHTML = `
                    <div class="alert alert-danger m-4">
                        <h4><i class="fas fa-exclamation-triangle me-2"></i> Error al cargar la página</h4>
                        <p>${error.message}</p>
                        <button class="btn btn-primary mt-3" onclick="window.location.reload()">
                            <i class="fas fa-sync-alt me-2"></i> Reintentar
                        </button>
                    </div>
                `;
            }
            
            // Ocultar el overlay de carga si existe
            const loadingOverlay = document.getElementById('loadingOverlay');
            if (loadingOverlay) {
                loadingOverlay.style.display = 'none';
            }
            
            // Mostrar la interfaz para que se vea el mensaje de error
            const adminLayout = document.querySelector('.admin-layout');
            if (adminLayout) {
                adminLayout.style.display = 'grid';
            }
        } catch (displayError) {
            console.error('[ADMIN] Error adicional al mostrar mensaje de error:', displayError);
        }
        
        // Si todo falla, intentar redirigir al login
        try {
            setTimeout(() => {
                if (authService && typeof authService.logout === 'function') {
                    authService.logout(true);
                } else {
                    window.location.replace('/');
                }
            }, 5000); // Esperar 5 segundos para que el usuario pueda leer el mensaje
        } catch (logoutError) {
            console.error('[ADMIN] Error adicional al intentar redirigir:', logoutError);
        }
    } finally {
        isCheckingAuth = false;
    }
});

// Importar módulos de manera dinámica para evitar problemas de carga
async function loadModules() {
    if (loadingModules) {
        console.log('[ADMIN] Ya hay una carga de módulos en progreso, esperando...');
        return modules;
    }
    
    if (modules) {
        console.log('[ADMIN] Usando módulos previamente cargados');
        return modules;
    }

    console.log('[ADMIN] Iniciando carga de módulos...');
    loadingModules = true;

    try {
        console.log('[ADMIN] Importando módulos necesarios...');
        
        // Lista de módulos a importar
        const modulePromises = [
            import('../../modules/dashboardModule.js').catch(e => {
                console.error('[ADMIN] Error al cargar dashboardModule:', e);
                return { default: null };
            }),
            import('./users.js').catch(e => {
                console.error('[ADMIN] Error al cargar users.js:', e);
                return { default: null };
            }),
            import('../../utils/permissions.js').catch(e => {
                console.error('[ADMIN] Error al cargar permissions.js:', e);
                return { default: null };
            }),
            import('../../components/Header/Header.js').catch(e => {
                console.error('[ADMIN] Error al cargar Header.js:', e);
                return { default: null };
            }),
            import('../../components/Sidebar/Sidebar.js').catch(e => {
                console.error('[ADMIN] Error al cargar Sidebar.js:', e);
                return { default: null };
            })
        ];
        
        // Esperar a que se resuelvan todas las promesas
        const imports = await Promise.all(modulePromises);
        
        console.log('[ADMIN] Módulos importados:', imports.map((m, i) => 
            `Módulo ${i}: ${m ? 'Cargado' : 'Error'}`));
        
        // Verificar que todos los módulos esenciales se hayan cargado
        if (!imports[0] || !imports[3] || !imports[4]) {
            throw new Error('No se pudieron cargar módulos esenciales');
        }

        modules = {
            dashboardModule: imports[0],
            usersPage: imports[1],
            permissionUtils: imports[2],
            Header: imports[3].default,
            Sidebar: imports[4].default
        };
        
        console.log('[ADMIN] Módulos cargados exitosamente:', Object.keys(modules));

        return modules;
    } catch (error) {
        console.error('[ADMIN] Error al cargar módulos:', error);
        errorHandler.handleError('ADMIN', error, 'cargar módulos', true);
        return null;
    } finally {
        loadingModules = false;
    }
}

/**
 * Inicializa los componentes principales
 * @param {Object} components - Objeto con los componentes a inicializar
 * @returns {Promise<void>}
 */
async function initializeComponents({ Header, Sidebar }) {
    try {
        console.log('[ADMIN] Inicializando componentes principales...');
        
        // Verificar que los componentes están disponibles
        if (!Header || typeof Header !== 'function') {
            throw new Error('El componente Header no está disponible o no es una clase válida');
        }
        
        if (!Sidebar || typeof Sidebar !== 'function') {
            throw new Error('El componente Sidebar no está disponible o no es una clase válida');
        }

        const headerContainer = document.getElementById('headerComponent');
        const sidebarContainer = document.getElementById('sidebarComponent');
        
        if (!headerContainer) {
            throw new Error('No se encontró el contenedor del header (#headerComponent)');
        }
        
        if (!sidebarContainer) {
            throw new Error('No se encontró el contenedor del sidebar (#sidebarComponent)');
        }

        // Inicializar Header
        console.log('[ADMIN] Inicializando componente Header...');
        const header = new Header();
        await header.render(headerContainer);
        console.log('[ADMIN] Header inicializado correctamente');

        // Inicializar Sidebar
        console.log('[ADMIN] Inicializando componente Sidebar...');
        const sidebar = new Sidebar();
        await sidebar.render(sidebarContainer);
        console.log('[ADMIN] Sidebar inicializado correctamente');
        
        console.log('[ADMIN] Todos los componentes inicializados correctamente');

    } catch (error) {
        console.error('[ADMIN] Error al inicializar componentes:', error);
        errorHandler.handleError('ADMIN', error, 'inicializar componentes', true);
        throw error;
    }
}

/**
 * Manejador de rutas
 * @param {Object} modules - Módulos importados
 * @returns {Promise<void>}
 */
async function handleRoute(modules) {
    if (!modules) {
        console.error('[ADMIN] Error: No se proporcionaron módulos para manejar la ruta');
        return;
    }

    const { dashboardModule, usersPage } = modules;
    const path = window.location.pathname;
    const mainContent = document.getElementById('mainContent');
    const statsContainer = document.querySelector('.stats-container');

    try {
        console.log('[ADMIN-ROUTE] Manejando ruta:', path);
        
        // Verificar si tenemos los contenedores necesarios
        if (!mainContent) {
            throw new Error('No se encontró el contenedor principal (#mainContent)');
        }

        // Mostrar u ocultar las estadísticas según la ruta
        if (statsContainer) {
            statsContainer.style.display = 
                (path === '/admin.html' || path === '/admin' || path === '/admin/dashboard.html') 
                ? 'grid' : 'none';
            console.log('[ADMIN-ROUTE] Contenedor de estadísticas:', statsContainer.style.display);
        } else {
            console.warn('[ADMIN-ROUTE] No se encontró el contenedor de estadísticas');
        }

        // Manejar las diferentes rutas
        switch (path) {
            case '/admin.html':
            case '/admin':
            case '/admin/dashboard.html':
            case '/admin/index.html':
                console.log('[ADMIN-ROUTE] Cargando dashboard');
                mainContent.className = 'dashboard-container w-100 flex-grow-1';
                if (!dashboardModule || typeof dashboardModule.renderDashboardContent !== 'function') {
                    throw new Error('El módulo de dashboard no está disponible o no tiene los métodos requeridos');
                }
                mainContent.innerHTML = dashboardModule.renderDashboardContent();
                await dashboardModule.initDashboard();
                break;
            case '/admin/users.html':
                console.log('[ADMIN-ROUTE] Cargando página de usuarios');
                mainContent.className = 'module-content w-100 flex-grow-1';
                if (!usersPage || typeof usersPage.renderUsersContent !== 'function') {
                    throw new Error('El módulo de usuarios no está disponible o no tiene los métodos requeridos');
                }
                mainContent.innerHTML = usersPage.renderUsersContent();
                await usersPage.initUsersPage();
                break;
            case '/admin/roles.html':
                mainContent.className = 'module-content w-100 flex-grow-1';
                mainContent.innerHTML = '<div class="module-container"><h2 class="mb-4">Gestión de Roles</h2><div class="alert alert-info">El módulo de roles está en desarrollo.</div></div>';
                break;
            case '/admin/areas.html':
                mainContent.className = 'module-content w-100 flex-grow-1';
                mainContent.innerHTML = '<div class="module-container"><h2 class="mb-4">Gestión de Áreas</h2><div class="alert alert-info">El módulo de áreas está en desarrollo.</div></div>';
                break;
            case '/admin/documents.html':
                mainContent.className = 'module-content w-100 flex-grow-1';
                mainContent.innerHTML = '<div class="module-container"><h2 class="mb-4">Gestión de Documentos</h2><div class="alert alert-info">El módulo de documentos está en desarrollo.</div></div>';
                break;
            case '/admin/audit.html':
                mainContent.className = 'module-content w-100 flex-grow-1';
                mainContent.innerHTML = '<div class="module-container"><h2 class="mb-4">Registros / Auditoría</h2><div class="alert alert-info">El módulo de auditoría está en desarrollo.</div></div>';
                break;
            case '/admin/export.html':
                mainContent.className = 'module-content w-100 flex-grow-1';
                mainContent.innerHTML = '<div class="module-container"><h2 class="mb-4">Exportar</h2><div class="alert alert-info">El módulo de exportación está en desarrollo.</div></div>';
                break;
            default:
                console.warn('[ADMIN-ROUTE] Ruta no reconocida, mostrando dashboard por defecto');
                mainContent.className = 'dashboard-container w-100 flex-grow-1';
                if (dashboardModule && typeof dashboardModule.renderDashboardContent === 'function') {
                    mainContent.innerHTML = dashboardModule.renderDashboardContent();
                    await dashboardModule.initDashboard();
                } else {
                    mainContent.innerHTML = '<div class="alert alert-warning">Dashboard no disponible</div>';
                }
        }
    } catch (error) {
        console.error('[ADMIN-ROUTE] Error al manejar ruta:', error);
        if (mainContent) {
            mainContent.innerHTML = `
                <div class="alert alert-danger">
                    <i class="fas fa-exclamation-triangle me-2"></i>
                    Error al cargar el contenido: ${error.message}
                </div>
            `;
        }
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