/**
 * Módulo de gestión de usuarios
 * Proporciona funciones para la gestión de usuarios (CRUD)
 */

import AuthService from '../services/auth.service.js';
import * as permissionUtils from '../utils/permissions.js';

// URL base para las operaciones de usuarios
const BASE_URL = '/api/users';

/**
 * Obtiene el token de autenticación
 * @returns {Object} - Headers con el token de autenticación
 */
export const getAuthHeaders = () => {
    const token = AuthService.getToken();
    return {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };
};

/**
 * Obtiene todos los usuarios
 * @returns {Promise<Array>} - Promesa que resuelve a un array de usuarios
 */
export const getAllUsers = async () => {
    try {
        const response = await fetch(BASE_URL, {
            method: 'GET',
            headers: getAuthHeaders()
        });
        
        if (!response.ok) {
            throw new Error(`Error al obtener usuarios: ${response.statusText}`);
        }
        
        const data = await response.json();
        return data.users || [];
    } catch (error) {
        console.error('Error en getAllUsers:', error);
        throw error;
    }
};

/**
 * Obtiene un usuario por su ID
 * @param {number} userId - ID del usuario
 * @returns {Promise<Object>} - Promesa que resuelve al usuario
 */
export const getUserById = async (userId) => {
    try {
        const response = await fetch(`${BASE_URL}/${userId}`, {
            method: 'GET',
            headers: getAuthHeaders()
        });
        
        if (!response.ok) {
            throw new Error(`Error al obtener usuario: ${response.statusText}`);
        }
        
        const data = await response.json();
        return data.user;
    } catch (error) {
        console.error(`Error en getUserById(${userId}):`, error);
        throw error;
    }
};

/**
 * Crea un nuevo usuario
 * @param {Object} userData - Datos del usuario a crear
 * @returns {Promise<Object>} - Promesa que resuelve al usuario creado
 */
export const createUser = async (userData) => {
    try {
        const response = await fetch(BASE_URL, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(userData)
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `Error al crear usuario: ${response.statusText}`);
        }
        
        const data = await response.json();
        return data.user;
    } catch (error) {
        console.error('Error en createUser:', error);
        throw error;
    }
};

/**
 * Actualiza un usuario existente
 * @param {number} userId - ID del usuario a actualizar
 * @param {Object} userData - Datos actualizados del usuario
 * @returns {Promise<Object>} - Promesa que resuelve al usuario actualizado
 */
export const updateUser = async (userId, userData) => {
    try {
        const response = await fetch(`${BASE_URL}/${userId}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(userData)
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `Error al actualizar usuario: ${response.statusText}`);
        }
        
        const data = await response.json();
        return data.user;
    } catch (error) {
        console.error(`Error en updateUser(${userId}):`, error);
        throw error;
    }
};

/**
 * Elimina un usuario
 * @param {number} userId - ID del usuario a eliminar
 * @returns {Promise<boolean>} - Promesa que resuelve a true si se eliminó correctamente
 */
export const deleteUser = async (userId) => {
    try {
        const response = await fetch(`${BASE_URL}/${userId}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `Error al eliminar usuario: ${response.statusText}`);
        }
        
        return true;
    } catch (error) {
        console.error(`Error en deleteUser(${userId}):`, error);
        throw error;
    }
};

/**
 * Bloquea o desbloquea un usuario
 * @param {number} userId - ID del usuario
 * @param {boolean} blocked - true para bloquear, false para desbloquear
 * @returns {Promise<Object>} - Promesa que resuelve al usuario actualizado
 */
export const toggleUserBlock = async (userId, blocked) => {
    try {
        const response = await fetch(`${BASE_URL}/${userId}/block`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify({ blocked })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `Error al ${blocked ? 'bloquear' : 'desbloquear'} usuario: ${response.statusText}`);
        }
        
        const data = await response.json();
        return data.user;
    } catch (error) {
        console.error(`Error en toggleUserBlock(${userId}, ${blocked}):`, error);
        throw error;
    }
};

/**
 * Renderiza la tabla de usuarios
 * @param {Array} users - Array de usuarios
 * @param {number} userPermissions - Permisos del usuario actual
 * @returns {string} - HTML de la tabla de usuarios
 */
