/**
 * Módulo de administración
 * Proporciona funciones modulares para gestionar el panel de administración
 */

import AuthService from '../services/auth.service.js';
import * as permissionUtils from '../utils/permissions.js';
import * as userModule from './userModule.js';
import * as documentModule from './documentModule.js';
import * as areaModule from './areaModule.js';
import * as auditModule from './auditModule.js';

/**
 * Obtiene los headers con el token de autenticación
 * @returns {Object} - Headers con el token de autenticación
 */
export const getAuthHeaders = () => {
    const token = AuthService.getToken();
    return {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };
};

// ════════════════════════════════════════════════════════════════
// FUNCIONES DE INICIALIZACIÓN DEL PANEL
// ════════════════════════════════════════════════════════════════

/**
 * Inicializa el panel de administración
 * @returns {Promise<boolean>} - Promesa que resuelve a true si se inicializó correctamente
 */
export const initAdminPanel = async () => {
    try {
        const user = AuthService.getCurrentUser();
        
        if (!user || !permissionUtils.isAdmin(user)) {
            redirectToLogin();
            return false;
        }
        
        // Obtener permisos del usuario
        const permissions = permissionUtils.getRolePermissions(user.IDRol);
        
        // Renderizar el menú lateral según permisos
        renderSidebar(permissions);
        
        // Cargar el contenido inicial (dashboard)
        await loadDashboard();
        
        // Inicializar eventos
        initEvents();
        
        return true;
    } catch (error) {
        console.error('Error al inicializar el panel de administración:', error);
        return false;
    }
};

/**
 * Inicializa los eventos del panel de administración
 */
export const initEvents = () => {
    // Eventos para el menú lateral
    document.querySelectorAll('#admin-sidebar .nav-link').forEach(link => {
        link.addEventListener('click', async (event) => {
            event.preventDefault();
            
            // Remover clase active de todos los enlaces
            document.querySelectorAll('#admin-sidebar .nav-link').forEach(l => l.classList.remove('active'));
            
            // Agregar clase active al enlace actual
            link.classList.add('active');
            
            // Obtener el módulo a cargar
            const module = link.getAttribute('data-module');
            
            // Cargar el módulo correspondiente
            if (module) {
                await loadModule(module);
            }
        });
    });
};

/**
 * Redirige al usuario a la página de login
 */
export const redirectToLogin = () => {
    window.location.href = '/';
};

// ════════════════════════════════════════════════════════════════
// FUNCIONES DE CARGA DE MÓDULOS
// ════════════════════════════════════════════════════════════════

/**
 * Carga un módulo específico en el contenido principal
 * @param {string} module - Nombre del módulo a cargar
 */
export const loadModule = async (module) => {
    const contentContainer = document.getElementById('admin-content');
    
    if (!contentContainer) {
        console.error('No se encontró el contenedor de contenido');
        return;
    }
    
    try {
        // Mostrar indicador de carga
        contentContainer.innerHTML = '<div class="text-center p-5"><div class="spinner-border" role="status"><span class="visually-hidden">Cargando...</span></div></div>';
        
        switch (module) {
            case 'dashboard':
                await loadDashboard();
                break;
            case 'users':
                await loadUsersModule();
                break;
            case 'roles':
                await loadRolesModule();
                break;
            case 'areas':
                await loadAreasModule();
                break;
            case 'documents':
                await loadDocumentsModule();
                break;
            case 'audit':
                await loadAuditModule();
                break;
            case 'export':
                await loadExportModule();
                break;
            default:
                contentContainer.innerHTML = '<div class="alert alert-danger">Módulo no encontrado</div>';
        }
    } catch (error) {
        console.error(`Error al cargar el módulo ${module}:`, error);
        contentContainer.innerHTML = '<div class="alert alert-danger">Error al cargar el módulo</div>';
    }
};

/**
 * Carga el dashboard en el contenido principal
 */
export const loadDashboard = async () => {
    const contentContainer = document.getElementById('admin-content');
    
    try {
        // Obtener estadísticas generales
        const stats = await getGeneralStats();
        
        // Renderizar el dashboard
        contentContainer.innerHTML = renderDashboard(stats);
        
        // Inicializar cualquier funcionalidad adicional del dashboard
        initDashboardCharts(stats);
    } catch (error) {
        console.error('Error al cargar el dashboard:', error);
        contentContainer.innerHTML = '<div class="alert alert-danger">Error al cargar el dashboard</div>';
    }
};

