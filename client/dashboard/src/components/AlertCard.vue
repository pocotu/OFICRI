<template>
  <div :class="['alert-card', `alert-${alert.severity}`, { 'loading': loading }]">
    <div class="alert-header">
      <div class="alert-icon">
        <i :class="alertIcon"></i>
      </div>
      <div class="alert-title">
        <h3>{{ alert.title }}</h3>
        <span class="alert-timestamp">{{ formattedTime }}</span>
      </div>
      <div class="alert-actions">
        <button 
          v-if="!alert.acknowledged" 
          class="action-btn" 
          @click="acknowledgeAlert"
          :disabled="acknowledging"
        >
          <i class="icon-check"></i>
          <span>{{ acknowledging ? 'Procesando...' : 'Confirmar' }}</span>
        </button>
        <button 
          v-if="canEscalate" 
          class="action-btn escalate" 
          @click="escalateAlert"
          :disabled="escalating"
        >
          <i class="icon-arrow-up"></i>
          <span>{{ escalating ? 'Escalando...' : 'Escalar' }}</span>
        </button>
      </div>
    </div>
    <div class="alert-content">
      <p>{{ alert.message }}</p>
      <div v-if="alert.details" class="alert-details">
        <div 
          v-for="(value, key) in alert.details" 
          :key="key" 
          class="detail-item"
        >
          <span class="detail-label">{{ formatLabel(key) }}:</span>
          <span class="detail-value">{{ formatValue(value) }}</span>
        </div>
      </div>
    </div>
    <div v-if="alert.actions && alert.actions.length" class="alert-footer">
      <button 
        v-for="action in alert.actions" 
        :key="action.id" 
        class="alert-action-btn"
        @click="handleAction(action)"
        :disabled="processingAction === action.id"
      >
        {{ processingAction === action.id ? 'Procesando...' : action.label }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { acknowledgeAlert, escalateAlert, executeAlertAction } from '../services/alertService';

const props = defineProps({
  alert: {
    type: Object,
    required: true,
    validator: (obj) => {
      return obj.id && obj.title && obj.message && obj.severity;
    }
  },
  loading: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['alert-acknowledged', 'alert-escalated', 'action-executed']);

// Estados locales
const acknowledging = ref(false);
const escalating = ref(false);
const processingAction = ref(null);

// Severidades de alerta: critical, high, medium, low, info
const alertIcon = computed(() => {
  const severityIcons = {
    critical: 'icon-alert-triangle',
    high: 'icon-alert-circle',
    medium: 'icon-alert-octagon',
    low: 'icon-info',
    info: 'icon-bell'
  };
  return severityIcons[props.alert.severity] || 'icon-bell';
});

// Determinar si la alerta puede ser escalada (solo críticas y altas sin confirmar)
const canEscalate = computed(() => {
  return ['critical', 'high'].includes(props.alert.severity) && !props.alert.acknowledged;
});

// Formatear timestamp
const formattedTime = computed(() => {
  if (!props.alert.timestamp) return '';
  
  const date = new Date(props.alert.timestamp);
  const now = new Date();
  const diffMinutes = Math.floor((now - date) / (1000 * 60));
  
  if (diffMinutes < 1) return 'Justo ahora';
  if (diffMinutes < 60) return `Hace ${diffMinutes} minutos`;
  if (diffMinutes < 1440) return `Hace ${Math.floor(diffMinutes / 60)} horas`;
  return date.toLocaleString('es-ES');
});

// Formatear etiquetas
const formatLabel = (key) => {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase())
    .replace(/_/g, ' ');
};

// Formatear valores
const formatValue = (value) => {
  if (typeof value === 'boolean') return value ? 'Sí' : 'No';
  if (value instanceof Date) return value.toLocaleString('es-ES');
  if (typeof value === 'number') {
    return value.toLocaleString('es-ES');
  }
  return value;
};

// Confirmar alerta
const acknowledgeAlert = async () => {
  if (acknowledging.value) return;
  
  acknowledging.value = true;
  try {
    await acknowledgeAlert(props.alert.id);
    emit('alert-acknowledged', props.alert.id);
  } catch (error) {
    console.error('Error al confirmar la alerta:', error);
  } finally {
    acknowledging.value = false;
  }
};

// Escalar alerta
const escalateAlert = async () => {
  if (escalating.value) return;
  
  escalating.value = true;
  try {
    await escalateAlert(props.alert.id);
    emit('alert-escalated', props.alert.id);
  } catch (error) {
    console.error('Error al escalar la alerta:', error);
  } finally {
    escalating.value = false;
  }
};

// Manejar acción personalizada
const handleAction = async (action) => {
  if (processingAction.value) return;
  
  processingAction.value = action.id;
  try {
    await executeAlertAction(props.alert.id, action.id);
    emit('action-executed', { alertId: props.alert.id, actionId: action.id });
  } catch (error) {
    console.error(`Error al ejecutar la acción ${action.label}:`, error);
  } finally {
    processingAction.value = null;
  }
};
</script>

<style scoped>
.alert-card {
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  margin-bottom: 16px;
  overflow: hidden;
  transition: all 0.3s ease;
  border-left: 4px solid #ccc;
}

.alert-card.loading {
  opacity: 0.7;
  pointer-events: none;
}

.alert-card.alert-critical {
  border-left-color: #ff3b30;
}

.alert-card.alert-high {
  border-left-color: #ff9500;
}

.alert-card.alert-medium {
  border-left-color: #ffcc00;
}

.alert-card.alert-low {
  border-left-color: #34c759;
}

.alert-card.alert-info {
  border-left-color: #007aff;
}

.alert-header {
  display: flex;
  align-items: center;
  padding: 16px;
  background-color: #f9f9f9;
  border-bottom: 1px solid #eee;
}

.alert-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  margin-right: 12px;
  background-color: rgba(0, 0, 0, 0.05);
}

