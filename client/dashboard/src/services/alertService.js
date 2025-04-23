import { api } from '../../shared/src/services/api';
import { logOperation } from '../../shared/src/services/audit/auditService';
import { notifyUser } from '../../shared/src/services/notifications/notificationService';

// Tipos de alertas
export const ALERT_SEVERITY = {
  CRITICAL: 'critical',
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low',
  INFO: 'info'
};

// Tipos de alertas disponibles
export const ALERT_TYPES = {
  DOCUMENTOS_PENDIENTES: 'documentos-pendientes',
  TIEMPOS_EXCEDIDOS: 'tiempos-excedidos',
  ERRORES_SISTEMA: 'errores-sistema',
  ACTIVIDAD_INUSUAL: 'actividad-inusual'
};

// Configuración de umbrales por defecto
const defaultThresholds = {
  [ALERT_TYPES.DOCUMENTOS_PENDIENTES]: {
    [ALERT_SEVERITY.CRITICAL]: 20,
    [ALERT_SEVERITY.HIGH]: 15,
    [ALERT_SEVERITY.MEDIUM]: 10,
    [ALERT_SEVERITY.LOW]: 5
  },
  [ALERT_TYPES.TIEMPOS_EXCEDIDOS]: {
    [ALERT_SEVERITY.CRITICAL]: 72,  // horas
    [ALERT_SEVERITY.HIGH]: 48,
    [ALERT_SEVERITY.MEDIUM]: 24,
    [ALERT_SEVERITY.LOW]: 12
  }
};

// Configuración de alertas del usuario
let userAlertConfig = {
  thresholds: { ...defaultThresholds },
  notificationChannels: {
    dashboard: true,
    email: true,
    push: false
  },
  alertsEnabled: true
};

/**
 * Obtiene las alertas activas
 * @param {string} alertType - Tipo de alerta (opcional)
 * @param {Object} filters - Filtros adicionales (área, fecha, etc.)
 * @param {boolean} includeAcknowledged - Incluir alertas ya confirmadas
 * @returns {Promise<Array>} Lista de alertas
 */
export async function getAlerts(alertType, filters = {}, includeAcknowledged = false) {
  try {
    const params = { 
      ...filters, 
      includeAcknowledged,
      ...(alertType ? { type: alertType } : {})
    };
    
    const response = await api.get('/api/dashboard/alerts', { params });
    
    logOperation('INFO', 'dashboard', 'getAlerts', {
      alertType,
      filters,
      resultsCount: response.data.length
    });
    
    return response.data;
  } catch (error) {
    logOperation('ERROR', 'dashboard', 'getAlerts', {
      alertType,
      filters,
      error: error.message
    });
    throw error;
  }
}

/**
 * Confirma una alerta
 * @param {string} alertId - ID de la alerta
 * @returns {Promise<Object>} Alerta actualizada
 */
export async function acknowledgeAlert(alertId) {
  try {
    const response = await api.post(`/api/dashboard/alerts/${alertId}/acknowledge`);
    
    logOperation('INFO', 'dashboard', 'acknowledgeAlert', {
      alertId,
      success: true
    });
    
    return response.data;
  } catch (error) {
    logOperation('ERROR', 'dashboard', 'acknowledgeAlert', {
      alertId,
      error: error.message
    });
    throw error;
  }
}

/**
 * Escala una alerta a un nivel superior
 * @param {string} alertId - ID de la alerta
 * @param {Object} options - Opciones de escalamiento (destinatarios, comentario, etc.)
 * @returns {Promise<Object>} Alerta actualizada
 */
export async function escalateAlert(alertId, options = {}) {
  try {
    const response = await api.post(`/api/dashboard/alerts/${alertId}/escalate`, options);
    
    logOperation('INFO', 'dashboard', 'escalateAlert', {
      alertId,
      options,
      success: true
    });
    
    // Notificar a los usuarios relevantes sobre el escalamiento
    if (options.notifyUsers) {
      options.notifyUsers.forEach(userId => {
        notifyUser(userId, {
          title: 'Alerta escalada',
          message: `La alerta #${alertId} ha sido escalada y requiere su atención.`,
          type: 'alert-escalation',
          data: { alertId }
        });
      });
    }
    
    return response.data;
  } catch (error) {
    logOperation('ERROR', 'dashboard', 'escalateAlert', {
      alertId,
      options,
      error: error.message
    });
    throw error;
  }
}

/**
 * Ejecuta una acción específica de una alerta
 * @param {string} alertId - ID de la alerta
 * @param {string} actionId - ID de la acción
 * @param {Object} actionData - Datos adicionales para la acción
 * @returns {Promise<Object>} Resultado de la acción
 */
export async function executeAlertAction(alertId, actionId, actionData = {}) {
  try {
    const response = await api.post(`/api/dashboard/alerts/${alertId}/actions/${actionId}`, actionData);
    
    logOperation('INFO', 'dashboard', 'executeAlertAction', {
      alertId,
      actionId,
      success: true
    });
    
    return response.data;
  } catch (error) {
    logOperation('ERROR', 'dashboard', 'executeAlertAction', {
      alertId,
      actionId,
      error: error.message
    });
    throw error;
  }
}

