import { httpClient } from '../api/httpClient'
import { auditService } from '../security/auditService'
import { documentService } from './documentService'

const API_BASE_URL = '/api/documents'
const VERSION_LIMIT = 10 // Máximo de versiones por documento
const PURGE_AFTER_DAYS = 90 // Días después de los cuales se purgan versiones

export const versionService = {
  /**
   * Obtiene el historial de versiones de un documento
   * @param {string} documentId - ID del documento
   * @returns {Promise<Array>} Lista de versiones
   */
  async getVersionHistory(documentId) {
    try {
      const response = await httpClient.get(`${API_BASE_URL}/${documentId}/versions`)
      return response.data
    } catch (error) {
      console.error('Error al obtener historial de versiones:', error)
      throw error
    }
  },

  /**
   * Obtiene una versión específica de un documento
   * @param {string} documentId - ID del documento
   * @param {string} versionId - ID de la versión
   * @returns {Promise<Object>} Versión del documento
   */
  async getVersion(documentId, versionId) {
    try {
      const response = await httpClient.get(`${API_BASE_URL}/${documentId}/versions/${versionId}`)
      return response.data
    } catch (error) {
      console.error('Error al obtener versión:', error)
      throw error
    }
  },

  /**
   * Compara dos versiones de un documento
   * @param {string} documentId - ID del documento
   * @param {string} versionId1 - ID de la primera versión
   * @param {string} versionId2 - ID de la segunda versión
   * @returns {Promise<Object>} Diferencias entre versiones
   */
  async compareVersions(documentId, versionId1, versionId2) {
    try {
      const response = await httpClient.get(
        `${API_BASE_URL}/${documentId}/versions/compare`, 
        { params: { version1: versionId1, version2: versionId2 } }
      )
      return response.data
    } catch (error) {
      console.error('Error al comparar versiones:', error)
      throw error
    }
  },

  /**
   * Restaura una versión anterior del documento
   * @param {string} documentId - ID del documento
   * @param {string} versionId - ID de la versión a restaurar
   * @returns {Promise<Object>} Documento restaurado
   */
  async restoreVersion(documentId, versionId) {
    try {
      const response = await httpClient.post(
        `${API_BASE_URL}/${documentId}/versions/${versionId}/restore`
      )
      
      // Registrar la restauración en la auditoría
      await auditService.logEvent(
        'DOCUMENT_VERSION_RESTORE',
        `Restauración de versión ${versionId} del documento ${documentId}`,
        'INFO',
        { documentId, versionId }
      )
      
      return response.data
    } catch (error) {
      console.error('Error al restaurar versión:', error)
      throw error
    }
  },

  /**
   * Crea una nueva versión del documento
   * @param {string} documentId - ID del documento
   * @param {Object} documentData - Datos del documento
   * @param {string} description - Descripción del cambio
   * @returns {Promise<Object>} Nueva versión del documento
   */
  async createVersion(documentId, documentData, description) {
    try {
      const response = await httpClient.post(
        `${API_BASE_URL}/${documentId}/versions`,
        { ...documentData, description }
      )
      
      // Registrar la creación en la auditoría
      await auditService.logEvent(
        'DOCUMENT_VERSION_CREATE',
        `Creación de nueva versión del documento ${documentId}`,
        'INFO',
        { documentId, description }
      )
      
      return response.data
    } catch (error) {
      console.error('Error al crear versión:', error)
      throw error
    }
  },

  /**
   * Verifica y aplica el límite de versiones
   * @param {string} documentId - ID del documento
   * @private
   */
  async _enforceVersionLimit(documentId) {
    try {
      const versions = await this.getVersionHistory(documentId)
      if (versions.length > VERSION_LIMIT) {
        const versionsToDelete = versions
          .slice(VERSION_LIMIT)
          .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
        
        for (const version of versionsToDelete) {
          await this.deleteVersion(documentId, version.id)
        }
        
        await auditService.logEvent(
          'VERSION_LIMIT_ENFORCED',
          `Se eliminaron ${versionsToDelete.length} versiones antiguas`,
          'INFO',
          { documentId }
        )
      }
    } catch (error) {
      this._handleError(error, 'Error al aplicar límite de versiones')
    }
  },

  /**
   * Purga versiones antiguas de todos los documentos
   */
  async purgeOldVersions() {
    try {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - PURGE_AFTER_DAYS)
      
      const documents = await documentService.getAllDocuments()
      
      for (const doc of documents) {
        const versions = await this.getVersionHistory(doc.id)
        const oldVersions = versions.filter(v => new Date(v.createdAt) < cutoffDate)
        
        for (const version of oldVersions) {
          await this.deleteVersion(doc.id, version.id)
        }
        
        if (oldVersions.length > 0) {
          await auditService.logEvent(
            'VERSION_PURGE',
            `Se purgaron ${oldVersions.length} versiones antiguas`,
            'INFO',
            { documentId: doc.id }
          )
        }
      }
    } catch (error) {
      this._handleError(error, 'Error al purgar versiones antiguas')
    }
  }
}

export default versionService 