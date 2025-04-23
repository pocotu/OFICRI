<template>
  <div class="document-reception">
    <h2>Recepción de Documentos</h2>
    
    <div class="reception-form">
      <form @submit.prevent="handleSubmit">
        <!-- Información del Documento -->
        <div class="form-section">
          <h3>Información del Documento</h3>
          
          <div class="form-group">
            <label for="tipoDocumento">Tipo de Documento</label>
            <select 
              id="tipoDocumento" 
              v-model="formData.tipoDocumento"
              required
            >
              <option value="">Seleccione tipo</option>
              <option v-for="tipo in tiposDocumento" :key="tipo.value" :value="tipo.value">
                {{ tipo.label }}
              </option>
            </select>
          </div>

          <div class="form-group">
            <label for="numeroDocumento">Número de Documento</label>
            <input 
              type="text" 
              id="numeroDocumento" 
              v-model="formData.numeroDocumento"
              required
            >
          </div>

          <div class="form-group">
            <label for="fechaDocumento">Fecha del Documento</label>
            <input 
              type="date" 
              id="fechaDocumento" 
              v-model="formData.fechaDocumento"
              required
            >
          </div>

          <div class="form-group">
            <label for="remitente">Remitente</label>
            <input 
              type="text" 
              id="remitente" 
              v-model="formData.remitente"
              required
            >
          </div>

          <div class="form-group">
            <label for="asunto">Asunto</label>
            <textarea 
              id="asunto" 
              v-model="formData.asunto"
              required
            ></textarea>
          </div>
        </div>

        <!-- Clasificación y Prioridad -->
        <div class="form-section">
          <h3>Clasificación y Prioridad</h3>
          
          <div class="form-group">
            <label for="clasificacion">Clasificación</label>
            <select 
              id="clasificacion" 
              v-model="formData.clasificacion"
              required
            >
              <option value="">Seleccione clasificación</option>
              <option v-for="c in clasificaciones" :key="c.value" :value="c.value">
                {{ c.label }}
              </option>
            </select>
          </div>

          <div class="form-group">
            <label for="prioridad">Prioridad</label>
            <select 
              id="prioridad" 
              v-model="formData.prioridad"
              required
            >
              <option value="">Seleccione prioridad</option>
              <option v-for="p in prioridades" :key="p.value" :value="p.value">
                {{ p.label }}
              </option>
            </select>
          </div>

          <div class="form-group">
            <label for="areaDestino">Área Destino</label>
            <select 
              id="areaDestino" 
              v-model="formData.areaDestino"
              required
            >
              <option value="">Seleccione área</option>
              <option v-for="area in areas" :key="area.id" :value="area.id">
                {{ area.nombre }}
              </option>
            </select>
          </div>
        </div>

        <!-- Digitalización -->
        <div class="form-section">
          <h3>Digitalización</h3>
          
          <div class="form-group">
            <label for="tipoDigitalizacion">Tipo de Digitalización</label>
            <select 
              id="tipoDigitalizacion" 
              v-model="formData.tipoDigitalizacion"
              required
            >
              <option value="">Seleccione tipo</option>
              <option v-for="tipo in tiposDigitalizacion" :key="tipo.value" :value="tipo.value">
                {{ tipo.label }}
              </option>
            </select>
          </div>

          <div class="form-group">
            <label for="calidadDigitalizacion">Calidad de Digitalización</label>
            <select 
              id="calidadDigitalizacion" 
              v-model="formData.calidadDigitalizacion"
              required
            >
              <option value="">Seleccione calidad</option>
              <option v-for="calidad in calidadesDigitalizacion" :key="calidad.value" :value="calidad.value">
                {{ calidad.label }}
              </option>
            </select>
          </div>

          <div class="form-group">
            <label for="resolucion">Resolución (DPI)</label>
            <input 
              type="number" 
              id="resolucion" 
              v-model="formData.resolucion"
              min="150"
              max="600"
              required
            >
          </div>
        </div>

        <!-- Archivos Adjuntos -->
        <div class="form-section">
          <h3>Archivos Adjuntos</h3>
          
          <div class="file-upload">
            <input 
              type="file" 
              multiple 
              @change="handleFileUpload"
              ref="fileInput"
              accept=".pdf,.jpg,.jpeg,.png,.tiff"
            >
            <button type="button" @click="$refs.fileInput.click()">
              Seleccionar Archivos
            </button>
          </div>

          <div class="file-list" v-if="formData.archivos.length">
            <div v-for="(file, index) in formData.archivos" :key="index" class="file-item">
              <span>{{ file.name }}</span>
              <span class="file-size">{{ formatFileSize(file.size) }}</span>
              <button type="button" @click="removeFile(index)">×</button>
            </div>
          </div>
        </div>

        <!-- Observaciones -->
        <div class="form-section">
          <h3>Observaciones</h3>
          
          <div class="form-group">
            <textarea 
              v-model="formData.observaciones"
              placeholder="Ingrese observaciones adicionales..."
            ></textarea>
          </div>
        </div>

        <!-- Botones de Acción -->
        <div class="form-actions">
          <button type="button" @click="resetForm" :disabled="isLoading">
            Cancelar
          </button>
          <button type="submit" :disabled="isLoading">
            {{ isLoading ? 'Registrando...' : 'Registrar Documento' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useMesaPartesStore } from '../../shared/src/store/mesaPartes';
import { useAreasStore } from '../../shared/src/store/areas';
import { useAuthStore } from '../../shared/src/store/auth';

const mesaPartesStore = useMesaPartesStore();
const areasStore = useAreasStore();
const authStore = useAuthStore();

// Estado del formulario
const formData = ref({
  tipoDocumento: '',
  numeroDocumento: '',
  fechaDocumento: '',
  remitente: '',
  asunto: '',
  clasificacion: '',
  prioridad: '',
  areaDestino: '',
  tipoDigitalizacion: '',
  calidadDigitalizacion: '',
  resolucion: 300,
  archivos: [],
  observaciones: ''
});

const isLoading = ref(false);

// Constantes
const tiposDocumento = ref([
  { value: 'OFICIO', label: 'Oficio' },
  { value: 'MEMORANDUM', label: 'Memorándum' },
  { value: 'RESOLUCION', label: 'Resolución' },
  { value: 'INFORME', label: 'Informe' },
  { value: 'OTRO', label: 'Otro' }
]);

const clasificaciones = ref([
  { value: 'URGENTE', label: 'Urgente' },
  { value: 'IMPORTANTE', label: 'Importante' },
  { value: 'NORMAL', label: 'Normal' },
  { value: 'RUTINARIO', label: 'Rutinario' }
]);

const prioridades = ref([
  { value: 'ALTA', label: 'Alta' },
  { value: 'MEDIA', label: 'Media' },
  { value: 'BAJA', label: 'Baja' }
]);

const tiposDigitalizacion = ref([
  { value: 'ESCANER', label: 'Escáner' },
  { value: 'CAMARA', label: 'Cámara' },
  { value: 'MOVIL', label: 'Móvil' }
]);

const calidadesDigitalizacion = ref([
  { value: 'ALTA', label: 'Alta' },
  { value: 'MEDIA', label: 'Media' },
  { value: 'BAJA', label: 'Baja' }
]);

const areas = ref([]);

// Métodos
const handleFileUpload = (event) => {
  const files = Array.from(event.target.files);
  formData.value.archivos = [...formData.value.archivos, ...files];
};

const removeFile = (index) => {
  formData.value.archivos.splice(index, 1);
};

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const resetForm = () => {
  formData.value = {
    tipoDocumento: '',
    numeroDocumento: '',
    fechaDocumento: '',
    remitente: '',
    asunto: '',
    clasificacion: '',
    prioridad: '',
    areaDestino: '',
    tipoDigitalizacion: '',
    calidadDigitalizacion: '',
    resolucion: 300,
    archivos: [],
    observaciones: ''
  };
};

const handleSubmit = async () => {
  if (!authStore.hasPermission(mesaPartesStore.PERMISSION_BITS.CREAR)) {
    alert('No tiene permisos para registrar documentos');
    return;
  }

  isLoading.value = true;
  try {
    const recepcionData = {
      documento: {
        tipo: formData.value.tipoDocumento,
        numero: formData.value.numeroDocumento,
        fecha: formData.value.fechaDocumento,
        remitente: formData.value.remitente,
        asunto: formData.value.asunto,
        clasificacion: formData.value.clasificacion,
        prioridad: formData.value.prioridad
      },
      digitalizacion: {
        tipo: formData.value.tipoDigitalizacion,
        calidad: formData.value.calidadDigitalizacion,
        resolucion: formData.value.resolucion
      },
      areaDestino: formData.value.areaDestino,
      observaciones: formData.value.observaciones,
      archivos: formData.value.archivos
    };

    await mesaPartesStore.registrarRecepcion(recepcionData);
    alert('Documento registrado exitosamente');
    resetForm();
  } catch (error) {
    console.error('Error al registrar documento:', error);
    alert('Error al registrar documento: ' + error.message);
  } finally {
    isLoading.value = false;
  }
};

// Inicialización
onMounted(async () => {
  try {
    await areasStore.fetchAreas();
    areas.value = areasStore.areas;
  } catch (error) {
    console.error('Error al cargar áreas:', error);
  }
});
</script>

<style scoped>
.document-reception {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.form-section {
  margin-bottom: 20px;
  padding: 15px;
  border: 1px solid #ddd;
  border-radius: 5px;
}

.form-group {
  margin-bottom: 15px;
}

label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
}

input[type="text"],
input[type="date"],
select,
textarea {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

textarea {
  min-height: 100px;
  resize: vertical;
}

.file-upload {
  margin-bottom: 15px;
}

.file-list {
  margin-top: 10px;
}

.file-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px;
  background: #f5f5f5;
  margin-bottom: 5px;
  border-radius: 4px;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}

button {
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

button[type="submit"] {
  background-color: #4CAF50;
  color: white;
}

button[type="button"] {
  background-color: #f44336;
  color: white;
}

button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.file-size {
  color: #666;
  font-size: 0.9em;
  margin-left: 10px;
}
</style> 