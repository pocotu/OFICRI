<template>
  <OfiModal
    v-model="showModal"
    title="Clonar Rol"
    @close="handleClose"
  >
    <template #default>
      <OfiForm @submit="handleSubmit" :loading="loading">
        <OfiInput
          v-model="newRoleName"
          label="Nombre del Nuevo Rol"
          :rules="[required]"
        />
        
        <OfiSelect
          v-model="baseRoleId"
          label="Rol Base"
          :options="roles"
          option-label="nombreRol"
          option-value="idRol"
          :rules="[required]"
        />

        <div class="permissions-preview">
          <h4>Permisos a Clonar</h4>
          <div class="permission-list">
            <div
              v-for="permission in baseRolePermissions"
              :key="permission.id"
              class="permission-item"
            >
              <OfiCheckbox
                v-model="selectedPermissions[permission.id]"
                :label="permission.name"
                disabled
              />
            </div>
          </div>
        </div>
      </OfiForm>
    </template>

    <template #footer>
      <OfiButton
        variant="secondary"
        @click="handleClose"
      >
        Cancelar
      </OfiButton>
      <OfiButton
        variant="primary"
        :loading="loading"
        :disabled="!isValid"
        @click="handleSubmit"
      >
        Clonar Rol
      </OfiButton>
    </template>
  </OfiModal>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useRoleStore } from '@/store/roleStore';
import { useNotification } from '@shared/composables/useNotification';
import OfiModal from '@shared/components/OfiModal.vue';
import OfiForm from '@shared/components/OfiForm.vue';
import OfiInput from '@shared/components/OfiInput.vue';
import OfiSelect from '@shared/components/OfiSelect.vue';
import OfiButton from '@shared/components/OfiButton.vue';
import OfiCheckbox from '@shared/components/OfiCheckbox.vue';

const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true
  }
});

const emit = defineEmits(['update:modelValue', 'cloned']);

const roleStore = useRoleStore();
const notification = useNotification();

const showModal = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
});

const loading = ref(false);
const newRoleName = ref('');
const baseRoleId = ref(null);
const selectedPermissions = ref({});
const roles = ref([]);

const baseRolePermissions = computed(() => {
  const role = roles.value.find(r => r.idRol === baseRoleId.value);
  return role ? role.permisos : [];
});

const isValid = computed(() => {
  return newRoleName.value && baseRoleId.value;
});

const required = (value) => !!value || 'Este campo es requerido';

const loadRoles = async () => {
  try {
    await roleStore.fetchRoles();
    roles.value = roleStore.roles;
  } catch (error) {
    notification.error('Error al cargar roles');
  }
};

const handleClose = () => {
  showModal.value = false;
  resetForm();
};

const resetForm = () => {
  newRoleName.value = '';
  baseRoleId.value = null;
  selectedPermissions.value = {};
};

const handleSubmit = async () => {
  try {
    loading.value = true;
    
    const baseRole = roles.value.find(r => r.idRol === baseRoleId.value);
    if (!baseRole) {
      throw new Error('Rol base no encontrado');
    }

    const newRole = {
      nombreRol: newRoleName.value,
      permisos: baseRole.permisos,
      descripcion: `Clonado de ${baseRole.nombreRol}`
    };

    await roleStore.createRole(newRole);
    notification.success('Rol clonado exitosamente');
    emit('cloned');
    handleClose();
  } catch (error) {
    notification.error(error.message || 'Error al clonar rol');
  } finally {
    loading.value = false;
  }
};

watch(() => showModal.value, (newValue) => {
  if (newValue) {
    loadRoles();
  }
});
</script>

<style scoped>
.permissions-preview {
  margin-top: 20px;
  padding: 15px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
}

.permissions-preview h4 {
  margin-bottom: 10px;
  color: var(--text-color);
}

.permission-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 10px;
}

.permission-item {
  display: flex;
  align-items: center;
  gap: 8px;
}
</style> 