/**
 * OFICRI Session Events Module
 * Módulo para gestionar eventos relacionados con la sesión del usuario
 * Registra eventos como inicio y cierre de sesión, inactividad, bloqueo, etc.
 */

import { apiClient } from '../api/apiClient.js';
import { appConfig } from '../config/appConfig.js';
import { debugLogger } from './debugLogger.js';

// Crear logger específico para este módulo
const logger = debugLogger.createLogger('SessionEvents');

// Constantes
const SESSION_EVENTS = {
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
  SESSION_EXPIRED: 'SESSION_EXPIRED',
  SESSION_REFRESHED: 'SESSION_REFRESHED',
  USER_INACTIVE: 'USER_INACTIVE',
  SESSION_BLOCKED: 'SESSION_BLOCKED',
  PERMISSIONS_CHANGED: 'PERMISSIONS_CHANGED'
};

// Estado interno del módulo
const _state = {
  // Indica si ya se descubrió que el endpoint no existe
  endpointNotAvailable: false,
  // Contador de intentos fallidos consecutivos
  consecutiveFailures: 0,
  // Máximo de intentos fallidos antes de marcar endpoint como no disponible
  maxConsecutiveFailures: 3,
  // Timestamp del último evento registrado localmente
  lastLocalEvent: null
};

/**
 * Guarda un evento en el almacenamiento local
 * @param {string} eventType - Tipo de evento
 * @param {Object} eventData - Datos adicionales del evento
 * @private
 */
function _saveEventLocally(eventType, eventData = {}) {
  try {
    // Preparar datos del evento
    const eventRecord = {
      eventType,
      timestamp: new Date().toISOString(),
      localTimestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      ...eventData,
      storedLocally: true
    };
    
    // Obtener eventos previos
    const storedEventsJson = sessionStorage.getItem('oficri_session_events') || '[]';
    let storedEvents = [];
    
    try {
      storedEvents = JSON.parse(storedEventsJson);
      if (!Array.isArray(storedEvents)) {
        logger.warn('Formato de eventos almacenados no válido, iniciando nuevo array');
        storedEvents = [];
      }
    } catch (parseError) {
      logger.error('Error al parsear eventos almacenados, creando nuevo array', { parseError });
      storedEvents = [];
    }
    
    // Agregar nuevo evento (limitar a 100 eventos máximo)
    storedEvents.push(eventRecord);
    
    // Solo mantener los últimos 100 eventos
    const trimmedEvents = storedEvents.slice(-100);
    
    // Guardar en sessionStorage
    sessionStorage.setItem('oficri_session_events', JSON.stringify(trimmedEvents));
    
    // Actualizar estado
    _state.lastLocalEvent = new Date();
    
    logger.info(`Evento ${eventType} guardado localmente`, { 
      eventCount: trimmedEvents.length 
    });
    
    return { success: true, local: true, event: eventRecord };
  } catch (error) {
    logger.error('Error al guardar evento localmente', { error, eventType });
    return { success: false, error };
  }
}

/**
 * Registra un evento de sesión en el servidor
 * @param {string} eventType - Tipo de evento (usar constantes SESSION_EVENTS)
 * @param {Object} eventData - Datos adicionales del evento
 * @returns {Promise} Promesa que resuelve cuando se completa el registro
 */
function logSessionEvent(eventType, eventData = {}) {
  logger.debug(`Intentando registrar evento de sesión: ${eventType}`, { eventData });
  
  // Verificar si estamos en modo de desarrollo (no enviar todos los eventos)
  if (appConfig.isDevelopment() && !appConfig.shouldLogEventsInDev()) {
    logger.info(`Modo desarrollo: evento ${eventType} no enviado al servidor`);
    
    // Aún así guardar localmente para referencia
    return Promise.resolve(
      _saveEventLocally(eventType, { ...eventData, devModeSkipped: true })
    );
  }
  
  // Si ya sabemos que el endpoint no está disponible, guardar solo localmente
  if (_state.endpointNotAvailable) {
    logger.info(`Endpoint de logs no disponible, registrando ${eventType} solo localmente`);
    return Promise.resolve(
      _saveEventLocally(eventType, { ...eventData, endpointNotAvailable: true })
    );
  }
  
  // Preparar datos del evento
  const data = {
    eventType,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    ...eventData
  };
  
  // Intentar enviar evento al servidor
  return apiClient.post('/logs/session', data)
    .then(response => {
      logger.info(`Evento ${eventType} registrado exitosamente en el servidor`);
      
      // Resetear contador de fallos
      if (_state.consecutiveFailures > 0) {
        _state.consecutiveFailures = 0;
        logger.debug('Contador de fallos consecutivos reseteado');
      }
      
      return { success: true, response };
    })
    .catch(error => {
      // Incrementar contador de fallos
      _state.consecutiveFailures++;
      
      // Si el endpoint no existe (404), registramos localmente y marcamos endpoint como no disponible
      if (error.status === 404) {
        logger.warn(`Endpoint /logs/session no encontrado (404), registrando localmente`);
        
        // Marcar endpoint como no disponible después de varios intentos
        if (_state.consecutiveFailures >= _state.maxConsecutiveFailures) {
          logger.warn(`${_state.consecutiveFailures} fallos consecutivos, marcando endpoint como no disponible`);
          _state.endpointNotAvailable = true;
        }
        
        // Registrar localmente
        return _saveEventLocally(eventType, { 
          ...data, 
          serverError: true, 
          statusCode: 404 
        });
      } else {
        logger.error(`Error al registrar evento ${eventType} en el servidor`, { 
          error, 
          statusCode: error.status, 
          errorMessage: error.message 
        });
        
        // Registrar localmente en caso de cualquier error
        return _saveEventLocally(eventType, { 
          ...data, 
          serverError: true, 
          statusCode: error.status || 'unknown',
          errorMessage: error.message
        });
      }
    });
}

