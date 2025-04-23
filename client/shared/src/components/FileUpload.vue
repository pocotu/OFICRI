<template>
  <div class="file-upload">
    <div class="upload-area" 
         @dragover.prevent="handleDragOver"
         @dragleave.prevent="handleDragLeave"
         @drop.prevent="handleDrop"
         :class="{ 'is-dragging': isDragging }"
    >
      <input
        type="file"
        ref="fileInput"
        :multiple="multiple"
        :accept="accept"
        @change="handleFileChange"
        style="display: none"
      />
      
      <div class="upload-content">
        <i class="fas fa-cloud-upload-alt"></i>
        <p>Arrastre y suelte archivos aquí o</p>
        <button type="button" @click="triggerFileInput" class="select-files">
          Seleccionar archivos
        </button>
      </div>
    </div>

    <div class="file-list" v-if="files.length > 0">
      <div v-for="(file, index) in files" :key="index" class="file-item">
        <div class="file-info">
          <i :class="getFileIcon(file)"></i>
          <span class="file-name">{{ file.name }}</span>
          <span class="file-size">({{ formatFileSize(file.size) }})</span>
        </div>
        <div class="file-actions">
          <button type="button" @click="removeFile(index)" class="remove-file">
            <i class="fas fa-times"></i>
          </button>
        </div>
      </div>
    </div>

    <div class="upload-progress" v-if="isUploading">
      <div v-for="(file, index) in files" :key="index" class="file-progress">
        <div class="progress-info">
          <span class="file-name">{{ file.name }}</span>
          <span class="progress-text">{{ getProgressText(file) }}</span>
        </div>
        <div class="progress-bar">
          <div class="progress" :style="{ width: `${getUploadProgress(file)}%` }"></div>
        </div>
        <div class="progress-status" :class="getUploadStatus(file)">
          <i :class="getStatusIcon(file)"></i>
        </div>
      </div>
    </div>

    <div class="error-message" v-if="error">
      <i class="fas fa-exclamation-circle"></i>
      {{ error }}
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { FileUploadService } from '../services/fileProcessing/fileUploadService'
import { ALLOWED_MIME_TYPES, FILE_SIZE_LIMITS } from '../services/fileProcessing/fileProcessor'

const props = defineProps({
  multiple: {
    type: Boolean,
    default: false
  },
  accept: {
    type: String,
    default: '*'
  },
  maxSize: {
    type: Number,
    default: 10 * 1024 * 1024 // 10MB por defecto
  },
  maxFiles: {
    type: Number,
    default: 5
  },
  uploadUrl: {
    type: String,
    required: true
  }
})

const emit = defineEmits(['update:files', 'upload-complete', 'upload-error', 'upload-progress'])

const fileInput = ref(null)
const files = ref([])
const isDragging = ref(false)
const isUploading = ref(false)
const error = ref('')
const fileUploadService = new FileUploadService()

const fileIcons = {
  'application/pdf': 'fas fa-file-pdf',
  'application/msword': 'fas fa-file-word',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'fas fa-file-word',
  'application/vnd.ms-excel': 'fas fa-file-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'fas fa-file-excel',
  'image/jpeg': 'fas fa-file-image',
  'image/png': 'fas fa-file-image',
  'image/gif': 'fas fa-file-image',
  'text/plain': 'fas fa-file-alt',
  'default': 'fas fa-file'
}

const getFileIcon = (file) => {
  return fileIcons[file.type] || fileIcons.default
}

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const validateFile = (file) => {
  if (file.size > props.maxSize) {
    error.value = `El archivo ${file.name} excede el tamaño máximo permitido (${formatFileSize(props.maxSize)})`
    return false
  }

  if (!ALLOWED_MIME_TYPES[file.type]) {
    error.value = `Tipo de archivo no permitido: ${file.type}`
    return false
  }

  return true
}

const handleDragOver = () => {
  isDragging.value = true
}

const handleDragLeave = () => {
  isDragging.value = false
}

const handleDrop = (event) => {
  isDragging.value = false
  const droppedFiles = Array.from(event.dataTransfer.files)
  handleFiles(droppedFiles)
}

const handleFileChange = (event) => {
  const selectedFiles = Array.from(event.target.files)
  handleFiles(selectedFiles)
}

const handleFiles = (newFiles) => {
  error.value = ''
  
  if (!props.multiple && newFiles.length > 1) {
    error.value = 'Solo se permite subir un archivo'
    return
  }

  if (files.value.length + newFiles.length > props.maxFiles) {
    error.value = `No se pueden subir más de ${props.maxFiles} archivos`
    return
  }

  const validFiles = newFiles.filter(validateFile)
  if (validFiles.length > 0) {
    files.value.push(...validFiles)
    emit('update:files', files.value)
  }
}

