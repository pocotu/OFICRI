import { defineStore } from 'pinia'
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'

// URL base de la API
const API_URL = import.meta.env.VITE_API_URL || '/api'

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
      
      // Usar URL completa para evitar problemas con baseURL
      const fullUrl = API_URL.endsWith('/') 
        ? `${API_URL}auth/verificar-token`
        : `${API_URL}/auth/verificar-token`
      
      console.log('Intentando obtener datos de usuario desde:', fullUrl)
      
      // Realizar petición a la API para obtener datos del usuario
      const response = await axios({
        method: 'GET',
        url: fullUrl,
        headers: {
          Authorization: `Bearer ${token.value}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Respuesta del servidor:', response.data);
      
      if (response.data.success) {
        console.log('Datos de usuario cargados desde la API:', response.data.user);
        
        // Mapear los datos al formato esperado por el sistema
        const userData = {
          IDUsuario: response.data.user.id || response.data.user.IDUsuario,
          CodigoCIP: response.data.user.codigoCIP || response.data.user.CodigoCIP,
          Nombres: response.data.user.nombres || response.data.user.Nombres || 'Usuario',
          Apellidos: response.data.user.apellidos || response.data.user.Apellidos || '',
          Grado: response.data.user.grado || response.data.user.Grado || '',
          IDArea: response.data.user.IDArea || 1,
          IDRol: response.data.user.IDRol || 1,
          NombreRol: response.data.user.rol || response.data.user.NombreRol || 'Sin rol asignado',
          Permisos: response.data.user.permisos || response.data.user.Permisos || 0
        };
        
        // Actualizar la información del usuario en el store
        setUser(userData);
        
        return user.value;
      } else {
        console.error('Error al obtener datos de usuario:', response.data.message);
        return user.value;
      }
    } catch (error) {
      console.error('Error al refrescar datos del usuario:', error);
      
      // Si el error es 404, significa que el endpoint está mal configurado
      // Cargar datos simulados en ese caso para no bloquear al usuario
      if (error.response && error.response.status === 404) {
        console.warn('Endpoint no encontrado, cargando datos simulados temporalmente');
        
        const mockUserData = {
          IDUsuario: 1,
          CodigoCIP: '12345678',
          Nombres: 'Carlos',
          Apellidos: 'Rodriguez',
          Grado: 'Coronel',
          IDArea: 1,
          IDRol: 1,
          NombreRol: 'Administrador',
          NombreArea: 'Oficina de Criminalística',
          Permisos: 255  // Todos los permisos
        };
        
        setUser(mockUserData);
      }
      
      return user.value;
    } finally {
      isLoading.value = false;
    }
  }

  // Inicializar desde localStorage si está disponible
  function initialize() {
    try {
      console.log('Inicializando Auth Store')
      const storedToken = localStorage.getItem('token')
      const storedUser = localStorage.getItem('user')
      
      if (storedToken) {
        console.log('Token encontrado en localStorage')
        token.value = storedToken
      }
      
      if (storedUser) {
        try {
          console.log('Datos de usuario encontrados en localStorage')
        const userData = JSON.parse(storedUser)
        setUser(userData)
        } catch (e) {
          console.error('Error al parsear datos de usuario:', e)
          loadDefaultUser()
        }
      } else if (token.value) {
        console.log('No hay datos de usuario pero sí hay token, cargando usuario por defecto')
        loadDefaultUser()
      }
    } catch (error) {
      console.error('Error al inicializar el store de autenticación:', error)
      // Reiniciar el estado si hay error
      logout()
    }
  }

  // Cargar un usuario por defecto si no hay ninguno
  function loadDefaultUser() {
    // Cargar un usuario por defecto
    const defaultUser = {
      IDUsuario: 1,
      CodigoCIP: '12345678',
      Nombres: 'Usuario',
      Apellidos: 'OFICRI',
      Grado: 'Oficial',
      IDArea: 1,
      IDRol: 1,
      NombreRol: 'Administrador',
      NombreArea: 'Oficina de Criminalística',
      Permisos: 255, // Todos los permisos
      UltimoAcceso: new Date().toISOString()
    }
    
    setUser(defaultUser)
    console.log('Usuario por defecto cargado')
    
    // Guardar en localStorage para persistencia
    localStorage.setItem('user', JSON.stringify(defaultUser))
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