/**
 * Carga el módulo de usuarios en el contenido principal
 */
export const loadUsersModule = async () => {
    const contentContainer = document.getElementById('admin-content');
    
    try {
        // Obtener permisos del usuario actual
        const user = AuthService.getCurrentUser();
        const permissions = permissionUtils.getRolePermissions(user.IDRol);
        
        // Verificar que tenga permiso para ver usuarios
        if (!permissionUtils.canView(permissions)) {
            contentContainer.innerHTML = '<div class="alert alert-danger">No tienes permiso para acceder a este módulo</div>';
            return;
        }
        
        // Obtener usuarios
        const users = await userModule.getAllUsers();
        
        // Renderizar el módulo de usuarios
        contentContainer.innerHTML = renderUsersModule(users, permissions);
        
        // Inicializar eventos del módulo de usuarios
        initUsersModuleEvents(permissions);
    } catch (error) {
        console.error('Error al cargar el módulo de usuarios:', error);
        contentContainer.innerHTML = '<div class="alert alert-danger">Error al cargar el módulo de usuarios</div>';
    }
};

/**
 * Carga el módulo de roles en el contenido principal
 */
export const loadRolesModule = async () => {
    const contentContainer = document.getElementById('admin-content');
    
    try {
        // Obtener permisos del usuario actual
        const user = AuthService.getCurrentUser();
        const permissions = permissionUtils.getRolePermissions(user.IDRol);
        
        // Verificar que tenga permiso para ver roles
        if (!permissionUtils.canView(permissions)) {
            contentContainer.innerHTML = '<div class="alert alert-danger">No tienes permiso para acceder a este módulo</div>';
            return;
        }
        
        // Obtener roles
        const roles = await getRoles();
        
        // Renderizar el módulo de roles
        contentContainer.innerHTML = renderRolesModule(roles, permissions);
        
        // Inicializar eventos del módulo de roles
        initRolesModuleEvents(permissions);
    } catch (error) {
        console.error('Error al cargar el módulo de roles:', error);
        contentContainer.innerHTML = '<div class="alert alert-danger">Error al cargar el módulo de roles</div>';
    }
};

/**
 * Carga el módulo de áreas en el contenido principal
 */
export const loadAreasModule = async () => {
    const contentContainer = document.getElementById('admin-content');
    
    try {
        // Obtener permisos del usuario actual
        const user = AuthService.getCurrentUser();
        const permissions = permissionUtils.getRolePermissions(user.IDRol);
        
        // Verificar que tenga permiso para ver áreas
        if (!permissionUtils.canView(permissions)) {
            contentContainer.innerHTML = '<div class="alert alert-danger">No tienes permiso para acceder a este módulo</div>';
            return;
        }
        
        // Obtener áreas
        const areas = await areaModule.getAllAreas();
        
        // Renderizar el módulo de áreas
        contentContainer.innerHTML = renderAreasModule(areas, permissions);
        
        // Inicializar eventos del módulo de áreas
        initAreasModuleEvents(permissions);
    } catch (error) {
        console.error('Error al cargar el módulo de áreas:', error);
        contentContainer.innerHTML = '<div class="alert alert-danger">Error al cargar el módulo de áreas</div>';
    }
};

/**
 * Carga el módulo de documentos en el contenido principal
 */
export const loadDocumentsModule = async () => {
    const contentContainer = document.getElementById('admin-content');
    
    try {
        // Obtener permisos del usuario actual
        const user = AuthService.getCurrentUser();
        const permissions = permissionUtils.getRolePermissions(user.IDRol);
        
        // Verificar que tenga permiso para ver documentos
        if (!permissionUtils.canView(permissions)) {
            contentContainer.innerHTML = '<div class="alert alert-danger">No tienes permiso para acceder a este módulo</div>';
            return;
        }
        
        // Obtener documentos
        const documents = await documentModule.getAllDocuments();
        
        // Renderizar el módulo de documentos
        contentContainer.innerHTML = renderDocumentsModule(documents, permissions);
        
        // Inicializar eventos del módulo de documentos
        initDocumentsModuleEvents(permissions);
    } catch (error) {
        console.error('Error al cargar el módulo de documentos:', error);
        contentContainer.innerHTML = '<div class="alert alert-danger">Error al cargar el módulo de documentos</div>';
    }
};

