import { httpClient } from '../api'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

// Expresiones regulares para validación
const CIP_REGEX = /^\d{8}$/
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/

export const validationService = {
  /**
   * Valida el formato del CIP
   * @param {string} cip - Código de Identificación Policial
   * @returns {boolean} true si el formato es válido
   */
  validateCIP(cip) {
    return CIP_REGEX.test(cip)
  },

  /**
   * Valida la complejidad de la contraseña
   * @param {string} password - Contraseña a validar
   * @returns {Object} Resultado de la validación
   */
  validatePassword(password) {
    const result = {
      isValid: false,
      errors: []
    }

    if (!PASSWORD_REGEX.test(password)) {
      if (password.length < 8) {
        result.errors.push('La contraseña debe tener al menos 8 caracteres')
      }
      if (!/[A-Z]/.test(password)) {
        result.errors.push('La contraseña debe contener al menos una mayúscula')
      }
      if (!/[a-z]/.test(password)) {
        result.errors.push('La contraseña debe contener al menos una minúscula')
      }
      if (!/\d/.test(password)) {
        result.errors.push('La contraseña debe contener al menos un número')
      }
      if (!/[@$!%*?&]/.test(password)) {
        result.errors.push('La contraseña debe contener al menos un carácter especial (@$!%*?&)')
      }
    } else {
      result.isValid = true
    }

    return result
  },

  /**
   * Verifica si el CIP existe en el sistema
   * @param {string} cip - Código de Identificación Policial
   * @returns {Promise<boolean>} true si el CIP existe
   */
  async verifyCIPExists(cip) {
    try {
      const response = await httpClient.get(`${API_URL}/usuarios/verificar-cip/${cip}`)
      return response.data.exists
    } catch (error) {
      console.error('Error al verificar CIP:', error)
      return false
    }
  }
}

export default validationService 