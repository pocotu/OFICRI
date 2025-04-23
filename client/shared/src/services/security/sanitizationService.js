import DOMPurify from 'dompurify'
import { auditService } from './auditService'

const ALLOWED_FILE_TYPES = [
  // Documentos
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  // Imágenes
  'image/jpeg',
  'image/png',
  'image/gif',
  // Otros
  'text/plain',
  'application/zip'
]

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

export const sanitizationService = {
  /**
   * Sanitiza texto HTML
   * @param {string} html - Texto HTML a sanitizar
   * @returns {string} HTML sanitizado
   */
  sanitizeHTML(html) {
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: ['p', 'b', 'i', 'em', 'strong', 'a', 'ul', 'ol', 'li'],
      ALLOWED_ATTR: ['href', 'target']
    })
  },

  /**
   * Sanitiza datos de documento
   * @param {Object} documentData - Datos del documento a sanitizar
   * @returns {Object} Datos sanitizados
   */
  sanitizeDocumentData(documentData) {
    const sanitized = {}
    
    // Sanitizar campos de texto
    if (documentData.titulo) {
      sanitized.titulo = this.sanitizeText(documentData.titulo)
    }
    if (documentData.descripcion) {
      sanitized.descripcion = this.sanitizeHTML(documentData.descripcion)
    }
    if (documentData.observaciones) {
      sanitized.observaciones = this.sanitizeText(documentData.observaciones)
    }
    
    // Mantener campos numéricos y fechas sin cambios
    if (documentData.estado) {
      sanitized.estado = documentData.estado
    }
    if (documentData.fechaCreacion) {
      sanitized.fechaCreacion = documentData.fechaCreacion
    }
    if (documentData.idArea) {
      sanitized.idArea = documentData.idArea
    }
    
    // Sanitizar arrays si existen
    if (Array.isArray(documentData.etiquetas)) {
      sanitized.etiquetas = documentData.etiquetas.map(tag => this.sanitizeText(tag))
    }
    
    return sanitized
  },

  /**
   * Sanitiza texto plano
   * @param {string} text - Texto a sanitizar
   * @returns {string} Texto sanitizado
   */
  sanitizeText(text) {
    if (!text) return text
    
    // Eliminar caracteres especiales y scripts
    return text
      .replace(/<[^>]*>/g, '') // Eliminar tags HTML
      .replace(/[^\w\s.,!?-]/g, '') // Permitir solo caracteres seguros
      .trim()
  },

  /**
   * Sanitiza un objeto completo recursivamente
   * @param {Object} data - Objeto a sanitizar
   * @returns {Object} Objeto sanitizado
   */
  sanitizeObject(data) {
    if (!data) return data
    
    const sanitized = {}
    
    for (const [key, value] of Object.entries(data)) {
      if (typeof value === 'string') {
        sanitized[key] = this.sanitizeText(value)
      } else if (Array.isArray(value)) {
        sanitized[key] = value.map(item => 
          typeof item === 'string' ? this.sanitizeText(item) : this.sanitizeObject(item)
        )
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.sanitizeObject(value)
      } else {
        sanitized[key] = value
      }
    }
    
    return sanitized
  },

  /**
   * Sanitiza parámetros de consulta
   * @param {Object} queryParams - Parámetros de consulta
   * @returns {Object} Parámetros sanitizados
   */
  sanitizeQueryParams(queryParams) {
    const sanitized = {}
    
    for (const [key, value] of Object.entries(queryParams)) {
      if (typeof value === 'string') {
        // Sanitizar y validar parámetros comunes
        switch (key) {
          case 'search':
            sanitized[key] = this.sanitizeText(value)
            break
          case 'sort':
            sanitized[key] = /^[\w.-]+$/.test(value) ? value : 'id'
            break
          case 'order':
            sanitized[key] = ['asc', 'desc'].includes(value.toLowerCase()) ? value.toLowerCase() : 'asc'
            break
          case 'page':
          case 'limit':
            const num = parseInt(value)
            sanitized[key] = !isNaN(num) && num > 0 ? num : 1
            break
          default:
            sanitized[key] = this.sanitizeText(value)
        }
      } else {
        sanitized[key] = value
      }
    }
    
    return sanitized
  },

  /**
   * Sanitiza y valida un CIP
   * @param {string} cip - Código de Identificación Policial
   * @returns {string|null} CIP sanitizado o null si es inválido
   */
  sanitizeCIP(cip) {
    if (!cip) return null
    
    // Eliminar espacios y caracteres no numéricos
    const sanitized = cip.replace(/[^\d]/g, '')
    
    // Validar formato (8 dígitos)
    if (!/^\d{8}$/.test(sanitized)) {
      auditService.logSecurityViolation(
        'Intento de uso de CIP con formato inválido',
        { cip: sanitized }
      )
      return null
    }
    
    return sanitized
  },

  /**
   * Valida el tipo y tamaño de un archivo
   * @param {File} file - Archivo a validar
   * @throws {Error} Si el archivo no cumple con las validaciones
   */
  validateFile(file) {
    if (!file) {
      throw new Error('No se proporcionó ningún archivo')
    }

    // Validar tipo de archivo
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      const error = new Error(`Tipo de archivo no permitido: ${file.type}`)
      auditService.logEvent(
        'INVALID_FILE_TYPE',
        error.message,
        'WARNING',
        { fileName: file.name, fileType: file.type }
      )
      throw error
    }

    // Validar tamaño de archivo
    if (file.size > MAX_FILE_SIZE) {
      const error = new Error(`El archivo excede el tamaño máximo permitido de ${MAX_FILE_SIZE / 1024 / 1024}MB`)
      auditService.logEvent(
        'FILE_TOO_LARGE',
        error.message,
        'WARNING',
        { fileName: file.name, fileSize: file.size }
      )
      throw error
    }
  },

  /**
   * Valida un array de archivos
   * @param {File[]} files - Array de archivos a validar
   * @throws {Error} Si algún archivo no cumple con las validaciones
   */
  validateFiles(files) {
    if (!Array.isArray(files)) {
      throw new Error('Se esperaba un array de archivos')
    }

    files.forEach(file => this.validateFile(file))
  }
}

export default sanitizationService 