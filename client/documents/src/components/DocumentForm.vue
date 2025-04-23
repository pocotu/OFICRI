<template>
  <div class="document-form">
    <form @submit.prevent="handleSubmit">
      <div class="form-section">
        <h2>{{ isEdit ? 'Editar Documento' : 'Nuevo Documento' }}</h2>
        
        <div class="form-group">
          <label for="type">Tipo de Documento</label>
          <select
            id="type"
            v-model="formData.type"
            required
            :disabled="isEdit"
          >
            <option value="">Seleccione un tipo</option>
            <option v-for="type in documentTypes" :key="type.value" :value="type.value">
              {{ type.label }}
            </option>
          </select>
        </div>

        <div class="form-group">
          <label for="title">Título</label>
          <input
            id="title"
            v-model="formData.title"
            type="text"
            required
            placeholder="Ingrese el título del documento"
          />
        </div>

        <div class="form-group">
          <label for="description">Descripción</label>
          <textarea
            id="description"
            v-model="formData.description"
            rows="4"
            placeholder="Ingrese la descripción del documento"
          ></textarea>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="number">Número</label>
            <input
              id="number"
              v-model="formData.number"
              type="text"
              required
              :disabled="isEdit"
              placeholder="Número de documento"
            />
          </div>

          <div class="form-group">
            <label for="date">Fecha</label>
            <input
              id="date"
              v-model="formData.date"
              type="date"
              required
            />
          </div>
        </div>

        <div class="form-group">
          <label for="area">Área Destino</label>
          <select
            id="area"
            v-model="formData.areaId"
            required
          >
            <option value="">Seleccione un área</option>
            <option v-for="area in areas" :key="area.id" :value="area.id">
              {{ area.name }}
            </option>
          </select>
        </div>

        <div class="form-group">
          <label for="priority">Prioridad</label>
          <select
            id="priority"
            v-model="formData.priority"
            required
          >
            <option value="">Seleccione una prioridad</option>
            <option v-for="priority in priorities" :key="priority.value" :value="priority.value">
              {{ priority.label }}
            </option>
          </select>
        </div>

        <div class="form-group">
          <label>Archivos Adjuntos</label>
          <FileUpload 
            ref="fileUpload"
            :multiple="true"
            :accept="'.pdf,.doc,.docx,.xls,.xlsx'"
            :max-size="maxFileSize"
            :max-files="5"
            @update:files="handleFilesUpdate"
          />
        </div>
      </div>

      <div class="form-actions">
        <button type="button" @click="cancel" class="cancel">
          Cancelar
        </button>
        <button type="submit" :disabled="isLoading" class="submit">
          {{ isEdit ? 'Actualizar' : 'Crear' }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useDocumentStore } from '@/store/documents'
import { useAreaStore } from '@/store/areas'
import { useAuthStore } from '@/store'
import FileUpload from '@/components/FileUpload.vue'

const router = useRouter()
const route = useRoute()
const documentStore = useDocumentStore()
const areaStore = useAreaStore()
const authStore = useAuthStore()
const fileUpload = ref(null)
const maxFileSize = 15 * 1024 * 1024 // 15MB máximo por archivo

const isEdit = computed(() => route.params.id !== undefined)
const isLoading = computed(() => documentStore.isLoading)
const hasPermissionToEdit = computed(() => authStore.hasPermission(2)) // Bit 1 = Editar
const hasPermissionToCreate = computed(() => authStore.hasPermission(1)) // Bit 0 = Crear

// Tipos de documentos y prioridades
const documentTypes = [
  { value: 'oficio', label: 'Oficio' },
  { value: 'memorandum', label: 'Memorándum' },
  { value: 'resolucion', label: 'Resolución' },
  { value: 'informe', label: 'Informe' }
]

const priorities = [
  { value: 'low', label: 'Baja' },
  { value: 'medium', label: 'Media' },
  { value: 'high', label: 'Alta' },
  { value: 'urgent', label: 'Urgente' }
]

// Estado del formulario
const formData = ref({
  type: '',
  title: '',
  description: '',
  number: '',
  date: new Date().toISOString().split('T')[0], // Fecha actual por defecto
  areaId: '',
  priority: '',
  attachments: []
})

