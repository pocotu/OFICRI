/**
 * Componente UserManagement
 * Maneja la visualización y gestión de usuarios del sistema
 */

import { adminService } from '../../services/admin.service.js';
import { sessionService } from '../../services/sessionService.js';
import { permissionUtils } from '../../utils/permissions.js';
import { Button } from '../base/Button.js';
import { Card } from '../base/Card.js';
import { Modal } from '../base/Modal.js';

export class UserManagement {
    constructor(options = {}) {
        this.options = {
            onUserCreate: options.onUserCreate || null,
            onUserEdit: options.onUserEdit || null,
            onUserDelete: options.onUserDelete || null,
            className: options.className || 'user-management',
            ...options
        };

        this.users = [];
        this.filters = {
            search: '',
            area: '',
            role: '',
            status: ''
        };
    }

    async render(container) {
        try {
            // Cargar usuarios
            await this.loadUsers();

            const template = `
                <div class="${this.options.className}">
                    <div class="card">
                        <div class="card-header d-flex justify-content-between align-items-center">
                            <h5 class="mb-0">Gestión de Usuarios</h5>
                            <div>
                                ${this.renderActionButtons()}
                            </div>
                        </div>
                        <div class="card-body">
                            ${this.renderFilters()}
                            ${this.renderUsersTable()}
                        </div>
                    </div>
                </div>
            `;

            if (container) {
                container.innerHTML = template;
                this.initializeEventListeners(container);
            }

            return template;
        } catch (error) {
            console.error('[USER-MANAGEMENT] Error al renderizar:', error);
            throw error;
        }
    }

    renderActionButtons() {
        const user = sessionService.obtenerUsuarioActual();
        const permissions = permissionUtils.getRolePermissions(user.IDRol);

        return `
            ${permissions.USUARIOS_CREAR ? `
                <button class="btn btn-primary me-2" id="createUserBtn">
                    <i class="fas fa-plus me-2"></i>Nuevo Usuario
                </button>
            ` : ''}
            ${permissions.USUARIOS_EXPORTAR ? `
                <button class="btn btn-secondary" id="exportUsersBtn">
                    <i class="fas fa-file-export me-2"></i>Exportar
                </button>
            ` : ''}
        `;
    }

    renderFilters() {
        return `
            <div class="row mb-3">
                <div class="col-md-3">
                    <label class="form-label">Búsqueda</label>
                    <input type="text" class="form-control" id="searchFilter" 
                           placeholder="Buscar por nombre o email...">
                </div>
                <div class="col-md-3">
                    <label class="form-label">Área</label>
                    <select class="form-select" id="areaFilter">
                        <option value="">Todas las áreas</option>
                        <!-- Se llenará dinámicamente -->
                    </select>
                </div>
                <div class="col-md-3">
                    <label class="form-label">Rol</label>
                    <select class="form-select" id="roleFilter">
                        <option value="">Todos los roles</option>
                        <!-- Se llenará dinámicamente -->
                    </select>
                </div>
                <div class="col-md-3">
                    <label class="form-label">Estado</label>
                    <select class="form-select" id="statusFilter">
                        <option value="">Todos los estados</option>
                        <option value="active">Activos</option>
                        <option value="blocked">Bloqueados</option>
                    </select>
                </div>
            </div>
        `;
    }

