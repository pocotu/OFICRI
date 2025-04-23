/**
 * Servicio de validación
 * Proporciona funcionalidades para validación de datos
 * Cumplimiento con ISO/IEC 27001
 */

/**
 * Validar datos de formulario según un conjunto de reglas
 * @param {Object} data - Datos a validar
 * @param {Object} rules - Reglas de validación
 * @returns {Object} Resultado de validación { isValid, errors }
 */
export const validateForm = (data, rules) => {
  const errors = {};
  let isValid = true;

  // Validar cada campo según sus reglas
  Object.keys(rules).forEach(field => {
    const fieldRules = rules[field];
    const value = data[field];

    // Si es requerido y no tiene valor
    if (fieldRules.required && (value === undefined || value === null || value === '')) {
      errors[field] = errors[field] || [];
      errors[field].push('Este campo es obligatorio');
      isValid = false;
    }

    // Si tiene valor, validar según reglas adicionales
    if (value !== undefined && value !== null && value !== '') {
      // Validar longitud mínima
      if (fieldRules.minLength && String(value).length < fieldRules.minLength) {
        errors[field] = errors[field] || [];
        errors[field].push(`Debe tener al menos ${fieldRules.minLength} caracteres`);
        isValid = false;
      }

      // Validar longitud máxima
      if (fieldRules.maxLength && String(value).length > fieldRules.maxLength) {
        errors[field] = errors[field] || [];
        errors[field].push(`No debe exceder ${fieldRules.maxLength} caracteres`);
        isValid = false;
      }

      // Validar patrón (expresión regular)
      if (fieldRules.pattern && !fieldRules.pattern.test(String(value))) {
        errors[field] = errors[field] || [];
        errors[field].push('Formato inválido');
        isValid = false;
      }

      // Validar valores enumerados
      if (fieldRules.enum && !fieldRules.enum.includes(value)) {
        errors[field] = errors[field] || [];
        errors[field].push(`Debe ser uno de: ${fieldRules.enum.join(', ')}`);
        isValid = false;
      }

      // Validar rango numérico
      if (typeof value === 'number') {
        if (fieldRules.min !== undefined && value < fieldRules.min) {
          errors[field] = errors[field] || [];
          errors[field].push(`El valor mínimo es ${fieldRules.min}`);
          isValid = false;
        }
        if (fieldRules.max !== undefined && value > fieldRules.max) {
          errors[field] = errors[field] || [];
          errors[field].push(`El valor máximo es ${fieldRules.max}`);
          isValid = false;
        }
      }

      // Validar función personalizada
      if (fieldRules.custom && typeof fieldRules.custom === 'function') {
        const customResult = fieldRules.custom(value, data);
        if (customResult !== true) {
          errors[field] = errors[field] || [];
          errors[field].push(customResult || 'Validación personalizada fallida');
          isValid = false;
        }
      }
    }
  });

  return { isValid, errors };
};

/**
 * Validar formato de correo electrónico
 * @param {string} email - Correo a validar
 * @returns {boolean} true si es válido
 */
export const isValidEmail = (email) => {
  // Patrón de validación para emails según RFC 5322
  const pattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return pattern.test(String(email).toLowerCase());
};

/**
 * Validar código CIP (Código de Identificación Policial)
 * @param {string} cip - Código CIP a validar
 * @returns {boolean} true si es válido
 */
export const isValidCIP = (cip) => {
  // CIP debe ser numérico y tener entre 7 y 10 dígitos
  const pattern = /^[0-9]{7,10}$/;
  return pattern.test(String(cip));
};

/**
 * Validar contraseña según políticas de seguridad ISO 27001
 * @param {string} password - Contraseña a validar
 * @returns {Object} Resultado de validación { isValid, errors }
 */
export const validatePassword = (password) => {
  const errors = [];
  
  // Mínimo 8 caracteres
  if (password.length < 8) {
    errors.push('La contraseña debe tener al menos 8 caracteres');
  }
  
  // Debe contener al menos una letra mayúscula
  if (!/[A-Z]/.test(password)) {
    errors.push('Debe incluir al menos una letra mayúscula');
  }
  
  // Debe contener al menos una letra minúscula
  if (!/[a-z]/.test(password)) {
    errors.push('Debe incluir al menos una letra minúscula');
  }
  
  // Debe contener al menos un número
  if (!/[0-9]/.test(password)) {
    errors.push('Debe incluir al menos un número');
  }
  
  // Debe contener al menos un caracter especial
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Debe incluir al menos un caracter especial');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Sanitizar texto para prevenir inyección de código
 * @param {string} text - Texto a sanitizar
 * @returns {string} Texto sanitizado
 */
export const sanitizeText = (text) => {
  if (!text) return '';
  
  // Convertir a string si es otro tipo de dato
  const str = String(text);
  
  // Reemplazar caracteres especiales HTML
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};

export default {
  validateForm,
  isValidEmail,
  isValidCIP,
  validatePassword,
  sanitizeText
}; 