/**
 * Servicio de Seguridad ISO 27001
 * 
 * Este servicio centraliza y coordina todos los aspectos de seguridad
 * conforme a la norma ISO/IEC 27001, integrando protección CSRF,
 * monitoreo de inactividad, logging y validación de entrada.
 */

import { AUTH_CONFIG } from '../../config/security.config.js';
import { APP_CONFIG } from '../../config/app.config.js';
import * as csrfService from './csrf.js';
import * as inactivityMonitor from './inactivityMonitor.js';
import * as loggingService from './logging.js';
import * as inputValidation from './inputValidation.js';

// Renombramos para mantener compatibilidad con el código existente
const SECURITY_CONFIG = {
    auth: {
        passwordPolicy: AUTH_CONFIG.PASSWORD_POLICY,
        sessionTimeout: AUTH_CONFIG.SESSION.TIMEOUT,
        maxFailedAttempts: AUTH_CONFIG.PASSWORD_POLICY.MAX_FAILED_ATTEMPTS,
        lockoutDuration: AUTH_CONFIG.PASSWORD_POLICY.LOCKOUT_DURATION
    }
};

// Estado global de seguridad
const securityState = {
  initialized: false,
  features: {
    csrf: false,
    inactivityMonitor: false,
    logging: false,
    inputValidation: false
  }
};

/**
 * Inicializa los servicios de seguridad
 * @param {Object} config - Configuración opcional para sobreescribir valores
 * @returns {boolean} - true si se inicializó correctamente
 */
export function initSecurity(config = {}) {
  // Evitar doble inicialización
  if (securityState.initialized) {
    console.warn('Los servicios de seguridad ya están inicializados');
    return true;
  }
  
  // Combinar configuración
  const mergedConfig = { ...SECURITY_CONFIG, ...config };
  
  try {
    // Inicializar logging primero para registrar el resto
    if (mergedConfig.logging) {
      loggingService.initLogging();
      securityState.features.logging = true;
      
      // Log de inicio
      loggingService.logSecurityEvent(
        loggingService.SECURITY_EVENT.SECURITY_INIT,
        { env: APP_CONFIG.env }
      );
    }
    
    // Inicializar protección CSRF
    if (mergedConfig.csrf.enabled) {
      csrfService.initCsrfProtection();
      securityState.features.csrf = true;
      
      if (securityState.features.logging) {
        loggingService.logSecurityEvent(
          loggingService.SECURITY_EVENT.CSRF_ENABLED,
          { method: mergedConfig.csrf.method }
        );
      }
    }
    
    // Inicializar monitor de inactividad
    if (mergedConfig.auth.sessionTimeout > 0) {
      // Configurar callback personalizado para timeout
      inactivityMonitor.initInactivityMonitor(
        // Callback para timeout
        () => {
          if (securityState.features.logging) {
            loggingService.logSecurityEvent(
              loggingService.SECURITY_EVENT.SESSION_TIMEOUT,
              { timeoutPeriod: mergedConfig.auth.sessionTimeout }
            );
          }
          
          // Limpiar datos de sesión
          localStorage.removeItem(APP_CONFIG.storage.tokenKey);
          localStorage.removeItem(APP_CONFIG.storage.userKey);
          sessionStorage.removeItem(APP_CONFIG.storage.tokenKey);
          sessionStorage.removeItem(APP_CONFIG.storage.userKey);
          
          // Redirigir a login con flag de timeout
          window.location.href = '/index.html?timeout=true';
        },
        // Callback para mostrar advertencia
        (showWarning, remainingTime) => {
          // Esta función se puede personalizar para mostrar un modal o notificación
          if (showWarning) {
            console.warn(`Sesión a punto de expirar en ${remainingTime} segundos`);
            // Aquí se podría mostrar un modal de advertencia
          } else {
            console.log('Advertencia de timeout ocultada');
            // Aquí se ocultaría el modal de advertencia
          }
        }
      );
      
      securityState.features.inactivityMonitor = true;
    }
    
    // Configurar event listeners
    setupSecurityEventListeners();
    
    securityState.initialized = true;
    console.log('Servicios de seguridad inicializados correctamente', securityState.features);
    
    return true;
  } catch (error) {
    console.error('Error al inicializar servicios de seguridad:', error);
    
    if (securityState.features.logging) {
      loggingService.logSecurityEvent(
        loggingService.SECURITY_EVENT.SECURITY_ERROR,
        { error: error.message, stack: error.stack }
      );
    }
    
    return false;
  }
}

/**
 * Configura event listeners para eventos de seguridad
 */
function setupSecurityEventListeners() {
  // Listener para errores no capturados
  window.addEventListener('error', event => {
    if (securityState.features.logging) {
      loggingService.log(
        loggingService.LOG_LEVEL.ERROR,
        'Uncaught JS Error',
        {
          message: event.message,
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno
        }
      );
    }
    
    // No prevenir el comportamiento predeterminado
    return false;
  });
  
  // Listener para promesas rechazadas no capturadas
  window.addEventListener('unhandledrejection', event => {
    if (securityState.features.logging) {
      loggingService.log(
        loggingService.LOG_LEVEL.ERROR,
        'Unhandled Promise Rejection',
        {
          reason: event.reason ? event.reason.toString() : 'Unknown'
        }
      );
    }
    
    // No prevenir el comportamiento predeterminado
    return false;
  });
}

