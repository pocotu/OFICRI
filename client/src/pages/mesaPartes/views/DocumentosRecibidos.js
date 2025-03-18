/**
 * Vista DocumentosRecibidos para Mesa de Partes
 * Muestra la lista de documentos recibidos en la Mesa de Partes
 */

import * as errorHandler from '../../../utils/errorHandler.js';

export class DocumentosRecibidos {
    constructor() {
        console.log('[DOCUMENTOS-RECIBIDOS] Iniciando constructor');
        // Estado inicial
        this.documents = [];
        this.isLoading = false;
        this.currentPage = 1;
        this.totalPages = 1;
        this.searchTerm = '';
        this.sortField = 'fechaRecepcion';
        this.sortOrder = 'desc';
        this.filters = {
            estado: '',
            fechaInicio: '',
            fechaFin: ''
        };
        console.log('[DOCUMENTOS-RECIBIDOS] Constructor finalizado');
    }

    /**
     * Renderiza la vista en el contenedor
     * @param {HTMLElement} container - El elemento contenedor donde se renderizará la vista
     */
    async render(container) {
        console.log('[DOCUMENTOS-RECIBIDOS] Iniciando renderizado');
        
        this.mostrarCargando(container);
        
        try {
            this.isLoading = true;
            await this.fetchDocuments();
            container.innerHTML = this.renderContenidoPrincipal();
            this.setupEventListeners(container);
            console.log('[DOCUMENTOS-RECIBIDOS] Renderizado completado');
        } catch (error) {
            console.error('[DOCUMENTOS-RECIBIDOS] Error en renderizado:', error);
            errorHandler.showErrorMessage('Error al cargar documentos', 'No se pudieron cargar los documentos recibidos. Por favor, intente nuevamente más tarde.');
            container.innerHTML = this.renderError();
        }
    }
    
    /**
     * Muestra el indicador de carga
     * @param {HTMLElement} container - El contenedor donde se mostrará
     */
    mostrarCargando(container) {
        container.innerHTML = `
            <div class="d-flex justify-content-center my-5">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Cargando...</span>
                </div>
            </div>
        `;
    }
    
    /**
     * Renderiza un mensaje de error
     * @returns {string} HTML del mensaje de error
     */
    renderError() {
        return `
            <div class="alert alert-danger" role="alert">
                <h4 class="alert-heading">Error al cargar documentos</h4>
                <p>No se pudieron cargar los documentos recibidos. Por favor, intente nuevamente más tarde.</p>
                <hr>
                <p class="mb-0">Verifique su conexión a internet e intente nuevamente.</p>
            </div>
        `;
    }
    
    /**
     * Renderiza el contenido principal de la página
     * @returns {string} HTML del contenido
     */
    renderContenidoPrincipal() {
        return `
            <div class="documents-received-page">
                ${this.renderEncabezado()}
                
                <div class="card">
                    <div class="card-body">
                        ${this.renderSeccionFiltros()}
                        ${this.renderTablaDocumentos()}
                        ${this.renderPagination()}
                    </div>
                </div>
            </div>
        `;
    }
    
    /**
     * Renderiza el encabezado de la página
     * @returns {string} HTML del encabezado
     */
    renderEncabezado() {
        return `
            <div class="page-header">
                <h2>Documentos Recibidos</h2>
                <p>Gestione los documentos que han sido recibidos en Mesa de Partes</p>
            </div>
        `;
    }
    
    /**
     * Renderiza la sección de filtros
     * @returns {string} HTML de los filtros
     */
    renderSeccionFiltros() {
        return `
            <div class="filters-section mb-4">
                <div class="row">
                    ${this.renderFiltroBusqueda()}
                    ${this.renderFiltroEstado()}
                    ${this.renderFiltrosFecha()}
                </div>
                ${this.renderBotonesFiltro()}
            </div>
        `;
    }
    
