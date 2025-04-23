import imageCompression from 'browser-image-compression';
import { fileTypeFromBuffer } from 'file-type';
import { createHash } from 'crypto';

// Configuración de compresión de imágenes
const imageCompressionOptions = {
  maxSizeMB: 1,
  maxWidthOrHeight: 1920,
  useWebWorker: true,
  fileType: 'image/jpeg'
};

// Tipos MIME permitidos con sus extensiones
export const ALLOWED_MIME_TYPES = {
  'application/pdf': ['.pdf'],
  'application/msword': ['.doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'application/vnd.ms-excel': ['.xls'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/gif': ['.gif'],
  'text/plain': ['.txt'],
  'application/zip': ['.zip'],
  'application/x-rar-compressed': ['.rar']
};

// Límites de tamaño por tipo de archivo (en bytes)
export const FILE_SIZE_LIMITS = {
  'application/pdf': 10 * 1024 * 1024, // 10MB
  'application/msword': 5 * 1024 * 1024, // 5MB
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 5 * 1024 * 1024, // 5MB
  'application/vnd.ms-excel': 5 * 1024 * 1024, // 5MB
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 5 * 1024 * 1024, // 5MB
  'image/jpeg': 5 * 1024 * 1024, // 5MB
  'image/png': 5 * 1024 * 1024, // 5MB
  'image/gif': 5 * 1024 * 1024, // 5MB
  'text/plain': 1 * 1024 * 1024, // 1MB
  'application/zip': 20 * 1024 * 1024, // 20MB
  'application/x-rar-compressed': 20 * 1024 * 1024 // 20MB
};

// Configuración de reintentos
const RETRY_CONFIG = {
  maxRetries: 3,
  initialDelay: 1000, // 1 segundo
  maxDelay: 10000, // 10 segundos
  factor: 2 // Factor de backoff exponencial
};

export class FileProcessor {
  constructor() {
    this.retryCount = 0;
  }

  /**
   * Procesa un archivo antes de la subida
   * @param {File} file - El archivo a procesar
   * @returns {Promise<File>} - El archivo procesado
   */
  async processFile(file) {
    try {
      // Validar tipo y tamaño
      await this.validateFile(file);

      // Comprimir si es una imagen
      if (file.type.startsWith('image/')) {
        return await this.compressImage(file);
      }

      return file;
    } catch (error) {
      throw new Error(`Error procesando archivo: ${error.message}`);
    }
  }

  /**
   * Valida un archivo
   * @param {File} file - El archivo a validar
   * @returns {Promise<void>}
   */
  async validateFile(file) {
    // Validar tipo MIME
    if (!ALLOWED_MIME_TYPES[file.type]) {
      throw new Error(`Tipo de archivo no permitido: ${file.type}`);
    }

    // Validar tamaño
    const sizeLimit = FILE_SIZE_LIMITS[file.type];
    if (file.size > sizeLimit) {
      throw new Error(`El archivo excede el tamaño máximo permitido de ${this.formatFileSize(sizeLimit)}`);
    }

    // Validar contenido
    await this.validateFileContent(file);
  }

  /**
   * Valida el contenido de un archivo
   * @param {File} file - El archivo a validar
   * @returns {Promise<void>}
   */
  async validateFileContent(file) {
    const buffer = await file.arrayBuffer();
    const fileType = await fileTypeFromBuffer(buffer);

    // Verificar que el tipo MIME coincide con el contenido real
    if (fileType && !ALLOWED_MIME_TYPES[fileType.mime]) {
      throw new Error(`El contenido del archivo no coincide con su tipo MIME: ${file.type}`);
    }

    // Verificar integridad del archivo
    const hash = await this.calculateFileHash(buffer);
    if (!hash) {
      throw new Error('Error al verificar la integridad del archivo');
    }
  }

  /**
   * Comprime una imagen
   * @param {File} file - La imagen a comprimir
   * @returns {Promise<File>} - La imagen comprimida
   */
  async compressImage(file) {
    try {
      const compressedFile = await imageCompression(file, imageCompressionOptions);
      return new File([compressedFile], file.name, {
        type: compressedFile.type,
        lastModified: file.lastModified
      });
    } catch (error) {
      throw new Error(`Error al comprimir la imagen: ${error.message}`);
    }
  }

  /**
   * Calcula el hash de un archivo
   * @param {ArrayBuffer} buffer - El contenido del archivo
   * @returns {Promise<string>} - El hash del archivo
   */
  async calculateFileHash(buffer) {
    return new Promise((resolve) => {
      const hash = createHash('sha256');
      hash.update(Buffer.from(buffer));
      resolve(hash.digest('hex'));
    });
  }

  /**
   * Formatea el tamaño de un archivo
   * @param {number} bytes - Tamaño en bytes
   * @returns {string} - Tamaño formateado
   */
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Ejecuta una operación con reintentos
   * @param {Function} operation - La operación a ejecutar
   * @returns {Promise<any>} - Resultado de la operación
   */
  async withRetry(operation) {
    let delay = RETRY_CONFIG.initialDelay;

    while (this.retryCount < RETRY_CONFIG.maxRetries) {
      try {
        return await operation();
      } catch (error) {
        this.retryCount++;
        
        if (this.retryCount === RETRY_CONFIG.maxRetries) {
          throw error;
        }

        // Esperar antes del siguiente intento
        await new Promise(resolve => setTimeout(resolve, delay));
        
        // Aumentar el delay para el siguiente intento
        delay = Math.min(delay * RETRY_CONFIG.factor, RETRY_CONFIG.maxDelay);
      }
    }
  }
} 