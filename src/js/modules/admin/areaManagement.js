import { showError } from '../../common/uiHelpers.js';

// Gestión de áreas especializadas
export async function loadAreas() {
    try {
        console.log('=== INICIO DE CARGA DE ÁREAS ===');
        console.log('Realizando petición a /api/areas...');
        
        const response = await fetch('/api/areas');
        console.log('Respuesta recibida:', {
            ok: response.ok,
            status: response.status,
            statusText: response.statusText
        });

        if (!response.ok) {
            throw new Error(`Error al cargar áreas: ${response.status} - ${response.statusText}`);
        }

        const areas = await response.json();
        console.log('Áreas obtenidas:', {
            cantidad: areas.length,
            areas: areas
        });

        await renderAreas(areas);
        console.log('=== FIN DE CARGA DE ÁREAS ===');
        return areas; // Retornar las áreas para que puedan ser usadas por otras funciones
    } catch (error) {
        console.error('Error detallado al cargar áreas:', error);
        console.error('Stack trace:', error.stack);
        console.error('Estado del DOM al momento del error:', {
            tabla: document.getElementById('areasEspecializadasTable')?.outerHTML,
            seccion: document.getElementById('areas-section')?.outerHTML
        });
        showError('Error al cargar la lista de áreas especializadas');
        return []; // Retornar array vacío en caso de error
    }
}

export function renderAreas(areas) {
    console.log('=== INICIO DE RENDERIZADO DE ÁREAS ===');
    try {
        const tbody = document.querySelector('#areasEspecializadasTable tbody');
        if (!tbody) {
            console.error('No se encontró la tabla de áreas (#areasEspecializadasTable tbody)');
            console.log('Estado del DOM:', {
                tabla: document.getElementById('areasEspecializadasTable')?.outerHTML,
                seccion: document.getElementById('areas-section')?.outerHTML
            });
            throw new Error('No se encontró la tabla de áreas');
        }

        console.log('Limpiando tabla existente...');
        tbody.innerHTML = '';
        
        console.log('Procesando áreas para mostrar en tabla...');
        areas.forEach(area => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${area.NombreArea || ''}</td>
                <td>${area.CodigoIdentificacion || ''}</td>
                <td>${area.TipoArea || ''}</td>
                <td>
                    <span class="badge ${area.IsActive ? 'bg-success' : 'bg-danger'}">
                        ${area.IsActive ? 'Activo' : 'Inactivo'}
                    </span>
                </td>
                <td>
                    <button class="btn btn-success btn-sm edit-area-btn" data-area-id="${area.IDArea}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-danger btn-sm delete-area-btn ms-2" data-area-id="${area.IDArea}">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });
        
        console.log('Se agregaron', areas.length, 'áreas a la tabla');
        console.log('Estado final de la tabla:', {
            filas: tbody.children.length,
            html: tbody.innerHTML
        });
        console.log('=== FIN DE RENDERIZADO DE ÁREAS ===');
    } catch (error) {
        console.error('Error al renderizar áreas:', error);
        console.error('Stack trace:', error.stack);
        throw error; // Re-lanzar el error para que sea manejado por loadAreas
    }
}

// Función para actualizar los selectores de área
export function updateAreaSelects(areas) {
    console.log('=== INICIO DE ACTUALIZACIÓN DE SELECTORES DE ÁREA ===');
    try {
        if (!areas || !Array.isArray(areas)) {
            throw new Error('No se proporcionaron áreas válidas para actualizar los selectores');
        }

        const areaSelects = document.querySelectorAll('.area-select');
        console.log(`Encontrados ${areaSelects.length} selectores de área para actualizar`);

        areaSelects.forEach(select => {
            const currentValue = select.value;
            console.log(`Actualizando selector ${select.id}, valor actual: ${currentValue}`);

            // Filtrar solo áreas activas
            const areasActivas = areas.filter(area => area.IsActive);
            console.log(`Áreas activas disponibles: ${areasActivas.length}`);

            // Limpiar opciones existentes
            select.innerHTML = '';

            // Agregar opción por defecto
            const defaultOption = document.createElement('option');
            defaultOption.value = '';
            defaultOption.textContent = 'Seleccione un área';
            select.appendChild(defaultOption);

            // Agregar áreas activas
            areasActivas.forEach(area => {
                const option = document.createElement('option');
                option.value = area.IDArea;
                option.textContent = area.NombreArea;
                select.appendChild(option);
            });

            // Restaurar valor seleccionado si aún existe
            if (currentValue && areasActivas.some(area => area.IDArea.toString() === currentValue)) {
                select.value = currentValue;
                console.log(`Valor restaurado: ${currentValue}`);
            }
        });

        console.log('=== FIN DE ACTUALIZACIÓN DE SELECTORES DE ÁREA ===');
    } catch (error) {
        console.error('Error al actualizar selectores de área:', error);
        console.error('Stack trace:', error.stack);
        showError('Error al actualizar los selectores de área');
    }
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
