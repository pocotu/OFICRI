<template>
  <span :class="['area-status-badge', activa ? 'activa' : 'inactiva']" :aria-label="activa ? 'Área activa' : 'Área inactiva'">
    <i :class="activa ? 'fa-solid fa-circle-check' : 'fa-solid fa-circle-xmark'"></i>
    {{ activa ? 'Activa' : 'Inactiva' }}
  </span>
</template>

<script setup>
defineProps({
  activa: {
    type: Boolean,
    required: true
  }
})
</script>

<style scoped>
.area-status-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.4em;
  font-size: 0.98em;
  font-weight: 600;
  border-radius: 12px;
  padding: 0.25em 0.9em;
  background: #e8f5e9;
  color: #16c784;
}
.area-status-badge.inactiva {
  background: #f8d7da;
  color: #d32f2f;
}
.area-status-badge i {
  font-size: 1em;
}
</style> 