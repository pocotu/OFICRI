/**
 * Valida un Código de Identificación Policial (CIP)
 * @param {string} cip - El CIP a validar
 * @returns {boolean} - True si el CIP es válido, false en caso contrario
 */
export function validateCIP(cip) {
  // Verificar que el CIP sea una cadena
  if (typeof cip !== 'string') {
    return false;
  }

  // Verificar longitud (8 dígitos)
  if (cip.length !== 8) {
    return false;
  }

  // Verificar que solo contenga dígitos
  if (!/^\d+$/.test(cip)) {
    return false;
  }

  // Verificar rango válido (10000000 - 99999999)
  const cipNumber = parseInt(cip, 10);
  if (cipNumber < 10000000 || cipNumber > 99999999) {
    return false;
  }

  // Verificar dígito de control (último dígito)
  const digits = cip.split('').map(Number);
  const controlDigit = digits.pop();
  
  // Algoritmo de verificación del dígito de control
  let sum = 0;
  for (let i = 0; i < digits.length; i++) {
    sum += digits[i] * (i + 1);
  }
  const calculatedControl = sum % 10;
  
  return calculatedControl === controlDigit;
} 