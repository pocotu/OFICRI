/**
 * OFICRI API Client
 * Handles API requests with authentication, retries, and error handling
 */

// Create namespace if it doesn't exist
window.OFICRI = window.OFICRI || {};

// API Client Module
OFICRI.apiClient = (function() {
  'use strict';
  
  // Private variables
  let _requestQueue = [];
  let _isRefreshing = false;
  
  /**
   * Performs an HTTP request to the API
   * @param {Object} options - Request options
   * @returns {Promise} - Promise resolving to the response data
   */
  const _request = async function(options) {
    const { method = 'GET', endpoint, data = null, headers = {}, params = {}, retries = config.api.retries } = options;
    
    console.log('[DEBUG-API] Starting API request:', { method, endpoint, params, skipAuth: options.skipAuth });
    
    // Build URL with query parameters
    let url = `${config.api.baseUrl}${endpoint}`;
    if (params && Object.keys(params).length > 0) {
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value);
        }
      });
      url += `?${queryParams.toString()}`;
    }
    
    console.log('[DEBUG-API] Request URL:', url);
    
    // Build request headers
    const requestHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...headers
    };
    
    // Add authentication token if available
    const token = OFICRI.authService.getToken();
    if (token) {
      requestHeaders['Authorization'] = `Bearer ${token}`;
      console.log('[DEBUG-API] Added auth token to request (token length):', token.length);
    } else {
      console.log('[DEBUG-API] No auth token available for request');
    }
    
    console.log('[DEBUG-API] Request headers:', requestHeaders);
    
    // Request options
    const requestOptions = {
      method,
      headers: requestHeaders,
      credentials: 'include',
      timeout: config.api.timeout
    };
    
    // Add request body for non-GET requests
    if (method !== 'GET' && data) {
      requestOptions.body = JSON.stringify(data);
      console.log('[DEBUG-API] Request body:', method !== 'POST' || !endpoint.includes('login') ? JSON.stringify(data) : 'Password hidden for security');
    }
    
    try {
      console.log('[DEBUG-API] Sending fetch request...');
      
      // Perform fetch request
      const response = await fetch(url, requestOptions);
      
      console.log('[DEBUG-API] Response received - Status:', response.status, response.statusText);
      console.log('[DEBUG-API] Response headers:', [...response.headers.entries()]);
      
      // Clone response for potential retries
      const clonedResponse = response.clone();
      
      // Handle 401 Unauthorized (token expired)
      if (response.status === 401 && !options.skipAuth) {
        console.log('[DEBUG-API] 401 Unauthorized - Attempting token refresh');
        
        // Try token refresh
        const refreshed = await _handleTokenRefresh();
        if (refreshed) {
          console.log('[DEBUG-API] Token refresh successful - Retrying request');
          
          // Retry request with new token
          return _request({ ...options, skipAuth: true });
        } else {
          console.log('[DEBUG-API] Token refresh failed - Logging out user');
          
          // Refresh failed, redirect to login
          OFICRI.authService.logout();
          window.location.href = '/';
          throw new Error('Session expired. Please login again.');
        }
      }
      
      // Parse response body
      let responseData;
      const contentType = response.headers.get('content-type');
      
      console.log('[DEBUG-API] Response content type:', contentType);
      
      if (contentType && contentType.includes('application/json')) {
        console.log('[DEBUG-API] Parsing JSON response');
        responseData = await response.json();
      } else {
        console.log('[DEBUG-API] Parsing text response');
        responseData = await response.text();
      }
      
      // Handle unsuccessful responses
      if (!response.ok) {
        console.log('[DEBUG-API] Response not OK:', response.status, responseData);
        
        // Retry on server errors if retries remaining
        if (response.status >= 500 && retries > 0) {
          console.log('[DEBUG-API] Server error - Retrying request');
          
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, 1000));
          return _request({ ...options, retries: retries - 1 });
        }
        
        // Format error for client
        const error = new Error(responseData.error?.message || 'Request failed');
        error.status = response.status;
        error.data = responseData;
        throw error;
      }
      
      console.log('[DEBUG-API] Request successful');
      return responseData;
    } catch (error) {
      console.error('[DEBUG-API] Request error:', error.name, error.message);
      
      // Handle network errors with retries
      if (error.name === 'AbortError' || error.name === 'TypeError') {
        if (retries > 0) {
          console.log('[DEBUG-API] Network error - Retrying request');
          
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, 1000));
          return _request({ ...options, retries: retries - 1 });
        }
      }
      
      // Log error if debugging enabled
      if (config.features.debugging) {
        console.error('[DEBUG-API] API Request Error Details:', {
          errorName: error.name,
          errorMessage: error.message,
          errorStack: error.stack
        });
      }
      
      // Rethrow for handler
      throw error;
    }
  };
  
  /**
   * Handles token refresh when a request receives 401
   * @returns {Promise<boolean>} - Success of refresh operation
   */
  const _handleTokenRefresh = async function() {
    // If already refreshing, wait for completion
    if (_isRefreshing) {
      return new Promise(resolve => {
        _requestQueue.push(resolve);
      });
    }
    
    _isRefreshing = true;
    
    try {
      const refreshToken = OFICRI.authService.getRefreshToken();
      
      if (!refreshToken) {
        return false;
      }
      
      // Call auth service to refresh token
      const success = await OFICRI.authService.refreshToken();
      
      // Process pending requests
      _requestQueue.forEach(resolve => resolve(success));
      _requestQueue = [];
      
      return success;
    } catch (error) {
      return false;
    } finally {
      _isRefreshing = false;
    }
  };
  
  // Public API
  return {
    /**
     * Performs a GET request
     * @param {string} endpoint - API endpoint
     * @param {Object} params - Query parameters
     * @param {Object} options - Additional options
     * @returns {Promise} - Response data
     */
    get: function(endpoint, params = {}, options = {}) {
      return _request({
        method: 'GET',
        endpoint,
        params,
        ...options
      });
    },
    
    /**
     * Performs a POST request
     * @param {string} endpoint - API endpoint
     * @param {Object} data - Request body data
     * @param {Object} options - Additional options
     * @returns {Promise} - Response data
     */
    post: function(endpoint, data = {}, options = {}) {
      return _request({
        method: 'POST',
        endpoint,
        data,
        ...options
      });
    },
    
    /**
     * Performs a PUT request
     * @param {string} endpoint - API endpoint
     * @param {Object} data - Request body data
     * @param {Object} options - Additional options
     * @returns {Promise} - Response data
     */
    put: function(endpoint, data = {}, options = {}) {
      return _request({
        method: 'PUT',
        endpoint,
        data,
        ...options
      });
    },
    
    /**
     * Performs a PATCH request
     * @param {string} endpoint - API endpoint
     * @param {Object} data - Request body data
     * @param {Object} options - Additional options
     * @returns {Promise} - Response data
     */
    patch: function(endpoint, data = {}, options = {}) {
      return _request({
        method: 'PATCH',
        endpoint,
        data,
        ...options
      });
    },
    
    /**
     * Performs a DELETE request
     * @param {string} endpoint - API endpoint
     * @param {Object} params - Query parameters
     * @param {Object} options - Additional options
     * @returns {Promise} - Response data
     */
    delete: function(endpoint, params = {}, options = {}) {
      return _request({
        method: 'DELETE',
        endpoint,
        params,
        ...options
      });
    }
  };
})(); 