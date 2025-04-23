<template>
  <Teleport to="body">
    <div class="toast-container">
      <TransitionGroup name="toast">
        <div 
          v-for="toast in toasts" 
          :key="toast.id"
          :class="['toast', `toast-${toast.type}`, { 'visible': toast.visible }]"
          @click="() => removeToast(toast.id)"
        >
          <div class="toast-icon">
            <i :class="getIconForType(toast.type)"></i>
          </div>
          <div class="toast-content">
            <div v-if="toast.title" class="toast-title">{{ toast.title }}</div>
            <div class="toast-message">{{ toast.message }}</div>
          </div>
          <button class="toast-close" @click.stop="() => removeToast(toast.id)">
            <i class="fas fa-times"></i>
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup>
import { useToast } from '@/shared/composables/useToast'

const { toasts, removeToast } = useToast()

const getIconForType = (type) => {
  switch (type) {
    case 'success':
      return 'fas fa-check-circle'
    case 'warning':
      return 'fas fa-exclamation-triangle'
    case 'error':
      return 'fas fa-times-circle'
    case 'info':
    default:
      return 'fas fa-info-circle'
  }
}
</script>

<style scoped>
.toast-container {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-width: 350px;
}

.toast {
  display: flex;
  padding: 12px 16px;
  background-color: white;
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  cursor: pointer;
  opacity: 0;
  transform: translateX(100%);
  transition: all 0.3s ease;
  align-items: flex-start;
  border-left: 4px solid #ddd;
  max-width: 100%;
}

.toast.visible {
  opacity: 1;
  transform: translateX(0);
}

.toast-icon {
  margin-right: 12px;
  font-size: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.toast-content {
  flex: 1;
  min-width: 0;
}

.toast-title {
  font-weight: 600;
  margin-bottom: 4px;
  color: #333;
}

.toast-message {
  color: #555;
  word-wrap: break-word;
  line-height: 1.4;
}

.toast-close {
  color: #999;
  background: none;
  border: none;
  padding: 2px;
  margin-left: 10px;
  cursor: pointer;
  font-size: 14px;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.toast-close:hover {
  background-color: rgba(0, 0, 0, 0.05);
  color: #666;
}

/* Estilos por tipo */
.toast-success {
  border-left-color: #34a853;
}

.toast-success .toast-icon {
  color: #34a853;
}

.toast-info {
  border-left-color: #4285f4;
}

.toast-info .toast-icon {
  color: #4285f4;
}

.toast-warning {
  border-left-color: #fbbc04;
}

.toast-warning .toast-icon {
  color: #fbbc04;
}

.toast-error {
  border-left-color: #ea4335;
}

.toast-error .toast-icon {
  color: #ea4335;
}

/* Animación */
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(100%);
  max-height: 0;
  padding-top: 0;
  padding-bottom: 0;
  margin-bottom: 0;
}

/* Responsive */
@media (max-width: 576px) {
  .toast-container {
    left: 10px;
    right: 10px;
    top: 10px;
    max-width: none;
  }
}
</style> 