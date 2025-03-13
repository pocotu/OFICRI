/**
 * Página de Mesa de Partes
 * Maneja la lógica y renderizado del panel de Mesa de Partes
 */

import { authService } from '../../services/services.js';
import * as errorHandler from '../../utils/errorHandler.js';

// Variable para evitar múltiples verificaciones
let isCheckingAuth = false;
let loadingModules = false;
let modules = null;

// Verificar autenticación al cargar la página
document.addEventListener('DOMContentLoaded', async () => {
    console.log('[MESA-PARTES] ==================== INICIO MESA-PARTES.JS ====================');
    console.log('[MESA-PARTES] Iniciando carga de página de Mesa de Partes...');
    
    try {
        // Evitar verificaciones múltiples
        if (isCheckingAuth) {
            console.log('[MESA-PARTES] Ya hay una verificación en progreso, omitiendo inicialización');
            return;
        }
        isCheckingAuth = true;

        // Limpiar posibles contadores de redirección
        if (window.sessionStorage) {
            // Si estamos ya en la página de Mesa de Partes, podemos resetear el contador
            // para evitar falsas detecciones de ciclos
            console.log('[MESA-PARTES] Reseteo de contador de redirecciones para evitar falsos positivos');
            sessionStorage.removeItem('mp_redirection_count');
        }

        // Verificar autenticación
        console.log('[MESA-PARTES] Verificando autenticación del usuario...');
        if (!authService || typeof authService.isAuthenticated !== 'function') {
            throw new Error('El servicio de autenticación no está disponible');
        }

        // Obtener el usuario antes de verificar autenticación, para tener más contexto
        // en caso de errores
        let user = null;
        try {
            user = authService.getCurrentUser();
            console.log('[MESA-PARTES] Datos del usuario (pre-verificación):', user ? JSON.stringify(user) : 'No disponible');
        } catch (userError) {
            console.warn('[MESA-PARTES] Error al obtener usuario (pre-verificación):', userError);
        }

        // Verificación principal de autenticación (usando isAuthenticated)
        if (!authService.isAuthenticated()) {
            console.warn('[MESA-PARTES] Usuario no autenticado, redirigiendo al login');
            // Guardar la ruta actual antes de redirigir
            localStorage.setItem('lastPath', window.location.pathname);
            
            // Añadir un parámetro para ayudar a debugging
            window.location.replace('/?from=mesa-partes&noauth=true');
            return;
        }

        // Si llegamos aquí, el usuario está autenticado, obtenemos sus datos completos
        user = authService.getCurrentUser();
        console.log('[MESA-PARTES] Datos del usuario:', user ? JSON.stringify(user) : 'No disponible');
        
        // Verificar que el usuario existe y tiene el rol correcto
        if (!user || !user.IDRol) {
            console.warn('[MESA-PARTES] Datos de usuario inválidos, redirigiendo al login');
            authService.logout(true);
            return;
        }

        // Verificar que sea usuario de Mesa de Partes (normalmente rol 2)
        if (user.IDRol !== 2) {
            console.warn('[MESA-PARTES] Usuario no tiene rol de Mesa de Partes, redirigiendo al dashboard');
            // Usar una redirección más simple para evitar ciclos
            window.location.href = '/dashboard.html';
            return;
        }

        console.log('[MESA-PARTES] Usuario autenticado y autorizado como Mesa de Partes');

        // Mostrar la interfaz de Mesa de Partes (oculta por defecto en el CSS)
        console.log('[MESA-PARTES] Mostrando interfaz de Mesa de Partes');
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
            console.warn('[MESA-PARTES] No se encontró el overlay de carga (#loadingOverlay)');
        }

        // Cargar módulos
        console.log('[MESA-PARTES] Cargando módulos necesarios...');
        const loadedModules = await loadModules();
        if (!loadedModules) {
            throw new Error('No se pudieron cargar los módulos necesarios');
        }

        // Inicializar componentes
        console.log('[MESA-PARTES] Inicializando componentes principales');
        await initializeComponents(loadedModules);

        // Inicializar eventos de navegación
        console.log('[MESA-PARTES] Configurando eventos de navegación');
        initNavigation(loadedModules);
        
        // Cargar la ruta inicial
        console.log('[MESA-PARTES] Cargando contenido inicial según la ruta');
        await handleRoute(loadedModules);
        
        // Cargar estadísticas iniciales
        console.log('[MESA-PARTES] Cargando estadísticas iniciales');
        await loadStatistics();
        
        console.log('[MESA-PARTES] Inicialización completada exitosamente');
        console.log('[MESA-PARTES] ==================== FIN INICIALIZACIÓN MESA-PARTES.JS ====================');

    } catch (error) {
        console.error('[MESA-PARTES] Error crítico al inicializar página de Mesa de Partes:', error);
        errorHandler.showErrorToUser('Error al inicializar la página de Mesa de Partes. Intente recargar la página o contacte al administrador del sistema.');
        
        // Mostrar error en el contenido principal si es posible
        try {
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
            console.error('[MESA-PARTES] Error adicional al mostrar mensaje de error:', displayError);
        }
    } finally {
        isCheckingAuth = false;
    }
});