/**
 * Registra un evento de cierre de sesión
 * @param {Object} details - Detalles adicionales del cierre de sesión
 * @returns {Promise} Promesa que resuelve cuando se completa el registro
 */
function logLogoutEvent(details = {}) {
  // Este try/catch es para evitar que falle todo el logout si hay un error aquí
  try {
    logger.info('Registrando evento de logout', { details });
    
    // Asegurar que haya una razón por defecto
    const eventDetails = {
      reason: 'USER_INITIATED',
      ...details
    };
    
    return logSessionEvent(SESSION_EVENTS.LOGOUT, eventDetails);
  } catch (error) {
    logger.error('Error crítico en logLogoutEvent', { error });
    
    // Intentar el registro local como último recurso
    try {
      return Promise.resolve(
        _saveEventLocally(SESSION_EVENTS.LOGOUT, {
          reason: details.reason || 'USER_INITIATED',
          ...details,
          criticalError: true,
          errorMessage: error.message
        })
      );
    } catch (localError) {
      logger.error('Error fatal al intentar registrar logout incluso localmente', { localError });
      return Promise.resolve({ success: false, error, localError });
    }
  }
}

/**
 * Registra un evento de inicio de sesión
 * @param {Object} details - Detalles adicionales del inicio de sesión
 * @returns {Promise} Promesa que resuelve cuando se completa el registro
 */
function logLoginEvent(details = {}) {
  // Este try/catch es para evitar que falle todo el login si hay un error aquí
  try {
    logger.info('Registrando evento de login', { details });
    return logSessionEvent(SESSION_EVENTS.LOGIN, details);
  } catch (error) {
    logger.error('Error en logLoginEvent', { error });
    
    // Intentar el registro local como último recurso
    try {
      return Promise.resolve(
        _saveEventLocally(SESSION_EVENTS.LOGIN, {
          ...details,
          criticalError: true,
          errorMessage: error.message
        })
      );
    } catch (localError) {
      return Promise.resolve({ success: false, error, localError });
    }
  }
}

/**
 * Registra un evento de sesión expirada
 * @param {Object} details - Detalles adicionales
 * @returns {Promise} Promesa que resuelve cuando se completa el registro
 */
function logSessionExpiredEvent(details = {}) {
  // Este try/catch es para evitar que falle el manejo de expiración si hay un error aquí
  try {
    logger.info('Registrando evento de sesión expirada', { details });
    return logSessionEvent(SESSION_EVENTS.SESSION_EXPIRED, details);
  } catch (error) {
    logger.error('Error en logSessionExpiredEvent', { error });
    
    // Intentar el registro local como último recurso
    try {
      return Promise.resolve(
        _saveEventLocally(SESSION_EVENTS.SESSION_EXPIRED, {
          ...details,
          criticalError: true,
          errorMessage: error.message
        })
      );
    } catch (localError) {
      return Promise.resolve({ success: false, error, localError });
    }
  }
}

/**
 * Obtiene todos los eventos almacenados localmente
 * @returns {Array} - Array de eventos almacenados
 */
function getLocalEvents() {
  try {
    const storedEventsJson = sessionStorage.getItem('oficri_session_events') || '[]';
    return JSON.parse(storedEventsJson);
  } catch (error) {
    logger.error('Error al obtener eventos locales', { error });
    return [];
  }
}

/**
 * Devuelve información sobre el estado interno para diagnóstico
 * @returns {Object} - Estado interno del módulo
 */
function getDiagnostics() {
  return {
    ..._state,
    localEventsCount: getLocalEvents().length
  };
}

// Exportar funciones y constantes
export const sessionEvents = {
  TYPES: SESSION_EVENTS,
  log: logSessionEvent,
  logLogout: logLogoutEvent,
  logLogin: logLoginEvent,
  logSessionExpired: logSessionExpiredEvent,
  getLocalEvents,
  getDiagnostics
};

// Compatibilidad global
if (typeof window !== 'undefined') {
  window.OFICRI = window.OFICRI || {};
  window.OFICRI.sessionEvents = sessionEvents;
}

export default sessionEvents; 