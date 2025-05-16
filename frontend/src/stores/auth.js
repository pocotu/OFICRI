import { defineStore } from 'pinia'
import { login as apiLogin, getMe, logout as apiLogout } from '../api/authApi'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    token: localStorage.getItem('token') || null,
    loading: false,
    error: null
  }),

  getters: {
    isAuthenticated: (state) => !!state.token,
    userRole: (state) => state.user?.IDRol
  },

  actions: {
    async login(credentials) {
      this.loading = true
      this.error = null
      try {
        const response = await apiLogin(credentials.cip, credentials.password)
        this.token = response.data.token
        localStorage.setItem('token', this.token)
        // Obtener el usuario completo desde /api/auth/me
        const meResponse = await getMe(this.token)
        this.user = meResponse.data
        return true
      } catch (error) {
        this.error = error.response?.data?.message || 'Error al iniciar sesión'
        return false
      } finally {
        this.loading = false
      }
    },

    async logout() {
      if (this.token) {
        try {
          await apiLogout(this.token)
        } catch (e) {
          // Ignorar errores de logout
        }
      }
      this.user = null
      this.token = null
      localStorage.removeItem('token')
      // Esperar a que Pinia reactive el cambio
      await new Promise(resolve => setTimeout(resolve, 0))
    },

    async checkAuth() {
      if (!this.token) return false
      
      try {
        const response = await getMe(this.token)
        this.user = response.data
        return true
      } catch (error) {
        this.logout()
        return false
      }
    },

    async initialize() {
      if (this.token && !this.user) {
        await this.checkAuth();
      }
    }
  }
}) 