/**
 * Configura los umbrales de alertas
 * @param {Object} thresholds - Configuración de umbrales por tipo y severidad
 * @returns {Promise<Object>} Configuración actualizada
 */
export async function configureAlertThresholds(thresholds) {
  try {
    const response = await api.post('/api/dashboard/alerts/config/thresholds', { thresholds });
    
    // Actualizar configuración local
    userAlertConfig.thresholds = { 
      ...userAlertConfig.thresholds,
      ...response.data.thresholds
    };
    
    logOperation('INFO', 'dashboard', 'configureAlertThresholds', {
      success: true
    });
    
    return response.data;
  } catch (error) {
    logOperation('ERROR', 'dashboard', 'configureAlertThresholds', {
      error: error.message
    });
    throw error;
  }
}

/**
 * Configura los canales de notificación para las alertas
 * @param {Object} channels - Canales a configurar (dashboard, email, push)
 * @returns {Promise<Object>} Configuración actualizada
 */
export async function configureNotificationChannels(channels) {
  try {
    const response = await api.post('/api/dashboard/alerts/config/channels', { channels });
    
    // Actualizar configuración local
    userAlertConfig.notificationChannels = { 
      ...userAlertConfig.notificationChannels,
      ...response.data.channels
    };
    
    logOperation('INFO', 'dashboard', 'configureNotificationChannels', {
      channels,
      success: true
    });
    
    return response.data;
  } catch (error) {
    logOperation('ERROR', 'dashboard', 'configureNotificationChannels', {
      channels,
      error: error.message
    });
    throw error;
  }
}

/**
 * Obtiene el historial de alertas
 * @param {Object} filters - Filtros para el historial (fecha, tipo, etc.)
 * @param {Object} pagination - Opciones de paginación
 * @returns {Promise<Object>} Historial de alertas
 */
export async function getAlertHistory(filters = {}, pagination = { page: 1, limit: 20 }) {
  try {
    const params = { ...filters, ...pagination };
    const response = await api.get('/api/dashboard/alerts/history', { params });
    
    logOperation('INFO', 'dashboard', 'getAlertHistory', {
      filters,
      resultsCount: response.data.total
    });
    
    return response.data;
  } catch (error) {
    logOperation('ERROR', 'dashboard', 'getAlertHistory', {
      filters,
      error: error.message
    });
    throw error;
  }
}

/**
 * Genera reportes de alertas
 * @param {Object} options - Opciones del reporte (formato, filtros, etc.)
 * @returns {Promise<Object>} URL o datos del reporte
 */
export async function generateAlertReport(options) {
  try {
    const response = await api.post('/api/dashboard/alerts/reports', options);
    
    logOperation('INFO', 'dashboard', 'generateAlertReport', {
      options,
      success: true
    });
    
    return response.data;
  } catch (error) {
    logOperation('ERROR', 'dashboard', 'generateAlertReport', {
      options,
      error: error.message
    });
    throw error;
  }
}

/**
 * Crea una suscripción para recibir alertas en tiempo real
 * @param {Function} callback - Función a ejecutar cuando llega una alerta
 * @returns {Function} Función para cancelar la suscripción
 */
export function subscribeToAlerts(callback) {
  const eventSource = new EventSource('/api/dashboard/alerts/stream');
  
  eventSource.onmessage = (event) => {
    const alert = JSON.parse(event.data);
    callback(alert);
  };
  
  eventSource.onerror = (error) => {
    logOperation('ERROR', 'dashboard', 'subscribeToAlerts', {
      error: error.message
    });
    eventSource.close();
  };
  
  return () => {
    eventSource.close();
  };
}

/**
 * Habilita o deshabilita las alertas para el usuario actual
 * @param {boolean} enabled - Estado de habilitación
 * @returns {Promise<Object>} Configuración actualizada
 */
export async function setAlertsEnabled(enabled) {
  try {
    const response = await api.post('/api/dashboard/alerts/config/enabled', { enabled });
    
    // Actualizar configuración local
    userAlertConfig.alertsEnabled = response.data.enabled;
    
    logOperation('INFO', 'dashboard', 'setAlertsEnabled', {
      enabled,
      success: true
    });
    
    return response.data;
  } catch (error) {
    logOperation('ERROR', 'dashboard', 'setAlertsEnabled', {
      enabled,
      error: error.message
    });
    throw error;
  }
}

/**
 * Obtiene la configuración actual de alertas del usuario
 * @returns {Promise<Object>} Configuración de alertas
 */
export async function getUserAlertConfig() {
  try {
    const response = await api.get('/api/dashboard/alerts/config');
    
    // Actualizar configuración local
    userAlertConfig = { ...userAlertConfig, ...response.data };
    
    logOperation('INFO', 'dashboard', 'getUserAlertConfig', {
      success: true
    });
    
    return userAlertConfig;
  } catch (error) {
    logOperation('ERROR', 'dashboard', 'getUserAlertConfig', {
      error: error.message
    });
    
    // Devolver configuración local en caso de error
    return userAlertConfig;
  }
} 