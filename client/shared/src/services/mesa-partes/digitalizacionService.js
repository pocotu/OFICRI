import axios from 'axios';

const BASE_URL = 'http://localhost:3000/api';

/**
 * Servicio para manejar la digitalización de documentos
 */
const digitalizacionService = {
  /**
   * Subir documento digitalizado
   * @param {FormData} formData - Datos del documento y archivo
   * @returns {Promise} - Respuesta con información del documento digitalizado
   */
  async subirDocumento(formData) {
    try {
      const response = await axios.post(`${BASE_URL}/digitalizacion/subir`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error al subir documento digitalizado:', error);
      throw error;
    }
  },

  /**
   * Obtener metadatos de digitalización
   * @param {number} idDocumento - ID del documento
   * @returns {Promise} - Respuesta con metadatos
   */
  async getMetadatos(idDocumento) {
    try {
      const response = await axios.get(`${BASE_URL}/digitalizacion/${idDocumento}/metadatos`);
      return response.data;
    } catch (error) {
      console.error('Error al obtener metadatos:', error);
      throw error;
    }
  },

  /**
   * Actualizar metadatos de digitalización
   * @param {number} idDocumento - ID del documento
   * @param {Object} metadatos - Nuevos metadatos
   * @returns {Promise} - Respuesta de confirmación
   */
  async actualizarMetadatos(idDocumento, metadatos) {
    try {
      const response = await axios.put(`${BASE_URL}/digitalizacion/${idDocumento}/metadatos`, metadatos);
      return response.data;
    } catch (error) {
      console.error('Error al actualizar metadatos:', error);
      throw error;
    }
  },

  /**
   * Obtener previsualización del documento
   * @param {number} idDocumento - ID del documento
   * @returns {Promise} - Respuesta con URL de previsualización
   */
  async getPrevisualizacion(idDocumento) {
    try {
      const response = await axios.get(`${BASE_URL}/digitalizacion/${idDocumento}/previsualizacion`);
      return response.data;
    } catch (error) {
      console.error('Error al obtener previsualización:', error);
      throw error;
    }
  },

  /**
   * Validar calidad de digitalización
   * @param {number} idDocumento - ID del documento
   * @returns {Promise} - Respuesta con resultados de validación
   */
  async validarCalidad(idDocumento) {
    try {
      const response = await axios.get(`${BASE_URL}/digitalizacion/${idDocumento}/validar`);
      return response.data;
    } catch (error) {
      console.error('Error al validar calidad:', error);
      throw error;
    }
  },

  /**
   * Obtener configuración de digitalización
   * @returns {Promise} - Respuesta con configuración
   */
  async getConfiguracion() {
    try {
      const response = await axios.get(`${BASE_URL}/digitalizacion/config`);
      return response.data;
    } catch (error) {
      console.error('Error al obtener configuración:', error);
      throw error;
    }
  },

  /**
   * Actualizar configuración de digitalización
   * @param {Object} config - Nueva configuración
   * @returns {Promise} - Respuesta de confirmación
   */
  async actualizarConfiguracion(config) {
    try {
      const response = await axios.put(`${BASE_URL}/digitalizacion/config`, config);
      return response.data;
    } catch (error) {
      console.error('Error al actualizar configuración:', error);
      throw error;
    }
  },

  /**
   * Obtener historial de digitalización
   * @param {number} idDocumento - ID del documento
   * @returns {Promise} - Respuesta con historial
   */
  async getHistorial(idDocumento) {
    try {
      const response = await axios.get(`${BASE_URL}/digitalizacion/${idDocumento}/historial`);
      return response.data;
    } catch (error) {
      console.error('Error al obtener historial:', error);
      throw error;
    }
  },

  /**
   * Descarga el documento original
   * @param {string} documentoId - ID del documento
   * @returns {Promise<Blob>} Contenido del documento
   */
  async descargarDocumento(documentoId) {
    try {
      const response = await axios.get(`${BASE_URL}/digitalizacion/${documentoId}/descargar`, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      console.error('Error al descargar documento:', error);
      throw error;
    }
  },

  /**
   * Actualiza la calidad de un documento digitalizado
   * @param {string} documentoId - ID del documento
   * @param {Object} calidadData - Datos de calidad
   * @returns {Promise<Object>} Documento actualizado
   */
  async actualizarCalidad(documentoId, calidadData) {
    try {
      const response = await axios.put(
        `${BASE_URL}/digitalizacion/${documentoId}/calidad`,
        calidadData
      );
      return response.data;
    } catch (error) {
      console.error('Error al actualizar calidad:', error);
      throw error;
    }
  }
};

export default digitalizacionService; 