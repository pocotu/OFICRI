/**
 * OFICRI Main Application Module
 * Entry point for the application
 */

// Create namespace if it doesn't exist
window.OFICRI = window.OFICRI || {};

// Main App Module
OFICRI.app = (function() {
  'use strict';
  
  /**
   * Initializes the application
   */
  const _init = function() {
    console.log('[DEBUG-APP] Starting application initialization');
    
    // Initialize core services
    _initServices();
    
    // Apply theme from user preferences
    _applyTheme();
    
    // Set up global event listeners
    _setupGlobalEvents();
    
    // Log initialization if debugging enabled
    if (config.features.debugging) {
      console.log('[DEBUG-APP] OFICRI App initialized:', {
        environment: config.environment.isDevelopment ? 'development' : 'production',
        apiUrl: config.api.baseUrl,
        features: config.features,
        userAgent: navigator.userAgent,
        corsEnabled: typeof config.corsOptions !== 'undefined'
      });
    }
  };
  
  /**
   * Initializes core services
   */
  const _initServices = function() {
    console.log('[DEBUG-APP] Initializing core services');
    
    // Setup security protections
    _setupSecurityProtections();
    
    // Setup error handling
    _setupErrorHandling();
    
    console.log('[DEBUG-APP] Core services initialized');
  };
  
  /**
   * Applies theme based on user preferences
   */
  const _applyTheme = function() {
    const theme = localStorage.getItem('oficri_theme') || config.ui.theme || 'light';
    document.documentElement.setAttribute('data-theme', theme);
    
    if (theme === 'dark') {
      document.body.classList.add('dark-theme');
    } else {
      document.body.classList.remove('dark-theme');
    }
  };
  
  /**
   * Sets up global event listeners
   */
  const _setupGlobalEvents = function() {
    // Listen for auth events
    window.addEventListener('storage', function(event) {
      // Handle storage events for auth changes
      if (event.key === config.auth.tokenKey && !event.newValue) {
        // Token was removed in another tab
        window.location.href = '/';
      }
    });
    
    // Add general error handling for unhandled errors
    window.addEventListener('error', function(event) {
      _handleGlobalError(event.error);
    });
    
    // Add promise error handling
    window.addEventListener('unhandledrejection', function(event) {
      _handleGlobalError(event.reason);
    });
  };
  
  /**
   * Sets up security protections
   */
  const _setupSecurityProtections = function() {
    console.log('[DEBUG-APP] Setting up security protections');
    
    // Check existing CSP meta tags
    let existingCSP = null;
    const metaTags = document.getElementsByTagName('meta');
    for (let i = 0; i < metaTags.length; i++) {
      if (metaTags[i].getAttribute('http-equiv') === 'Content-Security-Policy') {
        existingCSP = metaTags[i].getAttribute('content');
        console.log('[DEBUG-APP] Found existing CSP meta tag:', existingCSP);
        break;
      }
    }
    
    // Only add CSP if it doesn't already exist
    if (!existingCSP) {
      console.log('[DEBUG-APP] No existing CSP meta tag found, adding new one');
      
      const cspContent = "default-src 'self'; connect-src 'self' http://localhost:3000 http://localhost:3001; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com; style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com; img-src 'self' data: https:; font-src 'self' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com;";
      
      const meta = document.createElement('meta');
      meta.setAttribute('http-equiv', 'Content-Security-Policy');
      meta.setAttribute('content', cspContent);
      document.head.appendChild(meta);
      
      console.log('[DEBUG-APP] Added CSP meta tag with content:', cspContent);
    } else {
      console.log('[DEBUG-APP] Using existing CSP meta tag');
    }
  };
  
  /**
   * Sets up global error handling
   */
  const _setupErrorHandling = function() {
    // Overriding console.error if debugging is disabled
    if (!config.features.debugging) {
      const originalConsoleError = console.error;
      console.error = function(...args) {
        // Log to analytics or server in production
        if (config.environment.isProduction) {
          // Here we could send error to an error tracking service
        }
        
        // Call original console.error with all arguments
        originalConsoleError.apply(console, args);
      };
    }
  };
  
  /**
   * Handles global uncaught errors
   * @param {Error} error - Uncaught error
   */
  const _handleGlobalError = function(error) {
    if (!error) return;
    
    console.error('Unhandled error:', error);
    
    // In production, show a user-friendly message
    if (config.environment.isProduction) {
      OFICRI.notifications.error(
        'Ha ocurrido un error inesperado. Por favor, refresque la página o contacte a soporte.',
        { title: 'Error' }
      );
    }
  };
  
  // Public API
  return {
    init: _init,
    getVersion: function() {
      return '1.0.0';
    }
  };
})();

// Initialize the application when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  OFICRI.app.init();
}); 