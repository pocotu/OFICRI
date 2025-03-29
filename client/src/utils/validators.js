/**
 * OFICRI Validators Module
 * Proporciona funciones de validación para diferentes tipos de datos
 * Cumple con ISO/IEC 27001 para validación de entradas
 */

// Namespace para compatibilidad
window.OFICRI = window.OFICRI || {};

/**
 * Validación de entrada de datos
 * @param {*} value - Valor a validar
 * @param {string} type - Tipo de validación
 * @param {Object} options - Opciones adicionales de validación
 * @returns {boolean} True si la validación es exitosa
 */
export const validateInput = function(value, type, options = {}) {
  // Si el valor es null o undefined, devolver false
  if (value === null || value === undefined) {
    return false;
  }
  
  // Opciones por defecto
  const defaults = {
    minLength: 0,
    maxLength: Number.MAX_SAFE_INTEGER,
    required: true,
    allowEmpty: false
  };
  
  // Combinar opciones
  const config = { ...defaults, ...options };
  
  // Si el valor es string, validar longitud
  if (typeof value === 'string') {
    // Convertir a string si no lo es
    const strValue = String(value);
    
    // Si es requerido y está vacío, devolver false
    if (config.required && !config.allowEmpty && strValue.trim() === '') {
      return false;
    }
    
    // Validar longitud
    if (strValue.length < config.minLength || strValue.length > config.maxLength) {
      return false;
    }
  }
  
  // Validar según tipo
  switch (type) {
    case 'string':
      return typeof value === 'string';
      
    case 'email':
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
      
    case 'username':
      // Alfanumérico, punto, guión y guión bajo
      return /^[a-zA-Z0-9._-]{3,50}$/.test(value);
      
    case 'codigoCIP':
      // Código CIP formato: NNNNN (5 dígitos)
      return /^\d{5}$/.test(value);
      
    case 'password':
      // Mínimo 8 caracteres, al menos una letra y un número
      return typeof value === 'string' && 
        value.length >= 8 && 
        /[A-Za-z]/.test(value) && 
        /[0-9]/.test(value);
      
    case 'newPassword':
      // Requisitos más estrictos para nuevas contraseñas
      return typeof value === 'string' && 
        value.length >= 8 && 
        /[A-Z]/.test(value) && // Mayúscula
        /[a-z]/.test(value) && // Minúscula
        /[0-9]/.test(value) && // Número
        /[^A-Za-z0-9]/.test(value); // Carácter especial
      
    case 'date':
      // Verificar si es Date válido
      if (value instanceof Date) {
        return !isNaN(value.getTime());
      }
      // Intentar convertir a Date
      else if (typeof value === 'string') {
        const date = new Date(value);
        return !isNaN(date.getTime());
      }
      return false;
      
    case 'number':
      // Verificar si es número
      if (typeof value === 'number') {
        return !isNaN(value);
      }
      // Intentar convertir a número
      else if (typeof value === 'string') {
        return !isNaN(Number(value));
      }
      return false;
      
    case 'integer':
      // Verificar si es entero
      if (typeof value === 'number') {
        return Number.isInteger(value);
      }
      // Intentar convertir a entero
      else if (typeof value === 'string') {
        const num = Number(value);
        return !isNaN(num) && Number.isInteger(num);
      }
      return false;
      
    case 'boolean':
      return typeof value === 'boolean' || value === 'true' || value === 'false';
      
    case 'url':
      try {
        new URL(value);
        return true;
      } catch (e) {
        return false;
      }
      
    case 'documentNumber':
      // Números de documentos: alfanumérico con guiones y puntos
      return /^[a-zA-Z0-9.-]{1,30}$/.test(value);
      
    case 'dni':
      // DNI peruano: 8 dígitos
      return /^\d{8}$/.test(value);
      
    default:
      // Para tipos no definidos, pasar la validación
      return true;
  }
};