const areas = ref([])

// Métodos
const handleFilesUpdate = (files) => {
  formData.value.attachments = files
}

const validateForm = () => {
  if (!formData.value.type) {
    alert('Por favor seleccione un tipo de documento')
    return false
  }
  if (!formData.value.title) {
    alert('Por favor ingrese un título para el documento')
    return false
  }
  if (!formData.value.number) {
    alert('Por favor ingrese un número de documento')
    return false
  }
  if (!formData.value.date) {
    alert('Por favor seleccione una fecha')
    return false
  }
  if (!formData.value.areaId) {
    alert('Por favor seleccione un área destino')
    return false
  }
  if (!formData.value.priority) {
    alert('Por favor seleccione una prioridad')
    return false
  }
  return true
}

const handleSubmit = async () => {
  if (!validateForm()) return

  try {
    if (isEdit.value) {
      if (!hasPermissionToEdit.value) {
        alert('No tiene permiso para editar documentos')
        return
      }
      await documentStore.updateDocument(route.params.id, formData.value)
      
      // Subir archivos si hay nuevos
      if (formData.value.attachments.length > 0) {
        for (const file of formData.value.attachments) {
          if (!file.id) { // Si es un archivo nuevo (no tiene ID)
            await documentStore.uploadAttachment(route.params.id, file)
          }
        }
      }
    } else {
      if (!hasPermissionToCreate.value) {
        alert('No tiene permiso para crear documentos')
        return
      }
      const newDocument = await documentStore.createDocument(formData.value)
      
      // Subir archivos si hay
      if (formData.value.attachments.length > 0) {
        for (const file of formData.value.attachments) {
          await documentStore.uploadAttachment(newDocument.id, file)
        }
      }
    }
    router.push('/documents')
  } catch (error) {
    console.error('Error al guardar documento:', error)
    alert(`Error al ${isEdit.value ? 'actualizar' : 'crear'} el documento: ${error.message || 'Error desconocido'}`)
  }
}

const cancel = () => {
  router.push('/documents')
}

// Cargar datos iniciales
onMounted(async () => {
  // Verificar permisos
  if (isEdit.value && !hasPermissionToEdit.value) {
    alert('No tiene permiso para editar documentos')
    router.push('/documents')
    return
  }
  
  if (!isEdit.value && !hasPermissionToCreate.value) {
    alert('No tiene permiso para crear documentos')
    router.push('/documents')
    return
  }

  try {
    // Cargar áreas
    await areaStore.fetchAreas()
    areas.value = areaStore.areas

    // Si es edición, cargar el documento
    if (isEdit.value) {
      await documentStore.fetchDocumentById(route.params.id)
      if (documentStore.currentDocument) {
        const doc = documentStore.currentDocument
        formData.value = {
          type: doc.type,
          title: doc.title,
          description: doc.description,
          number: doc.number,
          date: doc.date ? new Date(doc.date).toISOString().split('T')[0] : '',
          areaId: doc.areaId,
          priority: doc.priority,
          attachments: doc.attachments || []
        }
      }
    }
  } catch (error) {
    console.error('Error al cargar datos iniciales:', error)
    alert('Error al cargar datos. Por favor intente de nuevo.')
  }
})
</script>

<style scoped>
.document-form {
  padding: 1rem;
  max-width: 800px;
  margin: 0 auto;
}

.form-section {
  background-color: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

h2 {
  margin-bottom: 1.5rem;
  color: #333;
}

.form-group {
  margin-bottom: 1rem;
}

.form-row {
  display: flex;
  gap: 1rem;
}

.form-row .form-group {
  flex: 1;
}

label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #444;
}

input,
select,
textarea {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}

textarea {
  resize: vertical;
  min-height: 100px;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 1.5rem;
}

.form-actions button {
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
}

.cancel {
  background-color: #f5f5f5;
  border: 1px solid #ddd;
  color: #666;
}

.submit {
  background-color: #1a237e;
  border: none;
  color: white;
}

.submit:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .form-row {
    flex-direction: column;
  }
}
</style> 