.alert-critical .alert-icon {
  color: #ff3b30;
  background-color: rgba(255, 59, 48, 0.1);
}

.alert-high .alert-icon {
  color: #ff9500;
  background-color: rgba(255, 149, 0, 0.1);
}

.alert-medium .alert-icon {
  color: #ffcc00;
  background-color: rgba(255, 204, 0, 0.1);
}

.alert-low .alert-icon {
  color: #34c759;
  background-color: rgba(52, 199, 89, 0.1);
}

.alert-info .alert-icon {
  color: #007aff;
  background-color: rgba(0, 122, 255, 0.1);
}

.alert-title {
  flex: 1;
}

.alert-title h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.alert-timestamp {
  font-size: 12px;
  color: #8e8e93;
  display: block;
  margin-top: 4px;
}

.alert-actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  background-color: #f2f2f7;
  color: #007aff;
  transition: all 0.2s ease;
}

.action-btn:hover {
  background-color: #e5e5ea;
}

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.action-btn.escalate {
  color: #ff3b30;
}

.alert-content {
  padding: 16px;
}

.alert-content p {
  margin: 0 0 12px 0;
  font-size: 14px;
  line-height: 1.4;
}

.alert-details {
  background-color: #f9f9f9;
  border-radius: 4px;
  padding: 12px;
  font-size: 13px;
}

.detail-item {
  display: flex;
  margin-bottom: 8px;
}

.detail-item:last-child {
  margin-bottom: 0;
}

.detail-label {
  font-weight: 600;
  width: 40%;
  color: #6c6c70;
}

.detail-value {
  flex: 1;
}

.alert-footer {
  display: flex;
  gap: 8px;
  padding: 12px 16px;
  border-top: 1px solid #eee;
  background-color: #f9f9f9;
}

.alert-action-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  background-color: #007aff;
  color: white;
  transition: all 0.2s ease;
}

.alert-action-btn:hover {
  background-color: #0062cc;
}

.alert-action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style> 