export const renderUsersTable = (users, userPermissions) => {
    if (!permissionUtils.canView(userPermissions)) {
        return '<div class="alert alert-warning">No tienes permiso para ver usuarios</div>';
    }
    
    if (!users || users.length === 0) {
        return '<div class="alert alert-info">No hay usuarios para mostrar</div>';
    }
    
    const canEditUser = permissionUtils.canEdit(userPermissions);
    const canDeleteUser = permissionUtils.canDelete(userPermissions);
    const canBlockUser = permissionUtils.canBlock(userPermissions);
    
    let html = `
        <div class="table-responsive">
            <table class="table table-striped table-hover">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>CIP</th>
                        <th>Nombres</th>
                        <th>Apellidos</th>
                        <th>Rango</th>
                        <th>Área</th>
                        <th>Rol</th>
                        <th>Estado</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    users.forEach(user => {
        html += `
            <tr>
                <td>${user.IDUsuario}</td>
                <td>${user.CodigoCIP}</td>
                <td>${user.Nombres}</td>
                <td>${user.Apellidos}</td>
                <td>${user.Rango}</td>
                <td>${user.NombreArea || user.IDArea}</td>
                <td>${user.NombreRol || user.IDRol}</td>
                <td>${user.Bloqueado ? '<span class="badge bg-danger">Bloqueado</span>' : '<span class="badge bg-success">Activo</span>'}</td>
                <td>
                    <div class="btn-group" role="group">
                        <button type="button" class="btn btn-sm btn-info view-user" data-id="${user.IDUsuario}" title="Ver detalles">
                            <i class="bi bi-eye"></i>
                        </button>
                        ${canEditUser ? `
                            <button type="button" class="btn btn-sm btn-primary edit-user" data-id="${user.IDUsuario}" title="Editar">
                                <i class="bi bi-pencil"></i>
                            </button>
                        ` : ''}
                        ${canDeleteUser ? `
                            <button type="button" class="btn btn-sm btn-danger delete-user" data-id="${user.IDUsuario}" title="Eliminar">
                                <i class="bi bi-trash"></i>
                            </button>
                        ` : ''}
                        ${canBlockUser ? `
                            <button type="button" class="btn btn-sm ${user.Bloqueado ? 'btn-success' : 'btn-warning'} toggle-block-user" 
                                    data-id="${user.IDUsuario}" 
                                    data-blocked="${user.Bloqueado ? 'true' : 'false'}" 
                                    title="${user.Bloqueado ? 'Desbloquear' : 'Bloquear'}">
                                <i class="bi bi-${user.Bloqueado ? 'unlock' : 'lock'}"></i>
                            </button>
                        ` : ''}
                    </div>
                </td>
            </tr>
        `;
    });
    
    html += `
                </tbody>
            </table>
        </div>
    `;
    
    return html;
};

/**
 * Renderiza el formulario de usuario
 * @param {Object|null} user - Usuario a editar (null para crear)
 * @param {Array} areas - Array de áreas disponibles
 * @param {Array} roles - Array de roles disponibles
 * @returns {string} - HTML del formulario
 */
export const renderUserForm = (user = null, areas = [], roles = []) => {
    const isEdit = !!user;
    
    return `
        <form id="userForm" class="needs-validation" novalidate>
            ${isEdit ? `<input type="hidden" name="IDUsuario" value="${user.IDUsuario}">` : ''}
            
            <div class="row mb-3">
                <div class="col-md-6">
                    <label for="codigoCIP" class="form-label">Código CIP</label>
                    <input type="text" class="form-control" id="codigoCIP" name="CodigoCIP" 
                           value="${isEdit ? user.CodigoCIP : ''}" required ${isEdit ? 'readonly' : ''}>
                    <div class="invalid-feedback">El código CIP es obligatorio</div>
                </div>
                
                <div class="col-md-6">
                    <label for="rango" class="form-label">Rango</label>
                    <input type="text" class="form-control" id="rango" name="Rango" 
                           value="${isEdit ? user.Rango : ''}" required>
                    <div class="invalid-feedback">El rango es obligatorio</div>
                </div>
            </div>
            
            <div class="row mb-3">
                <div class="col-md-6">
                    <label for="nombres" class="form-label">Nombres</label>
                    <input type="text" class="form-control" id="nombres" name="Nombres" 
                           value="${isEdit ? user.Nombres : ''}" required>
                    <div class="invalid-feedback">Los nombres son obligatorios</div>
                </div>
                
                <div class="col-md-6">
                    <label for="apellidos" class="form-label">Apellidos</label>
                    <input type="text" class="form-control" id="apellidos" name="Apellidos" 
                           value="${isEdit ? user.Apellidos : ''}" required>
                    <div class="invalid-feedback">Los apellidos son obligatorios</div>
                </div>
            </div>
            
            <div class="row mb-3">
                <div class="col-md-6">
                    <label for="idArea" class="form-label">Área</label>
                    <select class="form-select" id="idArea" name="IDArea" required>
                        <option value="">Seleccione un área</option>
                        ${areas.map(area => `
                            <option value="${area.IDArea}" ${isEdit && user.IDArea == area.IDArea ? 'selected' : ''}>
                                ${area.NombreArea}
                            </option>
                        `).join('')}
                    </select>
                    <div class="invalid-feedback">Debe seleccionar un área</div>
                </div>
                
                <div class="col-md-6">
                    <label for="idRol" class="form-label">Rol</label>
                    <select class="form-select" id="idRol" name="IDRol" required>
                        <option value="">Seleccione un rol</option>
                        ${roles.map(rol => `
                            <option value="${rol.IDRol}" ${isEdit && user.IDRol == rol.IDRol ? 'selected' : ''}>
                                ${rol.NombreRol}
                            </option>
                        `).join('')}
                    </select>
                    <div class="invalid-feedback">Debe seleccionar un rol</div>
                </div>
            </div>
            
            ${!isEdit ? `
                <div class="row mb-3">
                    <div class="col-md-6">
                        <label for="password" class="form-label">Contraseña</label>
                        <input type="password" class="form-control" id="password" name="Password" required>
                        <div class="invalid-feedback">La contraseña es obligatoria</div>
                    </div>
                    
                    <div class="col-md-6">
                        <label for="confirmPassword" class="form-label">Confirmar Contraseña</label>
                        <input type="password" class="form-control" id="confirmPassword" name="ConfirmPassword" required>
                        <div class="invalid-feedback">Las contraseñas no coinciden</div>
                    </div>
                </div>
            ` : ''}
            
            <div class="d-flex justify-content-end">
                <button type="button" class="btn btn-secondary me-2" id="cancelUserForm">Cancelar</button>
                <button type="submit" class="btn btn-primary">${isEdit ? 'Actualizar' : 'Crear'} Usuario</button>
            </div>
        </form>
    `;
};

/**
 * Inicializa los eventos del módulo de usuarios
 * @param {number} userPermissions - Permisos del usuario actual
 */
export const initUserEvents = (userPermissions) => {
    const userContainer = document.getElementById('userContainer');
    if (!userContainer) return;
    
    // Evento para ver detalles de usuario
    userContainer.addEventListener('click', async (event) => {
        const viewButton = event.target.closest('.view-user');
        if (viewButton && permissionUtils.canView(userPermissions)) {
            const userId = viewButton.getAttribute('data-id');
            try {
                const user = await getUserById(userId);
                showUserDetails(user);
            } catch (error) {
                showAlert('error', `Error al obtener detalles del usuario: ${error.message}`);
            }
        }
    });
    
    // Evento para editar usuario
    userContainer.addEventListener('click', async (event) => {
        const editButton = event.target.closest('.edit-user');
        if (editButton && permissionUtils.canEdit(userPermissions)) {
            const userId = editButton.getAttribute('data-id');
            try {
                const user = await getUserById(userId);
                const areas = await getAllAreas();
                const roles = await getAllRoles();
                showUserForm(user, areas, roles);
            } catch (error) {
                showAlert('error', `Error al preparar la edición del usuario: ${error.message}`);
            }
        }
    });
    
    // Evento para eliminar usuario
    userContainer.addEventListener('click', async (event) => {
        const deleteButton = event.target.closest('.delete-user');
        if (deleteButton && permissionUtils.canDelete(userPermissions)) {
            const userId = deleteButton.getAttribute('data-id');
            if (confirm('¿Está seguro de que desea eliminar este usuario?')) {
                try {
                    await deleteUser(userId);
                    showAlert('success', 'Usuario eliminado correctamente');
                    loadUsers(); // Recargar la lista de usuarios
                } catch (error) {
                    showAlert('error', `Error al eliminar usuario: ${error.message}`);
                }
            }
        }
    });
    
    // Evento para bloquear/desbloquear usuario
    userContainer.addEventListener('click', async (event) => {
        const toggleBlockButton = event.target.closest('.toggle-block-user');
        if (toggleBlockButton && permissionUtils.canBlock(userPermissions)) {
            const userId = toggleBlockButton.getAttribute('data-id');
            const isBlocked = toggleBlockButton.getAttribute('data-blocked') === 'true';
            const action = isBlocked ? 'desbloquear' : 'bloquear';
            
            if (confirm(`¿Está seguro de que desea ${action} este usuario?`)) {
                try {
                    await toggleUserBlock(userId, !isBlocked);
                    showAlert('success', `Usuario ${isBlocked ? 'desbloqueado' : 'bloqueado'} correctamente`);
                    loadUsers(); // Recargar la lista de usuarios
                } catch (error) {
                    showAlert('error', `Error al ${action} usuario: ${error.message}`);
                }
            }
        }
    });
    
    // Evento para crear nuevo usuario
    const createUserButton = document.getElementById('createUserButton');
    if (createUserButton && permissionUtils.canCreate(userPermissions)) {
        createUserButton.addEventListener('click', async () => {
            try {
                const areas = await getAllAreas();
                const roles = await getAllRoles();
                showUserForm(null, areas, roles);
            } catch (error) {
                showAlert('error', `Error al preparar el formulario de creación: ${error.message}`);
            }
        });
    }
    
    // Inicializar validación de formulario
    document.addEventListener('submit', async (event) => {
        if (event.target.id === 'userForm') {
            event.preventDefault();
            
            const form = event.target;
            if (!form.checkValidity()) {
                event.stopPropagation();
                form.classList.add('was-validated');
                return;
            }
            
            // Validar contraseñas si es un formulario de creación
            const password = form.elements['Password']?.value;
            const confirmPassword = form.elements['ConfirmPassword']?.value;
            
            if (password && password !== confirmPassword) {
                const confirmPasswordInput = form.elements['ConfirmPassword'];
                confirmPasswordInput.setCustomValidity('Las contraseñas no coinciden');
                form.classList.add('was-validated');
                return;
            }
            
            // Recopilar datos del formulario
            const formData = new FormData(form);
            const userData = Object.fromEntries(formData.entries());
            
            try {
                const isEdit = !!userData.IDUsuario;
                
                if (isEdit) {
                    const userId = userData.IDUsuario;
                    delete userData.IDUsuario; // No enviar ID en el cuerpo
                    await updateUser(userId, userData);
                    showAlert('success', 'Usuario actualizado correctamente');
                } else {
                    delete userData.ConfirmPassword; // No enviar confirmación
                    await createUser(userData);
                    showAlert('success', 'Usuario creado correctamente');
                }
                
                // Cerrar modal y recargar usuarios
                closeModal();
                loadUsers();
            } catch (error) {
                showAlert('error', `Error al ${userData.IDUsuario ? 'actualizar' : 'crear'} usuario: ${error.message}`);
            }
        }
    });
    
    // Cancelar formulario
    document.addEventListener('click', (event) => {
        if (event.target.id === 'cancelUserForm') {
            closeModal();
        }
    });
};

/**
 * Carga y muestra la lista de usuarios
 */
export const loadUsers = async () => {
    const userContainer = document.getElementById('userContainer');
    if (!userContainer) return;
    
    try {
        const currentUser = AuthService.getCurrentUser();
        const userPermissions = permissionUtils.getRolePermissions(currentUser.IDRol);
        
        if (!permissionUtils.canView(userPermissions)) {
            userContainer.innerHTML = '<div class="alert alert-warning">No tienes permiso para ver usuarios</div>';
            return;
        }
        
        userContainer.innerHTML = '<div class="text-center"><div class="spinner-border" role="status"></div></div>';
        
        const users = await getAllUsers();
        
        let html = '';
        
        // Botón de crear usuario si tiene permiso
        if (permissionUtils.canCreate(userPermissions)) {
            html += `
                <div class="d-flex justify-content-end mb-3">
                    <button id="createUserButton" class="btn btn-primary">
                        <i class="bi bi-plus-circle"></i> Nuevo Usuario
                    </button>
                </div>
            `;
        }
        
        html += renderUsersTable(users, userPermissions);
        userContainer.innerHTML = html;
        
        // Inicializar eventos
        initUserEvents(userPermissions);
    } catch (error) {
        userContainer.innerHTML = `<div class="alert alert-danger">Error al cargar usuarios: ${error.message}</div>`;
    }
};

// Funciones auxiliares

/**
 * Muestra una alerta
 * @param {string} type - Tipo de alerta (success, error, warning, info)
 * @param {string} message - Mensaje a mostrar
 */
const showAlert = (type, message) => {
    const alertContainer = document.getElementById('alertContainer');
    if (!alertContainer) return;
    
    const alertClass = type === 'error' ? 'danger' : type;
    
    const alert = document.createElement('div');
    alert.className = `alert alert-${alertClass} alert-dismissible fade show`;
    alert.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    
    alertContainer.appendChild(alert);
    
    // Auto-cerrar después de 5 segundos
    setTimeout(() => {
        alert.classList.remove('show');
        setTimeout(() => alert.remove(), 150);
    }, 5000);
};

/**
 * Muestra un modal
 * @param {string} title - Título del modal
 * @param {string} content - Contenido HTML del modal
 * @param {string} size - Tamaño del modal (sm, lg, xl)
 */
const showModal = (title, content, size = '') => {
    let modalContainer = document.getElementById('modalContainer');
    
    if (!modalContainer) {
        modalContainer = document.createElement('div');
        modalContainer.id = 'modalContainer';
        document.body.appendChild(modalContainer);
    }
    
    modalContainer.innerHTML = `
        <div class="modal fade" id="appModal" tabindex="-1" aria-labelledby="modalLabel" aria-hidden="true">
            <div class="modal-dialog ${size ? `modal-${size}` : ''}">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="modalLabel">${title}</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        ${content}
                    </div>
                </div>
            </div>
        </div>
    `;
    
    const modal = new bootstrap.Modal(document.getElementById('appModal'));
    modal.show();
};

/**
 * Cierra el modal actual
 */
const closeModal = () => {
    const modalElement = document.getElementById('appModal');
    if (modalElement) {
        const modal = bootstrap.Modal.getInstance(modalElement);
        if (modal) modal.hide();
    }
};

/**
 * Muestra los detalles de un usuario en un modal
 * @param {Object} user - Usuario a mostrar
 */
const showUserDetails = (user) => {
    const content = `
        <div class="user-details">
            <div class="row mb-3">
                <div class="col-md-6">
                    <p><strong>ID:</strong> ${user.IDUsuario}</p>
                    <p><strong>CIP:</strong> ${user.CodigoCIP}</p>
                    <p><strong>Nombres:</strong> ${user.Nombres}</p>
                    <p><strong>Apellidos:</strong> ${user.Apellidos}</p>
                </div>
                <div class="col-md-6">
                    <p><strong>Rango:</strong> ${user.Rango}</p>
                    <p><strong>Área:</strong> ${user.NombreArea || user.IDArea}</p>
                    <p><strong>Rol:</strong> ${user.NombreRol || user.IDRol}</p>
                    <p><strong>Estado:</strong> ${user.Bloqueado ? 'Bloqueado' : 'Activo'}</p>
                </div>
            </div>
            <div class="row">
                <div class="col-12">
                    <p><strong>Último Acceso:</strong> ${user.UltimoAcceso ? new Date(user.UltimoAcceso).toLocaleString() : 'Nunca'}</p>
                    <p><strong>Intentos Fallidos:</strong> ${user.IntentosFallidos}</p>
                    ${user.UltimoBloqueo ? `<p><strong>Último Bloqueo:</strong> ${new Date(user.UltimoBloqueo).toLocaleString()}</p>` : ''}
                </div>
            </div>
        </div>
    `;
    
    showModal(`Detalles del Usuario: ${user.Nombres} ${user.Apellidos}`, content);
};

/**
 * Muestra el formulario de usuario en un modal
 * @param {Object|null} user - Usuario a editar (null para crear)
 * @param {Array} areas - Array de áreas disponibles
 * @param {Array} roles - Array de roles disponibles
 */
const showUserForm = (user, areas, roles) => {
    const isEdit = !!user;
    const title = isEdit ? `Editar Usuario: ${user.Nombres} ${user.Apellidos}` : 'Crear Nuevo Usuario';
    const content = renderUserForm(user, areas, roles);
    
    showModal(title, content, 'lg');
};

// Funciones para obtener áreas y roles (estas deberían estar en sus propios módulos)

/**
 * Obtiene todas las áreas
 * @returns {Promise<Array>} - Promesa que resuelve a un array de áreas
 */
const getAllAreas = async () => {
    try {
        const response = await fetch('/api/areas', {
            method: 'GET',
            headers: getAuthHeaders()
        });
        
        if (!response.ok) {
            throw new Error(`Error al obtener áreas: ${response.statusText}`);
        }
        
        const data = await response.json();
        return data.areas || [];
    } catch (error) {
        console.error('Error en getAllAreas:', error);
        throw error;
    }
};

/**
 * Obtiene todos los roles
 * @returns {Promise<Array>} - Promesa que resuelve a un array de roles
 */
const getAllRoles = async () => {
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
        console.error('Error en getAllRoles:', error);
        throw error;
    }
}; 