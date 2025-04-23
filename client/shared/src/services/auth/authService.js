import { httpClient } from '../api'
import { validationService } from '../security/validationService'
import { auditService } from '../security/auditService'
import { sessionService } from '../security/sessionService'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

/**
 * Servicio para gestionar la autenticación con el backend
 */
export const authService = {
  /**
   * Inicializa los servicios necesarios
   */
  init() {
    sessionService.init()
  },

  /**
   * Validar formato de CIP (8 dígitos)
   * @param {string} codigoCIP - Código CIP a validar
   * @returns {boolean} - true si el formato es válido
   */
  validateCIP(codigoCIP) {
    return /^\d{8}$/.test(codigoCIP)
  },

  /**
   * Realiza el login del usuario
   * @param {string} codigoCIP - Código de Identificación Policial
   * @param {string} password - Contraseña
   * @returns {Promise<Object>} Datos del usuario y tokens
   */
  async login(codigoCIP, password) {
    try {
      // Validar formato CIP
      if (!validationService.validateCIP(codigoCIP)) {
        throw new Error('Formato de CIP inválido')
      }

      // Validar complejidad de contraseña - ¡INCORRECTO PARA LOGIN!
      /*
      const passwordValidation = validationService.validatePassword(password)
      if (!passwordValidation.isValid) {
        throw new Error(passwordValidation.errors.join(', '))
      }
      */

      const response = await httpClient.post(`${API_URL}/auth/login`, {
        codigoCIP,
        password
      })

      // Inicializar sesión
      sessionService.init()

      return response.data
    } catch (error) {
      // Registrar intento fallido - COMENTADO TEMPORALMENTE POR ERROR 404 en endpoint de auditoría
      /*
      await auditService.logAccessDenied({
        codigoCIP,
        tipo: 'LOGIN',
        motivo: error.message
      })
      */
      throw error
    }
  },

  /**
   * Realiza el logout del usuario
   */
  async logout() {
    try {
      await httpClient.post(`${API_URL}/auth/logout`)
      sessionService.cleanup()
    } catch (error) {
      console.error('Error al cerrar sesión:', error)
    }
  },

  /**
   * Verifica si el usuario está autenticado
   * @returns {Promise<boolean>} true si el usuario está autenticado
   */
  async isAuthenticated() {
    try {
      const token = this.getStoredToken()
      if (!token) return false

      // Verificar sesión concurrente
      const isConcurrentValid = await sessionService.checkConcurrentSessions()
      if (!isConcurrentValid) {
        await this.logout()
        return false
      }

      const response = await httpClient.get(`${API_URL}/auth/verify`)
      return response.data.isValid
    } catch (error) {
      return false
    }
  },

  /**
   * Obtiene el token almacenado
   * @returns {string|null} Token de autenticación
   */
  getStoredToken() {
    return localStorage.getItem('token')
  },

  /**
   * Almacena los tokens de autenticación
   * @param {string} token - Token de acceso
   * @param {string} refreshToken - Token de refresco
   */
  setTokens(token, refreshToken) {
    localStorage.setItem('token', token)
    localStorage.setItem('refreshToken', refreshToken)
  },

  /**
   * Solicita un reseteo de contraseña
   * @param {string} codigoCIP - Código de Identificación Policial
   */
  async requestPasswordReset(codigoCIP) {
    try {
      // Validar formato CIP
      if (!validationService.validateCIP(codigoCIP)) {
        throw new Error('Formato de CIP inválido')
      }

      // Verificar si el CIP existe
      const exists = await validationService.verifyCIPExists(codigoCIP)
      if (!exists) {
        throw new Error('CIP no encontrado')
      }

      await httpClient.post(`${API_URL}/auth/reset-password`, { codigoCIP })
    } catch (error) {
      // Registrar intento fallido
      await auditService.logAccessDenied({
        codigoCIP,
        tipo: 'RESET_PASSWORD',
        motivo: error.message
      })
      throw error
    }
  },

  /**
   * Cambia la contraseña del usuario
   * @param {string} oldPassword - Contraseña actual
   * @param {string} newPassword - Nueva contraseña
   */
  async changePassword(oldPassword, newPassword) {
    try {
      // Validar complejidad de la nueva contraseña
      const passwordValidation = validationService.validatePassword(newPassword)
      if (!passwordValidation.isValid) {
        throw new Error(passwordValidation.errors.join(', '))
      }

      await httpClient.post(`${API_URL}/auth/change-password`, {
        oldPassword,
        newPassword
      })

      // Registrar cambio de contraseña
      await auditService.logPermissionChange({
        tipo: 'CHANGE_PASSWORD',
        detalles: 'Cambio de contraseña exitoso'
      })
    } catch (error) {
      // Registrar intento fallido
      await auditService.logAccessDenied({
        tipo: 'CHANGE_PASSWORD',
        motivo: error.message
      })
      throw error
    }
  },

  /**
   * Refresca el token de autenticación
   * @returns {Promise<Object>} Nuevos tokens
   */
  async refreshToken() {
    try {
      const refreshToken = localStorage.getItem('refreshToken')
      if (!refreshToken) {
        throw new Error('No hay refresh token disponible')
      }

      const response = await httpClient.post(`${API_URL}/auth/refresh-token`, {
        refreshToken
      })

      this.setTokens(response.data.token, response.data.refreshToken)
      return response.data
    } catch (error) {
      // Registrar error de refresco
      await auditService.logAccessDenied({
        tipo: 'REFRESH_TOKEN',
        motivo: error.message
      })
      throw error
    }
  },

  /**
   * Obtener los datos del usuario almacenados
   * @returns {Object|null} - Datos del usuario o null si no existen
   */
  getStoredUser() {
    const userStr = localStorage.getItem('user')
    return userStr ? JSON.parse(userStr) : null
  }
}

export default authService 