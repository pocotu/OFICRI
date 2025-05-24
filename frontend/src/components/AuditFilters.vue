<template>
  <form class="audit-filters" @submit.prevent="$emit('buscar')">
    <div class="filter-group">
      <label for="usuarioId">Usuario</label>
      <input id="usuarioId" v-model="filtros.usuarioId" type="number" min="1" placeholder="ID Usuario" :disabled="loading" />
    </div>
    <div class="filter-group">
      <label for="tipoEvento">Tipo de Evento</label>
      <input id="tipoEvento" v-model="filtros.tipoEvento" placeholder="Tipo de Evento" :disabled="loading" />
    </div>
    <div class="filter-group">
      <label for="fechaInicio">Fecha Inicio</label>
      <input id="fechaInicio" v-model="filtros.fechaInicio" type="date" :disabled="loading" />
    </div>
    <div class="filter-group">
      <label for="fechaFin">Fecha Fin</label>
      <input id="fechaFin" v-model="filtros.fechaFin" type="date" :disabled="loading" />
    </div>
    <div class="filter-actions">
      <button type="submit" :disabled="loading">
        <i class="fa fa-search"></i> Buscar
      </button>
    </div>
  </form>
</template>

<script setup>
const props = defineProps({
  filtros: { type: Object, required: true },
  loading: { type: Boolean, default: false }
})
</script>

<style scoped>
.audit-filters {
  display: flex;
  gap: 1.2rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  align-items: flex-end;
  background: #f4f7fa;
  border-radius: 10px;
  padding: 1.1rem 1.2rem 0.7rem 1.2rem;
  box-shadow: 0 1px 3px rgba(44,62,80,0.04);
}
.filter-group {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  min-width: 160px;
}
.filter-group label {
  font-size: 1rem;
  font-weight: 500;
  color: #1a3c2b;
}
.filter-group input {
  padding: 0.45rem 0.8rem;
  border-radius: 6px;
  border: 1px solid #d1d5db;
  background: #fff;
  font-size: 1rem;
  transition: border 0.15s;
}
.filter-group input:focus {
  border: 1.5px solid #2dc76d;
  outline: none;
}
.filter-actions {
  display: flex;
  align-items: center;
  height: 100%;
}
.filter-actions button {
  background: #2dc76d;
  color: #fff;
  border: none;
  border-radius: 6px;
  padding: 0.55rem 1.3rem;
  font-size: 1.05rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: background 0.15s;
}
.filter-actions button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.filter-actions button:hover:not(:disabled) {
  background: #1fa75a;
}
</style> 