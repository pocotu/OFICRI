/**
 * Monitor de Inactividad (ISO 27001 A.9.4.2)
 * 
 * Este servicio monitorea la actividad del usuario y cierra la sesión
 * automáticamente después de un período de inactividad, conforme a los
 * requisitos de seguridad ISO 27001.
 */

import { AUTH_CONFIG } from '../../config/security.config.js';

// Renombramos para mantener compatibilidad con el código existente
const SECURITY_CONFIG = {
    auth: {
        sessionTimeout: AUTH_CONFIG.SESSION.TIMEOUT,
        warningTime: AUTH_CONFIG.SESSION.WARNING_TIME
    }
};

// Variables para control de inactividad
let isMonitorActive = false;
let inactivityTimer = null;
let lastActivity = Date.now();
let warningShown = false;
let warningTimer = null;
let sessionTimeoutCallback = null;
let warningCallback = null;

// Eventos a monitorear para detectar actividad
const activityEvents = [
  'mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'
];

/**
 * Inicializa el monitor de inactividad
 * @param {Function} timeoutCallback - Función a llamar cuando se agota el tiempo
 * @param {Function} showWarningCallback - Función para mostrar advertencia antes del timeout
 * @param {number} warningTime - Tiempo en segundos antes de mostrar advertencia
 * @returns {boolean} - true si se inició correctamente
 */
export function initInactivityMonitor(
  timeoutCallback = null,
  showWarningCallback = null,
  warningTime = 60 // Segundos antes de timeout para mostrar advertencia
) {
  // Si ya está activo, detenerlo primero
  if (isMonitorActive) {
    stopInactivityMonitor();
  }
  
  // Guardar callbacks
  sessionTimeoutCallback = timeoutCallback || defaultTimeoutCallback;
  warningCallback = showWarningCallback;
  
  // Configurar tiempo basado en la configuración
  const sessionTimeout = SECURITY_CONFIG.auth.sessionTimeout || 1800; // 30 minutos por defecto
  
  // Inicializar variables
  lastActivity = Date.now();
  warningShown = false;
  
  // Agregar event listeners para detectar actividad
  activityEvents.forEach(event => {
    window.addEventListener(event, resetInactivityTimer, { passive: true });
  });
  
  // Iniciar el timer
  inactivityTimer = setInterval(() => {
    checkInactivity(sessionTimeout, warningTime);
  }, 5000); // Revisar cada 5 segundos
  
  isMonitorActive = true;
  console.log('Monitor de inactividad iniciado', { tiempoSesion: sessionTimeout });
  
  return true;
}

/**
 * Detiene el monitor de inactividad
 */
export function stopInactivityMonitor() {
  if (!isMonitorActive) return;
  
  // Limpiar timers
  clearInterval(inactivityTimer);
  if (warningTimer) clearTimeout(warningTimer);
  
  // Eliminar event listeners
  activityEvents.forEach(event => {
    window.removeEventListener(event, resetInactivityTimer);
  });
  
  isMonitorActive = false;
  inactivityTimer = null;
  warningTimer = null;
  warningShown = false;
  
  console.log('Monitor de inactividad detenido');
}

/**
 * Reinicia el temporizador de inactividad
 */
export function resetInactivityTimer() {
  lastActivity = Date.now();
  
  // Si había una advertencia mostrada, ocultarla
  if (warningShown && warningCallback) {
    warningCallback(false);
    warningShown = false;
  }
  
  // Limpiar el timer de advertencia si existe
  if (warningTimer) {
    clearTimeout(warningTimer);
    warningTimer = null;
  }
}

/**
 * Verifica si el usuario ha estado inactivo por demasiado tiempo
 * @param {number} sessionTimeout - Tiempo máximo de inactividad en segundos
 * @param {number} warningTime - Tiempo antes del timeout para mostrar advertencia
 */
function checkInactivity(sessionTimeout, warningTime) {
  if (!isMonitorActive) return;
  
  const currentTime = Date.now();
  const inactiveTime = Math.floor((currentTime - lastActivity) / 1000); // en segundos
  
  // Si está a punto de agotarse el tiempo, mostrar advertencia
  if (inactiveTime >= (sessionTimeout - warningTime) && !warningShown) {
    warningShown = true;
    
    // Mostrar advertencia si hay callback
    if (warningCallback) {
      warningCallback(true, warningTime);
    }
    
    // Configurar el timer para cerrar sesión
    warningTimer = setTimeout(() => {
      // Solo cerrar sesión si sigue inactivo
      const finalInactiveTime = Math.floor((Date.now() - lastActivity) / 1000);
      if (finalInactiveTime >= sessionTimeout) {
        sessionTimeoutCallback();
      }
    }, warningTime * 1000);
  }
  
  // Si ha superado el tiempo de inactividad, cerrar sesión
  if (inactiveTime >= sessionTimeout) {
    sessionTimeoutCallback();
  }
}

/**
 * Callback predeterminado para el timeout de sesión
 */
function defaultTimeoutCallback() {
  console.warn('Sesión cerrada por inactividad');
  
  // Intentar obtener función de cierre de sesión de authService de manera segura
  // Nota: Usamos esta técnica para evitar dependencias circulares
  try {
    // Enviamos a login con un parámetro especial
    window.location.href = '/index.html?timeout=true';
  } catch (e) {
    console.error('Error al cerrar sesión por inactividad:', e);
  }
}

/**
 * Obtiene el tiempo restante antes del timeout
 * @returns {number} - Tiempo restante en segundos
 */
export function getInactivityRemainingTime() {
  if (!isMonitorActive) return -1;
  
  const sessionTimeout = SECURITY_CONFIG.auth.sessionTimeout || 1800;
  const inactiveTime = Math.floor((Date.now() - lastActivity) / 1000);
  return Math.max(0, sessionTimeout - inactiveTime);
} 