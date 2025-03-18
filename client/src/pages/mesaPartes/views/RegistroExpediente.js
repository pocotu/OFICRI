/**
 * Vista RegistroExpediente para Mesa de Partes
 * Permite registrar un nuevo expediente en el sistema
 */

import * as errorHandler from '../../../utils/errorHandler.js';

export class RegistroExpediente {
    constructor() {
        console.log('[REGISTRO-EXPEDIENTE] Iniciando constructor');
        // Inicializar propiedades
        this.formData = {
            numeroExpediente: '',
            remitente: '',
            asunto: '',
            fechaRecepcion: this.getTodayDate(),
            prioridad: 'normal',
            tipoDocumento: '',
            folios: '',
            observaciones: ''
        };
        console.log('[REGISTRO-EXPEDIENTE] Constructor finalizado');
    }

    /**
     * Obtiene la fecha actual en formato YYYY-MM-DD
     * @returns {string} Fecha actual
     */
    getTodayDate() {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    /**
     * Renderiza la vista en el contenedor
     * @param {HTMLElement} container - Elemento contenedor
     */
    async render(container) {
        console.log('[REGISTRO-EXPEDIENTE] Iniciando renderizado');
        
        // Mostrar un spinner mientras se carga
        container.innerHTML = `
            <div class="d-flex justify-content-center my-5">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Cargando...</span>
                </div>
            </div>
        `;
        
        try {
            // En un caso real, aquí podríamos cargar datos necesarios de la API
            // como tipos de documentos, lista de remitentes frecuentes, etc.
            
            // Construir el formulario
            const html = `
                <div class="registro-expediente-page">
                    <div class="page-header">
                        <h2>Registro de Expediente</h2>
                        <p>Complete el formulario para registrar un nuevo expediente en el sistema</p>
                    </div>
                    
                    <div class="card">
                        <div class="card-body">
                            <form id="expedienteForm">
                                <div class="row mb-3">
                                    <div class="col-md-6">
                                        <label for="numeroExpediente" class="form-label">Número de Expediente *</label>
                                        <input type="text" class="form-control" id="numeroExpediente" 
                                            required value="${this.formData.numeroExpediente}" 
                                            placeholder="EXP-2023-00000">
                                        <div class="form-text">Formato: EXP-YYYY-NNNNN</div>
                                    </div>
                                    <div class="col-md-6">
                                        <label for="fechaRecepcion" class="form-label">Fecha de Recepción *</label>
                                        <input type="date" class="form-control" id="fechaRecepcion" 
                                            required value="${this.formData.fechaRecepcion}">
                                    </div>
                                </div>
                                
                                <div class="row mb-3">
                                    <div class="col-md-6">
                                        <label for="remitente" class="form-label">Remitente *</label>
                                        <input type="text" class="form-control" id="remitente" 
                                            required value="${this.formData.remitente}" 
                                            placeholder="Nombre de la persona o institución">
                                    </div>
                                    <div class="col-md-6">
                                        <label for="tipoDocumento" class="form-label">Tipo de Documento *</label>
                                        <select class="form-select" id="tipoDocumento" required>
                                            <option value="" ${this.formData.tipoDocumento === '' ? 'selected' : ''}>Seleccione un tipo</option>
                                            <option value="oficio" ${this.formData.tipoDocumento === 'oficio' ? 'selected' : ''}>Oficio</option>
                                            <option value="informe" ${this.formData.tipoDocumento === 'informe' ? 'selected' : ''}>Informe</option>
                                            <option value="solicitud" ${this.formData.tipoDocumento === 'solicitud' ? 'selected' : ''}>Solicitud</option>
                                            <option value="memorando" ${this.formData.tipoDocumento === 'memorando' ? 'selected' : ''}>Memorando</option>
                                            <option value="otro" ${this.formData.tipoDocumento === 'otro' ? 'selected' : ''}>Otro</option>
                                        </select>
                                    </div>
                                </div>
                                
                                <div class="mb-3">
                                    <label for="asunto" class="form-label">Asunto *</label>
                                    <input type="text" class="form-control" id="asunto" 
                                        required value="${this.formData.asunto}" 
                                        placeholder="Descripción breve del contenido">
                                </div>
                                
                                <div class="row mb-3">
                                    <div class="col-md-6">
                                        <label for="folios" class="form-label">Número de Folios *</label>
                                        <input type="number" class="form-control" id="folios" 
                                            required value="${this.formData.folios}" min="1">
                                    </div>
                                    <div class="col-md-6">
                                        <label for="prioridad" class="form-label">Prioridad</label>
                                        <select class="form-select" id="prioridad">
                                            <option value="baja" ${this.formData.prioridad === 'baja' ? 'selected' : ''}>Baja</option>
                                            <option value="normal" ${this.formData.prioridad === 'normal' ? 'selected' : ''}>Normal</option>
                                            <option value="alta" ${this.formData.prioridad === 'alta' ? 'selected' : ''}>Alta</option>
                                            <option value="urgente" ${this.formData.prioridad === 'urgente' ? 'selected' : ''}>Urgente</option>
                                        </select>
                                    </div>
                                </div>
                                
                                <div class="mb-3">
                                    <label for="observaciones" class="form-label">Observaciones</label>
                                    <textarea class="form-control" id="observaciones" rows="3"
                                        placeholder="Información adicional relevante">${this.formData.observaciones}</textarea>
                                </div>
                                
                                <div class="mb-3">
                                    <label for="documentoAdjunto" class="form-label">Adjuntar Documento (opcional)</label>
                                    <input class="form-control" type="file" id="documentoAdjunto">
                                    <div class="form-text">Formatos admitidos: PDF, JPG, PNG (máx. 10MB)</div>
                                </div>
                                
                                <div class="d-flex justify-content-end gap-2">
                                    <button type="button" class="btn btn-secondary" id="cancelarBtn">Cancelar</button>
                                    <button type="submit" class="btn btn-primary" id="guardarBtn">
                                        <i class="fas fa-save"></i> Guardar Expediente
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            `;
            
            container.innerHTML = html;
            
            // Configurar eventos
            this.setupEventListeners(container);
            
            console.log('[REGISTRO-EXPEDIENTE] Renderizado completado');
        } catch (error) {
            console.error('[REGISTRO-EXPEDIENTE] Error en renderizado:', error);
            errorHandler.showErrorMessage('Error al cargar formulario', 'No se pudo cargar el formulario de registro. Por favor, intente nuevamente más tarde.');
            
            container.innerHTML = `
                <div class="alert alert-danger" role="alert">
                    <h4 class="alert-heading">Error al cargar formulario</h4>
                    <p>No se pudo cargar el formulario de registro. Por favor, intente nuevamente más tarde.</p>
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
     * Configura los escuchadores de eventos
     * @param {HTMLElement} container - Elemento contenedor
     */
    setupEventListeners(container) {
        // Formulario
        const form = container.querySelector('#expedienteForm');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleSubmit(container);
            });
        }
        
        // Botón cancelar
        const cancelarBtn = container.querySelector('#cancelarBtn');
        if (cancelarBtn) {
            cancelarBtn.addEventListener('click', () => {
                this.handleCancel();
            });
        }
        
        // Cambios en los campos para actualizar el estado del formulario
        const inputs = container.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            input.addEventListener('change', () => {
                this.updateFormData(container);
            });
        });
    }

    /**
     * Actualiza el estado del formulario con los valores ingresados
     * @param {HTMLElement} container - Elemento contenedor
     */
    updateFormData(container) {
        this.formData.numeroExpediente = container.querySelector('#numeroExpediente').value;
        this.formData.fechaRecepcion = container.querySelector('#fechaRecepcion').value;
        this.formData.remitente = container.querySelector('#remitente').value;
        this.formData.tipoDocumento = container.querySelector('#tipoDocumento').value;
        this.formData.asunto = container.querySelector('#asunto').value;
        this.formData.folios = container.querySelector('#folios').value;
        this.formData.prioridad = container.querySelector('#prioridad').value;
        this.formData.observaciones = container.querySelector('#observaciones').value;
    }

    /**
     * Maneja el envío del formulario
     * @param {HTMLElement} container - Elemento contenedor
     */
    async handleSubmit(container) {
        try {
            // Actualizar datos del formulario
            this.updateFormData(container);
            
            // Validar datos
            const form = container.querySelector('#expedienteForm');
            if (!form.checkValidity()) {
                form.reportValidity();
                return;
            }
            
            // Mostrar spinner en el botón
            const submitBtn = container.querySelector('#guardarBtn');
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = `
                    <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                    Guardando...
                `;
            }
            
            // Enviar a la API
            await this.saveExpediente();
            
            // Mostrar mensaje de éxito
            alert(`El expediente ${this.formData.numeroExpediente} ha sido registrado correctamente.`);
            
            // Redireccionar a la lista de documentos
            setTimeout(() => {
                window.location.hash = 'documentos-recibidos';
            }, 1500);
            
        } catch (error) {
            console.error('[REGISTRO-EXPEDIENTE] Error al guardar:', error);
            
            // Mostrar mensaje de error con alert en lugar de errorHandler
            alert(`Error al guardar el expediente: ${error.message || 'Verifique los datos e intente nuevamente'}`);
            
            // Restaurar botón
            const submitBtn = container.querySelector('#guardarBtn');
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i class="fas fa-save"></i> Guardar Expediente';
            }
        }
    }

    /**
     * Maneja la acción de cancelar
     */
    handleCancel() {
        // Confirmar antes de cancelar si hay datos ingresados
        const hasData = Object.values(this.formData).some(value => value !== '' && value !== this.getTodayDate() && value !== 'normal');
        
        if (hasData) {
            if (confirm('¿Está seguro de cancelar? Los datos ingresados se perderán.')) {
                window.location.hash = 'documentos-recibidos';
            }
        } else {
            window.location.hash = 'documentos-recibidos';
        }
    }

    /**
     * Guarda el expediente
     * @returns {Promise} Promesa que se resuelve cuando se guarda el expediente
     */
    async saveExpediente() {
        try {
            // Obtener el token de autenticación
            let token = localStorage.getItem('token');
            
            if (!token) {
                throw new Error('No se encontró token de autenticación. Inicie sesión nuevamente.');
            }
            
            // Preparar los datos para enviar
            const payload = {
                numeroExpediente: this.formData.numeroExpediente,
                remitente: this.formData.remitente,
                asunto: this.formData.asunto,
                fechaRecepcion: this.formData.fechaRecepcion,
                tipoDocumento: this.formData.tipoDocumento,
                folios: this.formData.folios,
                prioridad: this.formData.prioridad,
                observaciones: this.formData.observaciones
            };
            
            console.log('[REGISTRO-EXPEDIENTE] Enviando datos:', payload);
            
            return await this.sendRequestWithTokenRenewal('/api/mesa-partes/documento', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });
        } catch (error) {
            console.error('[REGISTRO-EXPEDIENTE] Error al guardar expediente:', error);
            throw error;
        }
    }
    
    /**
     * Envía una solicitud con renovación automática de token si es necesario
     * @param {string} url - URL de la solicitud
     * @param {Object} options - Opciones de fetch
     * @param {boolean} retried - Indica si ya se ha reintentado la solicitud
     * @returns {Promise<Object>} - Respuesta de la solicitud
     */
    async sendRequestWithTokenRenewal(url, options, retried = false) {
        try {
            console.log('[REGISTRO-EXPEDIENTE] Enviando solicitud a:', url);
            
            // Realizar la petición al servidor
            const response = await fetch(url, options);
            
            // Verificar la respuesta
            if (response.ok) {
                const data = await response.json();
                console.log('[REGISTRO-EXPEDIENTE] Operación exitosa:', data);
                return data;
            }
            
            // Si el token ha expirado y no hemos reintentado aún
            if (response.status === 401 && !retried) {
                const errorData = await response.json();
                
                if (errorData.code === 'TOKEN_EXPIRED') {
                    console.log('[REGISTRO-EXPEDIENTE] Token expirado, intentando renovar...');
                    
                    // Intentar renovar el token
                    const renewResponse = await fetch('/api/auth/renew-token', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': options.headers.Authorization
                        }
                    });
                    
                    if (renewResponse.ok) {
                        const renewData = await renewResponse.json();
                        console.log('[REGISTRO-EXPEDIENTE] Token renovado exitosamente');
                        
                        // Guardar el nuevo token
                        localStorage.setItem('token', renewData.token);
                        
                        // Actualizar opciones con el nuevo token
                        options.headers.Authorization = `Bearer ${renewData.token}`;
                        
                        // Reintentar la solicitud original
                        console.log('[REGISTRO-EXPEDIENTE] Reintentando solicitud con nuevo token');
                        return this.sendRequestWithTokenRenewal(url, options, true);
                    } else {
                        console.error('[REGISTRO-EXPEDIENTE] No se pudo renovar el token');
                        // Si no se puede renovar, cerrar sesión
                        localStorage.removeItem('token');
                        localStorage.removeItem('user');
                        throw new Error('Su sesión ha expirado y no se pudo renovar. Por favor, inicie sesión nuevamente.');
                    }
                }
            }
            
            // Obtener el mensaje de error específico si está disponible
            let errorMessage = 'Error al procesar la solicitud';
            let errorDetails = '';
            
            try {
                const errorData = await response.json();
                console.error('[REGISTRO-EXPEDIENTE] Detalles del error del servidor:', errorData);
                
                errorMessage = errorData.message || errorMessage;
                
                // Capturar detalles técnicos si están disponibles
                if (errorData.error) {
                    errorDetails = `\nDetalles técnicos: ${errorData.error}`;
                }
                
                if (errorData.sqlMessage) {
                    errorDetails += `\nError SQL: ${errorData.sqlMessage}`;
                }
            } catch (e) {
                // Si no se puede parsear la respuesta, usar el status text
                errorMessage = `${errorMessage}: ${response.statusText}`;
            }
            
            // Si después de reintentar seguimos teniendo un 401, es un problema de autenticación
            if (response.status === 401) {
                // Limpiar la sesión actual
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                throw new Error('Su sesión ha expirado. Por favor, inicie sesión nuevamente.');
            }
            
            // Para errores 500, dar un mensaje más específico
            if (response.status === 500) {
                throw new Error(`Error interno del servidor al procesar su solicitud. Por favor, verifique los datos e intente nuevamente.${errorDetails}`);
            }
            
            throw new Error(`${errorMessage}${errorDetails}`);
        } catch (error) {
            console.error('[REGISTRO-EXPEDIENTE] Error en solicitud:', error);
            throw error;
        }
    }
} 