    renderUsersTable() {
        if (this.users.length === 0) {
            return `
                <div class="text-center py-5">
                    <i class="fas fa-users fa-3x text-muted mb-3"></i>
                    <p class="text-muted">No se encontraron usuarios</p>
                </div>
            `;
        }

        return `
            <div class="table-responsive">
                <table class="table table-hover">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Nombre</th>
                            <th>Email</th>
                            <th>Área</th>
                            <th>Rol</th>
                            <th>Estado</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${this.users.map(user => this.renderUserRow(user)).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    renderUserRow(user) {
        const currentUser = sessionService.obtenerUsuarioActual();
        const permissions = permissionUtils.getRolePermissions(currentUser.IDRol);
        const canEdit = permissions.USUARIOS_EDITAR;
        const canDelete = permissions.USUARIOS_ELIMINAR;

        return `
            <tr>
                <td>${user.id}</td>
                <td>${user.nombres} ${user.apellidos}</td>
                <td>${user.email}</td>
                <td>${user.area}</td>
                <td>${user.rol}</td>
                <td>
                    <span class="badge bg-${user.estado === 'active' ? 'success' : 'danger'}">
                        ${user.estado === 'active' ? 'Activo' : 'Bloqueado'}
                    </span>
                </td>
                <td>
                    <div class="btn-group">
                        ${canEdit ? `
                            <button class="btn btn-sm btn-outline-primary" 
                                    data-user-id="${user.id}" 
                                    data-action="edit">
                                <i class="fas fa-edit"></i>
                            </button>
                        ` : ''}
                        ${canDelete ? `
                            <button class="btn btn-sm btn-outline-danger" 
                                    data-user-id="${user.id}" 
                                    data-action="delete">
                                <i class="fas fa-trash"></i>
                            </button>
                        ` : ''}
                    </div>
                </td>
            </tr>
        `;
    }

    async loadUsers() {
        try {
            // Aquí se implementaría la lógica para cargar usuarios
            // Por ahora usamos datos de ejemplo
            this.users = [
                {
                    id: 1,
                    nombres: 'Juan',
                    apellidos: 'Pérez',
                    email: 'juan.perez@example.com',
                    area: 'Sistemas',
                    rol: 'Administrador',
                    estado: 'active'
                },
                // ... más usuarios
            ];
        } catch (error) {
            console.error('[USER-MANAGEMENT] Error al cargar usuarios:', error);
            throw error;
        }
    }

    initializeEventListeners(container) {
        // Botones de acción principales
        const createBtn = container.querySelector('#createUserBtn');
        const exportBtn = container.querySelector('#exportUsersBtn');

        if (createBtn && this.options.onUserCreate) {
            createBtn.addEventListener('click', () => {
                this.options.onUserCreate();
            });
        }

        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.handleExport());
        }

        // Filtros
        const filters = container.querySelectorAll('select, input');
        filters.forEach(filter => {
            filter.addEventListener('change', () => this.handleFilterChange());
        });

        // Acciones de usuarios
        const actionButtons = container.querySelectorAll('[data-user-id]');
        actionButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const userId = e.currentTarget.dataset.userId;
                const action = e.currentTarget.dataset.action;
                this.handleUserAction(userId, action);
            });
        });
    }

    handleFilterChange() {
        this.filters = {
            search: document.getElementById('searchFilter').value,
            area: document.getElementById('areaFilter').value,
            role: document.getElementById('roleFilter').value,
            status: document.getElementById('statusFilter').value
        };

        this.render(document.querySelector(`.${this.options.className}`));
    }

    handleUserAction(userId, action) {
        switch (action) {
            case 'edit':
                if (this.options.onUserEdit) {
                    this.options.onUserEdit(userId);
                }
                break;
            case 'delete':
                this.handleDelete(userId);
                break;
        }
    }

    async handleDelete(userId) {
        const modal = new Modal({
            title: 'Eliminar Usuario',
            content: '¿Está seguro de que desea eliminar este usuario?',
            onConfirm: async () => {
                try {
                    // Aquí se implementaría la lógica para eliminar usuario
                    if (this.options.onUserDelete) {
                        this.options.onUserDelete(userId);
                    }
                    this.render(document.querySelector(`.${this.options.className}`));
                } catch (error) {
                    console.error('[USER-MANAGEMENT] Error al eliminar usuario:', error);
                }
            }
        });

        modal.show();
    }

    async handleExport() {
        try {
            // Aquí se implementaría la lógica para exportar usuarios
            console.log('[USER-MANAGEMENT] Exportando usuarios...');
        } catch (error) {
            console.error('[USER-MANAGEMENT] Error al exportar usuarios:', error);
        }
    }
}

export default UserManagement; 