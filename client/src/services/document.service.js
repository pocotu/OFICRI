/**
 * Servicio de Documentos
 * Maneja todas las operaciones relacionadas con documentos
 */

import { apiClient } from './apiClient.js';
import { sessionManager } from './sessionManager.js';
import { errorHandler } from '../utils/errorHandler.js';

export class DocumentService {
    constructor() {
        this.baseUrl = '/api/documents';
    }

    /**
     * Obtiene todos los documentos con filtros opcionales
     * @param {Object} filters - Filtros para la consulta
     * @returns {Promise<Array>} Lista de documentos
     */
    async getAllDocuments(filters = {}) {
        try {
            const params = new URLSearchParams();
            for (const [key, value] of Object.entries(filters)) {
                if (value !== null && value !== undefined) {
                    params.append(key, value);
                }
            }

            const response = await apiClient.get(`${this.baseUrl}?${params.toString()}`);
            return response.data.documents || [];
        } catch (error) {
            console.error('[DOCUMENT-SERVICE] Error al obtener documentos:', error);
            throw error;
        }
    }

    /**
     * Obtiene un documento por su ID
     * @param {number} documentId - ID del documento
     * @returns {Promise<Object>} Documento
     */
    async getDocumentById(documentId) {
        try {
            const response = await apiClient.get(`${this.baseUrl}/${documentId}`);
            return response.data.document;
        } catch (error) {
            console.error('[DOCUMENT-SERVICE] Error al obtener documento:', error);
            throw error;
        }
    }

    /**
     * Crea un nuevo documento
     * @param {Object} documentData - Datos del documento
     * @returns {Promise<Object>} Documento creado
     */
    async createDocument(documentData) {
        try {
            const response = await apiClient.post(this.baseUrl, documentData);
            return response.data.document;
        } catch (error) {
            console.error('[DOCUMENT-SERVICE] Error al crear documento:', error);
            throw error;
        }
    }

    /**
     * Actualiza un documento existente
     * @param {number} documentId - ID del documento
     * @param {Object} documentData - Datos actualizados
     * @returns {Promise<Object>} Documento actualizado
     */
    async updateDocument(documentId, documentData) {
        try {
            const response = await apiClient.put(`${this.baseUrl}/${documentId}`, documentData);
            return response.data.document;
        } catch (error) {
            console.error('[DOCUMENT-SERVICE] Error al actualizar documento:', error);
            throw error;
        }
    }

    /**
     * Elimina un documento
     * @param {number} documentId - ID del documento
     * @returns {Promise<boolean>} Resultado de la operación
     */
    async deleteDocument(documentId) {
        try {
            await apiClient.delete(`${this.baseUrl}/${documentId}`);
            return true;
        } catch (error) {
            console.error('[DOCUMENT-SERVICE] Error al eliminar documento:', error);
            throw error;
        }
    }

    /**
     * Deriva un documento a otra área
     * @param {number} documentId - ID del documento
     * @param {Object} derivacionData - Datos de la derivación
     * @returns {Promise<Object>} Derivación creada
     */
    async deriveDocument(documentId, derivacionData) {
        try {
            const response = await apiClient.post(`${this.baseUrl}/${documentId}/derive`, derivacionData);
            return response.data.derivacion;
        } catch (error) {
            console.error('[DOCUMENT-SERVICE] Error al derivar documento:', error);
            throw error;
        }
    }

    /**
     * Obtiene el historial de un documento
     * @param {number} documentId - ID del documento
     * @returns {Promise<Array>} Historial del documento
     */
    async getDocumentHistory(documentId) {
        try {
            const response = await apiClient.get(`${this.baseUrl}/${documentId}/history`);
            return response.data.history;
        } catch (error) {
            console.error('[DOCUMENT-SERVICE] Error al obtener historial:', error);
            throw error;
        }
    }

    /**
     * Obtiene documentos por estado
     * @param {string} estado - Estado del documento
     * @returns {Promise<Array>} Lista de documentos
     */
    async getDocumentsByStatus(estado) {
        return this.getAllDocuments({ estado });
    }

    /**
     * Obtiene documentos por área
     * @param {number} areaId - ID del área
     * @returns {Promise<Array>} Lista de documentos
     */
    async getDocumentsByArea(areaId) {
        return this.getAllDocuments({ idAreaActual: areaId });
    }

    /**
     * Obtiene documentos asignados a un usuario
     * @param {number} userId - ID del usuario
     * @returns {Promise<Array>} Lista de documentos
     */
    async getDocumentsAssignedToUser(userId) {
        return this.getAllDocuments({ idUsuarioAsignado: userId });
    }

    /**
     * Exporta documentos según filtros
     * @param {Object} filters - Filtros para la exportación
     * @param {string} format - Formato de exportación
     * @returns {Promise<Blob>} Archivo exportado
     */
    async exportDocuments(filters, format = 'pdf') {
        try {
            const params = new URLSearchParams();
            for (const [key, value] of Object.entries(filters)) {
                if (value !== null && value !== undefined) {
                    params.append(key, value);
                }
            }
            params.append('format', format);

            const response = await apiClient.get(`${this.baseUrl}/export?${params.toString()}`, {
                responseType: 'blob'
            });
            return response.data;
        } catch (error) {
            console.error('[DOCUMENT-SERVICE] Error al exportar documentos:', error);
            throw error;
        }
    }
}

// Exportar instancia única
export const documentService = new DocumentService();

// Exportar clase para pruebas
export default DocumentService; 