/**
 * date.js - Utilidades para manejo de fechas
 * 
 * Proporciona funciones para manipular, formatear y comparar fechas
 * de manera consistente en toda la aplicación.
 */

// Locale para formateo de fechas en español
const LOCALE = 'es-PE';

/**
 * Formatea una fecha en string según el formato especificado
 * @param {Date|string|number} date - Fecha a formatear
 * @param {string} format - Formato deseado ('full', 'long', 'medium', 'short', 'numeric', 'custom')
 * @param {Object} options - Opciones adicionales para formatos personalizados
 * @returns {string} - Fecha formateada
 */
export const formatDate = (date, format = 'medium', options = {}) => {
  if (!date) return '';
  
  const dateObj = parseDate(date);
  if (!dateObj) return '';
  
  try {
    // Formatos predefinidos
    const formats = {
      full: { dateStyle: 'full' },
      long: { dateStyle: 'long' },
      medium: { dateStyle: 'medium' },
      short: { dateStyle: 'short' },
      numeric: { year: 'numeric', month: '2-digit', day: '2-digit' },
      time: { hour: '2-digit', minute: '2-digit', second: '2-digit' },
      dateTime: { 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit',
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false
      },
      relative: 'relative',
      custom: options
    };
    
    // Si es formato relativo, usar RelativeTimeFormat
    if (format === 'relative') {
      return formatRelativeTime(dateObj);
    }
    
    // Usar el formato predefinido o personalizado
    const formatOptions = formats[format] || formats.medium;
    return new Intl.DateTimeFormat(LOCALE, formatOptions).format(dateObj);
  } catch (error) {
    console.error('Error formateando fecha:', error);
    return '';
  }
};

/**
 * Convierte una cadena, timestamp o Date a objeto Date
 * @param {Date|string|number} date - Fecha a convertir
 * @returns {Date|null} - Objeto Date o null si es inválida
 */
