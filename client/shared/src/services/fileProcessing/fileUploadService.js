import axios from 'axios';
import { FileProcessor } from './fileProcessor';

export class FileUploadService {
  constructor() {
    this.fileProcessor = new FileProcessor();
    this.uploadProgress = new Map();
    this.uploadStatus = new Map();
    this.uploadErrors = new Map();
  }

  /**
   * Sube un archivo con reintentos y manejo de progreso
   * @param {File} file - El archivo a subir
   * @param {string} url - La URL de destino
   * @param {Object} options - Opciones de subida
   * @returns {Promise<Object>} - Resultado de la subida
   */
  async uploadFile(file, url, options = {}) {
    const fileId = this.generateFileId(file);
    this.initializeUploadStatus(fileId);

    try {
      // Procesar archivo antes de subir
      const processedFile = await this.fileProcessor.processFile(file);

      // Configurar la subida
      const formData = new FormData();
      formData.append('file', processedFile);

      // Añadir headers y opciones adicionales
      const config = {
        headers: {
          'Content-Type': 'multipart/form-data',
          ...options.headers
        },
        onUploadProgress: (progressEvent) => {
          this.updateUploadProgress(fileId, progressEvent);
        }
      };

      // Realizar la subida con reintentos
      const response = await this.fileProcessor.withRetry(async () => {
        return await axios.post(url, formData, config);
      });

      this.updateUploadStatus(fileId, 'completed');
      return response.data;

    } catch (error) {
      this.handleUploadError(fileId, error);
      throw error;
    }
  }

  /**
   * Sube múltiples archivos
   * @param {File[]} files - Los archivos a subir
   * @param {string} url - La URL de destino
   * @param {Object} options - Opciones de subida
   * @returns {Promise<Object[]>} - Resultados de las subidas
   */
  async uploadFiles(files, url, options = {}) {
    const uploadPromises = files.map(file => this.uploadFile(file, url, options));
    return Promise.allSettled(uploadPromises);
  }

  /**
   * Genera un ID único para el archivo
   * @param {File} file - El archivo
   * @returns {string} - ID único
   */
  generateFileId(file) {
    return `${file.name}-${file.size}-${file.lastModified}`;
  }

  /**
   * Inicializa el estado de subida para un archivo
   * @param {string} fileId - ID del archivo
   */
  initializeUploadStatus(fileId) {
    this.uploadProgress.set(fileId, 0);
    this.uploadStatus.set(fileId, 'pending');
    this.uploadErrors.delete(fileId);
  }

  /**
   * Actualiza el progreso de subida
   * @param {string} fileId - ID del archivo
   * @param {Object} progressEvent - Evento de progreso
   */
  updateUploadProgress(fileId, progressEvent) {
    const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
    this.uploadProgress.set(fileId, progress);
    this.uploadStatus.set(fileId, 'uploading');
  }

  /**
   * Actualiza el estado de subida
   * @param {string} fileId - ID del archivo
   * @param {string} status - Nuevo estado
   */
  updateUploadStatus(fileId, status) {
    this.uploadStatus.set(fileId, status);
  }

  /**
   * Maneja errores de subida
   * @param {string} fileId - ID del archivo
   * @param {Error} error - Error ocurrido
   */
  handleUploadError(fileId, error) {
    this.uploadStatus.set(fileId, 'error');
    this.uploadErrors.set(fileId, error.message);
  }

  /**
   * Obtiene el progreso de subida de un archivo
   * @param {string} fileId - ID del archivo
   * @returns {number} - Progreso en porcentaje
   */
  getUploadProgress(fileId) {
    return this.uploadProgress.get(fileId) || 0;
  }

  /**
   * Obtiene el estado de subida de un archivo
   * @param {string} fileId - ID del archivo
   * @returns {string} - Estado de la subida
   */
  getUploadStatus(fileId) {
    return this.uploadStatus.get(fileId) || 'unknown';
  }

  /**
   * Obtiene el error de subida de un archivo
   * @param {string} fileId - ID del archivo
   * @returns {string|null} - Mensaje de error o null
   */
  getUploadError(fileId) {
    return this.uploadErrors.get(fileId) || null;
  }

  /**
   * Limpia el estado de subida de un archivo
   * @param {string} fileId - ID del archivo
   */
  clearUploadStatus(fileId) {
    this.uploadProgress.delete(fileId);
    this.uploadStatus.delete(fileId);
    this.uploadErrors.delete(fileId);
  }
} 