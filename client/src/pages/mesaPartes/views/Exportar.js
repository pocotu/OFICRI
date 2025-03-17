/**
 * Vista de Exportación de Reportes
 * Permite generar y exportar diferentes tipos de reportes sobre expedientes
 */

export class Exportar {
    constructor() {
        // Inicializar propiedades
        this.tipoReporte = 'documentos';
        this.formatoExportacion = 'excel';
        this.filtros = {
            fechaDesde: this.getPrimerDiaMes(),
            fechaHasta: this.getHoy(),
            estado: '',
            area: ''
        };
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
                    <p class="mt-3">Cargando módulo de exportación...</p>
                </div>
            `;

            // Cargar opciones (simulado)
            await this.cargarOpciones();

            // Contenido principal
            container.innerHTML = `
                <div class="main-wrapper" style="position:relative; width:100%; overflow:hidden;">
                    <style>
                        /* Estilos específicos para esta vista */
                        .main-wrapper *[style*="color: #084298;"] { display: none !important; }
                        .main-wrapper *[style*="background-color: #cfe2ff;"] { display: none !important; }
                    </style>
                
                    <h1 class="text-center fw-bold my-4" style="color:#084298;">Exportar Reportes</h1>
                    
                    <div class="container-fluid px-4">
                        <div class="row">
                            <div class="col-md-4">
                                <div class="card mb-4">
                                    <div class="card-header">
                                        <i class="fas fa-file-alt me-1"></i>
                                        Tipo de Reporte
                                    </div>
                                    <div class="card-body">
                                        <div class="list-group" id="tiposReporte">
                                            <a href="#" class="list-group-item list-group-item-action active" data-tipo="documentos">
                                                <i class="fas fa-file-contract me-2"></i>
                                                Documentos Recibidos
                                                <small class="d-block text-muted">Listado de todos los documentos recibidos en un periodo</small>
                                            </a>
                                            <a href="#" class="list-group-item list-group-item-action" data-tipo="documentos-pendientes">
                                                <i class="fas fa-clipboard-list me-2"></i>
                                                Documentos Pendientes
                                                <small class="d-block text-muted">Documentos en proceso de atención</small>
                                            </a>
                                            <a href="#" class="list-group-item list-group-item-action" data-tipo="documentos-completados">
                                                <i class="fas fa-clipboard-check me-2"></i>
                                                Documentos Completados
                                                <small class="d-block text-muted">Documentos que han completado su procesamiento</small>
                                            </a>
                                            <a href="#" class="list-group-item list-group-item-action" data-tipo="derivaciones">
                                                <i class="fas fa-exchange-alt me-2"></i>
                                                Derivaciones
                                                <small class="d-block text-muted">Movimientos de documentos entre áreas</small>
                                            </a>
                                            <a href="#" class="list-group-item list-group-item-action" data-tipo="estadisticas">
                                                <i class="fas fa-chart-pie me-2"></i>
                                                Estadísticas
                                                <small class="d-block text-muted">Resumen estadístico de documentos</small>
                                            </a>
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="card mb-4">
                                    <div class="card-header">
                                        <i class="fas fa-file-export me-1"></i>
                                        Formato de Exportación
                                    </div>
                                    <div class="card-body">
                                        <div class="row">
                                            <div class="col-6">
                                                <div class="form-check">
                                                    <input class="form-check-input" type="radio" name="formatoExportacion" id="formatoExcel" value="excel" checked>
                                                    <label class="form-check-label" for="formatoExcel">
                                                        <i class="fas fa-file-excel text-success me-1"></i> Excel
                                                    </label>
                                                </div>
                                            </div>
                                            <div class="col-6">
                                                <div class="form-check">
                                                    <input class="form-check-input" type="radio" name="formatoExportacion" id="formatoPdf" value="pdf">
                                                    <label class="form-check-label" for="formatoPdf">
                                                        <i class="fas fa-file-pdf text-danger me-1"></i> PDF
                                                    </label>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="col-md-8">
                                <div class="card mb-4">
                                    <div class="card-header">
                                        <i class="fas fa-filter me-1"></i>
                                        Filtros del Reporte
                                    </div>
                                    <div class="card-body">
                                        <form id="formFiltros" class="row g-3">
                                            <div class="col-md-6">
                                                <label for="fechaDesde" class="form-label">Fecha Desde</label>
                                                <input type="date" class="form-control" id="fechaDesde" value="${this.filtros.fechaDesde}">
                                            </div>
                                            <div class="col-md-6">
                                                <label for="fechaHasta" class="form-label">Fecha Hasta</label>
                                                <input type="date" class="form-control" id="fechaHasta" value="${this.filtros.fechaHasta}">
                                            </div>
                                            
                                            <div class="col-md-6">
                                                <label for="selectEstado" class="form-label">Estado</label>
                                                <select class="form-select" id="selectEstado">
                                                    <option value="">Todos</option>
                                                    <option value="RECIBIDO">Recibido</option>
                                                    <option value="EN_PROCESO">En Proceso</option>
                                                    <option value="DERIVADO">Derivado</option>
                                                    <option value="COMPLETADO">Completado</option>
                                                </select>
                                            </div>
                                            
                                            <div class="col-md-6">
                                                <label for="selectArea" class="form-label">Área</label>
                                                <select class="form-select" id="selectArea">
                                                    <option value="">Todas</option>
                                                    <option value="MESA_PARTES">Mesa de Partes</option>
                                                    <option value="BALISTICA">Departamento de Balística</option>
                                                    <option value="LAB_ADN">Laboratorio de ADN</option>
                                                    <option value="PERICIAS">Departamento de Pericias</option>
                                                    <option value="DOCUMENTOSCOPIA">Departamento de Documentoscopía</option>
                                                    <option value="LAB_QUIMICO">Laboratorio Químico</option>
                                                </select>
                                            </div>
                                            
                                            <div id="filtrosAdicionales">
                                                <!-- Filtros adicionales según el tipo de reporte seleccionado -->
                                            </div>
                                        </form>
                                    </div>
                                </div>
                                
                                <div class="card mb-4">
                                    <div class="card-header">
                                        <i class="fas fa-eye me-1"></i>
                                        Vista Previa
                                    </div>
                                    <div class="card-body">
                                        <div id="vistaPrevia" class="report-preview">
                                            ${this.renderVistaPrevia()}
                                        </div>
                                    </div>
                                    <div class="card-footer text-end">
                                        <button type="button" class="btn btn-secondary me-2" id="btnActualizar">
                                            <i class="fas fa-sync-alt me-1"></i>Actualizar Vista Previa
                                        </button>
                                        <button type="button" class="btn btn-primary" id="btnExportar">
                                            <i class="fas fa-file-export me-1"></i>Exportar Reporte
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            // Configurar eventos
            this.setupEventListeners(container);
        } catch (error) {
            console.error('[Exportar] Error al renderizar vista:', error);
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
        // Selección de tipo de reporte
        const tiposReporte = container.querySelector('#tiposReporte');
        if (tiposReporte) {
            tiposReporte.addEventListener('click', (e) => {
                e.preventDefault();
                const item = e.target.closest('.list-group-item-action');
                if (item) {
                    // Actualizar selección visual
                    tiposReporte.querySelectorAll('.list-group-item-action').forEach(el => {
                        el.classList.remove('active');
                    });
                    item.classList.add('active');
                    
                    // Actualizar tipo de reporte seleccionado
                    this.tipoReporte = item.dataset.tipo;
                    
                    // Actualizar filtros adicionales y vista previa
                    this.actualizarFiltrosAdicionales(container);
                    this.actualizarVistaPrevia(container);
                }
            });
        }

        // Cambio de formato de exportación
        const formatosExportacion = container.querySelectorAll('input[name="formatoExportacion"]');
        formatosExportacion.forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.formatoExportacion = e.target.value;
            });
        });

        // Actualizar vista previa
        const btnActualizar = container.querySelector('#btnActualizar');
        if (btnActualizar) {
            btnActualizar.addEventListener('click', () => {
                this.recogerFiltros(container);
                this.actualizarVistaPrevia(container);
            });
        }

        // Exportar reporte
        const btnExportar = container.querySelector('#btnExportar');
        if (btnExportar) {
            btnExportar.addEventListener('click', () => {
                this.recogerFiltros(container);
                this.exportarReporte();
            });
        }
    }

    /**
     * Actualiza los filtros adicionales según el tipo de reporte
     * @param {HTMLElement} container - Contenedor de la vista
     */
    actualizarFiltrosAdicionales(container) {
        const filtrosAdicionales = container.querySelector('#filtrosAdicionales');
        if (!filtrosAdicionales) return;
        
        let html = '';
        
        switch (this.tipoReporte) {
            case 'documentos':
                html = `
                    <div class="col-md-6">
                        <label for="selectTipo" class="form-label">Tipo de Documento</label>
                        <select class="form-select" id="selectTipo">
                            <option value="">Todos</option>
                            <option value="OFICIO">Oficio</option>
                            <option value="MEMORANDO">Memorando</option>
                            <option value="INFORME">Informe</option>
                            <option value="SOLICITUD">Solicitud</option>
                            <option value="OTROS">Otros</option>
                        </select>
                    </div>
                    <div class="col-md-6">
                        <label for="selectPrioridad" class="form-label">Prioridad</label>
                        <select class="form-select" id="selectPrioridad">
                            <option value="">Todas</option>
                            <option value="NORMAL">Normal</option>
                            <option value="URGENTE">Urgente</option>
                            <option value="MUY_URGENTE">Muy Urgente</option>
                        </select>
                    </div>
                `;
                break;
                
            case 'estadisticas':
                html = `
                    <div class="col-md-6">
                        <label for="selectAgrupacion" class="form-label">Agrupar por</label>
                        <select class="form-select" id="selectAgrupacion">
                            <option value="ESTADO">Estado</option>
                            <option value="AREA">Área</option>
                            <option value="TIPO_DOCUMENTO">Tipo de Documento</option>
                            <option value="MES">Mes</option>
                        </select>
                    </div>
                    <div class="col-md-6">
                        <label for="selectGrafico" class="form-label">Tipo de Gráfico</label>
                        <select class="form-select" id="selectGrafico">
                            <option value="PIE">Circular</option>
                            <option value="BAR">Barras</option>
                            <option value="LINE">Líneas</option>
                        </select>
                    </div>
                `;
                break;
                
            case 'derivaciones':
                html = `
                    <div class="col-md-12">
                        <label for="selectTipoMovimiento" class="form-label">Tipo de Movimiento</label>
                        <select class="form-select" id="selectTipoMovimiento">
                            <option value="">Todos</option>
                            <option value="DERIVACION">Derivación</option>
                            <option value="DEVOLUCION">Devolución</option>
                            <option value="FINALIZACION">Finalización</option>
                        </select>
                    </div>
                `;
                break;
                
            case 'documentos-pendientes':
            case 'documentos-completados':
                html = `
                    <div class="col-md-6">
                        <label for="inputDiasProceso" class="form-label">Días en Proceso</label>
                        <select class="form-select" id="selectDiasProceso">
                            <option value="">Todos</option>
                            <option value="0-5">0-5 días</option>
                            <option value="6-15">6-15 días</option>
                            <option value="16-30">16-30 días</option>
                            <option value="30+">Más de 30 días</option>
                        </select>
                    </div>
                    <div class="col-md-6">
                        <label for="selectOrden" class="form-label">Ordenar por</label>
                        <select class="form-select" id="selectOrden">
                            <option value="fecha_desc">Fecha (más reciente)</option>
                            <option value="fecha_asc">Fecha (más antiguo)</option>
                            <option value="dias_desc">Días en proceso (mayor)</option>
                            <option value="dias_asc">Días en proceso (menor)</option>
                        </select>
                    </div>
                `;
                break;
        }
        
        filtrosAdicionales.innerHTML = html;
    }

    /**
     * Recoge los valores de los filtros del formulario
     * @param {HTMLElement} container - Contenedor de la vista
     */
    recogerFiltros(container) {
        const fechaDesde = container.querySelector('#fechaDesde').value;
        const fechaHasta = container.querySelector('#fechaHasta').value;
        const estado = container.querySelector('#selectEstado').value;
        const area = container.querySelector('#selectArea').value;
        
        this.filtros = {
            fechaDesde,
            fechaHasta,
            estado,
            area
        };
        
        // Recoger filtros adicionales según el tipo de reporte
        switch (this.tipoReporte) {
            case 'documentos':
                this.filtros.tipoDocumento = container.querySelector('#selectTipo')?.value || '';
                this.filtros.prioridad = container.querySelector('#selectPrioridad')?.value || '';
                break;
                
            case 'estadisticas':
                this.filtros.agrupacion = container.querySelector('#selectAgrupacion')?.value || 'ESTADO';
                this.filtros.tipoGrafico = container.querySelector('#selectGrafico')?.value || 'PIE';
                break;
                
            case 'derivaciones':
                this.filtros.tipoMovimiento = container.querySelector('#selectTipoMovimiento')?.value || '';
                break;
                
            case 'documentos-pendientes':
            case 'documentos-completados':
                this.filtros.diasProceso = container.querySelector('#selectDiasProceso')?.value || '';
                this.filtros.orden = container.querySelector('#selectOrden')?.value || 'fecha_desc';
                break;
        }
    }

    /**
     * Actualiza la vista previa del reporte
     * @param {HTMLElement} container - Contenedor de la vista
     */
    actualizarVistaPrevia(container) {
        const vistaPrevia = container.querySelector('#vistaPrevia');
        if (!vistaPrevia) return;
        
        // Mostrar spinner mientras se carga
        vistaPrevia.innerHTML = `
            <div class="text-center my-3">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Cargando vista previa...</span>
                </div>
                <p class="mt-2">Generando vista previa...</p>
            </div>
        `;
        
        // Simular carga de datos
        setTimeout(() => {
            vistaPrevia.innerHTML = this.renderVistaPrevia();
        }, 800);
    }

    /**
     * Renderiza la vista previa según el tipo de reporte
     * @returns {string} HTML de la vista previa
     */
    renderVistaPrevia() {
        switch (this.tipoReporte) {
            case 'documentos':
                return this.renderVistaDocumentos();
            case 'documentos-pendientes':
                return this.renderVistaDocumentosPendientes();
            case 'documentos-completados':
                return this.renderVistaDocumentosCompletados();
            case 'derivaciones':
                return this.renderVistaDerivaciones();
            case 'estadisticas':
                return this.renderVistaEstadisticas();
            default:
                return '<div class="text-center text-muted py-5">Seleccione un tipo de reporte</div>';
        }
    }

    /**
     * Renderiza la vista previa de documentos
     * @returns {string} HTML de la vista previa
     */
    renderVistaDocumentos() {
        return `
            <div class="mb-3">
                <h5>Documentos Recibidos</h5>
                <p class="text-muted">Periodo: ${this.formatDate(this.filtros.fechaDesde)} - ${this.formatDate(this.filtros.fechaHasta)}</p>
            </div>
            
            <div class="table-responsive">
                <table class="table table-sm table-bordered">
                    <thead class="table-light">
                        <tr>
                            <th>Nº Expediente</th>
                            <th>Asunto</th>
                            <th>Remitente</th>
                            <th>Fecha</th>
                            <th>Estado</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>EXP-2023-1001</td>
                            <td>Solicitud de informe pericial</td>
                            <td>Fiscalía Provincial</td>
                            <td>01/03/2023</td>
                            <td><span class="badge bg-success">Completado</span></td>
                        </tr>
                        <tr>
                            <td>EXP-2023-1002</td>
                            <td>Análisis de muestras biológicas</td>
                            <td>División de Investigación Criminal</td>
                            <td>03/03/2023</td>
                            <td><span class="badge bg-primary">Recibido</span></td>
                        </tr>
                        <tr>
                            <td>EXP-2023-1003</td>
                            <td>Peritaje balístico</td>
                            <td>Comisaría de San Isidro</td>
                            <td>05/03/2023</td>
                            <td><span class="badge bg-info">Derivado</span></td>
                        </tr>
                        <tr>
                            <td>EXP-2023-1004</td>
                            <td>Dictamen documentoscópico</td>
                            <td>Juzgado Penal</td>
                            <td>10/03/2023</td>
                            <td><span class="badge bg-warning">En Proceso</span></td>
                        </tr>
                        <tr>
                            <td>EXP-2023-1005</td>
                            <td>Análisis de sustancias</td>
                            <td>Dirección Antidrogas</td>
                            <td>15/03/2023</td>
                            <td><span class="badge bg-warning">En Proceso</span></td>
                        </tr>
                    </tbody>
                </table>
            </div>
            
            <div class="text-muted small">
                <p class="mb-0">Vista previa: Mostrando 5 de 25 registros encontrados.</p>
            </div>
        `;
    }

    /**
     * Renderiza la vista previa de documentos pendientes
     * @returns {string} HTML de la vista previa
     */
    renderVistaDocumentosPendientes() {
        return `
            <div class="mb-3">
                <h5>Documentos Pendientes</h5>
                <p class="text-muted">Periodo: ${this.formatDate(this.filtros.fechaDesde)} - ${this.formatDate(this.filtros.fechaHasta)}</p>
            </div>
            
            <div class="table-responsive">
                <table class="table table-sm table-bordered">
                    <thead class="table-light">
                        <tr>
                            <th>Nº Expediente</th>
                            <th>Asunto</th>
                            <th>Área Actual</th>
                            <th>Fecha Recepción</th>
                            <th>Días en Proceso</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>EXP-2023-1004</td>
                            <td>Dictamen documentoscópico</td>
                            <td>Departamento de Documentoscopía</td>
                            <td>10/03/2023</td>
                            <td><span class="badge bg-warning">12 días</span></td>
                        </tr>
                        <tr>
                            <td>EXP-2023-1005</td>
                            <td>Análisis de sustancias</td>
                            <td>Laboratorio Químico</td>
                            <td>15/03/2023</td>
                            <td><span class="badge bg-success">7 días</span></td>
                        </tr>
                        <tr>
                            <td>EXP-2023-1008</td>
                            <td>Peritaje de audio</td>
                            <td>Departamento de Pericias</td>
                            <td>18/03/2023</td>
                            <td><span class="badge bg-success">4 días</span></td>
                        </tr>
                    </tbody>
                </table>
            </div>
            
            <div class="text-muted small">
                <p class="mb-0">Vista previa: Mostrando 3 de 10 registros encontrados.</p>
            </div>
        `;
    }

    /**
     * Renderiza la vista previa de documentos completados
     * @returns {string} HTML de la vista previa
     */
    renderVistaDocumentosCompletados() {
        return `
            <div class="mb-3">
                <h5>Documentos Completados</h5>
                <p class="text-muted">Periodo: ${this.formatDate(this.filtros.fechaDesde)} - ${this.formatDate(this.filtros.fechaHasta)}</p>
            </div>
            
            <div class="table-responsive">
                <table class="table table-sm table-bordered">
                    <thead class="table-light">
                        <tr>
                            <th>Nº Expediente</th>
                            <th>Asunto</th>
                            <th>Fecha Recepción</th>
                            <th>Fecha Completado</th>
                            <th>Tiempo Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>EXP-2023-1001</td>
                            <td>Solicitud de informe pericial</td>
                            <td>01/03/2023</td>
                            <td>10/03/2023</td>
                            <td><span class="badge bg-success">9 días</span></td>
                        </tr>
                        <tr>
                            <td>EXP-2023-1003</td>
                            <td>Peritaje balístico</td>
                            <td>05/03/2023</td>
                            <td>15/03/2023</td>
                            <td><span class="badge bg-info">10 días</span></td>
                        </tr>
                        <tr>
                            <td>EXP-2023-1006</td>
                            <td>Análisis dactiloscópico</td>
                            <td>12/03/2023</td>
                            <td>20/03/2023</td>
                            <td><span class="badge bg-info">8 días</span></td>
                        </tr>
                    </tbody>
                </table>
            </div>
            
            <div class="text-muted small">
                <p class="mb-0">Vista previa: Mostrando 3 de 12 registros encontrados.</p>
            </div>
        `;
    }

    /**
     * Renderiza la vista previa de derivaciones
     * @returns {string} HTML de la vista previa
     */
    renderVistaDerivaciones() {
        return `
            <div class="mb-3">
                <h5>Derivaciones de Documentos</h5>
                <p class="text-muted">Periodo: ${this.formatDate(this.filtros.fechaDesde)} - ${this.formatDate(this.filtros.fechaHasta)}</p>
            </div>
            
            <div class="table-responsive">
                <table class="table table-sm table-bordered">
                    <thead class="table-light">
                        <tr>
                            <th>Nº Expediente</th>
                            <th>Fecha</th>
                            <th>Tipo</th>
                            <th>Origen</th>
                            <th>Destino</th>
                            <th>Usuario</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>EXP-2023-1004</td>
                            <td>10/03/2023 10:25</td>
                            <td>Derivación</td>
                            <td>Mesa de Partes</td>
                            <td>Departamento de Documentoscopía</td>
                            <td>Marisol Huaylla</td>
                        </tr>
                        <tr>
                            <td>EXP-2023-1001</td>
                            <td>01/03/2023 15:40</td>
                            <td>Derivación</td>
                            <td>Mesa de Partes</td>
                            <td>Laboratorio Químico</td>
                            <td>Marisol Huaylla</td>
                        </tr>
                        <tr>
                            <td>EXP-2023-1001</td>
                            <td>10/03/2023 09:15</td>
                            <td>Devolución</td>
                            <td>Laboratorio Químico</td>
                            <td>Mesa de Partes</td>
                            <td>Juan Pérez</td>
                        </tr>
                        <tr>
                            <td>EXP-2023-1005</td>
                            <td>15/03/2023 11:30</td>
                            <td>Derivación</td>
                            <td>Mesa de Partes</td>
                            <td>Laboratorio Químico</td>
                            <td>Marisol Huaylla</td>
                        </tr>
                    </tbody>
                </table>
            </div>
            
            <div class="text-muted small">
                <p class="mb-0">Vista previa: Mostrando 4 de 18 registros encontrados.</p>
            </div>
        `;
    }

    /**
     * Renderiza la vista previa de estadísticas
     * @returns {string} HTML de la vista previa
     */
    renderVistaEstadisticas() {
        return `
            <div class="mb-3">
                <h5>Estadísticas por Estado</h5>
                <p class="text-muted">Periodo: ${this.formatDate(this.filtros.fechaDesde)} - ${this.formatDate(this.filtros.fechaHasta)}</p>
            </div>
            
            <div class="row">
                <div class="col-md-7">
                    <div class="table-responsive">
                        <table class="table table-sm table-bordered">
                            <thead class="table-light">
                                <tr>
                                    <th>Estado</th>
                                    <th>Cantidad</th>
                                    <th>Porcentaje</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>Recibido</td>
                                    <td>8</td>
                                    <td>20%</td>
                                </tr>
                                <tr>
                                    <td>En Proceso</td>
                                    <td>15</td>
                                    <td>37.5%</td>
                                </tr>
                                <tr>
                                    <td>Derivado</td>
                                    <td>5</td>
                                    <td>12.5%</td>
                                </tr>
                                <tr>
                                    <td>Completado</td>
                                    <td>12</td>
                                    <td>30%</td>
                                </tr>
                                <tr class="table-secondary">
                                    <td><strong>Total</strong></td>
                                    <td><strong>40</strong></td>
                                    <td><strong>100%</strong></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
                
                <div class="col-md-5">
                    <div class="chart-placeholder text-center">
                        <div class="mb-3">
                            <i class="fas fa-chart-pie fa-5x text-primary opacity-50"></i>
                        </div>
                        <p class="text-muted">Gráfico de distribución por estado</p>
                    </div>
                </div>
            </div>
            
            <div class="text-muted small mt-3">
                <p class="mb-0">Nota: En el reporte final se incluirá el gráfico correspondiente.</p>
            </div>
        `;
    }

    /**
     * Simula la exportación del reporte
     */
    exportarReporte() {
        // En un caso real, aquí llamaríamos a la API para generar el reporte
        
        if (window.Swal) {
            window.Swal.fire({
                title: 'Generando Reporte',
                text: 'Preparando la exportación del reporte...',
                icon: 'info',
                timer: 1500,
                timerProgressBar: true,
                showConfirmButton: false
            }).then(() => {
                window.Swal.fire({
                    title: 'Reporte Generado',
                    text: `El reporte ha sido exportado en formato ${this.formatoExportacion.toUpperCase()}`,
                    icon: 'success',
                    confirmButtonText: 'Aceptar'
                });
            });
        } else {
            alert('Generando reporte...');
            setTimeout(() => {
                alert(`El reporte ha sido exportado en formato ${this.formatoExportacion.toUpperCase()}`);
            }, 1500);
        }
    }

    /**
     * Cargar opciones (simulado)
     */
    async cargarOpciones() {
        // Simular carga de opciones desde el servidor
        return new Promise(resolve => {
            setTimeout(() => {
                resolve(true);
            }, 500);
        });
    }

    /**
     * Obtiene la fecha actual en formato YYYY-MM-DD
     * @returns {string} Fecha actual
     */
    getHoy() {
        const today = new Date();
        return today.toISOString().split('T')[0];
    }

    /**
     * Obtiene el primer día del mes actual en formato YYYY-MM-DD
     * @returns {string} Primer día del mes
     */
    getPrimerDiaMes() {
        const today = new Date();
        const primerDia = new Date(today.getFullYear(), today.getMonth(), 1);
        return primerDia.toISOString().split('T')[0];
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