/**
 * OFICRI Logout Service
 * Servicio especializado para el manejo del cierre de sesión
 * Implementa comunicación con el backend y limpieza de datos locales
 */

import { apiClient } from '../api/apiClient.js';
import { authStateManager } from '../utils/authStateManager.js';
import { appConfig } from '../config/appConfig.js';
import { sessionEvents } from '../utils/sessionEvents.js';
import { notificationManager } from '../ui/notificationManager.js';
import { debugLogger } from '../utils/debugLogger.js';

// Crear logger específico para este módulo
const logger = debugLogger.createLogger('LogoutService');

// Constantes
const TOKEN_KEY = 'oficri_token';
const USER_KEY = 'oficri_user';
const REFRESH_TOKEN_KEY = 'oficri_refresh_token';

// Estado interno del servicio
const _state = {
  // Flag para indicar si ya se ha detectado que el endpoint no existe
  endpointNotAvailable: false,
  // Flag para indicar si hay un proceso de logout en curso
  logoutInProgress: false,
  // Fecha del último intento de logout
  lastLogoutAttempt: null,
  // Contador de intentos de logout
  logoutAttempts: 0,
  // Contador de redirecciones
  redirectionCount: 0
};

/**
 * Muestra notificaciones durante el proceso de cierre de sesión
 * @param {string} type - Tipo de notificación (info, success, error, warning)
 * @param {string} title - Título de la notificación
 * @param {string} message - Mensaje de la notificación
 * @private
 */
function _showNotification(type, title, message) {
  logger.debug(`Mostrando notificación: ${type} - ${title} - ${message}`);
  
  try {
    // Intentar usar el nuevo gestor de notificaciones
    if (notificationManager && typeof notificationManager[`show${type.charAt(0).toUpperCase() + type.slice(1)}`] === 'function') {
      logger.debug('Usando notificationManager para mostrar notificación');
      notificationManager[`show${type.charAt(0).toUpperCase() + type.slice(1)}`](title, message);
      return;
    }
    
    // Intentar usar el namespace global como fallback
    if (window.OFICRI && window.OFICRI.notifications && 
        typeof window.OFICRI.notifications[`show${type.charAt(0).toUpperCase() + type.slice(1)}`] === 'function') {
      logger.debug('Usando OFICRI.notifications para mostrar notificación');
      window.OFICRI.notifications[`show${type.charAt(0).toUpperCase() + type.slice(1)}`](title, message);
      return;
    }
    
    // Fallback a console si no hay sistema de notificaciones
    logger.warn('No se encontró sistema de notificaciones, usando console como fallback');
    console[type](`[${type.toUpperCase()}] ${title}: ${message}`);
  } catch (error) {
    // Si hay un error en las notificaciones, al menos logueamos en consola
    logger.error('Error al mostrar notificación', { error });
    console[type](`[${type.toUpperCase()}] ${title}: ${message}`);
  }
}

/**
 * Realiza el proceso de cierre de sesión con comunicación al servidor
 * @param {Object} options - Opciones para el cierre de sesión
 * @returns {Promise} Promesa que resuelve cuando se completa el proceso
 */
