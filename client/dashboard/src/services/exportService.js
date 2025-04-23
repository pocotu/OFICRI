import { api } from '../../shared/src/services/api';
import { logOperation } from '../../shared/src/services/audit/auditService';

// Formatos de exportación disponibles
export const EXPORT_FORMATS = {
  EXCEL: 'excel',
  PDF: 'pdf',
  CSV: 'csv',
  JSON: 'json'
};

// Opciones por defecto para exportación
const defaultExportOptions = {
  format: EXPORT_FORMATS.EXCEL,
  filename: 'dashboard-export',
  includeHeaders: true,
  sheetName: 'Dashboard',
  paperSize: 'A4',
  orientation: 'portrait',
  timestamp: true
};

/**
 * Exporta datos del dashboard en el formato especificado
 * @param {Object} data - Datos a exportar
 * @param {string} format - Formato de exportación (excel, pdf, csv, json)
 * @param {Object} options - Opciones adicionales de exportación
 * @returns {Promise<string>} URL del archivo exportado o blob
 */
export async function exportDashboardData(data, format = EXPORT_FORMATS.EXCEL, options = {}) {
  try {
    const exportOptions = { ...defaultExportOptions, ...options, format };
    
    // Verificar si estamos en formato JSON (no requiere llamada al servidor)
    if (format === EXPORT_FORMATS.JSON) {
      return exportToJSON(data, exportOptions);
    }
    
    const response = await api.post('/api/dashboard/export', {
      data,
      format,
      options: exportOptions
    }, {
      responseType: 'blob'
    });
    
    logOperation('INFO', 'dashboard', 'exportDashboardData', {
      format,
      options: exportOptions,
      success: true
    });
    
    // Crear URL del blob y descargar
    return downloadExportedFile(response.data, format, exportOptions.filename);
  } catch (error) {
    logOperation('ERROR', 'dashboard', 'exportDashboardData', {
      format,
      options,
      error: error.message
    });
    throw error;
  }
}

/**
 * Exporta datos estadísticos en el formato especificado
 * @param {string} statType - Tipo de estadística
 * @param {Object} filters - Filtros aplicados
 * @param {string} format - Formato de exportación
 * @param {Object} options - Opciones adicionales
 * @returns {Promise<string>} URL del archivo exportado
 */
export async function exportStats(statType, filters = {}, format = EXPORT_FORMATS.EXCEL, options = {}) {
  try {
    const params = {
      statType,
      ...filters,
      format,
      ...options
    };
    
    const response = await api.get('/api/dashboard/stats/export', {
      params,
      responseType: 'blob'
    });
    
    logOperation('INFO', 'dashboard', 'exportStats', {
      statType,
      filters,
      format,
      success: true
    });
    
    // Nombre de archivo personalizado para estadísticas
    const filename = options.filename || `estadisticas-${statType}`;
    return downloadExportedFile(response.data, format, filename);
  } catch (error) {
    logOperation('ERROR', 'dashboard', 'exportStats', {
      statType,
      filters,
      format,
      error: error.message
    });
    throw error;
  }
}

/**
 * Exporta datos de KPIs en el formato especificado
 * @param {string} kpiType - Tipo de KPI
 * @param {Object} filters - Filtros aplicados
 * @param {string} format - Formato de exportación
 * @param {Object} options - Opciones adicionales
 * @returns {Promise<string>} URL del archivo exportado
 */
export async function exportKPIs(kpiType, filters = {}, format = EXPORT_FORMATS.EXCEL, options = {}) {
  try {
    const params = {
      kpiType,
      ...filters,
      format,
      ...options
    };
    
    const response = await api.get('/api/dashboard/kpis/export', {
      params,
      responseType: 'blob'
    });
    
    logOperation('INFO', 'dashboard', 'exportKPIs', {
      kpiType,
      filters,
      format,
      success: true
    });
    
    // Nombre de archivo personalizado para KPIs
    const filename = options.filename || `kpis-${kpiType}`;
    return downloadExportedFile(response.data, format, filename);
  } catch (error) {
    logOperation('ERROR', 'dashboard', 'exportKPIs', {
      kpiType,
      filters,
      format,
      error: error.message
    });
    throw error;
  }
}

/**
 * Exporta alertas en el formato especificado
 * @param {string} alertType - Tipo de alerta
 * @param {Object} filters - Filtros aplicados
 * @param {string} format - Formato de exportación
 * @param {Object} options - Opciones adicionales
 * @returns {Promise<string>} URL del archivo exportado
 */
export async function exportAlerts(alertType, filters = {}, format = EXPORT_FORMATS.EXCEL, options = {}) {
  try {
    const params = {
      alertType,
      ...filters,
      format,
      ...options
    };
    
    const response = await api.get('/api/dashboard/alerts/export', {
      params,
      responseType: 'blob'
    });
    
    logOperation('INFO', 'dashboard', 'exportAlerts', {
      alertType,
      filters,
      format,
      success: true
    });
    
    // Nombre de archivo personalizado para alertas
    const filename = options.filename || `alertas-${alertType}`;
    return downloadExportedFile(response.data, format, filename);
  } catch (error) {
    logOperation('ERROR', 'dashboard', 'exportAlerts', {
      alertType,
      filters,
      format,
      error: error.message
    });
    throw error;
  }
}

