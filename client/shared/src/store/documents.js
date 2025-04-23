import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { documentService } from '@/services/documents/documentService'

export const useDocumentStore = defineStore('documents', () => {
  // State
  const documents = ref([])
  const currentDocument = ref(null)
  const isLoading = ref(false)
  const error = ref(null)
  const filters = ref({
    search: '',
    type: '',
    status: '',
    area: '',
    dateFrom: '',
    dateTo: ''
  })

  // Getters
  const filteredDocuments = computed(() => {
    return documents.value.filter(doc => {
      const matchesSearch = !filters.value.search || 
        doc.title.toLowerCase().includes(filters.value.search.toLowerCase()) ||
        doc.description.toLowerCase().includes(filters.value.search.toLowerCase())
      
      const matchesType = !filters.value.type || doc.type === filters.value.type
      const matchesStatus = !filters.value.status || doc.status === filters.value.status
      const matchesArea = !filters.value.area || doc.areaId === filters.value.area
      
      const matchesDate = !filters.value.dateFrom || !filters.value.dateTo ||
        (new Date(doc.createdAt) >= new Date(filters.value.dateFrom) &&
         new Date(doc.createdAt) <= new Date(filters.value.dateTo))

      return matchesSearch && matchesType && matchesStatus && matchesArea && matchesDate
    })
  })

  // Actions
  const setFilters = (newFilters) => {
    filters.value = { ...filters.value, ...newFilters }
  }

  const clearFilters = () => {
    filters.value = {
      search: '',
      type: '',
      status: '',
      area: '',
      dateFrom: '',
      dateTo: ''
    }
  }

  const fetchDocuments = async () => {
    isLoading.value = true
    error.value = null
    try {
      documents.value = await documentService.getDocuments(filters.value)
    } catch (err) {
      error.value = err.message
      console.error('Error fetching documents:', err)
    } finally {
      isLoading.value = false
    }
  }

  const fetchDocumentById = async (documentId) => {
    isLoading.value = true
    error.value = null
    try {
      currentDocument.value = await documentService.getDocumentById(documentId)
    } catch (err) {
      error.value = err.message
      console.error('Error fetching document:', err)
    } finally {
      isLoading.value = false
    }
  }

  const createDocument = async (documentData) => {
    isLoading.value = true
    error.value = null
    try {
      const newDocument = await documentService.createDocument(documentData)
      documents.value.push(newDocument)
      return newDocument
    } catch (err) {
      error.value = err.message
      console.error('Error creating document:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const updateDocument = async (documentId, documentData) => {
    isLoading.value = true
    error.value = null
    try {
      const updatedDocument = await documentService.updateDocument(documentId, documentData)
      const index = documents.value.findIndex(doc => doc.id === documentId)
      if (index !== -1) {
        documents.value[index] = updatedDocument
      }
      if (currentDocument.value?.id === documentId) {
        currentDocument.value = updatedDocument
      }
      return updatedDocument
    } catch (err) {
      error.value = err.message
      console.error('Error updating document:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const deriveDocument = async (documentId, derivationData) => {
    isLoading.value = true
    error.value = null
    try {
      const derivedDocument = await documentService.deriveDocument(documentId, derivationData)
      const index = documents.value.findIndex(doc => doc.id === documentId)
      if (index !== -1) {
        documents.value[index] = derivedDocument
      }
      if (currentDocument.value?.id === documentId) {
        currentDocument.value = derivedDocument
      }
      return derivedDocument
    } catch (err) {
      error.value = err.message
      console.error('Error deriving document:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const uploadAttachment = async (documentId, file) => {
    isLoading.value = true
    error.value = null
    try {
      const attachment = await documentService.uploadAttachment(documentId, file)
      if (currentDocument.value?.id === documentId) {
        if (!currentDocument.value.attachments) {
          currentDocument.value.attachments = []
        }
        currentDocument.value.attachments.push(attachment)
      }
      return attachment
    } catch (err) {
      error.value = err.message
      console.error('Error uploading attachment:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  return {
    // State
    documents,
    currentDocument,
    isLoading,
    error,
    filters,

    // Getters
    filteredDocuments,

    // Actions
    setFilters,
    clearFilters,
    fetchDocuments,
    fetchDocumentById,
    createDocument,
    updateDocument,
    deriveDocument,
    uploadAttachment
  }
}) 