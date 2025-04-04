/**
 * OFICRI Profile Debugger
 * Herramienta de diagnóstico para problemas de carga de perfil de usuario
 */

import { debugLogger } from './debugLogger.js';

// Crear logger específico para este módulo
const logger = debugLogger.createLogger('ProfileDebugger');

// Estado de la depuración
const state = {
  enabled: false,
  authChecks: [],
  apiRequests: [],
  errors: [],
  lastCheck: null
};

/**
 * Habilita o deshabilita el depurador de perfil
 * @param {boolean} enable - Si es true, habilita el depurador
 */
function enable(enable = true) {
  state.enabled = enable;
  logger.info(`Depurador de perfil ${enable ? 'habilitado' : 'deshabilitado'}`);
}

/**
 * Ejecuta una comprobación completa del estado de autenticación
 * @returns {Object} Resultado de la comprobación
 */
function checkAuthState() {
  if (!state.enabled) {
    logger.warn('El depurador no está habilitado. Use profileDebugger.enable() primero.');
    return null;
  }

  logger.info('Ejecutando comprobación de estado de autenticación...');

  const result = {
    timestamp: new Date().toISOString(),
    localStorage: {},
    sessionStorage: {},
    windowState: {}
  };

  // Verificar localStorage
  try {
    result.localStorage.token = !!localStorage.getItem('oficri_token');
    result.localStorage.refreshToken = !!localStorage.getItem('oficri_refresh_token');
    
    const userJson = localStorage.getItem('oficri_user');
    result.localStorage.userExists = !!userJson;
    
    if (userJson) {
      try {
        const userData = JSON.parse(userJson);
        result.localStorage.user = {
          valid: true,
          hasId: !!userData.IDUsuario,
          hasCodigoCIP: !!userData.CodigoCIP,
          id: userData.IDUsuario,
          codigoCIP: userData.CodigoCIP
        };
      } catch (e) {
        result.localStorage.user = { valid: false, error: e.message };
      }
    }
  } catch (e) {
    result.localStorage.error = e.message;
  }

  // Verificar sessionStorage
  try {
    result.sessionStorage.authState = sessionStorage.getItem('oficri_auth_state');
    result.sessionStorage.authCycleCount = sessionStorage.getItem('oficri_auth_cycle_count');
    result.sessionStorage.fromLogout = sessionStorage.getItem('oficri_from_logout');
  } catch (e) {
    result.sessionStorage.error = e.message;
  }

  // Verificar estado en window
  try {
    result.windowState.hasOFICRI = !!window.OFICRI;
    
    if (window.OFICRI) {
      result.windowState.hasAuthService = !!window.OFICRI.authService;
      result.windowState.hasProfileService = !!window.OFICRI.profileService;
      result.windowState.hasProfileComponent = !!window.OFICRI.profileComponent;
      
      // Verificar usuario en authService
      if (window.OFICRI.authService && typeof window.OFICRI.authService.getUser === 'function') {
        const user = window.OFICRI.authService.getUser();
        result.windowState.authServiceUser = {
          exists: !!user,
          hasId: user ? !!user.IDUsuario : false,
          hasCodigoCIP: user ? !!user.CodigoCIP : false
        };
      }
      
      // Verificar estado de autenticación
      if (window.OFICRI.authService && typeof window.OFICRI.authService.isAuthenticated === 'function') {
        result.windowState.isAuthenticated = window.OFICRI.authService.isAuthenticated();
      }
    }
  } catch (e) {
    result.windowState.error = e.message;
  }

  // Guardar resultado en historial
  state.authChecks.push(result);
  state.lastCheck = result;
  
  logger.info('Comprobación de autenticación completada', { result });
  
  return result;
}

/**
 * Intenta recuperar el estado del perfil
 * @returns {boolean} True si la recuperación tuvo éxito
 */
