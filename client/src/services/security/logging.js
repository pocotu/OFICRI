/**
 * Servicio de Logging de Seguridad (ISO 27001 A.12.4)
 * 
 * Este servicio registra eventos de seguridad y actividad importante,
 * tanto a nivel local como en el servidor, cumpliendo con los requisitos
 * de la norma ISO 27001 sobre registro y supervisión.
 */

import { APP_CONFIG } from '../../config/app.config.js';
import { LOGGING_CONFIG } from '../../config/security.config.js';
import apiClient from '../api/apiClient.js';

// Renombramos para mantener compatibilidad con el código existente
const SECURITY_CONFIG = {
    logging: {
        logLevel: LOGGING_CONFIG.LEVELS.INFO,
        localStorageLogs: true,
        sendLogsToServer: true,
        maxLocalLogs: LOGGING_CONFIG.STORAGE.MAX_LOGS,
        logRetentionDays: LOGGING_CONFIG.STORAGE.LOG_RETENTION_DAYS
    }
};

// Estado del módulo
let isInitialized = false;

// Cola de logs pendientes para enviar
const pendingLogs = [];
const MAX_LOCAL_LOGS = 100;

// Niveles de log
export const LOG_LEVEL = {
  DEBUG: 'debug',
  INFO: 'info',
  WARN: 'warn',
  ERROR: 'error',
  SECURITY: 'security'
};

// Tipos de eventos de seguridad
export const SECURITY_EVENT = {
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILURE: 'LOGIN_FAILURE',
  LOGOUT: 'LOGOUT',
  PASSWORD_CHANGE: 'PASSWORD_CHANGE',
  PASSWORD_RESET: 'PASSWORD_RESET',
  USER_CREATED: 'USER_CREATED',
  USER_UPDATED: 'USER_UPDATED',
  USER_DELETED: 'USER_DELETED',
  SESSION_TIMEOUT: 'SESSION_TIMEOUT',
  PERMISSION_ERROR: 'PERMISSION_ERROR',
  API_ERROR: 'API_ERROR',
  CSRF_ERROR: 'CSRF_ERROR',
  INPUT_VALIDATION_ERROR: 'INPUT_VALIDATION_ERROR',
  SUSPICIOUS_ACTIVITY: 'SUSPICIOUS_ACTIVITY'
};

/**
 * Inicializa el servicio de logging
 * @param {boolean} sendToServer - Si se deben enviar logs al servidor
 * @returns {boolean} - true si se inicializó correctamente
 */
export function initLogging(sendToServer = true) {
  if (isInitialized) return true;
  
  // Cargar logs pendientes
  loadLogsFromStorage();
  
  // Configurar envío periódico al servidor
  if (sendToServer && SECURITY_CONFIG.logging.sendLogsToServer) {
    setInterval(flushLogsToServer, 30000); // Cada 30 segundos
  }
  
  // Agregar event listeners para errores no capturados y promesas rechazadas
  window.addEventListener('error', (event) => {
    log(LOG_LEVEL.ERROR, 'Uncaught error', {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno
    });
    
    // No impedir comportamiento predeterminado
    return false;
  });
  
  window.addEventListener('unhandledrejection', (event) => {
    log(LOG_LEVEL.ERROR, 'Unhandled promise rejection', {
      reason: event.reason ? event.reason.message : 'Unknown reason'
    });
    
    // No impedir comportamiento predeterminado
    return false;
  });
  
  isInitialized = true;
  log(LOG_LEVEL.INFO, 'Logging service initialized', { 
    localLogsEnabled: SECURITY_CONFIG.logging.localStorageLogs,
    serverLogsEnabled: SECURITY_CONFIG.logging.sendLogsToServer
  });
  
  return true;
}

/**
 * Registra un evento de seguridad
 * @param {string} eventType - Tipo de evento (usar constantes SECURITY_EVENT)
 * @param {Object} eventData - Datos adicionales del evento
 * @param {string} module - Módulo que genera el evento
 */
