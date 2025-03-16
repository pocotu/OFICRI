/**
 * Servicio de Validación de Entrada (ISO 27001 A.12.6.1)
 * 
 * Este servicio proporciona funciones para validar y sanitizar entradas de usuario
 * antes de procesarlas o enviarlas al servidor, protegiendo contra ataques como
 * XSS, inyección SQL y otros.
 */

import { VALIDATION_CONFIG, SECURITY_PROTECTION } from '../../config/security.config.js';

// Renombramos para mantener compatibilidad con el código existente
const SECURITY_CONFIG = {
    validation: {
        ...VALIDATION_CONFIG.LENGTH_LIMITS,
        forbiddenChars: SECURITY_PROTECTION.INJECTION.BLOCKED_PATTERNS,
        allowedFileTypes: ['image/jpeg', 'image/png', 'application/pdf'],
        maxFileSize: 5 * 1024 * 1024 // 5MB por defecto
    }
};

// Lista de etiquetas HTML permitidas por defecto para formato básico
const DEFAULT_ALLOWED_TAGS = ['b', 'i', 'u', 'strong', 'em', 'span', 'p', 'br'];

/**
 * Sanitiza un texto para prevenir XSS
 * @param {string} input - Texto a sanitizar
 * @param {boolean} allowHtml - Si se permiten algunas etiquetas HTML
 * @param {string[]} allowedTags - Lista de etiquetas HTML permitidas
 * @returns {string} - Texto sanitizado
 */
export function sanitizeInput(input, allowHtml = false, allowedTags = DEFAULT_ALLOWED_TAGS) {
  if (!input || typeof input !== 'string') {
    return '';
  }
  
  // Si no se permite HTML, eliminar todas las etiquetas
  if (!allowHtml) {
    // Primero escapamos los caracteres especiales
    let sanitized = input
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
    
    // Eliminar caracteres prohibidos si están definidos
    if (SECURITY_CONFIG.validation.forbiddenChars) {
      SECURITY_CONFIG.validation.forbiddenChars.forEach(char => {
        sanitized = sanitized.replace(new RegExp(char, 'g'), '');
      });
    }
    
    return sanitized;
  }
  
  // Si se permite HTML limitado, procesar etiquetas
  let sanitized = input;
  
  // Crear expresión regular para eliminar etiquetas no permitidas
  const allowedTagsPattern = allowedTags.join('|');
  const tagPattern = new RegExp(`<(?!\/?(?:${allowedTagsPattern})\\b)[^>]+>`, 'gi');
  
  // Eliminar etiquetas no permitidas
  sanitized = sanitized.replace(tagPattern, '');
  
  // Eliminar atributos peligrosos de las etiquetas permitidas
  const dangerousAttrs = ['onclick', 'onload', 'onerror', 'onmouseover', 'javascript:', 'style'];
  dangerousAttrs.forEach(attr => {
    const attrPattern = new RegExp(`\\s${attr}\\s*=\\s*["'][^"']*["']`, 'gi');
    sanitized = sanitized.replace(attrPattern, '');
  });
  
  return sanitized;
}

/**
 * Valida que un string cumpla con un formato específico
 * @param {string} input - String a validar
 * @param {RegExp} pattern - Patrón de expresión regular
 * @returns {boolean} - true si cumple con el patrón
 */
export function validatePattern(input, pattern) {
  if (!input || typeof input !== 'string') {
    return false;
  }
  return pattern.test(input);
}

/**
 * Valida que un nombre de archivo sea seguro y permitido
 * @param {string} filename - Nombre del archivo
 * @returns {boolean} - true si el archivo es permitido
 */
export function validateFilename(filename) {
  if (!filename || typeof filename !== 'string') {
    return false;
  }
  
  // Verificar extensión permitida
  const extension = filename.split('.').pop().toLowerCase();
  const allowedTypes = SECURITY_CONFIG.validation.allowedFileTypes || [];
  
  if (!allowedTypes.includes(extension)) {
    return false;
  }
  
  // Verificar que no contenga caracteres peligrosos
  const filenamePattern = /^[a-zA-Z0-9\-_\. áéíóúÁÉÍÓÚñÑ]+$/;
  return filenamePattern.test(filename);
}

/**
 * Valida el tamaño de un archivo
 * @param {File} file - Objeto File a validar
 * @returns {boolean} - true si el tamaño es aceptable
 */
export function validateFileSize(file) {
  if (!file || !file.size) {
    return false;
  }
  
  const maxSize = SECURITY_CONFIG.validation.maxFileSize || 5 * 1024 * 1024; // 5MB por defecto
  return file.size <= maxSize;
}

/**
 * Valida un campo de correo electrónico
 * @param {string} email - Correo a validar
 * @returns {boolean} - true si el formato es válido
 */
export function validateEmail(email) {
  if (!email || typeof email !== 'string') {
    return false;
  }
  
  const emailPattern = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  return emailPattern.test(email);
}

/**
 * Valida un número de documento nacional de identidad (DNI)
 * @param {string} dni - DNI a validar
 * @returns {boolean} - true si el formato es válido
 */
export function validateDNI(dni) {
  if (!dni || typeof dni !== 'string') {
    return false;
  }
  
  // DNI peruano: 8 dígitos
  const dniPattern = /^[0-9]{8}$/;
  return dniPattern.test(dni);
}

/**
 * Valida un código CIP (Colegio de Ingenieros del Perú)
 * @param {string} cip - Código CIP a validar
 * @returns {boolean} - true si el formato es válido
 */
export function validateCIP(cip) {
  if (!cip || typeof cip !== 'string') {
    return false;
  }
  
  // El código CIP tiene formato numérico, usualmente 6-7 dígitos
  const cipPattern = /^[0-9]{5,7}$/;
  return cipPattern.test(cip);
} 