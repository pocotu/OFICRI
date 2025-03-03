// Variables globales
let currentSection = 'dashboard-home';
let sectionsLoaded = {};

// Funciones para el panel de administración principal

// Función para inicializar el dashboard de administración
function initAdminDashboard() {
    try {
        console.log('Inicializando dashboard de administración...');
        
        // Configurar navegación
        setupNavigation();
        
        // Cargar estadísticas iniciales
        loadDashboardStats();
        
        // Configurar eventos de los botones de acciones rápidas
        setupQuickActions();
        
        console.log('Dashboard de administración inicializado correctamente');
    } catch (error) {
        console.error('Error al inicializar dashboard de administración:', error);
        window.commonUiHelpers.showError('Error al inicializar dashboard: ' + error.message);
    }
}

// Función para configurar la navegación del panel
function setupNavigation() {
    try {
        console.log('Configurando navegación del panel de administración...');
        
        // Obtener elementos de navegación
        const navLinks = document.querySelectorAll('.nav-btn');
        const contentSections = document.querySelectorAll('.section');
        
        // Verificar si existen elementos
        if (!navLinks.length || !contentSections.length) {
            console.warn('No se encontraron elementos de navegación o secciones de contenido');
            return;
        }
        
        // Configurar evento para cada enlace de navegación
        navLinks.forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                
                // Obtener el target del enlace
                const targetId = this.getAttribute('data-target');
                if (!targetId) {
                    console.warn('Enlace sin atributo data-target:', this);
                    return;
                }
                
                // Remover clase activa de todos los enlaces
                navLinks.forEach(l => l.classList.remove('active'));
                
                // Agregar clase activa al enlace actual
                this.classList.add('active');
                
                // Ocultar todas las secciones
                contentSections.forEach(section => {
                    section.classList.remove('active');
                    section.style.display = 'none';
                });
                
                // Mostrar la sección correspondiente
            const targetSection = document.getElementById(targetId);
            if (targetSection) {
                targetSection.classList.add('active');
                    targetSection.style.display = 'block';
                    
                    // Inicializar módulo específico si es necesario
                    initializeModuleIfNeeded(targetId);
                } else {
                    console.warn(`No se encontró la sección con ID: ${targetId}`);
            }
        });
    });
        
        // Activar el primer enlace por defecto
        if (navLinks[0]) {
            navLinks[0].click();
        }
        
        console.log('Navegación configurada correctamente');
    } catch (error) {
        console.error('Error al configurar navegación:', error);
        window.commonUiHelpers.showError('Error al configurar navegación: ' + error.message);
    }
}

// Función para inicializar módulos específicos según la sección activa
function initializeModuleIfNeeded(sectionId) {
    try {
        console.log(`Inicializando módulo para sección: ${sectionId}`);
        
        // Verificar qué módulo inicializar según la sección
        switch (sectionId) {
            case 'users-section':
                // Inicializar gestión de usuarios si existe
                if (window.adminModules.userManagement && window.adminModules.userManagement.loadUsers) {
                    console.log('Inicializando módulo de gestión de usuarios');
                    window.adminModules.userManagement.loadUsers();
                } else {
                    console.warn('Módulo de gestión de usuarios no encontrado');
                }
                break;
                
            case 'areas-section':
                // Inicializar gestión de áreas si existe
                if (window.adminModules.areaManagement && window.adminModules.areaManagement.loadAreas) {
                    console.log('Inicializando módulo de gestión de áreas');
                    window.adminModules.areaManagement.loadAreas();
                } else {
                    console.warn('Módulo de gestión de áreas no encontrado');
                }
                break;
                
            case 'roles-section':
                // Inicializar gestión de roles si existe
                if (window.adminModules.adminRoles && window.adminModules.adminRoles.loadRoles) {
                    console.log('Inicializando módulo de gestión de roles');
                    window.adminModules.adminRoles.loadRoles();
                } else {
                    console.warn('Módulo de gestión de roles no encontrado');
                }
                break;
                
            case 'logs-section':
                // Inicializar gestión de logs si existe
                if (window.adminModules.logManagement && window.adminModules.logManagement.loadActivityLogs) {
                    console.log('Inicializando módulo de gestión de logs');
                    window.adminModules.logManagement.loadActivityLogs();
                } else {
                    console.warn('Módulo de gestión de logs no encontrado');
                }
                break;
                
            default:
                console.log(`No se requiere inicialización especial para la sección: ${sectionId}`);
        }
        
        console.log(`Módulo para sección ${sectionId} inicializado correctamente`);
    } catch (error) {
        console.error(`Error al inicializar módulo para sección ${sectionId}:`, error);
        window.commonUiHelpers.showError(`Error al inicializar módulo: ${error.message}`);
    }
}

// Initialize admin modules
window.adminModules = window.adminModules || {};
window.adminModules.initAdminDashboard = initAdminDashboard;

