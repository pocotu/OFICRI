<template>
  <OfiModal
    v-model="show"
    title="Cambiar rol de usuario"
    @close="handleClose"
  >
    <template #default>
      <div class="change-role-modal">
        <OfiSelect
          v-model="selectedRole"
          :options="roles"
          placeholder="Seleccionar rol"
          :loading="loading"
        />
        
        <div class="user-info">
          <p><strong>Usuario:</strong> {{ user.Nombres }} {{ user.Apellidos }}</p>
          <p><strong>CIP:</strong> {{ user.CodigoCIP }}</p>
          <p><strong>Rol actual:</strong> {{ user.NombreRol }}</p>
        </div>
        
        <div v-if="selectedRole" class="role-permissions">
          <h4>Permisos del rol seleccionado:</h4>
          <div class="permissions-list">
            <div
              v-for="permission in rolePermissions"
              :key="permission.bit"
              class="permission-item"
            >
              <OfiBadge :type="permission.value ? 'success' : 'danger'">
                {{ permission.label }}
              </OfiBadge>
            </div>
          </div>
        </div>
      </div>
    </template>
    
    <template #footer>
      <div class="modal-footer">
        <OfiButton @click="handleClose">Cancelar</OfiButton>
        <OfiButton
          type="primary"
          :loading="saving"
          :disabled="!selectedRole"
          @click="handleSave"
        >
          Guardar cambios
        </OfiButton>
      </div>
    </template>
  </OfiModal>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useUserStore } from '../../store/userStore';
import OfiModal from '@shared/components/OfiModal/OfiModal.vue';
import OfiSelect from '@shared/components/OfiSelect/OfiSelect.vue';
import OfiButton from '@shared/components/OfiButton/OfiButton.vue';
import OfiBadge from '@shared/components/OfiBadge/OfiBadge.vue';

const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true
  },
  user: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(['update:modelValue', 'success']);

const userStore = useUserStore();
const show = ref(props.modelValue);
const selectedRole = ref(null);
const loading = ref(false);
const saving = ref(false);

const roles = ref([]);
const selectedRoleData = ref(null);

const rolePermissions = computed(() => {
  if (!selectedRoleData.value) return [];
  
  return [
    { bit: 0, label: 'Crear', value: (selectedRoleData.value.Permisos & 1) === 1 },
    { bit: 1, label: 'Editar', value: (selectedRoleData.value.Permisos & 2) === 2 },
    { bit: 2, label: 'Eliminar', value: (selectedRoleData.value.Permisos & 4) === 4 },
    { bit: 3, label: 'Ver', value: (selectedRoleData.value.Permisos & 8) === 8 },
    { bit: 4, label: 'Derivar', value: (selectedRoleData.value.Permisos & 16) === 16 },
    { bit: 5, label: 'Auditar', value: (selectedRoleData.value.Permisos & 32) === 32 },
    { bit: 6, label: 'Exportar', value: (selectedRoleData.value.Permisos & 64) === 64 },
    { bit: 7, label: 'Administrar', value: (selectedRoleData.value.Permisos & 128) === 128 }
  ];
});

watch(() => props.modelValue, (newValue) => {
  show.value = newValue;
  if (newValue) {
    loadRoles();
    selectedRole.value = props.user.IDRol;
  }
});

watch(show, (newValue) => {
  emit('update:modelValue', newValue);
});

watch(selectedRole, async (newValue) => {
  if (newValue) {
    await loadRoleDetails(newValue);
  }
});

const loadRoles = async () => {
  loading.value = true;
  try {
    const response = await userStore.getRoles();
    roles.value = response.data.map(role => ({
      value: role.IDRol,
      label: role.NombreRol
    }));
  } catch (error) {
    console.error('Error loading roles:', error);
  } finally {
    loading.value = false;
  }
};

const loadRoleDetails = async (roleId) => {
  try {
    const response = await userStore.getRoleById(roleId);
    selectedRoleData.value = response.data;
  } catch (error) {
    console.error('Error loading role details:', error);
  }
};

const handleClose = () => {
  show.value = false;
  selectedRole.value = null;
  selectedRoleData.value = null;
};

const handleSave = async () => {
  if (!selectedRole.value) return;
  
  saving.value = true;
  try {
    await userStore.changeUserRole(props.user.IDUsuario, selectedRole.value);
    emit('success');
    handleClose();
  } catch (error) {
    console.error('Error changing user role:', error);
  } finally {
    saving.value = false;
  }
};
</script>

<style scoped>
.change-role-modal {
  padding: 1rem;
}

.user-info {
  margin-top: 1rem;
  padding: 1rem;
  background-color: var(--bg-secondary);
  border-radius: 0.5rem;
}

.user-info p {
  margin: 0.5rem 0;
}

.role-permissions {
  margin-top: 1rem;
  padding: 1rem;
  background-color: var(--bg-secondary);
  border-radius: 0.5rem;
}

.role-permissions h4 {
  margin: 0 0 1rem 0;
}

.permissions-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 0.5rem;
}

.permission-item {
  display: flex;
  justify-content: center;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  padding: 1rem;
  border-top: 1px solid var(--border-color);
}
</style> 