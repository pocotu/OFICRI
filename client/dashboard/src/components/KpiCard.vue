<template>
  <div class="kpi-card" :class="{ 'kpi-card--loading': loading }">
    <div class="kpi-card__header">
      <div class="kpi-card__icon">
        <i :class="icon"></i>
      </div>
      <h3 class="kpi-card__title">{{ title }}</h3>
    </div>
    
    <div class="kpi-card__content">
      <div class="kpi-card__value">{{ formattedValue }}</div>
      <div class="kpi-card__trend" :class="trendClass">
        <i :class="trendIcon"></i>
        <span>{{ trendValue }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  title: {
    type: String,
    required: true
  },
  value: {
    type: [Number, String],
    required: true
  },
  trend: {
    type: Object,
    default: () => ({
      value: 0,
      direction: 'up'
    })
  },
  icon: {
    type: String,
    required: true
  },
  loading: {
    type: Boolean,
    default: false
  }
});

const formattedValue = computed(() => {
  if (typeof props.value === 'number') {
    return new Intl.NumberFormat('es-PE').format(props.value);
  }
  return props.value;
});

const trendClass = computed(() => ({
  'kpi-card__trend--up': props.trend.direction === 'up',
  'kpi-card__trend--down': props.trend.direction === 'down',
  'kpi-card__trend--neutral': props.trend.direction === 'neutral'
}));

const trendIcon = computed(() => {
  switch (props.trend.direction) {
    case 'up':
      return 'fas fa-arrow-up';
    case 'down':
      return 'fas fa-arrow-down';
    default:
      return 'fas fa-minus';
  }
});

const trendValue = computed(() => {
  if (props.trend.value === 0) return '0%';
  return `${props.trend.direction === 'up' ? '+' : ''}${props.trend.value}%`;
});
</script>

<style scoped>
.kpi-card {
  background: var(--ofi-surface);
  border-radius: 8px;
  padding: 20px;
  box-shadow: var(--ofi-shadow-sm);
  transition: all 0.3s ease;
}

.kpi-card--loading {
  opacity: 0.7;
  pointer-events: none;
}

.kpi-card__header {
  display: flex;
  align-items: center;
  margin-bottom: 15px;
}

.kpi-card__icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--ofi-primary-light);
  color: var(--ofi-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
}

.kpi-card__icon i {
  font-size: 1.2rem;
}

.kpi-card__title {
  margin: 0;
  font-size: 1rem;
  color: var(--ofi-text-secondary);
}

.kpi-card__content {
  display: flex;
  flex-direction: column;
}

.kpi-card__value {
  font-size: 1.8rem;
  font-weight: 600;
  color: var(--ofi-text-primary);
  margin-bottom: 8px;
}

.kpi-card__trend {
  display: flex;
  align-items: center;
  font-size: 0.9rem;
  gap: 4px;
}

.kpi-card__trend--up {
  color: var(--ofi-success);
}

.kpi-card__trend--down {
  color: var(--ofi-error);
}

.kpi-card__trend--neutral {
  color: var(--ofi-warning);
}

.kpi-card__trend i {
  font-size: 0.8rem;
}
</style> 