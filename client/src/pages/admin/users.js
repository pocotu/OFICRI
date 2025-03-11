/**
 * Página de gestión de usuarios
 * Maneja la lógica y renderizado de la página de gestión de usuarios
 */

import * as userModule from '../../modules/userModule.js';
import { authService } from '../../services/services.js';
import * as permissionUtils from '../../utils/permissions.js';
import * as errorHandler from '../../utils/errorHandler.js';

/**
 * Renderiza el contenido principal de la página de usuarios
 * @returns {string} HTML del contenido
 */
export const renderUsersContent = () => {
    return `
        <div class="module-container users-container">
            <div class="users-header mb-4">
                <h2 class="mb-3">Gestión de Usuarios</h2>
                <div class="users-actions">
                    <button class="btn btn-primary" id="createUserBtn">
                        <i class="fas fa-plus"></i> Nuevo Usuario
                    </button>
                    <button class="btn btn-secondary" id="refreshUsersBtn">
                        <i class="fas fa-sync-alt"></i> Actualizar
                    </button>
                </div>
            </div>
            
            <div class="users-filters mb-4">
                <div class="row w-100">
                    <div class="col-md-4">
                        <input type="text" class="form-control" id="userSearch" placeholder="Buscar usuario...">
                    </div>
                    <div class="col-md-3">
                        <select class="form-select" id="areaFilter">
                            <option value="">Todas las áreas</option>
                        </select>
                    </div>
                    <div class="col-md-3">
                        <select class="form-select" id="roleFilter">
                            <option value="">Todos los roles</option>
                        </select>
                    </div>
                    <div class="col-md-2">
                        <select class="form-select" id="statusFilter">
                            <option value="">Todos los estados</option>
                            <option value="active">Activos</option>
                            <option value="blocked">Bloqueados</option>
                        </select>
                    </div>
                </div>
            </div>
            
            <div class="users-table-container table-responsive w-100 flex-grow-1">
                <div id="usersTableContent">
                    <div class="text-center py-5">
                        <div class="spinner-border text-primary" role="status">
                            <span class="visually-hidden">Cargando...</span>
                        </div>
                        <p class="mt-2">Cargando usuarios...</p>
                    </div>
                </div>
            </div>
        </div>
    `;
};

/**
 * Inicializa la página de usuarios
 */
export const initUsersPage = async () => {
    try {
        const user = authService.getCurrentUser();
        if (!user) {
            throw new Error('Usuario no autenticado');
        }

        const permissions = permissionUtils.getRolePermissions(user.IDRol);
        
        // Cargar datos iniciales
        await loadInitialData();
        
        // Inicializar eventos
        initializeEvents();
        
        // Configurar filtros
        setupFilters();
        
    } catch (error) {
        console.error('Error al inicializar página de usuarios:', error);
        showError('Error al cargar la página de usuarios');
    }
};

/**
 * Carga los datos iniciales necesarios
 */
async function loadInitialData() {
    try {
        console.log('[USERS-PAGE] Iniciando carga de datos...');
        
        // Obtener usuarios desde el módulo
        const users = await userModule.getAllUsers();
        console.log('[USERS-PAGE] Usuarios obtenidos:', users.length);
        
        // Actualizar la tabla con los usuarios
        const tableContainer = document.getElementById('usersTableContent');
        if (tableContainer) {
            console.log('[USERS-PAGE] Contenedor de tabla encontrado, actualizando contenido');
            const user = authService.getCurrentUser();
            const permissions = permissionUtils.getRolePermissions(user.IDRol);
            tableContainer.innerHTML = userModule.renderUsersTable(users, permissions);
            console.log('[USERS-PAGE] Tabla actualizada correctamente');
        } else {
            console.error('[USERS-PAGE] No se encontró el contenedor de la tabla (#usersTableContent)');
            const mainContent = document.getElementById('mainContent');
            console.log('[USERS-PAGE] Contenido principal:', mainContent);
            if (mainContent) {
                console.log('[USERS-PAGE] Estructura HTML actual:', mainContent.innerHTML.substring(0, 200) + '...');
            }
        }
    } catch (error) {
        console.error('[USERS-PAGE] Error al cargar datos iniciales:', error);
        throw error;
    }
}

/**
 * Inicializa los eventos de la página
 */
function initializeEvents() {
    const user = authService.getCurrentUser();
    const permissions = permissionUtils.getRolePermissions(user.IDRol);
    
    // Inicializar eventos del módulo de usuarios
    userModule.initUserEvents(permissions);
    
    // Evento para el botón de actualizar
    const refreshBtn = document.getElementById('refreshUsersBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', loadInitialData);
    }
    
    // Evento para el botón de crear usuario
    const createBtn = document.getElementById('createUserBtn');
    if (createBtn && permissionUtils.canCreate(permissions)) {
        createBtn.addEventListener('click', () => {
            userModule.showUserForm();
        });
    } else if (createBtn) {
        createBtn.style.display = 'none';
    }
}

/**
 * Configura los filtros de la tabla
 */
function setupFilters() {
    console.log('[USERS-PAGE] Configurando filtros...');
    const searchInput = document.getElementById('userSearch');
    const areaFilter = document.getElementById('areaFilter');
    const roleFilter = document.getElementById('roleFilter');
    const statusFilter = document.getElementById('statusFilter');
    
    // Función para aplicar filtros
    const applyFilters = () => {
        console.log('[USERS-PAGE] Aplicando filtros...');
        const searchTerm = searchInput?.value.toLowerCase() || '';
        const areaValue = areaFilter?.value || '';
        const roleValue = roleFilter?.value || '';
        const statusValue = statusFilter?.value || '';
        
        const rows = document.querySelectorAll('#usersTableContent tbody tr');
        console.log('[USERS-PAGE] Filas encontradas para filtrar:', rows.length);
        
        rows.forEach(row => {
            const text = row.textContent.toLowerCase();
            const area = row.querySelector('td:nth-child(6)')?.textContent || '';
            const role = row.querySelector('td:nth-child(7)')?.textContent || '';
            const status = row.querySelector('td:nth-child(8)')?.textContent.toLowerCase() || '';
            
            const matchesSearch = text.includes(searchTerm);
            const matchesArea = !areaValue || area.includes(areaValue);
            const matchesRole = !roleValue || role.includes(roleValue);
            const matchesStatus = !statusValue || 
                                (statusValue === 'active' && status.includes('activo')) ||
                                (statusValue === 'blocked' && status.includes('bloqueado'));
            
            row.style.display = (matchesSearch && matchesArea && matchesRole && matchesStatus) ? '' : 'none';
        });
    };
    
    // Configurar eventos de filtrado
    [searchInput, areaFilter, roleFilter, statusFilter].forEach(element => {
        if (element) {
            element.addEventListener('input', applyFilters);
            element.addEventListener('change', applyFilters);
        }
    });
    
    console.log('[USERS-PAGE] Filtros configurados correctamente');
}

/**
 * Muestra un mensaje de error
 * @param {string} message - Mensaje de error
 */
function showError(message) {
    console.error('[USERS-PAGE] Mostrando mensaje de error:', message);
    
    const container = document.getElementById('usersTableContent');
    if (container) {
        container.innerHTML = `
            <div class="alert alert-danger">
                <i class="fas fa-exclamation-triangle me-2"></i>
                ${message}
            </div>
        `;
        console.log('[USERS-PAGE] Mensaje de error mostrado en la interfaz');
    } else {
        console.error('[USERS-PAGE] No se encontró el contenedor para mostrar el error');
    }
} 