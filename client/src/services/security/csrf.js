/**
 * Servicio de Protección CSRF (ISO 27001 A.14.2)
 * 
 * Este servicio proporciona funciones para prevenir ataques de falsificación
 * de solicitudes entre sitios (CSRF) mediante la generación y validación
 * de tokens.
 */

import { APP_CONFIG } from '../../config/app.config.js';
import { SECURITY_PROTECTION } from '../../config/security.config.js';

// Renombramos para mantener compatibilidad con el código existente
const SECURITY_CONFIG = {
    csrf: SECURITY_PROTECTION.CSRF
};

// Token actual y su timestamp de expiración
let currentToken = null;
let tokenExpiration = null;

/**
 * Inicializa el servicio CSRF
 */
export function initCsrfProtection() {
  // Cargar token existente si está disponible
  currentToken = localStorage.getItem('csrf-token') || sessionStorage.getItem('csrf-token');
  
  // Establecer expiración
  if (currentToken) {
    const storedExpiration = localStorage.getItem('csrf-token-expiration');
    tokenExpiration = storedExpiration ? parseInt(storedExpiration, 10) : null;
    
    // Verificar si ha expirado
    if (tokenExpiration && tokenExpiration < Date.now()) {
      // Limpiar token expirado
      currentToken = null;
      tokenExpiration = null;
      localStorage.removeItem('csrf-token');
      localStorage.removeItem('csrf-token-expiration');
      sessionStorage.removeItem('csrf-token');
    }
  }
  
  console.log('Servicio CSRF inicializado', { activo: SECURITY_CONFIG.csrf.enabled });
}

/**
 * Genera un nuevo token CSRF
 * @returns {string} - Token CSRF generado
 */
export function generateCsrfToken() {
  // Si hay un token válido y no ha expirado, retornarlo
  if (currentToken && tokenExpiration && tokenExpiration > Date.now()) {
    return currentToken;
  }
  
  // Generar un nuevo token (16 bytes convertidos a hex = 32 caracteres)
  const array = new Uint8Array(16);
  window.crypto.getRandomValues(array);
  
  // Convertir a string hexadecimal
  currentToken = Array.from(array)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  
  // Calcular expiración (por defecto 2 horas)
  const expirationTime = SECURITY_CONFIG.csrf.tokenExpiration || 7200;
  tokenExpiration = Date.now() + (expirationTime * 1000);
  
  // Guardar en almacenamiento
  try {
    localStorage.setItem('csrf-token', currentToken);
    localStorage.setItem('csrf-token-expiration', tokenExpiration.toString());
    sessionStorage.setItem('csrf-token', currentToken);
  } catch (e) {
    console.error('Error al guardar token CSRF:', e);
  }
  
  return currentToken;
}

/**
 * Valida un token CSRF
 * @param {string} token - Token CSRF a validar
 * @returns {boolean} - true si el token es válido
 */
export function validateCsrfToken(token) {
  // Si la protección está desactivada, siempre retornar válido
  if (!SECURITY_CONFIG.csrf.enabled) {
    return true;
  }
  
  // Si no hay token actual, validar falla
  if (!currentToken) {
    console.error('Error de validación CSRF: No hay token actual para comparar');
    return false;
  }
  
  // Si el token ha expirado, validar falla
  if (tokenExpiration && tokenExpiration < Date.now()) {
    console.error('Error de validación CSRF: Token expirado');
    return false;
  }
  
  // Comparar tokens
  const isValid = token === currentToken;
  
  // Registrar intento fallido
  if (!isValid) {
    console.error('Error de validación CSRF: Token inválido');
    
    // Si estamos en ambiente no desarrollo, considerar regenerar token
    if (APP_CONFIG.env !== 'development') {
      // Regenerar token en caso de intento inválido (posible ataque)
      generateCsrfToken();
    }
  }
  
  return isValid;
}

/**
 * Actualiza el token CSRF actual
 * @param {string} token - Nuevo token CSRF
 */
export function updateCsrfToken(token) {
  if (token && typeof token === 'string') {
    currentToken = token;
    
    // Calcular nueva expiración
    const expirationTime = SECURITY_CONFIG.csrf.tokenExpiration || 7200;
    tokenExpiration = Date.now() + (expirationTime * 1000);
    
    // Guardar en almacenamiento
    try {
      localStorage.setItem('csrf-token', currentToken);
      localStorage.setItem('csrf-token-expiration', tokenExpiration.toString());
      sessionStorage.setItem('csrf-token', currentToken);
    } catch (e) {
      console.error('Error al actualizar token CSRF:', e);
    }
    
    return true;
  }
  
  return false;
}

/**
 * Obtiene el token CSRF actual
 * @returns {string|null} - Token CSRF actual o null si no existe
 */
export function getCurrentCsrfToken() {
  return currentToken;
} 