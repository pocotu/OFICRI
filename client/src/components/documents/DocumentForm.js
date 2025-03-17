/**
 * Componente DocumentForm
 * Maneja la creación y edición de documentos
 */

import { documentService } from '../../services/document.service.js';
import { sessionService } from '../../services/sessionService.js';
import { permissionUtils } from '../../utils/permissions.js';
import { Button } from '../base/Button.js';
import { Card } from '../base/Card.js';
import { Modal } from '../base/Modal.js';

export class DocumentForm {
    constructor(options = {}) {
        this.options = {
            documentId: options.documentId || null,
            onSave: options.onSave || null,
            onCancel: options.onCancel || null,
            className: options.className || 'document-form',
            ...options
        };

        this.document = null;
        this.isEditing = !!options.documentId;
    }

    async render(container) {
        try {
            if (this.isEditing) {
                this.document = await this.loadDocument();
            }

            const template = `
                <div class="${this.options.className}">
                    <div class="card">
                        <div class="card-header">
                            <h5 class="card-title mb-0">
                                ${this.isEditing ? 'Editar Documento' : 'Nuevo Documento'}
                            </h5>
                        </div>
                        <div class="card-body">
                            <form id="documentForm">
                                ${this.renderFormFields()}
                                <div class="text-end mt-3">
                                    <button type="button" class="btn btn-secondary me-2" id="cancelBtn">
                                        Cancelar
                                    </button>
                                    <button type="submit" class="btn btn-primary" id="saveBtn">
                                        ${this.isEditing ? 'Guardar Cambios' : 'Crear Documento'}
                                    </button>
                                </div>
                            </form>
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
            console.error('[DOCUMENT-FORM] Error al renderizar:', error);
            throw error;
        }
    }

    renderFormFields() {
        return `
            <div class="row mb-3">
                <div class="col-md-6">
                    <label class="form-label">Tipo de Documento</label>
                    <select class="form-select" id="tipoDocumento" required>
                        <option value="">Seleccione un tipo</option>
                        <option value="OFICIO">Oficio</option>
                        <option value="MEMORANDUM">Memorándum</option>
                        <option value="RESOLUCION">Resolución</option>
                        <option value="INFORME">Informe</option>
                    </select>
                </div>
                <div class="col-md-6">
                    <label class="form-label">Número</label>
                    <input type="text" class="form-control" id="numero" 
                           value="${this.document?.numero || ''}" 
                           ${this.isEditing ? 'readonly' : 'required'}>
                </div>
            </div>
            <div class="row mb-3">
                <div class="col-md-6">
                    <label class="form-label">Fecha</label>
                    <input type="date" class="form-control" id="fecha" 
                           value="${this.document?.fecha ? new Date(this.document.fecha).toISOString().split('T')[0] : ''}" 
                           required>
                </div>
                <div class="col-md-6">
                    <label class="form-label">Área Destino</label>
                    <select class="form-select" id="areaDestino" required>
                        <option value="">Seleccione un área</option>
                        <!-- Se llenará dinámicamente -->
                    </select>
                </div>
            </div>
            <div class="mb-3">
                <label class="form-label">Asunto</label>
                <input type="text" class="form-control" id="asunto" 
                       value="${this.document?.asunto || ''}" required>
            </div>
            <div class="mb-3">
                <label class="form-label">Remitente</label>
                <input type="text" class="form-control" id="remitente" 
                       value="${this.document?.remitente || ''}" required>
            </div>
            <div class="mb-3">
                <label class="form-label">Contenido</label>
                <textarea class="form-control" id="contenido" rows="5" 
                          required>${this.document?.contenido || ''}</textarea>
            </div>
            <div class="mb-3">
                <label class="form-label">Archivos Adjuntos</label>
                <input type="file" class="form-control" id="archivos" multiple>
                ${this.renderAttachedFiles()}
            </div>
        `;
    }

    renderAttachedFiles() {
        if (!this.document?.archivos || this.document.archivos.length === 0) {
            return '';
        }

        return `
            <div class="mt-2">
                <h6>Archivos adjuntos actuales:</h6>
                <ul class="list-group">
                    ${this.document.archivos.map(archivo => `
                        <li class="list-group-item d-flex justify-content-between align-items-center">
                            <span>${archivo.nombre}</span>
                            <button type="button" class="btn btn-sm btn-outline-danger" 
                                    data-archivo-id="${archivo.id}">
                                <i class="fas fa-trash"></i>
                            </button>
                        </li>
                    `).join('')}
                </ul>
            </div>
        `;
    }

    async loadDocument() {
        try {
            return await documentService.getDocumentById(this.options.documentId);
        } catch (error) {
            console.error('[DOCUMENT-FORM] Error al cargar documento:', error);
            throw error;
        }
    }

    initializeEventListeners(container) {
        const form = container.querySelector('#documentForm');
        const cancelBtn = container.querySelector('#cancelBtn');

        if (form) {
            form.addEventListener('submit', (e) => this.handleSubmit(e));
        }

        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                if (this.options.onCancel) {
                    this.options.onCancel();
                }
            });
        }

        // Manejo de eliminación de archivos adjuntos
        const deleteButtons = container.querySelectorAll('[data-archivo-id]');
        deleteButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const archivoId = e.currentTarget.dataset.archivoId;
                this.handleDeleteAttachment(archivoId);
            });
        });
    }

    async handleSubmit(e) {
        e.preventDefault();

        const formData = new FormData();
        formData.append('tipoDocumento', document.getElementById('tipoDocumento').value);
        formData.append('numero', document.getElementById('numero').value);
        formData.append('fecha', document.getElementById('fecha').value);
        formData.append('areaDestino', document.getElementById('areaDestino').value);
        formData.append('asunto', document.getElementById('asunto').value);
        formData.append('remitente', document.getElementById('remitente').value);
        formData.append('contenido', document.getElementById('contenido').value);

        const archivos = document.getElementById('archivos').files;
        for (let i = 0; i < archivos.length; i++) {
            formData.append('archivos', archivos[i]);
        }

        try {
            let document;
            if (this.isEditing) {
                document = await documentService.updateDocument(this.options.documentId, formData);
            } else {
                document = await documentService.createDocument(formData);
            }

            if (this.options.onSave) {
                this.options.onSave(document);
            }
        } catch (error) {
            console.error('[DOCUMENT-FORM] Error al guardar documento:', error);
            // Mostrar mensaje de error
        }
    }

    async handleDeleteAttachment(archivoId) {
        const modal = new Modal({
            title: 'Eliminar Archivo',
            content: '¿Está seguro de que desea eliminar este archivo?',
            onConfirm: async () => {
                try {
                    await documentService.deleteAttachment(this.options.documentId, archivoId);
                    this.document.archivos = this.document.archivos.filter(a => a.id !== archivoId);
                    this.render(document.querySelector(`.${this.options.className}`));
                } catch (error) {
                    console.error('[DOCUMENT-FORM] Error al eliminar archivo:', error);
                }
            }
        });

        modal.show();
    }
}

export default DocumentForm; 