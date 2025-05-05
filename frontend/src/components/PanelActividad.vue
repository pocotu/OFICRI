<template>
  <div class="panel">
    <div class="panel-title">Actividad Reciente</div>
    <div class="panel-content">
      <slot> Cargando actividad reciente... </slot>
    </div>
  </div>
</template>

<script setup>
// Este componente puede recibir datos por slot o props
</script>

<style scoped>
.panel {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(44, 62, 80, 0.07);
  padding: 1.5rem 1rem;
  min-width: 320px;
  min-height: 100px;
  margin: 0.5rem;
}
.panel-title {
  font-weight: bold;
  color: #0f492e;
  margin-bottom: 1rem;
  font-size: 1.1rem;
}
.panel-content {
  color: #263238;
  font-size: 1rem;
}
</style> 