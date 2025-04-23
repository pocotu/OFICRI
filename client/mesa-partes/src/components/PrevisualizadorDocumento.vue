<template>
  <div class="previsualizador-documento">
    <div class="header">
      <h2>Previsualización de Documento</h2>
      <div class="actions">
        <button 
          class="btn-descargar"
          @click="descargarDocumento"
          :disabled="isLoading"
        >
          Descargar
        </button>
        <button 
          class="btn-cerrar"
          @click="$emit('cerrar')"
        >
          Cerrar
        </button>
      </div>
    </div>
    
    <div class="documento-info">
      <div class="info-item">
        <span class="label">Número:</span>
        <span class="value">{{ documento.numero }}</span>
      </div>
      <div class="info-item">
        <span class="label">Fecha:</span>
        <span class="value">{{ formatFecha(documento.fecha) }}</span>
      </div>
      <div class="info-item">
        <span class="label">Remitente:</span>
        <span class="value">{{ documento.remitente }}</span>
      </div>
      <div class="info-item">
        <span class="label">Asunto:</span>
        <span class="value">{{ documento.asunto }}</span>
      </div>
    </div>
    
    <div class="previsualizacion-container">
      <div v-if="isLoading" class="loading">
        Cargando documento...
      </div>
      
      <div v-else-if="error" class="error">
        {{ error }}
      </div>
      
      <div v-else class="previsualizacion">
        <!-- Vista previa de imagen -->
        <img 
          v-if="esImagen" 
          :src="urlPrevisualizacion" 
          :alt="documento.numero"
          class="previsualizacion-imagen"
        >
        
        <!-- Vista previa de PDF -->
        <iframe 
          v-else-if="esPDF"
          :src="urlPrevisualizacion"
          class="previsualizacion-pdf"
        ></iframe>
        
        <!-- Vista previa de texto -->
        <pre 
          v-else-if="esTexto"
          class="previsualizacion-texto"
        >{{ contenidoTexto }}</pre>
        
        <!-- Vista previa no disponible -->
        <div v-else class="previsualizacion-no-disponible">
          Vista previa no disponible para este tipo de archivo
        </div>
      </div>
    </div>
    
    <div class="metadatos">
      <h3>Metadatos</h3>
      <div class="metadatos-grid">
        <div class="metadato-item">
          <span class="label">Tipo:</span>
          <span class="value">{{ metadatos.tipo }}</span>
        </div>
        <div class="metadato-item">
          <span class="label">Tamaño:</span>
          <span class="value">{{ formatTamanio(metadatos.tamanio) }}</span>
        </div>
        <div class="metadato-item">
          <span class="label">Resolución:</span>
          <span class="value">{{ metadatos.resolucion }}</span>
        </div>
        <div class="metadato-item">
          <span class="label">Calidad:</span>
          <span class="value">{{ metadatos.calidad }}</span>
        </div>
        <div class="metadato-item">
          <span class="label">Fecha de Digitalización:</span>
          <span class="value">{{ formatFecha(metadatos.fechaDigitalizacion) }}</span>
        </div>
        <div class="metadato-item">
          <span class="label">Responsable:</span>
          <span class="value">{{ metadatos.responsable }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import digitalizacionService from '../../shared/src/services/mesa-partes/digitalizacionService';

const props = defineProps({
  documento: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(['cerrar']);

// Estado
const isLoading = ref(false);
const error = ref(null);
const urlPrevisualizacion = ref(null);
const contenidoTexto = ref('');
const metadatos = ref({
  tipo: '',
  tamanio: 0,
  resolucion: '',
  calidad: '',
  fechaDigitalizacion: null,
  responsable: ''
});

// Computed
const esImagen = computed(() => {
  const tiposImagen = ['image/jpeg', 'image/png', 'image/gif'];
  return tiposImagen.includes(metadatos.value.tipo);
});

const esPDF = computed(() => {
  return metadatos.value.tipo === 'application/pdf';
});

const esTexto = computed(() => {
  const tiposTexto = ['text/plain', 'text/html', 'application/json'];
  return tiposTexto.includes(metadatos.value.tipo);
});

// Métodos
const cargarPrevisualizacion = async () => {
  isLoading.value = true;
  error.value = null;
  
  try {
    // Obtener metadatos
    const responseMetadatos = await digitalizacionService.getMetadatos(props.documento.id);
    metadatos.value = responseMetadatos.data;
    
    // Obtener previsualización
    const responsePrevisualizacion = await digitalizacionService.getPrevisualizacion(props.documento.id);
    urlPrevisualizacion.value = responsePrevisualizacion.data.url;
    
    // Si es texto, cargar contenido
    if (esTexto.value) {
      const response = await fetch(urlPrevisualizacion.value);
      contenidoTexto.value = await response.text();
    }
  } catch (err) {
    error.value = 'Error al cargar la previsualización del documento';
    console.error('Error:', err);
  } finally {
    isLoading.value = false;
  }
};

const descargarDocumento = async () => {
  try {
    const response = await digitalizacionService.descargarDocumento(props.documento.id);
    const blob = new Blob([response.data], { type: metadatos.value.tipo });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${props.documento.numero}.${metadatos.value.tipo.split('/')[1]}`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  } catch (err) {
    console.error('Error al descargar el documento:', err);
  }
};

const formatFecha = (fecha) => {
  if (!fecha) return '';
  return new Date(fecha).toLocaleString('es-PE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const formatTamanio = (bytes) => {
  if (!bytes) return '0 B';
  const unidades = ['B', 'KB', 'MB', 'GB'];
  let i = 0;
  while (bytes >= 1024 && i < unidades.length - 1) {
    bytes /= 1024;
    i++;
  }
  return `${bytes.toFixed(2)} ${unidades[i]}`;
};

onMounted(() => {
  cargarPrevisualizacion();
});
</script>

<style scoped>
.previsualizador-documento {
  padding: 20px;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.actions {
  display: flex;
  gap: 10px;
}

.btn-descargar,
.btn-cerrar {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.btn-descargar {
  background-color: #2196F3;
  color: white;
}

.btn-descargar:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

.btn-cerrar {
  background-color: #f5f5f5;
  color: #333;
}

.documento-info {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
  padding: 15px;
  background-color: #f5f5f5;
  border-radius: 8px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.label {
  font-size: 0.9rem;
  color: #666;
}

.value {
  font-weight: 500;
  color: #333;
}

.previsualizacion-container {
  flex: 1;
  min-height: 0;
  background-color: #f5f5f5;
  border-radius: 8px;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
}

.loading,
.error,
.previsualizacion-no-disponible {
  text-align: center;
  color: #666;
}

.error {
  color: #D32F2F;
}

.previsualizacion {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}

.previsualizacion-imagen {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.previsualizacion-pdf {
  width: 100%;
  height: 100%;
  border: none;
}

.previsualizacion-texto {
  width: 100%;
  height: 100%;
  overflow: auto;
  padding: 15px;
  background-color: white;
  border-radius: 4px;
  font-family: monospace;
  white-space: pre-wrap;
}

.metadatos {
  padding: 15px;
  background-color: #f5f5f5;
  border-radius: 8px;
}

.metadatos h3 {
  margin: 0 0 15px;
  color: #333;
}

.metadatos-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
}

.metadato-item {
  display: flex;
  flex-direction: column;
  gap: 5px;
}
</style> 