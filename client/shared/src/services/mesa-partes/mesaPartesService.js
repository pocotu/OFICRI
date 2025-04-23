import apiClient from '@/services/api';

/**
 * Servicio para manejar las operaciones de mesa de partes
 */
const mesaPartesService = {
  /**
   * Obtener lista de mesas de partes con paginación
   * @param {Object} filters - Filtros opcionales
   * @param {number} filters.page - Número de página
   * @param {number} filters.limit - Elementos por página
   * @param {string} filters.sort - Campo para ordenamiento
   * @param {string} filters.order - Dirección (asc/desc)
   * @returns {Promise} - Respuesta con lista de mesas de partes
   */
  async getMesasPartes(filters = {}, pagination = {}) {
    try {
      const { page = 1, limit = 10, sort = 'id', order = 'asc' } = pagination;
      const response = await apiClient.get('/mesa-partes', {
        params: {
          ...filters,
          page,
          limit,
          sort,
          order
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error al obtener mesas de partes:', error);
      throw error;
    }
  },

  /**
   * Obtener una mesa de partes por ID
   * @param {number} id - ID de la mesa de partes
   * @returns {Promise} - Respuesta con datos de la mesa de partes
   */
  async getMesaPartesById(id) {
    try {
      const response = await apiClient.get(`/mesa-partes/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error al obtener mesa de partes:', error);
      throw error;
    }
  },

  /**
   * Crear una nueva mesa de partes
   * @param {Object} mesaPartesData - Datos de la mesa de partes
   * @returns {Promise} - Respuesta con mesa de partes creada
   */
  async createMesaPartes(mesaPartesData) {
    try {
      const response = await apiClient.post('/mesa-partes', mesaPartesData);
      return response.data;
    } catch (error) {
      console.error('Error al crear mesa de partes:', error);
      throw error;
    }
  },

  /**
   * Actualizar una mesa de partes existente
   * @param {number} id - ID de la mesa de partes
   * @param {Object} mesaPartesData - Datos actualizados
   * @returns {Promise} - Respuesta con mesa de partes actualizada
   */
  async updateMesaPartes(id, mesaPartesData) {
    try {
      const response = await apiClient.put(`/mesa-partes/${id}`, mesaPartesData);
      return response.data;
    } catch (error) {
      console.error('Error al actualizar mesa de partes:', error);
      throw error;
    }
  },

  /**
   * Obtener lista de documentos recibidos con filtros
   * @param {Object} filters - Filtros opcionales
   * @param {string} filters.search - Buscar por texto
   * @param {string} filters.estado - Estado del documento
   * @param {string} filters.fechaDesde - Fecha de inicio
   * @param {string} filters.fechaHasta - Fecha de fin
   * @param {number} filters.idArea - ID del área
   * @param {string} filters.tipoDocumento - Tipo de documento
   * @param {string} filters.prioridad - Nivel de prioridad
   * @returns {Promise} - Respuesta con lista de documentos recibidos
   */
  async getRecepciones(filters = {}, pagination = {}) {
    try {
      const { page = 1, limit = 10, sort = 'fechaRecepcion', order = 'desc' } = pagination;
      const response = await apiClient.get('/mesa-partes/recepciones', {
        params: {
          ...filters,
          page,
          limit,
          sort,
          order
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error al obtener recepciones:', error);
      throw error;
    }
  },

  /**
   * Registrar recepción de documento
   * @param {Object} recepcionData - Datos de la recepción
   * @returns {Promise} - Respuesta con recepción registrada
   */
  async registrarRecepcion(recepcionData) {
    try {
      const response = await apiClient.post('/mesa-partes/recepcion', recepcionData);
      return response.data;
    } catch (error) {
      console.error('Error al registrar recepción:', error);
      throw error;
    }
  },

  /**
   * Obtener lista de documentos pendientes de derivar
   * @param {Object} filters - Filtros opcionales
   * @returns {Promise} - Respuesta con lista de documentos pendientes
   */
  async getPendientes(filters = {}, pagination = {}) {
    try {
      const { page = 1, limit = 10, sort = 'fechaRecepcion', order = 'asc' } = pagination;
      const response = await apiClient.get('/mesa-partes/pendientes', {
        params: {
          ...filters,
          page,
          limit,
          sort,
          order
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error al obtener documentos pendientes:', error);
      throw error;
    }
  },

  /**
   * Obtener estadísticas de mesa de partes
   * @param {Object} filters - Filtros opcionales
   * @returns {Promise} - Respuesta con estadísticas
   */
  async getEstadisticas(filters = {}) {
    try {
      const response = await apiClient.get('/mesa-partes/estadisticas', {
        params: filters
      });
      return response.data;
    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
      throw error;
    }
  },

  async getHistorialDerivaciones(documentoId, pagination = {}) {
    try {
      const { page = 1, limit = 10, sort = 'fechaDerivacion', order = 'desc' } = pagination;
      const response = await apiClient.get(`/documents/${documentoId}/historico`, {
        params: {
          page,
          limit,
          sort,
          order
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error al obtener historial de derivaciones:', error);
      throw error;
    }
  },

  async derivarDocumento(documentoId, derivacionData) {
    try {
      const response = await apiClient.post(`/documents/${documentoId}/derivar`, derivacionData);
      return response.data;
    } catch (error) {
      console.error('Error al derivar documento:', error);
      throw error;
    }
  },

  async exportarDocumentos(filters = {}, formato = 'excel') {
    try {
      const response = await apiClient.post('/documents/exportar', {
        ...filters,
        formato
      }, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      console.error('Error al exportar documentos:', error);
      throw error;
    }
  }
};

export default mesaPartesService; 