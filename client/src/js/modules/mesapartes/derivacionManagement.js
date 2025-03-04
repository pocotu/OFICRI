// Módulo de gestión de derivaciones
window.mesapartesModules = window.mesapartesModules || {};

// Estado local del módulo
const state = {
    derivacionesPendientes: [],
    areasDestino: []
};

// Inicialización del módulo
window.mesapartesModules.initDerivacionManagement = function() {
    // Cargar derivaciones pendientes
    loadDerivacionesPendientes();
    
    // Cargar áreas de destino
    loadAreasDestino();
};

// Cargar derivaciones pendientes
async function loadDerivacionesPendientes() {
    try {
        const response = await fetch('/api/mesapartes/derivaciones/pendientes');
        if (!response.ok) throw new Error('Error al cargar derivaciones pendientes');
        
        const data = await response.json();
        state.derivacionesPendientes = data;
        renderDerivacionesPendientes();
    } catch (error) {
        console.error('Error:', error);
        window.mesapartesModules.showError('Error al cargar las derivaciones pendientes');
    }
}

// Cargar áreas de destino
async function loadAreasDestino() {
    try {
        const response = await fetch('/api/areas');
        if (!response.ok) throw new Error('Error al cargar áreas');
        
        const data = await response.json();
        state.areasDestino = data;
    } catch (error) {
        console.error('Error:', error);
        window.mesapartesModules.showError('Error al cargar las áreas de destino');
    }
}

// Renderizar tabla de derivaciones pendientes
function renderDerivacionesPendientes() {
    const tbody = document.getElementById('pendientes-derivacion-body');
    if (!tbody) return;

    tbody.innerHTML = state.derivacionesPendientes.map(doc => `
        <tr>
            <td>${doc.numeroDocumento}</td>
            <td>${formatDate(doc.fechaRecepcion)}</td>
            <td>${doc.tipo}</td>
            <td>
                <select class="form-select form-select-sm area-destino-select" 
                        data-documento-id="${doc.id}"
                        onchange="window.mesapartesModules.updateAreaDestino(${doc.id}, this.value)">
                    <option value="">Seleccione área...</option>
                    ${state.areasDestino.map(area => `
                        <option value="${area.id}" ${doc.areaDestino === area.id ? 'selected' : ''}>
                            ${area.nombre}
                        </option>
                    `).join('')}
                </select>
            </td>
            <td>
                <div class="btn-group">
                    <button class="btn btn-sm btn-info" 
                            onclick="window.mesapartesModules.verDetallesDerivacion(${doc.id})"
                            title="Ver detalles">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-sm btn-success" 
                            onclick="window.mesapartesModules.confirmarDerivacion(${doc.id})"
                            ${!doc.areaDestino ? 'disabled' : ''}
                            title="Confirmar derivación">
                        <i class="fas fa-check"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
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

// Actualizar área de destino
window.mesapartesModules.updateAreaDestino = async function(documentoId, areaId) {
    try {
        const response = await fetch(`/api/mesapartes/documentos/${documentoId}/area`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ areaDestino: areaId })
        });

        if (!response.ok) throw new Error('Error al actualizar área de destino');

        // Actualizar estado local
        const documento = state.derivacionesPendientes.find(d => d.id === documentoId);
        if (documento) {
            documento.areaDestino = areaId;
        }

        // Actualizar UI
        renderDerivacionesPendientes();
    } catch (error) {
        console.error('Error:', error);
        window.mesapartesModules.showError('Error al actualizar el área de destino');
    }
};

// Ver detalles de derivación
window.mesapartesModules.verDetallesDerivacion = async function(documentoId) {
    try {
        const response = await fetch(`/api/mesapartes/documentos/${documentoId}`);
        if (!response.ok) throw new Error('Error al cargar detalles del documento');
        
        const documento = await response.json();
        // Aquí implementarías la lógica para mostrar los detalles en un modal o panel
        console.log('Detalles del documento:', documento);
    } catch (error) {
        console.error('Error:', error);
        window.mesapartesModules.showError('Error al cargar los detalles del documento');
    }
};

// Confirmar derivación
window.mesapartesModules.confirmarDerivacion = async function(documentoId) {
    try {
        const documento = state.derivacionesPendientes.find(d => d.id === documentoId);
        if (!documento || !documento.areaDestino) {
            throw new Error('Debe seleccionar un área de destino');
        }

        const response = await fetch(`/api/mesapartes/derivaciones`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                documentoId: documentoId,
                areaDestino: documento.areaDestino
            })
        });

        if (!response.ok) throw new Error('Error al derivar documento');

        window.mesapartesModules.showSuccess('Documento derivado exitosamente');
        
        // Recargar derivaciones pendientes
        loadDerivacionesPendientes();
    } catch (error) {
        console.error('Error:', error);
        window.mesapartesModules.showError(error.message);
    }
};

// Función para refrescar derivaciones
window.mesapartesModules.refreshDerivaciones = loadDerivacionesPendientes; 