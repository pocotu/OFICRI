/**
 * OFICRI Logout Debugger
 * Herramienta para diagnosticar problemas de cierre de sesión
 */

import { debugLogger } from './debugLogger.js';
import { authStateManager } from './authStateManager.js';
import { sessionEvents } from './sessionEvents.js';
import { logoutService } from '../services/logoutService.js';

// Crear logger para este módulo
const logger = debugLogger.createLogger('LogoutDebugger');

/**
 * Recopila información de diagnóstico sobre el estado actual del sistema
 * @returns {Object} - Información de diagnóstico
 */
function collectDiagnostics() {
  logger.info('Recopilando información de diagnóstico de logout');
  
  const diagnostics = {
    timestamp: new Date().toISOString(),
    browserInfo: {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language
    },
    authState: {
      currentState: authStateManager.getState(),
      stateDuration: authStateManager.getStateDuration(),
      isStateStuck: authStateManager.isStateStuck(),
      redirectionCycle: authStateManager.isRedirectionCycle()
    },
    sessionStorage: {},
    localStorage: {},
    sessionEvents: {
      diagnostics: sessionEvents.getDiagnostics(),
      localEvents: sessionEvents.getLocalEvents()
    },
    logoutService: logoutService.getState ? logoutService.getState() : 'Estado no disponible'
  };
  
  // Inspeccionar sessionStorage
  try {
    Object.keys(sessionStorage).forEach(key => {
      if (key.startsWith('oficri_')) {
        try {
          // Intentar parsear como JSON si es posible
          const value = sessionStorage.getItem(key);
          try {
            diagnostics.sessionStorage[key] = JSON.parse(value);
          } catch (e) {
            // Si no es JSON, usar el valor directo
            diagnostics.sessionStorage[key] = value;
          }
        } catch (error) {
          diagnostics.sessionStorage[key] = 'Error al leer valor';
        }
      }
    });
  } catch (error) {
    diagnostics.sessionStorage.error = 'Error al acceder a sessionStorage';
  }
  
  // Inspeccionar localStorage (solo tokens redactados)
  try {
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('oficri_')) {
        try {
          const value = localStorage.getItem(key);
          
          // Redactar información sensible
          if (key.includes('token')) {
            diagnostics.localStorage[key] = value ? 'REDACTADO (presente)' : 'null';
          } else if (key === 'oficri_user') {
            try {
              const userData = JSON.parse(value);
              diagnostics.localStorage[key] = {
                present: !!userData,
                hasIDUsuario: !!userData?.IDUsuario,
                hasCodigoCIP: !!userData?.CodigoCIP,
                role: userData?.role || userData?.IDRol || 'N/A'
              };
            } catch (e) {
              diagnostics.localStorage[key] = 'Error al parsear datos de usuario';
            }
          } else {
            diagnostics.localStorage[key] = value;
          }
        } catch (error) {
          diagnostics.localStorage[key] = 'Error al leer valor';
        }
      }
    });
  } catch (error) {
    diagnostics.localStorage.error = 'Error al acceder a localStorage';
  }
  
  logger.debug('Información de diagnóstico recopilada');
  return diagnostics;
}

/**
 * Muestra la información de diagnóstico en la consola
 */
function showDiagnostics() {
  const diagnostics = collectDiagnostics();
  
  console.group('📊 DIAGNÓSTICO DE LOGOUT');
  console.log('Timestamp:', diagnostics.timestamp);
  
  console.group('🔐 Estado de Autenticación');
  console.log('Estado actual:', diagnostics.authState.currentState || 'null');
  console.log('Duración del estado:', diagnostics.authState.stateDuration, 'ms');
  console.log('¿Estado bloqueado?', diagnostics.authState.isStateStuck);
  console.log('¿Ciclo de redirección?', diagnostics.authState.redirectionCycle);
  console.groupEnd();
  
  console.group('📝 Eventos de Sesión');
  console.log('Diagnóstico:', diagnostics.sessionEvents.diagnostics);
  console.log('Eventos almacenados localmente:', diagnostics.sessionEvents.localEvents.length);
  if (diagnostics.sessionEvents.localEvents.length > 0) {
    console.log('Último evento:', diagnostics.sessionEvents.localEvents[diagnostics.sessionEvents.localEvents.length - 1]);
  }
  console.groupEnd();
  
  console.group('🚪 Servicio de Logout');
  console.log(diagnostics.logoutService);
  console.groupEnd();
  
  console.group('🗄️ Almacenamiento de Sesión');
  console.table(diagnostics.sessionStorage);
  console.groupEnd();
  
  console.group('💾 Almacenamiento Local');
  console.table(diagnostics.localStorage);
  console.groupEnd();
  
  console.groupEnd();
  
  return diagnostics;
}

