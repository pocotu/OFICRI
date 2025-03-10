/**
 * Página de gestión de usuarios
 * Maneja la lógica y renderizado de la página de gestión de usuarios
 */

import * as userModule from '../../modules/userModule.js';
import AuthService from '../../services/auth.service.js';
import * as permissionUtils from '../../utils/permissions.js';

/**
 * Renderiza el contenido principal de la página de usuarios
 * @returns {string} HTML del contenido
 */
export const renderUsersContent = () => {
    return `
        <div class="users-container">
            <div class="users-header">
                <h2>Gestión de Usuarios</h2>
                <div class="users-actions">
                    <button class="btn btn-primary" id="createUserBtn">
                        <i class="fas fa-plus"></i> Nuevo Usuario
                    </button>
                    <button class="btn btn-secondary" id="refreshUsersBtn">
                        <i class="fas fa-sync-alt"></i> Actualizar
                    </button>
                </div>
            </div>
            
            <div class="users-filters mb-3">
                <div class="row">
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
            
            <div id="usersTableContainer">
                <div class="text-center">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Cargando...</span>
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
        const user = AuthService.getCurrentUser();
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
        const users = await userModule.getAllUsers();
        const tableContainer = document.getElementById('usersTableContainer');
        if (tableContainer) {
            const user = AuthService.getCurrentUser();
            const permissions = permissionUtils.getRolePermissions(user.IDRol);
            tableContainer.innerHTML = userModule.renderUsersTable(users, permissions);
        }
    } catch (error) {
        console.error('Error al cargar datos iniciales:', error);
        throw error;
    }
}

/**
 * Inicializa los eventos de la página
 */
function initializeEvents() {
    const user = AuthService.getCurrentUser();
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
    const searchInput = document.getElementById('userSearch');
    const areaFilter = document.getElementById('areaFilter');
    const roleFilter = document.getElementById('roleFilter');
    const statusFilter = document.getElementById('statusFilter');
    
    // Función para aplicar filtros
    const applyFilters = () => {
        const searchTerm = searchInput?.value.toLowerCase() || '';
        const areaValue = areaFilter?.value || '';
        const roleValue = roleFilter?.value || '';
        const statusValue = statusFilter?.value || '';
        
        const rows = document.querySelectorAll('#usersTableContainer tbody tr');
        
        rows.forEach(row => {
            const text = row.textContent.toLowerCase();
            const area = row.querySelector('td:nth-child(6)').textContent;
            const role = row.querySelector('td:nth-child(7)').textContent;
            const status = row.querySelector('td:nth-child(8)').textContent.toLowerCase();
            
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
}

/**
 * Muestra un mensaje de error
 * @param {string} message - Mensaje de error
 */
function showError(message) {
    const container = document.getElementById('usersTableContainer');
    if (container) {
        container.innerHTML = `
            <div class="alert alert-danger">
                <i class="fas fa-exclamation-triangle me-2"></i>
                ${message}
            </div>
        `;
    }
} 