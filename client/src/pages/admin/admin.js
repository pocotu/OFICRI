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
            console.warn('[ADMIN] Usuario no tiene rol de administrador, redirigiendo según rol');
            
            // Determinar la redirección según el rol del usuario
            if (user.IDRol === 2) {
                // Si es usuario de Mesa de Partes, redirigir a su interfaz específica
                console.log('[ADMIN] Usuario con rol de Mesa de Partes (2), redirigiendo a /mesaPartes.html');
                window.location.replace('/mesaPartes.html');
            } else {
                // Para otros roles, redirigir al dashboard general
                console.log('[ADMIN] Usuario con rol ' + user.IDRol + ', redirigiendo a /dashboard.html');
                window.location.replace('/dashboard.html');
            }
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

    console.log('[ADMIN-DEBUG] ==================== INICIO CARGA DE MÓDULOS ====================');
    console.log('[ADMIN-DEBUG] Iniciando carga de módulos en:', new Date().toISOString());
    console.log('[ADMIN-DEBUG] URL actual:', window.location.href);
    console.log('[ADMIN-DEBUG] Ruta base:', window.location.origin);
    loadingModules = true;

    try {
        console.log('[ADMIN-DEBUG] Preparando lista de módulos a importar...');
        
        // Lista de módulos a importar con rutas completas para depuración
        const modulePaths = {
            dashboard: '../../modules/dashboardModule.js',
            users: '../../modules/userModule-compat.js',
            permissions: '../../utils/permissions.js',
            header: '../../components/navigation/Header.js',
            sidebar: '../../components/Sidebar/Sidebar.js'
        };
        
        console.log('[ADMIN-DEBUG] Rutas de módulos a cargar:', JSON.stringify(modulePaths, null, 2));
        
        // Lista de módulos a importar
        const modulePromises = [
            import(modulePaths.dashboard)
                .then(module => {
                    console.log('[ADMIN-DEBUG] Módulo dashboard cargado exitosamente');
                    return module;
                })
                .catch(e => {
                    console.error('[ADMIN-DEBUG] Error al cargar dashboardModule:', e, '\nTipo de error:', e.constructor.name, '\nMensaje:', e.message);
                    return { default: null };
                }),
            
            // Importación con más detalles para el módulo de usuarios
            new Promise((resolve) => {
                console.log('[ADMIN-DEBUG] Intentando cargar el módulo de usuarios desde:', modulePaths.users);
                
                // Intentar múltiples rutas alternativas si la principal falla
                import(modulePaths.users)
                    .then(module => {
                        console.log('[ADMIN-DEBUG] Módulo de usuarios cargado exitosamente desde la ruta principal');
                        resolve(module);
                    })
                    .catch(e => {
                        console.error('[ADMIN-DEBUG] Error al cargar el módulo de usuarios desde ruta principal:', e);
                        console.error('[ADMIN-DEBUG] Detalles del error:', {
                            tipo: e.constructor.name,
                            mensaje: e.message,
                            stack: e.stack
                        });
                        
                        // Intentar con ruta alternativa
                        console.log('[ADMIN-DEBUG] Intentando ruta alternativa: ../../modules/userModule.js');
                        import('../../modules/userModule.js')
                            .then(module => {
                                console.log('[ADMIN-DEBUG] Módulo de usuarios cargado exitosamente desde ruta alternativa');
                                resolve(module);
                            })
                            .catch(e2 => {
                                console.error('[ADMIN-DEBUG] Error en ruta alternativa:', e2);
                                resolve({ default: null });
                            });
                    });
            }),
            
            import(modulePaths.permissions)
                .then(module => {
                    console.log('[ADMIN-DEBUG] Módulo permissions cargado exitosamente');
                    return module;
                })
                .catch(e => {
                    console.error('[ADMIN-DEBUG] Error al cargar permissions.js:', e, '\nTipo de error:', e.constructor.name, '\nMensaje:', e.message);
                    return { default: null };
                }),
            
            import(modulePaths.header)
                .then(module => {
                    console.log('[ADMIN-DEBUG] Módulo Header cargado exitosamente');
                    return module;
                })
                .catch(e => {
                    console.error('[ADMIN-DEBUG] Error al cargar Header.js:', e, '\nTipo de error:', e.constructor.name, '\nMensaje:', e.message);
                    return { default: null };
                }),
            
            import(modulePaths.sidebar)
                .then(module => {
                    console.log('[ADMIN-DEBUG] Módulo Sidebar cargado exitosamente');
                    return module;
                })
                .catch(e => {
                    console.error('[ADMIN-DEBUG] Error al cargar Sidebar.js:', e, '\nTipo de error:', e.constructor.name, '\nMensaje:', e.message);
                    return { default: null };
                })
        ];
        
        // Esperar a que se resuelvan todas las promesas
        console.log('[ADMIN-DEBUG] Esperando resolución de todas las promesas de importación...');
        const imports = await Promise.all(modulePromises);
        
        console.log('[ADMIN-DEBUG] Resultado de importaciones:', imports.map((m, i) => {
            const moduleNames = ['dashboard', 'users', 'permissions', 'header', 'sidebar'];
            return `Módulo ${moduleNames[i]}: ${m ? 'Cargado' : 'Error'}`;
        }));
        
        // Verificar la estructura de los módulos importados
        imports.forEach((moduleImport, index) => {
            const moduleNames = ['dashboard', 'users', 'permissions', 'header', 'sidebar'];
            console.log(`[ADMIN-DEBUG] Estructura del módulo ${moduleNames[index]}:`, {
                isDefined: !!moduleImport,
                hasDefault: moduleImport && 'default' in moduleImport,
                keys: moduleImport ? Object.keys(moduleImport) : []
            });
        });
        
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
        
        console.log('[ADMIN-DEBUG] Módulos cargados exitosamente:', Object.keys(modules));
        console.log('[ADMIN-DEBUG] ==================== FIN CARGA DE MÓDULOS ====================');

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
                console.log('[ADMIN-DEBUG-ROUTE] ==================== INICIO CARGA PÁGINA USUARIOS ====================');
                mainContent.className = 'module-content w-100 flex-grow-1';
                
                // Cargar e inicializar la página de usuarios usando los archivos bundle
                try {
                    console.log('[ADMIN-DEBUG-ROUTE] Importando la versión bundle de la página de usuarios...');
                    
                    // Import script directo en el HTML para evitar problemas de carga dinámica
                    const scriptElement = document.createElement('script');
                    scriptElement.type = 'module';
                    scriptElement.innerHTML = `
                        import userBundle from '/src/modules/userBundle.js';
                        import usersPage from '/src/pages/admin/usersPage.js';
                        
                        window.userModule = userBundle;
                        window.usersPage = usersPage;
                        
                        // Inicializar cuando el DOM esté listo
                        document.addEventListener('DOMContentLoaded', () => {
                            console.log('[SCRIPT-LOADER] DOM cargado, renderizando contenido de usuarios');
                            const mainContent = document.getElementById('mainContent');
                            if (mainContent) {
                                mainContent.innerHTML = usersPage.renderUsersContent();
                                usersPage.initUsersPage();
                            }
                        });
                        
                        // Si el DOM ya está listo, ejecutar inmediatamente
                        if (document.readyState === 'complete' || document.readyState === 'interactive') {
                            console.log('[SCRIPT-LOADER] DOM ya cargado, renderizando contenido de usuarios inmediatamente');
                            const mainContent = document.getElementById('mainContent');
                            if (mainContent) {
                                mainContent.innerHTML = usersPage.renderUsersContent();
                                setTimeout(() => usersPage.initUsersPage(), 0);
                            }
                        }
                    `;
                    document.head.appendChild(scriptElement);
                    
                    // Agregar un placeholder mientras se carga el script
                    mainContent.innerHTML = `
                        <div class="module-container users-container">
                            <h2 class="mb-4">Gestión de Usuarios</h2>
                            <div class="text-center py-5">
                                <div class="spinner-border text-primary" role="status">
                                    <span class="visually-hidden">Cargando módulo de usuarios...</span>
                                </div>
                                <p class="mt-3">Cargando módulo de usuarios...</p>
                            </div>
                        </div>
                    `;
                    
                    console.log('[ADMIN-DEBUG-ROUTE] Script de carga añadido a la página');
                    console.log('[ADMIN-DEBUG-ROUTE] ==================== FIN CARGA PÁGINA USUARIOS (CARGA DIRECTA) ====================');
                } catch (error) {
                    console.error('[ADMIN-ROUTE] Error al cargar página de usuarios:', error);
                    console.error('[ADMIN-DEBUG-ROUTE] Detalles:', {
                        tipo: error.constructor.name,
                        mensaje: error.message,
                        stack: error.stack
                    });
                    
                    mainContent.innerHTML = `
                        <div class="alert alert-danger">
                            <i class="fas fa-exclamation-triangle me-2"></i>
                            <strong>Error al cargar el módulo de usuarios:</strong>
                            <p>${error.message}</p>
                            <p class="mt-2"><small>Para más información, abra la consola (F12)</small></p>
                        </div>
                    `;
                }
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