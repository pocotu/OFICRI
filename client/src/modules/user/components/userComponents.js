/**
 * Componentes de usuario
 * Funciones para renderizar componentes relacionados con usuarios
 */

import * as permissionUtils from '../../../utils/permissions.js';

/**
 * Renderiza la tabla de usuarios
 * @param {Array} users - Lista de usuarios
 * @param {number} userPermissions - Permisos del usuario actual
 * @returns {string} HTML de la tabla de usuarios
 */
export const renderUsersTable = (users, userPermissions) => {
    if (!users || users.length === 0) {
        return `
            <div class="alert alert-info">
                <i class="fas fa-info-circle me-2"></i>
                No hay usuarios registrados en el sistema.
            </div>
        `;
    }

    const canEdit = permissionUtils.canEdit(userPermissions);
    const canDelete = permissionUtils.canDelete(userPermissions);
    const canBloquear = permissionUtils.canBloquear(userPermissions);
    
    return `
        <div class="table-responsive">
            <table class="table table-striped table-hover">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>CIP</th>
                        <th>Nombres</th>
                        <th>Apellidos</th>
                        <th>Grado</th>
                        <th>Área</th>
                        <th>Rol</th>
                        <th>Estado</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    ${users.map(user => `
                        <tr>
                            <td>${user.IDUsuario || user.id || ''}</td>
                            <td>${user.CodigoCIP || user.codigoCIP || ''}</td>
                            <td>${user.Nombres || user.nombres || ''}</td>
                            <td>${user.Apellidos || user.apellidos || ''}</td>
                            <td>${user.Grado || user.grado || ''}</td>
                            <td>${user.NombreArea || user.nombreArea || user.IDArea || user.idArea || ''}</td>
                            <td>${user.NombreRol || user.nombreRol || user.IDRol || user.idRol || ''}</td>
                            <td>
                                <span class="badge ${user.Bloqueado || user.bloqueado ? 'bg-danger' : 'bg-success'}">
                                    ${user.Bloqueado || user.bloqueado ? 'Bloqueado' : 'Activo'}
                                </span>
                            </td>
                            <td>
                                <div class="btn-group btn-group-sm">
                                    <button class="btn btn-info btn-view-user" data-id="${user.IDUsuario || user.id}">
                                        <i class="fas fa-eye"></i>
                                    </button>
                                    ${canEdit ? `
                                        <button class="btn btn-primary btn-edit-user" data-id="${user.IDUsuario || user.id}">
                                            <i class="fas fa-edit"></i>
                                        </button>
                                    ` : ''}
                                    ${canDelete ? `
                                        <button class="btn btn-danger btn-delete-user" data-id="${user.IDUsuario || user.id}">
                                            <i class="fas fa-trash"></i>
                                        </button>
                                    ` : ''}
                                    ${canBloquear ? `
                                        <button class="btn btn-${user.Bloqueado || user.bloqueado ? 'success' : 'warning'} btn-toggle-block" 
                                                data-id="${user.IDUsuario || user.id}" 
                                                data-blocked="${user.Bloqueado || user.bloqueado}">
                                            <i class="fas fa-${user.Bloqueado || user.bloqueado ? 'unlock' : 'lock'}"></i>
                                        </button>
                                    ` : ''}
                                </div>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
};

/**
 * Renderiza el formulario de usuario
 * @param {Object} user - Datos del usuario (null para nuevo usuario)
 * @param {Array} areas - Lista de áreas
 * @param {Array} roles - Lista de roles
 * @returns {string} HTML del formulario
 */
