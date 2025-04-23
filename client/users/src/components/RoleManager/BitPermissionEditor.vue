<template>
  <div class="bit-permission-editor">
    <div class="header">
      <h3>Editor de Permisos por Bits</h3>
      <div class="bit-summary">
        <span>Valor Total: {{ totalValue }}</span>
        <span>Bits: {{ binaryValue }}</span>
      </div>
    </div>

    <div class="permission-grid">
      <div
        v-for="(permission, index) in permissions"
        :key="index"
        class="permission-item"
        :class="{ active: isBitSet(index) }"
        @click="toggleBit(index)"
      >
        <div class="bit-info">
          <span class="bit-number">Bit {{ index }}</span>
          <span class="bit-value">{{ permission.value }}</span>
        </div>
        <div class="permission-info">
          <h4>{{ permission.name }}</h4>
          <p>{{ permission.description }}</p>
        </div>
        <div class="bit-visual">
          <div class="bit-box" :class="{ active: isBitSet(index) }">
            {{ isBitSet(index) ? '1' : '0' }}
          </div>
        </div>
      </div>
    </div>

    <div class="predefined-roles">
      <h4>Roles Predefinidos</h4>
      <div class="role-buttons">
        <OfiButton
          v-for="role in predefinedRoles"
          :key="role.name"
          variant="outline"
          @click="applyPredefinedRole(role)"
        >
          {{ role.name }}
        </OfiButton>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import OfiButton from '@shared/components/OfiButton.vue';

const props = defineProps({
  modelValue: {
    type: Number,
    required: true
  }
});

const emit = defineEmits(['update:modelValue']);

const permissions = [
  { name: 'Crear', value: 1, description: 'Permiso para crear nuevos recursos' },
  { name: 'Editar', value: 2, description: 'Permiso para modificar recursos existentes' },
  { name: 'Eliminar', value: 4, description: 'Permiso para eliminar recursos' },
  { name: 'Ver', value: 8, description: 'Permiso para visualizar recursos' },
  { name: 'Derivar', value: 16, description: 'Permiso para derivar documentos' },
  { name: 'Auditar', value: 32, description: 'Permiso para ver logs y hacer auditorías' },
  { name: 'Exportar', value: 64, description: 'Permiso para exportar datos' },
  { name: 'Administrar', value: 128, description: 'Acceso completo al sistema' }
];

const predefinedRoles = [
  { name: 'Administrador', value: 255, description: 'Todos los permisos' },
  { name: 'Mesa de Partes', value: 91, description: 'Crear, Editar, Ver, Derivar, Exportar' },
  { name: 'Responsable de Área', value: 91, description: 'Crear, Editar, Ver, Derivar, Exportar' }
];

const currentValue = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
});

const totalValue = computed(() => currentValue.value);
const binaryValue = computed(() => currentValue.value.toString(2).padStart(8, '0'));

const isBitSet = (index) => {
  return (currentValue.value & (1 << index)) !== 0;
};

const toggleBit = (index) => {
  const bitValue = 1 << index;
  currentValue.value = currentValue.value ^ bitValue;
};

const applyPredefinedRole = (role) => {
  currentValue.value = role.value;
};
</script>

<style scoped>
.bit-permission-editor {
  padding: 20px;
  background: var(--background-color);
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.bit-summary {
  display: flex;
  gap: 20px;
  font-family: monospace;
}

.permission-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 15px;
  margin-bottom: 20px;
}

.permission-item {
  display: flex;
  flex-direction: column;
  padding: 15px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.permission-item:hover {
  background: var(--hover-color);
}

.permission-item.active {
  border-color: var(--primary-color);
  background: var(--primary-light-color);
}

.bit-info {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
  font-size: 0.9em;
  color: var(--text-secondary-color);
}

.permission-info {
  flex-grow: 1;
}

.permission-info h4 {
  margin: 0 0 5px 0;
  color: var(--text-color);
}

.permission-info p {
  margin: 0;
  font-size: 0.9em;
  color: var(--text-secondary-color);
}

.bit-visual {
  margin-top: 10px;
  text-align: center;
}

.bit-box {
  display: inline-block;
  width: 30px;
  height: 30px;
  line-height: 30px;
  text-align: center;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  font-family: monospace;
  font-size: 1.2em;
}

.bit-box.active {
  background: var(--primary-color);
  color: white;
  border-color: var(--primary-color);
}

.predefined-roles {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid var(--border-color);
}

.predefined-roles h4 {
  margin-bottom: 10px;
}

.role-buttons {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}
</style> 