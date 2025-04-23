import { api } from '../api';
import { sessionControl } from './sessionControl';

/**
 * Registra una operación en el sistema de auditoría
 * @param {string} operation - Nombre de la operación
 * @param {string} status - Estado de la operación (SUCCESS, ERROR, INFO)
 * @param {string} details - Detalles de la operación
 * @param {Object} [metadata] - Metadatos adicionales
 */
export async function logOperation(operation, status, details, metadata = {}) {
  try {
    const userData = sessionControl.getUserData();
    const timestamp = new Date().toISOString();

    const logEntry = {
      operation,
      status,
      details,
      metadata: {
        ...metadata,
        userId: userData?.IDUsuario,
        userCIP: userData?.CodigoCIP,
        timestamp
      }
    };

    // Enviar al servidor
    await api.post('/api/audit/log', logEntry);

    // También registrar en consola en desarrollo
    if (process.env.NODE_ENV === 'development') {
      console.log(`[AUDIT] ${operation} - ${status}: ${details}`, metadata);
    }
  } catch (error) {
    // Si falla el registro en el servidor, al menos registrar en consola
    console.error('Error al registrar operación de auditoría:', error);
  }
}

/**
 * Obtiene los logs de auditoría
 * @param {Object} filters - Filtros para la búsqueda
 * @param {number} [filters.limit=100] - Límite de registros
 * @param {number} [filters.offset=0] - Offset para paginación
 * @param {string} [filters.operation] - Filtrar por operación
 * @param {string} [filters.status] - Filtrar por estado
 * @param {string} [filters.startDate] - Fecha de inicio
 * @param {string} [filters.endDate] - Fecha de fin
 * @returns {Promise<Array>} - Lista de logs
 */
export async function getAuditLogs(filters = {}) {
  try {
    const response = await api.get('/api/audit/logs', { params: filters });
    return response.data;
  } catch (error) {
    console.error('Error al obtener logs de auditoría:', error);
    throw error;
  }
}

/**
 * Exporta los logs de auditoría
 * @param {Object} filters - Filtros para la exportación
 * @returns {Promise<Blob>} - Archivo con los logs
 */
export async function exportAuditLogs(filters = {}) {
  try {
    const response = await api.get('/api/audit/export', {
      params: filters,
      responseType: 'blob'
    });
    return response.data;
  } catch (error) {
    console.error('Error al exportar logs de auditoría:', error);
    throw error;
  }
}

/**
 * Limpia los logs de auditoría antiguos
 * @param {number} days - Número de días a mantener
 * @returns {Promise<void>}
 */
export async function cleanAuditLogs(days = 30) {
  try {
    await api.delete('/api/audit/clean', { params: { days } });
  } catch (error) {
    console.error('Error al limpiar logs de auditoría:', error);
    throw error;
  }
}

/**
 * Registra métricas de rendimiento
 * @param {Object} data - Datos de métricas
 */
export async function logPerformanceMetrics(data = {}) {
  try {
    await api.post('/api/audit/metrics', data);
  } catch (error) {
    console.error('Error al registrar métricas:', error);
  }
}

/**
 * Registra una prueba ejecutada
 * @param {Object} data - Datos de la prueba
 */
export async function logTestRun(data = {}) {
  try {
    await api.post('/api/audit/test', data);
  } catch (error) {
    console.error('Error al registrar prueba:', error);
  }
}

// Exportar servicio de auditoría para ser usado en la aplicación
export const auditService = {
  logOperation,
  getAuditLogs,
  exportAuditLogs,
  cleanAuditLogs,
  logPerformanceMetrics,
  logTestRun
}; 