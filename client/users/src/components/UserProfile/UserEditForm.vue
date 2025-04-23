<template>
  <form class="user-edit-form" @submit.prevent="handleSubmit">
    <div class="form-grid">
      <div class="form-group">
        <OfiInput
          v-model="formData.name"
          label="Nombre completo"
          placeholder="Ingrese el nombre completo"
          required
        />
      </div>

      <div class="form-group">
        <OfiInput
          v-model="formData.cip"
          label="CIP"
          placeholder="Ingrese el CIP"
          required
          :disabled="true"
          :rules="[validateCIP]"
        />
      </div>

      <div class="form-group">
        <OfiInput
          v-model="formData.email"
          label="Correo electrónico"
          type="email"
          placeholder="Ingrese el correo electrónico"
          required
        />
      </div>

      <div class="form-group">
        <OfiInput
          v-model="formData.phone"
          label="Teléfono"
          placeholder="Ingrese el teléfono"
        />
      </div>

      <div class="form-group">
        <OfiSelect
          v-model="formData.areaId"
          label="Área"
          :options="areas"
          option-label="name"
          option-value="id"
          placeholder="Seleccione el área"
          required
          :disabled="!canChangeArea"
        />
      </div>

      <div class="form-group">
        <OfiSelect
          v-model="formData.roleId"
          label="Rol"
          :options="roles"
          option-label="name"
          option-value="id"
          placeholder="Seleccione el rol"
          required
          :disabled="!canChangeRole"
        />
      </div>
    </div>

    <div class="form-actions">
      <OfiButton
        type="button"
        variant="secondary"
        @click="$emit('cancel')"
      >
        Cancelar
      </OfiButton>
      <OfiButton
        type="submit"
        variant="primary"
        :loading="saving"
        :disabled="!canSave"
      >
        Guardar cambios
      </OfiButton>
    </div>
  </form>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useUserStore } from '@/store/userStore'
import { useAuthStore } from '@/store/authStore'
import { useCIPValidator } from '@shared/composables/useCIPValidator'
import OfiInput from '@shared/components/OfiInput.vue'
import OfiSelect from '@shared/components/OfiSelect.vue'
import OfiButton from '@shared/components/OfiButton.vue'

const props = defineProps({
  user: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['save', 'cancel'])

const userStore = useUserStore()
const authStore = useAuthStore()
const { validateCIP } = useCIPValidator()

const formData = ref({ ...props.user })
const areas = ref([])
const roles = ref([])
const saving = ref(false)

const canChangeArea = computed(() => {
  return authStore.hasPermission(2) // Bit 2: Editar
})

const canChangeRole = computed(() => {
  return authStore.hasPermission(128) // Bit 7: Administrar
})

const canSave = computed(() => {
  return canChangeArea.value || canChangeRole.value
})

const loadAreas = async () => {
  try {
    areas.value = await userStore.getAreas()
  } catch (err) {
    console.error('Error loading areas:', err)
  }
}

const loadRoles = async () => {
  try {
    roles.value = await userStore.getRoles()
  } catch (err) {
    console.error('Error loading roles:', err)
  }
}

const handleSubmit = async () => {
  try {
    saving.value = true
    await userStore.updateUser(props.user.id, formData.value)
    emit('save', formData.value)
  } catch (err) {
    console.error('Error saving user:', err)
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  loadAreas()
  loadRoles()
})
</script>

<style scoped>
.user-edit-form {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--spacing-md);
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-md);
  margin-top: var(--spacing-lg);
}
</style> 