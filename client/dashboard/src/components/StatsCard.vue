<template>
  <div class="stats-card" :class="{ 'stats-card--loading': loading }">
    <div class="stats-card__header">
      <h3 class="stats-card__title">{{ title }}</h3>
      <div class="stats-card__actions">
        <slot name="actions"></slot>
      </div>
    </div>

    <div class="stats-card__content">
      <div class="stats-card__chart">
        <slot name="chart"></slot>
      </div>
      
      <div class="stats-card__data">
        <div v-for="(item, index) in data" :key="index" class="stats-card__data-item">
          <div class="stats-card__data-label">{{ item.label }}</div>
          <div class="stats-card__data-value">{{ formatValue(item.value) }}</div>
          <div v-if="item.trend" class="stats-card__data-trend" :class="getTrendClass(item.trend)">
            <i :class="getTrendIcon(item.trend)"></i>
            <span>{{ formatTrend(item.trend) }}</span>
          </div>
        </div>
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
  data: {
    type: Array,
    required: true,
    validator: (value) => {
      return value.every(item => 
        typeof item === 'object' && 
        'label' in item && 
        'value' in item
      );
    }
  },
  loading: {
    type: Boolean,
    default: false
  }
});

const formatValue = (value) => {
  if (typeof value === 'number') {
    return new Intl.NumberFormat('es-PE').format(value);
  }
  return value;
};

const getTrendClass = (trend) => {
  if (!trend) return '';
  return {
    'stats-card__data-trend--up': trend.direction === 'up',
    'stats-card__data-trend--down': trend.direction === 'down',
    'stats-card__data-trend--neutral': trend.direction === 'neutral'
  };
};

const getTrendIcon = (trend) => {
  if (!trend) return '';
  switch (trend.direction) {
    case 'up':
      return 'fas fa-arrow-up';
    case 'down':
      return 'fas fa-arrow-down';
    default:
      return 'fas fa-minus';
  }
};

const formatTrend = (trend) => {
  if (!trend) return '';
  if (trend.value === 0) return '0%';
  return `${trend.direction === 'up' ? '+' : ''}${trend.value}%`;
};
</script>

<style scoped>
.stats-card {
  background: var(--ofi-surface);
  border-radius: 8px;
  padding: 20px;
  box-shadow: var(--ofi-shadow-sm);
  transition: all 0.3s ease;
}

.stats-card--loading {
  opacity: 0.7;
  pointer-events: none;
}

.stats-card__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.stats-card__title {
  margin: 0;
  font-size: 1.1rem;
  color: var(--ofi-text-primary);
}

.stats-card__actions {
  display: flex;
  gap: 8px;
}

.stats-card__content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.stats-card__chart {
  min-height: 200px;
}

.stats-card__data {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.stats-card__data-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stats-card__data-label {
  font-size: 0.9rem;
  color: var(--ofi-text-secondary);
}

.stats-card__data-value {
  font-size: 1.4rem;
  font-weight: 600;
  color: var(--ofi-text-primary);
}

.stats-card__data-trend {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.8rem;
}

.stats-card__data-trend--up {
  color: var(--ofi-success);
}

.stats-card__data-trend--down {
  color: var(--ofi-error);
}

.stats-card__data-trend--neutral {
  color: var(--ofi-warning);
}

.stats-card__data-trend i {
  font-size: 0.7rem;
}

@media (max-width: 768px) {
  .stats-card__content {
    grid-template-columns: 1fr;
  }
}
</style> 