// Gestión de resultados
export async function loadResults(sampleId) {
    try {
        const response = await fetch(`/api/toxicologia/muestras/${sampleId}/resultados`);
        if (!response.ok) throw new Error('Error al cargar resultados');
        
        const results = await response.json();
        renderResults(results);
    } catch (error) {
        console.error('Error:', error);
        showError('Error al cargar los resultados');
    }
}

export function renderResults(results) {
    const tbody = document.querySelector('#resultadosTable tbody');
    tbody.innerHTML = '';

    results.forEach(resultado => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${resultado.TipoPrueba}</td>
            <td>${resultado.Resultado}</td>
            <td>${resultado.FechaAnalisis}</td>
            <td>${resultado.Observaciones || ''}</td>
            <td>
                <button onclick="editResult(${resultado.IDResultado})" class="action-btn edit">
                    <i class="fas fa-edit"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

export async function handleAddResult(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const sampleId = document.getElementById('currentSampleId').value;
    
    try {
        const response = await fetch(`/api/toxicologia/muestras/${sampleId}/resultados`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(Object.fromEntries(formData))
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Error al agregar resultado');
        }

        document.getElementById('newResultModal').style.display = 'none';
        await loadResults(sampleId);
    } catch (error) {
        console.error('Error:', error);
        showError(error.message);
    }
}