/**
 * Carga el módulo de auditoría en el contenido principal
 */
export const loadAuditModule = async () => {
    const contentContainer = document.getElementById('admin-content');
    
    try {
        // Obtener permisos del usuario actual
        const user = AuthService.getCurrentUser();
        const permissions = permissionUtils.getRolePermissions(user.IDRol);
        
        // Verificar que tenga permiso para auditar
        if (!permissionUtils.canAudit(permissions)) {
            contentContainer.innerHTML = '<div class="alert alert-danger">No tienes permiso para acceder a este módulo</div>';
            return;
        }
        
        // Renderizar el módulo de auditoría
        contentContainer.innerHTML = renderAuditModule(permissions);
        
        // Inicializar eventos del módulo de auditoría
        initAuditModuleEvents();
        
        // Cargar los logs de usuario por defecto
        await loadAuditUserLogs();
    } catch (error) {
        console.error('Error al cargar el módulo de auditoría:', error);
        contentContainer.innerHTML = '<div class="alert alert-danger">Error al cargar el módulo de auditoría</div>';
    }
};

/**
 * Carga los logs de usuario en el módulo de auditoría
 */
export const loadAuditUserLogs = async (filters = {}) => {
    const logsContainer = document.getElementById('audit-logs-container');
    
    if (!logsContainer) {
        console.error('No se encontró el contenedor de logs');
        return;
    }
    
    try {
        // Mostrar indicador de carga
        logsContainer.innerHTML = '<div class="text-center p-5"><div class="spinner-border" role="status"><span class="visually-hidden">Cargando...</span></div></div>';
        
        // Obtener logs de usuario
        const logs = await auditModule.getUserLogs(filters);
        
        // Renderizar los logs de usuario
        logsContainer.innerHTML = auditModule.renderUserLogsTable(logs);
    } catch (error) {
        console.error('Error al cargar los logs de usuario:', error);
        logsContainer.innerHTML = '<div class="alert alert-danger">Error al cargar los logs de usuario</div>';
    }
};

/**
 * Carga el módulo de exportación en el contenido principal
 */
export const loadExportModule = async () => {
    const contentContainer = document.getElementById('admin-content');
    
    try {
        // Obtener permisos del usuario actual
        const user = AuthService.getCurrentUser();
        const permissions = permissionUtils.getRolePermissions(user.IDRol);
        
        // Verificar que tenga permiso para exportar
        if (!permissionUtils.canExport(permissions)) {
            contentContainer.innerHTML = '<div class="alert alert-danger">No tienes permiso para acceder a este módulo</div>';
            return;
        }
        
        // Renderizar el módulo de exportación
        contentContainer.innerHTML = renderExportModule();
        
        // Inicializar eventos del módulo de exportación
        initExportModuleEvents();
    } catch (error) {
        console.error('Error al cargar el módulo de exportación:', error);
        contentContainer.innerHTML = '<div class="alert alert-danger">Error al cargar el módulo de exportación</div>';
    }
};

// ════════════════════════════════════════════════════════════════
// FUNCIONES DE RENDERIZADO DE COMPONENTES
// ════════════════════════════════════════════════════════════════

/**
 * Renderiza el menú lateral según los permisos del usuario
 * @param {number} permissions - Permisos del usuario
 * @returns {string} - HTML del menú lateral
 */
