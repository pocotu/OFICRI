// Variables globales
let logs = [];
let currentPage = 1;
let totalPages = 1;
let logsPerPage = 20;
let currentFilters = {};
let currentLogs = [];

// Gestión de logs del sistema

// Función para configurar controles de filtrado
function setupLogControls() {
    try {
        console.log('Configurando controles de logs...');
        
        // Obtener referencias a elementos
        const filterForm = document.getElementById('logsFilterForm');
        const startDateInput = document.getElementById('filter-start-date');
        const endDateInput = document.getElementById('filter-end-date');
        const clearFiltersBtn = document.getElementById('clearFiltersButton');
        const exportBtn = document.getElementById('exportLogsButton');
        const reloadBtn = document.getElementById('reloadLogsBtn');
        
        // Establecer fechas por defecto (último mes)
        if (startDateInput && endDateInput) {
            const endDate = new Date();
            const startDate = new Date();
            startDate.setMonth(startDate.getMonth() - 1);
            
            // Formatear fechas para input date (YYYY-MM-DD)
            endDateInput.value = formatDateForInput(endDate);
            startDateInput.value = formatDateForInput(startDate);
        }
        
        // Configurar evento de formulario de filtrado
        if (filterForm) {
            filterForm.addEventListener('submit', function(e) {
                e.preventDefault();
                loadActivityLogs(1, getFilters());
            });
        }
        
        // Configurar botón de limpiar filtros
        if (clearFiltersBtn) {
            clearFiltersBtn.addEventListener('click', function() {
                // Restablecer fechas por defecto
                if (startDateInput && endDateInput) {
                    const endDate = new Date();
                    const startDate = new Date();
                    startDate.setMonth(startDate.getMonth() - 1);
                    
                    endDateInput.value = formatDateForInput(endDate);
                    startDateInput.value = formatDateForInput(startDate);
                }
                
                // Limpiar otros filtros si existen
                const userFilter = document.getElementById('filter-user');
                const actionFilter = document.getElementById('filter-action');
                
                if (userFilter) userFilter.value = '';
                if (actionFilter) actionFilter.value = '';
                
                // Cargar logs sin filtros específicos
                loadActivityLogs(1, {});
            });
        }
        
        // Configurar botón de exportar
        if (exportBtn) {
            exportBtn.addEventListener('click', function() {
                exportLogs();
            });
        }
        
        // Configurar botón de recargar
        if (reloadBtn) {
            reloadBtn.addEventListener('click', function() {
                loadActivityLogs();
            });
        }
        
        console.log('Controles de logs configurados correctamente');
    } catch (error) {
        console.error('Error al configurar controles de logs:', error);
        if (window.uiHelpers) {
            window.uiHelpers.showError('Error al configurar controles: ' + error.message);
        } else {
            alert('Error al configurar controles: ' + error.message);
        }
    }
}

// Función para obtener los filtros actuales
function getFilters() {
    const startDate = document.getElementById('filter-start-date')?.value;
    const endDate = document.getElementById('filter-end-date')?.value;
    const user = document.getElementById('filter-user')?.value;
    const action = document.getElementById('filter-action')?.value;
    
    return {
        startDate,
        endDate,
        user,
        action
    };
}

// Función para formatear fecha para input
function formatDateForInput(date) {
    return date.toISOString().split('T')[0];
}

// Función para formatear fecha y hora
function formatDateTime(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    }).replace(',', '');
}