export const parseDate = (date) => {
  if (!date) return null;
  
  try {
    // Si ya es un objeto Date, retornarlo
    if (date instanceof Date) {
      return isNaN(date.getTime()) ? null : date;
    }
    
    // Si es número, asumir timestamp
    if (typeof date === 'number') {
      const dateObj = new Date(date);
      return isNaN(dateObj.getTime()) ? null : dateObj;
    }
    
    // Si es string, intentar parsear
    if (typeof date === 'string') {
      // Verificar formatos comunes
      if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        // Formato ISO YYYY-MM-DD
        const [year, month, day] = date.split('-').map(Number);
        return new Date(year, month - 1, day);
      } else if (/^\d{2}\/\d{2}\/\d{4}$/.test(date)) {
        // Formato DD/MM/YYYY
        const [day, month, year] = date.split('/').map(Number);
        return new Date(year, month - 1, day);
      } else {
        // Intentar parseo genérico
        const dateObj = new Date(date);
        return isNaN(dateObj.getTime()) ? null : dateObj;
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error parseando fecha:', error);
    return null;
  }
};

/**
 * Calcula la diferencia entre dos fechas
 * @param {Date|string|number} date1 - Primera fecha
 * @param {Date|string|number} date2 - Segunda fecha
 * @param {string} unit - Unidad de tiempo ('days', 'hours', 'minutes', 'seconds', 'milliseconds')
 * @returns {number} - Diferencia entre fechas en la unidad especificada
 */
export const getDateDifference = (date1, date2, unit = 'days') => {
  const d1 = parseDate(date1);
  const d2 = parseDate(date2);
  
  if (!d1 || !d2) return null;
  
  // Diferencia en milisegundos
  const diff = d2.getTime() - d1.getTime();
  
  // Convertir según unidad
  switch (unit.toLowerCase()) {
    case 'days':
      return Math.floor(diff / (1000 * 60 * 60 * 24));
    case 'hours':
      return Math.floor(diff / (1000 * 60 * 60));
    case 'minutes':
      return Math.floor(diff / (1000 * 60));
    case 'seconds':
      return Math.floor(diff / 1000);
    case 'milliseconds':
    default:
      return diff;
  }
};

/**
 * Verifica si una fecha es anterior a otra
 * @param {Date|string|number} date - Fecha a verificar
 * @param {Date|string|number} compareDate - Fecha de comparación (por defecto, fecha actual)
 * @returns {boolean} - true si date es anterior a compareDate
 */
export const isDateBefore = (date, compareDate = new Date()) => {
  const d1 = parseDate(date);
  const d2 = parseDate(compareDate);
  
  if (!d1 || !d2) return false;
  
  return d1.getTime() < d2.getTime();
};

/**
 * Verifica si una fecha es posterior a otra
 * @param {Date|string|number} date - Fecha a verificar
 * @param {Date|string|number} compareDate - Fecha de comparación (por defecto, fecha actual)
 * @returns {boolean} - true si date es posterior a compareDate
 */
export const isDateAfter = (date, compareDate = new Date()) => {
  const d1 = parseDate(date);
  const d2 = parseDate(compareDate);
  
  if (!d1 || !d2) return false;
  
  return d1.getTime() > d2.getTime();
};

/**
 * Formatea una fecha como tiempo relativo (hace X tiempo)
 * @param {Date|string|number} date - Fecha a formatear
 * @returns {string} - Texto de tiempo relativo
 */
export const formatRelativeTime = (date) => {
  const d = parseDate(date);
  if (!d) return '';
  
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  
  // Tiempo transcurrido en diferentes unidades
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const months = Math.floor(days / 30);
  const years = Math.floor(months / 12);
  
  // Formatear según la unidad más apropiada
  if (years > 0) {
    return years === 1 ? 'hace 1 año' : `hace ${years} años`;
  } else if (months > 0) {
    return months === 1 ? 'hace 1 mes' : `hace ${months} meses`;
  } else if (days > 0) {
    return days === 1 ? 'hace 1 día' : `hace ${days} días`;
  } else if (hours > 0) {
    return hours === 1 ? 'hace 1 hora' : `hace ${hours} horas`;
  } else if (minutes > 0) {
    return minutes === 1 ? 'hace 1 minuto' : `hace ${minutes} minutos`;
  } else {
    return seconds <= 10 ? 'ahora mismo' : `hace ${seconds} segundos`;
  }
};

/**
 * Agrega tiempo a una fecha
 * @param {Date|string|number} date - Fecha base
 * @param {number} amount - Cantidad a agregar
 * @param {string} unit - Unidad de tiempo ('years', 'months', 'days', 'hours', 'minutes', 'seconds')
 * @returns {Date} - Nueva fecha con el tiempo agregado
 */
export const addTime = (date, amount, unit = 'days') => {
  const d = parseDate(date);
  if (!d) return null;
  
  const newDate = new Date(d);
  
  switch (unit.toLowerCase()) {
    case 'years':
      newDate.setFullYear(d.getFullYear() + amount);
      break;
    case 'months':
      newDate.setMonth(d.getMonth() + amount);
      break;
    case 'days':
      newDate.setDate(d.getDate() + amount);
      break;
    case 'hours':
      newDate.setHours(d.getHours() + amount);
      break;
    case 'minutes':
      newDate.setMinutes(d.getMinutes() + amount);
      break;
    case 'seconds':
      newDate.setSeconds(d.getSeconds() + amount);
      break;
    default:
      return d;
  }
  
  return newDate;
};

/**
 * Verifica si una fecha está dentro de un rango
 * @param {Date|string|number} date - Fecha a verificar
 * @param {Date|string|number} startDate - Fecha de inicio del rango
 * @param {Date|string|number} endDate - Fecha de fin del rango
 * @param {boolean} inclusive - Si incluir los límites del rango
 * @returns {boolean} - true si la fecha está dentro del rango
 */
export const isDateInRange = (date, startDate, endDate, inclusive = true) => {
  const d = parseDate(date);
  const start = parseDate(startDate);
  const end = parseDate(endDate);
  
  if (!d || !start || !end) return false;
  
  const dTime = d.getTime();
  const startTime = start.getTime();
  const endTime = end.getTime();
  
  if (inclusive) {
    return dTime >= startTime && dTime <= endTime;
  } else {
    return dTime > startTime && dTime < endTime;
  }
};

/**
 * Obtiene el inicio del día (00:00:00) para una fecha
 * @param {Date|string|number} date - Fecha
 * @returns {Date} - Fecha al inicio del día
 */
export const startOfDay = (date) => {
  const d = parseDate(date);
  if (!d) return null;
  
  const result = new Date(d);
  result.setHours(0, 0, 0, 0);
  return result;
};

/**
 * Obtiene el fin del día (23:59:59.999) para una fecha
 * @param {Date|string|number} date - Fecha
 * @returns {Date} - Fecha al final del día
 */
export const endOfDay = (date) => {
  const d = parseDate(date);
  if (!d) return null;
  
  const result = new Date(d);
  result.setHours(23, 59, 59, 999);
  return result;
};

/**
 * Obtiene el número de días en un mes específico
 * @param {number} month - Mes (1-12)
 * @param {number} year - Año
 * @returns {number} - Número de días en el mes
 */
export const getDaysInMonth = (month, year) => {
  // Mes para JS es 0-11, por eso usamos month % 12
  return new Date(year, month % 12, 0).getDate();
};

/**
 * Obtiene la fecha en formato ISO 8601 (YYYY-MM-DDTHH:mm:ss.sssZ)
 * @param {Date|string|number} date - Fecha
 * @returns {string} - Fecha en formato ISO
 */
export const toISOString = (date) => {
  const d = parseDate(date);
  return d ? d.toISOString() : '';
};

/**
 * Obtiene la fecha en formato YYYY-MM-DD
 * @param {Date|string|number} date - Fecha
 * @returns {string} - Fecha en formato YYYY-MM-DD
 */
export const toISODate = (date) => {
  const d = parseDate(date);
  if (!d) return '';
  
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
};

/**
 * Crea un objeto de fechas con funciones útiles
 */
const dateUtils = {
  formatDate,
  parseDate,
  getDateDifference,
  isDateBefore,
  isDateAfter,
  formatRelativeTime,
  addTime,
  isDateInRange,
  startOfDay,
  endOfDay,
  getDaysInMonth,
  toISOString,
  toISODate
};

export default dateUtils; 