<template>
  <div class="modal-backdrop" @click.self="$emit('close')" tabindex="-1" aria-modal="true" role="dialog">
    <div class="modal-content">
      <button class="modal-close" @click="$emit('close')" title="Cerrar" aria-label="Cerrar">
        <i class="fa-solid fa-xmark"></i>
      </button>
      <header v-if="$slots.header" class="modal-header">
        <slot name="header" />
      </header>
      <section v-if="$slots.body" class="modal-body">
        <slot name="body" />
      </section>
      <section v-else class="modal-body">
        <slot />
      </section>
      <footer v-if="$slots.footer" class="modal-footer">
        <slot name="footer" />
      </footer>
    </div>
  </div>
</template>

<script setup>
// No props, solo slots y evento close
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
  border-radius: 22px;
  box-shadow: 0 8px 32px rgba(44, 62, 80, 0.18);
  padding: 2.2rem 2.2rem 1.5rem 2.2rem;
  min-width: 340px;
  max-width: 98vw;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
  display: flex;
  flex-direction: column;
}
.modal-header {
  font-size: 1.3rem;
  font-weight: 600;
  margin-bottom: 1.1rem;
  display: flex;
  align-items: center;
  gap: 0.6rem;
}
.modal-body {
  flex: 1 1 auto;
  margin-bottom: 1.2rem;
}
.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.7rem;
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