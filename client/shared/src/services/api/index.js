import httpClient from './httpClient';
import { eventBus, EVENTS } from '../event-bus/eventBus';

// Servicio base de API
const apiService = {
  // Métodos HTTP base
  async get(url, params = {}) {
    try {
      const response = await httpClient.get(url, { params });
      return response.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  },

  async post(url, data = {}) {
    try {
      const response = await httpClient.post(url, data);
      return response.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  },

  async put(url, data = {}) {
    try {
      const response = await httpClient.put(url, data);
      return response.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  },

  async delete(url) {
    try {
      const response = await httpClient.delete(url);
      return response.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  },

  // Manejo de errores
  handleError(error) {
    if (error.response) {
      switch (error.response.status) {
        case 401:
          eventBus.emit(EVENTS.AUTH_TOKEN_EXPIRED);
          break;
        case 403:
          eventBus.emit(EVENTS.SYSTEM_ERROR, {
            message: 'No tiene permisos para realizar esta acción'
          });
          break;
        case 404:
          eventBus.emit(EVENTS.SYSTEM_ERROR, {
            message: 'Recurso no encontrado'
          });
          break;
        case 500:
          eventBus.emit(EVENTS.SYSTEM_ERROR, {
            message: 'Error interno del servidor'
          });
          break;
        default:
          eventBus.emit(EVENTS.SYSTEM_ERROR, {
            message: error.response.data?.message || 'Error desconocido'
          });
      }
    } else {
      eventBus.emit(EVENTS.SYSTEM_ERROR, {
        message: 'Error de conexión con el servidor'
      });
    }
  }
};

// Exportar servicio base
export default apiService;

// Exportar instancia de httpClient para uso directo si es necesario
export { httpClient }; 