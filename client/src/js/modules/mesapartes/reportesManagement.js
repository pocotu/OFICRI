// Módulo de reportes
window.mesapartesModules = window.mesapartesModules || {};

// Estado local del módulo
const state = {
    estadisticas: {
        documentosDia: 0,
        documentosPendientes: 0,
        documentosDerivados: 0,
        documentosMes: 0
    },
    filtros: {
        fechaInicio: null,
        fechaFin: null,
        tipo: 'todos',
        estado: 'todos'
    }
};

// Inicialización del módulo
window.mesapartesModules.initReportesManagement = function() {
    // Cargar estadísticas iniciales
    loadEstadisticas();
};

// Cargar estadísticas
async function loadEstadisticas() {
    try {
        // Cargar estadísticas del día
        const responseDia = await fetch('/api/mesapartes/estadisticas/dia');
        if (!responseDia.ok) throw new Error('Error al cargar estadísticas del día');
        const dataDia = await responseDia.json();
        state.estadisticas.documentosDia = dataDia.total;

        // Cargar documentos pendientes
        const responsePendientes = await fetch('/api/mesapartes/estadisticas/pendientes');
        if (!responsePendientes.ok) throw new Error('Error al cargar documentos pendientes');
        const dataPendientes = await responsePendientes.json();
        state.estadisticas.documentosPendientes = dataPendientes.total;

        // Cargar documentos derivados
        const responseDerivados = await fetch('/api/mesapartes/estadisticas/derivados');
        if (!responseDerivados.ok) throw new Error('Error al cargar documentos derivados');
        const dataDerivados = await responseDerivados.json();
        state.estadisticas.documentosDerivados = dataDerivados.total;

        // Cargar estadísticas del mes
        const responseMes = await fetch('/api/mesapartes/estadisticas/mes');
        if (!responseMes.ok) throw new Error('Error al cargar estadísticas del mes');
        const dataMes = await responseMes.json();
        state.estadisticas.documentosMes = dataMes.total;

        // Actualizar UI
        updateEstadisticasUI();
    } catch (error) {
        console.error('Error:', error);
        window.mesapartesModules.showError('Error al cargar las estadísticas');
    }
}

// Actualizar UI con estadísticas
function updateEstadisticasUI() {
    // Actualizar contadores
    document.getElementById('documentos-dia').textContent = state.estadisticas.documentosDia;
    document.getElementById('documentos-pendientes').textContent = state.estadisticas.documentosPendientes;
    document.getElementById('documentos-derivados').textContent = state.estadisticas.documentosDerivados;
    document.getElementById('documentos-mes').textContent = state.estadisticas.documentosMes;

    // Animar los números
    animateNumbers();
}

// Animación de números
function animateNumbers() {
    document.querySelectorAll('.report-value').forEach(element => {
        element.classList.add('number-animation');
        setTimeout(() => {
            element.classList.remove('number-animation');
        }, 1000);
    });
}

// Generar reporte detallado
window.mesapartesModules.generarReporte = async function(tipo) {
    try {
        const response = await fetch(`/api/mesapartes/reportes/${tipo}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(state.filtros)
        });

        if (!response.ok) throw new Error('Error al generar reporte');

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `reporte_${tipo}_${new Date().toISOString().split('T')[0]}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        window.mesapartesModules.showSuccess('Reporte generado exitosamente');
    } catch (error) {
        console.error('Error:', error);
        window.mesapartesModules.showError('Error al generar el reporte');
    }
};

// Actualizar filtros
window.mesapartesModules.actualizarFiltros = function(nuevosFiltros) {
    state.filtros = {
        ...state.filtros,
        ...nuevosFiltros
    };
};

// Función para refrescar reportes
window.mesapartesModules.refreshReportes = loadEstadisticas;

// Estilos CSS para la animación de números
const style = document.createElement('style');
style.textContent = `
    .number-animation {
        animation: numberPulse 1s ease-out;
    }

    @keyframes numberPulse {
        0% {
            transform: scale(1);
        }
        50% {
            transform: scale(1.1);
            color: var(--primary-color);
        }
        100% {
            transform: scale(1);
        }
    }
`;
document.head.appendChild(style); 