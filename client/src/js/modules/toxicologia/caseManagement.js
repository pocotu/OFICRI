// Gestión de casos de toxicología
export async function loadCases() {
    try {
        const response = await fetch('/api/toxicologia/casos');
        if (!response.ok) throw new Error('Error al cargar casos');
        
        const cases = await response.json();
        renderCases(cases);
    } catch (error) {
        console.error('Error:', error);
        showError('Error al cargar la lista de casos');
    }
}

export function renderCases(cases) {
    const tbody = document.querySelector('#casosToxicologiaTable tbody');
    tbody.innerHTML = '';

    cases.forEach(caso => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${caso.NumeroCaso}</td>
            <td>${caso.FechaIngreso}</td>
            <td>${caso.TipoMuestra}</td>
            <td>${caso.Estado}</td>
            <td>
                <button onclick="viewCase(${caso.IDCaso})" class="action-btn view">
                    <i class="fas fa-eye"></i>
                </button>
                <button onclick="editCase(${caso.IDCaso})" class="action-btn edit">
                    <i class="fas fa-edit"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

export async function handleCreateCase(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    try {
        const response = await fetch('/api/toxicologia/casos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(Object.fromEntries(formData))
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Error al crear caso');
        }

        document.getElementById('newCaseModal').style.display = 'none';
        await loadCases();
    } catch (error) {
        console.error('Error:', error);
        showError(error.message);
    }
}
