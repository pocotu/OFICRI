/**
 * Vista de Trazabilidad de Expedientes
 * Permite visualizar el recorrido completo de un expediente
 */

export class Trazabilidad {
    constructor() {
        // Inicializar propiedades
        this.expedientes = [];
        this.expedienteSeleccionado = null;
        this.historial = [];
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
                    <p class="mt-3">Cargando módulo de trazabilidad...</p>
                </div>
            `;

            // En un caso real, aquí cargaríamos los expedientes desde el servidor
            // Por ahora usamos datos de ejemplo
            await this.cargarExpedientes();

            // Contenido principal
            container.innerHTML = `
                <div class="main-wrapper" style="position:relative; width:100%; overflow:hidden;">
                    <style>
                        /* Asegurar que todo el contenido principal ocupe el ancho total */
                        .main-wrapper {
                            width: 100% !important;
                            display: flex !important;
                            flex-direction: column !important;
                            max-width: 100% !important;
                        }
                        
                        /* Forzar a que todo div en el body que no sea parte de header, footer o nav se oculte */
                        body > div:not(:has(header)):not(:has(footer)):not(:has(nav)):not(.main-wrapper):not(.main-wrapper *):not([role="alert"]) {
                            display: none !important;
                            width: 0 !important;
                            height: 0 !important;
                            visibility: hidden !important;
                            opacity: 0 !important;
                        }
                        
                        /* Eliminar todos los contenedores decorativos */
                        body > div[class=""], 
                        div:empty,
                        div.container-fluid + div,
                        div.container-fluid ~ div:not(.card),
                        div[style*="background"],
                        div[style*="background-image"],
                        div[style*="background-color"],
                        [style*="pattern"],
                        [id*="pattern"],
                        [class*="pattern"] {
                            display: none !important;
                            width: 0 !important;
                            height: 0 !important;
                            visibility: hidden !important;
                            margin: 0 !important;
                            padding: 0 !important;
                            opacity: 0 !important;
                        }
                        
                        /* Estilos específicos para elementos con fondos violeta/púrpura */
                        div[style*="purple"], 
                        div[style*="violet"],
                        div[style*="#8a2be2"],
                        div[style*="#a020f0"],
                        div[style*="#9370db"],
                        div[style*="#dda0dd"],
                        div[style*="rgba(138"],
                        div[style*="rgba(148"],
                        div[style*="rgba(128"],
                        div[style*="linear-gradient"],
                        div[style*="radial-gradient"] { 
                            display: none !important;
                            width: 0 !important;
                            height: 0 !important;
                            visibility: hidden !important;
                            margin: 0 !important;
                            padding: 0 !important;
                            opacity: 0 !important;
                            max-width: 0 !important;
                        }
                        
                        /* Asegurar que nuestro contenedor principal ocupe todo el ancho */
                        .main-wrapper .container-fluid {
                            width: 100% !important;
                            max-width: 100% !important;
                            margin: 0 auto !important;
                            padding: 0 !important;
                        }
                        
                        /* Hacer que la tarjeta ocupe todo el ancho disponible */
                        .main-wrapper .card {
                            width: 100% !important;
                            max-width: 100% !important;
                        }
                        
                        /* Estilos para el historial */
                        .timeline {
                            margin-top: 20px;
                        }
                        
                        .timeline-item {
                            position: relative;
                            padding-left: 40px;
                            margin-bottom: 20px;
                            border-left: 2px solid #dee2e6;
                        }
                        
                        .timeline-badge {
                            position: absolute;
                            left: -10px;
                            width: 20px;
                            height: 20px;
                            border-radius: 50%;
                            text-align: center;
                            line-height: 20px;
                            color: white;
                        }
                        
                        .timeline-content {
                            padding: 15px;
                            background-color: #f8f9fa;
                            border-radius: 5px;
                        }
                        
                        .timeline-item-last {
                            border-left-color: transparent;
                        }
                    </style>
                
                    <h1 class="text-center fw-bold my-4" style="color:#084298;">Trazabilidad de Expedientes</h1>
                    
                    <div class="container-fluid">
                        <div class="card">
                            <div class="card-header">
                                <i class="fas fa-route me-1"></i>
                                Historial del Expediente
                            </div>
                            <div class="card-body" id="historialContainer">
                                ${this.renderHistorialPlaceholder()}
                            </div>
                        </div>
                    </div>
                </div>
            `;

            // Eliminar cualquier elemento "Trazabilidad de Expedientes" flotante después de renderizar
            setTimeout(() => {
                // Eliminar cualquier contenedor con fondo púrpura/violeta
                this.limpiarElementosPurpura();
                
                // Crear un observador para eliminar elementos problemáticos que se añadan dinámicamente
                const observer = new MutationObserver((mutations) => {
                    for (const mutation of mutations) {
                        if (mutation.addedNodes.length) {
                            // Si se añaden nuevos nodos, buscar y eliminar elementos púrpura
                            this.limpiarElementosPurpura();
                        }
                    }
                });
                
                // Iniciar la observación del DOM
                observer.observe(document.body, { 
                    childList: true,
                    subtree: true
                });
                
                // También forzar que el contenedor ocupe todo el ancho
                document.querySelectorAll('.main-wrapper, .main-wrapper .container-fluid, .main-wrapper .card').forEach(elem => {
                    elem.style.width = '100%';
                    elem.style.maxWidth = '100%';
                });
                
                // Eliminar explícitamente cualquier div hermano de nuestro contenedor principal
                const mainWrapper = document.querySelector('.main-wrapper');
                if (mainWrapper && mainWrapper.parentElement) {
                    const siblings = Array.from(mainWrapper.parentElement.children);
                    siblings.forEach(sibling => {
                        if (sibling !== mainWrapper && sibling.tagName === 'DIV') {
                            console.log('Eliminando div hermano:', sibling);
                            sibling.style.display = 'none';
                            sibling.style.width = '0';
                            sibling.style.height = '0';
                        }
                    });
                }
                
                // Mostrar automáticamente el historial del primer expediente
                if (this.expedientes.length > 0) {
                    this.verHistorial(this.expedientes[0].id, container);
                }
            }, 200);
        } catch (error) {
            console.error('[Trazabilidad] Error al renderizar vista:', error);
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
     * Configurar los listeners de eventos
     * @param {HTMLElement} container - Contenedor donde se encuentra la vista
     */
    setupEventListeners(container) {
        // Búsqueda de expediente
        const btnBuscar = container.querySelector('#btnBuscarExpediente');
        if (btnBuscar) {
            btnBuscar.addEventListener('click', () => this.buscarExpediente(container));
        }

        // Eventos de selección de expediente en la tabla
        const tabla = container.querySelector('#expedientesTable');
        if (tabla) {
            tabla.addEventListener('click', (e) => {
                const btn = e.target.closest('.btn-ver');
                if (btn) {
                    const expedienteId = btn.dataset.id;
                    
                    // Quitar la selección visual de todas las filas
                    tabla.querySelectorAll('tr').forEach(tr => {
                        tr.classList.remove('table-primary');
                    });
                    
                    // Resaltar la fila seleccionada
                    const selectedRow = btn.closest('tr');
                    if (selectedRow) {
                        selectedRow.classList.add('table-primary');
                    }
                    
                    this.verHistorial(expedienteId, container);
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
                        asunto: 'Solicitud de informes criminalísticos',
                        fechaRecepcion: '2023-03-10',
                        estado: 'COMPLETADO'
                    },
                    {
                        id: '2',
                        numeroExpediente: 'EXP-2023-002',
                        asunto: 'Solicitud de pericia balística',
                        fechaRecepcion: '2023-03-12',
                        estado: 'EN_PROCESO'
                    },
                    {
                        id: '3',
                        numeroExpediente: 'EXP-2023-003',
                        asunto: 'Requerimiento de análisis dactiloscópico',
                        fechaRecepcion: '2023-03-15',
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
            return '<tr><td colspan="3" class="text-center">No hay expedientes disponibles</td></tr>';
        }

        return this.expedientes.map(exp => `
            <tr>
                <td>${exp.numeroExpediente}</td>
                <td>${this.formatDate(exp.fechaRecepcion)}</td>
                <td>
                    <button class="btn btn-sm btn-primary btn-ver" data-id="${exp.id}">
                        <i class="fas fa-eye"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    }

