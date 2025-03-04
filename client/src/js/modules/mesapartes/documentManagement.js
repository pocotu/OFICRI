// Módulo de gestión de documentos
window.mesapartesModules = window.mesapartesModules || {};

// Estado local del módulo
const state = {
    documentos: [],
    filtros: {
        estado: 'todos',
        tipo: 'todos',
        fechaInicio: null,
        fechaFin: null
    }
};

// Inicialización del módulo
window.mesapartesModules.initDocumentManagement = function() {
    // Cargar documentos iniciales
    loadDocumentos();

    // Configurar formulario de nuevo documento
    setupNuevoDocumentoForm();

    // Configurar filtros
    setupFiltros();
};

// Cargar documentos
async function loadDocumentos() {
    try {
        const response = await fetch('/api/mesapartes/documentos');
        if (!response.ok) throw new Error('Error al cargar documentos');
        
        const data = await response.json();
        state.documentos = data;
        renderDocumentos();
    } catch (error) {
        console.error('Error:', error);
        window.mesapartesModules.showError('Error al cargar los documentos');
    }
}

// Renderizar tabla de documentos
function renderDocumentos() {
    const tbody = document.getElementById('documentos-table-body');
    if (!tbody) return;

    const documentosFiltrados = filtrarDocumentos();
    
    tbody.innerHTML = documentosFiltrados.map(doc => `
        <tr>
            <td>${doc.numeroRegistro}</td>
            <td>${formatDate(doc.fecha)}</td>
            <td>${doc.tipo}</td>
            <td>${doc.remitente}</td>
            <td>${doc.asunto}</td>
            <td>
                <span class="estado-${doc.estado.toLowerCase()}">
                    ${doc.estado}
                </span>
            </td>
            <td>
                <div class="btn-group">
                    <button class="btn btn-sm btn-info" onclick="window.mesapartesModules.verDocumento(${doc.id})" title="Ver detalles">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-sm btn-primary" onclick="window.mesapartesModules.editarDocumento(${doc.id})" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-success" onclick="window.mesapartesModules.derivarDocumento(${doc.id})" title="Derivar">
                        <i class="fas fa-share"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

// Configurar formulario de nuevo documento
function setupNuevoDocumentoForm() {
    const form = document.getElementById('nuevoDocumentoForm');
    if (!form) return;

    // Cargar áreas para el select
    loadAreas();

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        try {
            const formData = new FormData(form);
            const response = await fetch('/api/mesapartes/documentos', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) throw new Error('Error al crear documento');

            window.mesapartesModules.showSuccess('Documento creado exitosamente');
            form.reset();
            
            // Cerrar modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('nuevoDocumentoModal'));
            modal.hide();

            // Recargar documentos
            loadDocumentos();
        } catch (error) {
            console.error('Error:', error);
            window.mesapartesModules.showError('Error al crear el documento');
        }
    });
}

// Cargar áreas para el select
async function loadAreas() {
    try {
        const response = await fetch('/api/areas');
        if (!response.ok) throw new Error('Error al cargar áreas');
        
        const areas = await response.json();
        const select = document.querySelector('select[name="areaDestino"]');
        if (select) {
            select.innerHTML = `
                <option value="">Seleccione...</option>
                ${areas.map(area => `
                    <option value="${area.id}">${area.nombre}</option>
                `).join('')}
            `;
        }
    } catch (error) {
        console.error('Error:', error);
        window.mesapartesModules.showError('Error al cargar las áreas');
    }
}

// Configurar filtros
function setupFiltros() {
    // Implementar filtros según necesidades
}

// Aplicar filtros a los documentos
function filtrarDocumentos() {
    return state.documentos.filter(doc => {
        if (state.filtros.estado !== 'todos' && doc.estado !== state.filtros.estado) return false;
        if (state.filtros.tipo !== 'todos' && doc.tipo !== state.filtros.tipo) return false;
        // Implementar más filtros según necesidades
        return true;
    });
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
window.mesapartesModules.verDocumento = async function(id) {
    try {
        const response = await fetch(`/api/mesapartes/documentos/${id}`);
        if (!response.ok) throw new Error('Error al cargar documento');
        
        const documento = await response.json();
        // Implementar visualización del documento
        console.log('Ver documento:', documento);
    } catch (error) {
        console.error('Error:', error);
        window.mesapartesModules.showError('Error al cargar el documento');
    }
};

window.mesapartesModules.editarDocumento = async function(id) {
    try {
        const response = await fetch(`/api/mesapartes/documentos/${id}`);
        if (!response.ok) throw new Error('Error al cargar documento');
        
        const documento = await response.json();
        // Implementar edición del documento
        console.log('Editar documento:', documento);
    } catch (error) {
        console.error('Error:', error);
        window.mesapartesModules.showError('Error al cargar el documento');
    }
};

window.mesapartesModules.derivarDocumento = async function(id) {
    try {
        const response = await fetch(`/api/mesapartes/documentos/${id}`);
        if (!response.ok) throw new Error('Error al cargar documento');
        
        const documento = await response.json();
        // Implementar derivación del documento
        console.log('Derivar documento:', documento);
    } catch (error) {
        console.error('Error:', error);
        window.mesapartesModules.showError('Error al cargar el documento');
    }
};

// Función para buscar documentos
window.mesapartesModules.searchDocuments = async function(searchTerm) {
    try {
        const response = await fetch(`/api/mesapartes/documentos/search?q=${encodeURIComponent(searchTerm)}`);
        if (!response.ok) throw new Error('Error en la búsqueda');
        
        const results = await response.json();
        state.documentos = results;
        renderDocumentos();
    } catch (error) {
        console.error('Error:', error);
        window.mesapartesModules.showError('Error en la búsqueda');
    }
};

// Función para refrescar documentos
window.mesapartesModules.refreshDocuments = loadDocumentos; 