/**
 * OFICRI System Configuration
 * Central configuration for the application
 */

const config = {
  // API Configuration
  api: {
    baseUrl: 'http://localhost:3001/api', // Default API URL
    timeout: 15000, // Request timeout in milliseconds
    retries: 1 // Number of retries for failed requests
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
  }
};

// Apply environment-specific overrides
if (config.environment.isDevelopment) {
  // Development settings
  config.api.baseUrl = 'http://localhost:3001/api';
  config.features.debugging = true;
}

// Freeze config to prevent modifications
Object.freeze(config); 