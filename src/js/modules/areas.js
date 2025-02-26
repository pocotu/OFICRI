// Funciones relacionadas con áreas
export async function loadAreas() {
    try {
        const response = await fetch('/api/areas');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const areas = await response.json();
        renderAreas(areas);
        populateAreaSelect(areas);
    } catch (error) {
        console.error('Error al cargar áreas:', error);
    }
}

export function renderAreas(areas) {
    const tbody = document.querySelector('#areas-table tbody');
    if (!tbody) return;

    tbody.innerHTML = '';
    areas.forEach(area => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${area.NombreArea || ''}</td>
            <td>${area.CodigoIdentificacion || ''}</td>
            <td>${area.TipoArea || ''}</td>
            <td>
                <button class="action-btn edit-btn" data-id="${area.IDArea}">
                    <i class="fas fa-edit"></i> Editar
                </button>
                <button class="action-btn delete-btn" data-id="${area.IDArea}">
                    <i class="fas fa-trash"></i> Eliminar
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    // Agregar event listeners para los botones
    tbody.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', () => editArea(btn.dataset.id));
    });
    tbody.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', () => deleteArea(btn.dataset.id));
    });
}

export function populateAreaSelect(areas) {
    const select = document.getElementById('area-select');
    if (!select) return;

    select.innerHTML = '<option value="">Seleccione un área</option>';
    areas.forEach(area => {
        const option = document.createElement('option');
        option.value = area.IDArea;
        option.textContent = `${area.NombreArea} ${area.CodigoIdentificacion ? `(${area.CodigoIdentificacion})` : ''}`;
        select.appendChild(option);
    });
}

export async function handleAreaSubmit(e) {
    e.preventDefault();
    
    try {
        const areaData = {
            nombreArea: document.getElementById('area-name-input').value,
            codigoIdentificacion: document.getElementById('area-code-input').value,
            tipoArea: document.getElementById('area-type-select').value,
            isActive: true
        };

        const response = await fetch('/api/areas', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(areaData)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        alert('Área creada exitosamente');
        document.getElementById('area-modal').style.display = 'none';
        e.target.reset();
        await loadAreas();
    } catch (error) {
        console.error('Error al crear área:', error);
        alert('Error al crear área: ' + error.message);
    }
}

export async function editArea(id) {
    try {
        const response = await fetch(`/api/areas/${id}`);
        if (!response.ok) {
            throw new Error('Error al cargar área');
        }
        const area = await response.json();
        
        document.getElementById('area-name-input').value = area.NombreArea;
        document.getElementById('area-code-input').value = area.CodigoIdentificacion;
        document.getElementById('area-type-select').value = area.TipoArea;
        
        document.getElementById('area-modal').style.display = 'block';
    } catch (error) {
        console.error('Error:', error);
        alert('Error al cargar área');
    }
}

export async function deleteArea(id) {
    if (confirm('¿Está seguro de que desea eliminar esta área?')) {
        try {
            const response = await fetch(`/api/areas/${id}`, {
                method: 'DELETE'
            });
            
            if (!response.ok) {
                throw new Error('Error al eliminar área');
            }
            
            alert('Área eliminada exitosamente');
            await loadAreas();
        } catch (error) {
            console.error('Error:', error);
            alert('Error al eliminar área');
        }
    }
}
