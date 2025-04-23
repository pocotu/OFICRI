<template>
  <form @submit.prevent="handleSubmit" class="ofi-form">
    <div class="ofi-form__fields">
      <slot></slot>
    </div>
    <div class="ofi-form__actions" v-if="showActions">
      <OfiButton
        type="submit"
        :loading="loading"
        :disabled="loading || !isValid"
        variant="primary"
      >
        {{ submitText }}
      </OfiButton>
      <OfiButton
        v-if="showCancel"
        type="button"
        :disabled="loading"
        variant="secondary"
        @click="$emit('cancel')"
      >
        {{ cancelText }}
      </OfiButton>
    </div>
  </form>
</template>

<script setup>
import { ref, computed } from 'vue'
import OfiButton from '../OfiButton/OfiButton.vue'

const props = defineProps({
  loading: {
    type: Boolean,
    default: false
  },
  showActions: {
    type: Boolean,
    default: true
  },
  showCancel: {
    type: Boolean,
    default: true
  },
  submitText: {
    type: String,
    default: 'Guardar'
  },
  cancelText: {
    type: String,
    default: 'Cancelar'
  },
  validationSchema: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits(['submit', 'cancel', 'validation-error'])

const errors = ref({})
const touched = ref({})

const isValid = computed(() => {
  return Object.keys(errors.value).length === 0
})

const validateField = (field, value) => {
  const rules = props.validationSchema[field]
  if (!rules) return true

  const fieldErrors = []
  
  if (rules.required && !value) {
    fieldErrors.push('Este campo es requerido')
  }
  
  if (rules.minLength && value.length < rules.minLength) {
    fieldErrors.push(`Mínimo ${rules.minLength} caracteres`)
  }
  
  if (rules.maxLength && value.length > rules.maxLength) {
    fieldErrors.push(`Máximo ${rules.maxLength} caracteres`)
  }
  
  if (rules.pattern && !rules.pattern.test(value)) {
    fieldErrors.push(rules.message || 'Formato inválido')
  }
  
  if (rules.custom && typeof rules.custom === 'function') {
    const customError = rules.custom(value)
    if (customError) {
      fieldErrors.push(customError)
    }
  }

  errors.value[field] = fieldErrors
  return fieldErrors.length === 0
}

const validateForm = () => {
  let isValid = true
  Object.keys(props.validationSchema).forEach(field => {
    if (!validateField(field, touched.value[field])) {
      isValid = false
    }
  })
  return isValid
}

const handleSubmit = () => {
  if (!validateForm()) {
    emit('validation-error', errors.value)
    return
  }
  emit('submit', touched.value)
}

const setFieldValue = (field, value) => {
  touched.value[field] = value
  validateField(field, value)
}

const setFieldTouched = (field) => {
  validateField(field, touched.value[field])
}

defineExpose({
  setFieldValue,
  setFieldTouched,
  validateForm,
  errors
})
</script>

<style scoped>
.ofi-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.ofi-form__fields {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.ofi-form__actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 1rem;
}
</style> 