/**
 * Obtiene el estado actual de los servicios de seguridad
 * @returns {Object} - Estado de seguridad
 */
export function getSecurityState() {
  return { ...securityState };
}

/**
 * Evalúa la fortaleza de una contraseña basada en políticas de seguridad
 * @param {string} password - Contraseña a evaluar
 * @returns {Object} - Resultado con puntaje y sugerencias
 */
export function evaluatePasswordStrength(password) {
  if (!password || typeof password !== 'string') {
    return {
      score: 0,
      isValid: false,
      suggestions: ['La contraseña no puede estar vacía'],
      details: {
        length: 0,
        hasUppercase: false,
        hasLowercase: false,
        hasNumbers: false,
        hasSpecial: false
      }
    };
  }
  
  const policy = SECURITY_CONFIG.auth.passwordPolicy;
  
  // Verificar criterios
  const details = {
    length: password.length,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumbers: /[0-9]/.test(password),
    hasSpecial: /[^A-Za-z0-9]/.test(password)
  };
  
  // Calcular puntaje (0-100)
  let score = 0;
  const suggestions = [];
  
  // Longitud (40 puntos máximo)
  if (password.length >= policy.minLength) {
    score += Math.min(40, Math.floor(password.length * 3));
  } else {
    suggestions.push(`La contraseña debe tener al menos ${policy.minLength} caracteres`);
  }
  
  // Complejidad (60 puntos máximo)
  if (details.hasUppercase) {
    score += 15;
  } else if (policy.requireUppercase) {
    suggestions.push('Incluir al menos una letra mayúscula');
  }
  
  if (details.hasLowercase) {
    score += 15;
  } else if (policy.requireLowercase) {
    suggestions.push('Incluir al menos una letra minúscula');
  }
  
  if (details.hasNumbers) {
    score += 15;
  } else if (policy.requireNumbers) {
    suggestions.push('Incluir al menos un número');
  }
  
  if (details.hasSpecial) {
    score += 15;
  } else if (policy.requireSpecial) {
    suggestions.push('Incluir al menos un carácter especial (ej. !@#$%)');
  }
  
  // Verificar patrones comunes o débiles
  if (/^(123|abc|qwerty|admin|password|contraseña|clave)/i.test(password)) {
    score = Math.max(score - 20, 0);
    suggestions.push('Evitar usar patrones comunes o previsibles');
  }
  
  // Determinar si cumple con los requisitos mínimos
  const isValid = 
    password.length >= policy.minLength &&
    (!policy.requireUppercase || details.hasUppercase) &&
    (!policy.requireLowercase || details.hasLowercase) &&
    (!policy.requireNumbers || details.hasNumbers) &&
    (!policy.requireSpecial || details.hasSpecial);
  
  return {
    score,
    isValid,
    suggestions,
    details
  };
}

/**
 * Sanitiza la entrada del usuario para prevenir ataques XSS
 * @param {string} input - Texto a sanitizar
 * @param {boolean} allowHtml - Si se permite HTML básico
 * @returns {string} - Texto sanitizado
 */
export function sanitizeInput(input, allowHtml = false) {
  return inputValidation.sanitizeInput(input, allowHtml);
}

/**
 * Genera un token CSRF para protección contra ataques
 * @returns {string} - Token CSRF
 */
export function generateCsrfToken() {
  if (!securityState.features.csrf) {
    console.warn('Protección CSRF no inicializada');
    return '';
  }
  return csrfService.generateCsrfToken();
}

/**
 * Valida un token CSRF recibido
 * @param {string} token - Token CSRF a validar
 * @returns {boolean} - true si el token es válido
 */
export function validateCsrfToken(token) {
  if (!securityState.features.csrf) {
    console.warn('Protección CSRF no inicializada');
    return false;
  }
  return csrfService.validateCsrfToken(token);
}

/**
 * Detiene todos los servicios de seguridad
 * Útil para logout o para pruebas
 */
export function shutdownSecurity() {
  // Detener monitor de inactividad
  if (securityState.features.inactivityMonitor) {
    inactivityMonitor.stopInactivityMonitor();
  }
  
  // Registrar evento
  if (securityState.features.logging) {
    loggingService.logSecurityEvent(
      loggingService.SECURITY_EVENT.SECURITY_SHUTDOWN,
      { reason: 'Manual shutdown' }
    );
    
    // Flush logs pendientes
    loggingService.flushLogsToServer();
  }
  
  securityState.initialized = false;
  
  // Reiniciar estado de características
  Object.keys(securityState.features).forEach(key => {
    securityState.features[key] = false;
  });
  
  console.log('Servicios de seguridad detenidos');
} 