export const renderSidebar = (permissions) => {
    const sidebarContainer = document.getElementById('admin-sidebar');
    
    if (!sidebarContainer) {
        console.error('No se encontró el contenedor del menú lateral');
        return;
    }
    
    const canViewUsers = permissionUtils.canView(permissions);
    const canViewRoles = permissionUtils.canView(permissions);
    const canViewAreas = permissionUtils.canView(permissions);
    const canViewDocuments = permissionUtils.canView(permissions);
    const canAudit = permissionUtils.canAudit(permissions);
    const canExport = permissionUtils.canExport(permissions);
    
    const html = `
    <div class="sidebar-header">
        <img src="/assets/img/logo.png" alt="Logo" class="sidebar-logo">
        <h3>Panel de Admin</h3>
    </div>
    
    <ul class="nav flex-column">
        <li class="nav-item">
            <a class="nav-link active" href="#" data-module="dashboard">
                <i class="fas fa-tachometer-alt"></i> Dashboard
            </a>
        </li>
        
        <li class="nav-item ${canViewUsers ? '' : 'd-none'}">
            <a class="nav-link" href="#" data-module="users">
                <i class="fas fa-users"></i> Gestión de Usuarios
            </a>
        </li>
        
        <li class="nav-item ${canViewRoles ? '' : 'd-none'}">
            <a class="nav-link" href="#" data-module="roles">
                <i class="fas fa-user-tag"></i> Gestión de Roles
            </a>
        </li>
        
        <li class="nav-item ${canViewAreas ? '' : 'd-none'}">
            <a class="nav-link" href="#" data-module="areas">
                <i class="fas fa-building"></i> Gestión de Áreas
            </a>
        </li>
        
        <li class="nav-item ${canViewDocuments ? '' : 'd-none'}">
            <a class="nav-link" href="#" data-module="documents">
                <i class="fas fa-file-alt"></i> Gestión de Documentos
            </a>
        </li>
        
        <li class="nav-item ${canAudit ? '' : 'd-none'}">
            <a class="nav-link" href="#" data-module="audit">
                <i class="fas fa-shield-alt"></i> Registros / Auditoría
            </a>
        </li>
        
        <li class="nav-item ${canExport ? '' : 'd-none'}">
            <a class="nav-link" href="#" data-module="export">
                <i class="fas fa-file-export"></i> Exportar
            </a>
        </li>
        
        <li class="nav-item mt-auto">
            <a class="nav-link" href="#" onclick="AuthService.logout()">
                <i class="fas fa-sign-out-alt"></i> Cerrar Sesión
            </a>
        </li>
    </ul>
    `;
    
    sidebarContainer.innerHTML = html;
};

/**
 * Renderiza el dashboard
 * @param {Object} stats - Estadísticas generales
 * @returns {string} - HTML del dashboard
 */
export const renderDashboard = (stats) => {
    return `
    <div class="container-fluid p-4">
        <h1 class="mb-4">Dashboard</h1>
        
        <div class="row">
            <div class="col-md-3">
                <div class="card dashboard-card">
                    <div class="card-body">
                        <div class="dashboard-card-icon bg-primary">
                            <i class="fas fa-users"></i>
                        </div>
                        <div class="dashboard-card-content">
                            <h5 class="card-title">Usuarios</h5>
                            <h2 class="card-value">${stats.totalUsers || 0}</h2>
                            <p class="card-subtitle">Activos: ${stats.activeUsers || 0}</p>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="col-md-3">
                <div class="card dashboard-card">
                    <div class="card-body">
                        <div class="dashboard-card-icon bg-success">
                            <i class="fas fa-file-alt"></i>
                        </div>
                        <div class="dashboard-card-content">
                            <h5 class="card-title">Documentos</h5>
                            <h2 class="card-value">${stats.totalDocuments || 0}</h2>
                            <p class="card-subtitle">Pendientes: ${stats.pendingDocuments || 0}</p>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="col-md-3">
                <div class="card dashboard-card">
                    <div class="card-body">
                        <div class="dashboard-card-icon bg-warning">
                            <i class="fas fa-building"></i>
                        </div>
                        <div class="dashboard-card-content">
                            <h5 class="card-title">Áreas</h5>
                            <h2 class="card-value">${stats.totalAreas || 0}</h2>
                            <p class="card-subtitle">Activas: ${stats.activeAreas || 0}</p>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="col-md-3">
                <div class="card dashboard-card">
                    <div class="card-body">
                        <div class="dashboard-card-icon bg-info">
                            <i class="fas fa-share-alt"></i>
                        </div>
                        <div class="dashboard-card-content">
                            <h5 class="card-title">Derivaciones</h5>
                            <h2 class="card-value">${stats.totalDerivations || 0}</h2>
                            <p class="card-subtitle">Pendientes: ${stats.pendingDerivations || 0}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="row mt-4">
            <div class="col-md-6">
                <div class="card">
                    <div class="card-header">
                        <h5 class="card-title">Documentos por Estado</h5>
                    </div>
                    <div class="card-body">
                        <canvas id="documents-by-status-chart"></canvas>
                    </div>
                </div>
            </div>
            
            <div class="col-md-6">
                <div class="card">
                    <div class="card-header">
                        <h5 class="card-title">Documentos por Área</h5>
                    </div>
                    <div class="card-body">
                        <canvas id="documents-by-area-chart"></canvas>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="row mt-4">
            <div class="col-md-12">
                <div class="card">
                    <div class="card-header">
                        <h5 class="card-title">Actividad Reciente</h5>
                    </div>
                    <div class="card-body">
                        <div class="table-responsive">
                            <table class="table table-striped">
                                <thead>
                                    <tr>
                                        <th>Usuario</th>
                                        <th>Acción</th>
                                        <th>Detalles</th>
                                        <th>Fecha</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${renderRecentActivity(stats.recentActivity || [])}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    `;
};

