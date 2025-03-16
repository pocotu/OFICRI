/**
 * Componente SystemConfig
 * Maneja la visualización y gestión de la configuración del sistema
 */

import { adminService } from '../../services/admin.service.js';
import { sessionManager } from '../../services/sessionManager.js';
import { permissionUtils } from '../../utils/permissions.js';
import { Button } from '../base/Button.js';
import { Card } from '../base/Card.js';
import { Modal } from '../base/Modal.js';

export class SystemConfig {
    constructor(options = {}) {
        this.options = {
            onConfigUpdate: options.onConfigUpdate || null,
            onBackupCreate: options.onBackupCreate || null,
            onBackupRestore: options.onBackupRestore || null,
            className: options.className || 'system-config',
            ...options
        };

        this.config = null;
        this.backups = [];
    }

    async render(container) {
        try {
            // Cargar datos iniciales
            await this.loadInitialData();

            const template = `
                <div class="${this.options.className}">
                    <div class="row mb-4">
                        <div class="col-12">
                            <h2 class="mb-0">Configuración del Sistema</h2>
                        </div>
                    </div>
                    
                    ${this.renderGeneralConfig()}
                    ${this.renderSecurityConfig()}
                    ${this.renderBackupConfig()}
                </div>
            `;

            if (container) {
                container.innerHTML = template;
                this.initializeEventListeners(container);
            }

            return template;
        } catch (error) {
            console.error('[SYSTEM-CONFIG] Error al renderizar:', error);
            throw error;
        }
    }

    renderGeneralConfig() {
        if (!this.config) return '';

        return `
            <div class="card mb-4">
                <div class="card-header">
                    <h5 class="card-title mb-0">Configuración General</h5>
                </div>
                <div class="card-body">
                    <form id="generalConfigForm">
                        <div class="row mb-3">
                            <div class="col-md-6">
                                <label class="form-label">Nombre del Sistema</label>
                                <input type="text" class="form-control" id="systemName" 
                                       value="${this.config.systemName || ''}" required>
                            </div>
                            <div class="col-md-6">
                                <label class="form-label">Email de Contacto</label>
                                <input type="email" class="form-control" id="contactEmail" 
                                       value="${this.config.contactEmail || ''}" required>
                            </div>
                        </div>
                        <div class="row mb-3">
                            <div class="col-md-6">
                                <label class="form-label">Zona Horaria</label>
                                <select class="form-select" id="timezone" required>
                                    <option value="America/Lima" ${this.config.timezone === 'America/Lima' ? 'selected' : ''}>
                                        Lima (GMT-5)
                                    </option>
                                    <!-- Más zonas horarias -->
                                </select>
                            </div>
                            <div class="col-md-6">
                                <label class="form-label">Idioma</label>
                                <select class="form-select" id="language" required>
                                    <option value="es" ${this.config.language === 'es' ? 'selected' : ''}>
                                        Español
                                    </option>
                                    <!-- Más idiomas -->
                                </select>
                            </div>
                        </div>
                        <div class="text-end">
                            <button type="submit" class="btn btn-primary">
                                <i class="fas fa-save me-2"></i>Guardar Cambios
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;
    }

    renderSecurityConfig() {
        if (!this.config) return '';

        return `
            <div class="card mb-4">
                <div class="card-header">
                    <h5 class="card-title mb-0">Configuración de Seguridad</h5>
                </div>
                <div class="card-body">
                    <form id="securityConfigForm">
                        <div class="row mb-3">
                            <div class="col-md-6">
                                <label class="form-label">Longitud Mínima de Contraseña</label>
                                <input type="number" class="form-control" id="minPasswordLength" 
                                       value="${this.config.minPasswordLength || 8}" min="6" max="32" required>
                            </div>
                            <div class="col-md-6">
                                <label class="form-label">Días de Expiración de Contraseña</label>
                                <input type="number" class="form-control" id="passwordExpirationDays" 
                                       value="${this.config.passwordExpirationDays || 90}" min="30" max="365" required>
                            </div>
                        </div>
                        <div class="row mb-3">
                            <div class="col-md-6">
                                <label class="form-label">Intentos Máximos de Login</label>
                                <input type="number" class="form-control" id="maxLoginAttempts" 
                                       value="${this.config.maxLoginAttempts || 3}" min="1" max="10" required>
                            </div>
                            <div class="col-md-6">
                                <label class="form-label">Tiempo de Bloqueo (minutos)</label>
                                <input type="number" class="form-control" id="lockoutDuration" 
                                       value="${this.config.lockoutDuration || 30}" min="5" max="1440" required>
                            </div>
                        </div>
                        <div class="mb-3">
                            <div class="form-check">
                                <input type="checkbox" class="form-check-input" id="requireTwoFactor" 
                                       ${this.config.requireTwoFactor ? 'checked' : ''}>
                                <label class="form-check-label">Requerir Autenticación de Dos Factores</label>
                            </div>
                        </div>
                        <div class="text-end">
                            <button type="submit" class="btn btn-primary">
                                <i class="fas fa-save me-2"></i>Guardar Cambios
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;
    }