/**
 * Intenta reparar problemas comunes de cierre de sesión
 * @returns {Object} - Resultado de la reparación
 */
function repairLogoutIssues() {
  logger.info('Intentando reparar problemas de logout');
  
  const results = {
    actions: [],
    fixed: false
  };
  
  // 1. Verificar si hay un estado bloqueado y limpiarlo
  if (authStateManager.isStateStuck()) {
    const currentState = authStateManager.getState();
    const duration = authStateManager.getStateDuration();
    
    logger.warn(`Limpiando estado bloqueado: ${currentState} (${duration}ms)`);
    authStateManager.setState(null);
    
    results.actions.push({
      type: 'RESET_AUTH_STATE',
      details: { previousState: currentState, duration }
    });
  }
  
  // 2. Limpiar banderas de ciclos si existen
  if (authStateManager.isRedirectionCycle()) {
    logger.warn('Reseteando ciclos de redirección');
    authStateManager.resetCycleCount();
    
    results.actions.push({
      type: 'RESET_REDIRECTION_CYCLES'
    });
  }
  
  // 3. Limpiar bandera de logout en progreso si está presente
  if (sessionStorage.getItem('oficri_from_logout') === 'true') {
    logger.warn('Limpiando bandera de logout en progreso');
    sessionStorage.removeItem('oficri_from_logout');
    
    results.actions.push({
      type: 'REMOVE_LOGOUT_FLAG'
    });
  }
  
  // 4. Si se ha detectado que no hay endpoint de logout, restablecer
  // la bandera para intentar de nuevo (solo si hay acciones previas)
  if (results.actions.length > 0 && logoutService.getState && logoutService.getState().endpointNotAvailable) {
    // Esto requerirá que el usuario refresque la página para que surta efecto
    logger.warn('Se requiere actualizar la página para restablecer endpoint');
    
    results.actions.push({
      type: 'ENDPOINT_FLAG_RESET_REQUIRED',
      details: 'Es necesario actualizar la página para restablecer la detección de endpoint'
    });
  }
  
  results.fixed = results.actions.length > 0;
  logger.info(`Reparación completada, ${results.actions.length} acciones realizadas`);
  
  return results;
}

/**
 * Fuerza un logout de emergencia eliminando tokens y redirigiendo
 * @returns {Object} - Resultado de la operación
 */
function forceEmergencyLogout() {
  logger.warn('Ejecutando logout de emergencia');
  
  try {
    // 1. Limpiar todas las variables de autenticación
    authStateManager.emergencyCleanup();
    
    // 2. Log de la acción (sin esperar respuesta)
    try {
      sessionEvents.logLogout({
        forced: true,
        emergency: true,
        reason: 'EMERGENCY_FORCED'
      }).catch(() => {});
    } catch (logError) {
      // Ignorar errores de logging
    }
    
    // 3. Redirigir a la página de login
    logger.info('Redirigiendo a login después de logout de emergencia');
    setTimeout(() => {
      try {
        window.location.href = 'index.html?emergency=1';
      } catch (redirectError) {
        logger.error('Error al redirigir después de logout de emergencia', { redirectError });
        alert('Error al redirigir. Por favor, cierre sesión manualmente navegando a la página de inicio.');
      }
    }, 500);
    
    return { success: true };
  } catch (error) {
    logger.error('Error durante logout de emergencia', { error });
    return { success: false, error };
  }
}

// Exportar funciones públicas
export const logoutDebugger = {
  diagnose: collectDiagnostics,
  showDiagnostics,
  repair: repairLogoutIssues,
  forceEmergencyLogout
};

// Exponer en el espacio global para acceso desde la consola
if (typeof window !== 'undefined') {
  window.OFICRI = window.OFICRI || {};
  window.OFICRI.logoutDebugger = logoutDebugger;
}

export default logoutDebugger; 