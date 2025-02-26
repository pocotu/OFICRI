import { showError } from '../../common/uiHelpers.js';

// Gestión de áreas especializadas
export async function loadAreas() {
    console.log('Iniciando loadAreas()');
    try {
        // Explicitly request all areas including inactive ones
        const response = await fetch('/api/areas?includeInactive=true', {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Cache-Control': 'no-cache'
            }
        });
        
        console.log('Respuesta de /api/areas:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Error response:', errorText);
            throw new Error('Error al cargar áreas');
        }
        
        const areas = await response.json();
        console.log('Áreas cargadas (incluyendo inactivas):', areas);
        
        if (!Array.isArray(areas)) {
            console.error('La respuesta no es un array:', areas);
            throw new Error('Formato de respuesta inválido');
        }
        
        renderAreas(areas);
        updateAreaSelects(areas);
        return areas; // Retornamos las áreas para uso en otros módulos
    } catch (error) {
        console.error('Error en loadAreas:', error);
        showError('Error al cargar la lista de áreas');
        return [];
    }
}

export function renderAreas(areas) {
    const tbody = document.querySelector('#areasEspecializadasTable tbody');
    if (!tbody) {
        console.error('No se encontró la tabla de áreas');
        return;
    }

    tbody.innerHTML = '';
    areas.forEach(area => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${area.NombreArea || ''}</td>
            <td>${area.CodigoIdentificacion || ''}</td>
            <td>${area.TipoArea || ''}</td>
            <td>
                <button class="status-btn ${area.IsActive ? 'active' : 'inactive'}" data-area-id="${area.IDArea}">
                    ${area.IsActive ? 'Activo' : 'Inactivo'}
                </button>
            </td>
            <td>
                <button data-area-id="${area.IDArea}" class="action-btn edit">
                    <i class="fas fa-edit"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    // Event listener para el botón de estado
    document.querySelectorAll('.status-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const areaId = e.currentTarget.dataset.areaId;
            const currentStatus = e.currentTarget.classList.contains('active');
            try {
                const response = await fetch(`/api/areas/${areaId}/toggle-status`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ isActive: !currentStatus })
                });

                if (!response.ok) throw new Error('Error al actualizar el estado');

                // Actualizar el botón
                e.currentTarget.classList.toggle('active');
                e.currentTarget.classList.toggle('inactive');
                e.currentTarget.textContent = !currentStatus ? 'Activo' : 'Inactivo';
            } catch (error) {
                console.error('Error al cambiar el estado:', error);
                showError('Error al actualizar el estado del área');
            }
        });
    });

    // Event listener para el botón de editar
    document.querySelectorAll('.action-btn.edit').forEach(btn => {
        btn.addEventListener('click', (e) => {
            console.log('Edit button clicked for area ID:', e.currentTarget.dataset.areaId);
            const areaId = e.currentTarget.dataset.areaId;
            if (areaId) editArea(areaId);
        });
    });
}

export function updateAreaSelects(areas) {
    console.log('Iniciando updateAreaSelects con áreas:', areas);
    
    if (!areas || !Array.isArray(areas)) {
        console.error('No se proporcionaron áreas válidas. Valor recibido:', areas);
        return;
    }

    // Verificar que las áreas tengan la estructura correcta
    if (!areas.every(area => area.IDArea && area.NombreArea)) {
        console.error('Las áreas no tienen la estructura correcta:', areas);
        return;
    }

    // Buscar todos los selectores de área
    const areaSelects = document.querySelectorAll('select[id$="-area"], select[id="area"]');
    console.log('Selectores encontrados:', areaSelects.length, Array.from(areaSelects).map(s => s.id));
    
    if (areaSelects.length === 0) {
        console.error('No se encontraron selectores de área');
        return;
    }

    areaSelects.forEach((select, index) => {
        // Asegurarse de que el selector tenga la clase area-select
        if (!select.classList.contains('area-select')) {
            select.classList.add('area-select');
        }

        console.log(`Actualizando selector ${index + 1}:`, {
            id: select.id,
            currentValue: select.value,
            options: select.options.length
        });
        
        // Guardar el valor seleccionado actualmente
        const currentValue = select.value;
        
        // Limpiar las opciones existentes
        select.innerHTML = '<option value="">Seleccione un área</option>';
        
        // Agregar las nuevas opciones
        areas.forEach(area => {
            const option = document.createElement('option');
            option.value = area.IDArea;
            option.textContent = `${area.NombreArea} ${area.CodigoIdentificacion ? `(${area.CodigoIdentificacion})` : ''}`;
            select.appendChild(option);
        });
        
        // Restaurar el valor seleccionado si existía
        if (currentValue) {
            select.value = currentValue;
            console.log(`Valor restaurado para selector ${index + 1}:`, {
                id: select.id,
                value: select.value,
                options: select.options.length
            });
        }
    });
    
    console.log('updateAreaSelects completado');
}

