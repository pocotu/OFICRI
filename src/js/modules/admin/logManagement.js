import { formatDate, formatDateTime } from '../../utils/formatters.js';
import { showError } from '../../common/uiHelpers.js';

// Gestión de logs
let currentLogs = [];

export function setupLogControls() {
    console.log('Configurando controles de logs...');
    const startDateInput = document.querySelector('#start-date');
    const endDateInput = document.querySelector('#end-date');
    const filterBtn = document.querySelector('#filter-logs');
    const downloadFilteredBtn = document.querySelector('#download-filtered-logs');
    const downloadAllBtn = document.querySelector('#download-all-logs');

    if (startDateInput && endDateInput) {
        // Establecer fecha inicial y final por defecto (último mes)
        const endDate = new Date();
        const startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 1);

        startDateInput.value = formatDate(startDate);
        endDateInput.value = formatDate(endDate);
    }

    if (filterBtn) {
        filterBtn.addEventListener('click', () => loadFilteredLogs());
    }

    if (downloadFilteredBtn) {
        downloadFilteredBtn.addEventListener('click', () => downloadLogs(true));
    }

    if (downloadAllBtn) {
        downloadAllBtn.addEventListener('click', () => downloadLogs(false));
    }

    // Cargar logs iniciales
    loadFilteredLogs().catch(error => {
        console.error('Error al cargar logs iniciales:', error);
        showError('Error al cargar los logs iniciales');
    });
}

export async function loadFilteredLogs() {
    try {
        const startDate = document.querySelector('#start-date')?.value || '';
        const endDate = document.querySelector('#end-date')?.value || '';
        
        console.log('=== CARGANDO LOGS FILTRADOS ===');
        console.log('Fechas:', { startDate, endDate });

        const url = `/api/logs?startDate=${startDate}&endDate=${endDate}`;
        console.log('URL de la petición:', url);

        const response = await fetch(url);
        console.log('Respuesta del servidor:', {
            status: response.status,
            ok: response.ok,
            statusText: response.statusText
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Error al cargar los logs');
        }
        
        const logs = await response.json();
        console.log('Logs recibidos:', {
            cantidad: logs.length,
            primerLog: logs[0],
            ultimoLog: logs[logs.length - 1]
        });

        currentLogs = logs;
        renderLogs(logs);
        return logs;
    } catch (error) {
        console.error('Error detallado:', error);
        showError('Error al cargar los logs');
        throw error;
    }
}

function renderLogs(logs) {
    const tbody = document.querySelector('#logsTable tbody');
    if (!tbody) {
        console.error('No se encontró la tabla de logs');
        return;
    }

    tbody.innerHTML = '';
    if (!logs || logs.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center">No hay registros para mostrar</td></tr>';
        return;
    }

    logs.forEach(log => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${formatDateTime(new Date(log.FechaEvento))}</td>
            <td>${log.Username || 'Sistema'}</td>
            <td>${log.TipoLog || ''} - ${log.TipoEvento || ''}</td>
            <td>${log.Detalles || '-'}</td>
            <td>${log.Estado ? '<span class="success">Exitoso</span>' : '<span class="error">Fallido</span>'}</td>
        `;
        tbody.appendChild(tr);
    });
}

export async function downloadLogs(filtered = false) {
    try {
        console.log('=== INICIANDO DESCARGA DE LOGS ===');
        console.log('Modo:', filtered ? 'Filtrados' : 'Todos');

        let logsToDownload;
        if (filtered) {
            if (!currentLogs || currentLogs.length === 0) {
                // Si no hay logs cargados, intentar cargarlos
                console.log('No hay logs filtrados, intentando cargarlos...');
                logsToDownload = await loadFilteredLogs();
            } else {
                console.log('Usando logs filtrados actuales:', {
                    cantidad: currentLogs.length,
                    hayDatos: currentLogs.length > 0
                });
                logsToDownload = currentLogs;
            }
        } else {
            console.log('Solicitando todos los logs al servidor...');
            const startDate = '2000-01-01'; // Fecha muy antigua para obtener todos
            const endDate = formatDate(new Date()); // Fecha actual
            const response = await fetch(`/api/logs?startDate=${startDate}&endDate=${endDate}`);
            
            console.log('Respuesta del servidor para todos los logs:', {
                status: response.status,
                ok: response.ok,
                statusText: response.statusText
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error al obtener los logs');
            }
            logsToDownload = await response.json();
            console.log('Logs totales recibidos:', {
                cantidad: logsToDownload.length,
                primerLog: logsToDownload[0],
                ultimoLog: logsToDownload[logsToDownload.length - 1]
            });
        }

        if (!logsToDownload || logsToDownload.length === 0) {
            console.log('No hay logs para descargar');
            showError('No hay logs para descargar en el período seleccionado');
            return;
        }

        console.log('Preparando archivo CSV...');
        // Convertir logs a CSV con BOM para Excel
        const BOM = '\uFEFF';
        const csvContent = BOM + [
            ['Fecha', 'Usuario', 'Tipo', 'Detalles', 'Estado'].join(','),
            ...logsToDownload.map(log => [
                formatDateTime(new Date(log.FechaEvento)),
                (log.Username || 'Sistema').replace(/,/g, ';'),
                `${log.TipoLog || ''} - ${log.TipoEvento || ''}`.replace(/,/g, ';'),
                (log.Detalles || '-').replace(/,/g, ';'),
                log.Estado ? 'Exitoso' : 'Fallido'
            ].join(','))
        ].join('\n');

        console.log('Contenido CSV generado:', {
            longitudBytes: csvContent.length,
            primerasLineas: csvContent.split('\n').slice(0, 2)
        });

        // Crear y descargar el archivo
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        const filename = filtered ? 
            `logs_filtrados_${formatDate(new Date())}.csv` : 
            `logs_completos_${formatDate(new Date())}.csv`;

        console.log('Preparando descarga:', {
            tipo: blob.type,
            tamaño: blob.size,
            nombreArchivo: filename
        });

        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        console.log('=== DESCARGA COMPLETADA ===');
    } catch (error) {
        console.error('Error detallado en downloadLogs:', error);
        console.error('Stack trace:', error.stack);
        showError('Error al descargar los logs: ' + error.message);
    }
}

async function getAllLogs() {
    const response = await fetch('/api/logs');
    if (!response.ok) throw new Error('Error al obtener todos los logs');
    return await response.json();
}
