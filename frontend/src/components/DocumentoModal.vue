<template>
  <div class="modal-backdrop" @click.self="$emit('close')">
    <div class="modal-content">
      <div class="modal-header">
        <h3>Detalles del Documento #{{ documento.NroRegistro }}</h3>
        <button class="close-btn" @click="$emit('close')">
          <i class="fa-solid fa-times"></i>
        </button>
      </div>
      <div class="modal-body">
        <div class="info-grid">
          <div class="info-item">
            <span class="label">Fecha Ingreso:</span>
            <span class="value">{{ fechaDesglosada(documento.FechaDocumento) }}</span>
          </div>
          <div class="info-item">
            <span class="label">Tipo Documento:</span>
            <span class="value">{{ documento.OrigenDocumento }}</span>
          </div>
          <div class="info-item">
            <span class="label">Número Oficio:</span>
            <span class="value">{{ documento.NumeroOficioDocumento }}</span>
          </div>
          <div class="info-item">
            <span class="label">Fecha Documento:</span>
            <span class="value">{{ fechaDesglosada(documento.FechaDocumento) }}</span>
          </div>
          <div class="info-item">
            <span class="label">Procedencia:</span>
            <span class="value">{{ documento.Procedencia }}</span>
          </div>
          <div class="info-item">
            <span class="label">Área Derivado:</span>
            <span class="value">{{ documento.IDAreaActual }}</span>
          </div>
          <div class="info-item full-width">
            <span class="label">Contenido:</span>
            <span class="value">{{ documento.Contenido }}</span>
          </div>
          <div class="info-item">
            <span class="label">Tipo Doc Salida:</span>
            <span class="value">{{ documento.TipoDocumentoSalida }}</span>
          </div>
          <div class="info-item">
            <span class="label">Fecha Doc Salida:</span>
            <span class="value">{{ fechaDesglosada(documento.FechaDocumentoSalida) }}</span>
          </div>
          <div class="info-item full-width">
            <span class="label">Observaciones:</span>
            <span class="value">{{ documento.Observaciones }}</span>
          </div>
          <div class="info-item">
            <span class="label">Estado:</span>
            <span class="value">{{ documento.EstadoNombre || 'Desconocido' }}</span>
          </div>
          <div class="info-item full-width" v-if="documento.RutaArchivo">
            <span class="label">Archivo Adjunto:</span>
            <div class="file-preview-container">
              <!-- Vista previa de imagen -->
              <div v-if="isImage" class="image-preview">
                <viewer :images="[fullImageUrl]" class="attached-image-thumbnail">
                  <img :src="fullImageUrl" :alt="documento.name || 'Archivo Adjunto'"/>
                </viewer>
              </div>
              
              <!-- Vista previa de PDF -->
              <div v-else-if="isPdf" class="pdf-preview">
                <i class="fas fa-file-pdf"></i>
                <span class="file-name">{{ documento.name }}</span>
              </div>
              
              <!-- Otros tipos de archivo -->
              <div v-else class="file-preview">
                <i class="fas fa-file"></i>
                <span class="file-name">{{ documento.name }}</span>
              </div>

              <!-- Botones de acción -->
              <div class="file-actions">
                <button 
                  @click="handleDownload"
                  class="action-button download-button"
                  title="Descargar archivo"
                  :disabled="isDownloading">
                  <i class="fas" :class="isDownloading ? 'fa-spinner fa-spin' : 'fa-download'"></i>
                  <span>{{ isDownloading ? 'Descargando...' : 'Descargar' }}</span>
                </button>
                
                <a v-if="isPdf" 
                   :href="fullImageUrl" 
                   target="_blank"
                   class="action-button view-button"
                   title="Ver en nueva pestaña">
                  <i class="fas fa-external-link-alt"></i>
                  <span>Ver</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import 'viewerjs/dist/viewer.css'
import { component as Viewer } from "v-viewer"
import axios from 'axios'