export const renderUserForm = (user = null, areas = [], roles = []) => {
    const isEdit = !!user;
    
    return `
        <form id="userForm" class="needs-validation user-form" novalidate>
            ${isEdit ? `<input type="hidden" name="IDUsuario" value="${user.IDUsuario}">` : ''}
            
            <div class="row mb-3">
                <div class="col-md-6">
                    <label for="codigoCIP" class="form-label fw-bold">Código CIP</label>
                    <input type="text" class="form-control" id="codigoCIP" name="CodigoCIP" 
                           value="${isEdit ? user.CodigoCIP : ''}" required ${isEdit ? 'readonly' : ''}>
                    <div class="invalid-feedback">El código CIP es obligatorio</div>
                </div>
                
                <div class="col-md-6">
                    <label for="grado" class="form-label fw-bold">Grado</label>
                    <input type="text" class="form-control" id="grado" name="Grado" 
                           value="${isEdit ? user.Grado : ''}" required>
                    <div class="invalid-feedback">El grado es obligatorio</div>
                </div>
            </div>
            
            <div class="row mb-3">
                <div class="col-md-6">
                    <label for="nombres" class="form-label fw-bold">Nombres</label>
                    <input type="text" class="form-control" id="nombres" name="Nombres" 
                           value="${isEdit ? user.Nombres : ''}" required>
                    <div class="invalid-feedback">El nombre es obligatorio</div>
                </div>
                
                <div class="col-md-6">
                    <label for="apellidos" class="form-label fw-bold">Apellidos</label>
                    <input type="text" class="form-control" id="apellidos" name="Apellidos" 
                           value="${isEdit ? user.Apellidos : ''}" required>
                    <div class="invalid-feedback">Los apellidos son obligatorios</div>
                </div>
            </div>
            
            <div class="row mb-3">
                <div class="col-md-6">
                    <label for="idArea" class="form-label fw-bold">Área</label>
                    <select class="form-select" id="idArea" name="IDArea" required>
                        <option value="">Seleccione un área</option>
                        ${areas.map(area => `
                            <option value="${area.IDArea}" 
                                ${isEdit && (user.IDArea == area.IDArea) ? 'selected' : ''}>
                                ${area.NombreArea}
                            </option>
                        `).join('')}
                    </select>
                    <div class="invalid-feedback">Debe seleccionar un área</div>
                </div>
                
                <div class="col-md-6">
                    <label for="idRol" class="form-label fw-bold">Rol</label>
                    <select class="form-select" id="idRol" name="IDRol" required>
                        <option value="">Seleccione un rol</option>
                        ${roles.map(rol => `
                            <option value="${rol.IDRol}" 
                                ${isEdit && (user.IDRol == rol.IDRol) ? 'selected' : ''}>
                                ${rol.NombreRol}
                            </option>
                        `).join('')}
                    </select>
                    <div class="invalid-feedback">Debe seleccionar un rol</div>
                </div>
            </div>
            
            <div class="row mb-3">
                <div class="col-md-6">
                    <label for="password" class="form-label fw-bold">Contraseña ${isEdit ? '(Dejar en blanco para mantener actual)' : ''}</label>
                    <div class="input-group">
                        <input type="password" class="form-control" id="password" name="Password" 
                               ${!isEdit ? 'required' : ''}>
                        <button class="btn btn-outline-secondary toggle-password" type="button">
                            <i class="fas fa-eye"></i>
                        </button>
                        <div class="invalid-feedback">La contraseña es obligatoria</div>
                    </div>
                </div>
                
                ${isEdit ? `
                    <div class="col-md-6">
                        <label for="bloqueado" class="form-label fw-bold">Estado</label>
                        <select class="form-select" id="bloqueado" name="Bloqueado">
                            <option value="false" ${user.Bloqueado === false ? 'selected' : ''}>Activo</option>
                            <option value="true" ${user.Bloqueado === true ? 'selected' : ''}>Bloqueado</option>
                        </select>
                    </div>
                ` : ''}
            </div>
            
            <div class="d-flex justify-content-end mt-4">
                <button type="button" class="btn btn-secondary me-2" data-bs-dismiss="modal">Cancelar</button>
                <button type="submit" class="btn btn-primary">
                    <i class="fas fa-save me-1"></i>
                    ${isEdit ? 'Actualizar' : 'Guardar'}
                </button>
            </div>
        </form>
    `;
};

/**
 * Muestra los detalles de un usuario
 * @param {Object} user - Datos del usuario
 * @returns {string} HTML con los detalles
 */
export const showUserDetails = (user) => {
    return `
        <div class="user-details">
            <div class="row mb-4">
                <div class="col-md-6">
                    <h5 class="fw-bold">${user.Nombres} ${user.Apellidos}</h5>
                    <p class="text-muted">CIP: ${user.CodigoCIP}</p>
                </div>
                <div class="col-md-6 text-md-end">
                    <span class="badge ${user.Bloqueado ? 'bg-danger' : 'bg-success'}">
                        ${user.Bloqueado ? 'Bloqueado' : 'Activo'}
                    </span>
                </div>
            </div>
            
            <div class="row">
                <div class="col-md-6">
                    <p><strong>Grado:</strong> ${user.Grado}</p>
                    <p><strong>Área:</strong> ${user.NombreArea || user.IDArea}</p>
                    <p><strong>Rol:</strong> ${user.NombreRol || user.IDRol}</p>
                </div>
                <div class="col-md-6">
                    <p><strong>Último acceso:</strong> ${user.UltimoAcceso ? new Date(user.UltimoAcceso).toLocaleString() : 'No disponible'}</p>
                </div>
            </div>
        </div>
    `;
};

/**
 * Renderiza un modal con formulario de usuario
 * @param {Object} user - Datos del usuario (null para nuevo usuario)
 * @param {Array} areas - Lista de áreas
 * @param {Array} roles - Lista de roles
 * @returns {string} HTML del modal
 */
export const renderUserFormModal = (user, areas, roles) => {
    const isEdit = !!user;
    
    return `
        <div class="modal-header">
            <h5 class="modal-title">${isEdit ? 'Editar' : 'Nuevo'} Usuario</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>
        <div class="modal-body">
            ${renderUserForm(user, areas, roles)}
        </div>
    `;
}; 