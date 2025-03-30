/**
 * Módulo de validación
 * 
 * Proporciona funciones de validación para diversos tipos de datos
 * Específico para el Sistema OFICRI de la Policía Nacional
 * Cumple con ISO/IEC 27001:2013
 */

// Constantes para validación
const REGEXES = {
  // Validadores básicos
  password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
  
  // Validadores específicos para la Policía Nacional
  codigoCIP: /^\d{1,8}$/,                  // Código de Identificación Policial
  gradoPolicial: /^[A-Z]{2,5}$/,           // Código de grado policial

  // Validadores de formatos
  numbers: /^\d+$/,
  alphanumeric: /^[a-zA-Z0-9]+$/,
  alphanumericWithSpaces: /^[a-zA-Z0-9\s]+$/,
  
  // Validadores específicos del sistema OFICRI
  codigoDocumento: /^[A-Z0-9]{2,3}-\d{1,6}-\d{4}$/, // Formato de código de documento
  numeroDenuncia: /^[A-Z0-9]{3,10}$/,              // Número de denuncia
};

const VALIDATION_RULES = {
  // Reglas para contraseñas de la Policía Nacional (ISO/IEC 27001)
  password: {
    minLength: 8,
    maxLength: 30,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecial: true,
    restrictCommonPasswords: true,
  },
  
  // Reglas para nombres policiales
  nombre: {
    minLength: 2,
    maxLength: 50,
    noNumbers: true,
  },
  
  // Validación de códigos y documentos policiales
  codigoCIP: {
    minLength: 1,
    maxLength: 8, 
    numbersOnly: true,
  },
  
  // Otras reglas específicas de sistema OFICRI
  codigoDocumento: {
    pattern: "XX-123456-2023", // Ejemplo de formato
    maxLength: 20,
  }
};

/**
 * Valida una entrada según el tipo especificado
 * 
 * @param {*} input - Entrada a validar
 * @param {string} type - Tipo de validación a realizar
 * @returns {boolean} - Resultado de la validación
 */
const validateInput = function(input, type) {
  // Si la entrada es undefined o null, siempre es inválida
  if (input === undefined || input === null) {
    return false;
  }
  
    // Convertir a string si no lo es
  const value = typeof input !== 'string' ? input.toString() : input;
  
  // Validar según el tipo
  switch (type) {
    // Validadores básicos para datos del personal policial
    case 'password':
      return REGEXES.password.test(value);
    
    // Validadores para datos específicos de la Policía Nacional  
    case 'codigoCIP':
      return REGEXES.codigoCIP.test(value) && value.length <= 8;
      
    case 'gradoPolicial':
      return REGEXES.gradoPolicial.test(value);
    
    // Validadores para nombres y texto
    case 'nombre':
      return value.length >= 2 && value.length <= 50 && !/\d/.test(value);
      
    case 'apellido':
      return value.length >= 2 && value.length <= 50 && !/\d/.test(value);
      
    case 'texto':
      return value.length > 0 && value.length <= 500;
    
    // Validadores de formato generales
    case 'numerico':
      return REGEXES.numbers.test(value);
      
    case 'alfanumerico':
      return REGEXES.alphanumeric.test(value);
    
    // Validadores específicos del sistema OFICRI para documentación policial
    case 'codigoDocumento':
      return REGEXES.codigoDocumento.test(value);
      
    case 'numeroDenuncia':
      return REGEXES.numeroDenuncia.test(value);
    
    // Validadores de seguridad
    case 'newPassword':
      // Contraseñas nuevas deben cumplir con los estándares de seguridad de la Policía Nacional
      const hasUppercase = /[A-Z]/.test(value);
      const hasLowercase = /[a-z]/.test(value);
      const hasNumbers = /\d/.test(value);
      const hasSpecial = /[@$!%*?&]/.test(value);
      const hasValidLength = value.length >= 8 && value.length <= 30;
      
      return hasUppercase && hasLowercase && hasNumbers && hasSpecial && hasValidLength;
    
    // Validadores específicos del dominio
    case 'IDArea':
      // IDs de áreas en la estructura policial deben ser numéricos positivos
      return /^\d+$/.test(value) && parseInt(value) > 0;
      
    case 'IDRol':
      // IDs de roles en la estructura policial deben ser numéricos positivos
      return /^\d+$/.test(value) && parseInt(value) > 0;
    
    // Por defecto, rechazar
    default:
      console.warn(`Tipo de validación no reconocido: ${type}`);
      return false;
  }
};

/**
 * Valida un objeto completo según un esquema específico para el sistema OFICRI
 * 
 * @param {Object} data - Objeto a validar
 * @param {Object} schema - Esquema de validación con campos y tipos
 * @returns {Object} - Resultado de la validación { isValid, errors }
 */
