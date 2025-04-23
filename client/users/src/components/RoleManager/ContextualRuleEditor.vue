<template>
  <div class="contextual-rule-editor">
    <div class="header">
      <h3>Editor de Reglas Contextuales</h3>
      <OfiButton @click="addNewRule" variant="primary">
        <i class="fas fa-plus"></i> Nueva Regla
      </OfiButton>
    </div>

    <div class="rules-list">
      <div v-for="(rule, index) in rules" :key="index" class="rule-item">
        <div class="rule-header">
          <h4>Regla #{{ index + 1 }}</h4>
          <div class="rule-actions">
            <OfiButton @click="editRule(index)" variant="outline" size="sm">
              <i class="fas fa-edit"></i>
            </OfiButton>
            <OfiButton @click="deleteRule(index)" variant="danger" size="sm">
              <i class="fas fa-trash"></i>
            </OfiButton>
          </div>
        </div>

        <div class="rule-content">
          <div class="rule-type">
            <strong>Tipo:</strong> {{ rule.tipo }}
          </div>
          <div class="rule-details">
            <template v-if="rule.tipo === 'TIME'">
              <div><strong>Operador:</strong> {{ rule.regla.operator }}</div>
              <div><strong>Valor:</strong> {{ formatTimeValue(rule.regla.value) }}</div>
            </template>
            <template v-else-if="rule.tipo === 'STATE'">
              <div><strong>Operador:</strong> {{ rule.regla.operator }}</div>
              <div><strong>Valor:</strong> {{ formatStateValue(rule.regla.value) }}</div>
            </template>
            <template v-else-if="rule.tipo === 'AREA'">
              <div><strong>Área ID:</strong> {{ rule.regla.areaId }}</div>
            </template>
            <template v-else-if="rule.tipo === 'PROPERTY'">
              <div><strong>Propiedad ID:</strong> {{ rule.regla.propertyId }}</div>
            </template>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal para edición de reglas -->
    <OfiModal v-model="showModal" :title="modalTitle">
      <form @submit.prevent="saveRule">
        <div class="form-group">
          <label>Tipo de Regla</label>
          <OfiSelect v-model="currentRule.tipo" :options="ruleTypes" />
        </div>

        <template v-if="currentRule.tipo === 'TIME'">
          <div class="form-group">
            <label>Operador</label>
            <OfiSelect v-model="currentRule.regla.operator" :options="timeOperators" />
          </div>
          <div class="form-group">
            <label>Valor</label>
            <template v-if="currentRule.regla.operator === 'BETWEEN'">
              <div class="date-range">
                <OfiDatePicker v-model="currentRule.regla.value[0]" label="Desde" />
                <OfiDatePicker v-model="currentRule.regla.value[1]" label="Hasta" />
              </div>
            </template>
            <template v-else-if="['BEFORE', 'AFTER'].includes(currentRule.regla.operator)">
              <OfiDatePicker v-model="currentRule.regla.value" />
            </template>
          </div>
        </template>

        <template v-else-if="currentRule.tipo === 'STATE'">
          <div class="form-group">
            <label>Operador</label>
            <OfiSelect v-model="currentRule.regla.operator" :options="stateOperators" />
          </div>
          <div class="form-group">
            <label>Valor</label>
            <template v-if="['IN', 'NOT_IN'].includes(currentRule.regla.operator)">
              <OfiMultiSelect v-model="currentRule.regla.value" :options="stateOptions" />
            </template>
            <template v-else>
              <OfiSelect v-model="currentRule.regla.value" :options="stateOptions" />
            </template>
          </div>
        </template>

        <template v-else-if="currentRule.tipo === 'AREA'">
          <div class="form-group">
            <label>Área</label>
            <OfiSelect v-model="currentRule.regla.areaId" :options="areas" />
          </div>
        </template>

        <template v-else-if="currentRule.tipo === 'PROPERTY'">
          <div class="form-group">
            <label>Propiedad</label>
            <OfiSelect v-model="currentRule.regla.propertyId" :options="properties" />
          </div>
        </template>

        <div class="modal-footer">
          <OfiButton type="submit" variant="primary">Guardar</OfiButton>
          <OfiButton @click="showModal = false" variant="outline">Cancelar</OfiButton>
        </div>
      </form>
    </OfiModal>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import OfiButton from '@shared/components/OfiButton.vue';
