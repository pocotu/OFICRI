/**
 * OFICRI Auth State Manager
 * Módulo para gestionar el estado de autenticación y prevenir ciclos de redirección
 */

import { debugLogger } from './debugLogger.js';

// Crear logger específico para este módulo
const logger = debugLogger.createLogger('AuthState');

// Constantes
const AUTH_STATE_KEY = 'oficri_auth_state';
const AUTH_CYCLE_COUNT_KEY = 'oficri_auth_cycle_count';
const MAX_AUTH_CYCLES = 3;
const STATE_TIMESTAMP_KEY = 'oficri_auth_state_timestamp';

/**
 * Clase principal para gestionar el estado de autenticación
 */
const authStateManager = (function() {
  'use strict';

  // Estados internos
  const STATES = {
    IDLE: null,
    AUTHENTICATING: 'authenticating',
    REDIRECTING: 'redirecting',
    LOGGING_OUT: 'logging_out',
    REFRESHING: 'refreshing',
    RESCUED: 'rescued'
  };

  /**
   * Obtiene el estado actual de autenticación
   * @returns {string|null} - Estado de autenticación o null si no hay estado
   */
  const getState = function() {
    return sessionStorage.getItem(AUTH_STATE_KEY);
  };

  /**
   * Obtiene el tiempo que lleva el estado actual
   * @returns {number} - Milisegundos desde que se estableció el estado, o -1 si no hay timestamp
   */
  const getStateDuration = function() {
    const timestamp = sessionStorage.getItem(STATE_TIMESTAMP_KEY);
    if (!timestamp) return -1;
    
    const startTime = parseInt(timestamp, 10);
    return Date.now() - startTime;
  };

  /**
   * Comprueba si un estado ha expirado
   * @param {string} state - Estado a comprobar
   * @param {number} maxDurationMs - Duración máxima en ms
   * @returns {boolean} - True si el estado ha expirado
   */
  const hasStateExpired = function(state, maxDurationMs = 10000) {
    if (getState() !== state) return false;
    
    const duration = getStateDuration();
    return duration > maxDurationMs;
  };

  /**
   * Establece el estado de autenticación
   * @param {string} state - Nuevo estado de autenticación
   */
  const setState = function(state) {
    const prevState = getState();
    
    if (state === prevState) {
      logger.debug(`Estado ${state} ya establecido, ignorando`);
      return;
    }
    
    logger.info(`Cambiando estado: ${prevState || 'NULL'} -> ${state || 'NULL'}`);
    
    if (!state) {
      sessionStorage.removeItem(AUTH_STATE_KEY);
      sessionStorage.removeItem(STATE_TIMESTAMP_KEY);
      return;
    }
    
    // Si estamos intentando cambiar de un estado a otro sin pasar por null,
    // verificar si el estado anterior no ha expirado
    if (prevState && state !== prevState) {
      const duration = getStateDuration();
      logger.warn(`Cambiando directamente de ${prevState} a ${state} (duración: ${duration}ms)`);
      
      // Si el estado anterior es LOGGING_OUT y lleva más de 10 segundos, permitimos el cambio
      // para evitar que se quede bloqueado en logout
      if (prevState === STATES.LOGGING_OUT && duration > 10000) {
        logger.warn(`Forzando cambio de estado porque LOGGING_OUT lleva más de 10 segundos`);
      } 
      // Si el estado previo es REDIRECTING y lleva más de 5 segundos, permitimos el cambio
      else if (prevState === STATES.REDIRECTING && duration > 5000) {
        logger.warn(`Forzando cambio de estado porque REDIRECTING lleva más de 5 segundos`);
      }
      // En otros casos, registramos el cambio pero mostramos advertencia
      else {
        logger.warn(`Cambiando estado sin resetear el anterior: ${prevState} -> ${state}`);
      }
    }
    
    sessionStorage.setItem(AUTH_STATE_KEY, state);
    sessionStorage.setItem(STATE_TIMESTAMP_KEY, Date.now().toString());
  };

  /**
   * Verifica si hay un ciclo de redirección en curso
   * @returns {boolean} - True si hay un ciclo de redirección
   */
  const isRedirectionCycle = function() {
    const cycleCount = parseInt(sessionStorage.getItem(AUTH_CYCLE_COUNT_KEY) || '0', 10);
    return cycleCount >= MAX_AUTH_CYCLES;
  };

  /**
   * Incrementa el contador de ciclos de redirección
   * @returns {number} - Nuevo contador de ciclos
   */
  const incrementCycleCount = function() {
    const cycleCount = parseInt(sessionStorage.getItem(AUTH_CYCLE_COUNT_KEY) || '0', 10);
    const newCount = cycleCount + 1;
    sessionStorage.setItem(AUTH_CYCLE_COUNT_KEY, newCount.toString());
    
    logger.warn(`Ciclo de redirección detectado (${newCount}/${MAX_AUTH_CYCLES})`);
    
    return newCount;
  };

  /**
   * Resetea el contador de ciclos de redirección
   */
  const resetCycleCount = function() {
    logger.debug('Reseteando contador de ciclos de redirección');
    sessionStorage.removeItem(AUTH_CYCLE_COUNT_KEY);
  };

  /**
   * Registra un inicio de página para detectar ciclos
   * @param {string} pageName - Nombre de la página actual
   */
  const registerPageLoad = function(pageName) {
    // Si venimos de otra página, registrar posible ciclo
    const lastPage = sessionStorage.getItem('oficri_last_page');
    const currentTime = Date.now();
    const lastLoadTime = parseInt(sessionStorage.getItem('oficri_last_load_time') || '0', 10);
    
    logger.debug(`Registrando carga de página: ${pageName} (anterior: ${lastPage || 'ninguna'})`);
    
    // Verificar si se quedó algún estado bloqueado
    const currentState = getState();
    if (currentState) {
      const stateDuration = getStateDuration();
      logger.debug(`Estado actual: ${currentState} (duración: ${stateDuration}ms)`);
      
      // Si hay un estado de larga duración, puede estar bloqueado
      if (stateDuration > 30000) { // 30 segundos
        logger.warn(`Estado ${currentState} posiblemente bloqueado (${stateDuration}ms), reseteando`);
        setState(null);
      }
    }
    
    // Si la última carga fue hace menos de 2 segundos y estamos alternando páginas
    if (lastPage && lastPage !== pageName && (currentTime - lastLoadTime < 2000)) {
      logger.warn(`Posible ciclo de navegación: ${lastPage} -> ${pageName} en ${currentTime - lastLoadTime}ms`);
      incrementCycleCount();
      
      // Si detectamos demasiados ciclos, entrar en modo de rescate
      if (isRedirectionCycle()) {
        logger.error('Detectado ciclo de redirección excesivo, entrando en modo de rescate');
        
        // Limpiar estado para romper el ciclo
        setState(STATES.RESCUED);
        
        // Mostrar mensaje al usuario
        setTimeout(() => {
          alert('Se ha detectado un problema con la navegación. El sistema intentará recuperarse automáticamente.');
        }, 500);
        
        // Limpiar todas las variables de sesión relacionadas con autenticación
        _cleanupAuthStorage();
      }
    } else if (lastPage === pageName) {
      logger.debug(`Recarga de la misma página: ${pageName}`);
    } else if (lastPage) {
      logger.debug(`Navegación normal: ${lastPage} -> ${pageName} (${currentTime - lastLoadTime}ms)`);
      
      // Si es una navegación normal, resetear contador de ciclos
      if (currentTime - lastLoadTime > 3000) {
        resetCycleCount();
      }
    } else {
      logger.debug(`Primera carga de página: ${pageName}`);
    }
    
    // Registrar página actual
    sessionStorage.setItem('oficri_last_page', pageName);
    sessionStorage.setItem('oficri_last_load_time', currentTime.toString());
    
    // Verificar si venimos de un logout
    const fromLogout = sessionStorage.getItem('oficri_from_logout') === 'true';
    if (fromLogout) {
      logger.info('Navegación después de logout, limpiando flag from_logout');
      sessionStorage.removeItem('oficri_from_logout');
    }
  };

  /**
   * Método auxiliar para limpiar almacenamiento de autenticación en caso de problemas
   * @private
   */
  const _cleanupAuthStorage = function() {
    logger.warn('Ejecutando limpieza de almacenamiento de autenticación');
    
    // Limpiar todos los estados almacenados
    setState(null);
    resetCycleCount();
    
    // Eliminar tokens que puedan estar causando problemas
    try {
      localStorage.removeItem('oficri_token');
      localStorage.removeItem('oficri_refresh_token');
      localStorage.removeItem('oficri_user');
      
      // Eliminar otras variables de sesión que puedan interferir
      sessionStorage.removeItem('oficri_last_page');
      sessionStorage.removeItem('oficri_last_load_time');
      sessionStorage.removeItem('oficri_from_logout');
      sessionStorage.removeItem(STATE_TIMESTAMP_KEY);
      
      logger.info('Limpieza de almacenamiento completada');
    } catch (error) {
      logger.error('Error durante limpieza de almacenamiento', { error });
    }
  };

  /**
   * Verifica si es seguro realizar una redirección
   * @param {string} targetPage - Página a la que se quiere redirigir
   * @returns {boolean} - True si es seguro redirigir
   */
  const canRedirect = function(targetPage) {
    logger.debug(`Verificando si es seguro redirigir a: ${targetPage}`);
    
    // No permitir redirecciones durante rescate
    if (getState() === STATES.RESCUED) {
      logger.warn(`En modo rescate, no se permite redirección a ${targetPage}`);
      return false;
    }
    
    // No permitir redirecciones si hay demasiados ciclos
    if (isRedirectionCycle()) {
      logger.warn(`Demasiados ciclos de redirección, bloqueando redirección a ${targetPage}`);
      return false;
    }
    
    // No permitir redirecciones si está en curso otra redirección
    const currentState = getState();
    if (currentState === STATES.REDIRECTING) {
      logger.warn(`Ya hay una redirección en curso, bloqueando redirección a ${targetPage}`);
      return false;
    }
    
    // Caso especial: permitir redirección a login incluso durante logout
    if (targetPage === 'login' && currentState === STATES.LOGGING_OUT) {
      const duration = getStateDuration();
      
      // Si el logout lleva más de 5 segundos, permitir la redirección
      if (duration > 5000) {
        logger.info(`Permitiendo redirección a login durante logout (duración: ${duration}ms)`);
        return true;
      } else {
        logger.debug(`Logout en curso (${duration}ms), aún no permitimos redirección a login`);
        return false;
      }
    }
    
    // Verificar si hay otro estado activo
    if (currentState && currentState !== STATES.IDLE) {
      logger.warn(`Estado activo: ${currentState}, verificando si puede ser interrumpido`);
      
      // Verificar si el estado ha expirado
      const duration = getStateDuration();
      if (duration > 10000) { // 10 segundos
        logger.warn(`Estado ${currentState} posiblemente bloqueado (${duration}ms), permitiendo redirección`);
        return true;
      }
      
      logger.warn(`No se permite redirección a ${targetPage} durante ${currentState}`);
      return false;
    }
    
    logger.debug(`Es seguro redirigir a ${targetPage}`);
    return true;
  };
  
  /**
   * Limpia el estado de autenticación si existe un intento de login o autenticación en curso
   * @returns {boolean} - True si se limpió un estado, false si no había estado que limpiar
   */
  const clearAuthenticationState = function() {
    const currentState = getState();
    logger.debug(`Intentando limpiar estado de autenticación: ${currentState || 'NULL'}`);
    
    if (!currentState) {
      return false;
    }
    
    // Limpiar cualquier estado que pueda estar bloqueado
    const duration = getStateDuration();
    if (duration > 10000) { // 10 segundos
      logger.warn(`Limpiando estado ${currentState} que lleva ${duration}ms y podría estar bloqueado`);
      setState(null);
      return true;
    }
    
    // Solo limpiar estados específicos inmediatamente
    if (currentState === STATES.AUTHENTICATING) {
      logger.info('Limpiando estado de autenticación en curso');
      setState(null);
      return true;
    }
    
    return false;
  };

  /**
   * Verifica si el estado actual ha estado activo demasiado tiempo
   * @param {number} maxDurationMs - Duración máxima en ms
   * @returns {boolean} - True si el estado ha expirado
   */
  const isStateStuck = function(maxDurationMs = 10000) {
    const currentState = getState();
    if (!currentState) return false;
    
    const duration = getStateDuration();
    return duration > maxDurationMs;
  };
  
  /**
   * Limpia el estado si ha estado activo demasiado tiempo
   * @param {number} maxDurationMs - Duración máxima en ms
   * @returns {boolean} - True si se limpió un estado
   */
  const resetStuckState = function(maxDurationMs = 10000) {
    if (isStateStuck(maxDurationMs)) {
      const currentState = getState();
      const duration = getStateDuration();
      logger.warn(`Reseteando estado ${currentState} bloqueado (${duration}ms)`);
      setState(null);
      return true;
    }
    return false;
  };

  // API pública
  return {
    getState,
    setState,
    isRedirectionCycle,
    incrementCycleCount,
    resetCycleCount,
    registerPageLoad,
    canRedirect,
    clearAuthenticationState,
    isStateStuck,
    resetStuckState,
    getStateDuration,
    hasStateExpired,
    // Exponer función de limpieza para uso en casos críticos
    emergencyCleanup: _cleanupAuthStorage,
    // Constantes exportadas para uso en otros módulos
    STATES
  };
})();

// Inicializar: verificar si hay estados bloqueados al cargar
// Este código se ejecuta inmediatamente cuando se importa el módulo
(function initStateManager() {
  const currentState = authStateManager.getState();
  if (currentState) {
    const duration = authStateManager.getStateDuration();
    logger.debug(`Estado al inicializar: ${currentState} (duración: ${duration}ms)`);
    
    // Si hay un estado que lleva más de 30 segundos, probablemente quedó bloqueado
    // de una sesión anterior, así que lo limpiamos
    if (duration > 30000) {
      logger.warn(`Limpiando estado ${currentState} al inicializar (duración: ${duration}ms)`);
      authStateManager.setState(null);
    }
  }
})();

// Exportar para ES modules
export { authStateManager };

// Compatibilidad global
if (typeof window !== 'undefined') {
  window.OFICRI = window.OFICRI || {};
  window.OFICRI.authStateManager = authStateManager;
} 