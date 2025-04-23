import axios from 'axios';
import { sessionControl } from './security/sessionControl';
import { logOperation } from './security/auditTrail';

// Crear instancia de axios
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor para agregar token a las solicitudes
api.interceptors.request.use(
  config => {
    const token = sessionControl.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar respuestas
api.interceptors.response.use(
  response => {
    return response;
  },
  async error => {
    const originalRequest = error.config;

    // Si el error es 401 y no es una solicitud de refresh token
    if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.url.includes('/auth/refresh-token')) {
      originalRequest._retry = true;

      try {
        // Intentar renovar el token
        const response = await api.post('/auth/refresh-token', {
          refreshToken: sessionControl.getRefreshToken()
        });

        // Actualizar tokens
        sessionControl.setTokens(response.data.token, response.data.refreshToken);

        // Reintentar la solicitud original
        originalRequest.headers.Authorization = `Bearer ${response.data.token}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Si falla el refresh token, limpiar sesión
        sessionControl.clearSession();
        logOperation('TOKEN_REFRESH', 'ERROR', 'Error al renovar token de sesión');
        return Promise.reject(refreshError);
      }
    }

    // Registrar error en auditoría
    if (error.response) {
      logOperation(
        'API_ERROR',
        'ERROR',
        `Error en solicitud a ${originalRequest.url}`,
        {
          status: error.response.status,
          method: originalRequest.method,
          data: error.response.data
        }
      );
    }

    return Promise.reject(error);
  }
);

// Métodos de conveniencia
export const apiService = {
  // GET
  async get(url, config = {}) {
    return api.get(url, config);
  },

  // POST
  async post(url, data = {}, config = {}) {
    return api.post(url, data, config);
  },

  // PUT
  async put(url, data = {}, config = {}) {
    return api.put(url, data, config);
  },

  // DELETE
  async delete(url, config = {}) {
    return api.delete(url, config);
  },

  // PATCH
  async patch(url, data = {}, config = {}) {
    return api.patch(url, data, config);
  },

  // Upload file
  async upload(url, file, config = {}) {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(url, formData, {
      ...config,
      headers: {
        ...config.headers,
        'Content-Type': 'multipart/form-data'
      }
    });
  },

  // Download file
  async download(url, config = {}) {
    return api.get(url, {
      ...config,
      responseType: 'blob'
    });
  }
};

export { api }; 