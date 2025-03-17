/**
 * Componente UserProfile
 * Maneja la visualización y edición del perfil de usuario
 */

// Importaciones básicas - evitar dependencias circulares
import sessionService from '../../services/sessionService.js';

// Crear una versión lazy-loaded de userService para evitar errores de inicialización
let _userService = null;
async function getUserService() {
    if (!_userService) {
        try {
            // Importación dinámica para evitar problemas de inicialización
            const importedModule = await import('../../services/user.service.js');
            _userService = importedModule.default || importedModule;
            console.log('[UserProfile] userService cargado correctamente');
        } catch (error) {
            console.error('[UserProfile] Error cargando userService:', error);
            // Proporcionar una implementación mock básica si hay error
            _userService = {
                updateProfile: async () => {
                    console.warn('[UserProfile] Usando implementación mock de updateProfile');
                    return { success: false, error: 'Servicio no disponible' };
                },
                changePassword: async () => {
                    console.warn('[UserProfile] Usando implementación mock de changePassword');
                    return { success: false, error: 'Servicio no disponible' };
                }
            };
        }
    }
    return _userService;
}

// Importaciones de componentes de UI
import { Button } from '../base/Button.js';
import { Card } from '../base/Card.js';
import { Modal } from '../base/Modal.js';

export class UserProfile {
    constructor(options = {}) {
        this.options = {
            onSave: options.onSave || null,
            onCancel: options.onCancel || null,
            className: options.className || 'user-profile',
            ...options
        };
        
        this.user = null;
        this.isEditing = false;
    }

