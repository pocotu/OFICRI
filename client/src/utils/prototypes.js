/**
 * Extensiones de prototipos para el sistema OFICRI
 * 
 * Este archivo añade extensiones a prototipos nativos de JavaScript para 
 * facilitar operaciones comunes en el sistema OFICRI.
 */

// String prototype extensions
if (!String.prototype.capitalize) {
  /**
   * Capitaliza la primera letra de un string
   * @returns {string} String con la primera letra en mayúscula
   */
  String.prototype.capitalize = function() {
    return this.charAt(0).toUpperCase() + this.slice(1);
  };
}

if (!String.prototype.truncate) {
  /**
   * Trunca un string a la longitud especificada
   * @param {number} length - Longitud máxima
   * @param {string} [suffix='...'] - Sufijo a añadir cuando se trunca
   * @returns {string} String truncado
   */
  String.prototype.truncate = function(length, suffix = '...') {
    if (this.length <= length) {
      return String(this);
    }
    return this.slice(0, length) + suffix;
  };
}

// Array prototype extensions
if (!Array.prototype.groupBy) {
  /**
   * Agrupa los elementos de un array por una propiedad o función
   * @param {string|Function} key - Propiedad o función para agrupar
   * @returns {Object} Objeto con los elementos agrupados
   */
  Array.prototype.groupBy = function(key) {
    return this.reduce((result, item) => {
      const groupKey = typeof key === 'function' ? key(item) : item[key];
      result[groupKey] = result[groupKey] || [];
      result[groupKey].push(item);
      return result;
    }, {});
  };
}

// Date prototype extensions
if (!Date.prototype.formatDate) {
  /**
   * Formatea una fecha según el formato especificado
   * @param {string} [format='DD/MM/YYYY'] - Formato de fecha
   * @returns {string} Fecha formateada
   */
  Date.prototype.formatDate = function(format = 'DD/MM/YYYY') {
    const date = this;
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    
    return format
      .replace('DD', day)
      .replace('MM', month)
      .replace('YYYY', year)
      .replace('HH', hours)
      .replace('mm', minutes)
      .replace('ss', seconds);
  };
}

// Number prototype extensions
if (!Number.prototype.formatNumber) {
  /**
   * Formatea un número con separadores de miles y decimales
   * @param {number} [decimals=0] - Número de decimales
   * @param {string} [decimalSeparator='.'] - Separador decimal
   * @param {string} [thousandsSeparator=','] - Separador de miles
   * @returns {string} Número formateado
   */
  Number.prototype.formatNumber = function(decimals = 0, decimalSeparator = '.', thousandsSeparator = ',') {
    const number = this;
    const parts = number.toFixed(decimals).split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, thousandsSeparator);
    return parts.join(decimalSeparator);
  };
}

/**
 * Extensiones para objetos globales
 */

// Object extensions
if (!Object.isEmpty) {
  /**
   * Verifica si un objeto está vacío
   * @param {Object} obj - Objeto a verificar
   * @returns {boolean} true si el objeto está vacío
   */
  Object.isEmpty = function(obj) {
    if (obj == null) return true;
    return Object.keys(obj).length === 0;
  };
}

if (!Object.deepMerge) {
  /**
   * Fusiona profundamente dos objetos
   * @param {Object} target - Objeto destino
   * @param {Object} source - Objeto fuente
   * @returns {Object} Objeto fusionado
   */
  Object.deepMerge = function(target, source) {
    const output = { ...target };
    
    if (source && typeof source === 'object') {
      Object.keys(source).forEach(key => {
        if (source[key] instanceof Object && key in target && target[key] instanceof Object) {
          output[key] = Object.deepMerge(target[key], source[key]);
        } else {
          output[key] = source[key];
        }
      });
    }
    
    return output;
  };
}

// Console extensions for development
if (window.OFICRI && window.OFICRI.config && window.OFICRI.config.features && window.OFICRI.config.features.debugging) {
  // Save original console methods
  const originalConsole = {
    log: console.log,
    error: console.error,
    warn: console.warn,
    info: console.info
  };
  
  // Override console methods with prefixed versions
  console.log = function(...args) {
    originalConsole.log.apply(console, ['[OFICRI]', ...args]);
  };
  
  console.error = function(...args) {
    originalConsole.error.apply(console, ['[OFICRI-ERROR]', ...args]);
  };
  
  console.warn = function(...args) {
    originalConsole.warn.apply(console, ['[OFICRI-WARN]', ...args]);
  };
  
  console.info = function(...args) {
    originalConsole.info.apply(console, ['[OFICRI-INFO]', ...args]);
  };
  
  // Add debug method for development only
  console.debug = function(...args) {
    originalConsole.log.apply(console, ['[OFICRI-DEBUG]', ...args]);
  };
}

// Expose helpers to global namespace
window.OFICRI = window.OFICRI || {};
window.OFICRI.utils = window.OFICRI.utils || {};

/**
 * Genera un ID único
 * @returns {string} ID único
 */
window.OFICRI.utils.generateId = function() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
};

/**
 * Función de ayuda para descargar un archivo
 * @param {Blob} blob - Contenido del archivo
 * @param {string} filename - Nombre del archivo
 */
window.OFICRI.utils.downloadFile = function(blob, filename) {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}; 