const validateObject = function(data, schema) {
  // Resultado por defecto
  const result = {
    isValid: true,
    errors: {}
  };
  
  // Validar cada campo según el esquema
  Object.keys(schema).forEach(field => {
    const fieldSchema = schema[field];
    const value = data[field];
    
    // Si es requerido y no existe o es vacío
    if (fieldSchema.required && (value === undefined || value === null || value === '')) {
      result.isValid = false;
      result.errors[field] = `El campo ${field} es requerido`;
      return;
    }
    
    // Si existe valor y hay tipo de validación
    if (value !== undefined && value !== null && value !== '' && fieldSchema.type) {
      const isValid = validateInput(value, fieldSchema.type);
    
    if (!isValid) {
      result.isValid = false;
      result.errors[field] = fieldSchema.errorMessage || `El campo ${field} no es válido`;
      }
    }
    
    // Validaciones personalizadas si existen
    if (fieldSchema.validate && typeof fieldSchema.validate === 'function') {
      const customValidation = fieldSchema.validate(value, data);
      
      if (customValidation !== true) {
        result.isValid = false;
        result.errors[field] = customValidation;
      }
    }
  });
  
  return result;
};

// Esquemas predefinidos para la validación de entidades policiales
const schemas = {
  // Esquema para usuario policial
  usuario: {
    codigoCIP: { 
      type: 'codigoCIP', 
      required: true,
      errorMessage: 'El Código CIP debe ser numérico y tener máximo 8 dígitos' 
    },
    nombre: { 
      type: 'nombre', 
      required: true,
      errorMessage: 'El nombre debe tener entre 2 y 50 caracteres sin números' 
    },
    apellidos: { 
      type: 'nombre', 
      required: true,
      errorMessage: 'Los apellidos deben tener entre 2 y 50 caracteres sin números' 
    },
    gradoPolicial: { 
      type: 'gradoPolicial', 
      required: true,
      errorMessage: 'El grado policial no es válido' 
    },
    IDRol: { 
      type: 'IDRol', 
      required: true,
      errorMessage: 'El rol seleccionado no es válido' 
    }
  },
  
  // Esquema para documento policial
  documento: {
    titulo: { 
      type: 'texto', 
      required: true,
      errorMessage: 'El título es requerido y debe tener entre 1 y 200 caracteres' 
    },
    codigo: { 
      type: 'codigoDocumento', 
      required: true,
      errorMessage: 'El código del documento no tiene el formato correcto (XX-123456-2023)' 
    },
    IDArea: { 
      type: 'IDArea', 
      required: true,
      errorMessage: 'El área seleccionada no es válida' 
    },
    contenido: { 
      type: 'texto', 
      required: true,
      errorMessage: 'El contenido es requerido' 
    }
  },
  
  // Esquema para denuncia policial
  denuncia: {
    numeroDenuncia: { 
      type: 'numeroDenuncia', 
      required: true,
      errorMessage: 'El número de denuncia no es válido' 
    },
    fechaRegistro: { 
      required: true,
      validate: (value) => {
        // Validar que la fecha no sea futura
        const date = new Date(value);
        const today = new Date();
        return date <= today || 'La fecha no puede ser futura';
      },
      errorMessage: 'La fecha de registro no es válida' 
    },
    denunciante: { 
      type: 'texto', 
      required: true,
      errorMessage: 'El denunciante es requerido' 
    },
    descripcion: { 
      type: 'texto', 
      required: true,
      errorMessage: 'La descripción es requerida' 
    }
  },
  
  // Esquema para login de usuario policial
  login: {
    codigoCIP: { 
      type: 'codigoCIP', 
      required: true,
      errorMessage: 'El Código CIP debe ser numérico y tener máximo 8 dígitos' 
    },
    password: { 
      type: 'password', 
      required: true,
      errorMessage: 'La contraseña no cumple con los requisitos de seguridad' 
    }
  },
  
  // Esquema para cambio de contraseña de usuario policial
  cambioPassword: {
    currentPassword: { 
      type: 'password', 
      required: true,
      errorMessage: 'La contraseña actual es requerida' 
    },
    newPassword: { 
      type: 'newPassword', 
      required: true,
      errorMessage: 'La nueva contraseña no cumple con los requisitos de seguridad' 
    },
    confirmPassword: { 
      required: true,
      validate: (value, data) => {
        return value === data.newPassword || 'Las contraseñas no coinciden';
      },
      errorMessage: 'Las contraseñas no coinciden' 
    }
  }
};

// Exportar funciones y esquemas
export { validateInput, validateObject, schemas, REGEXES, VALIDATION_RULES }; 