    renderBackupConfig() {
        return `
            <div class="card">
                <div class="card-header">
                    <h5 class="card-title mb-0">Copias de Seguridad</h5>
                </div>
                <div class="card-body">
                    <div class="row mb-4">
                        <div class="col-12">
                            <button class="btn btn-primary" id="createBackupBtn">
                                <i class="fas fa-download me-2"></i>Crear Copia de Seguridad
                            </button>
                        </div>
                    </div>
                    
                    <div class="table-responsive">
                        <table class="table">
                            <thead>
                                <tr>
                                    <th>Fecha</th>
                                    <th>Tamaño</th>
                                    <th>Estado</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${this.backups.map(backup => this.renderBackupRow(backup)).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
    }

    renderBackupRow(backup) {
        return `
            <tr>
                <td>${new Date(backup.date).toLocaleString()}</td>
                <td>${this.formatFileSize(backup.size)}</td>
                <td>
                    <span class="badge bg-${backup.status === 'completed' ? 'success' : 'warning'}">
                        ${backup.status === 'completed' ? 'Completado' : 'En Progreso'}
                    </span>
                </td>
                <td>
                    <div class="btn-group">
                        <button class="btn btn-sm btn-outline-primary" 
                                data-backup-id="${backup.id}" 
                                data-action="download">
                            <i class="fas fa-download"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-success" 
                                data-backup-id="${backup.id}" 
                                data-action="restore">
                            <i class="fas fa-undo"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger" 
                                data-backup-id="${backup.id}" 
                                data-action="delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }

    async loadInitialData() {
        try {
            this.config = await adminService.getSystemConfig();
            this.backups = await adminService.getBackups();
        } catch (error) {
            console.error('[SYSTEM-CONFIG] Error al cargar datos iniciales:', error);
            throw error;
        }
    }

    initializeEventListeners(container) {
        // Formularios
        const generalForm = container.querySelector('#generalConfigForm');
        const securityForm = container.querySelector('#securityConfigForm');

        if (generalForm) {
            generalForm.addEventListener('submit', (e) => this.handleGeneralConfigSubmit(e));
        }

        if (securityForm) {
            securityForm.addEventListener('submit', (e) => this.handleSecurityConfigSubmit(e));
        }

        // Botón de copia de seguridad
        const createBackupBtn = container.querySelector('#createBackupBtn');
        if (createBackupBtn && this.options.onBackupCreate) {
            createBackupBtn.addEventListener('click', () => {
                this.options.onBackupCreate();
            });
        }

        // Acciones de copias de seguridad
        const backupButtons = container.querySelectorAll('[data-backup-id]');
        backupButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const backupId = e.currentTarget.dataset.backupId;
                const action = e.currentTarget.dataset.action;
                this.handleBackupAction(backupId, action);
            });
        });
    }

    async handleGeneralConfigSubmit(e) {
        e.preventDefault();

        const config = {
            systemName: document.getElementById('systemName').value,
            contactEmail: document.getElementById('contactEmail').value,
            timezone: document.getElementById('timezone').value,
            language: document.getElementById('language').value
        };

        try {
            await adminService.updateSystemConfig(config);
            if (this.options.onConfigUpdate) {
                this.options.onConfigUpdate(config);
            }
            this.showSuccess('Configuración general actualizada correctamente');
        } catch (error) {
            console.error('[SYSTEM-CONFIG] Error al actualizar configuración general:', error);
            this.showError('Error al actualizar la configuración general');
        }
    }

    async handleSecurityConfigSubmit(e) {
        e.preventDefault();

        const config = {
            minPasswordLength: parseInt(document.getElementById('minPasswordLength').value),
            passwordExpirationDays: parseInt(document.getElementById('passwordExpirationDays').value),
            maxLoginAttempts: parseInt(document.getElementById('maxLoginAttempts').value),
            lockoutDuration: parseInt(document.getElementById('lockoutDuration').value),
            requireTwoFactor: document.getElementById('requireTwoFactor').checked
        };

        try {
            await adminService.updateSystemConfig(config);
            if (this.options.onConfigUpdate) {
                this.options.onConfigUpdate(config);
            }
            this.showSuccess('Configuración de seguridad actualizada correctamente');
        } catch (error) {
            console.error('[SYSTEM-CONFIG] Error al actualizar configuración de seguridad:', error);
            this.showError('Error al actualizar la configuración de seguridad');
        }
    }

    handleBackupAction(backupId, action) {
        switch (action) {
            case 'download':
                this.handleBackupDownload(backupId);
                break;
            case 'restore':
                this.handleBackupRestore(backupId);
                break;
            case 'delete':
                this.handleBackupDelete(backupId);
                break;
        }
    }

    async handleBackupDownload(backupId) {
        try {
            // Implementar descarga de copia de seguridad
            console.log('[SYSTEM-CONFIG] Descargando copia de seguridad:', backupId);
        } catch (error) {
            console.error('[SYSTEM-CONFIG] Error al descargar copia de seguridad:', error);
            this.showError('Error al descargar la copia de seguridad');
        }
    }

    async handleBackupRestore(backupId) {
        const modal = new Modal({
            title: 'Restaurar Copia de Seguridad',
            content: '¿Está seguro de que desea restaurar esta copia de seguridad? Esta acción no se puede deshacer.',
            onConfirm: async () => {
                try {
                    await adminService.restoreBackup(backupId);
                    if (this.options.onBackupRestore) {
                        this.options.onBackupRestore(backupId);
                    }
                    this.showSuccess('Copia de seguridad restaurada correctamente');
                } catch (error) {
                    console.error('[SYSTEM-CONFIG] Error al restaurar copia de seguridad:', error);
                    this.showError('Error al restaurar la copia de seguridad');
                }
            }
        });

        modal.show();
    }

    async handleBackupDelete(backupId) {
        const modal = new Modal({
            title: 'Eliminar Copia de Seguridad',
            content: '¿Está seguro de que desea eliminar esta copia de seguridad?',
            onConfirm: async () => {
                try {
                    await adminService.deleteBackup(backupId);
                    this.showSuccess('Copia de seguridad eliminada correctamente');
                    this.render(document.querySelector(`.${this.options.className}`));
                } catch (error) {
                    console.error('[SYSTEM-CONFIG] Error al eliminar copia de seguridad:', error);
                    this.showError('Error al eliminar la copia de seguridad');
                }
            }
        });

        modal.show();
    }

    formatFileSize(bytes) {
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        if (bytes === 0) return '0 Byte';
        const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
        return Math.round(bytes / Math.pow(1024, i), 2) + ' ' + sizes[i];
    }

    showSuccess(message) {
        // Implementar notificación de éxito
        console.log('[SYSTEM-CONFIG] Éxito:', message);
    }

    showError(message) {
        // Implementar notificación de error
        console.error('[SYSTEM-CONFIG] Error:', message);
    }
}

export default SystemConfig; 