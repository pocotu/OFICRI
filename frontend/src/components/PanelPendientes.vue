<template>
  <div class="pending-docs">
    <h2><i class="fa fa-clock"></i> Documentos Pendientes</h2>
    <div class="pending-scroll">
      <ul v-if="documentos && documentos.length">
        <li v-for="doc in documentos" :key="doc.IDDocumento">
          <span class="doc-id">{{ doc.NroRegistro }}</span>
          <span class="doc-title">{{ doc.Contenido.substring(0, 50) }}...</span>
          <span class="doc-area">({{ doc.NombreArea }})</span>
        </li>
      </ul>
      <p v-else>No hay documentos pendientes.</p>
    </div>
  </div>
</template>

<script setup>
import { defineProps } from 'vue';

defineProps({
  documentos: {
    type: Array,
    default: () => []
  }
});
</script>

<style scoped>
@import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css');
.pending-docs {
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 2px 12px rgba(44,62,80,0.08);
  padding: 1.2rem 1rem;
  flex: 1 1 250px;
  display: flex;
  flex-direction: column;
}
.pending-docs h2 {
  font-size: 1.2rem;
  color: #14532d;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.pending-scroll {
  max-height: 320px;
  overflow-y: auto;
  padding-right: 4px;
}
.pending-docs ul {
  list-style: none;
  padding: 0;
  margin: 0;
}
.pending-docs li {
  padding: 0.5rem 0;
  border-bottom: 1px solid #f1f1f1;
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
}
.doc-id {
  font-weight: 700;
  color: #14532d;
}
.doc-title {
  flex: 1;
  color: #333;
}
.doc-area {
  color: #888;
  font-size: 0.95em;
}
</style> 