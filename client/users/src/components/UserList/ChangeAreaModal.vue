<template>
  <OfiModal
    v-model="show"
    title="Cambiar área de usuario"
    @close="handleClose"
  >
    <template #default>
      <div class="change-area-modal">
        <OfiSelect
          v-model="selectedArea"
          :options="areas"
          placeholder="Seleccionar área"
          :loading="loading"
        />
        
        <div class="user-info">
          <p><strong>Usuario:</strong> {{ user.Nombres }} {{ user.Apellidos }}</p>
          <p><strong>CIP:</strong> {{ user.CodigoCIP }}</p>
          <p><strong>Área actual:</strong> {{ user.NombreArea }}</p>
        </div>
      </div>
    </template>
    
    <template #footer>
      <div class="modal-footer">
        <OfiButton @click="handleClose">Cancelar</OfiButton>
        <OfiButton
          type="primary"
          :loading="saving"
          :disabled="!selectedArea"
          @click="handleSave"
        >
          Guardar cambios
        </OfiButton>
      </div>
    </template>
  </OfiModal>
</template>

<script setup>
import { ref, watch } from 'vue';
import { useUserStore } from '../../store/userStore';
import OfiModal from '@shared/components/OfiModal/OfiModal.vue';
import OfiSelect from '@shared/components/OfiSelect/OfiSelect.vue';
import OfiButton from '@shared/components/OfiButton/OfiButton.vue';

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
const selectedArea = ref(null);
const loading = ref(false);
const saving = ref(false);

const areas = ref([]);

watch(() => props.modelValue, (newValue) => {
  show.value = newValue;
  if (newValue) {
    loadAreas();
    selectedArea.value = props.user.IDArea;
  }
});

watch(show, (newValue) => {
  emit('update:modelValue', newValue);
});

const loadAreas = async () => {
  loading.value = true;
  try {
    const response = await userStore.getAreas();
    areas.value = response.data.map(area => ({
      value: area.IDArea,
      label: area.NombreArea
    }));
  } catch (error) {
    console.error('Error loading areas:', error);
  } finally {
    loading.value = false;
  }
};

const handleClose = () => {
  show.value = false;
  selectedArea.value = null;
};

const handleSave = async () => {
  if (!selectedArea.value) return;
  
  saving.value = true;
  try {
    await userStore.changeUserArea(props.user.IDUsuario, selectedArea.value);
    emit('success');
    handleClose();
  } catch (error) {
    console.error('Error changing user area:', error);
  } finally {
    saving.value = false;
  }
};
</script>

<style scoped>
.change-area-modal {
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

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  padding: 1rem;
  border-top: 1px solid var(--border-color);
}
</style> 