/**
 * Renderiza la actividad reciente en el dashboard
 * @param {Array} activities - Array de actividades recientes
 * @returns {string} - HTML de la actividad reciente
 */
export const renderRecentActivity = (activities) => {
    if (!activities || activities.length === 0) {
        return '<tr><td colspan="4" class="text-center">No hay actividad reciente</td></tr>';
    }
    
    let html = '';
    
    activities.forEach(activity => {
        const fecha = new Date(activity.fecha).toLocaleString();
        
        html += `
        <tr>
            <td>${activity.usuario || 'Sistema'}</td>
            <td>${activity.accion}</td>
            <td>${activity.detalles || '-'}</td>
            <td>${fecha}</td>
        </tr>
        `;
    });
    
    return html;
};

/**
 * Renderiza el módulo de usuarios
 * @param {Array} users - Array de usuarios
 * @param {number} permissions - Permisos del usuario
 * @returns {string} - HTML del módulo de usuarios
 */
export const renderUsersModule = (users, permissions) => {
    const canCreateUser = permissionUtils.canCreate(permissions);
    const canEditUser = permissionUtils.canEdit(permissions);
    const canDeleteUser = permissionUtils.canDelete(permissions);
    const canBlockUser = permissionUtils.canBlock(permissions);
    
    return `
    <div class="container-fluid p-4">
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h1>Gestión de Usuarios</h1>
            <button class="btn btn-primary ${canCreateUser ? '' : 'd-none'}" onclick="adminModule.showCreateUserForm()">
                <i class="fas fa-plus"></i> Nuevo Usuario
            </button>
        </div>
        
        <div class="card">
            <div class="card-body">
                <div class="table-responsive">
                    <table class="table table-striped" id="users-table">
                        <thead>
                            <tr>
                                <th>CIP</th>
                                <th>Nombre</th>
                                <th>Apellidos</th>
                                <th>Rango</th>
                                <th>Área</th>
                                <th>Rol</th>
                                <th>Estado</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${renderUsersTableRows(users, permissions)}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
        
        <!-- Modal para crear/editar usuario -->
        <div class="modal fade" id="user-modal" tabindex="-1" aria-labelledby="user-modal-label" aria-hidden="true">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="user-modal-label">Nuevo Usuario</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body" id="user-form-container">
                        <!-- El formulario se cargará dinámicamente -->
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Modal de confirmación para eliminar usuario -->
        <div class="modal fade" id="delete-user-modal" tabindex="-1" aria-labelledby="delete-user-modal-label" aria-hidden="true">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="delete-user-modal-label">Confirmar Eliminación</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <p>¿Está seguro de que desea eliminar este usuario?</p>
                        <p class="text-danger">Esta acción no se puede deshacer.</p>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                        <button type="button" class="btn btn-danger" id="confirm-delete-user">Eliminar</button>
                    </div>
                </div>
            </div>
        </div>
    </div>
    `;
};

/**
 * Renderiza las filas de la tabla de usuarios
 * @param {Array} users - Array de usuarios
 * @param {number} permissions - Permisos del usuario
 * @returns {string} - HTML de las filas de la tabla
 */