const props = defineProps({
  documento: {
    type: Object,
    required: true
  }
})

const isDownloading = ref(false)

const fullImageUrl = computed(() => {
  return props.documento.RutaArchivo ? `http://localhost:3000/uploads/${props.documento.RutaArchivo}` : '';
});

const isImage = computed(() => {
  return props.documento.type?.startsWith('image/');
});

const isPdf = computed(() => {
  return props.documento.type === 'application/pdf';
});

async function handleDownload() {
  if (isDownloading.value) return;
  
  try {
    isDownloading.value = true;
    
    const response = await axios({
      url: `http://localhost:3000/api/documentos/download/${props.documento.IDDocumento}`,
      method: 'GET',
      responseType: 'blob',
    });

    // Crear URL del blob
    const blob = new Blob([response.data], { type: response.headers['content-type'] });
    const url = window.URL.createObjectURL(blob);
    
    // Crear link temporal y simular clic
    const link = document.createElement('a');
    link.href = url;
    link.download = props.documento.name || 'archivo';
    document.body.appendChild(link);
    link.click();
    
    // Limpiar
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error al descargar:', error);
    // Aquí podrías mostrar un mensaje de error al usuario
  } finally {
    isDownloading.value = false;
  }
}

function fechaDesglosada(fecha) {
  if (!fecha) return ''
  const d = new Date(fecha)
  if (isNaN(d)) return fecha
  return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`
}
</script>

<style scoped>
.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: #fff;
  border-radius: 8px;
  width: 90%;
  max-width: 800px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.modal-header {
  padding: 1.5rem;
  border-bottom: 1px solid #e1e1e1;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h3 {
  margin: 0;
  color: #14532d;
  font-size: 1.4rem;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.2rem;
  color: #666;
  cursor: pointer;
  padding: 0.5rem;
  transition: color 0.2s;
}

.close-btn:hover {
  color: #14532d;
}

.modal-body {
  padding: 1.5rem;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.5rem;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.info-item.full-width {
  grid-column: 1 / -1;
}

.label {
  font-weight: 500;
  color: #666;
  font-size: 0.9rem;
}

.value {
  color: #263238;
  font-size: 1rem;
}

.attached-image-thumbnail {
  max-width: 150px;
  height: auto;
  margin-top: 1rem;
  border: 1px solid #e1e1e1;
  border-radius: 4px;
  cursor: pointer;
}

.attached-image-thumbnail img {
  display: block;
  width: 100%;
  height: auto;
}

.file-preview-container {
  margin-top: 1rem;
  padding: 1rem;
  border: 1px solid #e1e1e1;
  border-radius: 8px;
  background-color: #f8f9fa;
}

.image-preview {
  margin-bottom: 1rem;
}

.pdf-preview,
.file-preview {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background-color: white;
  border-radius: 4px;
  margin-bottom: 1rem;
}

.pdf-preview i {
  font-size: 2rem;
  color: #dc3545;
}

.file-preview i {
  font-size: 2rem;
  color: #6c757d;
}

.file-name {
  font-size: 0.9rem;
  color: #495057;
  word-break: break-all;
}

.file-actions {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
}

.action-button {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  text-decoration: none;
  font-size: 0.9rem;
  transition: all 0.2s ease;
  border: none;
  cursor: pointer;
}

.action-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.download-button {
  background-color: #28a745;
  color: white;
}

.download-button:hover {
  background-color: #218838;
}

.view-button {
  background-color: #007bff;
  color: white;
}

.view-button:hover {
  background-color: #0056b3;
}

.action-button i {
  font-size: 1rem;
}

@media (max-width: 768px) {
  .info-grid {
    grid-template-columns: 1fr;
  }
  
  .modal-content {
    width: 95%;
    margin: 1rem;
  }

  .file-actions {
    flex-direction: column;
  }
  
  .action-button {
    width: 100%;
    justify-content: center;
  }
}
</style> 