// Función para cargar los logs
async function loadActivityLogs(page = 1, filters = {}) {
    try {
        console.log('=== INICIO DE CARGA DE LOGS FILTRADOS ===');
        console.log('Estado actual:', {
            currentPage,
            totalPages,
            logsPerPage,
            currentFilters
        });
        console.log('Parámetros recibidos:', { page, filters });
        
        // Construir URL con parámetros
        let url = `/api/logs?page=${page}&limit=${logsPerPage}`;
        
        // Agregar filtros a la URL si existen
        if (filters.startDate) url += `&startDate=${filters.startDate}`;
        if (filters.endDate) url += `&endDate=${filters.endDate}`;
        if (filters.user) url += `&user=${encodeURIComponent(filters.user)}`;
        if (filters.action) url += `&action=${encodeURIComponent(filters.action)}`;
        
        console.log('URL de petición:', url);
        console.log('Iniciando fetch...');
        
        const response = await fetch(url);
        
        console.log('Respuesta recibida:', {
            status: response.status,
            ok: response.ok
        });
        
        if (!response.ok) {
            throw new Error(`Error al cargar logs: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Datos recibidos:', data);
        
        // Actualizar variables globales
        logs = Array.isArray(data) ? data : [];
        currentPage = page;
        currentLogs = logs;
        currentFilters = filters;
        
        // Renderizar logs
        renderLogs(logs);
        
        console.log('=== FIN DE CARGA DE LOGS FILTRADOS ===');
    } catch (error) {
        console.error('Error al cargar logs:', error);
        window.commonUiHelpers.showError('Error al cargar logs: ' + error.message);
    }
}

// Función para renderizar logs en la tabla
function renderLogs(logs) {
    try {
        console.log('=== INICIO DE RENDERIZADO DE LOGS ===');
        console.log('Cantidad de logs a renderizar:', logs?.length || 0);
        
        // Obtener tabla
        const table = document.getElementById('logsTable');
        console.log('Tabla encontrada:', !!table);
        
        if (!table) {
            throw new Error('No se encontró la tabla de logs');
        }
        
        // Obtener o crear tbody
        let tbody = table.querySelector('tbody');
        console.log('tbody existente:', !!tbody);
        
        if (!tbody) {
            console.log('Creando nuevo tbody...');
            tbody = document.createElement('tbody');
            table.appendChild(tbody);
        } else {
            // Limpiar contenido existente
            console.log('Limpiando tbody existente...');
            tbody.innerHTML = '';
        }
        
        // Si no hay logs, mostrar mensaje
        if (!logs || logs.length === 0) {
            console.log('No hay logs para mostrar');
            tbody.innerHTML = '<tr><td colspan="5" class="text-center">No se encontraron registros</td></tr>';
            return;
        }
        
        console.log('Iniciando renderizado de filas...');
        // Agregar cada log a la tabla
        logs.forEach((log, index) => {
            console.log(`Procesando log ${index + 1}/${logs.length}:`, log);
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${formatDateTime(log.FechaEvento)}</td>
                <td>${log.Username || 'admin'}</td>
                <td>${log.TipoEvento || 'LOGIN_EXITOSO'}</td>
                <td>${log.Detalles || 'N/A'}</td>
                <td><span class="badge ${log.Estado ? 'bg-success' : 'bg-danger'}">${log.Estado ? 'EXITOSO' : 'FALLIDO'}</span></td>
            `;
            
            tbody.appendChild(row);
        });
        
        console.log('=== FIN DE RENDERIZADO DE LOGS ===');
    } catch (error) {
        console.error('Error al renderizar logs:', error);
        window.commonUiHelpers.showError('Error al mostrar logs: ' + error.message);
    }
}

// Función para configurar eventos de información de IP
function setupIPInfoEvents() {
    document.querySelectorAll('.ip-info').forEach(element => {
        element.addEventListener('click', async function() {
            const ip = this.dataset.ip;
            if (ip && ip !== 'N/A') {
                try {
                    const response = await fetch(`/api/logs/ip-info/${ip}`);
                    if (response.ok) {
                        const data = await response.json();
                        showIPInfoModal(data);
                    }
                } catch (error) {
                    console.error('Error al obtener información de IP:', error);
                }
            }
        });
    });
}

// Función para descargar logs en formato CSV
async function downloadLogs(filtered = false) {
    try {
        console.log('=== INICIO DE DESCARGA DE LOGS ===');
        console.log('Modo de descarga:', filtered ? 'Filtrados' : 'Todos');
        
        let logs;
        
        if (filtered) {
            // Usar logs filtrados actuales
            logs = currentLogs;
            
            // Si no hay logs filtrados, cargarlos
            if (!logs || logs.length === 0) {
                console.log('No hay logs filtrados, cargando...');
                await loadActivityLogs();
                logs = currentLogs;
            }
        } else {
            // Obtener todos los logs
            console.log('Obteniendo todos los logs...');
            logs = await getAllLogs();
        }
        
        // Verificar si hay logs para exportar
        if (!logs || logs.length === 0) {
            throw new Error('No hay registros para exportar');
        }
        
        console.log(`Exportando ${logs.length} registros a CSV...`);
        
        // Crear contenido CSV
        const headers = [
            'Fecha',
            'Usuario',
            'Acción',
            'IP',
            'Dispositivo',
            'Detalles'
        ];
        
        // Crear filas CSV
        const csvRows = [];
        
        // Agregar encabezados
        csvRows.push(headers.join(','));
        
        // Agregar datos
        logs.forEach(log => {
            const row = [
                formatDateTime(log.fecha),
                log.usuario ? `"${log.usuario}"` : 'Sistema',
                `"${log.accion}"`,
                log.ip || 'N/A',
                log.dispositivo ? `"${log.dispositivo.replace(/"/g, '""')}"` : 'Desconocido',
                log.detalles ? `"${log.detalles.replace(/"/g, '""')}"` : ''
            ];
            
            csvRows.push(row.join(','));
        });
        
        // Crear blob y descargar
        const csvContent = csvRows.join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        
        // Generar nombre de archivo
        let filename = 'logs_sistema';
        
        if (filtered && (currentFilters.startDate || currentFilters.endDate)) {
            // Agregar fechas al nombre si hay filtros de fecha
            if (currentFilters.startDate) {
                filename += `_desde_${currentFilters.startDate.replace(/-/g, '')}`;
            }
            
            if (currentFilters.endDate) {
                filename += `_hasta_${currentFilters.endDate.replace(/-/g, '')}`;
            }
        } else {
            // Agregar fecha actual al nombre
            const now = new Date();
            filename += `_${formatDateForInput(now).replace(/-/g, '')}`;
        }
        
        filename += '.csv';
        
        // Crear link de descarga
        const link = document.createElement('a');
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', filename);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            console.log('Archivo CSV descargado correctamente');
        } else {
            throw new Error('Su navegador no soporta la descarga de archivos');
        }
        
        console.log('=== FIN DE DESCARGA DE LOGS ===');
    } catch (error) {
        console.error('Error al descargar logs:', error);
        if (window.uiHelpers) {
            window.uiHelpers.showError('Error al exportar logs: ' + error.message);
        } else {
            alert('Error al exportar logs: ' + error.message);
        }
    }
}

