import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useAuthStore = defineStore('auth', () => {
  // Estado
  const user = ref(null)
  const token = ref(null)
  const permissions = ref(0)

  // Getters
  const isAuthenticated = computed(() => !!token.value)
  
  // Método para verificar permisos basado en bits
  function hasPermission(permission) {
    if (!permissions.value) return false
    return (permissions.value & permission) === permission
  }

  // Actions
  function setUser(userData) {
    user.value = userData
    permissions.value = userData?.Permisos || 0
  }
  
  function setToken(tokenValue) {
    token.value = tokenValue
  }
  
  function logout() {
    user.value = null
    token.value = null
    permissions.value = 0
    // Limpiar el almacenamiento local
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  // Inicializar desde localStorage si está disponible
  function initialize() {
    try {
      const storedToken = localStorage.getItem('token')
      const storedUser = localStorage.getItem('user')
      
      if (storedToken) {
        token.value = storedToken
      }
      
      if (storedUser) {
        const userData = JSON.parse(storedUser)
        setUser(userData)
      }
    } catch (error) {
      console.error('Error al inicializar el store de autenticación:', error)
      // Reiniciar el estado si hay error
      logout()
    }
  }
  
  // Inicializar al crear el store
  initialize()

  return {
    // Estado
    user,
    token,
    permissions,
    
    // Getters
    isAuthenticated,
    
    // Métodos
    hasPermission,
    setUser,
    setToken,
    logout,
    initialize
  }
}) 