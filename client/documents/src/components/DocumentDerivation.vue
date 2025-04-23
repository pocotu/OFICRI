<template>
  <div class="document-derivation">
    <!-- Encabezado con información del documento -->
    <div class="document-header">
      <h2>{{ document.title }}</h2>
      <div class="document-meta">
        <span class="document-number">N° {{ document.number }}</span>
        <span class="document-date">{{ formatDate(document.date) }}</span>
        <span class="document-type">{{ document.type }}</span>
      </div>
    </div>

    <!-- Estado actual -->
    <div class="current-status">
      <h3>Estado Actual</h3>
      <div class="status-info">
        <span class="status-badge" :class="document.status">
          {{ document.status }}
        </span>
        <span class="current-area">{{ document.currentArea }}</span>
      </div>
    </div>

    <!-- Formulario de derivación -->
    <form @submit.prevent="handleSubmit" class="derivation-form">
      <div class="form-group">
        <label for="area">Área Destino</label>
        <area-selector
          v-model="formData.areaId"
          :current-area="document.currentArea"
          @update:modelValue="validateArea"
        />
        <span class="error" v-if="errors.areaId">{{ errors.areaId }}</span>
      </div>

      <div class="form-group">
        <label for="priority">Prioridad</label>
        <select
          id="priority"
          v-model="formData.priority"
          :class="{ 'is-invalid': errors.priority }"
        >
          <option value="low">Baja</option>
          <option value="medium">Media</option>
          <option value="high">Alta</option>
          <option value="urgent">Urgente</option>
        </select>
        <span class="error" v-if="errors.priority">{{ errors.priority }}</span>
      </div>

      <div class="form-group">
        <label for="instructions">Instrucciones</label>
        <textarea
          id="instructions"
          v-model="formData.instructions"
          rows="4"
          :class="{ 'is-invalid': errors.instructions }"
          placeholder="Ingrese las instrucciones para el área destino"
        ></textarea>
        <span class="error" v-if="errors.instructions">{{ errors.instructions }}</span>
      </div>

      <div class="form-group">
        <label>Archivos Adjuntos</label>
        <file-upload
          v-model="formData.attachments"
          :max-size="5242880"
          :allowed-types="['.pdf', '.doc', '.docx', '.jpg', '.png']"
          @error="handleFileError"
        />
      </div>

      <div class="form-actions">
        <button type="button" class="btn-secondary" @click="$emit('cancel')">
          Cancelar
        </button>
        <button type="submit" class="btn-primary" :disabled="isSubmitting">
          {{ isSubmitting ? 'Derivando...' : 'Derivar Documento' }}
        </button>
      </div>
    </form>

    <!-- Historial de derivaciones -->
    <div class="derivation-history">
      <h3>Historial de Derivaciones</h3>
      <div class="timeline">
        <div
          v-for="derivation in derivations"
          :key="derivation.id"
          class="timeline-item"
        >
          <div class="timeline-date">{{ formatDate(derivation.date) }}</div>
          <div class="timeline-content">
            <div class="timeline-header">
              <span class="area">{{ derivation.area }}</span>
              <span class="status-badge" :class="derivation.status">
                {{ derivation.status }}
              </span>
            </div>
            <p class="instructions">{{ derivation.instructions }}</p>
            <div class="attachments" v-if="derivation.attachments?.length">
              <h4>Archivos Adjuntos:</h4>
              <ul>
                <li v-for="file in derivation.attachments" :key="file.id">
                  <a :href="file.url" target="_blank">{{ file.name }}</a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useDocumentStore } from '../store/documents'
import { documentService } from '../services/documentService'
import AreaSelector from '@/shared/components/AreaSelector.vue'
import FileUpload from '@/shared/components/FileUpload.vue'
import { formatDate } from '@/shared/utils/dateUtils'

const props = defineProps({
  documentId: {
    type: String,
    required: true
  }
})

const emit = defineEmits(['cancel', 'success'])

const documentStore = useDocumentStore()
const document = ref({})
const derivations = ref([])
const isSubmitting = ref(false)
const errors = ref({})

const formData = ref({
  areaId: '',
  priority: 'medium',
  instructions: '',
  attachments: []
})

// Cargar datos iniciales
onMounted(async () => {
  try {
    document.value = await documentService.getDocumentById(props.documentId)
    derivations.value = await documentService.getDocumentDerivations(props.documentId)
  } catch (error) {
    console.error('Error loading document data:', error)
  }
})

