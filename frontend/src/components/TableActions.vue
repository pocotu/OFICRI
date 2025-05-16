<template>
  <div class="table-actions">
    <button class="btn-action edit" @click="$emit('edit')" title="Editar área" aria-label="Editar área">
      <i class="fa-solid fa-pen-to-square"></i>
    </button>
    <button class="btn-action delete" @click="$emit('delete')" title="Eliminar área" aria-label="Eliminar área">
      <i class="fa-solid fa-trash"></i>
    </button>
  </div>
</template>

<script setup>
// No props, solo emite eventos edit/delete
</script>

<style scoped>
.table-actions {
  display: flex;
  gap: 0.7em;
  align-items: center;
}
.btn-action {
  background: none;
  border: none;
  border-radius: 6px;
  padding: 0.4em 0.6em;
  cursor: pointer;
  color: #495057;
  font-size: 1.15em;
  transition: background 0.18s, color 0.18s;
}
.btn-action.edit:hover {
  background: #e3f2fd;
  color: #1976d2;
}
.btn-action.delete:hover {
  background: #ffebee;
  color: #d32f2f;
}
.btn-action:focus {
  outline: 2px solid #16c784;
}
</style> 