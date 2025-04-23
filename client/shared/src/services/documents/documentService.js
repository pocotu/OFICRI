import { httpClient } from '../api/httpClient'
import { auditService } from '../security/auditService'
import { sanitizationService } from '../security/sanitizationService'
import { versionService } from './versionService'

const API_BASE_URL = '/api/documents'

// Tipos de errores de negocio
export const DOCUMENT_ERROR_TYPES = {
  NOT_FOUND: 'DOCUMENT_NOT_FOUND',
  UNAUTHORIZED: 'UNAUTHORIZED_ACCESS',
  INVALID_STATE: 'INVALID_STATE',
  VERSION_ERROR: 'VERSION_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  BUSINESS_RULE_VIOLATION: 'BUSINESS_RULE_VIOLATION'
}

export const documentService = {
  /**
   * Obtiene una lista de documentos con filtros opcionales
   * @param {Object} filters - Filtros de búsqueda
   * @returns {Promise<Array>} Lista de documentos
   */
  async getDocuments(filters = {}) {
    try {
      // Sanitizar filtros
      const sanitizedFilters = sanitizationService.sanitizeQueryParams(filters)
      
      const response = await httpClient.get(API_BASE_URL, { params: sanitizedFilters })
      return response.data
    } catch (error) {
      this._handleError(error, 'Error al obtener documentos')
      throw error
    }
  },

  /**
   * Obtiene un documento por su ID
   * @param {string} documentId - ID del documento
   * @returns {Promise<Object>} Documento
   */
  async getDocumentById(documentId) {
    try {
      const response = await httpClient.get(`${API_BASE_URL}/${documentId}`)
      return response.data
    } catch (error) {
      this._handleError(error, 'Error al obtener documento')
      throw error
    }
  },

  /**
   * Crea un nuevo documento
   * @param {Object} documentData - Datos del documento
   * @returns {Promise<Object>} Documento creado
   */
  async createDocument(documentData) {
    try {
      // Sanitizar datos del documento
      const sanitizedData = sanitizationService.sanitizeDocumentData(documentData)
      
      const response = await httpClient.post(API_BASE_URL, sanitizedData)
      
      // Crear versión inicial
      await versionService.createVersion(
        response.data.id,
        response.data,
        'Versión inicial del documento'
      )
      
      // Registrar en auditoría
      await auditService.logEvent(
        'DOCUMENT_CREATE',
        `Creación de documento: ${response.data.titulo}`,
        'INFO',
        { documentId: response.data.id }
      )
      
      return response.data
    } catch (error) {
      this._handleError(error, 'Error al crear documento')
      throw error
    }
  },

  /**
   * Actualiza un documento existente
   * @param {string} documentId - ID del documento
   * @param {Object} documentData - Datos actualizados
   * @returns {Promise<Object>} Documento actualizado
   */
  async updateDocument(documentId, documentData) {
    try {
      // Sanitizar datos del documento
      const sanitizedData = sanitizationService.sanitizeDocumentData(documentData)
      
      const response = await httpClient.put(`${API_BASE_URL}/${documentId}`, sanitizedData)
      
      // Crear nueva versión
      await versionService.createVersion(
        documentId,
        response.data,
        documentData.description || 'Actualización de documento'
      )
      
      // Registrar en auditoría
      await auditService.logEvent(
        'DOCUMENT_UPDATE',
        `Actualización de documento: ${response.data.titulo}`,
        'INFO',
        { documentId }
      )
      
      return response.data
    } catch (error) {
      this._handleError(error, 'Error al actualizar documento')
      throw error
    }
  },

  /**
   * Elimina un documento
   * @param {string} documentId - ID del documento
   * @returns {Promise<Object>} Resultado de la eliminación
   */
  async deleteDocument(documentId) {
    try {
      const response = await httpClient.delete(`${API_BASE_URL}/${documentId}`)
      
      // Registrar en auditoría
      await auditService.logEvent(
        'DOCUMENT_DELETE',
        `Eliminación de documento ID: ${documentId}`,
        'WARNING',
        { documentId }
      )
      
      return response.data
    } catch (error) {
      this._handleError(error, 'Error al eliminar documento')
      throw error
    }
  },

  /**
   * Deriva un documento a otra área
   * @param {string} documentId - ID del documento
   * @param {Object} derivationData - Datos de la derivación
   * @returns {Promise<Object>} Documento derivado
   */
  async deriveDocument(documentId, derivationData) {
    try {
      // Sanitizar datos de derivación
      const sanitizedData = sanitizationService.sanitizeObject(derivationData)
      
      const response = await httpClient.post(
        `${API_BASE_URL}/${documentId}/derive`,
        sanitizedData
      )
      
      // Registrar en auditoría
      await auditService.logEvent(
        'DOCUMENT_DERIVE',
        `Derivación de documento ID: ${documentId} a área: ${derivationData.areaDestino}`,
        'INFO',
        { documentId, ...derivationData }
      )
      
      return response.data
    } catch (error) {
      this._handleError(error, 'Error al derivar documento')
      throw error
    }
  },

  /**
   * Sube un archivo adjunto a un documento
   * @param {string} documentId - ID del documento
   * @param {File} file - Archivo a subir
   * @returns {Promise<Object>} Archivo subido
   */
  async uploadAttachment(documentId, file) {
    try {
      const formData = new FormData()
      formData.append('file', file)
      
      const response = await httpClient.post(
        `${API_BASE_URL}/${documentId}/attachments`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      )
      
      // Registrar en auditoría
      await auditService.logEvent(
        'DOCUMENT_ATTACHMENT_UPLOAD',
        `Subida de archivo adjunto a documento ID: ${documentId}`,
        'INFO',
        { documentId, fileName: file.name }
      )
      
      return response.data
    } catch (error) {
      this._handleError(error, 'Error al subir archivo')
      throw error
    }
  },

  /**
   * Obtiene los archivos adjuntos de un documento
   * @param {string} documentId - ID del documento
   * @returns {Promise<Array>} Lista de archivos adjuntos
   */
  async getAttachments(documentId) {
    try {
      const response = await httpClient.get(`${API_BASE_URL}/${documentId}/attachments`)
      return response.data
    } catch (error) {
      this._handleError(error, 'Error al obtener archivos adjuntos')
      throw error
    }
  },

  /**
   * Obtiene los documentos pendientes del usuario
   * @param {Object} filters - Filtros opcionales
   * @returns {Promise<Array>} Lista de documentos pendientes
   */
  async getPendingDocuments(filters = {}) {
    try {
      const sanitizedFilters = sanitizationService.sanitizeQueryParams(filters)
      const response = await httpClient.get(`${API_BASE_URL}/pendientes`, { params: sanitizedFilters })
      
      await auditService.logEvent(
        'DOCUMENT_LIST_PENDING',
        'Consulta de documentos pendientes',
        'INFO'
      )
      
      return response.data
    } catch (error) {
      this._handleError(error, 'Error al obtener documentos pendientes')
      throw error
    }
  },

  /**
   * Exporta documentos a Excel o PDF
   * @param {string} format - Formato de exportación ('excel' o 'pdf')
   * @param {Object} filters - Filtros para los documentos a exportar
   * @returns {Promise<Blob>} Archivo exportado
   */
  async exportDocuments(format = 'excel', filters = {}) {
    try {
      const sanitizedFilters = sanitizationService.sanitizeQueryParams(filters)
      const response = await httpClient.post(
        `${API_BASE_URL}/exportar`,
        { format, ...sanitizedFilters },
        { responseType: 'blob' }
      )
      
      await auditService.logEvent(
        'DOCUMENT_EXPORT',
        `Exportación de documentos a ${format}`,
        'INFO',
        { format, filters }
      )
      
      return response.data
    } catch (error) {
      this._handleError(error, 'Error al exportar documentos')
      throw error
    }
  },

  /**
   * Maneja errores del servicio de documentos
   * @private
   * @param {Error} error - Error original
   * @param {string} defaultMessage - Mensaje por defecto
   */
  _handleError(error, defaultMessage) {
    // Registrar error en auditoría
    auditService.logEvent(
      'DOCUMENT_SERVICE_ERROR',
      defaultMessage,
      'ERROR',
      {
        error: error.message,
        code: error.response?.status,
        data: error.response?.data
      }
    )

    // Determinar tipo de error de negocio
    if (error.response) {
      switch (error.response.status) {
        case 404:
          error.type = DOCUMENT_ERROR_TYPES.NOT_FOUND
          break
        case 403:
          error.type = DOCUMENT_ERROR_TYPES.UNAUTHORIZED
          break
        case 422:
          error.type = DOCUMENT_ERROR_TYPES.VALIDATION_ERROR
          break
        case 409:
          error.type = DOCUMENT_ERROR_TYPES.BUSINESS_RULE_VIOLATION
          break
        default:
          if (error.response.data?.type) {
            error.type = error.response.data.type
          }
      }
    }

    console.error(defaultMessage, error)
  }
}

export default documentService 