const triggerFileInput = () => {
  fileInput.value.click()
}

const removeFile = (index) => {
  const file = files.value[index]
  fileUploadService.clearUploadStatus(fileUploadService.generateFileId(file))
  files.value.splice(index, 1)
  emit('update:files', files.value)
}

const getUploadProgress = (file) => {
  return fileUploadService.getUploadProgress(fileUploadService.generateFileId(file))
}

const getUploadStatus = (file) => {
  return fileUploadService.getUploadStatus(fileUploadService.generateFileId(file))
}

const getProgressText = (file) => {
  const status = getUploadStatus(file)
  const progress = getUploadProgress(file)
  
  switch (status) {
    case 'pending':
      return 'Pendiente'
    case 'uploading':
      return `${progress}%`
    case 'completed':
      return 'Completado'
    case 'error':
      return 'Error'
    default:
      return ''
  }
}

const getStatusIcon = (file) => {
  const status = getUploadStatus(file)
  
  switch (status) {
    case 'pending':
      return 'fas fa-clock'
    case 'uploading':
      return 'fas fa-spinner fa-spin'
    case 'completed':
      return 'fas fa-check'
    case 'error':
      return 'fas fa-exclamation-circle'
    default:
      return 'fas fa-question'
  }
}

const uploadFiles = async () => {
  if (files.value.length === 0) {
    error.value = 'No hay archivos para subir'
    return
  }

  isUploading.value = true
  error.value = ''

  try {
    const results = await fileUploadService.uploadFiles(files.value, props.uploadUrl)
    
    // Procesar resultados
    const successfulUploads = []
    const failedUploads = []

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        successfulUploads.push(files.value[index])
      } else {
        failedUploads.push({
          file: files.value[index],
          error: result.reason
        })
      }
    })

    // Emitir eventos
    if (successfulUploads.length > 0) {
      emit('upload-complete', successfulUploads)
    }

    if (failedUploads.length > 0) {
      emit('upload-error', failedUploads)
      error.value = `Error al subir ${failedUploads.length} archivo(s)`
    }

  } catch (err) {
    error.value = 'Error al subir los archivos'
    emit('upload-error', err)
  } finally {
    isUploading.value = false
  }
}

defineExpose({
  uploadFiles,
  clearFiles: () => {
    files.value = []
    error.value = ''
    emit('update:files', [])
  }
})
</script>

<style scoped>
.file-upload {
  width: 100%;
}

.upload-area {
  border: 2px dashed #ddd;
  border-radius: 8px;
  padding: 2rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
}

.upload-area.is-dragging {
  border-color: #1a237e;
  background-color: rgba(26, 35, 126, 0.05);
}

.upload-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.upload-content i {
  font-size: 3rem;
  color: #666;
}

.upload-content p {
  margin: 0;
  color: #666;
}

.select-files {
  padding: 0.5rem 1rem;
  background-color: #1a237e;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
}

.file-list {
  margin-top: 1rem;
}

.file-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background-color: #f5f5f5;
  border-radius: 4px;
  margin-bottom: 0.5rem;
}

.file-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.file-info i {
  color: #666;
}

.file-name {
  font-weight: 500;
}

.file-size {
  color: #666;
  font-size: 0.875rem;
}

.file-actions button {
  background: none;
  border: none;
  color: #666;
  cursor: pointer;
  padding: 0.25rem;
}

.file-actions button:hover {
  color: #333;
}

.file-progress {
  margin-top: 1rem;
  padding: 0.5rem;
  background-color: #f8f9fa;
  border-radius: 4px;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.progress-bar {
  height: 8px;
  background-color: #f0f0f0;
  border-radius: 4px;
  overflow: hidden;
}

.progress {
  height: 100%;
  background-color: #1a237e;
  transition: width 0.3s ease;
}

.progress-status {
  margin-top: 0.5rem;
  text-align: right;
}

.progress-status i {
  font-size: 1rem;
}

.progress-status.pending i {
  color: #666;
}

.progress-status.uploading i {
  color: #1a237e;
}

.progress-status.completed i {
  color: #4caf50;
}

.progress-status.error i {
  color: #f44336;
}

.error-message {
  margin-top: 1rem;
  padding: 0.75rem;
  background-color: #f8d7da;
  color: #721c24;
  border-radius: 4px;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.error-message i {
  font-size: 1.25rem;
}
</style> 