// Función para cargar estadísticas del dashboard
async function loadDashboardStats() {
    try {
        console.log('Cargando estadísticas del dashboard...');
        
        // Obtener contenedor de estadísticas
        const statsContainer = document.getElementById('admin-stats-container');
        if (!statsContainer) {
            console.warn('No se encontró el contenedor de estadísticas');
            return;
        }
        
        // Mostrar indicador de carga
        statsContainer.innerHTML = '<div class="loading-indicator">Cargando estadísticas...</div>';
        
        // Realizar petición al servidor
        const response = await fetch('/api/admin/stats');
        
        // Verificar respuesta
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `Error al cargar estadísticas: ${response.status}`);
        }
        
        // Obtener datos
        const stats = await response.json();
        console.log('Estadísticas recibidas:', stats);
        
        // Renderizar estadísticas
        renderDashboardStats(stats, statsContainer);
        
        console.log('Estadísticas cargadas correctamente');
                } catch (error) {
        console.error('Error al cargar estadísticas:', error);
        
        // Mostrar mensaje de error en el contenedor
        const statsContainer = document.getElementById('admin-stats-container');
        if (statsContainer) {
            statsContainer.innerHTML = `
                <div class="error-message">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>Error al cargar estadísticas: ${error.message}</p>
                    <button id="retry-stats-btn" class="btn btn-primary">Reintentar</button>
                </div>
            `;
            
            // Configurar botón de reintento
            const retryBtn = document.getElementById('retry-stats-btn');
            if (retryBtn) {
                retryBtn.addEventListener('click', loadDashboardStats);
            }
        }
        
        window.commonUiHelpers.showError('Error al cargar estadísticas: ' + error.message);
    }
}

// Función para renderizar estadísticas en el dashboard
function renderDashboardStats(stats, container) {
    try {
        console.log('Renderizando estadísticas en el dashboard...');
        
        // Verificar si hay datos y contenedor
        if (!stats || !container) {
            console.warn('No hay datos de estadísticas o contenedor para renderizar');
            return;
        }
        
        // Crear HTML para las estadísticas
        const statsHtml = `
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-icon"><i class="fas fa-users"></i></div>
                    <div class="stat-content">
                        <h3>${stats.totalUsers || 0}</h3>
                        <p>Usuarios registrados</p>
                    </div>
                </div>
                
                <div class="stat-card">
                    <div class="stat-icon"><i class="fas fa-building"></i></div>
                    <div class="stat-content">
                        <h3>${stats.totalAreas || 0}</h3>
                        <p>Áreas activas</p>
                    </div>
                </div>
                
                <div class="stat-card">
                    <div class="stat-icon"><i class="fas fa-user-tag"></i></div>
                    <div class="stat-content">
                        <h3>${stats.totalRoles || 0}</h3>
                        <p>Roles definidos</p>
                    </div>
                </div>
                
                <div class="stat-card">
                    <div class="stat-icon"><i class="fas fa-clipboard-list"></i></div>
                    <div class="stat-content">
                        <h3>${stats.totalCases || 0}</h3>
                        <p>Casos registrados</p>
                    </div>
                </div>
            </div>
            
            <div class="activity-summary">
                <h3>Actividad reciente</h3>
                <div class="recent-activity-list">
                    ${renderRecentActivity(stats.recentActivity || [])}
                </div>
            </div>
        `;
        
        // Actualizar contenido del contenedor
        container.innerHTML = statsHtml;
        
        console.log('Estadísticas renderizadas correctamente');
    } catch (error) {
        console.error('Error al renderizar estadísticas:', error);
        container.innerHTML = '<div class="error-message">Error al mostrar estadísticas</div>';
    }
}

