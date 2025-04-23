import { httpClient } from '../api'
import { useAuthStore } from '@/store/auth'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

// Tiempo de expiración en minutos
const SESSION_TIMEOUT = 30
const REFRESH_THRESHOLD = 5 // minutos antes de expirar

export const sessionService = {
  /**
   * Inicializa el servicio de sesiones
   */
  init() {
    this.setupActivityListeners()
    this.startSessionTimer()
  },

  /**
   * Configura los listeners de actividad del usuario
   */
  setupActivityListeners() {
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart']
    events.forEach(event => {
      document.addEventListener(event, () => this.resetSessionTimer())
    })
  },

  /**
   * Inicia el temporizador de sesión
   */
  startSessionTimer() {
    this.sessionTimer = setInterval(() => {
      this.checkSession()
    }, 60000) // Revisar cada minuto
  },

  /**
   * Reinicia el temporizador de sesión
   */
  resetSessionTimer() {
    if (this.sessionTimer) {
      clearInterval(this.sessionTimer)
    }
    this.startSessionTimer()
  },

  /**
   * Verifica el estado de la sesión
   */
  async checkSession() {
    const authStore = useAuthStore()
    if (!authStore.isAuthenticated) return

    try {
      const response = await httpClient.get(`${API_URL}/auth/check-session`)
      const { expiresIn } = response.data

      // Si la sesión está por expirar, refrescar el token
      if (expiresIn <= REFRESH_THRESHOLD) {
        await this.refreshSession()
      }
    } catch (error) {
      console.error('Error al verificar sesión:', error)
      this.handleSessionError()
    }
  },

  /**
   * Refresha la sesión
   */
  async refreshSession() {
    const authStore = useAuthStore()
    try {
      const response = await httpClient.post(`${API_URL}/auth/refresh-token`, {
        refreshToken: authStore.refreshToken
      })
      authStore.setTokens(response.data.token, response.data.refreshToken)
    } catch (error) {
      console.error('Error al refrescar sesión:', error)
      this.handleSessionError()
    }
  },

  /**
   * Maneja errores de sesión
   */
  handleSessionError() {
    const authStore = useAuthStore()
    authStore.logout()
    window.location.href = '/login'
  },

  /**
   * Verifica sesiones concurrentes
   * @returns {Promise<boolean>} true si la sesión es válida
   */
  async checkConcurrentSessions() {
    try {
      const response = await httpClient.get(`${API_URL}/auth/check-concurrent`)
      return response.data.isValid
    } catch (error) {
      console.error('Error al verificar sesiones concurrentes:', error)
      return false
    }
  },

  /**
   * Cierra todas las sesiones excepto la actual
   * @returns {Promise<boolean>} true si se cerraron correctamente
   */
  async closeOtherSessions() {
    try {
      await httpClient.post(`${API_URL}/auth/close-other-sessions`)
      return true
    } catch (error) {
      console.error('Error al cerrar otras sesiones:', error)
      return false
    }
  },

  /**
   * Limpia los recursos del servicio
   */
  cleanup() {
    if (this.sessionTimer) {
      clearInterval(this.sessionTimer)
    }
  }
}

export default sessionService 