<template>
  <div class="panel">
    <div class="panel-title">Documentos Pendientes</div>
    <div class="panel-content">
      <ul v-if="documentos && documentos.length">
        <li v-for="doc in documentos" :key="doc.IDDocumento">
          <strong>{{ doc.NroRegistro }}</strong> ({{ doc.NombreArea }}) - {{ doc.Contenido.substring(0, 50) }}...
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
.panel {
  background: #fff;
  border-radius: 14px;
  box-shadow: 0 2px 12px rgba(44, 62, 80, 0.07);
  padding: 1.5rem 1.2rem;
  min-width: 320px;
  min-height: 100px;
  margin: 0.5rem;
  transition: box-shadow 0.2s, transform 0.2s;
}
.panel:hover {
  box-shadow: 0 6px 24px rgba(44, 62, 80, 0.13);
  transform: translateY(-2px) scale(1.02);
}
.panel-title {
  font-weight: bold;
  color: #14532d;
  margin-bottom: 1rem;
  font-size: 1.1rem;
  letter-spacing: 1px;
  text-transform: uppercase;
}
.panel-content {
  color: #263238;
  font-size: 1rem;
}
.panel-content ul {
  list-style: none;
  padding: 0;
}
.panel-content li {
  margin-bottom: 0.5rem;
  border-bottom: 1px solid #eee;
  padding-bottom: 0.5rem;
}
</style> 