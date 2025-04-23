<template>
  <button
    :class="[
      'ofi-button',
      `ofi-button--${variant}`,
      `ofi-button--${size}`,
      { 'ofi-button--block': block },
      { 'ofi-button--loading': loading },
      { 'ofi-button--disabled': disabled || loading }
    ]"
    :disabled="disabled || loading"
    :type="type"
    @click="handleClick"
    v-bind="$attrs"
  >
    <span class="ofi-button__loader" v-if="loading">
      <span class="ofi-button__loader-dot"></span>
      <span class="ofi-button__loader-dot"></span>
      <span class="ofi-button__loader-dot"></span>
    </span>
    <span class="ofi-button__icon" v-if="iconLeft">
      <slot name="icon-left"></slot>
    </span>
    <span class="ofi-button__content" :class="{ 'ofi-button__content--hidden': loading }">
      <slot></slot>
    </span>
    <span class="ofi-button__icon" v-if="iconRight">
      <slot name="icon-right"></slot>
    </span>
  </button>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue';

const props = defineProps({
  variant: {
    type: String,
    default: 'primary',
    validator: (value) => ['primary', 'secondary', 'success', 'warning', 'danger', 'info', 'light', 'dark', 'link'].includes(value)
  },
  size: {
    type: String,
    default: 'md',
    validator: (value) => ['sm', 'md', 'lg'].includes(value)
  },
  type: {
    type: String,
    default: 'button',
    validator: (value) => ['button', 'submit', 'reset'].includes(value)
  },
  block: {
    type: Boolean,
    default: false
  },
  disabled: {
    type: Boolean,
    default: false
  },
  loading: {
    type: Boolean,
    default: false
  },
  iconLeft: {
    type: Boolean,
    default: false
  },
  iconRight: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['click']);

const handleClick = (event) => {
  if (!props.disabled && !props.loading) {
    emit('click', event);
  }
};
</script>

<style scoped>
.ofi-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  outline: none;
  white-space: nowrap;
  gap: 0.5rem;
}

/* Tamaños */
.ofi-button--sm {
  font-size: 0.875rem;
  padding: 0.375rem 0.75rem;
  height: 32px;
}

.ofi-button--md {
  font-size: 1rem;
  padding: 0.5rem 1rem;
  height: 40px;
}

.ofi-button--lg {
  font-size: 1.125rem;
  padding: 0.625rem 1.25rem;
  height: 48px;
}

/* Variantes */
.ofi-button--primary {
  background-color: #4CAF50;
  color: white;
}
.ofi-button--primary:hover {
  background-color: #45a049;
}

.ofi-button--secondary {
  background-color: #6c757d;
  color: white;
}
.ofi-button--secondary:hover {
  background-color: #5a6268;
}

.ofi-button--success {
  background-color: #28a745;
  color: white;
}
.ofi-button--success:hover {
  background-color: #218838;
}

.ofi-button--warning {
  background-color: #ffc107;
  color: #212529;
}
.ofi-button--warning:hover {
  background-color: #e0a800;
}

.ofi-button--danger {
  background-color: #dc3545;
  color: white;
}
.ofi-button--danger:hover {
  background-color: #c82333;
}

.ofi-button--info {
  background-color: #17a2b8;
  color: white;
}
.ofi-button--info:hover {
  background-color: #138496;
}

.ofi-button--light {
  background-color: #f8f9fa;
  color: #212529;
}
.ofi-button--light:hover {
  background-color: #e2e6ea;
}

.ofi-button--dark {
  background-color: #343a40;
  color: white;
}
.ofi-button--dark:hover {
  background-color: #23272b;
}

.ofi-button--link {
  background-color: transparent;
  color: #4CAF50;
  text-decoration: underline;
  padding: 0;
  height: auto;
}
.ofi-button--link:hover {
  color: #45a049;
}

/* Estados */
.ofi-button--block {
  display: flex;
  width: 100%;
}

.ofi-button--disabled {
  opacity: 0.65;
  cursor: not-allowed;
  pointer-events: none;
}

/* Loader */
.ofi-button__loader {
  display: flex;
  align-items: center;
  justify-content: center;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}

.ofi-button__loader-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: currentColor;
  margin: 0 2px;
  animation: loader 1.2s infinite ease-in-out both;
}

.ofi-button__loader-dot:nth-child(1) {
  animation-delay: -0.32s;
}

.ofi-button__loader-dot:nth-child(2) {
  animation-delay: -0.16s;
}

@keyframes loader {
  0%, 80%, 100% {
    transform: scale(0);
  }
  40% {
    transform: scale(1);
  }
}

.ofi-button__content--hidden {
  visibility: hidden;
}
</style> 