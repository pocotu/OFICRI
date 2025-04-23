/**
 * Valida si un Código de Identificación Policial (CIP) tiene el formato correcto.
 * @param {string} codigoCIP - El código CIP a validar.
 * @returns {boolean} - true si el formato es válido (8 dígitos), false en caso contrario.
 */
export function validateCIP(codigoCIP) {
  if (typeof codigoCIP !== 'string') {
    return false;
  }
  return /^\d{8}$/.test(codigoCIP);
} 