/**
 * OFICRI Validation Utilities
 * Form field validation functions
 */

// Create namespace if it doesn't exist
window.OFICRI = window.OFICRI || {};

// Validators Module
OFICRI.validators = (function() {
  'use strict';
  
  // Public API
  return {
    /**
     * Validates that a field is not empty
     * @param {string} value - Field value
     * @returns {boolean} - Validation result
     */
    required: function(value) {
      if (value === undefined || value === null) {
        return false;
      }
      
      if (typeof value === 'string') {
        return value.trim().length > 0;
      }
      
      return true;
    },
    
    /**
     * Validates a field has minimum length
     * @param {string} value - Field value
     * @param {number} length - Required minimum length
     * @returns {boolean} - Validation result
     */
    minLength: function(value, length) {
      if (!value || typeof value !== 'string') {
        return false;
      }
      
      return value.length >= length;
    },
    
    /**
     * Validates that a field doesn't exceed maximum length
     * @param {string} value - Field value
     * @param {number} length - Maximum allowed length
     * @returns {boolean} - Validation result
     */
    maxLength: function(value, length) {
      if (!value || typeof value !== 'string') {
        return true; // Empty values pass max length validation
      }
      
      return value.length <= length;
    },
    
    /**
     * Validates email format
     * @param {string} value - Email value
     * @returns {boolean} - Validation result
     */
    email: function(value) {
      if (!value || typeof value !== 'string') {
        return false;
      }
      
      // Basic email regex pattern
      const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return pattern.test(value);
    },
    
    /**
     * Validates password strength
     * @param {string} value - Password value
     * @returns {Object} - Validation result with details
     */
    password: function(value) {
      if (!value || typeof value !== 'string') {
        return { valid: false, message: 'La contraseña es requerida' };
      }
      
      // Password rules
      const minLength = 8;
      const hasUppercase = /[A-Z]/.test(value);
      const hasLowercase = /[a-z]/.test(value);
      const hasDigit = /\d/.test(value);
      const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(value);
      
      // Calculate strength score (0-4)
      let strength = 0;
      if (value.length >= minLength) strength++;
      if (hasUppercase && hasLowercase) strength++;
      if (hasDigit) strength++;
      if (hasSpecial) strength++;
      
      // Set validation message based on strength
      let message = '';
      let valid = false;
      
      switch (strength) {
        case 0:
          message = 'La contraseña es muy débil';
          break;
        case 1:
          message = 'La contraseña es débil';
          break;
        case 2:
          message = 'La contraseña es moderada';
          valid = true;
          break;
        case 3:
          message = 'La contraseña es fuerte';
          valid = true;
          break;
        case 4:
          message = 'La contraseña es muy fuerte';
          valid = true;
          break;
      }
      
      // Add detailed requirements if password is weak
      if (strength < 2) {
        message += '. Debe contener al menos 8 caracteres, mayúsculas y minúsculas, números y caracteres especiales.';
      }
      
      return {
        valid,
        message,
        strength,
        details: {
          minLength: value.length >= minLength,
          hasUppercase,
          hasLowercase,
          hasDigit,
          hasSpecial
        }
      };
    },
    
    /**
     * Validates CIP (Código de Identificación Policial) format
     * @param {string} value - CIP value
     * @returns {boolean} - Validation result
     */
    codigoCIP: function(value) {
      if (!value || typeof value !== 'string') {
        return false;
      }
      
      // CIP format: numeric code of 6-8 digits
      return /^\d{6,8}$/.test(value);
    },
    
    /**
     * Validates date format
     * @param {string} value - Date string (YYYY-MM-DD)
     * @returns {boolean} - Validation result
     */
    date: function(value) {
      if (!value || typeof value !== 'string') {
        return false;
      }
      
      // Check format YYYY-MM-DD
      if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return false;
      }
      
      // Check valid date
      const date = new Date(value);
      return !isNaN(date.getTime());
    },
    
    /**
     * Validates numeric value
     * @param {string} value - Numeric value
     * @returns {boolean} - Validation result
     */
    numeric: function(value) {
      if (value === undefined || value === null || value === '') {
        return false;
      }
      
      return !isNaN(Number(value));
    },
    
    /**
     * Validates integer value
     * @param {string} value - Integer value
     * @returns {boolean} - Validation result
     */
    integer: function(value) {
      if (value === undefined || value === null || value === '') {
        return false;
      }
      
      const number = Number(value);
      return !isNaN(number) && Number.isInteger(number);
    },
    
    /**
     * Validates alpha value (letters only)
     * @param {string} value - Alpha value
     * @returns {boolean} - Validation result
     */
    alpha: function(value) {
      if (!value || typeof value !== 'string') {
        return false;
      }
      
      return /^[a-zA-Z]+$/.test(value);
    },
    
    /**
     * Validates alphanumeric value
     * @param {string} value - Alphanumeric value
     * @returns {boolean} - Validation result
     */
    alphanumeric: function(value) {
      if (!value || typeof value !== 'string') {
        return false;
      }
      
      return /^[a-zA-Z0-9]+$/.test(value);
    }
  };
})(); 