export function logoutWithServer(options = {}) {
  logger.info(`Iniciando proceso de logout`, { options });
  
  // Verificar si ya hay un proceso en curso y evitar duplicación
  if (_state.logoutInProgress) {
    logger.warn('Ya hay un proceso de logout en curso, ignorando solicitud adicional');
    return Promise.resolve({ 
      success: true, 
      message: 'Logout en curso', 
      alreadyInProgress: true 
    });
  }
  
  // Verificar cool-down entre intentos para evitar spam
  const now = Date.now();
  if (_state.lastLogoutAttempt && (now - _state.lastLogoutAttempt < 1000)) {
    logger.warn(`Intento de logout muy rápido (${now - _state.lastLogoutAttempt}ms), aplicando cooldown`);
    return Promise.resolve({ 
      success: false, 
      message: 'Por favor espere antes de intentar nuevamente' 
    });
  }
  
  // Actualizar estado
  _state.logoutInProgress = true;
  _state.lastLogoutAttempt = now;
  _state.logoutAttempts++;
  
  logger.debug(`Intento de logout #${_state.logoutAttempts}`);
  
  return new Promise((resolve, reject) => {
    // Verificar si hay un token para enviar al servidor
    const token = localStorage.getItem(TOKEN_KEY);
    logger.debug(`Token encontrado: ${token ? 'Sí' : 'No'}`);
    
    // Obtener datos del usuario antes de cerrar sesión (para logging)
    const userDataStr = localStorage.getItem(USER_KEY);
    let userData = {};
    
    try {
      if (userDataStr) {
        userData = JSON.parse(userDataStr);
        logger.debug('Datos de usuario recuperados', { 
          userId: userData.IDUsuario,
          username: userData.CodigoCIP
        });
      } else {
        logger.warn('No se encontraron datos de usuario para registrar en logout');
      }
    } catch (parseError) {
      logger.error('Error al parsear datos de usuario', { error: parseError });
      // Continuar con objeto vacío
    }
    
    // Marcar como cerrando sesión en el estado de autenticación
    authStateManager.setState(authStateManager.STATES.LOGGING_OUT);
    
    // Si no hay token, solo hacer limpieza local
    if (!token) {
      logger.info('No hay token, realizando solo logout local');
      performLocalLogout();
      
      // Registrar evento de logout (sin token)
      _logLogoutEvent({
        userId: userData.IDUsuario,
        username: userData.CodigoCIP,
        success: true,
        noToken: true,
        reason: options.reason || 'USER_INITIATED'
      });
      
      _completeLogout({ success: true, local: true, noToken: true });
      resolve({ success: true, local: true, noToken: true });
      return;
    }
    
    // Mostrar notificación de proceso iniciado
    _showNotification('info', 'Cerrando sesión', 'Por favor espere...');
    
    // Si ya sabemos que el endpoint no está disponible, realizamos solo logout local
    if (_state.endpointNotAvailable) {
      logger.info('Usando logout local (endpoint no disponible)');
      performLocalLogout();
      
      // Mostrar notificación de éxito
      _showNotification('success', 'Sesión cerrada', 'La sesión se ha cerrado correctamente');
      
      // Registrar evento de logout (endpoint no disponible)
      _logLogoutEvent({
        userId: userData.IDUsuario,
        username: userData.CodigoCIP,
        success: true,
        local: true,
        endpointNotAvailable: true,
        reason: options.reason || 'USER_INITIATED'
      });
      
      _completeLogout({ success: true, local: true, endpointNotAvailable: true });
      resolve({ success: true, local: true, endpointNotAvailable: true });
      return;
    }
    
    // Intentar enviar la solicitud de cierre de sesión al servidor
    logger.debug('Intentando comunicación con el endpoint /auth/logout');
    
    apiClient.post('/auth/logout')
      .then(response => {
        logger.info('Respuesta exitosa del servidor para logout', { response });
        
        // Realizar limpieza local
        performLocalLogout();
        
        // Mostrar notificación de éxito
        _showNotification('success', 'Sesión cerrada', 'Ha cerrado sesión correctamente');
        
        // Registrar evento de cierre de sesión exitoso
        _logLogoutEvent({
          userId: userData.IDUsuario,
          username: userData.CodigoCIP,
          success: true,
          reason: options.reason || 'USER_INITIATED'
        });
        
        _completeLogout({ success: true, response });
        resolve({ success: true, response });
      })
      .catch(error => {
        logger.warn('Error al comunicarse con el servidor para logout', { error });
        
        // Si recibimos un 404, marcar que el endpoint no está disponible para futuras llamadas
        if (error && error.status === 404) {
          logger.info('El endpoint /auth/logout no está disponible, se usará solo logout local en el futuro');
          _state.endpointNotAvailable = true;
        }
        
        // Realizar limpieza local de todas formas
        performLocalLogout();
        
        // La respuesta visual depende de si el error es que no existe el endpoint o hay otro problema
        if (error && error.status === 404) {
          // Es un 404 - endpoint no existe, es esperado - cerramos sin mostrar advertencia
          logger.info('404 en logout - endpoint no implementado en el servidor, usando logout local');
          _showNotification('success', 'Sesión cerrada', 'La sesión se ha cerrado correctamente');
        } else {
          // Es otro tipo de error - mostramos advertencia
          logger.warn(`Error ${error?.status || 'desconocido'} en logout, pero se cerró localmente`);
          _showNotification('warning', 'Advertencia', 'Se cerró la sesión localmente, pero hubo problemas al comunicarse con el servidor.');
        }
        
        // Registrar evento de cierre de sesión con error
        _logLogoutEvent({
          userId: userData.IDUsuario,
          username: userData.CodigoCIP,
          success: true, // La sesión se cerró localmente correctamente
          serverError: true,
          serverStatus: error ? error.status : 'unknown',
          reason: options.reason || 'USER_INITIATED',
          error: error ? (error.message || 'Error de comunicación') : 'Error desconocido'
        });
        
        _completeLogout({ success: true, local: true, error });
        resolve({ success: true, local: true, error });
      });
  });
}

/**
 * Registra evento de logout con manejo de errores para evitar bloqueos
 * @param {Object} details - Detalles del evento
 * @private
 */
function _logLogoutEvent(details) {
  try {
    if (!sessionEvents || typeof sessionEvents.logLogout !== 'function') {
      logger.warn('Módulo sessionEvents no disponible para registrar logout');
      return;
    }
    
    logger.debug('Registrando evento de logout', { details });
    sessionEvents.logLogout(details)
      .catch(logError => {
        logger.error('Error al registrar evento de logout', { logError });
      });
  } catch (error) {
    logger.error('Error inesperado al intentar registrar evento de logout', { error });
  }
}

/**
 * Completa el proceso de logout actualizando el estado interno
 * @param {Object} result - Resultado del proceso
 * @private
 */
function _completeLogout(result) {
  logger.info('Completando proceso de logout', { result });
  
  // Limpiar estado interno
  setTimeout(() => {
    _state.logoutInProgress = false;
    logger.debug('Estado logoutInProgress restablecido a false');
  }, 1000);
}

