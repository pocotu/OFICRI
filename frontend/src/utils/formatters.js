/**
 * Formatea una fecha en formato legible
 * @param {string|Date} fecha - Fecha a formatear
 * @param {boolean} conHora - Si incluir la hora o no
 * @returns {string} - Fecha formateada
 */
export function formatearFecha(fecha, conHora = false) {
  if (!fecha) return '';
  
  try {
    const date = new Date(fecha);
    if (isNaN(date.getTime())) return ''; // Si no es una fecha válida
    
    // Opciones para formatear la fecha
    const opciones = {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    };
    
    // Si se requiere incluir la hora
    if (conHora) {
      opciones.hour = '2-digit';
      opciones.minute = '2-digit';
      opciones.hour12 = false;
    }
    
    return date.toLocaleDateString('es-ES', opciones);
  } catch (error) {
    console.error('Error formateando fecha:', error);
    return '';
  }
}

/**
 * Formatea un número como moneda
 * @param {number} valor - Valor a formatear
 * @param {string} moneda - Código de moneda (default: 'PEN')
 * @returns {string} - Valor formateado como moneda
 */
export function formatearMoneda(valor, moneda = 'PEN') {
  if (valor === undefined || valor === null) return '';
  
  try {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: moneda
    }).format(valor);
  } catch (error) {
    console.error('Error formateando moneda:', error);
    return '';
  }
}

/**
 * Formatea el tamaño de un archivo en unidades legibles
 * @param {number} bytes - Tamaño en bytes
 * @returns {string} - Tamaño formateado (e.j. "1.5 MB")
 */
export function formatFileSize(bytes) {
  if (!bytes || isNaN(bytes)) return '0 B';
  
  const units = ['B', 'KB', 'MB', 'GB'];
  let unitIndex = 0;
  let size = bytes;
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  
  return `${size.toFixed(size < 10 && unitIndex > 0 ? 1 : 0)} ${units[unitIndex]}`;
} 