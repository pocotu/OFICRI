/**
 * OFICRI System Configuration (Compatibility Bridge)
 * 
 * Este archivo es un puente para mantener compatibilidad con código existente
 * y redireccionar al nuevo sistema de configuración.
 */

import { appConfig } from './appConfig.js';

// Mantener compatibilidad con el objeto config anterior
export const config = {
  api: {
    baseUrl: appConfig.apiUrl,
    timeout: appConfig.apiTimeout,
    retries: 1,
    corsOptions: {
      credentials: 'include',
      mode: 'cors',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      }
    }
  },
  
  auth: {
    tokenKey: 'oficri_token',
    refreshTokenKey: 'oficri_refresh_token',
    userKey: 'oficri_user',
    expiryKey: 'oficri_token_expiry',
    inactivityTimeout: appConfig.security ? appConfig.security.sessionTimeout : 30 * 60 * 1000
  },
  
  ui: {
    theme: 'light',
    animationsEnabled: true,
    notificationDuration: appConfig.notifications ? appConfig.notifications.duration : 5000,
    dateFormat: 'DD/MM/YYYY',
    timeFormat: 'HH:mm',
    defaultPageSize: 10
  },
  
  features: {
    offline: false,
    debugging: appConfig.isDevelopment(),
    securityAudit: true
  },

  environment: {
    isDevelopment: appConfig.isDevelopment(),
    isProduction: appConfig.isProduction()
  },
  
  // Función requerida por el módulo sessionEvents
  shouldLogEventsInDev: appConfig.shouldLogEventsInDev,
  
  // Métodos auxiliares
  isDevelopment: function() {
    return appConfig.isDevelopment();
  },
  
  isProduction: function() {
    return appConfig.isProduction();
  },
  
  isDebugEnabled: function() {
    return this.features.debugging;
  },
  
  // Get config value by key path (e.g. "api.baseUrl")
  get: function(path) {
    if (!path) return undefined;
    
    const keys = path.split('.');
    let value = this;
    
    for (const key of keys) {
      if (value === undefined || value === null) return undefined;
      value = value[key];
    }
    
    return value;
  }
};

// Exponer appConfig también en el espacio global para compatibilidad con scripts que no usen módulos
if (typeof window !== 'undefined') {
  window.OFICRI = window.OFICRI || {};
  window.OFICRI.config = config;
  window.OFICRI.appConfig = appConfig;
}

export default config; 