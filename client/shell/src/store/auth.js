import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useAuthStore = defineStore('auth', () => {
  // Estado
  const user = ref(null)
  const token = ref(null)
  const permissions = ref(0)
  const isLoading = ref(false)

  // Getters
  const isAuthenticated = computed(() => !!token.value)
  
  // Método para verificar permisos basado en bits
  function hasPermission(permission) {
    if (!permissions.value) return false
    return (permissions.value & permission) === permission
  }

  // Actions
  function setUser(userData) {
    if (!userData) {
      user.value = null
      permissions.value = 0
      return
    }
    
    // Asegurar que los campos requeridos estén presentes
    user.value = {
      ...userData,
      Nombres: userData.Nombres || 'Usuario',
      Apellidos: userData.Apellidos || '',
      NombreRol: userData.NombreRol || 'Sin rol asignado',
      Permisos: userData.Permisos || 0
    }
    
    permissions.value = userData.Permisos || 0
    
    // Guardar en localStorage para persistencia
    localStorage.setItem('user', JSON.stringify(user.value))
  }
  
  function setToken(tokenValue) {
    token.value = tokenValue
    if (tokenValue) {
      localStorage.setItem('token', tokenValue)
    } else {
      localStorage.removeItem('token')
    }
  }
  
  function logout() {
    user.value = null
    token.value = null
    permissions.value = 0
    // Limpiar el almacenamiento local
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  // Cargar datos del usuario desde la API si es necesario
  async function refreshUserData() {
    // Si no hay token, no podemos cargar datos
    if (!token.value) return null
    
    try {
      isLoading.value = true
      
      // Implementar llamada a API para refrescar datos de usuario
      // Ejemplo: const response = await fetch('/api/auth/me', {...})
      
      // Por ahora, simulamos que se mantienen los datos existentes
      if (user.value) {
        // Actualizar localStorage con los datos actuales
        localStorage.setItem('user', JSON.stringify(user.value))
      }
      
      return user.value
    } catch (error) {
      console.error('Error al refrescar datos del usuario:', error)
      return null
    } finally {
      isLoading.value = false
    }
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
        try {
          const userData = JSON.parse(storedUser)
          setUser(userData)
        } catch (e) {
          console.error('Error al parsear datos de usuario:', e)
          // Crear un usuario por defecto para evitar "undefined undefined"
          setUser({
            Nombres: 'Usuario',
            Apellidos: 'Temporal',
            NombreRol: 'Cargando...',
            Permisos: 0
          })
        }
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
    isLoading,
    
    // Getters
    isAuthenticated,
    
    // Métodos
    hasPermission,
    setUser,
    setToken,
    logout,
    initialize,
    refreshUserData
  }
}) 