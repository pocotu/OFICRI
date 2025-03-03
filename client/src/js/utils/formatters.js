// Utilidades de formato
function formatDate(date) {
    return date.toISOString().split('T')[0];
}

function formatDateTime(date) {
    return date.toLocaleString('es-PE', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
}

function getNivelAccesoText(nivel) {
    const niveles = {
        1: 'Administrador',
        2: 'Responsable',
        3: 'Mesa de Partes'
    };
    return niveles[nivel] || 'Desconocido';
}

// Exponer funciones globalmente
window.formatters = {
    formatDate,
    formatDateTime,
    getNivelAccesoText
};
