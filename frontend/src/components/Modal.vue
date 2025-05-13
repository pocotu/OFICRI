<template>
  <div class="modal-backdrop" @click.self="$emit('close')">
    <div class="modal-content">
      <button class="modal-close" @click="$emit('close')" title="Cerrar">
        <i class="fa-solid fa-xmark"></i>
      </button>
      <slot />
    </div>
  </div>
</template>

<script setup>
// No props, solo slot y evento close
</script>

<style scoped>
.modal-backdrop {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.25);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}
.modal-content {
  background: #fff;
  border-radius: 14px;
  box-shadow: 0 4px 24px rgba(44, 62, 80, 0.13);
  padding: 2.2rem 2.2rem 1.5rem 2.2rem;
  min-width: 340px;
  max-width: 98vw;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
}
.modal-close {
  position: absolute;
  top: 1.1rem;
  right: 1.1rem;
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #888;
  cursor: pointer;
  transition: color 0.2s;
}
.modal-close:hover {
  color: #e74c3c;
}
</style> 