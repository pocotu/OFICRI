// Gestión de muestras
export async function loadSamples(caseId) {
    try {
        const response = await fetch(`/api/toxicologia/casos/${caseId}/muestras`);
        if (!response.ok) throw new Error('Error al cargar muestras');
        
        const samples = await response.json();
        renderSamples(samples);
    } catch (error) {
        console.error('Error:', error);
        showError('Error al cargar la lista de muestras');
    }
}

export function renderSamples(samples) {
    const tbody = document.querySelector('#muestrasTable tbody');
    tbody.innerHTML = '';

    samples.forEach(muestra => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${muestra.CodigoMuestra}</td>
            <td>${muestra.TipoMuestra}</td>
            <td>${muestra.FechaRecoleccion}</td>
            <td>${muestra.Estado}</td>
            <td>
                <button onclick="viewSample(${muestra.IDMuestra})" class="action-btn view">
                    <i class="fas fa-eye"></i>
                </button>
                <button onclick="editSample(${muestra.IDMuestra})" class="action-btn edit">
                    <i class="fas fa-edit"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

export async function handleAddSample(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const caseId = document.getElementById('currentCaseId').value;
    
    try {
        const response = await fetch(`/api/toxicologia/casos/${caseId}/muestras`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(Object.fromEntries(formData))
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Error al agregar muestra');
        }

        document.getElementById('newSampleModal').style.display = 'none';
        await loadSamples(caseId);
    } catch (error) {
        console.error('Error:', error);
        showError(error.message);
    }
}