/**
 * Realiza la limpieza local para el cierre de sesión
 */
export function performLocalLogout() {
  logger.info('Ejecutando limpieza local para logout');
  
  try {
    // Limpiar localStorage
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    
    // Registrar que venimos de logout para evitar ciclos de redirección
    sessionStorage.setItem('oficri_from_logout', 'true');
    
    // Restaurar estado de autenticación
    setTimeout(() => {
      authStateManager.setState(null);
      logger.debug('Estado de autenticación restablecido a null después del logout');
    }, 500);
    
    logger.info('Limpieza local completada exitosamente');
  } catch (error) {
    logger.error('Error durante limpieza local de logout', { error });
    // Intentar restaurar estado incluso en caso de error
    setTimeout(() => {
      try {
        authStateManager.setState(null);
      } catch (stateError) {
        logger.error('Error al restablecer estado de autenticación', { stateError });
      }
    }, 500);
  }
}

/**
 * Redirige al usuario a la página de login después del cierre de sesión
 * @param {Object} options - Opciones para la redirección
 * @returns {boolean} - Verdadero si la redirección se inició
 */
export function redirectToLogin(options = {}) {
  logger.info('Iniciando redirección a login', { options });
  
  // Incrementar contador de redirecciones
  _state.redirectionCount++;
  
  // Si ha habido demasiadas redirecciones, evitar continuar
  if (_state.redirectionCount > 3) {
    logger.warn(`Demasiadas redirecciones (${_state.redirectionCount}), bloqueando para evitar ciclos`);
    return false;
  }
  
  // Verificar que es seguro redirigir
  if (!authStateManager.canRedirect('login')) {
    logger.warn('No es seguro redirigir según authStateManager');
    return false;
  }
  
  try {
    // Registrar redirección
    authStateManager.setState(authStateManager.STATES.REDIRECTING);
    logger.debug('Estado cambiado a REDIRECTING');
    
    // Añadir pequeño delay para evitar problemas
    logger.debug('Programando redirección con delay de seguridad');
    setTimeout(() => {
      try {
        // Agregar timestamp para evitar caché
        const redirectUrl = `index.html?t=${Date.now()}`;
        logger.info(`Redirigiendo a: ${redirectUrl}`);
        window.location.href = redirectUrl;
        
        // Reset estado después de iniciar redirección
        setTimeout(() => {
          try {
            authStateManager.setState(null);
            logger.debug('Estado restablecido después de redirección');
          } catch (error) {
            logger.error('Error al restablecer estado después de redirección', { error });
          }
        }, 500);
      } catch (error) {
        logger.error('Error durante redirección', { error });
      }
    }, 100);
    
    return true;
  } catch (error) {
    logger.error('Error inesperado al intentar redirigir', { error });
    
    // Intentar restaurar estado
    try {
      authStateManager.setState(null);
    } catch (stateError) {
      logger.error('Error al restablecer estado tras fallo de redirección', { stateError });
    }
    
    return false;
  }
}

/**
 * Cierra la sesión por motivo de seguridad (expiración, violación de sesión)
 * @param {string} reason - Motivo del cierre de sesión
 * @returns {Promise} Promesa que resuelve al completar el cierre
 */
export function securityLogout(reason = 'SESSION_EXPIRED') {
  logger.info(`Iniciando cierre de sesión por seguridad: ${reason}`);
  
  return logoutWithServer({ reason })
    .then(result => {
      logger.debug('Logout por seguridad completado, iniciando redirección', { result });
      redirectToLogin({ reason });
      return result;
    })
    .catch(error => {
      logger.error('Error en logout por seguridad', { error, reason });
      // Intentar redirección incluso con error
      redirectToLogin({ reason, error: true });
      throw error;
    });
}

/**
 * Realiza un logout completo con redirección a login
 * @param {Object} options - Opciones para el proceso
 * @returns {Promise} Promesa que resuelve al completar el proceso
 */
export function completeLogout(options = {}) {
  logger.info('Iniciando proceso de logout completo', { options });
  
  return logoutWithServer(options)
    .then(result => {
      logger.debug('Logout completado, preparando redirección', { result });
      
      const redirectionStarted = redirectToLogin(options);
      
      if (!redirectionStarted) {
        logger.warn('No se pudo iniciar redirección, forzando cambio de ubicación');
        // Si la redirección no se pudo iniciar, intento directo
        try {
          window.location.href = 'index.html';
        } catch (error) {
          logger.error('Error al forzar redirección', { error });
        }
      }
      
      return {
        ...result,
        redirected: redirectionStarted
      };
    })
    .catch(error => {
      logger.error('Error en proceso de logout completo', { error });
      return {
        success: false,
        error,
        message: 'Error en proceso de logout'
      };
    });
}

// Objeto que expone la API pública
export const logoutService = {
  logout: completeLogout,
  logoutWithoutRedirect: logoutWithServer,
  performLocalLogout,
  redirectToLogin,
  securityLogout,
  // Exponer estado para depuración
  getState: () => ({ ..._state })
};

// Export default para compatibilidad
export default logoutService; 