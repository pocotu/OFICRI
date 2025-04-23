import { apiClient } from '../api/apiClient';

/**
 * Servicio especializado en validación de áreas
 */

/**
 * Tipos de área válidos en el sistema
 */
export const AREA_TYPES = {
  RECEPCION: 'RECEPCION',
  ESPECIALIZADA: 'ESPECIALIZADA',
  ADMINISTRATIVA: 'ADMINISTRATIVA',
  OPERATIVA: 'OPERATIVA',
  LEGAL: 'LEGAL',
  MESA_PARTES: 'MESA_PARTES',
  OTRO: 'OTRO'
};

/**
 * Validación completa de un área
 * @param {Object} area Datos del área a validar
 * @returns {Object} Resultado de validación con errores detallados
 */
export async function validateAreaComplete(area) {
  const errors = [];
  const warnings = [];
  
  // Validación de campos obligatorios
  if (!area.NombreArea || area.NombreArea.trim() === '') {
    errors.push({ field: 'NombreArea', message: 'El nombre del área es obligatorio' });
  } else if (area.NombreArea.length > 100) {
    errors.push({ field: 'NombreArea', message: 'El nombre del área no puede exceder 100 caracteres' });
  }
  
  if (!area.TipoArea) {
    errors.push({ field: 'TipoArea', message: 'El tipo de área es obligatorio' });
  } else if (!Object.values(AREA_TYPES).includes(area.TipoArea)) {
    errors.push({ field: 'TipoArea', message: 'El tipo de área no es válido' });
  }
  
  // Validación de código de identificación (si existe)
  if (area.CodigoIdentificacion) {
    if (area.CodigoIdentificacion.length > 50) {
      errors.push({ field: 'CodigoIdentificacion', message: 'El código de identificación no puede exceder 50 caracteres' });
    }
    
    // Verificar duplicados solo si no hay errores previos en el código
    if (!errors.some(e => e.field === 'CodigoIdentificacion')) {
      try {
        const isDuplicate = await checkDuplicateCode(area.CodigoIdentificacion, area.IDArea);
        if (isDuplicate) {
          errors.push({ field: 'CodigoIdentificacion', message: 'El código de identificación ya está en uso' });
        }
      } catch (error) {
        warnings.push({ field: 'CodigoIdentificacion', message: 'No se pudo verificar duplicados, verifique manualmente' });
      }
    }
  }
  
  // Validación de longitud de descripción
  if (area.Descripcion && area.Descripcion.length > 255) {
    errors.push({ field: 'Descripcion', message: 'La descripción no puede exceder 255 caracteres' });
  }
  
  // Validaciones específicas según el tipo de área
  if (area.TipoArea === AREA_TYPES.MESA_PARTES) {
    // Validaciones específicas para áreas de mesa de partes
    if (!area.CodigoIdentificacion) {
      errors.push({ field: 'CodigoIdentificacion', message: 'El código de identificación es obligatorio para áreas de Mesa de Partes' });
    }
  }
  
  if (area.TipoArea === AREA_TYPES.ESPECIALIZADA) {
    // Validaciones específicas para áreas especializadas
    if (!area.Descripcion) {
      warnings.push({ field: 'Descripcion', message: 'Se recomienda incluir una descripción detallada para áreas especializadas' });
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    hasWarnings: warnings.length > 0
  };
}

/**
 * Verifica si un código de identificación ya está en uso
 * @param {string} code Código a verificar
 * @param {number} excludeId ID del área a excluir (para actualizaciones)
 * @returns {Promise<boolean>} true si está duplicado, false si no
 */
async function checkDuplicateCode(code, excludeId = null) {
  try {
    const response = await apiClient.get('/areas', {
      params: { codigoIdentificacion: code }
    });
    
    if (response.data.success && response.data.data.length > 0) {
      // Si estamos actualizando un área, excluir el área actual
      if (excludeId) {
        return response.data.data.some(area => area.IDArea !== excludeId);
      }
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error verificando duplicidad de código:', error);
    throw error;
  }
}

/**
 * Valida el formato del código de identificación
 * @param {string} code Código a validar
 * @returns {Object} Resultado de validación
 */
export function validateCodeFormat(code) {
  if (!code) {
    return { isValid: false, message: 'El código no puede estar vacío' };
  }
  
  // Formato requerido: Letras y números, guiones y puntos permitidos
  const codeRegex = /^[A-Za-z0-9\-\.]+$/;
  if (!codeRegex.test(code)) {
    return { 
      isValid: false, 
      message: 'El código debe contener solo letras, números, guiones y puntos' 
    };
  }
  
  return { isValid: true };
}

/**
 * Valida la existencia de un área padre
 * @param {number} parentId ID del área padre
 * @returns {Promise<Object>} Resultado de validación
 */
export async function validateParentArea(parentId) {
  if (!parentId) {
    return { isValid: true }; // No es obligatorio tener área padre
  }
  
  try {
    const response = await apiClient.get(`/areas/${parentId}`);
    return { 
      isValid: response.data.success,
      message: response.data.success ? '' : 'El área padre no existe'
    };
  } catch (error) {
    console.error('Error validando área padre:', error);
    return { 
      isValid: false, 
      message: 'Error al validar el área padre' 
    };
  }
}

/**
 * Valida relaciones entre áreas para prevenir ciclos
 * @param {number} areaId ID del área a validar
 * @param {number} parentId ID del área padre
 * @returns {Promise<Object>} Resultado de validación
 */
export async function validateAreaRelationship(areaId, parentId) {
  if (!parentId || !areaId) {
    return { isValid: true }; // No hay relación que validar
  }
  
  // Evitar que un área sea su propio padre
  if (areaId === parentId) {
    return { 
      isValid: false, 
      message: 'Un área no puede ser su propio padre' 
    };
  }
  
  try {
    // Verificar si la asignación crearía un ciclo
    const response = await apiClient.get(`/areas/check-cycle`, {
      params: { areaId, parentId }
    });
    
    return { 
      isValid: !response.data.createsCycle,
      message: response.data.createsCycle ? 'Esta relación crearía un ciclo en la jerarquía' : ''
    };
  } catch (error) {
    console.error('Error validando relación entre áreas:', error);
    return { 
      isValid: false, 
      message: 'Error al validar la relación jerárquica'
    };
  }
}

export default {
  AREA_TYPES,
  validateAreaComplete,
  validateCodeFormat,
  validateParentArea,
  validateAreaRelationship
}; 