    async render(container) {
        try {
            // Obtener datos del usuario actual
            this.user = await sessionService.obtenerUsuarioActual();
            
            if (!this.user) {
                throw new Error('No se pudo obtener la información del usuario');
            }

            const template = `
                <div class="${this.options.className}">
                    <div class="row">
                        <div class="col-md-4">
                            ${this.renderUserInfo()}
                        </div>
                        <div class="col-md-8">
                            ${this.renderUserDetails()}
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
            console.error('[USER-PROFILE] Error al renderizar:', error);
            throw error;
        }
    }

    renderUserInfo() {
        return `
            <div class="card mb-4">
                <div class="card-body text-center">
                    <div class="mb-3">
                        <i class="fas fa-user-circle fa-5x text-primary"></i>
                    </div>
                    <h4 class="card-title">${this.user.nombres} ${this.user.apellidos}</h4>
                    <p class="text-muted">${this.user.grado || 'Usuario'}</p>
                    <p class="text-muted">CIP: ${this.user.codigoCIP}</p>
                    <div class="mt-3">
                        <button class="btn btn-primary" id="editProfileBtn">
                            <i class="fas fa-edit me-2"></i>Editar Perfil
                        </button>
                        <button class="btn btn-secondary" id="changePasswordBtn">
                            <i class="fas fa-key me-2"></i>Cambiar Contraseña
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    renderUserDetails() {
        return `
            <div class="card">
                <div class="card-header">
                    <h5 class="card-title mb-0">Información Personal</h5>
                </div>
                <div class="card-body">
                    <div class="row mb-3">
                        <div class="col-md-6">
                            <label class="form-label">Nombres</label>
                            <input type="text" class="form-control" id="nombres" 
                                   value="${this.user.nombres || ''}" 
                                   ${!this.isEditing ? 'readonly' : ''}>
                        </div>
                        <div class="col-md-6">
                            <label class="form-label">Apellidos</label>
                            <input type="text" class="form-control" id="apellidos" 
                                   value="${this.user.apellidos || ''}" 
                                   ${!this.isEditing ? 'readonly' : ''}>
                        </div>
                    </div>
                    <div class="row mb-3">
                        <div class="col-md-6">
                            <label class="form-label">Código CIP</label>
                            <input type="text" class="form-control" id="codigoCIP" 
                                   value="${this.user.codigoCIP || ''}" 
                                   readonly>
                        </div>
                        <div class="col-md-6">
                            <label class="form-label">Grado</label>
                            <input type="text" class="form-control" id="grado" 
                                   value="${this.user.grado || ''}" 
                                   ${!this.isEditing ? 'readonly' : ''}>
                        </div>
                    </div>
                    <div class="row mb-3">
                        <div class="col-md-6">
                            <label class="form-label">Área</label>
                            <input type="text" class="form-control" id="area" 
                                   value="${this.user.nombreArea || ''}" 
                                   readonly>
                        </div>
                        <div class="col-md-6">
                            <label class="form-label">Rol</label>
                            <input type="text" class="form-control" id="rol" 
                                   value="${this.user.nombreRol || ''}" 
                                   readonly>
                        </div>
                    </div>
                    ${this.isEditing ? `
                        <div class="text-end">
                            <button class="btn btn-secondary me-2" id="cancelEditBtn">
                                Cancelar
                            </button>
                            <button class="btn btn-primary" id="saveProfileBtn">
                                Guardar Cambios
                            </button>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    initializeEventListeners(container) {
        // Botón de editar perfil
        const editBtn = container.querySelector('#editProfileBtn');
        if (editBtn) {
            editBtn.addEventListener('click', () => this.handleEditProfile());
        }

        // Botón de cambiar contraseña
        const changePasswordBtn = container.querySelector('#changePasswordBtn');
        if (changePasswordBtn) {
            changePasswordBtn.addEventListener('click', () => this.handleChangePassword());
        }

        // Botones de edición
        if (this.isEditing) {
            const cancelBtn = container.querySelector('#cancelEditBtn');
            const saveBtn = container.querySelector('#saveProfileBtn');

            if (cancelBtn) {
                cancelBtn.addEventListener('click', () => this.handleCancelEdit());
            }

            if (saveBtn) {
                saveBtn.addEventListener('click', () => this.handleSaveProfile());
            }
        }
    }

    handleEditProfile() {
        this.isEditing = true;
        this.render(document.querySelector(`.${this.options.className}`));
    }

    handleCancelEdit() {
        this.isEditing = false;
        this.render(document.querySelector(`.${this.options.className}`));
        if (this.options.onCancel) {
            this.options.onCancel();
        }
    }

    async handleSaveProfile() {
        try {
            console.log('[DEBUG] Preparando actualización de perfil...');
            const updatedUser = {
                ...this.user,
                nombres: document.getElementById('nombres').value,
                apellidos: document.getElementById('apellidos').value,
                grado: document.getElementById('grado').value
            };
            
            console.log('[DEBUG] Datos a enviar:', JSON.stringify(updatedUser));
            console.log('[DEBUG] Enviando solicitud mediante userService.updateProfile...');

            // Obtener la instancia del servicio y luego llamar al método
            const userServiceInstance = await getUserService();
            const result = await userServiceInstance.updateProfile(updatedUser);
            console.log('[DEBUG] Perfil actualizado correctamente:', JSON.stringify(result));

            this.isEditing = false;
            this.user = result;
            this.render(document.querySelector(`.${this.options.className}`));

            // Mostrar mensaje de éxito
            this.showMessage('success', 'Perfil actualizado correctamente');

            if (this.options.onSave) {
                this.options.onSave(result);
            }
        } catch (error) {
            console.error('[USER-PROFILE] Error al guardar perfil:', error);
            console.log('[DEBUG] Error detallado:', error.stack || error.message || error);
            this.showMessage('error', error.message || 'Error al actualizar el perfil');
        }
    }

    handleChangePassword() {
        console.log('[DEBUG] Abriendo modal de cambio de contraseña...');
        
        // Crear modal para cambiar contraseña
        const modal = new Modal({
            title: 'Cambiar Contraseña',
            content: this.renderChangePasswordForm(),
            onSave: async () => {
                try {
                    const currentPassword = document.getElementById('currentPassword').value;
                    const newPassword = document.getElementById('newPassword').value;
                    const confirmPassword = document.getElementById('confirmPassword').value;
                    
                    console.log('[DEBUG] Validando contraseñas...');
                    // Validar que las contraseñas coincidan
                    if (newPassword !== confirmPassword) {
                        throw new Error('Las contraseñas no coinciden');
                    }
                    
                    console.log('[DEBUG] Enviando solicitud de cambio de contraseña...');
                    // Obtener la instancia del servicio y luego llamar al método
                    const userServiceInstance = await getUserService();
                    const result = await userServiceInstance.changePassword({
                        currentPassword, 
                        newPassword
                    });
                    
                    console.log('[DEBUG] Contraseña actualizada correctamente');
                    modal.hide();
                    
                    // Mostrar mensaje de éxito
                    this.showMessage('success', 'Contraseña actualizada correctamente');
                } catch (error) {
                    console.error('[USER-PROFILE] Error al cambiar contraseña:', error);
                    console.log('[DEBUG] Error detallado:', error.stack || error.message || error);
                    document.getElementById('passwordError').textContent = error.message || 'Error al cambiar la contraseña';
                    document.getElementById('passwordError').classList.remove('d-none');
                }
            }
        });

        modal.show();
    }

    renderChangePasswordForm() {
        return `
            <form id="changePasswordForm">
                <div class="mb-3">
                    <label class="form-label">Contraseña Actual</label>
                    <input type="password" class="form-control" id="currentPassword" required>
                </div>
                <div class="mb-3">
                    <label class="form-label">Nueva Contraseña</label>
                    <input type="password" class="form-control" id="newPassword" required>
                </div>
                <div class="mb-3">
                    <label class="form-label">Confirmar Nueva Contraseña</label>
                    <input type="password" class="form-control" id="confirmPassword" required>
                </div>
                <div id="passwordError" class="alert alert-danger d-none"></div>
            </form>
        `;
    }
    
    /**
     * Muestra un mensaje de éxito o error
     * @param {string} type - 'success' o 'error'
     * @param {string} message - Mensaje a mostrar
     */
    showMessage(type, message) {
        // Crear elemento para el mensaje
        const messageDiv = document.createElement('div');
        messageDiv.className = `alert alert-${type === 'success' ? 'success' : 'danger'} alert-dismissible fade show my-3`;
        messageDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        `;
        
        // Buscar el contenedor para insertar el mensaje
        const container = document.querySelector(`.${this.options.className}`);
        if (container) {
            container.prepend(messageDiv);
            
            // Autoremover después de 5 segundos
            setTimeout(() => {
                messageDiv.classList.remove('show');
                setTimeout(() => messageDiv.remove(), 300);
            }, 5000);
        }
    }
}

export default UserProfile; 