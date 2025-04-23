import apiClient from '../api/http-client';

/**
 * Servicio para manejar notificaciones de mesa de partes
 */
const notificacionesService = {
  /**
   * Obtener notificaciones del usuario
   * @param {Object} filters - Filtros opcionales
   * @returns {Promise} - Respuesta con notificaciones
   */
  async getNotificaciones(filters = {}) {
    try {
      const response = await apiClient.get('/notifications', { params: filters });
      return response.data;
    } catch (error) {
      console.error('Error al obtener notificaciones:', error);
      throw error;
    }
  },

  /**
   * Marcar notificación como leída
   * @param {number} id - ID de la notificación
   * @returns {Promise} - Respuesta de confirmación
   */
  async marcarComoLeida(id) {
    try {
      const response = await apiClient.put(`/notifications/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error al marcar notificación como leída:', error);
      throw error;
    }
  },

  /**
   * Marcar todas las notificaciones como leídas
   * @returns {Promise} - Respuesta de confirmación
   */
  async marcarTodasComoLeidas() {
    try {
      const response = await apiClient.put('/notifications/leer-todas');
      return response.data;
    } catch (error) {
      console.error('Error al marcar todas las notificaciones como leídas:', error);
      throw error;
    }
  },

  /**
   * Eliminar notificación
   * @param {number} id - ID de la notificación
   * @returns {Promise} - Respuesta de confirmación
   */
  async eliminarNotificacion(id) {
    try {
      const response = await apiClient.delete(`/notifications/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error al eliminar notificación:', error);
      throw error;
    }
  },

  /**
   * Suscribirse a notificaciones en tiempo real
   * @param {Function} callback - Función a ejecutar cuando llegue una notificación
   * @returns {Function} - Función para cancelar la suscripción
   */
  suscribirANotificaciones(callback) {
    // Implementar WebSocket o SSE según la configuración del backend
    const ws = new WebSocket('ws://localhost:3000/ws/notifications');
    
    ws.onmessage = (event) => {
      const notification = JSON.parse(event.data);
      callback(notification);
    };

    return () => ws.close();
  },

  /**
   * Obtener configuración de notificaciones del usuario
   * @returns {Promise} - Respuesta con configuración
   */
  async getConfiguracionNotificaciones() {
    try {
      const response = await apiClient.get('/notifications/config');
      return response.data;
    } catch (error) {
      console.error('Error al obtener configuración de notificaciones:', error);
      throw error;
    }
  },

  /**
   * Actualizar configuración de notificaciones
   * @param {Object} config - Nueva configuración
   * @returns {Promise} - Respuesta de confirmación
   */
  async actualizarConfiguracionNotificaciones(config) {
    try {
      const response = await apiClient.put('/notifications/config', config);
      return response.data;
    } catch (error) {
      console.error('Error al actualizar configuración de notificaciones:', error);
      throw error;
    }
  }
};

export default notificacionesService; 