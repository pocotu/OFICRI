// Módulo de seguimiento de documentos
window.mesapartesModules = window.mesapartesModules || {};

// Estado local del módulo
const state = {
    documentoActual: null,
    historialMovimientos: []
};

// Inicialización del módulo
window.mesapartesModules.initSeguimientoManagement = function() {
    setupBusquedaDocumento();
};

// Configurar búsqueda de documento
function setupBusquedaDocumento() {
    const searchForm = document.querySelector('.search-tracking');
    if (!searchForm) return;

    const searchInput = searchForm.querySelector('input');
    const searchButton = searchForm.querySelector('button');

    searchButton.addEventListener('click', () => {
        const numeroDocumento = searchInput.value.trim();
        if (numeroDocumento) {
            buscarDocumento(numeroDocumento);
        }
    });

    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const numeroDocumento = searchInput.value.trim();
            if (numeroDocumento) {
                buscarDocumento(numeroDocumento);
            }
        }
    });
}

// Buscar documento
async function buscarDocumento(numeroDocumento) {
    try {
        // Buscar documento
        const responseDoc = await fetch(`/api/mesapartes/documentos/buscar/${numeroDocumento}`);
        if (!responseDoc.ok) throw new Error('Documento no encontrado');
        
        const documento = await responseDoc.json();
        state.documentoActual = documento;

        // Buscar historial de movimientos
        const responseHist = await fetch(`/api/mesapartes/documentos/${documento.id}/historial`);
        if (!responseHist.ok) throw new Error('Error al cargar historial');
        
        const historial = await responseHist.json();
        state.historialMovimientos = historial;

        // Renderizar resultados
        renderResultadosSeguimiento();
    } catch (error) {
        console.error('Error:', error);
        window.mesapartesModules.showError('Error al buscar el documento: ' + error.message);
        clearResultadosSeguimiento();
    }
}

// Renderizar resultados de seguimiento
function renderResultadosSeguimiento() {
    const resultsContainer = document.getElementById('tracking-results');
    if (!resultsContainer || !state.documentoActual) return;

    resultsContainer.innerHTML = `
        <div class="tracking-container">
            <div class="documento-info card mb-4">
                <div class="card-header">
                    <h3 class="card-title">Información del Documento</h3>
                </div>
                <div class="card-body">
                    <div class="row">
                        <div class="col-md-6">
                            <p><strong>N° Documento:</strong> ${state.documentoActual.numeroDocumento}</p>
                            <p><strong>Tipo:</strong> ${state.documentoActual.tipo}</p>
                            <p><strong>Fecha Recepción:</strong> ${formatDate(state.documentoActual.fechaRecepcion)}</p>
                        </div>
                        <div class="col-md-6">
                            <p><strong>Remitente:</strong> ${state.documentoActual.remitente}</p>
                            <p><strong>Estado Actual:</strong> 
                                <span class="estado-${state.documentoActual.estado.toLowerCase()}">
                                    ${state.documentoActual.estado}
                                </span>
                            </p>
                            <p><strong>Ubicación Actual:</strong> ${state.documentoActual.ubicacionActual || 'No definida'}</p>
                        </div>
                    </div>
                    <div class="row mt-3">
                        <div class="col-12">
                            <p><strong>Asunto:</strong> ${state.documentoActual.asunto}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div class="historial-movimientos card">
                <div class="card-header">
                    <h3 class="card-title">Historial de Movimientos</h3>
                </div>
                <div class="card-body">
                    <div class="timeline">
                        ${renderHistorialMovimientos()}
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Renderizar historial de movimientos
function renderHistorialMovimientos() {
    if (!state.historialMovimientos.length) {
        return '<p class="text-muted">No hay movimientos registrados</p>';
    }

    return state.historialMovimientos.map((movimiento, index) => `
        <div class="timeline-item ${index === 0 ? 'active' : ''}">
            <div class="timeline-point">
                <i class="fas ${getIconForMovimiento(movimiento.tipo)}"></i>
            </div>
            <div class="timeline-content">
                <div class="timeline-time">
                    ${formatDate(movimiento.fecha)}
                </div>
                <h4 class="timeline-title">${movimiento.tipo}</h4>
                <p class="timeline-text">
                    ${movimiento.descripcion}<br>
                    <small class="text-muted">
                        Realizado por: ${movimiento.usuario}<br>
                        Área: ${movimiento.area}
                    </small>
                </p>
            </div>
        </div>
    `).join('');
}

// Obtener icono según tipo de movimiento
function getIconForMovimiento(tipo) {
    const iconos = {
        'RECEPCION': 'fa-inbox',
        'DERIVACION': 'fa-share',
        'DEVOLUCION': 'fa-undo',
        'ARCHIVAMIENTO': 'fa-archive',
        'OBSERVACION': 'fa-comment',
        'default': 'fa-file'
    };

    return iconos[tipo] || iconos.default;
}

// Limpiar resultados de seguimiento
function clearResultadosSeguimiento() {
    const resultsContainer = document.getElementById('tracking-results');
    if (resultsContainer) {
        resultsContainer.innerHTML = `
            <div class="alert alert-info">
                <i class="fas fa-info-circle"></i>
                Ingrese un número de documento para realizar el seguimiento
            </div>
        `;
    }
}

// Función para formatear fechas
function formatDate(date) {
    return new Date(date).toLocaleDateString('es-PE', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Exportar funciones públicas
window.mesapartesModules.refreshSeguimiento = function() {
    if (state.documentoActual) {
        buscarDocumento(state.documentoActual.numeroDocumento);
    }
}; 