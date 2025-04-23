<template>
  <div class="ofi-card" :class="{ 'ofi-card--no-padding': noPadding, [`ofi-card--${variant}`]: true }">
    <div class="ofi-card__header" v-if="hasHeader || title">
      <slot name="header">
        <h3 class="ofi-card__title" v-if="title">{{ title }}</h3>
      </slot>
    </div>
    <div class="ofi-card__body" :class="{ 'ofi-card__body--no-padding': noPadding }">
      <slot></slot>
    </div>
    <div class="ofi-card__footer" v-if="hasFooter">
      <slot name="footer"></slot>
    </div>
  </div>
</template>

<script setup>
import { defineProps, useSlots, computed } from 'vue';

const props = defineProps({
  title: {
    type: String,
    default: ''
  },
  noPadding: {
    type: Boolean,
    default: false
  },
  variant: {
    type: String,
    default: 'default',
    validator: (value) => ['default', 'primary', 'success', 'warning', 'danger', 'info'].includes(value)
  }
});

const slots = useSlots();

const hasHeader = computed(() => !!slots.header);
const hasFooter = computed(() => !!slots.footer);
</script>

<style scoped>
.ofi-card {
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  transition: box-shadow 0.3s ease;
  margin-bottom: 1rem;
}

.ofi-card:hover {
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.15);
}

.ofi-card--primary {
  border-top: 4px solid #4CAF50;
}

.ofi-card--success {
  border-top: 4px solid #28a745;
}

.ofi-card--warning {
  border-top: 4px solid #ffc107;
}

.ofi-card--danger {
  border-top: 4px solid #dc3545;
}

.ofi-card--info {
  border-top: 4px solid #17a2b8;
}

.ofi-card__header {
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.ofi-card__title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.ofi-card__body {
  padding: 1.5rem;
}

.ofi-card__body--no-padding {
  padding: 0;
}

.ofi-card__footer {
  padding: 1rem 1.5rem;
  border-top: 1px solid #f0f0f0;
  background-color: #f9f9f9;
}
</style> 