<template>
  <div class="area-form-container">
    <div class="form-header">
      <h3>{{ isEditing ? 'Editar Área' : 'Nueva Área' }}</h3>
      <button class="close-button" @click="$emit('close')" title="Cerrar">
        <i class="fas fa-times"></i>
      </button>
    </div>

    <form @submit.prevent="handleSubmit" class="area-form">
      <div class="form-body">
        <div class="form-group">
          <label for="codigo" class="form-label">
            Código de Identificación <span class="required">*</span>
          </label>
          <input 
            id="codigo"
            v-model="formData.CodigoIdentificacion"
            type="text"
            class="form-control"
            :class="{'is-invalid': errors.CodigoIdentificacion}"
            placeholder="Ej. AREA-001"
            maxlength="20"
            required
          >
          <div v-if="errors.CodigoIdentificacion" class="invalid-feedback">
            {{ errors.CodigoIdentificacion }}
          </div>
          <small class="form-text text-muted">Código único de identificación para el área</small>
        </div>

        <div class="form-group">
          <label for="nombre" class="form-label">
            Nombre del Área <span class="required">*</span>
          </label>
          <input 
            id="nombre"
            v-model="formData.NombreArea"
            type="text"
            class="form-control"
            :class="{'is-invalid': errors.NombreArea}"
            placeholder="Ej. Departamento de Recepción"
            maxlength="100"
            required
          >
          <div v-if="errors.NombreArea" class="invalid-feedback">
            {{ errors.NombreArea }}
          </div>
        </div>

        <div class="form-group">
          <label for="tipo" class="form-label">
            Tipo de Área <span class="required">*</span>
          </label>
          <select 
            id="tipo"
            v-model="formData.TipoArea"
            class="form-control"
            :class="{'is-invalid': errors.TipoArea}"
            required
          >
            <option value="" disabled>Seleccione un tipo</option>
            <option v-for="(label, value) in tiposArea" :key="value" :value="value">
              {{ label }}
            </option>
          </select>
          <div v-if="errors.TipoArea" class="invalid-feedback">
            {{ errors.TipoArea }}
          </div>
        </div>

        <div class="form-group">
          <label for="area-padre" class="form-label">
            Área Superior
          </label>
          <select 
            id="area-padre"
            v-model="formData.IDAreaPadre"
            class="form-control"
            :class="{'is-invalid': errors.IDAreaPadre}"
          >
            <option value="">Sin área superior (Área Raíz)</option>
            <option 
              v-for="area in areasSeleccionables" 
              :key="area.IDArea" 
              :value="area.IDArea"
              :disabled="area.IDArea === formData.IDArea"
            >
              {{ area.NombreArea }} ({{ area.CodigoIdentificacion }})
            </option>
          </select>
          <div v-if="errors.IDAreaPadre" class="invalid-feedback">
            {{ errors.IDAreaPadre }}
          </div>
          <small class="form-text text-muted">Área jerárquicamente superior</small>
        </div>

        <div class="form-group">
          <label for="descripcion" class="form-label">
            Descripción
          </label>
          <textarea 
            id="descripcion"
            v-model="formData.Descripcion"
            class="form-control"
            :class="{'is-invalid': errors.Descripcion}"
            placeholder="Ingrese una descripción detallada del área"
            rows="3"
            maxlength="500"
          ></textarea>
          <div v-if="errors.Descripcion" class="invalid-feedback">
            {{ errors.Descripcion }}
          </div>
        </div>

        <div class="form-group" v-if="isEditing">
          <label class="form-check-label">
            <input 
              type="checkbox"
              class="form-check-input"
              v-model="formData.IsActive"
            >
            Área Activa
          </label>
          <small class="form-text text-muted d-block">
            Las áreas inactivas no se podrán seleccionar en los formularios pero mantendrán sus relaciones existentes
          </small>
        </div>

        <div v-if="isEditing" class="form-group form-metadata">
          <div class="metadata-item">
            <span class="metadata-label">Creado por:</span>
            <span>{{ formData.CreadoPor || 'No disponible' }}</span>
          </div>
          <div class="metadata-item">
            <span class="metadata-label">Fecha de creación:</span>
            <span>{{ formatDate(formData.FechaCreacion) }}</span>
          </div>
          <div v-if="formData.UltimaActualizacion" class="metadata-item">
            <span class="metadata-label">Última actualización:</span>
            <span>{{ formatDate(formData.UltimaActualizacion) }}</span>
          </div>
        </div>
      </div>

      <div class="form-actions">
        <button 
          type="button" 
          class="btn btn-secondary" 
          @click="$emit('close')"
        >
          Cancelar
        </button>
        <button 
          type="submit" 
          class="btn btn-primary"
          :disabled="isSaving || !isFormValid"
        >
          <span v-if="isSaving">
            <i class="fas fa-spinner fa-spin"></i>
            Guardando...
          </span>
          <span v-else>
            {{ isEditing ? 'Actualizar' : 'Crear' }}
          </span>
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useAreaStore } from '@/store/areas'
import { auditService } from '@/shared/services/security/auditTrail'
import { areaValidator } from '@/shared/services/areaRegistry'

