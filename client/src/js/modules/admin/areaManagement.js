// Variable global para almacenar las áreas
let areas = [];

// Gestión de áreas
async function loadAreas() {
    try {
        console.log('=== INICIO DE CARGA DE ÁREAS ===');
        console.log('Realizando petición a /api/areas...');
        
        const response = await fetch('/api/areas');
        console.log('Respuesta recibida:', response);
        
        if (!response.ok) {
            throw new Error(`Error al cargar áreas: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Respuesta recibida:', data);
        
        // Actualizar la variable global de áreas
        areas = data;
        
        console.log(`Se encontraron ${areas.length} áreas`);
        
        // Actualizar la tabla de áreas
        updateAreasTable();
        
        // Actualizar los selectores de áreas
        updateAreaSelects();
        
        console.log('=== FIN DE CARGA DE ÁREAS ===');
    } catch (error) {
        console.error('Error al cargar áreas:', error);
        if (window.uiHelpers) {
            window.uiHelpers.showError('Error al cargar áreas: ' + error.message);
        } else {
            alert('Error al cargar áreas: ' + error.message);
        }
    }
}

function updateAreasTable() {
    const table = document.querySelector('#areasEspecializadasTable');
    if (!table) {
        console.log('No se encontró la tabla de áreas');
        return;
    }
    
    let tableBody = table.querySelector('tbody');
    
    // Si no existe el tbody, crearlo
    if (!tableBody) {
        tableBody = document.createElement('tbody');
        table.appendChild(tableBody);
    } else {
        // Limpiar contenido existente
        tableBody.innerHTML = '';
    }
    
    // Si no hay áreas, mostrar mensaje
    if (areas.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="5" class="text-center">No hay áreas registradas</td></tr>';
        return;
    }
    
    // Agregar cada área a la tabla
    areas.forEach(area => {
        const row = document.createElement('tr');
        row.dataset.areaId = area.IDArea;
        
        row.innerHTML = `
            <td>${area.NombreArea}</td>
            <td>${area.CodigoIdentificacion || 'N/A'}</td>
            <td>${area.TipoArea || 'General'}</td>
            <td>${area.Estado ? 'Activo' : 'Inactivo'}</td>
            <td class="actions-cell">
                <button class="action-btn edit-btn" title="Editar área"><i class="fas fa-edit"></i></button>
                <button class="action-btn delete-btn" title="Eliminar área"><i class="fas fa-trash-alt"></i></button>
            </td>
        `;
        
        tableBody.appendChild(row);
    });
    
    // Configurar botones de acción
    configureAreaButtons();
}

function updateAreaSelects() {
    // Actualizar todos los selectores de áreas en la página
    document.querySelectorAll('select.area-select').forEach(select => {
        // Guardar el valor seleccionado actualmente
        const currentValue = select.value;
        
        // Limpiar opciones existentes
        select.innerHTML = '';
        
        // Agregar opción por defecto
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = '-- Seleccione un área --';
        select.appendChild(defaultOption);
        
        // Agregar cada área como opción
        areas.forEach(area => {
            const option = document.createElement('option');
            option.value = area.IDArea;
            option.textContent = area.NombreArea;
            if (area.CodigoIdentificacion) {
                option.textContent += ` (${area.CodigoIdentificacion})`;
            }
            select.appendChild(option);
        });
        
        // Restaurar el valor seleccionado si existe
        if (currentValue) {
            select.value = currentValue;
        }
    });
}

// Configurar botones de acción
function configureAreaButtons() {
    // Configurar botones de edición
    document.querySelectorAll('.edit-btn').forEach(button => {
        button.addEventListener('click', handleEditClick);
    });
    
    // Configurar botones de eliminación
    document.querySelectorAll('.delete-btn').forEach(button => {
        button.addEventListener('click', handleDeleteClick);
    });
}

function handleEditAreaClick(e) {
    const areaId = e.currentTarget.closest('tr').dataset.areaId;
    console.log(`Editando área con ID: ${areaId}`);
    prepareAreaEdit(areaId);
}

function handleDeleteAreaClick(e) {
    const areaId = e.currentTarget.closest('tr').dataset.areaId;
    console.log(`Eliminando área con ID: ${areaId}`);
    deleteArea(areaId);
}

async function handleCreateArea(e) {
    e.preventDefault();
    
    try {
        console.log('=== INICIO DE CREACIÓN DE ÁREA ===');
        
        // Obtener datos del formulario
        const nombre = document.getElementById('area-nombre').value.trim();
        const descripcion = document.getElementById('area-descripcion').value.trim();
        const codigo = document.getElementById('area-codigo')?.value.trim() || '';
        
        // Validar datos
        if (!nombre) {
            throw new Error('El nombre del área es obligatorio');
        }
        
        console.log('Datos del área:', {
            nombre,
            descripcion,
            codigo
        });
        
        // Enviar datos al servidor
        console.log('Enviando petición a /api/areas...');
        const response = await fetch('/api/areas', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                nombreArea: nombre,
                descripcion,
                codigoIdentificacion: codigo
            })
        });
        
        console.log('Respuesta recibida:', {
            status: response.status,
            ok: response.ok
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `Error al crear área: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Área creada exitosamente:', data);
        
        // Cerrar modal
        const modal = document.getElementById('areaModal');
        if (modal && typeof bootstrap !== 'undefined') {
            const bsModal = bootstrap.Modal.getInstance(modal);
            if (bsModal) {
                bsModal.hide();
            }
        }
        
        // Limpiar formulario
        document.getElementById('createAreaForm').reset();
        
        // Recargar áreas
        await loadAreas();
        
        // Mostrar mensaje de éxito
        if (window.uiHelpers) {
            window.uiHelpers.showSuccessMessage('Área creada exitosamente');
        } else {
            alert('Área creada exitosamente');
        }
        
        console.log('=== FIN DE CREACIÓN DE ÁREA ===');
    } catch (error) {
        console.error('Error al crear área:', error);
        if (window.uiHelpers) {
            window.uiHelpers.showError('Error al crear área: ' + error.message);
        } else {
            alert('Error al crear área: ' + error.message);
        }
    }
}

async function handleEditArea(e) {
    e.preventDefault();
    
    try {
        console.log('=== INICIO DE EDICIÓN DE ÁREA ===');
        
        // Obtener ID del área en edición
        const areaId = document.getElementById('edit-area-id').value;
        if (!areaId) {
            throw new Error('No se ha seleccionado un área para editar');
        }
        
        // Obtener datos del formulario
        const nombre = document.getElementById('edit-area-nombre').value.trim();
        const descripcion = document.getElementById('edit-area-descripcion').value.trim();
        const codigo = document.getElementById('edit-area-codigo')?.value.trim();
        
        // Validar datos
        if (!nombre) {
            throw new Error('El nombre del área es obligatorio');
        }
        
        console.log('Datos actualizados del área:', {
            id: areaId,
            nombre,
            descripcion,
            codigo
        });
        
        // Enviar datos al servidor
        console.log(`Enviando petición a /api/areas/${areaId}...`);
        const response = await fetch(`/api/areas/${areaId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                nombreArea: nombre,
                descripcion,
                codigoIdentificacion: codigo
            })
        });
        
        console.log('Respuesta recibida:', {
            status: response.status,
            ok: response.ok
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `Error al actualizar área: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Área actualizada exitosamente:', data);
        
        // Cerrar modal
        const modal = document.getElementById('editAreaModal');
        if (modal && typeof bootstrap !== 'undefined') {
            const bsModal = bootstrap.Modal.getInstance(modal);
            if (bsModal) {
                bsModal.hide();
            }
        }
        
        // Limpiar formulario
        document.getElementById('editAreaForm').reset();
        
        // Recargar áreas
        await loadAreas();
        
        // Mostrar mensaje de éxito
        if (window.uiHelpers) {
            window.uiHelpers.showSuccessMessage('Área actualizada exitosamente');
        } else {
            alert('Área actualizada exitosamente');
        }
        
        console.log('=== FIN DE EDICIÓN DE ÁREA ===');
    } catch (error) {
        console.error('Error al actualizar área:', error);
        if (window.uiHelpers) {
            window.uiHelpers.showError('Error al actualizar área: ' + error.message);
        } else {
            alert('Error al actualizar área: ' + error.message);
        }
    }
}

async function deleteArea(areaId) {
    try {
        console.log('=== INICIO DE ELIMINACIÓN DE ÁREA ===');
        
        if (!areaId) {
            throw new Error('ID de área no válido');
        }
        
        // Confirmar eliminación
        const confirmed = confirm('¿Está seguro de que desea eliminar esta área? Esta acción no se puede deshacer.');
        
        if (!confirmed) {
            console.log('Eliminación cancelada por el usuario');
            return;
        }
        
        // Proceder con la eliminación
        await performAreaDeletion(areaId);
        
    } catch (error) {
        console.error('Error al eliminar área:', error);
        if (window.uiHelpers) {
            window.uiHelpers.showError('Error al eliminar área: ' + error.message);
        } else {
            alert('Error al eliminar área: ' + error.message);
        }
    }
}

async function performAreaDeletion(areaId) {
    try {
        console.log(`Eliminando área con ID: ${areaId}`);
        
        // Enviar petición al servidor
        console.log(`Enviando petición a /api/areas/${areaId}...`);
        const response = await fetch(`/api/areas/${areaId}`, {
            method: 'DELETE'
        });
        
        console.log('Respuesta recibida:', {
            status: response.status,
            ok: response.ok
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `Error al eliminar área: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Área eliminada exitosamente:', data);
        
        // Recargar áreas
        await loadAreas();
        
        // Mostrar mensaje de éxito
        if (window.uiHelpers) {
            window.uiHelpers.showSuccessMessage('Área eliminada exitosamente');
        } else {
            alert('Área eliminada exitosamente');
        }
        
        console.log('=== FIN DE ELIMINACIÓN DE ÁREA ===');
    } catch (error) {
        console.error('Error al eliminar área:', error);
        if (window.uiHelpers) {
            window.uiHelpers.showError('Error al eliminar área: ' + error.message);
        } else {
            alert('Error al eliminar área: ' + error.message);
        }
    }
}

async function prepareAreaEdit(areaId) {
    try {
        console.log(`Preparando edición de área con ID: ${areaId}`);
        
        // Buscar el área en la lista cargada
        const area = areas.find(a => a.IDArea == areaId);
        if (!area) {
            throw new Error('Área no encontrada');
        }
        
        console.log('Datos del área encontrada:', area);
        
        // Llenar formulario con datos del área
        document.getElementById('edit-area-id').value = area.IDArea;
        document.getElementById('edit-area-nombre').value = area.NombreArea;
        document.getElementById('edit-area-descripcion').value = area.Descripcion || '';
        
        // Si existe el campo de código, llenarlo
        const codigoField = document.getElementById('edit-area-codigo');
        if (codigoField) {
            codigoField.value = area.CodigoIdentificacion || '';
        }
        
        // Mostrar modal
        const modal = document.getElementById('editAreaModal');
        if (modal && typeof bootstrap !== 'undefined') {
            const bsModal = new bootstrap.Modal(modal);
            bsModal.show();
        }
        
    } catch (error) {
        console.error('Error al preparar edición de área:', error);
        if (window.uiHelpers) {
            window.uiHelpers.showError('Error al preparar edición de área: ' + error.message);
        } else {
            alert('Error al preparar edición de área: ' + error.message);
        }
    }
}

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    console.log('Inicializando módulo de gestión de áreas');
    
    // Configurar evento para el botón de agregar área
    const addAreaButton = document.getElementById('addAreaButton');
    if (addAreaButton) {
        addAreaButton.addEventListener('click', () => {
            console.log('Botón de agregar área clickeado');
            
            // Mostrar modal
            const modal = document.getElementById('areaModal');
            if (modal && typeof bootstrap !== 'undefined') {
                const bsModal = new bootstrap.Modal(modal);
                bsModal.show();
            }
        });
    }
    
    // Configurar evento para el formulario de creación de área
    const createAreaForm = document.getElementById('createAreaForm');
    if (createAreaForm) {
        createAreaForm.addEventListener('submit', handleCreateArea);
    }
    
    // Configurar evento para el formulario de edición de área
    const editAreaForm = document.getElementById('editAreaForm');
    if (editAreaForm) {
        editAreaForm.addEventListener('submit', handleEditArea);
    }
    
    // Cargar áreas inicialmente
    loadAreas();
});

// Exportar funciones necesarias
window.adminModules = window.adminModules || {};
window.adminModules.areaManagement = {
    loadAreas,
    updateAreaSelects
};
