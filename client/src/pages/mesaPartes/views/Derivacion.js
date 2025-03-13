/**
 * Vista Derivacion para Mesa de Partes
 * Permite derivar expedientes a otras áreas
 */

import * as errorHandler from '../../../utils/errorHandler.js';

export class Derivacion {
    constructor() {
        console.log('[DERIVACION] Iniciando constructor');
        
        // Inicializar propiedades
        this.documents = [];
        this.areas = [];
        this.selectedDocument = null;
        this.formData = {
            idDocumento: '',
            idAreaDestino: '',
            observaciones: '',
            urgente: false
        };
        
        console.log('[DERIVACION] Constructor finalizado');
    }

    /**
     * Renderiza la vista en el contenedor
     * @param {HTMLElement} container - Elemento contenedor
     */
    async render(container) {
        console.log('[DERIVACION] Iniciando renderizado');
        
        // Mostrar indicador de carga
        container.innerHTML = `
            <div class="d-flex justify-content-center my-5">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Cargando...</span>
                </div>
            </div>
        `;
        
        try {
            // Cargar datos necesarios
            await Promise.all([
                this.fetchDocuments(),
                this.fetchAreas()
            ]);
            
            // Construir la interfaz
            const html = `
                <div class="derivacion-page">
                    <div class="page-header">
                        <h2>Transferencia / Derivación</h2>
                        <p>Derive expedientes a las diferentes áreas especializadas</p>
                    </div>
                    
                    <div class="row">
                        <!-- Lista de documentos a derivar -->
                        <div class="col-md-5">
                            <div class="card mb-4">
                                <div class="card-header bg-primary text-white">
                                    <h5 class="card-title mb-0">Documentos Pendientes</h5>
                                </div>
                                <div class="card-body">
                                    <div class="input-group mb-3">
                                        <input type="text" class="form-control" id="searchDocumento" 
                                            placeholder="Buscar expediente...">
                                        <button class="btn btn-outline-secondary" type="button" id="searchBtn">
                                            <i class="fas fa-search"></i>
                                        </button>
                                    </div>
                                    
                                    <div class="list-group" id="documentosList">
                                        ${this.renderDocumentsList()}
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Formulario de derivación -->
                        <div class="col-md-7">
                            <div class="card">
                                <div class="card-header bg-primary text-white">
                                    <h5 class="card-title mb-0">Formulario de Derivación</h5>
                                </div>
                                <div class="card-body">
                                    ${this.renderDerivationForm()}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            container.innerHTML = html;
            
            // Configurar eventos
            this.setupEventListeners(container);
            
            // Verificar si hay un ID de documento en la URL
            this.checkUrlParameters(container);
            
            console.log('[DERIVACION] Renderizado completado');
        } catch (error) {
            console.error('[DERIVACION] Error en renderizado:', error);
            errorHandler.showErrorMessage('Error al cargar', 'No se pudieron cargar los datos necesarios para la derivación. Por favor, intente nuevamente más tarde.');
            
            container.innerHTML = `
                <div class="alert alert-danger" role="alert">
                    <h4 class="alert-heading">Error al cargar datos</h4>
                    <p>No se pudieron cargar los datos necesarios para la derivación. Por favor, intente nuevamente más tarde.</p>
                    <button id="retryBtn" class="btn btn-danger">Reintentar</button>
                </div>
            `;
            
            // Configurar botón de reintento
            const retryBtn = container.querySelector('#retryBtn');
            if (retryBtn) {
                retryBtn.addEventListener('click', () => this.render(container));
            }
        }
    }

    /**
     * Renderiza la lista de documentos pendientes de derivación
     * @returns {string} HTML de la lista de documentos
     */
    renderDocumentsList() {
        if (this.documents.length === 0) {
            return `
                <div class="text-center py-4">
                    <i class="fas fa-inbox fa-3x text-muted mb-3"></i>
                    <p>No hay documentos pendientes de derivación</p>
                </div>
            `;
        }
        
        return this.documents.map(doc => `
            <a href="#" class="list-group-item list-group-item-action documento-item ${this.selectedDocument && this.selectedDocument.id === doc.id ? 'active' : ''}" 
                data-id="${doc.id}">
                <div class="d-flex w-100 justify-content-between">
                    <h6 class="mb-1">${doc.numeroExpediente}</h6>
                    <small>${doc.fechaRecepcion}</small>
                </div>
                <p class="mb-1">${doc.asunto}</p>
                <small>
                    <i class="fas fa-user-edit"></i> ${doc.remitente}
                    ${doc.prioridad === 'urgente' ? '<span class="badge bg-danger ms-2">Urgente</span>' : ''}
                    ${doc.prioridad === 'alta' ? '<span class="badge bg-warning ms-2">Alta</span>' : ''}
                </small>
            </a>
        `).join('');
    }

    /**
     * Renderiza el formulario de derivación
     * @returns {string} HTML del formulario
     */
    renderDerivationForm() {
        if (!this.selectedDocument) {
            return `
                <div class="text-center py-4">
                    <i class="fas fa-arrow-left fa-3x text-muted mb-3"></i>
                    <p>Seleccione un documento de la lista para derivarlo</p>
                </div>
            `;
        }
        
        return `
            <form id="derivacionForm">
                <div class="mb-3">
                    <label class="form-label fw-bold">Documento seleccionado</label>
                    <div class="card bg-light">
                        <div class="card-body">
                            <h6 class="card-title">${this.selectedDocument.numeroExpediente}</h6>
                            <h6 class="card-subtitle mb-2 text-muted">${this.selectedDocument.remitente}</h6>
                            <p class="card-text">${this.selectedDocument.asunto}</p>
                            <div class="d-flex justify-content-between">
                                <small class="text-muted">Fecha: ${this.selectedDocument.fechaRecepcion}</small>
                                <small class="text-muted">Folios: ${this.selectedDocument.folios || 'N/A'}</small>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="mb-3">
                    <label for="areaDestino" class="form-label">Área de Destino *</label>
                    <select class="form-select" id="areaDestino" required>
                        <option value="">Seleccione un área</option>
                        ${this.renderAreaOptions()}
                    </select>
                </div>
                
                <div class="mb-3">
                    <label for="observaciones" class="form-label">Observaciones</label>
                    <textarea class="form-control" id="observaciones" rows="3"
                        placeholder="Instrucciones o información adicional para el área de destino">${this.formData.observaciones}</textarea>
                </div>
                
                <div class="mb-3 form-check">
                    <input type="checkbox" class="form-check-input" id="urgente" ${this.formData.urgente ? 'checked' : ''}>
                    <label class="form-check-label" for="urgente">Marcar como urgente</label>
                </div>
                
                <div class="d-flex justify-content-end gap-2">
                    <button type="button" class="btn btn-secondary" id="cancelarBtn">Cancelar</button>
                    <button type="submit" class="btn btn-primary" id="derivarBtn">
                        <i class="fas fa-exchange-alt"></i> Derivar Documento
                    </button>
                </div>
            </form>
        `;
    }

    /**
     * Renderiza las opciones de áreas de destino
     * @returns {string} HTML de las opciones
     */
    renderAreaOptions() {
        if (this.areas.length === 0) {
            return '<option value="" disabled>No hay áreas disponibles</option>';
        }
        
        return this.areas.map(area => `
            <option value="${area.id}" ${this.formData.idAreaDestino === area.id ? 'selected' : ''}>
                ${area.nombre}
            </option>
        `).join('');
    }

    /**
     * Configura los escuchadores de eventos
     * @param {HTMLElement} container - Elemento contenedor
     */
    setupEventListeners(container) {
        // Búsqueda de documentos
        const searchBtn = container.querySelector('#searchBtn');
        const searchInput = container.querySelector('#searchDocumento');
        
        if (searchBtn && searchInput) {
            searchBtn.addEventListener('click', () => {
                this.searchDocuments(searchInput.value, container);
            });
            
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.searchDocuments(searchInput.value, container);
                }
            });
        }
        
        // Selección de documento
        const documentItems = container.querySelectorAll('.documento-item');
        documentItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const documentId = parseInt(item.getAttribute('data-id'));
                this.selectDocument(documentId, container);
            });
        });
        
        // Formulario de derivación
        const form = container.querySelector('#derivacionForm');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleSubmit(container);
            });
            
            // Campos del formulario
            const areaSelect = container.querySelector('#areaDestino');
            const observacionesInput = container.querySelector('#observaciones');
            const urgenteCheckbox = container.querySelector('#urgente');
            
            if (areaSelect) {
                areaSelect.addEventListener('change', () => {
                    this.formData.idAreaDestino = areaSelect.value;
                });
            }
            
            if (observacionesInput) {
                observacionesInput.addEventListener('input', () => {
                    this.formData.observaciones = observacionesInput.value;
                });
            }
            
            if (urgenteCheckbox) {
                urgenteCheckbox.addEventListener('change', () => {
                    this.formData.urgente = urgenteCheckbox.checked;
                });
            }
        }
        
        // Botón cancelar
        const cancelarBtn = container.querySelector('#cancelarBtn');
        if (cancelarBtn) {
            cancelarBtn.addEventListener('click', () => {
                this.handleCancel();
            });
        }
    }

    /**
     * Verifica si hay parámetros en la URL
     * @param {HTMLElement} container - Elemento contenedor
     */
    checkUrlParameters(container) {
        const hash = window.location.hash;
        const match = hash.match(/[?&]id=(\d+)/);
        
        if (match && match[1]) {
            const documentId = parseInt(match[1]);
            this.selectDocument(documentId, container);
        }
    }

    /**
     * Selecciona un documento para derivar
     * @param {number} documentId - ID del documento
     * @param {HTMLElement} container - Elemento contenedor
     */
    selectDocument(documentId, container) {
        const document = this.documents.find(doc => doc.id === documentId);
        
        if (document) {
            this.selectedDocument = document;
            this.formData.idDocumento = documentId;
            
            // Actualizar UI
            const formContainer = container.querySelector('.col-md-7 .card-body');
            if (formContainer) {
                formContainer.innerHTML = this.renderDerivationForm();
                this.setupEventListeners(container);
            }
            
            // Actualizar selección en la lista
            const items = container.querySelectorAll('.documento-item');
            items.forEach(item => {
                const itemId = parseInt(item.getAttribute('data-id'));
                if (itemId === documentId) {
                    item.classList.add('active');
                } else {
                    item.classList.remove('active');
                }
            });
        }
    }

    /**
     * Busca documentos por término
     * @param {string} term - Término de búsqueda
     * @param {HTMLElement} container - Elemento contenedor
     */
    searchDocuments(term, container) {
        // En una app real, esto haría una petición a la API con el término de búsqueda
        // Aquí simulamos un filtrado local
        if (term) {
            const filteredDocs = this.documents.filter(doc => 
                doc.numeroExpediente.includes(term) || 
                doc.asunto.toLowerCase().includes(term.toLowerCase()) ||
                doc.remitente.toLowerCase().includes(term.toLowerCase())
            );
            
            // Actualizar la lista
            const listContainer = container.querySelector('#documentosList');
            if (listContainer) {
                this.documents = filteredDocs;
                listContainer.innerHTML = this.renderDocumentsList();
                this.setupEventListeners(container);
            }
        } else {
            // Si el término está vacío, recargar todos los documentos
            this.fetchDocuments().then(() => {
                const listContainer = container.querySelector('#documentosList');
                if (listContainer) {
                    listContainer.innerHTML = this.renderDocumentsList();
                    this.setupEventListeners(container);
                }
            });
        }
    }

    /**
     * Maneja el envío del formulario
     * @param {HTMLElement} container - Elemento contenedor
     */
    async handleSubmit(container) {
        try {
            // Validar formulario
            const form = container.querySelector('#derivacionForm');
            if (!form.checkValidity()) {
                form.reportValidity();
                return;
            }
            
            // Actualizar datos del formulario
            const areaSelect = container.querySelector('#areaDestino');
            const observacionesInput = container.querySelector('#observaciones');
            const urgenteCheckbox = container.querySelector('#urgente');
            
            this.formData.idAreaDestino = areaSelect ? areaSelect.value : '';
            this.formData.observaciones = observacionesInput ? observacionesInput.value : '';
            this.formData.urgente = urgenteCheckbox ? urgenteCheckbox.checked : false;
            
            // Mostrar spinner en el botón
            const submitBtn = container.querySelector('#derivarBtn');
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = `
                    <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                    Derivando...
                `;
            }
            
            // Simular envío a la API
            await this.derivarDocumento();
            
            // Mostrar mensaje de éxito
            const areaDestino = this.areas.find(area => area.id === parseInt(this.formData.idAreaDestino));
            errorHandler.showSuccessMessage(
                'Documento derivado',
                `El expediente ${this.selectedDocument.numeroExpediente} ha sido derivado correctamente a ${areaDestino ? areaDestino.nombre : 'el área seleccionada'}.`
            );
            
            // Recargar documentos y limpiar formulario
            this.selectedDocument = null;
            this.formData = {
                idDocumento: '',
                idAreaDestino: '',
                observaciones: '',
                urgente: false
            };
            
            await this.fetchDocuments();
            this.render(container);
            
        } catch (error) {
            console.error('[DERIVACION] Error al derivar:', error);
            errorHandler.showErrorMessage(
                'Error al derivar',
                'No se pudo derivar el documento. Por favor, intente nuevamente más tarde.'
            );
            
            // Restaurar botón
            const submitBtn = container.querySelector('#derivarBtn');
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i class="fas fa-exchange-alt"></i> Derivar Documento';
            }
        }
    }

    /**
     * Maneja la acción de cancelar
     */
    handleCancel() {
        // Si hay un documento seleccionado, solo resetear la selección
        if (this.selectedDocument) {
            this.selectedDocument = null;
            this.formData = {
                idDocumento: '',
                idAreaDestino: '',
                observaciones: '',
                urgente: false
            };
            
            // Redirigir a la misma página sin parámetros
            window.location.hash = 'derivacion';
        } else {
            // Si no hay documento seleccionado, volver a documentos recibidos
            window.location.hash = 'documentos-recibidos';
        }
    }

    /**
     * Obtiene los documentos pendientes de derivación (simulado)
     */
    async fetchDocuments() {
        // Simulación de una petición a la API
        return new Promise(resolve => {
            setTimeout(() => {
                this.documents = [
                    {
                        id: 1,
                        numeroExpediente: 'EXP-2023-00123',
                        fechaRecepcion: '15/03/2023',
                        remitente: 'Fiscalía Provincial de Cusco',
                        asunto: 'Solicitud de peritaje balístico',
                        prioridad: 'normal',
                        folios: 12
                    },
                    {
                        id: 2,
                        numeroExpediente: 'EXP-2023-00124',
                        fechaRecepcion: '16/03/2023',
                        remitente: 'Comisaría de Santiago',
                        asunto: 'Informe pericial toxicológico',
                        prioridad: 'alta',
                        folios: 8
                    },
                    {
                        id: 3,
                        numeroExpediente: 'EXP-2023-00125',
                        fechaRecepcion: '17/03/2023',
                        remitente: 'Juzgado Penal de Cusco',
                        asunto: 'Solicitud de análisis químico',
                        prioridad: 'urgente',
                        folios: 15
                    }
                ];
                resolve(this.documents);
            }, 500);
        });
    }

    /**
     * Obtiene las áreas disponibles (simulado)
     */
    async fetchAreas() {
        // Simulación de una petición a la API
        return new Promise(resolve => {
            setTimeout(() => {
                this.areas = [
                    {
                        id: 1,
                        nombre: 'Química y Toxicología',
                        codigo: 'QT'
                    },
                    {
                        id: 2,
                        nombre: 'Balística Forense',
                        codigo: 'BF'
                    },
                    {
                        id: 3,
                        nombre: 'Biología Forense',
                        codigo: 'BI'
                    },
                    {
                        id: 4,
                        nombre: 'Dosaje Etílico',
                        codigo: 'DE'
                    },
                    {
                        id: 5,
                        nombre: 'Forense Digital',
                        codigo: 'FD'
                    }
                ];
                resolve(this.areas);
            }, 300);
        });
    }

    /**
     * Deriva un documento (simulado)
     */
    async derivarDocumento() {
        // Simulación de una petición a la API
        return new Promise(resolve => {
            setTimeout(() => {
                console.log('[DERIVACION] Documento derivado:', {
                    documento: this.selectedDocument,
                    formData: this.formData
                });
                resolve({ success: true });
            }, 1000);
        });
    }
} 