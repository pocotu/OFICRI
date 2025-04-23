import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

/**
 * Store para manejar el estado de autenticación
 */
export const useAuthStore = defineStore('auth', () => {
  // Estado según el modelo de datos restringido
  const user = ref(null);
  const token = ref(null);
  const refreshToken = ref(null);
  const isLoading = ref(false);
  const lastError = ref(null);

  // Computed properties
  const isAuthenticated = computed(() => !!token.value);
  
  const userFullName = computed(() => {
    if (!user.value) return '';
    return `${user.value.Nombres} ${user.value.Apellidos}`;
  });
  
  const userRole = computed(() => user.value?.NombreRol || '');

  // Métodos para verificar permisos basados en bits
  const hasPermission = (bit) => {
    if (!user.value?.Permisos) return false;
    return (user.value.Permisos & bit) === bit;
  };
  
  const hasAnyPermission = (bits) => {
    if (!user.value?.Permisos) return false;
    return bits.some(bit => (user.value.Permisos & bit) === bit);
  };
  
  const hasAllPermissions = (bits) => {
    if (!user.value?.Permisos) return false;
    return bits.every(bit => (user.value.Permisos & bit) === bit);
  };

  // Acciones
  const setUser = (userData) => {
    // Solo almacenar los campos permitidos según el modelo de datos
    user.value = {
      IDUsuario: userData.IDUsuario,
      CodigoCIP: userData.CodigoCIP,
      Nombres: userData.Nombres,
      Apellidos: userData.Apellidos,
      Grado: userData.Grado,
      IDArea: userData.IDArea,
      IDRol: userData.IDRol,
      Permisos: userData.Permisos
    };
  };
  
  const setTokens = ({ token: newToken, refreshToken: newRefreshToken }) => {
    token.value = newToken;
    refreshToken.value = newRefreshToken;
    localStorage.setItem('token', newToken);
    localStorage.setItem('refreshToken', newRefreshToken);
  };
  
  const setError = (error) => {
    lastError.value = error;
  };
  
  const setLoading = (loading) => {
    isLoading.value = loading;
  };
  
  const logout = () => {
    user.value = null;
    token.value = null;
    refreshToken.value = null;
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  };

  const initialize = () => {
    try {
      const storedToken = localStorage.getItem('token');
      const storedRefreshToken = localStorage.getItem('refreshToken');
      const storedUser = localStorage.getItem('user');
      
      if (storedToken && storedUser) {
        token.value = storedToken;
        refreshToken.value = storedRefreshToken;
        user.value = JSON.parse(storedUser);
      }
    } catch (error) {
      console.error('Error al inicializar el store:', error);
      logout();
    }
  };
  
  // Inicializar al crear el store
  initialize();

  // Exponer estado y métodos
  return {
    // Estado
    user,
    token,
    refreshToken,
    isLoading,
    lastError,
    
    // Computed
    isAuthenticated,
    userFullName,
    userRole,
    
    // Métodos de permisos
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    
    // Acciones
    setUser,
    setTokens,
    setError,
    setLoading,
    logout,
    initialize
  };
}); 