export function logSecurityEvent(eventType, eventData = {}, module = 'SECURITY') {
  // Asegurar que el tipo de evento es válido
  if (!Object.values(SECURITY_EVENT).includes(eventType)) {
    console.warn(`Tipo de evento de seguridad no reconocido: ${eventType}`);
  }
  
  // Registrar como evento de seguridad
  log(LOG_LEVEL.SECURITY, eventType, eventData, module);
}

/**
 * Registra un mensaje en el log
 * @param {string} level - Nivel de log (usar constantes LOG_LEVEL)
 * @param {string} message - Mensaje a registrar
 * @param {Object} data - Datos adicionales
 * @param {string} module - Módulo que genera el log
 */
export function log(level, message, data = {}, module = 'APP') {
  // Verificar inicialización
  if (!isInitialized && level !== LOG_LEVEL.DEBUG) {
    initLogging();
  }
  
  // Verificar nivel mínimo de log
  if (!shouldLog(level)) {
    return;
  }
  
  const timestamp = new Date().toISOString();
  const user = getUserInfo();
  
  // Crear entrada de log
  const logEntry = {
    timestamp,
    level,
    module,
    message,
    data: cleanLogData(data),
    user
  };
  
  // Registrar en consola con formato adecuado
  logToConsole(logEntry);
  
  // Almacenar el log localmente si está habilitado
  if (SECURITY_CONFIG.logging.localStorageLogs && level !== LOG_LEVEL.DEBUG) {
    storeLog(logEntry);
  }
  
  // Agregar a la cola para enviar al servidor si es nivel adecuado
  if (SECURITY_CONFIG.logging.sendLogsToServer && 
      (level === LOG_LEVEL.ERROR || level === LOG_LEVEL.SECURITY)) {
    pendingLogs.push(logEntry);
    
    // Si la cola es muy larga, intentar enviarla ahora
    if (pendingLogs.length >= 10) {
      flushLogsToServer();
    }
  }
}

/**
 * Muestra mensaje de log en la consola
 * @param {Object} logEntry - Entrada de log a mostrar
 */
function logToConsole(logEntry) {
  const prefix = `[${logEntry.timestamp}][${logEntry.module}][${logEntry.level.toUpperCase()}]`;
  
  switch (logEntry.level) {
    case LOG_LEVEL.DEBUG:
      console.debug(`${prefix} ${logEntry.message}`, logEntry.data);
      break;
    case LOG_LEVEL.INFO:
      console.info(`${prefix} ${logEntry.message}`, logEntry.data);
      break;
    case LOG_LEVEL.WARN:
      console.warn(`${prefix} ${logEntry.message}`, logEntry.data);
      break;
    case LOG_LEVEL.ERROR:
    case LOG_LEVEL.SECURITY:
      console.error(`${prefix} ${logEntry.message}`, logEntry.data);
      break;
  }
}

/**
 * Determina si un nivel de log debe ser registrado según la configuración
 * @param {string} level - Nivel de log a verificar
 * @returns {boolean} - true si debe registrarse
 */
function shouldLog(level) {
  const configLevel = SECURITY_CONFIG.logging.logLevel || 'info';
  
  const levels = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
    security: 4
  };
  
  // Si el nivel no está definido, asumir que debe loggearse
  if (!levels[level] || !levels[configLevel]) {
    return true;
  }
  
  return levels[level] >= levels[configLevel];
}

/**
 * Limpia datos sensibles antes de guardar o enviar logs
 * @param {Object} data - Datos originales
 * @returns {Object} - Datos limpios
 */
function cleanLogData(data) {
  if (!data || typeof data !== 'object') {
    return data;
  }
  
  // Crear copia para no modificar original
  const cleanData = { ...data };
  
  // Lista de claves sensibles a eliminar
  const sensitiveKeys = ['password', 'token', 'clave', 'contrasena', 'contraseña', 'secret', 'authorization'];
  
  // Recorrer objeto y limpiar datos sensibles
  Object.keys(cleanData).forEach(key => {
    if (sensitiveKeys.includes(key.toLowerCase())) {
      cleanData[key] = '[REDACTED]';
    } else if (typeof cleanData[key] === 'object' && cleanData[key] !== null) {
      cleanData[key] = cleanLogData(cleanData[key]);
    }
  });
  
  return cleanData;
}

