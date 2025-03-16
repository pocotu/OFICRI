/**
 * Índice de servicios de seguridad ISO 27001
 * 
 * Este archivo centraliza la exportación de todos los servicios de seguridad
 * para facilitar su importación en otros módulos de la aplicación.
 */

// Servicio principal de seguridad
import * as securityService from './security.js';
export { securityService };

// Servicios individuales
import * as csrfService from './csrf.js';
import * as loggingService from './logging.js';
import * as inactivityMonitor from './inactivityMonitor.js';
import * as inputValidation from './inputValidation.js';

export {
  csrfService,
  loggingService,
  inactivityMonitor,
  inputValidation
};

// Exportar función de inicialización directamente para facilitar su uso
export const initSecurity = securityService.initSecurity;

// Exportar algunas funciones de uso común para acceso directo
export const {
  sanitizeInput,
  evaluatePasswordStrength,
  generateCsrfToken,
  validateCsrfToken
} = securityService;

// Exportar funciones de logging para uso directo
export const {
  logSecurityEvent,
  log,
  LOG_LEVEL,
  SECURITY_EVENT
} = loggingService;

// Exportar función por defecto para importación simplificada
export default securityService; 