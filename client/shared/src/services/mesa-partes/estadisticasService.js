import apiClient from '../api/http-client';

/**
 * Servicio para manejar estadísticas de mesa de partes
 */
const estadisticasService = {
  /**
   * Obtener estadísticas generales de mesa de partes
   * @param {Object} filters - Filtros opcionales
   * @returns {Promise} - Respuesta con estadísticas
   */
  async getEstadisticasGenerales(filters = {}) {
    try {
      const response = await apiClient.get('/mesa-partes/estadisticas', { params: filters });
      return response.data;
    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
      throw error;
    }
  },

  /**
   * Obtener tiempo promedio de atención por área
   * @param {Object} filters - Filtros opcionales
   * @returns {Promise} - Respuesta con tiempos de atención
   */
  async getTiempoAtencionPorArea(filters = {}) {
    try {
      const response = await apiClient.get('/mesa-partes/estadisticas/tiempo-atencion', { params: filters });
      return response.data;
    } catch (error) {
      console.error('Error al obtener tiempos de atención:', error);
      throw error;
    }
  },

  /**
   * Obtener documentos pendientes por área
   * @param {Object} filters - Filtros opcionales
   * @returns {Promise} - Respuesta con documentos pendientes
   */
  async getDocumentosPendientesPorArea(filters = {}) {
    try {
      const response = await apiClient.get('/mesa-partes/estadisticas/pendientes', { params: filters });
      return response.data;
    } catch (error) {
      console.error('Error al obtener documentos pendientes:', error);
      throw error;
    }
  },

  /**
   * Obtener estadísticas de derivaciones
   * @param {Object} filters - Filtros opcionales
   * @returns {Promise} - Respuesta con estadísticas de derivaciones
   */
  async getEstadisticasDerivaciones(filters = {}) {
    try {
      const response = await apiClient.get('/mesa-partes/estadisticas/derivaciones', { params: filters });
      return response.data;
    } catch (error) {
      console.error('Error al obtener estadísticas de derivaciones:', error);
      throw error;
    }
  },

  /**
   * Exportar estadísticas a Excel
   * @param {Object} filters - Filtros opcionales
   * @returns {Promise} - Respuesta con archivo Excel
   */
  async exportarEstadisticasExcel(filters = {}) {
    try {
      const response = await apiClient.get('/mesa-partes/estadisticas/exportar', {
        params: filters,
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      console.error('Error al exportar estadísticas:', error);
      throw error;
    }
  },

  /**
   * Obtener alertas de documentos próximos a vencer
   * @param {Object} filters - Filtros opcionales
   * @returns {Promise} - Respuesta con alertas
   */
  async getAlertasVencimiento(filters = {}) {
    try {
      const response = await apiClient.get('/mesa-partes/estadisticas/alertas', { params: filters });
      return response.data;
    } catch (error) {
      console.error('Error al obtener alertas:', error);
      throw error;
    }
  }
};

export default estadisticasService; 