/**
 * Programa la exportación periódica de datos
 * @param {Object} schedule - Configuración de programación (frecuencia, hora, etc.)
 * @param {Object} exportConfig - Configuración de exportación (datos, formato, etc.)
 * @param {Array} recipients - Destinatarios de la exportación (emails)
 * @returns {Promise<Object>} Configuración de la exportación programada
 */
export async function scheduleExport(schedule, exportConfig, recipients = []) {
  try {
    const response = await api.post('/api/dashboard/export/schedule', {
      schedule,
      exportConfig,
      recipients
    });
    
    logOperation('INFO', 'dashboard', 'scheduleExport', {
      schedule,
      exportConfig,
      recipients,
      success: true
    });
    
    return response.data;
  } catch (error) {
    logOperation('ERROR', 'dashboard', 'scheduleExport', {
      schedule,
      exportConfig,
      recipients,
      error: error.message
    });
    throw error;
  }
}

/**
 * Obtiene las exportaciones programadas
 * @returns {Promise<Array>} Lista de exportaciones programadas
 */
export async function getScheduledExports() {
  try {
    const response = await api.get('/api/dashboard/export/schedule');
    
    logOperation('INFO', 'dashboard', 'getScheduledExports', {
      success: true
    });
    
    return response.data;
  } catch (error) {
    logOperation('ERROR', 'dashboard', 'getScheduledExports', {
      error: error.message
    });
    throw error;
  }
}

/**
 * Cancela una exportación programada
 * @param {string} scheduleId - ID de la programación
 * @returns {Promise<Object>} Resultado de la cancelación
 */
export async function cancelScheduledExport(scheduleId) {
  try {
    const response = await api.delete(`/api/dashboard/export/schedule/${scheduleId}`);
    
    logOperation('INFO', 'dashboard', 'cancelScheduledExport', {
      scheduleId,
      success: true
    });
    
    return response.data;
  } catch (error) {
    logOperation('ERROR', 'dashboard', 'cancelScheduledExport', {
      scheduleId,
      error: error.message
    });
    throw error;
  }
}

/**
 * Obtiene el historial de exportaciones
 * @param {Object} filters - Filtros para el historial
 * @param {Object} pagination - Opciones de paginación
 * @returns {Promise<Object>} Historial de exportaciones
 */
export async function getExportHistory(filters = {}, pagination = { page: 1, limit: 20 }) {
  try {
    const params = { ...filters, ...pagination };
    const response = await api.get('/api/dashboard/export/history', { params });
    
    logOperation('INFO', 'dashboard', 'getExportHistory', {
      filters,
      success: true
    });
    
    return response.data;
  } catch (error) {
    logOperation('ERROR', 'dashboard', 'getExportHistory', {
      filters,
      error: error.message
    });
    throw error;
  }
}

// Funciones auxiliares

/**
 * Exporta datos a formato JSON (no requiere servidor)
 * @param {Object} data - Datos a exportar
 * @param {Object} options - Opciones de exportación
 * @returns {string} URL del archivo JSON
 */
function exportToJSON(data, options = {}) {
  try {
    // Convertir datos a JSON
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    
    // Generar nombre de archivo con timestamp si está habilitado
    let filename = options.filename || 'dashboard-export';
    if (options.timestamp) {
      const date = new Date();
      const timestamp = `${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}_${date.getHours().toString().padStart(2, '0')}${date.getMinutes().toString().padStart(2, '0')}`;
      filename = `${filename}_${timestamp}`;
    }
    
    // Crear y descargar el archivo
    return downloadExportedFile(blob, EXPORT_FORMATS.JSON, filename);
  } catch (error) {
    logOperation('ERROR', 'dashboard', 'exportToJSON', {
      error: error.message
    });
    throw error;
  }
}

/**
 * Crea una URL para el blob y descarga el archivo
 * @param {Blob} blob - Blob de datos
 * @param {string} format - Formato del archivo
 * @param {string} filename - Nombre base del archivo
 * @returns {string} URL del archivo
 */
function downloadExportedFile(blob, format, filename) {
  const url = URL.createObjectURL(blob);
  const extension = getFileExtension(format);
  const fullFilename = `${filename}.${extension}`;
  
  // Crear enlace de descarga y activarlo
  const link = document.createElement('a');
  link.href = url;
  link.download = fullFilename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Liberar URL después de un tiempo para permitir descarga
  setTimeout(() => URL.revokeObjectURL(url), 5000);
  
  return url;
}

/**
 * Obtiene la extensión de archivo según el formato
 * @param {string} format - Formato de exportación
 * @returns {string} Extensión de archivo
 */
function getFileExtension(format) {
  const extensions = {
    [EXPORT_FORMATS.EXCEL]: 'xlsx',
    [EXPORT_FORMATS.PDF]: 'pdf',
    [EXPORT_FORMATS.CSV]: 'csv',
    [EXPORT_FORMATS.JSON]: 'json'
  };
  
  return extensions[format] || 'xlsx';
} 