/**
 * Carga los módulos necesarios para la página
 * @returns {Promise<Object>} Objeto con los módulos cargados
 */
async function loadModules() {
    if (loadingModules) {
        console.log('[MESA-PARTES] Ya se están cargando los módulos, esperando...');
        return new Promise((resolve) => {
            const checkInterval = setInterval(() => {
                if (!loadingModules && modules) {
                    clearInterval(checkInterval);
                    resolve(modules);
                }
            }, 100);
        });
    }

    loadingModules = true;
    console.log('[MESA-PARTES] Iniciando carga de módulos...');

    try {
        // Cargar los componentes de interfaz
        const { Header } = await import('../../components/Header/Header.js');
        const { MesaPartesSidebar } = await import('./components/MesaPartesSidebar.js');
        
        // Cargar páginas/vistas
        const { DocumentosRecibidos } = await import('./views/DocumentosRecibidos.js');
        const { RegistroExpediente } = await import('./views/RegistroExpediente.js');
        const { ActualizacionExpediente } = await import('./views/ActualizacionExpediente.js');
        const { Derivacion } = await import('./views/Derivacion.js');
        const { Trazabilidad } = await import('./views/Trazabilidad.js');
        const { DocumentosEnProceso } = await import('./views/DocumentosEnProceso.js');
        const { DocumentosCompletados } = await import('./views/DocumentosCompletados.js');
        const { Exportar } = await import('./views/Exportar.js');
        
        // Módulos de utilidad
        const { default: permissions } = await import('../../utils/permissions.js');
        
        modules = {
            Header,
            Sidebar: MesaPartesSidebar,
            views: {
                DocumentosRecibidos,
                RegistroExpediente,
                ActualizacionExpediente,
                Derivacion,
                Trazabilidad,
                DocumentosEnProceso,
                DocumentosCompletados,
                Exportar
            },
            utils: {
                permissions
            }
        };
        
        console.log('[MESA-PARTES] Módulos cargados exitosamente');
        loadingModules = false;
        return modules;
    } catch (error) {
        console.error('[MESA-PARTES] Error al cargar módulos:', error);
        loadingModules = false;
        
        // Agregar mensaje de error user-friendly
        const mainContent = document.getElementById('mainContent');
        if (mainContent) {
            mainContent.innerHTML = `
                <div class="alert alert-danger" role="alert">
                    <h4>Error al cargar la interfaz</h4>
                    <p>No se pudieron cargar algunos módulos necesarios. Por favor intente:</p>
                    <ol>
                        <li>Recargar la página</li>
                        <li>Limpiar la caché del navegador</li>
                        <li>Cerrar sesión y volver a iniciar</li>
                    </ol>
                    <p>Error técnico: ${error.message}</p>
                    <button class="btn btn-primary" onclick="window.location.reload(true)">Recargar Página</button>
                    <button class="btn btn-outline-secondary" onclick="window.location.href='/'">Volver al Inicio</button>
                </div>
            `;
        }
        
        return null;
    }
}

/**
 * Inicializa los componentes principales
 * @param {Object} components Componentes a inicializar
 */
async function initializeComponents({ Header, Sidebar }) {
    console.log('[MESA-PARTES] Inicializando componentes Header y Sidebar');
    
    try {
        // Inicializar header
        const headerContainer = document.getElementById('headerComponent');
        if (headerContainer) {
            const header = new Header('Mesa de Partes');
            await header.render(headerContainer);
            console.log('[MESA-PARTES] Header inicializado correctamente');
        } else {
            console.error('[MESA-PARTES] No se encontró el contenedor del header');
        }
        
        // Inicializar sidebar
        const sidebarContainer = document.getElementById('sidebarComponent');
        if (sidebarContainer) {
            const sidebar = new Sidebar();
            await sidebar.render(sidebarContainer);
            console.log('[MESA-PARTES] Sidebar inicializado correctamente');
        } else {
            console.error('[MESA-PARTES] No se encontró el contenedor del sidebar');
        }
    } catch (error) {
        console.error('[MESA-PARTES] Error al inicializar componentes:', error);
        throw error;
    }
}