    /**
     * Renderiza el filtro de búsqueda
     * @returns {string} HTML del filtro de búsqueda
     */
    renderFiltroBusqueda() {
        return `
            <div class="col-md-3">
                <div class="form-group">
                    <label for="searchInput">Buscar</label>
                    <input type="text" class="form-control" id="searchInput" 
                        placeholder="Buscar por expediente, remitente..." value="${this.searchTerm}">
                </div>
            </div>
        `;
    }
    
    /**
     * Renderiza el filtro de estado
     * @returns {string} HTML del filtro de estado
     */
    renderFiltroEstado() {
        return `
            <div class="col-md-3">
                <div class="form-group">
                    <label for="statusFilter">Estado</label>
                    <select class="form-select" id="statusFilter">
                        <option value="">Todos</option>
                        <option value="pendiente" ${this.filters.estado === 'pendiente' ? 'selected' : ''}>Pendiente</option>
                        <option value="en_proceso" ${this.filters.estado === 'en_proceso' ? 'selected' : ''}>En Proceso</option>
                        <option value="derivado" ${this.filters.estado === 'derivado' ? 'selected' : ''}>Derivado</option>
                        <option value="completado" ${this.filters.estado === 'completado' ? 'selected' : ''}>Completado</option>
                    </select>
                </div>
            </div>
        `;
    }
    
    /**
     * Renderiza los filtros de fecha
     * @returns {string} HTML de los filtros de fecha
     */
    renderFiltrosFecha() {
        return `
            <div class="col-md-3">
                <div class="form-group">
                    <label for="dateFrom">Desde</label>
                    <input type="date" class="form-control" id="dateFrom" value="${this.filters.fechaInicio}">
                </div>
            </div>
            <div class="col-md-3">
                <div class="form-group">
                    <label for="dateTo">Hasta</label>
                    <input type="date" class="form-control" id="dateTo" value="${this.filters.fechaFin}">
                </div>
            </div>
        `;
    }
    
    /**
     * Renderiza los botones de filtro
     * @returns {string} HTML de los botones
     */
    renderBotonesFiltro() {
        return `
            <div class="row mt-3">
                <div class="col-md-12 text-end">
                    <button id="filterBtn" class="btn btn-primary">
                        <i class="fas fa-filter"></i> Filtrar
                    </button>
                    <button id="resetFilterBtn" class="btn btn-secondary">
                        <i class="fas fa-sync"></i> Restablecer
                    </button>
                </div>
            </div>
        `;
    }
    
    /**
     * Renderiza la tabla de documentos
     * @returns {string} HTML de la tabla
     */
    renderTablaDocumentos() {
        return `
            <div class="table-responsive">
                <table class="table table-striped">
                    ${this.renderEncabezadoTabla()}
                    <tbody>
                        ${this.renderDocumentsRows()}
                    </tbody>
                </table>
            </div>
        `;
    }
    
    /**
     * Renderiza el encabezado de la tabla
     * @returns {string} HTML del encabezado de tabla
     */
    renderEncabezadoTabla() {
        return `
            <thead class="table-primary">
                <tr>
                    <th class="sortable" data-field="numeroExpediente">
                        N° Expediente
                        ${this.getSortIcon('numeroExpediente')}
                    </th>
                    <th class="sortable" data-field="fechaRecepcion">
                        Fecha Recepción
                        ${this.getSortIcon('fechaRecepcion')}
                    </th>
                    <th class="sortable" data-field="remitente">
                        Remitente
                        ${this.getSortIcon('remitente')}
                    </th>
                    <th class="sortable" data-field="asunto">
                        Asunto
                        ${this.getSortIcon('asunto')}
                    </th>
                    <th class="sortable" data-field="estado">
                        Estado
                        ${this.getSortIcon('estado')}
                    </th>
                    <th>Acciones</th>
                </tr>
            </thead>
        `;
    }

