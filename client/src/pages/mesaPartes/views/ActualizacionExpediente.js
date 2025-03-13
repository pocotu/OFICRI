/**
 * Vista de Actualización de Expediente
 * Permite actualizar información de expedientes existentes
 */

export class ActualizacionExpediente {
    constructor() {
        // Inicializar propiedades
        this.expedientes = [];
        this.expedienteSeleccionado = null;
        this.formData = {
            numeroExpediente: '',
            remitente: '',
            asunto: '',
            fechaRecepcion: '',
            prioridad: 'NORMAL',
            tipoDocumento: '',
            folios: '',
            observaciones: '',
            estado: ''
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
                    <p class="mt-3">Cargando formulario de actualización...</p>
                </div>
            `;

            // En un caso real, aquí cargaríamos los expedientes desde el servidor
            // Por ahora usamos datos de ejemplo
            await this.cargarExpedientes();

            // Contenido principal
            container.innerHTML = `
                <div class="container-fluid px-4">
                    <h2 class="mt-4 mb-4">Actualización de Expediente</h2>
                    
                    <div class="row">
                        <div class="col-md-5">
                            <div class="card mb-4">
                                <div class="card-header">
                                    <i class="fas fa-search me-1"></i>
                                    Buscar Expediente
                                </div>
                                <div class="card-body">
                                    <div class="mb-3">
                                        <label for="searchExpediente" class="form-label">Número de Expediente</label>
                                        <div class="input-group">
                                            <input type="text" class="form-control" id="searchExpediente" placeholder="Ingrese número de expediente">
                                            <button class="btn btn-primary" id="btnBuscarExpediente">
                                                <i class="fas fa-search"></i>
                                            </button>
                                        </div>
                                    </div>
                                    
                                    <div class="table-responsive">
                                        <table class="table table-bordered table-hover">
                                            <thead>
                                                <tr>
                                                    <th>Nº Expediente</th>
                                                    <th>Asunto</th>
                                                    <th>Fecha</th>
                                                    <th>Acción</th>
                                                </tr>
                                            </thead>
                                            <tbody id="expedientesTable">
                                                ${this.renderTablaExpedientes()}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="col-md-7">
                            <div class="card mb-4">
                                <div class="card-header">
                                    <i class="fas fa-edit me-1"></i>
                                    Actualizar Datos del Expediente
                                </div>
                                <div class="card-body">
                                    <form id="formActualizacion">
                                        <div class="row mb-3">
                                            <div class="col-md-6">
                                                <label for="numeroExpediente" class="form-label">Número de Expediente</label>
                                                <input type="text" class="form-control" id="numeroExpediente" disabled>
                                            </div>
                                            <div class="col-md-6">
                                                <label for="fechaRecepcion" class="form-label">Fecha de Recepción</label>
                                                <input type="date" class="form-control" id="fechaRecepcion">
                                            </div>
                                        </div>
                                        
                                        <div class="mb-3">
                                            <label for="remitente" class="form-label">Remitente</label>
                                            <input type="text" class="form-control" id="remitente">
                                        </div>
                                        
                                        <div class="mb-3">
                                            <label for="asunto" class="form-label">Asunto</label>
                                            <input type="text" class="form-control" id="asunto">
                                        </div>
                                        
                                        <div class="row mb-3">
                                            <div class="col-md-6">
                                                <label for="tipoDocumento" class="form-label">Tipo de Documento</label>
                                                <select class="form-select" id="tipoDocumento">
                                                    <option value="">Seleccione...</option>
                                                    <option value="OFICIO">Oficio</option>
                                                    <option value="MEMORANDO">Memorando</option>
                                                    <option value="INFORME">Informe</option>
                                                    <option value="SOLICITUD">Solicitud</option>
                                                    <option value="OTROS">Otros</option>
                                                </select>
                                            </div>
                                            <div class="col-md-6">
                                                <label for="prioridad" class="form-label">Prioridad</label>
                                                <select class="form-select" id="prioridad">
                                                    <option value="NORMAL">Normal</option>
                                                    <option value="URGENTE">Urgente</option>
                                                    <option value="MUY_URGENTE">Muy Urgente</option>
                                                </select>
                                            </div>
                                        </div>
                                        
                                        <div class="row mb-3">
                                            <div class="col-md-6">
                                                <label for="folios" class="form-label">Folios</label>
                                                <input type="number" class="form-control" id="folios" min="1">
                                            </div>
                                            <div class="col-md-6">
                                                <label for="estado" class="form-label">Estado</label>
                                                <select class="form-select" id="estado">
                                                    <option value="RECIBIDO">Recibido</option>
                                                    <option value="EN_PROCESO">En Proceso</option>
                                                    <option value="DERIVADO">Derivado</option>
                                                    <option value="COMPLETADO">Completado</option>
                                                </select>
                                            </div>
                                        </div>
                                        
                                        <div class="mb-3">
                                            <label for="observaciones" class="form-label">Observaciones</label>
                                            <textarea class="form-control" id="observaciones" rows="3"></textarea>
                                        </div>
                                        
                                        <div class="mb-3">
                                            <label for="archivoAdjunto" class="form-label">Adjuntar Archivo (opcional)</label>
                                            <input class="form-control" type="file" id="archivoAdjunto">
                                        </div>
                                        
                                        <div class="d-flex justify-content-end">
                                            <button type="button" class="btn btn-secondary me-2" id="btnCancelar">Cancelar</button>
                                            <button type="submit" class="btn btn-primary" id="btnGuardar">Guardar Cambios</button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            // Configurar eventos
            this.setupEventListeners(container);
        } catch (error) {
            console.error('[ActualizacionExpediente] Error al renderizar vista:', error);
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
        // Búsqueda de expediente
        const btnBuscar = container.querySelector('#btnBuscarExpediente');
        if (btnBuscar) {
            btnBuscar.addEventListener('click', () => this.buscarExpediente(container));
        }

        // Cancelar edición
        const btnCancelar = container.querySelector('#btnCancelar');
        if (btnCancelar) {
            btnCancelar.addEventListener('click', () => this.limpiarFormulario(container));
        }

        // Guardar cambios
        const formActualizacion = container.querySelector('#formActualizacion');
        if (formActualizacion) {
            formActualizacion.addEventListener('submit', (e) => {
                e.preventDefault();
                this.guardarCambios(container);
            });
        }

        // Eventos de selección de expediente en la tabla
        const tabla = container.querySelector('#expedientesTable');
        if (tabla) {
            tabla.addEventListener('click', (e) => {
                const btn = e.target.closest('.btn-editar');
                if (btn) {
                    const expedienteId = btn.dataset.id;
                    this.seleccionarExpediente(expedienteId, container);
                }
            });
        }
    }

    /**
     * Carga los expedientes (simulado)
     */
    async cargarExpedientes() {
        // Simulación de carga desde el servidor
        return new Promise(resolve => {
            setTimeout(() => {
                this.expedientes = [
                    {
                        id: '1',
                        numeroExpediente: 'EXP-2023-001',
                        remitente: 'Dirección General PNP',
                        asunto: 'Solicitud de informes criminalísticos',
                        fechaRecepcion: '2023-03-10',
                        prioridad: 'NORMAL',
                        tipoDocumento: 'OFICIO',
                        folios: 15,
                        observaciones: 'Requiere atención dentro del plazo establecido',
                        estado: 'RECIBIDO'
                    },
                    {
                        id: '2',
                        numeroExpediente: 'EXP-2023-002',
                        remitente: 'Fiscalía Provincial',
                        asunto: 'Solicitud de pericia balística',
                        fechaRecepcion: '2023-03-12',
                        prioridad: 'URGENTE',
                        tipoDocumento: 'SOLICITUD',
                        folios: 8,
                        observaciones: 'Caso en investigación preliminar',
                        estado: 'EN_PROCESO'
                    },
                    {
                        id: '3',
                        numeroExpediente: 'EXP-2023-003',
                        remitente: 'Juzgado Penal',
                        asunto: 'Requerimiento de análisis dactiloscópico',
                        fechaRecepcion: '2023-03-15',
                        prioridad: 'MUY_URGENTE',
                        tipoDocumento: 'OFICIO',
                        folios: 12,
                        observaciones: 'Plazo de 48 horas para respuesta',
                        estado: 'DERIVADO'
                    }
                ];
                resolve(this.expedientes);
            }, 500);
        });
    }

    /**
     * Renderiza la tabla de expedientes
     * @returns {string} HTML de la tabla
     */
    renderTablaExpedientes() {
        if (this.expedientes.length === 0) {
            return '<tr><td colspan="4" class="text-center">No hay expedientes disponibles</td></tr>';
        }

        return this.expedientes.map(exp => `
            <tr>
                <td>${exp.numeroExpediente}</td>
                <td>${exp.asunto.length > 30 ? exp.asunto.substring(0, 30) + '...' : exp.asunto}</td>
                <td>${this.formatDate(exp.fechaRecepcion)}</td>
                <td>
                    <button class="btn btn-sm btn-primary btn-editar" data-id="${exp.id}">
                        <i class="fas fa-edit"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    }

    /**
     * Busca un expediente por número
     * @param {HTMLElement} container - Contenedor de la vista
     */
    buscarExpediente(container) {
        const searchInput = container.querySelector('#searchExpediente');
        const tabla = container.querySelector('#expedientesTable');
        
        if (!searchInput || !tabla) return;
        
        const query = searchInput.value.trim().toLowerCase();
        
        if (query === '') {
            tabla.innerHTML = this.renderTablaExpedientes();
            return;
        }
        
        const filtrados = this.expedientes.filter(exp => 
            exp.numeroExpediente.toLowerCase().includes(query) ||
            exp.asunto.toLowerCase().includes(query)
        );
        
        if (filtrados.length === 0) {
            tabla.innerHTML = '<tr><td colspan="4" class="text-center">No se encontraron resultados</td></tr>';
        } else {
            tabla.innerHTML = filtrados.map(exp => `
                <tr>
                    <td>${exp.numeroExpediente}</td>
                    <td>${exp.asunto.length > 30 ? exp.asunto.substring(0, 30) + '...' : exp.asunto}</td>
                    <td>${this.formatDate(exp.fechaRecepcion)}</td>
                    <td>
                        <button class="btn btn-sm btn-primary btn-editar" data-id="${exp.id}">
                            <i class="fas fa-edit"></i>
                        </button>
                    </td>
                </tr>
            `).join('');
        }
    }

    /**
     * Selecciona un expediente para editar
     * @param {string} id - ID del expediente
     * @param {HTMLElement} container - Contenedor de la vista
     */
    seleccionarExpediente(id, container) {
        this.expedienteSeleccionado = this.expedientes.find(exp => exp.id === id);
        
        if (!this.expedienteSeleccionado) return;
        
        // Cargar datos en el formulario
        const form = container.querySelector('#formActualizacion');
        if (!form) return;
        
        form.querySelector('#numeroExpediente').value = this.expedienteSeleccionado.numeroExpediente;
        form.querySelector('#remitente').value = this.expedienteSeleccionado.remitente;
        form.querySelector('#asunto').value = this.expedienteSeleccionado.asunto;
        form.querySelector('#fechaRecepcion').value = this.expedienteSeleccionado.fechaRecepcion;
        form.querySelector('#tipoDocumento').value = this.expedienteSeleccionado.tipoDocumento;
        form.querySelector('#prioridad').value = this.expedienteSeleccionado.prioridad;
        form.querySelector('#folios').value = this.expedienteSeleccionado.folios;
        form.querySelector('#observaciones').value = this.expedienteSeleccionado.observaciones;
        form.querySelector('#estado').value = this.expedienteSeleccionado.estado;
        
        // Resaltar formulario
        form.classList.add('border-primary');
        setTimeout(() => {
            form.classList.remove('border-primary');
        }, 1000);
    }

    /**
     * Guarda los cambios del expediente
     * @param {HTMLElement} container - Contenedor de la vista
     */
    guardarCambios(container) {
        if (!this.expedienteSeleccionado) {
            // Si no hay expediente seleccionado, mostrar alerta
            if (window.Swal) {
                window.Swal.fire({
                    title: 'Atención',
                    text: 'Debe seleccionar un expediente para actualizar',
                    icon: 'warning',
                    confirmButtonText: 'Entendido'
                });
            } else {
                alert('Debe seleccionar un expediente para actualizar');
            }
            return;
        }
        
        // Obtener datos del formulario
        const form = container.querySelector('#formActualizacion');
        if (!form) return;
        
        // Actualizar el objeto expedienteSeleccionado
        this.expedienteSeleccionado.remitente = form.querySelector('#remitente').value;
        this.expedienteSeleccionado.asunto = form.querySelector('#asunto').value;
        this.expedienteSeleccionado.fechaRecepcion = form.querySelector('#fechaRecepcion').value;
        this.expedienteSeleccionado.tipoDocumento = form.querySelector('#tipoDocumento').value;
        this.expedienteSeleccionado.prioridad = form.querySelector('#prioridad').value;
        this.expedienteSeleccionado.folios = form.querySelector('#folios').value;
        this.expedienteSeleccionado.observaciones = form.querySelector('#observaciones').value;
        this.expedienteSeleccionado.estado = form.querySelector('#estado').value;
        
        // En un caso real, aquí enviaríamos los datos al servidor
        // Por ahora simulamos el guardado
        
        // Actualizar también en la lista de expedientes
        const index = this.expedientes.findIndex(exp => exp.id === this.expedienteSeleccionado.id);
        if (index !== -1) {
            this.expedientes[index] = this.expedienteSeleccionado;
        }
        
        // Actualizar la tabla
        const tabla = container.querySelector('#expedientesTable');
        if (tabla) {
            tabla.innerHTML = this.renderTablaExpedientes();
        }
        
        // Mostrar mensaje de éxito
        if (window.Swal) {
            window.Swal.fire({
                title: 'Éxito',
                text: 'Expediente actualizado correctamente',
                icon: 'success',
                confirmButtonText: 'Aceptar'
            });
        } else {
            alert('Expediente actualizado correctamente');
        }
        
        // Limpiar formulario
        this.limpiarFormulario(container);
    }

    /**
     * Limpia el formulario
     * @param {HTMLElement} container - Contenedor de la vista
     */
    limpiarFormulario(container) {
        this.expedienteSeleccionado = null;
        
        const form = container.querySelector('#formActualizacion');
        if (!form) return;
        
        form.reset();
        form.querySelector('#numeroExpediente').value = '';
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