<template>
  <div>
    <div class="log-table-filters">
      <slot name="filters"></slot>
    </div>
    <table class="log-table">
      <thead>
        <tr>
          <th v-for="col in columns" :key="col.key">{{ col.label }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in rows" :key="row.IDLog">
          <td v-for="col in columns" :key="col.key">{{ row[col.key] }}</td>
        </tr>
      </tbody>
    </table>
    <div class="pagination">
      <button :disabled="page === 1" @click="$emit('update:page', page - 1)">Anterior</button>
      <span>Página {{ page }}</span>
      <button :disabled="!hasMore" @click="$emit('update:page', page + 1)">Siguiente</button>
    </div>
  </div>
</template>

<script setup>
defineProps({
  columns: Array,
  rows: Array,
  page: Number,
  hasMore: Boolean
})
</script>

<style scoped>
.log-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 1rem;
}
.log-table th, .log-table td {
  border: 1px solid #e1e1e1;
  padding: 0.5rem 1rem;
  text-align: left;
}
.pagination {
  display: flex;
  gap: 1rem;
  align-items: center;
}
</style> 