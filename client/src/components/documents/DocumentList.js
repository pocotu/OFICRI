/**
 * Componente DocumentList
 * Maneja la visualización y gestión de la lista de documentos
 */

import { documentService } from '../../services/document.service.js';
import { sessionService } from '../../services/sessionService.js';
import { permissionUtils } from '../../utils/permissions.js';
import { Button } from '../base/Button.js';
import { Card } from '../base/Card.js';
import { Modal } from '../base/Modal.js';

export class DocumentList {
    constructor(options = {}) {
        this.options = {
            onDocumentClick: options.onDocumentClick || null,
            onDocumentCreate: options.onDocumentCreate || null,
            onDocumentEdit: options.onDocumentEdit || null,
            onDocumentDelete: options.onDocumentDelete || null,
            onDocumentDerive: options.onDocumentDerive || null,
            className: options.className || 'document-list',
            ...options
        };

        this.documents = [];
        this.filters = {
            estado: '',
            area: '',
            fechaDesde: '',
            fechaHasta: '',
            busqueda: ''
        };
    }

    async render(container) {
        try {
            // Obtener documentos
            this.documents = await this.loadDocuments();

            const template = `
                <div class="${this.options.className}">
                    <div class="card">
                        <div class="card-header d-flex justify-content-between align-items-center">
                            <h5 class="mb-0">Documentos</h5>
                            <div>
                                ${this.renderActionButtons()}
                            </div>
                        </div>
                        <div class="card-body">
                            ${this.renderFilters()}
                            ${this.renderDocumentsTable()}
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
            console.error('[DOCUMENT-LIST] Error al renderizar:', error);
            throw error;
        }
    }

    renderActionButtons() {
        const user = sessionService.obtenerUsuarioActual();
        const canCreate = permissionUtils.hasPermission(user, 'DOCUMENTOS_CREAR');
        const canExport = permissionUtils.hasPermission(user, 'DOCUMENTOS_EXPORTAR');

        return `
            ${canCreate ? `
                <button class="btn btn-primary me-2" id="createDocumentBtn">
                    <i class="fas fa-plus me-2"></i>Nuevo Documento
                </button>
            ` : ''}
            ${canExport ? `
                <button class="btn btn-secondary" id="exportDocumentsBtn">
                    <i class="fas fa-file-export me-2"></i>Exportar
                </button>
            ` : ''}
        `;
    }

    renderFilters() {
        return `
            <div class="row mb-3">
                <div class="col-md-3">
                    <label class="form-label">Estado</label>
                    <select class="form-select" id="estadoFilter">
                        <option value="">Todos</option>
                        <option value="PENDIENTE">Pendiente</option>
                        <option value="EN_TRAMITE">En Trámite</option>
                        <option value="ARCHIVADO">Archivado</option>
                    </select>
                </div>
                <div class="col-md-3">
                    <label class="form-label">Área</label>
                    <select class="form-select" id="areaFilter">
                        <option value="">Todas</option>
                        <!-- Se llenará dinámicamente -->
                    </select>
                </div>
                <div class="col-md-3">
                    <label class="form-label">Fecha Desde</label>
                    <input type="date" class="form-control" id="fechaDesdeFilter">
                </div>
                <div class="col-md-3">
                    <label class="form-label">Fecha Hasta</label>
                    <input type="date" class="form-control" id="fechaHastaFilter">
                </div>
            </div>
            <div class="row mb-3">
                <div class="col-md-12">
                    <div class="input-group">
                        <input type="text" class="form-control" id="searchFilter" 
                               placeholder="Buscar por número, asunto o remitente...">
                        <button class="btn btn-outline-secondary" type="button" id="searchBtn">
                            <i class="fas fa-search"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    renderDocumentsTable() {
        if (this.documents.length === 0) {
            return `
                <div class="text-center py-5">
                    <i class="fas fa-file-alt fa-3x text-muted mb-3"></i>
                    <p class="text-muted">No se encontraron documentos</p>
                </div>
            `;
        }

        return `
            <div class="table-responsive">
                <table class="table table-hover">
                    <thead>
                        <tr>
                            <th>Número</th>
                            <th>Fecha</th>
                            <th>Asunto</th>
                            <th>Remitente</th>
                            <th>Estado</th>
                            <th>Área</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${this.documents.map(doc => this.renderDocumentRow(doc)).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    renderDocumentRow(document) {
        const user = sessionService.obtenerUsuarioActual();
        const canEdit = permissionUtils.hasPermission(user, 'DOCUMENTOS_EDITAR');
        const canDelete = permissionUtils.hasPermission(user, 'DOCUMENTOS_ELIMINAR');
        const canDerive = permissionUtils.hasPermission(user, 'DOCUMENTOS_DERIVAR');

        return `
            <tr>
                <td>${document.numero}</td>
                <td>${new Date(document.fecha).toLocaleDateString()}</td>
                <td>${document.asunto}</td>
                <td>${document.remitente}</td>
                <td>
                    <span class="badge bg-${this.getStatusBadgeColor(document.estado)}">
                        ${document.estado}
                    </span>
                </td>
                <td>${document.areaActual}</td>
                <td>
                    <div class="btn-group">
                        <button class="btn btn-sm btn-outline-primary" 
                                data-document-id="${document.id}" 
                                data-action="view">
                            <i class="fas fa-eye"></i>
                        </button>
                        ${canEdit ? `
                            <button class="btn btn-sm btn-outline-secondary" 
                                    data-document-id="${document.id}" 
                                    data-action="edit">
                                <i class="fas fa-edit"></i>
                            </button>
                        ` : ''}
                        ${canDerive ? `
                            <button class="btn btn-sm btn-outline-info" 
                                    data-document-id="${document.id}" 
                                    data-action="derive">
                                <i class="fas fa-exchange-alt"></i>
                            </button>
                        ` : ''}
                        ${canDelete ? `
                            <button class="btn btn-sm btn-outline-danger" 
                                    data-document-id="${document.id}" 
                                    data-action="delete">
                                <i class="fas fa-trash"></i>
                            </button>
                        ` : ''}
                    </div>
                </td>
            </tr>
        `;
    }

    getStatusBadgeColor(status) {
        const colors = {
            'PENDIENTE': 'warning',
            'EN_TRAMITE': 'primary',
            'ARCHIVADO': 'success'
        };
        return colors[status] || 'secondary';
    }

    async loadDocuments() {
        try {
            return await documentService.getAllDocuments(this.filters);
        } catch (error) {
            console.error('[DOCUMENT-LIST] Error al cargar documentos:', error);
            return [];
        }
    }

    initializeEventListeners(container) {
        // Botones de acción principales
        const createBtn = container.querySelector('#createDocumentBtn');
        const exportBtn = container.querySelector('#exportDocumentsBtn');

        if (createBtn) {
            createBtn.addEventListener('click', () => {
                if (this.options.onDocumentCreate) {
                    this.options.onDocumentCreate();
                }
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

        const searchBtn = container.querySelector('#searchBtn');
        if (searchBtn) {
            searchBtn.addEventListener('click', () => this.handleFilterChange());
        }

        // Acciones de documentos
        const actionButtons = container.querySelectorAll('[data-document-id]');
        actionButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const documentId = e.currentTarget.dataset.documentId;
                const action = e.currentTarget.dataset.action;
                this.handleDocumentAction(documentId, action);
            });
        });
    }

    handleFilterChange() {
        this.filters = {
            estado: document.getElementById('estadoFilter').value,
            area: document.getElementById('areaFilter').value,
            fechaDesde: document.getElementById('fechaDesdeFilter').value,
            fechaHasta: document.getElementById('fechaHastaFilter').value,
            busqueda: document.getElementById('searchFilter').value
        };

        this.render(document.querySelector(`.${this.options.className}`));
    }

    async handleDocumentAction(documentId, action) {
        switch (action) {
            case 'view':
                if (this.options.onDocumentClick) {
                    this.options.onDocumentClick(documentId);
                }
                break;
            case 'edit':
                if (this.options.onDocumentEdit) {
                    this.options.onDocumentEdit(documentId);
                }
                break;
            case 'delete':
                await this.handleDelete(documentId);
                break;
            case 'derive':
                if (this.options.onDocumentDerive) {
                    this.options.onDocumentDerive(documentId);
                }
                break;
        }
    }

    async handleDelete(documentId) {
        const modal = new Modal({
            title: 'Eliminar Documento',
            content: '¿Está seguro de que desea eliminar este documento?',
            onConfirm: async () => {
                try {
                    await documentService.deleteDocument(documentId);
                    if (this.options.onDocumentDelete) {
                        this.options.onDocumentDelete(documentId);
                    }
                    this.render(document.querySelector(`.${this.options.className}`));
                } catch (error) {
                    console.error('[DOCUMENT-LIST] Error al eliminar documento:', error);
                }
            }
        });

        modal.show();
    }

    async handleExport() {
        try {
            const blob = await documentService.exportDocuments(this.filters);
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `documentos_${new Date().toISOString().split('T')[0]}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error('[DOCUMENT-LIST] Error al exportar documentos:', error);
        }
    }
}

export default DocumentList; 