/**
 * Vista de Documentos En Proceso
 * Muestra los documentos que están actualmente en proceso de atención
 */

export class DocumentosEnProceso {
    constructor() {
        // Inicializar propiedades
        this.documentos = [];
        this.filtros = {
            estado: 'EN_PROCESO',
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
                    <p class="mt-3">Cargando documentos en proceso...</p>
                </div>
            `;

            // Cargar datos (simulado)
            await this.cargarDocumentos();

            // Contenido principal
            container.innerHTML = `
                <div class="container-fluid px-4">
                    <h2 class="mt-4 mb-4">Documentos En Proceso</h2>
                    
                    <div class="card mb-4">
                        <div class="card-header">
                            <i class="fas fa-filter me-1"></i>
                            Filtros de Búsqueda
                        </div>
                        <div class="card-body">
                            <form id="formFiltros" class="row g-3">
                                <div class="col-md-4">
                                    <label for="filtroFechaDesde" class="form-label">Fecha Desde</label>
                                    <input type="date" class="form-control" id="filtroFechaDesde">
                                </div>
                                <div class="col-md-4">
                                    <label for="filtroFechaHasta" class="form-label">Fecha Hasta</label>
                                    <input type="date" class="form-control" id="filtroFechaHasta">
                                </div>
                                <div class="col-md-4">
                                    <label for="filtroTexto" class="form-label">Buscar</label>
                                    <input type="text" class="form-control" id="filtroTexto" placeholder="Nº exp., asunto, remitente...">
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
                                <i class="fas fa-list me-1"></i>
                                Documentos En Proceso de Atención
                            </div>
                            <div>
                                <button class="btn btn-sm btn-outline-primary" id="btnExportar">
                                    <i class="fas fa-file-export me-1"></i>Exportar
                                </button>
                            </div>
                        </div>
                        <div class="card-body">
                            <div class="table-responsive">
                                <table class="table table-bordered table-hover">
                                    <thead>
                                        <tr>
                                            <th>#</th>
                                            <th>Nº Expediente</th>
                                            <th>Asunto</th>
                                            <th>Remitente</th>
                                            <th>Fecha Recepción</th>
                                            <th>Área Actual</th>
                                            <th>Tiempo en Proceso</th>
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
            console.error('[DocumentosEnProceso] Error al renderizar vista:', error);
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

        // Botones de acción
        this.setupActionButtons(container);

        // Exportar
        const btnExportar = container.querySelector('#btnExportar');
        if (btnExportar) {
            btnExportar.addEventListener('click', () => this.exportarDocumentos());
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

        // Botones para ver trazabilidad
        const trazabilidadButtons = container.querySelectorAll('.btn-trazabilidad');
        trazabilidadButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const documentoId = btn.getAttribute('data-id');
                this.verTrazabilidad(documentoId);
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
        const areas = [
            'Departamento de Balística',
            'Laboratorio de ADN',
            'Departamento de Pericias',
            'Departamento de Documentoscopía',
            'Laboratorio Químico'
        ];
        
        return Array.from({ length: 15 }, (_, i) => {
            const fechaRecepcion = new Date();
            fechaRecepcion.setDate(fechaRecepcion.getDate() - Math.floor(Math.random() * 30));
            
            const fechaInicioProceso = new Date(fechaRecepcion);
            fechaInicioProceso.setDate(fechaInicioProceso.getDate() + Math.floor(Math.random() * 3) + 1);
            
            const diasProceso = Math.floor((new Date() - fechaInicioProceso) / (1000 * 60 * 60 * 24));
            
            return {
                id: (i + 1).toString(),
                numeroExpediente: `EXP-2023-${1000 + i}`,
                asunto: this.getAsuntoAleatorio(),
                remitente: this.getRemitenteAleatorio(),
                fechaRecepcion: fechaRecepcion.toISOString().split('T')[0],
                areaActual: areas[Math.floor(Math.random() * areas.length)],
                fechaInicioProceso: fechaInicioProceso.toISOString().split('T')[0],
                diasProceso: diasProceso,
                prioridad: Math.random() > 0.8 ? 'URGENTE' : 'NORMAL'
            };
        });
    }

    /**
     * Obtiene un asunto aleatorio para los datos de ejemplo
     * @returns {string} Asunto aleatorio
     */
    getAsuntoAleatorio() {
        const asuntos = [
            'Solicitud de análisis de huellas dactilares',
            'Requerimiento de pericia balística',
            'Peritaje documentoscópico de billetes',
            'Solicitud de análisis de muestras biológicas',
            'Verificación de autenticidad de documentos',
            'Análisis de residuos de disparo',
            'Peritaje de grabaciones de audio',
            'Análisis comparativo de escritura',
            'Estudio de muestras de pintura de vehículos',
            'Análisis toxicológico'
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
            return '<tr><td colspan="8" class="text-center">No hay documentos en proceso</td></tr>';
        }

        // Obtener los documentos de la página actual
        const inicio = (this.paginaActual - 1) * this.documentosPorPagina;
        const fin = inicio + this.documentosPorPagina;
        const documentosPagina = this.documentos.slice(inicio, fin);

        return documentosPagina.map((doc, index) => `
            <tr class="${doc.prioridad === 'URGENTE' ? 'table-warning' : ''}">
                <td>${inicio + index + 1}</td>
                <td>${doc.numeroExpediente}</td>
                <td>${doc.asunto}</td>
                <td>${doc.remitente}</td>
                <td>${this.formatDate(doc.fechaRecepcion)}</td>
                <td>${doc.areaActual}</td>
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
                        <button type="button" class="btn btn-info btn-trazabilidad" data-id="${doc.id}" title="Ver trazabilidad">
                            <i class="fas fa-route"></i>
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
        
        // Actualizar filtros
        this.filtros = {
            estado: 'EN_PROCESO',
            fechaDesde,
            fechaHasta,
            texto
        };
        
        // Recargar documentos (en un caso real, haríamos una solicitud al servidor)
        this.paginaActual = 1;
        this.cargarDocumentos().then(() => {
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
            
            // Reconfigurar eventos
            this.setupActionButtons(container);
            this.setupPaginationEvents(container);
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
            estado: 'EN_PROCESO',
            fechaDesde: '',
            fechaHasta: '',
            texto: ''
        };
        
        // Recargar documentos
        this.aplicarFiltros(container);
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
        
        // Reconfigurar eventos
        this.setupActionButtons(container);
        this.setupPaginationEvents(container);
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
                        <p><strong>Fecha de recepción:</strong> ${this.formatDate(documento.fechaRecepcion)}</p>
                        <p><strong>Área actual:</strong> ${documento.areaActual}</p>
                        <p><strong>Inicio de proceso:</strong> ${this.formatDate(documento.fechaInicioProceso)}</p>
                        <p><strong>Tiempo en proceso:</strong> ${documento.diasProceso} días</p>
                        <p><strong>Prioridad:</strong> ${documento.prioridad}</p>
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
     * Ver trazabilidad de un documento
     * @param {string} id - ID del documento
     */
    verTrazabilidad(id) {
        const documento = this.documentos.find(doc => doc.id === id);
        if (!documento) return;
        
        // En un escenario real, redirigiriamos a la vista de trazabilidad con el ID
        // Por ahora, solo mostramos un mensaje
        
        if (window.Swal) {
            window.Swal.fire({
                title: 'Ver Trazabilidad',
                text: `Redirigiendo a la trazabilidad del documento ${documento.numeroExpediente}`,
                icon: 'info',
                showCancelButton: true,
                confirmButtonText: 'Ir a Trazabilidad',
                cancelButtonText: 'Cancelar'
            }).then((result) => {
                if (result.isConfirmed) {
                    // Cambiar a la vista de trazabilidad
                    window.location.hash = 'trazabilidad';
                }
            });
        } else {
            if (confirm(`¿Desea ver la trazabilidad del documento ${documento.numeroExpediente}?`)) {
                window.location.hash = 'trazabilidad';
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
                text: 'Seleccione el formato para exportar los documentos en proceso',
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
     * Obtiene la clase CSS para el badge según los días en proceso
     * @param {number} dias - Días en proceso
     * @returns {string} Clase CSS
     */
    getBadgeClassForDias(dias) {
        if (dias <= 5) return 'bg-success';
        if (dias <= 15) return 'bg-warning';
        return 'bg-danger';
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