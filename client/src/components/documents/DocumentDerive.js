/**
 * Componente DocumentDerive
 * Maneja la derivación de documentos entre áreas
 */

import { documentService } from '../../services/document.service.js';
import { sessionService } from '../../services/sessionService.js';
import { permissionUtils } from '../../utils/permissions.js';
import { Button } from '../base/Button.js';
import { Card } from '../base/Card.js';
import { Modal } from '../base/Modal.js';

export class DocumentDerive {
    constructor(options = {}) {
        this.options = {
            documentId: options.documentId || null,
            onDerive: options.onDerive || null,
            onCancel: options.onCancel || null,
            className: options.className || 'document-derive',
            ...options
        };

        this.document = null;
    }

    async render(container) {
        try {
            this.document = await this.loadDocument();

            const template = `
                <div class="${this.options.className}">
                    <div class="card">
                        <div class="card-header">
                            <h5 class="card-title mb-0">Derivar Documento</h5>
                        </div>
                        <div class="card-body">
                            <div class="mb-4">
                                <h6>Información del Documento</h6>
                                <div class="row">
                                    <div class="col-md-6">
                                        <p><strong>Número:</strong> ${this.document.numero}</p>
                                        <p><strong>Asunto:</strong> ${this.document.asunto}</p>
                                        <p><strong>Área Actual:</strong> ${this.document.areaActual}</p>
                                    </div>
                                    <div class="col-md-6">
                                        <p><strong>Fecha:</strong> ${new Date(this.document.fecha).toLocaleDateString()}</p>
                                        <p><strong>Remitente:</strong> ${this.document.remitente}</p>
                                        <p><strong>Estado:</strong> ${this.document.estado}</p>
                                    </div>
                                </div>
                            </div>
                            <form id="deriveForm">
                                ${this.renderDeriveFields()}
                                <div class="text-end mt-3">
                                    <button type="button" class="btn btn-secondary me-2" id="cancelBtn">
                                        Cancelar
                                    </button>
                                    <button type="submit" class="btn btn-primary" id="deriveBtn">
                                        Derivar Documento
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
            console.error('[DOCUMENT-DERIVE] Error al renderizar:', error);
            throw error;
        }
    }

    renderDeriveFields() {
        return `
            <div class="mb-3">
                <label class="form-label">Área Destino</label>
                <select class="form-select" id="areaDestino" required>
                    <option value="">Seleccione un área</option>
                    <!-- Se llenará dinámicamente -->
                </select>
            </div>
            <div class="mb-3">
                <label class="form-label">Usuario Destino</label>
                <select class="form-select" id="usuarioDestino" required>
                    <option value="">Seleccione un usuario</option>
                    <!-- Se llenará dinámicamente -->
                </select>
            </div>
            <div class="mb-3">
                <label class="form-label">Instrucciones</label>
                <textarea class="form-control" id="instrucciones" rows="3" 
                          placeholder="Ingrese las instrucciones para el área destino..."></textarea>
            </div>
            <div class="mb-3">
                <label class="form-label">Prioridad</label>
                <select class="form-select" id="prioridad" required>
                    <option value="NORMAL">Normal</option>
                    <option value="URGENTE">Urgente</option>
                    <option value="MUY_URGENTE">Muy Urgente</option>
                </select>
            </div>
            <div class="mb-3">
                <label class="form-label">Fecha Límite</label>
                <input type="date" class="form-control" id="fechaLimite" required>
            </div>
        `;
    }

    async loadDocument() {
        try {
            return await documentService.getDocumentById(this.options.documentId);
        } catch (error) {
            console.error('[DOCUMENT-DERIVE] Error al cargar documento:', error);
            throw error;
        }
    }

    initializeEventListeners(container) {
        const form = container.querySelector('#deriveForm');
        const cancelBtn = container.querySelector('#cancelBtn');
        const areaDestino = container.querySelector('#areaDestino');

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

        if (areaDestino) {
            areaDestino.addEventListener('change', () => this.handleAreaChange(areaDestino.value));
        }
    }

    async handleAreaChange(areaId) {
        try {
            const usuarios = await this.loadUsuariosArea(areaId);
            const usuarioDestino = document.getElementById('usuarioDestino');
            
            usuarioDestino.innerHTML = '<option value="">Seleccione un usuario</option>';
            usuarios.forEach(usuario => {
                const option = document.createElement('option');
                option.value = usuario.id;
                option.textContent = `${usuario.nombres} ${usuario.apellidos}`;
                usuarioDestino.appendChild(option);
            });
        } catch (error) {
            console.error('[DOCUMENT-DERIVE] Error al cargar usuarios:', error);
        }
    }

    async loadUsuariosArea(areaId) {
        try {
            const response = await fetch(`/api/areas/${areaId}/usuarios`);
            if (!response.ok) {
                throw new Error('Error al cargar usuarios del área');
            }
            return await response.json();
        } catch (error) {
            console.error('[DOCUMENT-DERIVE] Error al cargar usuarios del área:', error);
            return [];
        }
    }

    async handleSubmit(e) {
        e.preventDefault();

        const derivacionData = {
            areaDestino: document.getElementById('areaDestino').value,
            usuarioDestino: document.getElementById('usuarioDestino').value,
            instrucciones: document.getElementById('instrucciones').value,
            prioridad: document.getElementById('prioridad').value,
            fechaLimite: document.getElementById('fechaLimite').value
        };

        try {
            const derivacion = await documentService.deriveDocument(
                this.options.documentId,
                derivacionData
            );

            if (this.options.onDerive) {
                this.options.onDerive(derivacion);
            }
        } catch (error) {
            console.error('[DOCUMENT-DERIVE] Error al derivar documento:', error);
            // Mostrar mensaje de error
        }
    }
}

export default DocumentDerive; 