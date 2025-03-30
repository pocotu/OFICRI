/**
 * OFICRI Auth State Manager
 * Módulo para gestionar el estado de autenticación y prevenir ciclos de redirección
 */

// Constantes
const AUTH_STATE_KEY = 'oficri_auth_state';
const AUTH_CYCLE_COUNT_KEY = 'oficri_auth_cycle_count';
const MAX_AUTH_CYCLES = 3;

/**
 * Clase principal para gestionar el estado de autenticación
 */
const authStateManager = (function() {
  'use strict';

  /**
   * Obtiene el estado actual de autenticación
   * @returns {string|null} - Estado de autenticación o null si no hay estado
   */
  const getState = function() {
    return sessionStorage.getItem(AUTH_STATE_KEY);
  };

  /**
   * Establece el estado de autenticación
   * @param {string} state - Nuevo estado de autenticación
   */
  const setState = function(state) {
    if (!state) {
      sessionStorage.removeItem(AUTH_STATE_KEY);
      return;
    }
    sessionStorage.setItem(AUTH_STATE_KEY, state);
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
    
    console.log(`[AUTH STATE] Ciclo de redirección detectado (${newCount}/${MAX_AUTH_CYCLES})`);
    
    return newCount;
  };

  /**
   * Resetea el contador de ciclos de redirección
   */
  const resetCycleCount = function() {
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
    
    // Si la última carga fue hace menos de 2 segundos y estamos alternando páginas
    if (lastPage && lastPage !== pageName && (currentTime - lastLoadTime < 2000)) {
      incrementCycleCount();
      
      // Si detectamos demasiados ciclos, entrar en modo de rescate
      if (isRedirectionCycle()) {
        console.warn('[AUTH STATE] Detectado ciclo de redirección excesivo, entrando en modo de rescate');
        
        // Limpiar estado para romper el ciclo
        setState('rescued');
        
        // Mostrar mensaje al usuario
        setTimeout(() => {
          alert('Se ha detectado un problema con la navegación. El sistema intentará recuperarse automáticamente.');
        }, 500);
        
        // Limpiar todas las variables de sesión relacionadas con autenticación
        _cleanupAuthStorage();
      }
    }
    
    // Registrar página actual
    sessionStorage.setItem('oficri_last_page', pageName);
    sessionStorage.setItem('oficri_last_load_time', currentTime.toString());
  };

  /**
   * Método auxiliar para limpiar almacenamiento de autenticación en caso de problemas
   * @private
   */
  const _cleanupAuthStorage = function() {
    // Limpiar todos los estados almacenados
    setState(null);
    resetCycleCount();
    
    // Eliminar tokens que puedan estar causando problemas
    localStorage.removeItem('oficri_token');
    localStorage.removeItem('oficri_refresh_token');
    localStorage.removeItem('oficri_user');
    
    // Eliminar otras variables de sesión que puedan interferir
    sessionStorage.removeItem('oficri_last_page');
    sessionStorage.removeItem('oficri_last_load_time');
    sessionStorage.removeItem('oficri_from_logout');
  };

  /**
   * Verifica si es seguro realizar una redirección
   * @param {string} targetPage - Página a la que se quiere redirigir
   * @returns {boolean} - True si es seguro redirigir
   */
  const canRedirect = function(targetPage) {
    // No permitir redirecciones durante rescate
    if (getState() === 'rescued') {
      console.warn('[AUTH STATE] En modo rescate, no se permite redirección a', targetPage);
      return false;
    }
    
    // No permitir redirecciones si hay demasiados ciclos
    if (isRedirectionCycle()) {
      console.warn('[AUTH STATE] Demasiados ciclos de redirección, bloqueando redirección a', targetPage);
      return false;
    }
    
    // No permitir redirecciones si está en curso otra redirección
    const currentState = getState();
    if (currentState === 'redirecting' || currentState === 'logging_out') {
      console.warn('[AUTH STATE] Ya hay una redirección en curso:', currentState);
      return false;
    }
    
    return true;
  };
  
  /**
   * Limpia el estado de autenticación si existe un intento de login o autenticación en curso
   * @returns {boolean} - True si se limpió un estado, false si no había estado que limpiar
   */
  const clearAuthenticationState = function() {
    const currentState = getState();
    
    // Solo limpiar estados relacionados con autenticación
    if (currentState === 'authenticating') {
      console.log('[AUTH STATE] Limpiando estado de autenticación en curso');
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
    // Constantes exportadas para uso en otros módulos
    STATES: {
      IDLE: null,
      AUTHENTICATING: 'authenticating',
      REDIRECTING: 'redirecting',
      LOGGING_OUT: 'logging_out',
      REFRESHING: 'refreshing',
      RESCUED: 'rescued'
    }
  };
})();

// Exportar para ES modules
export { authStateManager };

// Compatibilidad global
window.OFICRI = window.OFICRI || {};
window.OFICRI.authStateManager = authStateManager; 