// Función para renderizar actividad reciente
function renderRecentActivity(activities) {
    try {
        // Verificar si hay actividades
        if (!activities || activities.length === 0) {
            return '<p class="no-data">No hay actividad reciente para mostrar</p>';
        }
        
        // Crear HTML para cada actividad
        return activities.map(activity => `
            <div class="activity-item">
                <div class="activity-icon">
                    <i class="fas ${getActivityIcon(activity.tipo)}"></i>
                </div>
                <div class="activity-details">
                    <p class="activity-text">${activity.descripcion || 'Actividad sin descripción'}</p>
                    <p class="activity-meta">
                        <span class="activity-user">${activity.usuario || 'Sistema'}</span>
                        <span class="activity-time">${formatTimeAgo(activity.fecha)}</span>
                    </p>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error al renderizar actividad reciente:', error);
        return '<p class="error-message">Error al cargar actividad reciente</p>';
    }
}

// Función para obtener icono según tipo de actividad
function getActivityIcon(tipo) {
    switch (tipo?.toLowerCase()) {
        case 'login':
            return 'fa-sign-in-alt';
        case 'logout':
            return 'fa-sign-out-alt';
        case 'crear':
            return 'fa-plus-circle';
        case 'editar':
            return 'fa-edit';
        case 'eliminar':
            return 'fa-trash-alt';
        case 'error':
            return 'fa-exclamation-triangle';
        default:
            return 'fa-info-circle';
    }
}

// Función para formatear tiempo relativo
function formatTimeAgo(dateString) {
    try {
        if (!dateString) return 'Fecha desconocida';
        
        const date = new Date(dateString);
        const now = new Date();
        
        // Verificar si la fecha es válida
        if (isNaN(date.getTime())) {
            return dateString;
        }
        
        const diffMs = now - date;
        const diffSec = Math.floor(diffMs / 1000);
        const diffMin = Math.floor(diffSec / 60);
        const diffHour = Math.floor(diffMin / 60);
        const diffDay = Math.floor(diffHour / 24);
        
        // Formatear tiempo relativo
        if (diffSec < 60) {
            return 'hace unos segundos';
        } else if (diffMin < 60) {
            return `hace ${diffMin} ${diffMin === 1 ? 'minuto' : 'minutos'}`;
        } else if (diffHour < 24) {
            return `hace ${diffHour} ${diffHour === 1 ? 'hora' : 'horas'}`;
        } else if (diffDay < 7) {
            return `hace ${diffDay} ${diffDay === 1 ? 'día' : 'días'}`;
        } else {
            // Para fechas más antiguas, mostrar fecha completa
            return date.toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        }
    } catch (error) {
        console.error('Error al formatear tiempo relativo:', error);
        return dateString || 'Fecha desconocida';
    }
}

// Función para configurar acciones rápidas
function setupQuickActions() {
    try {
        console.log('Configurando acciones rápidas...');
        
        // Obtener botones de acciones rápidas
        const quickActionButtons = document.querySelectorAll('.quick-action-btn');
        
        // Verificar si existen botones
        if (!quickActionButtons.length) {
            console.warn('No se encontraron botones de acciones rápidas');
            return;
        }
        
        // Configurar evento para cada botón
        quickActionButtons.forEach(button => {
            button.addEventListener('click', function() {
                const action = this.getAttribute('data-action');
                const target = this.getAttribute('data-target');
                
                if (!action) {
                    console.warn('Botón sin atributo data-action:', this);
                    return;
                }
                
                // Ejecutar acción correspondiente
                executeQuickAction(action, target);
            });
        });
        
        console.log('Acciones rápidas configuradas correctamente');
    } catch (error) {
        console.error('Error al configurar acciones rápidas:', error);
        window.commonUiHelpers.showError('Error al configurar acciones rápidas: ' + error.message);
    }
}

// Función para ejecutar acción rápida
function executeQuickAction(action, target) {
    try {
        console.log(`Ejecutando acción rápida: ${action}, target: ${target}`);
        
        // Ejecutar acción según tipo
        switch (action) {
            case 'create-user':
                // Abrir modal de creación de usuario
                if (window.adminModules && window.adminModules.userManagement) {
                    window.adminModules.userManagement.showUserForm();
                } else {
                    console.warn('Módulo de gestión de usuarios no disponible');
                }
                break;
                
            case 'create-area':
                // Abrir modal de creación de área
                if (window.adminModules && window.adminModules.areaManagement) {
                    window.adminModules.areaManagement.showAreaForm();
                } else {
                    console.warn('Módulo de gestión de áreas no disponible');
                }
                break;
                
            case 'create-role':
                // Abrir modal de creación de rol
                if (window.adminModules && window.adminModules.adminRoles) {
                    window.adminModules.adminRoles.showRoleForm();
                } else {
                    console.warn('Módulo de gestión de roles no disponible');
                }
                break;
                
            case 'export-logs':
                // Exportar logs
                if (window.adminModules && window.adminModules.logManagement) {
                    window.adminModules.logManagement.downloadLogs(true);
                } else {
                    console.warn('Módulo de gestión de logs no disponible');
                }
                break;
                
            case 'navigate':
                // Navegar a una sección específica
                if (target) {
                    const navLink = document.querySelector(`.admin-nav-link[data-target="${target}"]`);
                    if (navLink) {
                        navLink.click();
                    } else {
                        console.warn(`No se encontró enlace de navegación para target: ${target}`);
                    }
                } else {
                    console.warn('Acción de navegación sin target especificado');
                }
                break;
                
            default:
                console.warn(`Acción rápida no reconocida: ${action}`);
        }
        
        console.log(`Acción rápida ${action} ejecutada correctamente`);
    } catch (error) {
        console.error(`Error al ejecutar acción rápida ${action}:`, error);
        window.commonUiHelpers.showError(`Error al ejecutar acción: ${error.message}`);
    }
}

// Inicialización cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    initAdminDashboard();
});

// Exponer funciones globalmente
window.adminModules = window.adminModules || {};
window.adminModules.adminDashboard = {
    initAdminDashboard,
    loadDashboardStats,
    setupNavigation,
    setupQuickActions
};
