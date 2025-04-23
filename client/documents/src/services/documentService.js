import axios from 'axios'

const API_URL = process.env.VUE_APP_API_URL || '/api'

export const documentService = {
  async getDocuments(params = {}) {
    const response = await axios.get(`${API_URL}/documents`, { params })
    return response.data
  },

  async getDocumentById(id) {
    const response = await axios.get(`${API_URL}/documents/${id}`)
    return response.data
  },

  async createDocument(documentData) {
    const response = await axios.post(`${API_URL}/documents`, documentData)
    return response.data
  },

  async updateDocument(id, documentData) {
    const response = await axios.put(`${API_URL}/documents/${id}`, documentData)
    return response.data
  },

  async deleteDocument(id) {
    const response = await axios.delete(`${API_URL}/documents/${id}`)
    return response.data
  },

  async deriveDocument(derivationData) {
    const response = await axios.post(`${API_URL}/documents/derive`, derivationData)
    return response.data
  },

  async getDocumentDerivations(documentId) {
    const response = await axios.get(`${API_URL}/documents/${documentId}/derivations`)
    return response.data
  },

  async uploadAttachment(documentId, file) {
    const formData = new FormData()
    formData.append('file', file)
    
    const response = await axios.post(
      `${API_URL}/documents/${documentId}/attachments`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      }
    )
    return response.data
  },

  async deleteAttachment(documentId, attachmentId) {
    const response = await axios.delete(
      `${API_URL}/documents/${documentId}/attachments/${attachmentId}`
    )
    return response.data
  },

  async updateDerivationStatus(derivationId, status) {
    const response = await axios.patch(
      `${API_URL}/derivations/${derivationId}/status`,
      { status }
    )
    return response.data
  },

  async getDocumentHistory(documentId) {
    const response = await axios.get(`${API_URL}/documents/${documentId}/history`)
    return response.data
  },

  async searchDocuments(query) {
    const response = await axios.get(`${API_URL}/documents/search`, {
      params: { q: query }
    })
    return response.data
  },

  async getDocumentStats() {
    const response = await axios.get(`${API_URL}/documents/stats`)
    return response.data
  }
} 