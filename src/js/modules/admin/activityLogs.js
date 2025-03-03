import { showError } from '../../common/uiHelpers.js';

// Módulo para gestionar los registros de actividad

// Función para formatear la IP para mostrar
function formatIP(ip) {
    if (ip.includes('::1')) return 'localhost (::1)';
    if (ip.includes('::ffff:127.0.0.1')) return 'localhost (127.0.0.1)';
    if (ip.includes('127.0.0.1')) return 'localhost (127.0.0.1)';
    return ip;
}

// Función para exportar logs a CSV
function exportToCSV(logs, filename = 'registros_actividad.csv') {
    // Encabezados del CSV
    const headers = [
        'Fecha',
        'Usuario',
        'Acción',
        'Dispositivo',
        'IP',
        'Estado'
    ];

    // Convertir los logs a formato CSV
    const csvContent = [
        headers.join(','),
        ...logs.map(log => [
            formatDate(log.Fecha),
            log.UsuarioAfectado || 'Sistema',
            log.Accion || 'N/A',
            `"${log.Dispositivo.replace(/"/g, '""')}"`, // Escapar comillas en el campo dispositivo
            log.IP,
            log.Estado
        ].join(','))
    ].join('\n');

    // Crear el blob y descargar
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Función para exportar logs por rango de fechas
async function exportLogsByDateRange() {
    try {
        // Crear modal para selección de fechas
        const modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.id = 'exportDateRangeModal';
        modal.innerHTML = `
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Exportar por Rango de Fechas</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <form id="exportDateRangeForm">
                            <div class="mb-3">
                                <label for="startDate" class="form-label">Fecha Inicio</label>
                                <input type="date" class="form-control" id="startDate" required>
                            </div>
                            <div class="mb-3">
                                <label for="endDate" class="form-label">Fecha Fin</label>
                                <input type="date" class="form-control" id="endDate" required>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                        <button type="button" class="btn btn-primary" id="confirmExport">Exportar</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        const modalInstance = new bootstrap.Modal(modal);
        
        // Manejar la exportación cuando se confirme
        document.getElementById('confirmExport').addEventListener('click', async () => {
            const startDate = document.getElementById('startDate').value;
            const endDate = document.getElementById('endDate').value;
            
            if (!startDate || !endDate) {
                showError('Por favor seleccione ambas fechas');
                return;
            }
            
            try {
                const response = await fetch(`/api/users/logs?startDate=${startDate}&endDate=${endDate}`);
                if (!response.ok) throw new Error('Error al obtener los logs');
                
                const logs = await response.json();
                if (logs.length === 0) {
                    showError('No hay registros para el rango seleccionado');
                    return;
                }
                
                exportToCSV(logs, `registros_${startDate}_a_${endDate}.csv`);
                modalInstance.hide();
            } catch (error) {
                console.error('Error al exportar logs:', error);
                showError('Error al exportar los registros');
            }
        });
        
        // Limpiar el modal cuando se cierre
        modal.addEventListener('hidden.bs.modal', () => {
            document.body.removeChild(modal);
        });
        
        modalInstance.show();
    } catch (error) {
        console.error('Error al abrir modal de exportación:', error);
        showError('Error al preparar la exportación');
    }
}

// Función para mostrar el modal con la información de IP
async function showIPModal(ip, deviceInfo, geoData) {
    const modalElement = document.getElementById('ipInfoModal');
    const modal = new bootstrap.Modal(modalElement);
    
    // Valores por defecto para IPs locales
    const isLocalIP = ip.includes('127.0.0.1') || ip.includes('::1') || ip.includes('::ffff:127.0.0.1');
    const defaultGeoData = {
        city: 'Red Local',
        region: 'Local',
        country: 'Local',
        timezone: 'America/Bogota',
        ll: [0, 0]
    };

    // Usar geoData del backend o valores por defecto
    const geo = geoData || defaultGeoData;
    
    // Actualizar la información en el modal
    document.getElementById('ip-address').textContent = formatIP(ip);
    document.getElementById('ip-city').textContent = `${geo.city || 'No disponible'}, ${geo.region || 'No disponible'}`;
    document.getElementById('ip-country').textContent = geo.country || 'No disponible';
    document.getElementById('ip-isp').textContent = isLocalIP ? 'Red Local' : 'No disponible';
    document.getElementById('ip-org').textContent = isLocalIP ? 'Sistema Local' : 'No disponible';
    
    // Crear sección de información adicional
    let additionalInfo = '';
    
    // Agregar información de ubicación si está disponible
    if (geo.ll && Array.isArray(geo.ll)) {
        additionalInfo += `
            <div class="mt-3">
                <strong>Ubicación:</strong>
                <div class="mt-2">
                    Lat: ${geo.ll[0].toFixed(6)}<br>
                    Lon: ${geo.ll[1].toFixed(6)}<br>
                    Zona horaria: ${geo.timezone || 'America/Bogota'}<br>
                    Hora local: ${new Date().toLocaleString('es-ES', { timeZone: geo.timezone || 'America/Bogota' })}
                </div>
            </div>`;
    }

    // Mostrar información del dispositivo
    if (deviceInfo && deviceInfo !== 'N/A') {
        additionalInfo += `
            <div class="mt-3">
                <strong>Dispositivo:</strong>
                <div class="mt-2">${deviceInfo}</div>
            </div>`;
    }

    document.getElementById('ip-additional').innerHTML = additionalInfo;
    
    // Agregar manejador para limpiar el modal cuando se cierre
    modalElement.addEventListener('hidden.bs.modal', function () {
        document.body.classList.remove('modal-open');
        const backdrop = document.querySelector('.modal-backdrop');
        if (backdrop) {
            backdrop.remove();
        }
    });
    
    modal.show();
}

// Función para renderizar los registros en la tabla
async function renderActivityLogs(logs) {
    console.log('=== INICIO DE RENDERIZADO DE REGISTROS ===');
    try {
        const table = document.querySelector('#logsTable');
        if (!table) {
            console.error('No se encontró la tabla de registros (#logsTable)');
            throw new Error('No se encontró la tabla de registros');
        }

        let tbody = table.querySelector('tbody');
        if (!tbody) {
            console.log('No se encontró tbody, creando uno nuevo...');
            tbody = document.createElement('tbody');
            table.appendChild(tbody);
        }

        console.log('Limpiando tabla existente...');
        tbody.innerHTML = '';

        if (!logs || logs.length === 0) {
            console.log('No hay registros para mostrar');
            tbody.innerHTML = '<tr><td colspan="7" class="text-center">No hay registros para mostrar</td></tr>';
            return;
        }

        console.log('Procesando', logs.length, 'registros para mostrar en tabla...');
        logs.forEach((log, index) => {
            console.log(`Procesando registro ${index + 1}/${logs.length}:`, log);
            const row = document.createElement('tr');
            
            row.innerHTML = `
                <td>${formatDate(log.Fecha)}</td>
                <td>${log.UsuarioAfectado || 'Sistema'}</td>
                <td>${log.Accion || 'N/A'}</td>
                <td>${log.Dispositivo}</td>
                <td>${log.IP}</td>
                <td>
                    <button class="btn btn-info btn-sm ip-info-btn" title="Ver información del dispositivo">
                        <i class="fas fa-info-circle"></i>
                    </button>
                </td>
                <td>
                    <span class="badge ${log.Estado === 'Exitoso' ? 'bg-success' : 'bg-danger'}">
                        ${log.Estado || 'Desconocido'}
                    </span>
                </td>
            `;
            
            // Agregar event listener para el botón de información
            const ipButton = row.querySelector('.ip-info-btn');
            ipButton.addEventListener('click', () => showIPModal(log.IP, log.Dispositivo, log.GeoData));
            
            tbody.appendChild(row);
        });

        console.log('Se agregaron', logs.length, 'registros a la tabla');
        console.log('=== FIN DE RENDERIZADO DE REGISTROS ===');
    } catch (error) {
        console.error('Error al renderizar registros:', error);
        console.error('Stack trace:', error.stack);
        showError('Error al renderizar los registros de actividad');
    }
}

// Función para formatear fechas
function formatDate(dateString) {
    try {
        if (!dateString) return 'Fecha no disponible';
        const date = new Date(dateString);
        return date.toLocaleString('es-ES', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    } catch (error) {
        console.error('Error al formatear fecha:', error);
        return dateString;
    }
}

// Función para cargar los registros de actividad
export async function loadActivityLogs() {
    try {
        console.log('=== INICIO DE CARGA DE REGISTROS DE ACTIVIDAD ===');
        console.log('Realizando petición a /api/users/logs/all...');
        
        const response = await fetch('/api/users/logs/all');
        console.log('Respuesta recibida:', {
            ok: response.ok,
            status: response.status,
            statusText: response.statusText
        });

        if (!response.ok) {
            throw new Error(`Error al cargar registros: ${response.status} - ${response.statusText}`);
        }

        const logs = await response.json();
        console.log('Registros obtenidos:', {
            cantidad: logs.length,
            primerLog: logs.length > 0 ? logs[0] : null
        });

        await renderActivityLogs(logs);
        console.log('=== FIN DE CARGA DE REGISTROS DE ACTIVIDAD ===');
    } catch (error) {
        console.error('Error detallado al cargar registros:', error);
        console.error('Stack trace:', error.stack);
        showError('Error al cargar los registros de actividad');
    }
}

// Función para inicializar el módulo de registros
export function initializeActivityLogs() {
    console.log('=== INICIO DE INICIALIZACIÓN DE REGISTROS ===');
    
    // Cargar registros iniciales
    loadActivityLogs();
    
    // Configurar botones de exportación
    const exportAllBtn = document.createElement('button');
    exportAllBtn.className = 'btn btn-success me-2';
    exportAllBtn.innerHTML = '<i class="fas fa-file-export"></i> Exportar Todo';
    exportAllBtn.addEventListener('click', async () => {
        try {
            const response = await fetch('/api/users/logs/all');
            if (!response.ok) throw new Error('Error al obtener los logs');
            const logs = await response.json();
            exportToCSV(logs);
        } catch (error) {
            console.error('Error al exportar todos los logs:', error);
            showError('Error al exportar los registros');
        }
    });

    const exportRangeBtn = document.createElement('button');
    exportRangeBtn.className = 'btn btn-info me-2';
    exportRangeBtn.innerHTML = '<i class="fas fa-calendar-alt"></i> Exportar por Fechas';
    exportRangeBtn.addEventListener('click', () => exportLogsByDateRange());

    // Agregar botones al contenedor
    const reloadBtn = document.querySelector('#reloadLogsBtn');
    if (reloadBtn) {
        reloadBtn.parentNode.insertBefore(exportAllBtn, reloadBtn);
        reloadBtn.parentNode.insertBefore(exportRangeBtn, reloadBtn);
    }
    
    // Configurar botón de recargar si existe
    if (reloadBtn) {
        console.log('Configurando botón de recargar registros...');
        reloadBtn.addEventListener('click', () => {
            console.log('Recargando registros...');
            loadActivityLogs();
        });
        console.log('Botón de recargar registros configurado');
    } else {
        console.warn('No se encontró el botón de recargar registros (#reloadLogsBtn)');
    }
    
    // Configurar manejador global para modales de Bootstrap
    document.addEventListener('hidden.bs.modal', function (event) {
        document.body.classList.remove('modal-open');
        const backdrop = document.querySelector('.modal-backdrop');
        if (backdrop) {
            backdrop.remove();
        }
        // Remover cualquier padding-right agregado por Bootstrap
        document.body.style.paddingRight = '';
    });
    
    console.log('=== FIN DE INICIALIZACIÓN DE REGISTROS ===');
} 