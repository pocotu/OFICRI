/**
 * Componente AdminPanel
 * Maneja la visualización y gestión del panel de administración
 */

import { adminService } from '../../services/admin.service.js';
import { sessionManager } from '../../services/sessionManager.js';
import { permissionUtils } from '../../utils/permissions.js';
import { Button } from '../base/Button.js';
import { Card } from '../base/Card.js';
import { Modal } from '../base/Modal.js';

export class AdminPanel {
    constructor(options = {}) {
        this.options = {
            onUserManagement: options.onUserManagement || null,
            onSystemConfig: options.onSystemConfig || null,
            onReports: options.onReports || null,
            className: options.className || 'admin-panel',
            ...options
        };

        this.stats = null;
        this.config = null;
    }

    async render(container) {
        try {
            // Cargar datos iniciales
            await this.loadInitialData();

            const template = `
                <div class="${this.options.className}">
                    <div class="row mb-4">
                        <div class="col-12">
                            <h2 class="mb-0">Panel de Administración</h2>
                        </div>
                    </div>
                    
                    ${this.renderStats()}
                    ${this.renderQuickActions()}
                    ${this.renderSystemStatus()}
                </div>
            `;

            if (container) {
                container.innerHTML = template;
                this.initializeEventListeners(container);
            }

            return template;
        } catch (error) {
            console.error('[ADMIN-PANEL] Error al renderizar:', error);
            throw error;
        }
    }

    renderStats() {
        if (!this.stats) return '';

        return `
            <div class="row mb-4">
                <div class="col-md-3">
                    <div class="card bg-primary text-white">
                        <div class="card-body">
                            <h5 class="card-title">Usuarios Activos</h5>
                            <h2 class="mb-0">${this.stats.activeUsers}</h2>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card bg-success text-white">
                        <div class="card-body">
                            <h5 class="card-title">Documentos Totales</h5>
                            <h2 class="mb-0">${this.stats.totalDocuments}</h2>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card bg-info text-white">
                        <div class="card-body">
                            <h5 class="card-title">Documentos Pendientes</h5>
                            <h2 class="mb-0">${this.stats.pendingDocuments}</h2>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card bg-warning text-white">
                        <div class="card-body">
                            <h5 class="card-title">Áreas Activas</h5>
                            <h2 class="mb-0">${this.stats.activeAreas}</h2>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    renderQuickActions() {
        const user = sessionManager.obtenerUsuarioActual();
        const permissions = permissionUtils.getRolePermissions(user.IDRol);

        return `
            <div class="card mb-4">
                <div class="card-header">
                    <h5 class="card-title mb-0">Acciones Rápidas</h5>
                </div>
                <div class="card-body">
                    <div class="row">
                        ${permissions.USUARIOS_GESTIONAR ? `
                            <div class="col-md-4 mb-3">
                                <button class="btn btn-primary w-100" id="userManagementBtn">
                                    <i class="fas fa-users me-2"></i>Gestión de Usuarios
                                </button>
                            </div>
                        ` : ''}
                        ${permissions.SISTEMA_CONFIGURAR ? `
                            <div class="col-md-4 mb-3">
                                <button class="btn btn-secondary w-100" id="systemConfigBtn">
                                    <i class="fas fa-cog me-2"></i>Configuración del Sistema
                                </button>
                            </div>
                        ` : ''}
                        ${permissions.REPORTES_VER ? `
                            <div class="col-md-4 mb-3">
                                <button class="btn btn-info w-100" id="reportsBtn">
                                    <i class="fas fa-chart-bar me-2"></i>Reportes y Estadísticas
                                </button>
                            </div>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    }

    renderSystemStatus() {
        if (!this.config) return '';

        return `
            <div class="card">
                <div class="card-header">
                    <h5 class="card-title mb-0">Estado del Sistema</h5>
                </div>
                <div class="card-body">
                    <div class="row">
                        <div class="col-md-6">
                            <h6>Información General</h6>
                            <ul class="list-group">
                                <li class="list-group-item d-flex justify-content-between">
                                    <span>Versión del Sistema</span>
                                    <span class="badge bg-primary">${this.config.version}</span>
                                </li>
                                <li class="list-group-item d-flex justify-content-between">
                                    <span>Última Copia de Seguridad</span>
                                    <span>${new Date(this.config.lastBackup).toLocaleString()}</span>
                                </li>
                                <li class="list-group-item d-flex justify-content-between">
                                    <span>Estado del Servidor</span>
                                    <span class="badge bg-success">Activo</span>
                                </li>
                            </ul>
                        </div>
                        <div class="col-md-6">
                            <h6>Recursos del Sistema</h6>
                            <ul class="list-group">
                                <li class="list-group-item d-flex justify-content-between">
                                    <span>Uso de CPU</span>
                                    <span class="badge bg-info">${this.stats.cpuUsage}%</span>
                                </li>
                                <li class="list-group-item d-flex justify-content-between">
                                    <span>Uso de Memoria</span>
                                    <span class="badge bg-info">${this.stats.memoryUsage}%</span>
                                </li>
                                <li class="list-group-item d-flex justify-content-between">
                                    <span>Espacio en Disco</span>
                                    <span class="badge bg-info">${this.stats.diskUsage}%</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    async loadInitialData() {
        try {
            this.stats = await adminService.getSystemStats();
            this.config = await adminService.getSystemConfig();
        } catch (error) {
            console.error('[ADMIN-PANEL] Error al cargar datos iniciales:', error);
            throw error;
        }
    }

    initializeEventListeners(container) {
        const userManagementBtn = container.querySelector('#userManagementBtn');
        const systemConfigBtn = container.querySelector('#systemConfigBtn');
        const reportsBtn = container.querySelector('#reportsBtn');

        if (userManagementBtn && this.options.onUserManagement) {
            userManagementBtn.addEventListener('click', () => {
                this.options.onUserManagement();
            });
        }

        if (systemConfigBtn && this.options.onSystemConfig) {
            systemConfigBtn.addEventListener('click', () => {
                this.options.onSystemConfig();
            });
        }

        if (reportsBtn && this.options.onReports) {
            reportsBtn.addEventListener('click', () => {
                this.options.onReports();
            });
        }
    }
}

export default AdminPanel; 