const props = defineProps({
  area: {
    type: Object,
    default: null
  },
  allAreas: {
    type: Array,
    required: true
  }
})

const emit = defineEmits(['save', 'close', 'validation-error'])

// Store
const areaStore = useAreaStore()

// Estado local
const initialFormData = {
  IDArea: null,
  CodigoIdentificacion: '',
  NombreArea: '',
  TipoArea: '',
  Descripcion: '',
  IDAreaPadre: '',
  IsActive: true,
  FechaCreacion: null,
  UltimaActualizacion: null,
  CreadoPor: null
}

const formData = ref({ ...initialFormData })
const errors = ref({})
const isSaving = ref(false)
const tiposArea = ref({
  'RECEPCION': 'Recepción',
  'ESPECIALIZADA': 'Especializada',
  'ADMINISTRATIVA': 'Administrativa',
  'OPERATIVA': 'Operativa',
  'LEGAL': 'Legal',
  'MESA_PARTES': 'Mesa de Partes',
  'OTRO': 'Otro'
})

// Computed
const isEditing = computed(() => {
  return formData.value.IDArea !== null
})

const isFormValid = computed(() => {
  return (
    formData.value.CodigoIdentificacion &&
    formData.value.NombreArea &&
    formData.value.TipoArea &&
    Object.keys(errors.value).length === 0
  )
})

const areasSeleccionables = computed(() => {
  // Si estamos en modo edición, filtramos el área actual y sus descendientes
  if (isEditing.value) {
    return props.allAreas.filter(area => {
      // No podemos seleccionar el área actual ni sus descendientes como padre
      return !isDescendantOf(area, formData.value.IDArea) && area.IDArea !== formData.value.IDArea
    })
  }
  // Si estamos creando, mostramos todas las áreas
  return props.allAreas
})

// Métodos
const validateForm = async () => {
  errors.value = {}
  
  // Validar código de identificación
  if (!formData.value.CodigoIdentificacion) {
    errors.value.CodigoIdentificacion = 'El código de identificación es obligatorio'
  } else if (!/^[A-Z0-9-_]{3,20}$/i.test(formData.value.CodigoIdentificacion)) {
    errors.value.CodigoIdentificacion = 'El código debe tener entre 3 y 20 caracteres alfanuméricos'
  } else {
    // Verificar que el código no exista ya (excepto si es el mismo área en edición)
    const existingArea = props.allAreas.find(a => 
      a.CodigoIdentificacion.toLowerCase() === formData.value.CodigoIdentificacion.toLowerCase() && 
      a.IDArea !== formData.value.IDArea
    )
    
    if (existingArea) {
      errors.value.CodigoIdentificacion = `El código ${formData.value.CodigoIdentificacion} ya está en uso`
    }
  }
  
  // Validar nombre
  if (!formData.value.NombreArea) {
    errors.value.NombreArea = 'El nombre del área es obligatorio'
  } else if (formData.value.NombreArea.length < 3) {
    errors.value.NombreArea = 'El nombre debe tener al menos 3 caracteres'
  }
  
  // Validar tipo
  if (!formData.value.TipoArea) {
    errors.value.TipoArea = 'Debe seleccionar un tipo de área'
  }
  
  // Validar reglas específicas según el tipo
  if (formData.value.TipoArea) {
    try {
      const validationResult = await areaValidator.validateAreaType(
        formData.value.TipoArea, 
        formData.value
      )
      
      if (!validationResult.valid) {
        // Agregar errores específicos del tipo
        Object.assign(errors.value, validationResult.errors)
      }
    } catch (error) {
      console.error('Error en validación de tipo:', error)
    }
  }
  
  // Validar área padre
  if (formData.value.IDAreaPadre) {
    // Verificar que el área padre exista
    const parentArea = props.allAreas.find(a => a.IDArea === formData.value.IDAreaPadre)
    if (!parentArea) {
      errors.value.IDAreaPadre = 'El área superior seleccionada no existe'
    }
    // Verificar que no genere un ciclo
    else if (isEditing.value && isDescendantOf(parentArea, formData.value.IDArea)) {
      errors.value.IDAreaPadre = 'No se puede seleccionar un área descendiente como área superior'
    }
  }
  
  return Object.keys(errors.value).length === 0
}

const isDescendantOf = (area, potentialAncestorId) => {
  let current = area
  while (current && current.IDAreaPadre) {
    if (current.IDAreaPadre === potentialAncestorId) {
      return true
    }
    current = props.allAreas.find(a => a.IDArea === current.IDAreaPadre)
  }
  return false
}