    /**
     * Renderiza un placeholder para el historial
     * @returns {string} HTML del placeholder
     */
    renderHistorialPlaceholder() {
        return `
            <div class="text-center py-5">
                <div class="mb-4">
                    <i class="fas fa-file-search fa-4x text-muted"></i>
                </div>
                <h5 class="text-muted">Seleccione un expediente para ver su trazabilidad</h5>
            </div>
        `;
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
            tabla.innerHTML = '<tr><td colspan="3" class="text-center">No se encontraron resultados</td></tr>';
        } else {
            tabla.innerHTML = filtrados.map(exp => `
                <tr>
                    <td>${exp.numeroExpediente}</td>
                    <td>${this.formatDate(exp.fechaRecepcion)}</td>
                    <td>
                        <button class="btn btn-sm btn-primary btn-ver" data-id="${exp.id}">
                            <i class="fas fa-eye"></i>
                        </button>
                    </td>
                </tr>
            `).join('');
        }
    }

    /**
     * Ver historial de un expediente
     * @param {string} id - ID del expediente
     * @param {HTMLElement} container - Contenedor de la vista
     */
    async verHistorial(id, container) {
        this.expedienteSeleccionado = this.expedientes.find(exp => exp.id === id);
        
        if (!this.expedienteSeleccionado) return;
        
        const historialContainer = container.querySelector('#historialContainer');
        if (!historialContainer) return;
        
        // Mostrar carga
        historialContainer.innerHTML = `
            <div class="text-center py-4">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Cargando historial...</span>
                </div>
                <p class="mt-3">Consultando trazabilidad del expediente...</p>
            </div>
        `;
        
        // Simular carga de historial
        await this.cargarHistorial(id);
        
        // Renderizar historial
        historialContainer.innerHTML = `
            <div class="mb-4 p-3 bg-light rounded border border-primary">
                <h5 class="mb-3 text-primary">
                    <i class="fas fa-file-alt me-2"></i>
                    Expediente: ${this.expedienteSeleccionado.numeroExpediente}
                </h5>
                <div class="row">
                    <div class="col-md-6">
                        <p><strong><i class="fas fa-info-circle me-1"></i> Asunto:</strong> ${this.expedienteSeleccionado.asunto}</p>
                        <p><strong><i class="fas fa-calendar-alt me-1"></i> Fecha Recepción:</strong> ${this.formatDate(this.expedienteSeleccionado.fechaRecepcion)}</p>
                    </div>
                    <div class="col-md-6">
                        <p><strong><i class="fas fa-tag me-1"></i> Estado:</strong> <span class="badge bg-${this.getStatusBadgeColor(this.expedienteSeleccionado.estado)}">${this.getStatusText(this.expedienteSeleccionado.estado)}</span></p>
                    </div>
                </div>
            </div>
            
            <div class="timeline">
                <h6 class="text-primary mb-3">
                    <i class="fas fa-history me-1"></i> Recorrido del expediente
                </h6>
                ${this.renderTimelineEvents()}
            </div>
            
            <div class="mt-4 text-end">
                <button class="btn btn-primary" id="btnImprimirHistorial">
                    <i class="fas fa-print me-2"></i>Imprimir Historial
                </button>
            </div>
        `;
        
        // Configurar botón de imprimir
        const btnImprimir = historialContainer.querySelector('#btnImprimirHistorial');
        if (btnImprimir) {
            btnImprimir.addEventListener('click', () => this.imprimirHistorial());
        }
    }
    
    /**
     * Cargar el historial de un expediente (simulado)
     * @param {string} id - ID del expediente
     */
    async cargarHistorial(id) {
        return new Promise(resolve => {
            setTimeout(() => {
                // Datos simulados
                this.historial = [
                    {
                        fecha: '2023-03-10 09:15',
                        tipo: 'RECEPCION',
                        area: 'Mesa de Partes',
                        usuario: 'Marisol Huaylla',
                        comentario: 'Recepción inicial del documento'
                    },
                    {
                        fecha: '2023-03-10 11:30',
                        tipo: 'DERIVACION',
                        area: 'Departamento de Balística',
                        usuario: 'Marisol Huaylla',
                        comentario: 'Derivado para análisis especializado'
                    },
                    {
                        fecha: '2023-03-12 14:20',
                        tipo: 'RECEPCION',
                        area: 'Departamento de Balística',
                        usuario: 'Juan Pérez',
                        comentario: 'Documento recibido para análisis'
                    },
                    {
                        fecha: '2023-03-15 16:45',
                        tipo: 'PROCESO',
                        area: 'Departamento de Balística',
                        usuario: 'Juan Pérez',
                        comentario: 'Iniciando análisis. Tiempo estimado: 3 días'
                    },
                    {
                        fecha: '2023-03-18 10:30',
                        tipo: 'COMPLETADO',
                        area: 'Departamento de Balística',
                        usuario: 'Juan Pérez',
                        comentario: 'Análisis completado. Informe generado.'
                    },
                    {
                        fecha: '2023-03-18 11:15',
                        tipo: 'DERIVACION',
                        area: 'Mesa de Partes',
                        usuario: 'Juan Pérez',
                        comentario: 'Devuelto a Mesa de Partes para entrega a solicitante'
                    },
                    {
                        fecha: '2023-03-18 14:00',
                        tipo: 'ENTREGA',
                        area: 'Mesa de Partes',
                        usuario: 'Marisol Huaylla',
                        comentario: 'Entregado al solicitante. Se archiva expediente.'
                    }
                ];
                
                // Si es otro ID, generar datos diferentes
                if (id === '2') {
                    this.historial = this.historial.slice(0, 4); // Solo mostrar hasta el proceso
                } else if (id === '3') {
                    this.historial = this.historial.slice(0, 2); // Solo mostrar hasta la primera derivación
                }
                
                resolve(this.historial);
            }, 800);
        });
    }
    
    /**
     * Renderiza el timeline de eventos
     * @returns {string} HTML del timeline
     */
    renderTimelineEvents() {
        if (this.historial.length === 0) {
            return '<div class="text-center py-3 text-muted">No hay registros de trazabilidad disponibles</div>';
        }
        
        return this.historial.map((evento, index) => `
            <div class="timeline-item ${index === this.historial.length - 1 ? 'timeline-item-last' : ''}">
                <div class="timeline-badge bg-${this.getEventBadgeColor(evento.tipo)}">
                    <i class="fas ${this.getEventIcon(evento.tipo)}"></i>
                </div>
                <div class="timeline-content">
                    <h6 class="mb-1">${this.getEventTypeText(evento.tipo)}</h6>
                    <p class="mb-1 small text-muted">
                        <i class="fas fa-clock me-1"></i> ${evento.fecha}
                    </p>
                    <p class="mb-1">
                        <i class="fas fa-user me-1"></i> ${evento.usuario} 
                        <span class="text-muted">- ${evento.area}</span>
                    </p>
                    <p class="mb-0">${evento.comentario}</p>
                </div>
            </div>
        `).join('');
    }
    
    /**
     * Simula la impresión del historial
     */
    imprimirHistorial() {
        if (window.Swal) {
            window.Swal.fire({
                title: 'Imprimir Historial',
                text: 'Se enviará a la impresora el historial del expediente ' + this.expedienteSeleccionado.numeroExpediente,
                icon: 'info',
                showCancelButton: true,
                confirmButtonText: 'Imprimir',
                cancelButtonText: 'Cancelar'
            }).then((result) => {
                if (result.isConfirmed) {
                    window.Swal.fire(
                        'Enviado a impresión',
                        'El historial ha sido enviado a la impresora',
                        'success'
                    );
                }
            });
        } else {
            if (confirm('¿Desea imprimir el historial del expediente ' + this.expedienteSeleccionado.numeroExpediente + '?')) {
                alert('El historial ha sido enviado a la impresora');
            }
        }
    }
    
    /**
     * Obtiene el color para un tipo de evento
     * @param {string} tipo - Tipo de evento
     * @returns {string} Clase de color para la badge
     */
    getEventBadgeColor(tipo) {
        switch (tipo) {
            case 'RECEPCION': return 'primary';
            case 'DERIVACION': return 'info';
            case 'PROCESO': return 'warning';
            case 'COMPLETADO': return 'success';
            case 'ENTREGA': return 'success';
            default: return 'secondary';
        }
    }
    
    /**
     * Obtiene el ícono para un tipo de evento
     * @param {string} tipo - Tipo de evento
     * @returns {string} Clase de ícono
     */
    getEventIcon(tipo) {
        switch (tipo) {
            case 'RECEPCION': return 'fa-inbox';
            case 'DERIVACION': return 'fa-share';
            case 'PROCESO': return 'fa-cog';
            case 'COMPLETADO': return 'fa-check-circle';
            case 'ENTREGA': return 'fa-handshake';
            default: return 'fa-dot-circle';
        }
    }
    
    /**
     * Obtiene el texto para un tipo de evento
     * @param {string} tipo - Tipo de evento
     * @returns {string} Texto descriptivo
     */
    getEventTypeText(tipo) {
        switch (tipo) {
            case 'RECEPCION': return 'Recepción';
            case 'DERIVACION': return 'Derivación';
            case 'PROCESO': return 'En Proceso';
            case 'COMPLETADO': return 'Completado';
            case 'ENTREGA': return 'Entrega Final';
            default: return tipo;
        }
    }
    
    /**
     * Obtiene el color para un estado de expediente
     * @param {string} estado - Estado del expediente
     * @returns {string} Clase de color para la badge
     */
    getStatusBadgeColor(estado) {
        switch (estado) {
            case 'RECIBIDO': return 'primary';
            case 'EN_PROCESO': return 'warning';
            case 'DERIVADO': return 'info';
            case 'COMPLETADO': return 'success';
            default: return 'secondary';
        }
    }
    
    /**
     * Obtiene el texto para un estado de expediente
     * @param {string} estado - Estado del expediente
     * @returns {string} Texto descriptivo
     */
    getStatusText(estado) {
        switch (estado) {
            case 'RECIBIDO': return 'Recibido';
            case 'EN_PROCESO': return 'En Proceso';
            case 'DERIVADO': return 'Derivado';
            case 'COMPLETADO': return 'Completado';
            default: return estado;
        }
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

    /**
     * Limpia cualquier elemento con fondo púrpura o violeta del DOM
     */
    limpiarElementosPurpura() {
        // Selectores para elementos púrpura/violeta y decorativos
        const selectores = [
            '[style*="purple"]', 
            '[style*="violet"]',
            '[style*="#8a2be2"]',
            '[style*="#a020f0"]',
            '[style*="#9370db"]',
            '[style*="#dda0dd"]',
            '[style*="rgba(138"]',
            '[style*="rgba(148"]',
            '[style*="rgba(128"]',
            '[style*="linear-gradient"]',
            '[style*="radial-gradient"]',
            '[style*="background-image"]',
            '[style*="background-color"]',
            '[style*="pattern"]',
            '[class*="pattern"]',
            '[id*="pattern"]',
            '[class*="decoration"]',
            '[id*="decoration"]',
            'div:empty',
            'div[class=""]'
        ];
        
        // Encontrar el contenedor principal
        const mainWrapper = document.querySelector('.main-wrapper');
        
        if (mainWrapper && mainWrapper.parentElement) {
            // Eliminar cualquier div que sea hermano de nuestro contenedor principal
            const siblings = Array.from(mainWrapper.parentElement.children);
            siblings.forEach(sibling => {
                if (sibling !== mainWrapper && sibling.tagName === 'DIV') {
                    console.log('Eliminando div hermano:', sibling);
                    sibling.style.display = 'none';
                    sibling.style.visibility = 'hidden';
                    sibling.style.width = '0';
                    sibling.style.height = '0';
                    sibling.style.padding = '0';
                    sibling.style.margin = '0';
                    sibling.style.opacity = '0';
                    sibling.style.overflow = 'hidden';
                    sibling.style.position = 'absolute';
                    sibling.style.zIndex = '-9999';
                    sibling.style.pointerEvents = 'none';
                }
            });
            
            // Establecer el ancho del contenedor principal
            mainWrapper.style.width = '100%';
            mainWrapper.style.maxWidth = '100%';
            mainWrapper.style.flex = '1 1 auto';
            
            // Asegurar que el contenedor del historial también ocupe el ancho completo
            const historialContainer = document.querySelector('#historialContainer');
            if (historialContainer) {
                historialContainer.style.width = '100%';
                historialContainer.style.maxWidth = '100%';
            }
        }
        
        // Forzar que cualquier div/container/row/col directo en body sea máximo de 100% de ancho
        document.querySelectorAll('body > div, body > div > div').forEach(div => {
            div.style.maxWidth = '100%';
            div.style.overflowX = 'hidden';
        });
        
        // Eliminar elementos que correspondan a los selectores
        for (const selector of selectores) {
            const elementos = document.querySelectorAll(selector);
            elementos.forEach(elem => {
                // No eliminar si es parte del contenido principal
                if (!mainWrapper || !mainWrapper.contains(elem)) {
                    console.log('Eliminando elemento problemático:', elem);
                    elem.style.display = 'none';
                    elem.style.visibility = 'hidden';
                    elem.style.width = '0';
                    elem.style.height = '0';
                    elem.style.padding = '0';
                    elem.style.margin = '0';
                    elem.style.opacity = '0';
                    elem.style.overflow = 'hidden';
                    elem.style.position = 'absolute';
                    elem.style.zIndex = '-9999';
                    elem.style.pointerEvents = 'none';
                }
            });
        }
        
        // Eliminar específicamente el div.container-fluid.px-4 + div (el contenedor que aparece a la derecha)
        document.querySelectorAll('.container-fluid + div, .container-fluid ~ div:not(.card)').forEach(elem => {
            if (!mainWrapper || !mainWrapper.contains(elem)) {
                console.log('Eliminando contenedor adyacente:', elem);
                elem.style.display = 'none';
                elem.style.visibility = 'hidden';
                elem.style.width = '0';
                elem.style.height = '0';
                elem.style.padding = '0';
                elem.style.margin = '0';
                elem.style.opacity = '0';
                elem.style.overflow = 'hidden';
                elem.style.position = 'absolute';
                elem.style.zIndex = '-9999';
                elem.style.pointerEvents = 'none';
            }
        });
        
        // Eliminar elementos con posición absoluta que no estén en header, nav o footer
        document.querySelectorAll('*[style*="position:absolute"], *[style*="position: absolute"]').forEach(elem => {
            if (!elem.closest('header, nav, footer') && (!mainWrapper || !mainWrapper.contains(elem))) {
                elem.style.display = 'none';
                elem.style.visibility = 'hidden';
                elem.style.opacity = '0';
            }
        });
        
        // Ajustar el ancho de todos los elementos dentro del contenedor principal
        if (mainWrapper) {
            mainWrapper.querySelectorAll('.container-fluid, .card, .card-body').forEach(elem => {
                elem.style.maxWidth = '100%';
                elem.style.width = '100%';
            });
        }
    }
} 