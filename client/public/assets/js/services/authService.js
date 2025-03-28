/**
 * OFICRI Authentication Service
 * Handles user authentication and session management
 */

// Create namespace if it doesn't exist
window.OFICRI = window.OFICRI || {};

// Auth Service Module
OFICRI.authService = (function() {
  'use strict';
  
  // Private variables
  let _inactivityTimer = null;
  
  /**
   * Starts inactivity tracking for automatic logout
   */
  const _startInactivityTimer = function() {
    // Clear any existing timer
    if (_inactivityTimer) {
      clearTimeout(_inactivityTimer);
    }
    
    // Set new timer
    _inactivityTimer = setTimeout(() => {
      if (isAuthenticated()) {
        logout({ reason: 'inactivity' });
      }
    }, config.auth.inactivityTimeout);
    
    // Reset timer on user activity
    const resetTimer = () => {
      if (isAuthenticated()) {
        _startInactivityTimer();
      }
    };
    
    // Add event listeners for user activity
    ['mousedown', 'keypress', 'scroll', 'touchstart'].forEach(event => {
      document.addEventListener(event, resetTimer, { passive: true });
    });
  };
  
  /**
   * Stores authentication data in local storage
   * @param {Object} authData - Authentication data
   */
  const _setAuthData = function(authData) {
    const { token, refreshToken, user } = authData;
    
    // Store token with expiration
    localStorage.setItem(config.auth.tokenKey, token);
    localStorage.setItem(config.auth.refreshTokenKey, refreshToken);
    
    // Store user data
    if (user) {
      localStorage.setItem(config.auth.userKey, JSON.stringify(user));
    }
    
    // Parse token to get expiry date
    try {
      const tokenData = JSON.parse(atob(token.split('.')[1]));
      if (tokenData.exp) {
        localStorage.setItem(config.auth.expiryKey, tokenData.exp * 1000);
      }
    } catch (e) {
      console.error('Error parsing token:', e);
    }
    
    // Start inactivity tracking
    _startInactivityTimer();
  };
  
  /**
   * Clears authentication data from local storage
   */
  const _clearAuthData = function() {
    localStorage.removeItem(config.auth.tokenKey);
    localStorage.removeItem(config.auth.refreshTokenKey);
    localStorage.removeItem(config.auth.userKey);
    localStorage.removeItem(config.auth.expiryKey);
    
    // Clear inactivity timer
    if (_inactivityTimer) {
      clearTimeout(_inactivityTimer);
      _inactivityTimer = null;
    }
  };
  
  // Public API
  return {
    /**
     * Attempts to login a user
     * @param {Object} credentials - User credentials
     * @returns {Promise<Object>} - User data if successful
     */
    login: async function(credentials) {
      try {
        // Call login API endpoint (temporarily use direct fetch since apiClient depends on authService)
        const response = await fetch(`${config.api.baseUrl}/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(credentials)
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error?.message || 'Login failed');
        }
        
        const authData = await response.json();
        
        // Validate and store auth data
        if (!authData.token || !authData.user) {
          throw new Error('Invalid response from server');
        }
        
        _setAuthData(authData);
        
        // Log successful login if security auditing enabled
        if (config.features.securityAudit) {
          console.info('User logged in:', authData.user.codigoCIP);
        }
        
        return authData.user;
      } catch (error) {
        console.error('Login error:', error);
        throw error;
      }
    },
    
    /**
     * Logs out the current user
     * @param {Object} options - Logout options
     * @returns {Promise<boolean>} - Success indicator
     */
    logout: async function(options = {}) {
      try {
        const token = this.getToken();
        
        // If user is logged in, call logout API
        if (token && !options.skipRequest) {
          try {
            await OFICRI.apiClient.post('/auth/logout');
          } catch (error) {
            console.warn('Error during logout request:', error);
          }
        }
        
        // Always clear auth data locally
        _clearAuthData();
        
        // Redirect to login page if specified
        if (options.redirect !== false) {
          window.location.href = '/';
        }
        
        return true;
      } catch (error) {
        console.error('Logout error:', error);
        return false;
      }
    },
    
    /**
     * Attempts to refresh the authentication token
     * @returns {Promise<boolean>} - Success indicator
     */
    refreshToken: async function() {
      try {
        const refreshToken = this.getRefreshToken();
        
        if (!refreshToken) {
          return false;
        }
        
        // Call refresh token API (using direct fetch)
        const response = await fetch(`${config.api.baseUrl}/auth/refresh-token`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ refreshToken })
        });
        
        if (!response.ok) {
          return false;
        }
        
        const authData = await response.json();
        
        // Validate and store new tokens
        if (!authData.token || !authData.refreshToken) {
          return false;
        }
        
        _setAuthData(authData);
        return true;
      } catch (error) {
        console.error('Token refresh error:', error);
        return false;
      }
    },
    
    /**
     * Gets the current authentication token
     * @returns {string|null} - JWT token or null if not authenticated
     */
    getToken: function() {
      return localStorage.getItem(config.auth.tokenKey);
    },
    
    /**
     * Gets the current refresh token
     * @returns {string|null} - Refresh token or null if not available
     */
    getRefreshToken: function() {
      return localStorage.getItem(config.auth.refreshTokenKey);
    },
    
    /**
     * Gets the currently authenticated user
     * @returns {Object|null} - User object or null if not authenticated
     */
    getUser: function() {
      const userJson = localStorage.getItem(config.auth.userKey);
      return userJson ? JSON.parse(userJson) : null;
    },
    
    /**
     * Checks if user is authenticated
     * @returns {boolean} - Authentication status
     */
    isAuthenticated: function() {
      const token = this.getToken();
      const expiry = localStorage.getItem(config.auth.expiryKey);
      
      if (!token || !expiry) {
        return false;
      }
      
      // Check if token is expired
      const now = Date.now();
      return now < parseInt(expiry, 10);
    },
    
    /**
     * Checks if user has required permission
     * @param {number} permission - Permission bit to check
     * @returns {boolean} - Whether user has permission
     */
    hasPermission: function(permission) {
      const user = this.getUser();
      
      if (!user || !user.role) {
        return false;
      }
      
      // Admin role has all permissions
      if (user.role === 'admin') {
        return true;
      }
      
      // Check specific permission bit
      if (user.permissions !== undefined) {
        return (user.permissions & permission) === permission;
      }
      
      return false;
    }
  };
})(); 