/**
 * Sanitiza texto para prevenir XSS
 * @param {string} text - Texto a sanitizar
 * @returns {string} Texto sanitizado
 */
export const sanitizeText = function(text) {
  if (typeof text !== 'string') {
    return '';
  }
  
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

/**
 * Valida y sanitiza un objeto de datos
 * @param {Object} data - Objeto con datos a validar
 * @param {Object} schema - Esquema de validación
 * @returns {Object} Objeto con errores y datos sanitizados
 */
export const validateObject = function(data, schema) {
  const result = {
    isValid: true,
    sanitized: {},
    errors: {}
  };
  
  // Recorrer propiedades del esquema
  Object.keys(schema).forEach(field => {
    const fieldSchema = schema[field];
    const value = data[field];
    
    // Validar campo
    const isValid = validateInput(value, fieldSchema.type, fieldSchema);
    
    if (!isValid) {
      result.isValid = false;
      result.errors[field] = fieldSchema.errorMessage || `El campo ${field} no es válido`;
    }
    
    // Sanitizar valor si es string
    if (typeof value === 'string' && fieldSchema.sanitize !== false) {
      result.sanitized[field] = sanitizeText(value);
    } else {
      result.sanitized[field] = value;
    }
  });
  
  return result;
};

/**
 * Valida un formulario HTML
 * @param {HTMLFormElement} form - Formulario a validar
 * @param {Object} schema - Esquema de validación
 * @param {Object} options - Opciones adicionales
 * @returns {Object} Resultado de validación
 */
export const validateForm = function(form, schema, options = {}) {
  if (!(form instanceof HTMLFormElement)) {
    throw new Error('El formulario debe ser un elemento HTMLFormElement');
  }
  
  // Opciones por defecto
  const defaults = {
    showErrors: true,     // Mostrar errores en el formulario
    errorClass: 'error',  // Clase para elementos con error
    errorElement: 'span'  // Etiqueta para mensajes de error
  };
  
  // Combinar opciones
  const config = { ...defaults, ...options };
  
  // Crear objeto con datos del formulario
  const formData = {};
  const formElements = form.elements;
  
  for (let i = 0; i < formElements.length; i++) {
    const element = formElements[i];
    
    // Ignorar elementos sin nombre o botones
    if (!element.name || element.type === 'button' || element.type === 'submit') {
      continue;
    }
    
    // Obtener valor según tipo
    if (element.type === 'checkbox') {
      formData[element.name] = element.checked;
    } else if (element.type === 'radio') {
      if (element.checked) {
        formData[element.name] = element.value;
      }
    } else {
      formData[element.name] = element.value;
    }
  }
  
  // Validar datos
  const result = validateObject(formData, schema);
  
  // Mostrar errores si se especifica
  if (config.showErrors) {
    // Limpiar errores existentes
    const errorElements = form.querySelectorAll(`.${config.errorClass}`);
    errorElements.forEach(el => el.remove());
    
    // Quitar clase de error a todos los elementos
    Array.from(formElements).forEach(el => {
      if (el.classList && el.name) {
        el.classList.remove(config.errorClass);
      }
    });
    
    // Agregar mensajes de error
    Object.keys(result.errors).forEach(field => {
      const fieldElement = form.elements[field];
      
      if (fieldElement) {
        // Agregar clase de error
        fieldElement.classList.add(config.errorClass);
        
        // Crear elemento de error
        const errorElement = document.createElement(config.errorElement);
        errorElement.className = config.errorClass;
        errorElement.textContent = result.errors[field];
        
        // Insertar después del elemento
        if (fieldElement.parentNode) {
          fieldElement.parentNode.insertBefore(errorElement, fieldElement.nextSibling);
        }
      }
    });
  }
  
  return result;
};

// Exponer módulo para compatibilidad con navegadores
window.OFICRI.validators = {
  validateInput,
  sanitizeText,
  validateObject,
  validateForm
}; 