/**
 * Componente ReportManager
 * Maneja la visualización y generación de reportes del sistema
 */

import { adminService } from '../../services/admin.service.js';
import { sessionService } from '../../services/sessionService.js';
import { permissionUtils } from '../../utils/permissions.js';
import { Button } from '../base/Button.js';
import { Card } from '../base/Card.js';
import { Modal } from '../base/Modal.js';

export class ReportManager {
    constructor(options = {}) {
        this.options = {
            onReportGenerate: options.onReportGenerate || null,
            onReportExport: options.onReportExport || null,
            className: options.className || 'report-manager',
            ...options
        };

        this.reports = [];
        this.filters = {
            startDate: null,
            endDate: null,
            area: null,
            type: null,
            status: null
        };
    }

    async render(container) {
        try {
            // Cargar datos iniciales
            await this.loadInitialData();

            const template = `
                <div class="${this.options.className}">
                    <div class="row mb-4">
                        <div class="col-12">
                            <h2 class="mb-0">Gestión de Reportes</h2>
                        </div>
                    </div>
                    
                    ${this.renderFilters()}
                    ${this.renderReportsList()}
                </div>
            `;

            if (container) {
                container.innerHTML = template;
                this.initializeEventListeners(container);
            }

            return template;
        } catch (error) {
            console.error('[REPORT-MANAGER] Error al renderizar:', error);
            throw error;
        }
    }

    renderFilters() {
        return `
            <div class="card mb-4">
                <div class="card-header">
                    <h5 class="card-title mb-0">Filtros de Búsqueda</h5>
                </div>
                <div class="card-body">
                    <form id="reportFiltersForm">
                        <div class="row mb-3">
                            <div class="col-md-3">
                                <label class="form-label">Fecha Inicio</label>
                                <input type="date" class="form-control" id="startDate" 
                                       value="${this.filters.startDate || ''}">
                            </div>
                            <div class="col-md-3">
                                <label class="form-label">Fecha Fin</label>
                                <input type="date" class="form-control" id="endDate" 
                                       value="${this.filters.endDate || ''}">
                            </div>
                            <div class="col-md-3">
                                <label class="form-label">Área</label>
                                <select class="form-select" id="area">
                                    <option value="">Todas</option>
                                    ${this.renderAreaOptions()}
                                </select>
                            </div>
                            <div class="col-md-3">
                                <label class="form-label">Tipo de Reporte</label>
                                <select class="form-select" id="type">
                                    <option value="">Todos</option>
                                    <option value="documentos" ${this.filters.type === 'documentos' ? 'selected' : ''}>
                                        Documentos
                                    </option>
                                    <option value="usuarios" ${this.filters.type === 'usuarios' ? 'selected' : ''}>
                                        Usuarios
                                    </option>
                                    <option value="actividad" ${this.filters.type === 'actividad' ? 'selected' : ''}>
                                        Actividad
                                    </option>
                                </select>
                            </div>
                        </div>
                        <div class="row">
                            <div class="col-12">
                                <button type="submit" class="btn btn-primary">
                                    <i class="fas fa-search me-2"></i>Buscar
                                </button>
                                <button type="button" class="btn btn-secondary" id="clearFilters">
                                    <i class="fas fa-times me-2"></i>Limpiar Filtros
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        `;
    }

    renderAreaOptions() {
        // Aquí se cargarían las áreas desde el servicio
        return `
            <option value="1">Área 1</option>
            <option value="2">Área 2</option>
            <option value="3">Área 3</option>
        `;
    }

