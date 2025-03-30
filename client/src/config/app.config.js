/**
 * OFICRI System Configuration
 * Central configuration for the application
 */

// Create namespace if it doesn't exist
window.OFICRI = window.OFICRI || {};

// Flag to prevent multiple initializations
window.OFICRI.initialized = window.OFICRI.initialized || false;

// Config object
const config = {
  // API Configuration
  api: {
    baseUrl: 'http://localhost:3000/api', // Default API URL
    timeout: 15000, // Request timeout in milliseconds
    retries: 1, // Number of retries for failed requests
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
  
  // Authentication Configuration
  auth: {
    tokenKey: 'oficri_token',
    refreshTokenKey: 'oficri_refresh_token',
    userKey: 'oficri_user',
    expiryKey: 'oficri_token_expiry',
    inactivityTimeout: 30 * 60 * 1000 // 30 minutes in milliseconds
  },
  
  // UI Configuration
  ui: {
    theme: 'light',
    animationsEnabled: true,
    notificationDuration: 5000, // milliseconds
    dateFormat: 'DD/MM/YYYY',
    timeFormat: 'HH:mm',
    defaultPageSize: 10
  },
  
  // Feature Flags
  features: {
    offline: false,
    debugging: true,
    securityAudit: true
  },
  
  // Environment detection
  environment: {
    isDevelopment: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1',
    isProduction: !window.location.hostname.includes('localhost') && !window.location.hostname.includes('127.0.0.1')
  },
  
  // Helper methods
  isDevelopment: function() {
    return this.environment.isDevelopment;
  },
  
  isProduction: function() {
    return this.environment.isProduction;
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

// Apply environment-specific overrides (only once)
if (!window.OFICRI.configInitialized && config.environment.isDevelopment) {
  // Development settings
  config.api.baseUrl = 'http://localhost:3000/api';
  
  // Log only once
  if (!window.OFICRI.configLogged) {
    console.log('[CONFIG] Using development API URL:', config.api.baseUrl);
    window.OFICRI.configLogged = true;
  }
  
  config.features.debugging = true;
}

// Add runtime diagnostics when debugging is enabled (only once)
if (!window.OFICRI.configInitialized && config.features.debugging && !window.OFICRI.configLogged) {
  console.log('[CONFIG] Runtime configuration initialized:', {
    environment: config.environment.isDevelopment ? 'development' : 'production',
    apiBaseUrl: config.api.baseUrl,
    currentOrigin: window.location.origin
  });
  
  // Mark as logged
  window.OFICRI.configLogged = true;
}

// Mark config as initialized
window.OFICRI.configInitialized = true;

// Freeze config to prevent modifications
Object.freeze(config);

// Para compatibilidad con ES modules y UMD
// El build process convertirá esto a formato compatible con navegadores
export { config };

// Para compatibilidad con código que usa window.OFICRI.config
window.OFICRI.config = config; 