export const renderUsersTableRows = (users, permissions) => {
    if (!users || users.length === 0) {
        return '<tr><td colspan="8" class="text-center">No hay usuarios disponibles</td></tr>';
    }
    
    const canEditUser = permissionUtils.canEdit(permissions);
    const canDeleteUser = permissionUtils.canDelete(permissions);
    const canBlockUser = permissionUtils.canBlock(permissions);
    
    let html = '';
    
    users.forEach(user => {
        html += `
        <tr>
            <td>${user.CodigoCIP}</td>
            <td>${user.Nombres}</td>
            <td>${user.Apellidos}</td>
            <td>${user.Rango}</td>
            <td>${user.NombreArea || '-'}</td>
            <td>${permissionUtils.getRoleName(user.IDRol)}</td>
            <td>
                <span class="badge bg-${user.Bloqueado ? 'danger' : 'success'}">
                    ${user.Bloqueado ? 'Bloqueado' : 'Activo'}
                </span>
            </td>
            <td>
                <button class="btn btn-sm btn-primary" onclick="adminModule.viewUserDetails(${user.IDUsuario})">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn btn-sm btn-warning ${canEditUser ? '' : 'd-none'}" onclick="adminModule.showEditUserForm(${user.IDUsuario})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-danger ${canDeleteUser ? '' : 'd-none'}" onclick="adminModule.confirmDeleteUser(${user.IDUsuario})">
                    <i class="fas fa-trash"></i>
                </button>
                <button class="btn btn-sm ${user.Bloqueado ? 'btn-success' : 'btn-secondary'} ${canBlockUser ? '' : 'd-none'}" 
                        onclick="adminModule.toggleUserBlock(${user.IDUsuario}, ${!user.Bloqueado})">
                    <i class="fas fa-${user.Bloqueado ? 'unlock' : 'lock'}"></i>
                </button>
            </td>
        </tr>
        `;
    });
    
    return html;
};

/**
 * Renderiza el módulo de auditoría
 * @param {number} permissions - Permisos del usuario
 * @returns {string} - HTML del módulo de auditoría
 */
export const renderAuditModule = (permissions) => {
    return `
    <div class="container-fluid p-4">
        <h1 class="mb-4">Registros del Sistema / Auditoría</h1>
        
        <ul class="nav nav-tabs mb-4" id="audit-tabs" role="tablist">
            <li class="nav-item" role="presentation">
                <button class="nav-link active" id="user-logs-tab" data-bs-toggle="tab" data-bs-target="#user-logs" type="button" role="tab" aria-controls="user-logs" aria-selected="true">
                    Logs de Usuarios
                </button>
            </li>
            <li class="nav-item" role="presentation">
                <button class="nav-link" id="document-logs-tab" data-bs-toggle="tab" data-bs-target="#document-logs" type="button" role="tab" aria-controls="document-logs" aria-selected="false">
                    Logs de Documentos
                </button>
            </li>
            <li class="nav-item" role="presentation">
                <button class="nav-link" id="area-logs-tab" data-bs-toggle="tab" data-bs-target="#area-logs" type="button" role="tab" aria-controls="area-logs" aria-selected="false">
                    Logs de Áreas
                </button>
            </li>
            <li class="nav-item" role="presentation">
                <button class="nav-link" id="role-logs-tab" data-bs-toggle="tab" data-bs-target="#role-logs" type="button" role="tab" aria-controls="role-logs" aria-selected="false">
                    Logs de Roles
                </button>
            </li>
            <li class="nav-item" role="presentation">
                <button class="nav-link" id="mesa-partes-logs-tab" data-bs-toggle="tab" data-bs-target="#mesa-partes-logs" type="button" role="tab" aria-controls="mesa-partes-logs" aria-selected="false">
                    Logs de Mesa de Partes
                </button>
            </li>
        </ul>
        
        <div class="tab-content" id="audit-tabs-content">
            <div class="tab-pane fade show active" id="user-logs" role="tabpanel" aria-labelledby="user-logs-tab">
                ${auditModule.renderLogsFilterForm('usuario')}
                <div id="audit-logs-container" class="mt-4">
                    <!-- Los logs se cargarán dinámicamente -->
                </div>
            </div>
            
            <div class="tab-pane fade" id="document-logs" role="tabpanel" aria-labelledby="document-logs-tab">
                ${auditModule.renderLogsFilterForm('documento')}
                <div id="document-logs-container" class="mt-4">
                    <!-- Los logs se cargarán dinámicamente -->
                </div>
            </div>
            
            <div class="tab-pane fade" id="area-logs" role="tabpanel" aria-labelledby="area-logs-tab">
                ${auditModule.renderLogsFilterForm('area')}
                <div id="area-logs-container" class="mt-4">
                    <!-- Los logs se cargarán dinámicamente -->
                </div>
            </div>
            
            <div class="tab-pane fade" id="role-logs" role="tabpanel" aria-labelledby="role-logs-tab">
                ${auditModule.renderLogsFilterForm('rol')}
                <div id="role-logs-container" class="mt-4">
                    <!-- Los logs se cargarán dinámicamente -->
                </div>
            </div>
            
            <div class="tab-pane fade" id="mesa-partes-logs" role="tabpanel" aria-labelledby="mesa-partes-logs-tab">
                ${auditModule.renderLogsFilterForm('mesaPartes')}
                <div id="mesa-partes-logs-container" class="mt-4">
                    <!-- Los logs se cargarán dinámicamente -->
                </div>
            </div>
        </div>
        
        ${auditModule.renderLogDetailsModal()}
    </div>
    `;
};

