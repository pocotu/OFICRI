/**
 * Vista de Documentos Completados
 * Muestra los documentos que han completado su procesamiento
 */

export class DocumentosCompletados {
    constructor() {
        // Inicializar propiedades
        this.documentos = [];
        this.filtros = {
            estado: 'COMPLETADO',
            fechaDesde: '',
            fechaHasta: '',
            texto: ''
        };
        this.totalDocumentos = 0;
        this.paginaActual = 1;
        this.documentosPorPagina = 10;
    }

    /**
     * Renderiza la vista
     * @param {HTMLElement} container - Contenedor donde se renderizará la vista
     * @returns {Promise<void>}
     */
    async render(container) {
        try {
            // Mostrar spinner mientras se carga
            container.innerHTML = `
                <div class="text-center my-5">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Cargando...</span>
                    </div>
                    <p class="mt-3">Cargando documentos completados...</p>
                </div>
            `;

            // Cargar datos (simulado)
            await this.cargarDocumentos();

            // Contenido principal
            container.innerHTML = `
                <div class="container-fluid px-4">
                    <h2 class="mt-4 mb-4">Documentos Completados</h2>
                    
                    <div class="card mb-4">
                        <div class="card-header">
                            <i class="fas fa-filter me-1"></i>
                            Filtros de Búsqueda
                        </div>
                        <div class="card-body">
                            <form id="formFiltros" class="row g-3">
                                <div class="col-md-3">
                                    <label for="filtroFechaDesde" class="form-label">Fecha Desde</label>
                                    <input type="date" class="form-control" id="filtroFechaDesde">
                                </div>
                                <div class="col-md-3">
                                    <label for="filtroFechaHasta" class="form-label">Fecha Hasta</label>
                                    <input type="date" class="form-control" id="filtroFechaHasta">
                                </div>
                                <div class="col-md-3">
                                    <label for="filtroTexto" class="form-label">Buscar</label>
                                    <input type="text" class="form-control" id="filtroTexto" placeholder="Nº exp., asunto, remitente...">
                                </div>
                                <div class="col-md-3">
                                    <label for="filtroTipoDocumento" class="form-label">Tipo Documento</label>
                                    <select class="form-select" id="filtroTipoDocumento">
                                        <option value="">Todos</option>
                                        <option value="OFICIO">Oficio</option>
                                        <option value="MEMORANDO">Memorando</option>
                                        <option value="INFORME">Informe</option>
                                        <option value="SOLICITUD">Solicitud</option>
                                        <option value="OTROS">Otros</option>
                                    </select>
                                </div>
                                <div class="col-12 text-end">
                                    <button type="button" class="btn btn-secondary" id="btnLimpiarFiltros">
                                        <i class="fas fa-eraser me-1"></i>Limpiar
                                    </button>
                                    <button type="submit" class="btn btn-primary" id="btnFiltrar">
                                        <i class="fas fa-search me-1"></i>Buscar
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                    
                    <div class="card mb-4">
                        <div class="card-header d-flex justify-content-between align-items-center">
                            <div>
                                <i class="fas fa-check-circle me-1"></i>
                                Documentos Completados
                            </div>
                            <div class="btn-group">
                                <button class="btn btn-sm btn-outline-success" id="btnExportar">
                                    <i class="fas fa-file-export me-1"></i>Exportar
                                </button>
                                <button class="btn btn-sm btn-outline-primary" id="btnArchivar">
                                    <i class="fas fa-archive me-1"></i>Archivar Seleccionados
                                </button>
                            </div>
                        </div>
                        <div class="card-body">
                            <div class="table-responsive">
                                <table class="table table-bordered table-hover">
                                    <thead>
                                        <tr>
                                            <th>
                                                <div class="form-check">
                                                    <input class="form-check-input" type="checkbox" id="selectAll">
                                                </div>
                                            </th>
                                            <th>#</th>
                                            <th>Nº Expediente</th>
                                            <th>Asunto</th>
                                            <th>Remitente</th>
                                            <th>Fecha Recepción</th>
                                            <th>Fecha Completado</th>
                                            <th>Duración</th>
                                            <th>Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody id="tablaDocumentos">
                                        ${this.renderTablaDocumentos()}
                                    </tbody>
                                </table>
                            </div>
                            
                            <div class="d-flex justify-content-between align-items-center mt-3">
                                <div>
                                    Mostrando <span id="indicePaginacion">${Math.min(1, this.totalDocumentos)}-${Math.min(this.documentosPorPagina, this.totalDocumentos)}</span> de <span id="totalDocumentos">${this.totalDocumentos}</span> documentos
                                </div>
                                <nav aria-label="Paginación de documentos">
                                    <ul class="pagination mb-0">
                                        ${this.renderPaginacion()}
                                    </ul>
                                </nav>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            // Configurar eventos
            this.setupEventListeners(container);
        } catch (error) {
            console.error('[DocumentosCompletados] Error al renderizar vista:', error);
            container.innerHTML = `
                <div class="alert alert-danger">
                    <h4>Error al cargar la vista</h4>
                    <p>${error.message || 'Ocurrió un error inesperado'}</p>
                    <button class="btn btn-outline-danger" onclick="window.location.reload()">Reintentar</button>
                </div>
            `;
        }
    }

    /**
     * Configura los listeners de eventos
     * @param {HTMLElement} container - Contenedor donde se encuentra la vista
     */
    setupEventListeners(container) {
        // Filtrado
        const formFiltros = container.querySelector('#formFiltros');
        if (formFiltros) {
            formFiltros.addEventListener('submit', (e) => {
                e.preventDefault();
                this.aplicarFiltros(container);
            });
        }

        // Limpiar filtros
        const btnLimpiarFiltros = container.querySelector('#btnLimpiarFiltros');
        if (btnLimpiarFiltros) {
            btnLimpiarFiltros.addEventListener('click', () => this.limpiarFiltros(container));
        }

        // Paginación
        const paginationLinks = container.querySelectorAll('.page-link');
        paginationLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const pagina = parseInt(link.getAttribute('data-page'));
                if (!isNaN(pagina)) {
                    this.irAPagina(pagina, container);
                }
            });
        });

        // Seleccionar todos
        const selectAll = container.querySelector('#selectAll');
        if (selectAll) {
            selectAll.addEventListener('change', (e) => {
                const checkboxes = container.querySelectorAll('.documento-check');
                checkboxes.forEach(checkbox => {
                    checkbox.checked = selectAll.checked;
                });
            });
        }

        // Botones de acción
        this.setupActionButtons(container);

        // Exportar
        const btnExportar = container.querySelector('#btnExportar');
        if (btnExportar) {
            btnExportar.addEventListener('click', () => this.exportarDocumentos());
        }

        // Archivar seleccionados
        const btnArchivar = container.querySelector('#btnArchivar');
        if (btnArchivar) {
            btnArchivar.addEventListener('click', () => this.archivarSeleccionados(container));
        }
    }

    /**
     * Configura los botones de acción para cada documento
     * @param {HTMLElement} container - Contenedor de la vista
     */
    setupActionButtons(container) {
        // Botones para ver detalles
        const verButtons = container.querySelectorAll('.btn-ver');
        verButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const documentoId = btn.getAttribute('data-id');
                this.verDocumento(documentoId);
            });
        });

        // Botones para descargar
        const descargarButtons = container.querySelectorAll('.btn-descargar');
        descargarButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const documentoId = btn.getAttribute('data-id');
                this.descargarDocumento(documentoId);
            });
        });

        // Botones para archivar
        const archivarButtons = container.querySelectorAll('.btn-archivar');
        archivarButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const documentoId = btn.getAttribute('data-id');
                this.archivarDocumento(documentoId, container);
            });
        });
    }

    /**
     * Carga los documentos (simulado)
     */
    async cargarDocumentos() {
        // Simulación de carga desde el servidor
        return new Promise(resolve => {
            setTimeout(() => {
                // Generar datos de ejemplo
                this.documentos = this.generarDocumentosEjemplo();
                this.totalDocumentos = this.documentos.length;
                resolve(this.documentos);
            }, 800);
        });
    }

    /**
     * Genera documentos de ejemplo
     * @returns {Array} Lista de documentos
     */
    generarDocumentosEjemplo() {
        const tiposDocumento = ['OFICIO', 'MEMORANDO', 'INFORME', 'SOLICITUD', 'OTROS'];
        
        return Array.from({ length: 20 }, (_, i) => {
            // Fechas: fecha de recepción entre 1 y 3 meses atrás
            const fechaRecepcion = new Date();
            fechaRecepcion.setDate(fechaRecepcion.getDate() - (30 + Math.floor(Math.random() * 60)));
            
            // Fecha completado: entre 1 y 20 días después de la recepción
            const fechaCompletado = new Date(fechaRecepcion);
            const diasProceso = Math.floor(Math.random() * 20) + 1;
            fechaCompletado.setDate(fechaCompletado.getDate() + diasProceso);
            
            return {
                id: (i + 1).toString(),
                numeroExpediente: `EXP-2023-${2000 + i}`,
                asunto: this.getAsuntoAleatorio(),
                remitente: this.getRemitenteAleatorio(),
                fechaRecepcion: fechaRecepcion.toISOString().split('T')[0],
                fechaCompletado: fechaCompletado.toISOString().split('T')[0],
                diasProceso: diasProceso,
                tipoDocumento: tiposDocumento[Math.floor(Math.random() * tiposDocumento.length)],
                tieneArchivosAdjuntos: Math.random() > 0.3
            };
        });
    }

    /**
     * Obtiene un asunto aleatorio para los datos de ejemplo
     * @returns {string} Asunto aleatorio
     */
    getAsuntoAleatorio() {
        const asuntos = [
            'Informe pericial de balística forense',
            'Dictamen de análisis químico de sustancias',
            'Resultado de análisis dactiloscópico',
            'Dictamen pericial documentoscópico',
            'Informe de peritaje caligráfico',
            'Resultado de análisis de ADN',
            'Informe de análisis toxicológico',
            'Dictamen de inspección ocular',
            'Informe técnico de accidente de tránsito',
            'Resultado de análisis biológico de evidencias'
        ];
        return asuntos[Math.floor(Math.random() * asuntos.length)];
    }

    /**
     * Obtiene un remitente aleatorio para los datos de ejemplo
     * @returns {string} Remitente aleatorio
     */
    getRemitenteAleatorio() {
        const remitentes = [
            'Fiscalía Provincial Penal',
            'Dirección General PNP',
            'Juzgado Penal de Lima',
            'División de Investigación Criminal',
            'Comisaría de San Isidro',
            'Procuraduría Pública',
            'Fiscalía Especializada en Corrupción',
            'Comisaría de Miraflores',
            'Juzgado de Investigación Preparatoria',
            'Departamento de Investigaciones'
        ];
        return remitentes[Math.floor(Math.random() * remitentes.length)];
    }

    /**
     * Renderiza la tabla de documentos
     * @returns {string} HTML de la tabla
     */
    renderTablaDocumentos() {
        if (this.documentos.length === 0) {
            return '<tr><td colspan="9" class="text-center">No hay documentos completados</td></tr>';
        }

        // Obtener los documentos de la página actual
        const inicio = (this.paginaActual - 1) * this.documentosPorPagina;
        const fin = inicio + this.documentosPorPagina;
        const documentosPagina = this.documentos.slice(inicio, fin);

        return documentosPagina.map((doc, index) => `
            <tr>
                <td>
                    <div class="form-check">
                        <input class="form-check-input documento-check" type="checkbox" value="${doc.id}" id="check-${doc.id}">
                    </div>
                </td>
                <td>${inicio + index + 1}</td>
                <td>${doc.numeroExpediente}</td>
                <td>${doc.asunto}</td>
                <td>${doc.remitente}</td>
                <td>${this.formatDate(doc.fechaRecepcion)}</td>
                <td>${this.formatDate(doc.fechaCompletado)}</td>
                <td>
                    <span class="badge ${this.getBadgeClassForDias(doc.diasProceso)}">
                        ${doc.diasProceso} días
                    </span>
                </td>
                <td>
                    <div class="btn-group btn-group-sm" role="group">
                        <button type="button" class="btn btn-primary btn-ver" data-id="${doc.id}" title="Ver detalles">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button type="button" class="btn btn-success btn-descargar" data-id="${doc.id}" title="Descargar informe" ${!doc.tieneArchivosAdjuntos ? 'disabled' : ''}>
                            <i class="fas fa-download"></i>
                        </button>
                        <button type="button" class="btn btn-secondary btn-archivar" data-id="${doc.id}" title="Archivar">
                            <i class="fas fa-archive"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    /**
     * Renderiza la paginación
     * @returns {string} HTML de la paginación
     */
    renderPaginacion() {
        const totalPaginas = Math.ceil(this.totalDocumentos / this.documentosPorPagina);
        
        if (totalPaginas <= 1) {
            return '';
        }
        
        let html = `
            <li class="page-item ${this.paginaActual === 1 ? 'disabled' : ''}">
                <a class="page-link" href="#" data-page="${this.paginaActual - 1}" aria-label="Anterior">
                    <span aria-hidden="true">&laquo;</span>
                </a>
            </li>
        `;
        
        // Limitar el número de páginas mostradas
        let startPage = Math.max(1, this.paginaActual - 2);
        let endPage = Math.min(totalPaginas, startPage + 4);
        
        if (endPage - startPage < 4) {
            startPage = Math.max(1, endPage - 4);
        }
        
        for (let i = startPage; i <= endPage; i++) {
            html += `
                <li class="page-item ${i === this.paginaActual ? 'active' : ''}">
                    <a class="page-link" href="#" data-page="${i}">${i}</a>
                </li>
            `;
        }
        
        html += `
            <li class="page-item ${this.paginaActual === totalPaginas ? 'disabled' : ''}">
                <a class="page-link" href="#" data-page="${this.paginaActual + 1}" aria-label="Siguiente">
                    <span aria-hidden="true">&raquo;</span>
                </a>
            </li>
        `;
        
        return html;
    }

    /**
     * Aplica los filtros a los documentos
     * @param {HTMLElement} container - Contenedor de la vista
     */
    aplicarFiltros(container) {
        // Obtener valores de los filtros
        const fechaDesde = container.querySelector('#filtroFechaDesde').value;
        const fechaHasta = container.querySelector('#filtroFechaHasta').value;
        const texto = container.querySelector('#filtroTexto').value.trim().toLowerCase();
        const tipoDocumento = container.querySelector('#filtroTipoDocumento').value;
        
        // Actualizar filtros
        this.filtros = {
            estado: 'COMPLETADO',
            fechaDesde,
            fechaHasta,
            texto,
            tipoDocumento
        };
        
        // Recargar documentos (en un caso real, haríamos una solicitud al servidor)
        this.paginaActual = 1;
        this.cargarDocumentos().then(() => {
            this.actualizarInterfaz(container);
        });
    }

    /**
     * Limpia los filtros aplicados
     * @param {HTMLElement} container - Contenedor de la vista
     */
    limpiarFiltros(container) {
        // Resetear campos del formulario
        const formFiltros = container.querySelector('#formFiltros');
        if (formFiltros) {
            formFiltros.reset();
        }
        
        // Resetear filtros
        this.filtros = {
            estado: 'COMPLETADO',
            fechaDesde: '',
            fechaHasta: '',
            texto: '',
            tipoDocumento: ''
        };
        
        // Recargar documentos
        this.cargarDocumentos().then(() => {
            this.actualizarInterfaz(container);
        });
    }

    /**
     * Actualiza la interfaz de usuario después de cambios en los datos
     * @param {HTMLElement} container - Contenedor de la vista
     */
    actualizarInterfaz(container) {
        // Actualizar la tabla y paginación
        const tablaDocumentos = container.querySelector('#tablaDocumentos');
        if (tablaDocumentos) {
            tablaDocumentos.innerHTML = this.renderTablaDocumentos();
        }
        
        const paginacion = container.querySelector('.pagination');
        if (paginacion) {
            paginacion.innerHTML = this.renderPaginacion();
        }
        
        // Actualizar indicadores
        const indicePaginacion = container.querySelector('#indicePaginacion');
        if (indicePaginacion) {
            const inicio = Math.min((this.paginaActual - 1) * this.documentosPorPagina + 1, this.totalDocumentos);
            const fin = Math.min(this.paginaActual * this.documentosPorPagina, this.totalDocumentos);
            indicePaginacion.textContent = `${inicio}-${fin}`;
        }
        
        const totalDocumentos = container.querySelector('#totalDocumentos');
        if (totalDocumentos) {
            totalDocumentos.textContent = this.totalDocumentos;
        }
        
        // Desmarcar "seleccionar todos"
        const selectAll = container.querySelector('#selectAll');
        if (selectAll) {
            selectAll.checked = false;
        }
        
        // Reconfigurar eventos
        this.setupActionButtons(container);
        this.setupPaginationEvents(container);
    }

    /**
     * Configura los eventos de paginación
     * @param {HTMLElement} container - Contenedor de la vista
     */
    setupPaginationEvents(container) {
        const paginationLinks = container.querySelectorAll('.page-link');
        paginationLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const pagina = parseInt(link.getAttribute('data-page'));
                if (!isNaN(pagina)) {
                    this.irAPagina(pagina, container);
                }
            });
        });
    }

    /**
     * Navega a una página específica
     * @param {number} pagina - Número de página
     * @param {HTMLElement} container - Contenedor de la vista
     */
    irAPagina(pagina, container) {
        if (pagina < 1 || pagina > Math.ceil(this.totalDocumentos / this.documentosPorPagina)) {
            return;
        }
        
        this.paginaActual = pagina;
        this.actualizarInterfaz(container);
    }

    /**
     * Ver detalles de un documento
     * @param {string} id - ID del documento
     */
    verDocumento(id) {
        const documento = this.documentos.find(doc => doc.id === id);
        if (!documento) return;
        
        if (window.Swal) {
            window.Swal.fire({
                title: `Documento ${documento.numeroExpediente}`,
                html: `
                    <div class="text-start">
                        <p><strong>Asunto:</strong> ${documento.asunto}</p>
                        <p><strong>Remitente:</strong> ${documento.remitente}</p>
                        <p><strong>Tipo de Documento:</strong> ${documento.tipoDocumento}</p>
                        <p><strong>Fecha de recepción:</strong> ${this.formatDate(documento.fechaRecepcion)}</p>
                        <p><strong>Fecha de completado:</strong> ${this.formatDate(documento.fechaCompletado)}</p>
                        <p><strong>Tiempo de proceso:</strong> ${documento.diasProceso} días</p>
                        <p><strong>Archivos adjuntos:</strong> ${documento.tieneArchivosAdjuntos ? 'Sí' : 'No'}</p>
                    </div>
                `,
                icon: 'info',
                confirmButtonText: 'Cerrar'
            });
        } else {
            alert(`Detalles del documento ${documento.numeroExpediente}`);
        }
    }

    /**
     * Descargar documento
     * @param {string} id - ID del documento
     */
    descargarDocumento(id) {
        const documento = this.documentos.find(doc => doc.id === id);
        if (!documento) return;
        
        if (!documento.tieneArchivosAdjuntos) {
            if (window.Swal) {
                window.Swal.fire({
                    title: 'Sin archivos',
                    text: 'Este documento no tiene archivos adjuntos disponibles para descargar',
                    icon: 'warning',
                    confirmButtonText: 'Entendido'
                });
            } else {
                alert('Este documento no tiene archivos adjuntos disponibles para descargar');
            }
            return;
        }
        
        // Simular descarga
        if (window.Swal) {
            window.Swal.fire({
                title: 'Descargando documento',
                text: `Preparando la descarga del informe ${documento.numeroExpediente}...`,
                icon: 'info',
                timer: 2000,
                timerProgressBar: true,
                showConfirmButton: false
            }).then(() => {
                window.Swal.fire({
                    title: 'Descarga completa',
                    text: 'El documento ha sido descargado exitosamente',
                    icon: 'success',
                    confirmButtonText: 'Aceptar'
                });
            });
        } else {
            alert(`Descargando documento ${documento.numeroExpediente}...`);
            setTimeout(() => {
                alert('Descarga completada exitosamente');
            }, 1500);
        }
    }

    /**
     * Archivar un documento específico
     * @param {string} id - ID del documento
     * @param {HTMLElement} container - Contenedor de la vista
     */
    archivarDocumento(id, container) {
        const documento = this.documentos.find(doc => doc.id === id);
        if (!documento) return;
        
        if (window.Swal) {
            window.Swal.fire({
                title: 'Archivar documento',
                text: `¿Está seguro de archivar el documento ${documento.numeroExpediente}?`,
                icon: 'question',
                showCancelButton: true,
                confirmButtonText: 'Sí, archivar',
                cancelButtonText: 'Cancelar'
            }).then((result) => {
                if (result.isConfirmed) {
                    // Simular el archivado (eliminar de la lista)
                    this.documentos = this.documentos.filter(doc => doc.id !== id);
                    this.totalDocumentos = this.documentos.length;
                    
                    // Verificar si debemos ajustar la página actual
                    const totalPaginas = Math.ceil(this.totalDocumentos / this.documentosPorPagina);
                    if (this.paginaActual > totalPaginas) {
                        this.paginaActual = Math.max(1, totalPaginas);
                    }
                    
                    this.actualizarInterfaz(container);
                    
                    window.Swal.fire(
                        'Archivado',
                        'El documento ha sido archivado correctamente',
                        'success'
                    );
                }
            });
        } else {
            if (confirm(`¿Está seguro de archivar el documento ${documento.numeroExpediente}?`)) {
                // Simular el archivado (eliminar de la lista)
                this.documentos = this.documentos.filter(doc => doc.id !== id);
                this.totalDocumentos = this.documentos.length;
                
                // Verificar si debemos ajustar la página actual
                const totalPaginas = Math.ceil(this.totalDocumentos / this.documentosPorPagina);
                if (this.paginaActual > totalPaginas) {
                    this.paginaActual = Math.max(1, totalPaginas);
                }
                
                this.actualizarInterfaz(container);
                alert('El documento ha sido archivado correctamente');
            }
        }
    }

    /**
     * Archivar los documentos seleccionados
     * @param {HTMLElement} container - Contenedor de la vista
     */
    archivarSeleccionados(container) {
        const checkboxes = container.querySelectorAll('.documento-check:checked');
        if (checkboxes.length === 0) {
            if (window.Swal) {
                window.Swal.fire({
                    title: 'Sin selección',
                    text: 'Por favor seleccione al menos un documento para archivar',
                    icon: 'warning',
                    confirmButtonText: 'Entendido'
                });
            } else {
                alert('Por favor seleccione al menos un documento para archivar');
            }
            return;
        }
        
        const ids = Array.from(checkboxes).map(checkbox => checkbox.value);
        
        if (window.Swal) {
            window.Swal.fire({
                title: 'Archivar documentos',
                text: `¿Está seguro de archivar ${ids.length} documento(s) seleccionado(s)?`,
                icon: 'question',
                showCancelButton: true,
                confirmButtonText: 'Sí, archivar',
                cancelButtonText: 'Cancelar'
            }).then((result) => {
                if (result.isConfirmed) {
                    // Simular el archivado (eliminar de la lista)
                    this.documentos = this.documentos.filter(doc => !ids.includes(doc.id));
                    this.totalDocumentos = this.documentos.length;
                    
                    // Verificar si debemos ajustar la página actual
                    const totalPaginas = Math.ceil(this.totalDocumentos / this.documentosPorPagina);
                    if (this.paginaActual > totalPaginas) {
                        this.paginaActual = Math.max(1, totalPaginas);
                    }
                    
                    this.actualizarInterfaz(container);
                    
                    window.Swal.fire(
                        'Archivados',
                        `${ids.length} documento(s) han sido archivados correctamente`,
                        'success'
                    );
                }
            });
        } else {
            if (confirm(`¿Está seguro de archivar ${ids.length} documento(s) seleccionado(s)?`)) {
                // Simular el archivado (eliminar de la lista)
                this.documentos = this.documentos.filter(doc => !ids.includes(doc.id));
                this.totalDocumentos = this.documentos.length;
                
                // Verificar si debemos ajustar la página actual
                const totalPaginas = Math.ceil(this.totalDocumentos / this.documentosPorPagina);
                if (this.paginaActual > totalPaginas) {
                    this.paginaActual = Math.max(1, totalPaginas);
                }
                
                this.actualizarInterfaz(container);
                alert(`${ids.length} documento(s) han sido archivados correctamente`);
            }
        }
    }

    /**
     * Exportar documentos a Excel/PDF
     */
    exportarDocumentos() {
        if (window.Swal) {
            window.Swal.fire({
                title: 'Exportar Documentos',
                text: 'Seleccione el formato para exportar los documentos completados',
                icon: 'question',
                showCancelButton: true,
                confirmButtonText: 'Excel',
                cancelButtonText: 'PDF',
                cancelButtonColor: '#3085d6',
                showCloseButton: true
            }).then((result) => {
                if (result.isConfirmed) {
                    // Exportar a Excel (simulado)
                    window.Swal.fire(
                        'Exportado a Excel',
                        'El listado de documentos ha sido exportado a Excel',
                        'success'
                    );
                } else if (result.dismiss === window.Swal.DismissReason.cancel) {
                    // Exportar a PDF (simulado)
                    window.Swal.fire(
                        'Exportado a PDF',
                        'El listado de documentos ha sido exportado a PDF',
                        'success'
                    );
                }
            });
        } else {
            const formato = confirm('¿Desea exportar a Excel? Cancelar para exportar a PDF');
            alert(`El listado ha sido exportado a ${formato ? 'Excel' : 'PDF'}`);
        }
    }

    /**
     * Obtiene la clase CSS para el badge según los días de proceso
     * @param {number} dias - Días de proceso
     * @returns {string} Clase CSS
     */
    getBadgeClassForDias(dias) {
        if (dias <= 5) return 'bg-success';
        if (dias <= 15) return 'bg-info';
        return 'bg-warning';
    }

    /**
     * Formatea una fecha en formato legible
     * @param {string} date - Fecha en formato YYYY-MM-DD
     * @returns {string} Fecha formateada
     */
    formatDate(date) {
        if (!date) return '';
        
        try {
            const d = new Date(date);
            return d.toLocaleDateString('es-PE');
        } catch (e) {
            return date;
        }
    }
} 