    renderReportsList() {
        return `
            <div class="card">
                <div class="card-header d-flex justify-content-between align-items-center">
                    <h5 class="card-title mb-0">Reportes Disponibles</h5>
                    <button class="btn btn-primary" id="generateReportBtn">
                        <i class="fas fa-plus me-2"></i>Generar Nuevo Reporte
                    </button>
                </div>
                <div class="card-body">
                    <div class="table-responsive">
                        <table class="table">
                            <thead>
                                <tr>
                                    <th>Nombre</th>
                                    <th>Tipo</th>
                                    <th>Fecha Generación</th>
                                    <th>Estado</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${this.reports.map(report => this.renderReportRow(report)).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
    }

    renderReportRow(report) {
        return `
            <tr>
                <td>${report.name}</td>
                <td>${this.getReportTypeLabel(report.type)}</td>
                <td>${new Date(report.generatedAt).toLocaleString()}</td>
                <td>
                    <span class="badge bg-${this.getStatusBadgeColor(report.status)}">
                        ${this.getStatusLabel(report.status)}
                    </span>
                </td>
                <td>
                    <div class="btn-group">
                        <button class="btn btn-sm btn-outline-primary" 
                                data-report-id="${report.id}" 
                                data-action="view">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-success" 
                                data-report-id="${report.id}" 
                                data-action="export">
                            <i class="fas fa-download"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger" 
                                data-report-id="${report.id}" 
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
            // Aquí se cargarían los reportes desde el servicio
            this.reports = [
                {
                    id: 1,
                    name: 'Reporte de Documentos',
                    type: 'documentos',
                    generatedAt: new Date(),
                    status: 'completed'
                },
                {
                    id: 2,
                    name: 'Reporte de Usuarios',
                    type: 'usuarios',
                    generatedAt: new Date(),
                    status: 'processing'
                }
            ];
        } catch (error) {
            console.error('[REPORT-MANAGER] Error al cargar datos iniciales:', error);
            throw error;
        }
    }

    initializeEventListeners(container) {
        // Formulario de filtros
        const filtersForm = container.querySelector('#reportFiltersForm');
        if (filtersForm) {
            filtersForm.addEventListener('submit', (e) => this.handleFiltersSubmit(e));
        }

        // Botón limpiar filtros
        const clearFiltersBtn = container.querySelector('#clearFilters');
        if (clearFiltersBtn) {
            clearFiltersBtn.addEventListener('click', () => this.handleClearFilters());
        }

        // Botón generar reporte
        const generateReportBtn = container.querySelector('#generateReportBtn');
        if (generateReportBtn && this.options.onReportGenerate) {
            generateReportBtn.addEventListener('click', () => {
                this.options.onReportGenerate();
            });
        }

        // Acciones de reportes
        const reportButtons = container.querySelectorAll('[data-report-id]');
        reportButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const reportId = e.currentTarget.dataset.reportId;
                const action = e.currentTarget.dataset.action;
                this.handleReportAction(reportId, action);
            });
        });
    }

    async handleFiltersSubmit(e) {
        e.preventDefault();

        this.filters = {
            startDate: document.getElementById('startDate').value,
            endDate: document.getElementById('endDate').value,
            area: document.getElementById('area').value,
            type: document.getElementById('type').value
        };

        try {
            // Aquí se aplicarían los filtros y se recargarían los reportes
            console.log('[REPORT-MANAGER] Aplicando filtros:', this.filters);
        } catch (error) {
            console.error('[REPORT-MANAGER] Error al aplicar filtros:', error);
            this.showError('Error al aplicar los filtros');
        }
    }

    handleClearFilters() {
        this.filters = {
            startDate: null,
            endDate: null,
            area: null,
            type: null
        };

        // Recargar la vista
        this.render(document.querySelector(`.${this.options.className}`));
    }

    handleReportAction(reportId, action) {
        switch (action) {
            case 'view':
                this.handleReportView(reportId);
                break;
            case 'export':
                this.handleReportExport(reportId);
                break;
            case 'delete':
                this.handleReportDelete(reportId);
                break;
        }
    }

    async handleReportView(reportId) {
        try {
            // Implementar visualización del reporte
            console.log('[REPORT-MANAGER] Visualizando reporte:', reportId);
        } catch (error) {
            console.error('[REPORT-MANAGER] Error al visualizar reporte:', error);
            this.showError('Error al visualizar el reporte');
        }
    }

    async handleReportExport(reportId) {
        try {
            if (this.options.onReportExport) {
                this.options.onReportExport(reportId);
            }
            this.showSuccess('Reporte exportado correctamente');
        } catch (error) {
            console.error('[REPORT-MANAGER] Error al exportar reporte:', error);
            this.showError('Error al exportar el reporte');
        }
    }

    async handleReportDelete(reportId) {
        const modal = new Modal({
            title: 'Eliminar Reporte',
            content: '¿Está seguro de que desea eliminar este reporte?',
            onConfirm: async () => {
                try {
                    // Implementar eliminación del reporte
                    console.log('[REPORT-MANAGER] Eliminando reporte:', reportId);
                    this.showSuccess('Reporte eliminado correctamente');
                    this.render(document.querySelector(`.${this.options.className}`));
                } catch (error) {
                    console.error('[REPORT-MANAGER] Error al eliminar reporte:', error);
                    this.showError('Error al eliminar el reporte');
                }
            }
        });

        modal.show();
    }

    getReportTypeLabel(type) {
        const types = {
            documentos: 'Documentos',
            usuarios: 'Usuarios',
            actividad: 'Actividad'
        };
        return types[type] || type;
    }

    getStatusLabel(status) {
        const statuses = {
            completed: 'Completado',
            processing: 'En Proceso',
            failed: 'Fallido'
        };
        return statuses[status] || status;
    }

    getStatusBadgeColor(status) {
        const colors = {
            completed: 'success',
            processing: 'warning',
            failed: 'danger'
        };
        return colors[status] || 'secondary';
    }

    showSuccess(message) {
        // Implementar notificación de éxito
        console.log('[REPORT-MANAGER] Éxito:', message);
    }

    showError(message) {
        // Implementar notificación de error
        console.error('[REPORT-MANAGER] Error:', message);
    }
}

export default ReportManager; 