const handleSubmit = async () => {
  const isValid = await validateForm()
  
  if (!isValid) {
    emit('validation-error', errors.value)
    return
  }
  
  isSaving.value = true
  
  try {
    let result
    const areaData = { ...formData.value }
    
    if (isEditing.value) {
      // Actualizar área existente
      result = await areaStore.updateArea(areaData)
      
      // Registrar en auditoría
      await auditService.log({
        action: 'AREA_UPDATED',
        resource: { id: areaData.IDArea, type: 'AREA' },
        details: `Actualización del área "${areaData.NombreArea}"`
      })
    } else {
      // Crear nueva área
      delete areaData.IDArea // Asegurarse de que no se envía un ID
      result = await areaStore.createArea(areaData)
      
      // Registrar en auditoría
      await auditService.log({
        action: 'AREA_CREATED',
        resource: { id: result.IDArea, type: 'AREA' },
        details: `Creación del área "${areaData.NombreArea}"`
      })
    }
    
    emit('save', result)
  } catch (error) {
    console.error('Error al guardar área:', error)
    
    // Manejar errores específicos del servidor
    if (error.response && error.response.data && error.response.data.errors) {
      errors.value = { ...errors.value, ...error.response.data.errors }
    } else {
      // Error genérico
      areaStore.setError(
        isEditing.value 
          ? 'Error al actualizar el área. Intente nuevamente.' 
          : 'Error al crear el área. Intente nuevamente.'
      )
    }
  } finally {
    isSaving.value = false
  }
}

const formatDate = (dateString) => {
  if (!dateString) return 'No disponible'
  
  try {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  } catch (e) {
    return dateString
  }
}

// Observar cambios en el área para actualizar el formulario
watch(() => props.area, (newArea) => {
  if (newArea) {
    // Si se proporciona un área, estamos en modo edición
    formData.value = { ...newArea }
    
    // Convertir IDAreaPadre a string o vacío para el select
    formData.value.IDAreaPadre = newArea.IDAreaPadre ? newArea.IDAreaPadre : ''
  } else {
    // Si no hay área, estamos en modo creación
    formData.value = { ...initialFormData }
  }
}, { immediate: true })

// Vigilar cambios en los campos para validación en tiempo real
watch(
  () => [
    formData.value.CodigoIdentificacion,
    formData.value.NombreArea,
    formData.value.TipoArea,
    formData.value.IDAreaPadre
  ],
  () => {
    // Validar después de un pequeño retraso para evitar validaciones excesivas
    // durante la escritura del usuario
    setTimeout(() => {
      validateForm()
    }, 300)
  }
)

onMounted(() => {
  // Validar el formulario inicialmente
  validateForm()
})
</script>

<style scoped>
.area-form-container {
  width: 100%;
  background-color: #fff;
  border-radius: 6px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  max-height: 100%;
}

.form-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  background-color: #f0f4f8;
  border-bottom: 1px solid #e0e0e0;
}

.form-header h3 {
  margin: 0;
  font-size: 18px;
  color: #2c3e50;
}

.close-button {
  background: none;
  border: none;
  cursor: pointer;
  color: #666;
  font-size: 18px;
  padding: 4px;
  border-radius: 4px;
}

.close-button:hover {
  background-color: #e9ecef;
}

.area-form {
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: hidden;
}

.form-body {
  padding: 20px 24px;
  overflow-y: auto;
  flex: 1;
}

.form-group {
  margin-bottom: 20px;
}

.form-label {
  display: block;
  margin-bottom: 6px;
  font-weight: 500;
  color: #333;
}

.required {
  color: #dc3545;
  margin-left: 2px;
}

.form-control {
  display: block;
  width: 100%;
  padding: 8px 12px;
  font-size: 14px;
  border: 1px solid #ced4da;
  border-radius: 4px;
  transition: border-color 0.15s ease-in-out;
}

.form-control:focus {
  border-color: #80bdff;
  outline: 0;
  box-shadow: 0 0 0 0.2rem rgba(0,123,255,0.25);
}

.form-control.is-invalid {
  border-color: #dc3545;
}

.invalid-feedback {
  display: block;
  width: 100%;
  margin-top: 5px;
  font-size: 12px;
  color: #dc3545;
}

.form-text {
  display: block;
  margin-top: 4px;
  font-size: 12px;
  color: #6c757d;
}

.form-check-input {
  margin-right: 8px;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 12px;
  padding: 16px 24px;
  background-color: #f8f9fa;
  border-top: 1px solid #e0e0e0;
}

.btn {
  padding: 8px 16px;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 100px;
  border: 1px solid transparent;
}

.btn-primary {
  background-color: #4285f4;
  color: white;
}

.btn-primary:hover {
  background-color: #3367d6;
}

.btn-primary:disabled {
  background-color: #a0bffc;
  cursor: not-allowed;
}

.btn-secondary {
  background-color: #f5f5f5;
  color: #333;
  border-color: #ddd;
}

.btn-secondary:hover {
  background-color: #e9ecef;
}

.form-metadata {
  background-color: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 4px;
  padding: 12px 16px;
  font-size: 13px;
}

.metadata-item {
  display: flex;
  margin-bottom: 4px;
}

.metadata-item:last-child {
  margin-bottom: 0;
}

.metadata-label {
  font-weight: 500;
  width: 150px;
  flex-shrink: 0;
}

/* Estilos para dispositivos móviles */
@media (max-width: 576px) {
  .form-actions {
    flex-direction: column;
    gap: 8px;
  }
  
  .btn {
    width: 100%;
  }
}
</style> 