// ════════════════════════════════════════════════════════════════
// FUNCIONES DE OPERACIONES ESPECÍFICAS
// ════════════════════════════════════════════════════════════════

/**
 * Obtiene estadísticas generales para el dashboard
 * @returns {Promise<Object>} - Promesa que resuelve a un objeto con estadísticas
 */
export const getGeneralStats = async () => {
    try {
        const response = await fetch('/api/admin/stats', {
            method: 'GET',
            headers: getAuthHeaders()
        });
        
        if (!response.ok) {
            throw new Error(`Error al obtener estadísticas: ${response.statusText}`);
        }
        
        const data = await response.json();
        return data.stats || {};
    } catch (error) {
        console.error('Error en getGeneralStats:', error);
        throw error;
    }
};

/**
 * Obtiene todos los roles
 * @returns {Promise<Array>} - Promesa que resuelve a un array de roles
 */
export const getRoles = async () => {
    try {
        const response = await fetch('/api/roles', {
            method: 'GET',
            headers: getAuthHeaders()
        });
        
        if (!response.ok) {
            throw new Error(`Error al obtener roles: ${response.statusText}`);
        }
        
        const data = await response.json();
        return data.roles || [];
    } catch (error) {
        console.error('Error en getRoles:', error);
        throw error;
    }
};

/**
 * Inicializa los gráficos del dashboard
 * @param {Object} stats - Estadísticas generales
 */
export const initDashboardCharts = (stats) => {
    // Implementar inicialización de gráficos con Chart.js
    // (Se implementaría si se tiene Chart.js incluido en el proyecto)
};

/**
 * Inicializa los eventos del módulo de usuarios
 * @param {number} permissions - Permisos del usuario
 */
export const initUsersModuleEvents = (permissions) => {
    // Implementar eventos específicos del módulo de usuarios
};

/**
 * Inicializa los eventos del módulo de roles
 * @param {number} permissions - Permisos del usuario
 */
export const initRolesModuleEvents = (permissions) => {
    // Implementar eventos específicos del módulo de roles
};

/**
 * Inicializa los eventos del módulo de áreas
 * @param {number} permissions - Permisos del usuario
 */
export const initAreasModuleEvents = (permissions) => {
    // Implementar eventos específicos del módulo de áreas
};

/**
 * Inicializa los eventos del módulo de documentos
 * @param {number} permissions - Permisos del usuario
 */
export const initDocumentsModuleEvents = (permissions) => {
    // Implementar eventos específicos del módulo de documentos
};

/**
 * Inicializa los eventos del módulo de auditoría
 */
export const initAuditModuleEvents = () => {
    // Implementar eventos específicos del módulo de auditoría
};

/**
 * Inicializa los eventos del módulo de exportación
 */
export const initExportModuleEvents = () => {
    // Implementar eventos específicos del módulo de exportación
}; 