    /**
     * Obtiene el ícono de ordenamiento para una columna
     * @param {string} field - Campo de ordenamiento
     * @returns {string} - HTML del ícono
     */
    getSortIcon(field) {
        if (this.sortField !== field) {
            return '<i class="fas fa-sort text-muted"></i>';
        }
        
        return this.sortOrder === 'asc' 
            ? '<i class="fas fa-sort-up"></i>' 
            : '<i class="fas fa-sort-down"></i>';
    }

    /**
     * Renderiza las filas de la tabla de documentos
     * @returns {string} - HTML de las filas
     */
    renderDocumentsRows() {
        if (this.documents.length === 0) {
            return `
                <tr>
                    <td colspan="6" class="text-center py-4">
                        <i class="fas fa-inbox fa-3x text-muted mb-3"></i>
                        <p>No hay documentos que coincidan con los criterios de búsqueda</p>
                    </td>
                </tr>
            `;
        }
        
        return this.documents.map(doc => `
            <tr>
                <td>${doc.numeroExpediente}</td>
                <td>${doc.fechaRecepcion}</td>
                <td>${doc.remitente}</td>
                <td>${doc.asunto}</td>
                <td>
                    <span class="badge ${this.getStatusBadgeClass(doc.estado)}">
                        ${this.getStatusLabel(doc.estado)}
                    </span>
                </td>
                <td>
                    <div class="btn-group">
                        <button class="btn btn-sm btn-info view-btn" data-id="${doc.id}" title="Ver detalles">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-sm btn-primary edit-btn" data-id="${doc.id}" title="Editar">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-success transfer-btn" data-id="${doc.id}" title="Derivar">
                            <i class="fas fa-exchange-alt"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    /**
     * Obtiene la clase CSS para el badge de estado
     * @param {string} status - Estado del documento
     * @returns {string} - Clase CSS
     */
    getStatusBadgeClass(status) {
        switch (status) {
            case 'pendiente': return 'bg-warning';
            case 'en_proceso': return 'bg-info';
            case 'derivado': return 'bg-primary';
            case 'completado': return 'bg-success';
            default: return 'bg-secondary';
        }
    }

    /**
     * Obtiene la etiqueta para el estado
     * @param {string} status - Estado del documento
     * @returns {string} - Etiqueta
     */
    getStatusLabel(status) {
        switch (status) {
            case 'pendiente': return 'Pendiente';
            case 'en_proceso': return 'En Proceso';
            case 'derivado': return 'Derivado';
            case 'completado': return 'Completado';
            default: return 'Desconocido';
        }
    }

    /**
     * Renderiza la paginación
     * @returns {string} - HTML de la paginación
     */
    renderPagination() {
        if (this.totalPages <= 1) {
            return '';
        }
        
        let pages = '';
        for (let i = 1; i <= this.totalPages; i++) {
            pages += `
                <li class="page-item ${i === this.currentPage ? 'active' : ''}">
                    <a class="page-link page-number" href="#" data-page="${i}">${i}</a>
                </li>
            `;
        }
        
        return `
            <nav aria-label="Navegación de páginas">
                <ul class="pagination justify-content-center">
                    <li class="page-item ${this.currentPage === 1 ? 'disabled' : ''}">
                        <a class="page-link" href="#" id="prevPage" aria-label="Anterior">
                            <span aria-hidden="true">&laquo;</span>
                        </a>
                    </li>
                    ${pages}
                    <li class="page-item ${this.currentPage === this.totalPages ? 'disabled' : ''}">
                        <a class="page-link" href="#" id="nextPage" aria-label="Siguiente">
                            <span aria-hidden="true">&raquo;</span>
                        </a>
                    </li>
                </ul>
            </nav>
        `;
    }

    /**
     * Configura los event listeners
     * @param {HTMLElement} container - Contenedor de la vista
     */
    setupEventListeners(container) {
        // Botón de filtrar
        const filterBtn = container.querySelector('#filterBtn');
        if (filterBtn) {
            filterBtn.addEventListener('click', () => this.applyFilters(container));
        }
        
        // Botón de restablecer filtros
        const resetFilterBtn = container.querySelector('#resetFilterBtn');
        if (resetFilterBtn) {
            resetFilterBtn.addEventListener('click', () => this.resetFilters(container));
        }
        
        // Búsqueda al presionar Enter
        const searchInput = container.querySelector('#searchInput');
        if (searchInput) {
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.applyFilters(container);
                }
            });
        }
        
        // Ordenamiento de columnas
        const sortableHeaders = container.querySelectorAll('.sortable');
        sortableHeaders.forEach(header => {
            header.addEventListener('click', () => {
                const field = header.getAttribute('data-field');
                this.handleSort(field, container);
            });
        });
        
        // Paginación
        const prevPageBtn = container.querySelector('#prevPage');
        if (prevPageBtn) {
            prevPageBtn.addEventListener('click', (e) => {
                e.preventDefault();
                if (this.currentPage > 1) {
                    this.goToPage(this.currentPage - 1, container);
                }
            });
        }
        
        const nextPageBtn = container.querySelector('#nextPage');
        if (nextPageBtn) {
            nextPageBtn.addEventListener('click', (e) => {
                e.preventDefault();
                if (this.currentPage < this.totalPages) {
                    this.goToPage(this.currentPage + 1, container);
                }
            });
        }
        
        const pageNumbers = container.querySelectorAll('.page-number');
        pageNumbers.forEach(pageNum => {
            pageNum.addEventListener('click', (e) => {
                e.preventDefault();
                const page = parseInt(pageNum.getAttribute('data-page'));
                this.goToPage(page, container);
            });
        });
        
        // Botones de acción
        const viewButtons = container.querySelectorAll('.view-btn');
        viewButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const documentId = btn.getAttribute('data-id');
                this.viewDocument(documentId);
            });
        });
        
        const editButtons = container.querySelectorAll('.edit-btn');
        editButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const documentId = btn.getAttribute('data-id');
                this.editDocument(documentId);
            });
        });
        
        const transferButtons = container.querySelectorAll('.transfer-btn');
        transferButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const documentId = btn.getAttribute('data-id');
                this.transferDocument(documentId);
            });
        });
    }

    /**
     * Aplica los filtros actuales
     * @param {HTMLElement} container - Contenedor de la vista
     */
    applyFilters(container) {
        const searchInput = container.querySelector('#searchInput');
        const statusFilter = container.querySelector('#statusFilter');
        const dateFrom = container.querySelector('#dateFrom');
        const dateTo = container.querySelector('#dateTo');
        
        this.searchTerm = searchInput ? searchInput.value : '';
        this.filters.estado = statusFilter ? statusFilter.value : '';
        this.filters.fechaInicio = dateFrom ? dateFrom.value : '';
        this.filters.fechaFin = dateTo ? dateTo.value : '';
        
        this.currentPage = 1;
        this.fetchDocumentsAndRefresh(container);
    }

    /**
     * Restablece los filtros
     * @param {HTMLElement} container - Contenedor de la vista
     */
    resetFilters(container) {
        this.searchTerm = '';
        this.filters = {
            estado: '',
            fechaInicio: '',
            fechaFin: ''
        };
        this.currentPage = 1;
        this.sortField = 'fechaRecepcion';
        this.sortOrder = 'desc';
        
        this.fetchDocumentsAndRefresh(container);
    }

    /**
     * Maneja el ordenamiento por una columna
     * @param {string} field - Campo de ordenamiento
     * @param {HTMLElement} container - Contenedor de la vista
     */
    handleSort(field, container) {
        if (this.sortField === field) {
            this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
        } else {
            this.sortField = field;
            this.sortOrder = 'asc';
        }
        
        this.fetchDocumentsAndRefresh(container);
    }

    /**
     * Navega a una página específica
     * @param {number} page - Número de página
     * @param {HTMLElement} container - Contenedor de la vista
     */
    goToPage(page, container) {
        if (page < 1 || page > this.totalPages) {
            return;
        }
        
        this.currentPage = page;
        this.fetchDocumentsAndRefresh(container);
    }

    /**
     * Obtiene los documentos y refresca la vista
     * @param {HTMLElement} container - Contenedor de la vista
     */
    async fetchDocumentsAndRefresh(container) {
        try {
            // Mostrar spinner de carga
            const tableBody = container.querySelector('tbody');
            if (tableBody) {
                tableBody.innerHTML = `
                    <tr>
                        <td colspan="6" class="text-center py-4">
                            <div class="spinner-border text-primary" role="status">
                                <span class="visually-hidden">Cargando...</span>
                            </div>
                        </td>
                    </tr>
                `;
            }
            
            await this.fetchDocuments();
            
            // Actualizar tabla
            if (tableBody) {
                tableBody.innerHTML = this.renderDocumentsRows();
            }
            
            // Actualizar paginación
            const paginationContainer = container.querySelector('nav');
            if (paginationContainer) {
                paginationContainer.outerHTML = this.renderPagination();
            }
            
            // Reconfigurar event listeners
            this.setupEventListeners(container);
        } catch (error) {
            console.error('[DOCUMENTOS-RECIBIDOS] Error al refrescar documentos:', error);
            errorHandler.showErrorMessage('Error al actualizar', 'No se pudieron cargar los documentos con los filtros aplicados.');
        }
    }

    /**
     * Obtiene los documentos (simulado)
     */
    async fetchDocuments() {
        // Simulación de una petición a la API
        return new Promise((resolve) => {
            setTimeout(() => {
                // Datos de ejemplo
                this.documents = [
                    {
                        id: 1,
                        numeroExpediente: 'EXP-2023-00123',
                        fechaRecepcion: '15/03/2023',
                        remitente: 'Fiscalía Provincial de Cusco',
                        asunto: 'Solicitud de peritaje balístico',
                        estado: 'pendiente'
                    },
                    {
                        id: 2,
                        numeroExpediente: 'EXP-2023-00124',
                        fechaRecepcion: '16/03/2023',
                        remitente: 'Comisaría de Santiago',
                        asunto: 'Informe pericial toxicológico',
                        estado: 'en_proceso'
                    },
                    {
                        id: 3,
                        numeroExpediente: 'EXP-2023-00125',
                        fechaRecepcion: '17/03/2023',
                        remitente: 'Juzgado Penal de Cusco',
                        asunto: 'Solicitud de análisis químico',
                        estado: 'derivado'
                    },
                    {
                        id: 4,
                        numeroExpediente: 'EXP-2023-00126',
                        fechaRecepcion: '18/03/2023',
                        remitente: 'Comisaría de Wanchaq',
                        asunto: 'Evaluación de dosaje etílico',
                        estado: 'completado'
                    },
                    {
                        id: 5,
                        numeroExpediente: 'EXP-2023-00127',
                        fechaRecepcion: '19/03/2023',
                        remitente: 'División de Investigación Criminal',
                        asunto: 'Peritaje grafotécnico',
                        estado: 'pendiente'
                    }
                ];
                
                this.totalPages = 2;
                
                resolve(this.documents);
            }, 500);
        });
    }

    /**
     * Ver detalles de un documento
     * @param {string} documentId - ID del documento
     */
    viewDocument(documentId) {
        // En una aplicación real, esto podría abrir un modal o redireccionar
        window.location.hash = `trazabilidad?id=${documentId}`;
    }

    /**
     * Editar un documento
     * @param {string} documentId - ID del documento
     */
    editDocument(documentId) {
        // En una aplicación real, esto podría abrir un modal o redireccionar
        window.location.hash = `actualizacion-expediente?id=${documentId}`;
    }

    /**
     * Derivar un documento
     * @param {string} documentId - ID del documento
     */
    transferDocument(documentId) {
        // En una aplicación real, esto podría abrir un modal o redireccionar
        window.location.hash = `derivacion?id=${documentId}`;
    }
} 