function recoverProfileState() {
  try {
    logger.info('Intentando recuperar estado del perfil...');
    
    // Comprobar estado actual
    const check = checkAuthState();
    
    // Si no hay token pero hay datos de usuario en localStorage, intentar recuperar
    if (!check.localStorage.token && check.localStorage.userExists) {
      logger.warn('Se encontraron datos de usuario pero no hay token. Posible desincronización.');
      
      // Si se encuentra en modo desarrollo, intentar regenerar el token desde localStorage
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        // Generar mock token para desarrollo
        const mockToken = 'mock-token-' + Date.now();
        localStorage.setItem('oficri_token', mockToken);
        logger.info('Modo desarrollo: Token mock generado.');
        
        return true;
      }
    }
    
    // Si no hay datos de usuario en localStorage pero hay token, intentar recuperar
    if (check.localStorage.token && !check.localStorage.userExists) {
      logger.warn('Se encontró token pero no hay datos de usuario. Intentando cargar usuario desde API...');
      
      // Aquí se podría implementar una solicitud a /auth/verificar-token para obtener el usuario
      // Por ahora solo regresamos false para indicar que se necesita una reinicialización completa
      return false;
    }
    
    return false;
  } catch (error) {
    logger.error('Error en recuperación de estado del perfil', { error });
    return false;
  }
}

/**
 * Forzar reinicialización del componente de perfil
 */
function reinitializeProfile() {
  try {
    logger.info('Reinicializando componente de perfil...');
    
    // Verificar si existe el componente
    if (window.OFICRI && window.OFICRI.profileComponent && typeof window.OFICRI.profileComponent.init === 'function') {
      // Reinicializar
      window.OFICRI.profileComponent.init();
      logger.info('Componente de perfil reinicializado.');
      return true;
    } else {
      logger.error('No se pudo reinicializar el componente. No existe o no tiene método init.');
      return false;
    }
  } catch (error) {
    logger.error('Error al reinicializar el componente de perfil', { error });
    return false;
  }
}

/**
 * Registra una solicitud API para depuración
 * @param {string} url - URL de la solicitud
 * @param {Object} options - Opciones de fetch
 * @param {Object} result - Resultado de la solicitud
 */
function logApiRequest(url, options, result) {
  if (!state.enabled) return;
  
  state.apiRequests.push({
    timestamp: new Date().toISOString(),
    url,
    method: options.method,
    headers: options.headers,
    result: {
      status: result.status,
      statusText: result.statusText,
      hasData: !!result.data
    }
  });
  
  logger.debug('API Request registrada', { url, method: options.method });
}

/**
 * Limpia el historial de depuración
 */
function clearHistory() {
  state.authChecks = [];
  state.apiRequests = [];
  state.errors = [];
  state.lastCheck = null;
  
  logger.info('Historial de depuración limpiado');
}

/**
 * Muestra un resumen del estado actual en consola
 */
function printSummary() {
  console.group('🔍 Profile Debugger Summary');
  
  if (state.lastCheck) {
    console.log('📊 Last Check:', state.lastCheck);
    
    console.group('🔑 Authentication State');
    console.log('Token exists:', state.lastCheck.localStorage.token);
    console.log('User data exists:', state.lastCheck.localStorage.userExists);
    console.log('Auth state:', state.lastCheck.sessionStorage.authState || 'none');
    console.log('Is authenticated:', state.lastCheck.windowState.isAuthenticated);
    console.groupEnd();
  } else {
    console.log('❌ No check has been performed. Run profileDebugger.checkAuthState() first.');
  }
  
  console.log('📝 Auth Checks:', state.authChecks.length);
  console.log('🌐 API Requests:', state.apiRequests.length);
  console.log('⚠️ Errors:', state.errors.length);
  
  console.groupEnd();
}

// Exportar API pública
const profileDebugger = {
  enable,
  checkAuthState,
  recoverProfileState,
  reinitializeProfile,
  logApiRequest,
  clearHistory,
  printSummary,
  getState: () => ({ ...state })
};

// Exponer en namespace global
window.OFICRI = window.OFICRI || {};
window.OFICRI.profileDebugger = profileDebugger;

export { profileDebugger };
export default profileDebugger; 