// Función para obtener todos los logs
async function getAllLogs() {
    try {
        console.log('Obteniendo todos los logs del sistema...');
        
        const response = await fetch('/api/logs/all');
        
        console.log('Respuesta recibida:', {
            status: response.status,
            ok: response.ok
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `Error al obtener logs: ${response.status}`);
        }
        
        const logs = await response.json();
        console.log(`Se obtuvieron ${logs.length} registros`);
        
        return logs;
    } catch (error) {
        console.error('Error al obtener todos los logs:', error);
        if (window.uiHelpers) {
            window.uiHelpers.showError('Error al obtener logs: ' + error.message);
        } else {
            alert('Error al obtener logs: ' + error.message);
        }
        return [];
    }
}

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    setupLogControls();
    loadActivityLogs();
});

// Función para actualizar la paginación
function updatePagination() {
    try {
        const paginationContainer = document.getElementById('logsPagination');
        if (!paginationContainer) return;
        
        // Limpiar paginación existente
        paginationContainer.innerHTML = '';
        
        // Si no hay páginas, no mostrar paginación
        if (totalPages <= 1) return;
        
        // Crear contenedor de paginación
        const pagination = document.createElement('ul');
        pagination.className = 'pagination justify-content-center';
        
        // Botón anterior
        const prevButton = document.createElement('li');
        prevButton.className = `page-item ${currentPage === 1 ? 'disabled' : ''}`;
        prevButton.innerHTML = `<a class="page-link" href="#" data-page="${currentPage - 1}">Anterior</a>`;
        pagination.appendChild(prevButton);
        
        // Determinar rango de páginas a mostrar
        let startPage = Math.max(1, currentPage - 2);
        let endPage = Math.min(totalPages, startPage + 4);
        
        // Ajustar si estamos cerca del final
        if (endPage - startPage < 4) {
            startPage = Math.max(1, endPage - 4);
        }
        
        // Botones de página
        for (let i = startPage; i <= endPage; i++) {
            const pageButton = document.createElement('li');
            pageButton.className = `page-item ${i === currentPage ? 'active' : ''}`;
            pageButton.innerHTML = `<a class="page-link" href="#" data-page="${i}">${i}</a>`;
            pagination.appendChild(pageButton);
        }
        
        // Botón siguiente
        const nextButton = document.createElement('li');
        nextButton.className = `page-item ${currentPage === totalPages ? 'disabled' : ''}`;
        nextButton.innerHTML = `<a class="page-link" href="#" data-page="${currentPage + 1}">Siguiente</a>`;
        pagination.appendChild(nextButton);
        
        // Agregar paginación al contenedor
        paginationContainer.appendChild(pagination);
        
        // Configurar eventos de paginación
        document.querySelectorAll('#logsPagination .page-link').forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                
                // Obtener página
                const page = parseInt(this.dataset.page);
                
                // Validar página
                if (isNaN(page) || page < 1 || page > totalPages) return;
                
                // Cargar página
                loadActivityLogs(page, currentFilters);
            });
        });
    } catch (error) {
        console.error('Error al actualizar paginación:', error);
    }
}

// Exponer funciones globalmente
window.adminModules = window.adminModules || {};
window.adminModules.logManagement = {
    setupLogControls,
    loadActivityLogs,
    downloadLogs,
    renderLogs,
    updatePagination
};
