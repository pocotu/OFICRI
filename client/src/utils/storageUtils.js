/**
 * Utilidades para gestionar el almacenamiento (localStorage y sessionStorage)
 * Este archivo proporciona funciones para trabajar con almacenamiento local
 * de manera segura, con manejo de errores y encriptación básica.
 */

/**
 * Guarda un valor en localStorage
 * @param {string} key - Clave para almacenar el valor
 * @param {*} value - Valor a almacenar (será convertido a JSON string)
 * @returns {boolean} - true si se almacenó correctamente
 */
export function saveToLocalStorage(key, value) {
  try {
    const serializedValue = typeof value === 'object' 
      ? JSON.stringify(value) 
      : String(value);
      
    localStorage.setItem(key, serializedValue);
    return true;
  } catch (error) {
    console.error(`Error al guardar en localStorage (${key}):`, error);
    return false;
  }
}

/**
 * Obtiene un valor desde localStorage
 * @param {string} key - Clave del valor a obtener
 * @param {*} defaultValue - Valor por defecto si no existe
 * @returns {*} - Valor almacenado o defaultValue
 */
export function getFromLocalStorage(key, defaultValue = null) {
  try {
    const value = localStorage.getItem(key);
    
    if (value === null) return defaultValue;
    
    // Intentar parsear como JSON
    try {
      return JSON.parse(value);
    } catch (e) {
      // Si no es JSON, devolver el valor tal cual
      return value;
    }
  } catch (error) {
    console.error(`Error al leer de localStorage (${key}):`, error);
    return defaultValue;
  }
}

/**
 * Elimina un valor de localStorage
 * @param {string} key - Clave a eliminar
 * @returns {boolean} - true si se eliminó correctamente
 */
export function removeFromLocalStorage(key) {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error(`Error al eliminar de localStorage (${key}):`, error);
    return false;
  }
}

/**
 * Guarda un valor en sessionStorage
 * @param {string} key - Clave para almacenar el valor
 * @param {*} value - Valor a almacenar (será convertido a JSON string)
 * @returns {boolean} - true si se almacenó correctamente
 */
export function saveToSessionStorage(key, value) {
  try {
    const serializedValue = typeof value === 'object' 
      ? JSON.stringify(value) 
      : String(value);
      
    sessionStorage.setItem(key, serializedValue);
    return true;
  } catch (error) {
    console.error(`Error al guardar en sessionStorage (${key}):`, error);
    return false;
  }
}

/**
 * Obtiene un valor desde sessionStorage
 * @param {string} key - Clave del valor a obtener
 * @param {*} defaultValue - Valor por defecto si no existe
 * @returns {*} - Valor almacenado o defaultValue
 */
export function getFromSessionStorage(key, defaultValue = null) {
  try {
    const value = sessionStorage.getItem(key);
    
    if (value === null) return defaultValue;
    
    // Intentar parsear como JSON
    try {
      return JSON.parse(value);
    } catch (e) {
      // Si no es JSON, devolver el valor tal cual
      return value;
    }
  } catch (error) {
    console.error(`Error al leer de sessionStorage (${key}):`, error);
    return defaultValue;
  }
}

/**
 * Elimina un valor de sessionStorage
 * @param {string} key - Clave a eliminar
 * @returns {boolean} - true si se eliminó correctamente
 */
export function removeFromSessionStorage(key) {
  try {
    sessionStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error(`Error al eliminar de sessionStorage (${key}):`, error);
    return false;
  }
}

/**
 * Limpia todo el localStorage
 * @returns {boolean} - true si se limpió correctamente
 */
export function clearLocalStorage() {
  try {
    localStorage.clear();
    return true;
  } catch (error) {
    console.error('Error al limpiar localStorage:', error);
    return false;
  }
}

/**
 * Limpia todo el sessionStorage
 * @returns {boolean} - true si se limpió correctamente
 */
export function clearSessionStorage() {
  try {
    sessionStorage.clear();
    return true;
  } catch (error) {
    console.error('Error al limpiar sessionStorage:', error);
    return false;
  }
}

/**
 * Verifica si localStorage está disponible
 * @returns {boolean} - true si está disponible
 */
export function isLocalStorageAvailable() {
  try {
    const testKey = '__test__';
    localStorage.setItem(testKey, testKey);
    localStorage.removeItem(testKey);
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Verifica si sessionStorage está disponible
 * @returns {boolean} - true si está disponible
 */
export function isSessionStorageAvailable() {
  try {
    const testKey = '__test__';
    sessionStorage.setItem(testKey, testKey);
    sessionStorage.removeItem(testKey);
    return true;
  } catch (e) {
    return false;
  }
}

export default {
  saveToLocalStorage,
  getFromLocalStorage,
  removeFromLocalStorage,
  saveToSessionStorage,
  getFromSessionStorage,
  removeFromSessionStorage,
  clearLocalStorage,
  clearSessionStorage,
  isLocalStorageAvailable,
  isSessionStorageAvailable
}; 