/**
 * Obtiene información básica del usuario actual
 * @returns {Object} - Datos del usuario
 */
function getUserInfo() {
  try {
    // Intentar obtener datos del usuario del localStorage
    const userStr = localStorage.getItem(APP_CONFIG.storage.userKey);
    if (userStr) {
      const userData = JSON.parse(userStr);
      return {
        id: userData.IDUsuario || userData.id || 'unknown',
        username: userData.CodigoCIP || userData.username || 'unknown'
      };
    }
  } catch (e) {
    console.warn('Error al obtener datos de usuario para log:', e);
  }
  
  return { id: 'anonymous', username: 'anonymous' };
}

/**
 * Almacena un log en localStorage
 * @param {Object} logEntry - Entrada de log a almacenar
 */
function storeLog(logEntry) {
  try {
    // Obtener logs existentes
    let logs = [];
    const storedLogs = localStorage.getItem('security_logs');
    
    if (storedLogs) {
      logs = JSON.parse(storedLogs);
      
      // Limitar cantidad de logs
      if (logs.length >= MAX_LOCAL_LOGS) {
        logs = logs.slice(-MAX_LOCAL_LOGS + 1);
      }
    }
    
    // Agregar nuevo log
    logs.push(logEntry);
    
    // Guardar logs
    localStorage.setItem('security_logs', JSON.stringify(logs));
  } catch (e) {
    console.error('Error al guardar log en localStorage:', e);
  }
}

/**
 * Carga logs pendientes desde localStorage
 */
function loadLogsFromStorage() {
  try {
    const pendingLogsStr = localStorage.getItem('pending_logs');
    if (pendingLogsStr) {
      const logs = JSON.parse(pendingLogsStr);
      if (Array.isArray(logs)) {
        pendingLogs.push(...logs);
        
        // Limpiar después de cargar
        localStorage.removeItem('pending_logs');
      }
    }
  } catch (e) {
    console.error('Error al cargar logs pendientes:', e);
  }
}

/**
 * Envía logs pendientes al servidor
 * @returns {Promise<boolean>} - true si se enviaron correctamente
 */
export async function flushLogsToServer() {
  if (!SECURITY_CONFIG.logging.sendLogsToServer || pendingLogs.length === 0) {
    return false;
  }
  
  try {
    // Copiar logs pendientes y limpiar cola
    const logsToSend = [...pendingLogs];
    pendingLogs.length = 0;
    
    // Enviar al servidor
    await apiClient.post('/logs', { logs: logsToSend }, true);
    
    return true;
  } catch (e) {
    console.error('Error al enviar logs al servidor:', e);
    
    // Devolver logs a la cola
    pendingLogs.push(...pendingLogs);
    
    // Guardar en localStorage para intentar más tarde
    try {
      localStorage.setItem('pending_logs', JSON.stringify(pendingLogs));
    } catch (storageError) {
      console.error('Error al guardar logs pendientes en localStorage:', storageError);
    }
    
    return false;
  }
}

/**
 * Obtiene los logs almacenados localmente
 * @returns {Array} - Logs almacenados
 */
export function getLocalLogs() {
  try {
    const storedLogs = localStorage.getItem('security_logs');
    return storedLogs ? JSON.parse(storedLogs) : [];
  } catch (e) {
    console.error('Error al obtener logs locales:', e);
    return [];
  }
}

/**
 * Limpia los logs almacenados localmente
 */
export function clearLocalLogs() {
  try {
    localStorage.removeItem('security_logs');
  } catch (e) {
    console.error('Error al limpiar logs locales:', e);
  }
} 