export async function handleCreateArea(e) {
    e.preventDefault();
    const form = e.target;
    const nombreArea = form.querySelector('#nombreArea').value;
    const codigoArea = form.querySelector('#codigoArea').value;
    const tipoArea = form.querySelector('#tipoArea').value;

    try {
        const response = await fetch('/api/areas', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                nombreArea,
                codigoArea,
                tipoArea
            })
        });

        if (!response.ok) throw new Error('Error al crear área');

        // Recargar la lista de áreas
        await loadAreas();
        
        // Cerrar el modal
        const modal = document.querySelector('#areaModal');
        if (modal) modal.style.display = 'none';
        
        // Limpiar el formulario
        form.reset();
    } catch (error) {
        console.error('Error:', error);
        showError('Error al crear el área');
    }
}

export async function editArea(areaId) {
    try {
        const response = await fetch(`/api/areas/${areaId}`);
        if (!response.ok) throw new Error('Error al obtener área');
        
        const area = await response.json();
        
        // Obtener tipos de área
        const tiposResponse = await fetch('/api/tipos'); // Asegúrate de que esta URL sea correcta
        console.log('Consultando tipos de área en:', '/api/tipos');
        if (!tiposResponse.ok) {
            console.error('Error al obtener tipos de área:', tiposResponse.status, tiposResponse.statusText);
            throw new Error('Error al obtener tipos de área');
        }

        const tipos = await tiposResponse.json();
        console.log('Tipos de área obtenidos:', tipos);

        // Llenar el formulario de edición
        console.log('Estado del DOM:', document.body.innerHTML);
        console.log('Buscando modal con ID: editAreaModal');
        const modal = document.querySelector('#editAreaModal');
        console.log('Modal encontrado:', !!modal);
        if (modal) {
            console.log('Estado del modal antes de mostrarlo:', modal.style.display);
            if (modal.style.display === 'none') {
                console.log('El modal está oculto, mostrando el modal...');
                modal.style.display = 'block';
            } else {
                console.log('El modal ya está visible, llenando datos...');
            }

            // Mostrar el modal
            modal.style.display = 'block';
            console.log('Modal mostrado con datos:', { nombre: area.NombreArea, codigo: area.CodigoIdentificacion, tipo: area.TipoArea });
            
            const form = modal.querySelector('form');
            form.querySelector('#edit-nombreArea').value = area.NombreArea;
            form.querySelector('#edit-codigoArea').value = area.CodigoIdentificacion;
            form.querySelector('#edit-tipoArea').innerHTML = ''; // Limpiar opciones existentes
            
            // Llenar el select de tipos de área
            tipos.forEach(tipo => {
                const option = document.createElement('option');
                option.value = tipo.id; // Asegúrate de que el campo sea correcto
                option.textContent = tipo.nombre; // Asegúrate de que el campo sea correcto
                form.querySelector('#edit-tipoArea').appendChild(option);
            });
            
            form.dataset.areaId = areaId;
        } else {
            console.error('No se encontró el modal de edición');
        }
    } catch (error) {
        console.error('Error:', error);
        showError('Error al cargar los datos del área');
    }
}

export async function deleteArea(areaId) {
    if (!confirm('¿Está seguro de que desea eliminar esta área?')) return;
    
    try {
        const response = await fetch(`/api/areas/${areaId}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) throw new Error('Error al eliminar área');
        
        // Recargar la lista de áreas
        await loadAreas();
    } catch (error) {
        console.error('Error:', error);
        showError('Error al eliminar el área');
    }
}