// Validaciones
const validateArea = (value) => {
  if (!value) {
    errors.value.areaId = 'Debe seleccionar un área destino'
  } else {
    delete errors.value.areaId
  }
}

const validateForm = () => {
  errors.value = {}
  
  if (!formData.value.areaId) {
    errors.value.areaId = 'Debe seleccionar un área destino'
  }
  
  if (!formData.value.instructions.trim()) {
    errors.value.instructions = 'Debe ingresar instrucciones'
  }
  
  return Object.keys(errors.value).length === 0
}

// Manejadores de eventos
const handleFileError = (error) => {
  console.error('File upload error:', error)
}

const handleSubmit = async () => {
  if (!validateForm()) return
  
  isSubmitting.value = true
  
  try {
    // Subir archivos adjuntos
    const uploadedFiles = await Promise.all(
      formData.value.attachments.map(file =>
        documentService.uploadAttachment(props.documentId, file)
      )
    )
    
    // Crear derivación
    const derivationData = {
      documentId: props.documentId,
      areaId: formData.value.areaId,
      priority: formData.value.priority,
      instructions: formData.value.instructions,
      attachments: uploadedFiles.map(file => file.id)
    }
    
    await documentService.deriveDocument(derivationData)
    
    // Actualizar lista de derivaciones
    derivations.value = await documentService.getDocumentDerivations(props.documentId)
    
    emit('success')
  } catch (error) {
    console.error('Error creating derivation:', error)
  } finally {
    isSubmitting.value = false
  }
}
</script>

<style scoped>
.document-derivation {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.document-header {
  margin-bottom: 30px;
}

.document-header h2 {
  margin: 0 0 10px;
  color: var(--primary-color);
}

.document-meta {
  display: flex;
  gap: 20px;
  color: var(--text-secondary);
}

.current-status {
  background: var(--background-light);
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 30px;
}

.status-info {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-top: 10px;
}

.status-badge {
  padding: 5px 10px;
  border-radius: 4px;
  font-size: 0.9em;
  font-weight: 500;
}

.status-badge.pending { background: var(--warning-light); color: var(--warning-dark); }
.status-badge.in-progress { background: var(--info-light); color: var(--info-dark); }
.status-badge.completed { background: var(--success-light); color: var(--success-dark); }
.status-badge.rejected { background: var(--danger-light); color: var(--danger-dark); }

.derivation-form {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  margin-bottom: 30px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: 500;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  font-size: 1em;
}

.form-group input.is-invalid,
.form-group select.is-invalid,
.form-group textarea.is-invalid {
  border-color: var(--danger-color);
}

.error {
  color: var(--danger-color);
  font-size: 0.9em;
  margin-top: 5px;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 15px;
  margin-top: 20px;
}

.btn-primary,
.btn-secondary {
  padding: 8px 16px;
  border-radius: 4px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: var(--primary-color);
  color: white;
  border: none;
}

.btn-primary:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.btn-secondary {
  background: transparent;
  border: 1px solid var(--border-color);
  color: var(--text-primary);
}

.derivation-history {
  margin-top: 40px;
}

.timeline {
  position: relative;
  padding-left: 30px;
}

.timeline::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 2px;
  background: var(--border-color);
}

.timeline-item {
  position: relative;
  padding-bottom: 30px;
}

.timeline-item::before {
  content: '';
  position: absolute;
  left: -34px;
  top: 0;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--primary-color);
}

.timeline-date {
  font-size: 0.9em;
  color: var(--text-secondary);
  margin-bottom: 5px;
}

.timeline-content {
  background: var(--background-light);
  padding: 15px;
  border-radius: 8px;
}

.timeline-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.timeline-header .area {
  font-weight: 500;
}

.instructions {
  margin: 10px 0;
  color: var(--text-primary);
}

.attachments {
  margin-top: 15px;
}

.attachments h4 {
  margin: 0 0 10px;
  font-size: 0.9em;
}

.attachments ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.attachments li {
  margin-bottom: 5px;
}

.attachments a {
  color: var(--primary-color);
  text-decoration: none;
}

.attachments a:hover {
  text-decoration: underline;
}

@media (max-width: 768px) {
  .document-derivation {
    padding: 15px;
  }
  
  .document-meta {
    flex-direction: column;
    gap: 10px;
  }
  
  .form-actions {
    flex-direction: column;
  }
  
  .btn-primary,
  .btn-secondary {
    width: 100%;
  }
}
</style> 