/**
 * Maneja la navegación según la ruta
 * @param {Object} modules Módulos cargados
 */
async function handleRoute(modules) {
    console.log('[MESA-PARTES] Determinando vista a mostrar según la URL');
    
    try {
        const mainContent = document.getElementById('mainContent');
        if (!mainContent) {
            throw new Error('No se encontró el contenedor principal');
        }
        
        // Obtener la ruta de la URL (después del #)
        let hash = window.location.hash.substring(1);
        
        // Si no hay hash, usar la vista predeterminada
        if (!hash) {
            hash = 'documentos-recibidos';
            // Actualizar la URL sin recargar la página
            window.history.replaceState(null, null, `#${hash}`);
        }
        
        console.log('[MESA-PARTES] Vista seleccionada:', hash);
        
        // Mostrar la vista correspondiente
        let view = null;
        
        switch (hash) {
            case 'documentos-recibidos':
                view = new modules.views.DocumentosRecibidos();
                break;
            case 'registro-expediente':
                view = new modules.views.RegistroExpediente();
                break;
            case 'actualizacion-expediente':
                view = new modules.views.ActualizacionExpediente();
                break;
            case 'derivacion':
                view = new modules.views.Derivacion();
                break;
            case 'trazabilidad':
                view = new modules.views.Trazabilidad();
                break;
            case 'documentos-en-proceso':
                view = new modules.views.DocumentosEnProceso();
                break;
            case 'documentos-completados':
                view = new modules.views.DocumentosCompletados();
                break;
            case 'exportar':
                view = new modules.views.Exportar();
                break;
            default:
                view = new modules.views.DocumentosRecibidos();
                break;
        }
        
        if (view) {
            mainContent.innerHTML = '';
            await view.render(mainContent);
            console.log('[MESA-PARTES] Vista renderizada correctamente');
        } else {
            throw new Error(`No se encontró la vista para la ruta ${hash}`);
        }
        
        // Actualizar el elemento activo en el sidebar
        const sidebar = document.querySelector('.sidebar');
        if (sidebar) {
            const links = sidebar.querySelectorAll('a');
            links.forEach(link => {
                link.classList.remove('active');
                if (link.getAttribute('href') === `#${hash}`) {
                    link.classList.add('active');
                }
            });
        }
    } catch (error) {
        console.error('[MESA-PARTES] Error al manejar la ruta:', error);
        errorHandler.showErrorToUser('Error de navegación', 'No se pudo cargar la vista solicitada. Intente nuevamente o contacte al administrador.');
    }
}

/**
 * Inicializa los eventos de navegación
 * @param {Object} modules Módulos cargados
 */
function initNavigation(modules) {
    console.log('[MESA-PARTES] Inicializando eventos de navegación');
    
    // Manejar cambios en el hash de la URL
    window.addEventListener('hashchange', () => {
        handleRoute(modules);
    });
    
    // Interceptar clics en los enlaces del sidebar
    document.addEventListener('click', (event) => {
        const link = event.target.closest('a[href^="#"]');
        if (link) {
            event.preventDefault();
            window.location.hash = link.getAttribute('href').substring(1);
        }
    });
}

/**
 * Carga las estadísticas para mostrar en el dashboard
 */
async function loadStatistics() {
    console.log('[MESA-PARTES] Cargando estadísticas...');
    
    try {
        // En un caso real, obtendrías estos datos de la API
        // Aquí simulamos algunos datos para mostrar
        
        // Actualizar los contadores
        const receivedDocsElement = document.getElementById('receivedDocs');
        const pendingDocsElement = document.getElementById('pendingDocs');
        const completedDocsElement = document.getElementById('completedDocs');
        
        if (receivedDocsElement) {
            receivedDocsElement.textContent = '15';
        }
        
        if (pendingDocsElement) {
            pendingDocsElement.textContent = '8';
        }
        
        if (completedDocsElement) {
            completedDocsElement.textContent = '12';
        }
        
        console.log('[MESA-PARTES] Estadísticas cargadas correctamente');
    } catch (error) {
        console.error('[MESA-PARTES] Error al cargar estadísticas:', error);
    }
} 