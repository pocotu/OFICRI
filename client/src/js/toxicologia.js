// Este archivo es un punto de entrada para los módulos de toxicología
// Inicialización cuando se carga el script
document.addEventListener('DOMContentLoaded', () => {
    console.log('Módulo de Toxicología cargado');
    
    // Inicializar el dashboard de toxicología
    if (window.toxicologiaDashboard && typeof window.toxicologiaDashboard.init === 'function') {
        window.toxicologiaDashboard.init();
    }
    
    // Configurar manejadores de eventos para los elementos de la interfaz
    setupEventListeners();
});

// Configurar manejadores de eventos
function setupEventListeners() {
    // Botón para agregar nuevo documento
    const addDocumentBtn = document.querySelector('.add-document-btn');
    if (addDocumentBtn) {
        addDocumentBtn.addEventListener('click', () => {
            console.log('Agregar nuevo documento');
            // Aquí se podría llamar a una función del módulo caseManagement
            if (window.caseManagement && typeof window.caseManagement.createNewCase === 'function') {
                window.caseManagement.createNewCase();
            }
        });
    }
    
    // Botones de acción en la tabla de documentos
    const actionButtons = document.querySelectorAll('.action-btn');
    actionButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            const action = e.currentTarget.classList.contains('view') ? 'view' :
                          e.currentTarget.classList.contains('edit') ? 'edit' :
                          e.currentTarget.classList.contains('add-doc') ? 'add-doc' :
                          e.currentTarget.classList.contains('download') ? 'download' : '';
            
            const row = e.currentTarget.closest('tr');
            const caseId = row ? row.cells[0].textContent : null;
            
            console.log(`Acción ${action} en caso ID: ${caseId}`);
            
            // Llamar a la función correspondiente según la acción
            if (action === 'view' && window.caseManagement && typeof window.caseManagement.viewCase === 'function') {
                window.caseManagement.viewCase(caseId);
            } else if (action === 'edit' && window.caseManagement && typeof window.caseManagement.editCase === 'function') {
                window.caseManagement.editCase(caseId);
            } else if (action === 'add-doc' && window.resultManagement && typeof window.resultManagement.addResult === 'function') {
                window.resultManagement.addResult(caseId);
            } else if (action === 'download' && window.resultManagement && typeof window.resultManagement.downloadReport === 'function') {
                window.resultManagement.downloadReport(caseId);
            }
        });
    });
    
    // Filtros de estadísticas
    const statBoxes = document.querySelectorAll('.stat-box');
    statBoxes.forEach(box => {
        box.addEventListener('click', () => {
            const filter = box.dataset.filter;
            console.log(`Filtrar por estado: ${filter}`);
            // Aquí se podría llamar a una función para filtrar los casos
        });
    });
} 