import { defineStore } from 'pinia'
import axios from 'axios'

export const useDocumentStore = defineStore('documents', {
  state: () => ({
    documents: [],
    currentDocument: null,
    derivations: [],
    isLoading: false,
    error: null
  }),

  getters: {
    getDocumentById: (state) => (id) => {
      return state.documents.find(doc => doc.IDDocumento === id)
    },
    
    getDerivationsByDocument: (state) => (documentId) => {
      return state.derivations.filter(der => der.IDDocumento === documentId)
    }
  },

  actions: {
    async fetchDocuments() {
      this.isLoading = true
      try {
        const response = await axios.get('/api/documents')
        this.documents = response.data
      } catch (error) {
        this.error = error.message
        throw error
      } finally {
        this.isLoading = false
      }
    },

    async fetchDocumentById(id) {
      this.isLoading = true
      try {
        const response = await axios.get(`/api/documents/${id}`)
        this.currentDocument = response.data
        return response.data
      } catch (error) {
        this.error = error.message
        throw error
      } finally {
        this.isLoading = false
      }
    },

    async deriveDocument(derivationData) {
      this.isLoading = true
      try {
        const response = await axios.post('/api/documents/derive', derivationData)
        
        // Actualizar el documento actual
        if (this.currentDocument?.IDDocumento === derivationData.IDDocumento) {
          this.currentDocument = response.data.document
        }
        
        // Agregar la nueva derivación al historial
        this.derivations.unshift(response.data.derivation)
        
        return response.data
      } catch (error) {
        this.error = error.message
        throw error
      } finally {
        this.isLoading = false
      }
    },

    async getDocumentDerivations(documentId) {
      this.isLoading = true
      try {
        const response = await axios.get(`/api/documents/${documentId}/derivations`)
        this.derivations = response.data
        return response.data
      } catch (error) {
        this.error = error.message
        throw error
      } finally {
        this.isLoading = false
      }
    },

    async uploadAttachment(documentId, file) {
      this.isLoading = true
      try {
        const formData = new FormData()
        formData.append('file', file)
        
        const response = await axios.post(
          `/api/documents/${documentId}/attachments`,
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          }
        )
        
        return response.data
      } catch (error) {
        this.error = error.message
        throw error
      } finally {
        this.isLoading = false
      }
    },

    async updateDerivationStatus(derivationId, status) {
      this.isLoading = true
      try {
        const response = await axios.patch(
          `/api/derivations/${derivationId}/status`,
          { status }
        )
        
        // Actualizar la derivación en el estado
        const index = this.derivations.findIndex(d => d.IDDerivacion === derivationId)
        if (index !== -1) {
          this.derivations[index] = response.data
        }
        
        return response.data
      } catch (error) {
        this.error = error.message
        throw error
      } finally {
        this.isLoading = false
      }
    },

    clearError() {
      this.error = null
    }
  }
}) 