import OfiModal from '@shared/components/OfiModal.vue';
import OfiSelect from '@shared/components/OfiSelect.vue';
import OfiDatePicker from '@shared/components/OfiDatePicker.vue';
import OfiMultiSelect from '@shared/components/OfiMultiSelect.vue';
import { RULE_TYPES, TIME_OPERATORS, STATE_OPERATORS } from '@shared/services/permissions/contextualRules';
import { createContextualRule, getContextualRules, updateContextualRule, deleteContextualRule } from '@shared/services/permissions/contextualRules';

const props = defineProps({
  roleId: {
    type: Number,
    required: true
  },
  areaId: {
    type: Number,
    required: true
  }
});

const rules = ref([]);
const showModal = ref(false);
const currentRule = ref({
  tipo: '',
  regla: {
    operator: '',
    value: null
  }
});
const editingIndex = ref(-1);

const modalTitle = computed(() => 
  editingIndex.value === -1 ? 'Nueva Regla' : 'Editar Regla'
);

const ruleTypes = Object.entries(RULE_TYPES).map(([key, value]) => ({
  label: key,
  value
}));

const timeOperators = Object.entries(TIME_OPERATORS).map(([key, value]) => ({
  label: key,
  value
}));

const stateOperators = Object.entries(STATE_OPERATORS).map(([key, value]) => ({
  label: key,
  value
}));

const stateOptions = [
  { label: 'Activo', value: 'ACTIVE' },
  { label: 'Inactivo', value: 'INACTIVE' },
  { label: 'Pendiente', value: 'PENDING' },
  { label: 'Completado', value: 'COMPLETED' }
];

const areas = ref([]);
const properties = ref([]);

const loadRules = async () => {
  try {
    rules.value = await getContextualRules(props.roleId, props.areaId);
  } catch (error) {
    console.error('Error loading rules:', error);
  }
};

const addNewRule = () => {
  editingIndex.value = -1;
  currentRule.value = {
    tipo: '',
    regla: {
      operator: '',
      value: null
    }
  };
  showModal.value = true;
};

const editRule = (index) => {
  editingIndex.value = index;
  currentRule.value = { ...rules.value[index] };
  showModal.value = true;
};

const deleteRule = async (index) => {
  if (confirm('¿Está seguro de eliminar esta regla?')) {
    try {
      const rule = rules.value[index];
      await deleteContextualRule(rule.id);
      rules.value.splice(index, 1);
    } catch (error) {
      console.error('Error deleting rule:', error);
    }
  }
};

const saveRule = async () => {
  try {
    const ruleData = {
      ...currentRule.value,
      rolId: props.roleId,
      areaId: props.areaId
    };

    if (editingIndex.value === -1) {
      const newRule = await createContextualRule(ruleData);
      rules.value.push(newRule);
    } else {
      const updatedRule = await updateContextualRule(rules.value[editingIndex.value].id, ruleData);
      rules.value[editingIndex.value] = updatedRule;
    }

    showModal.value = false;
  } catch (error) {
    console.error('Error saving rule:', error);
  }
};

const formatTimeValue = (value) => {
  if (Array.isArray(value)) {
    return `${new Date(value[0]).toLocaleString()} - ${new Date(value[1]).toLocaleString()}`;
  }
  return new Date(value).toLocaleString();
};

const formatStateValue = (value) => {
  if (Array.isArray(value)) {
    return value.join(', ');
  }
  return value;
};

// Cargar reglas al montar el componente
loadRules();
</script>

<style scoped>
.contextual-rule-editor {
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

.rules-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.rule-item {
  border: 1px solid var(--border-color);
  border-radius: 4px;
  padding: 15px;
}

.rule-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.rule-actions {
  display: flex;
  gap: 10px;
}

.rule-content {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.form-group {
  margin-bottom: 15px;
}

.date-range {
  display: flex;
  gap: 10px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}
</style> 