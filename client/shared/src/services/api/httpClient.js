import axios from 'axios';
import { useAuthStore } from '@/store/auth';

// Crear instancia de axios con configuración base
const httpClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Interceptor para agregar el token de autenticación a las peticiones
httpClient.interceptors.request.use(
  (config) => {
    const authStore = useAuthStore();
    const token = authStore.token;

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar respuestas y errores comunes
httpClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    const authStore = useAuthStore();

    // Si el error es 401 y no es una solicitud de refresh token
    if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.url.includes('/auth/refresh')) {
      originalRequest._retry = true;

      try {
        // Intentar refrescar el token
        const refreshResponse = await httpClient.post('/auth/refresh', {
          refreshToken: authStore.refreshToken
        });

        if (refreshResponse.data.success) {
          // Actualizar tokens
          authStore.setTokens({
            token: refreshResponse.data.token,
            refreshToken: refreshResponse.data.refreshToken
          });

          // Reintentar la solicitud original
          originalRequest.headers.Authorization = `Bearer ${refreshResponse.data.token}`;
          return httpClient(originalRequest);
        }
      } catch (refreshError) {
        // Si falla el refresh, hacer logout
        authStore.logout();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    // Manejo de errores específicos
    if (error.response) {
      // Error de autenticación
      if (error.response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        // Redireccionar a login si no se está ya en una página de autenticación
        const currentPath = window.location.pathname;
        if (!currentPath.includes('/login') && !currentPath.includes('/register')) {
          window.location.href = '/login';
        }
      }
      
      // Error de permisos
      if (error.response.status === 403) {
        console.error('Acceso denegado: no tiene suficientes permisos.');
      }
      
      // Error de validación
      if (error.response.status === 422) {
        return Promise.reject({
          message: 'Error de validación en los datos enviados',
          errors: error.response.data.errors || {}
        });
      }
    }
    
    // Error de red o servidor
    return Promise.reject(error);
  }
);

export default httpClient; 