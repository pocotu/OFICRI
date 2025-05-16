<template>
  <div class="timeline">
    <div v-for="(evento, idx) in eventos" :key="idx" class="timeline-event">
      <div class="timeline-dot"></div>
      <div class="timeline-content">
        <div class="evento-titulo">{{ evento.accion }}</div>
        <div class="evento-detalle">{{ evento.observacion }}</div>
        <div class="evento-meta">
          <span><i class="fa-solid fa-calendar"></i> {{ evento.fecha ? new Date(evento.fecha).toLocaleString() : '' }}</span>
          <span v-if="evento.areaOrigen"><i class="fa-solid fa-arrow-left"></i> Origen: {{ evento.areaOrigen }}</span>
          <span v-if="evento.areaDestino"><i class="fa-solid fa-arrow-right"></i> Destino: {{ evento.areaDestino }}</span>
          <span v-if="evento.usuario"><i class="fa-solid fa-user"></i> {{ evento.usuario }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  eventos: {
    type: Array,
    required: true,
    default: () => []
  }
})
</script>

<style scoped>
.timeline {
  position: relative;
  margin: 2rem 0;
  padding-left: 2rem;
  border-left: 3px solid #22c55e;
}

.timeline-event {
  position: relative;
  margin-bottom: 2.5rem;
}

.timeline-dot {
  position: absolute;
  left: -1.2rem;
  top: 0.2rem;
  width: 1.2rem;
  height: 1.2rem;
  border-radius: 50%;
  background: #22c55e;
  border: 3px solid #fff;
  box-shadow: 0 0 0 2px #22c55e;
}

.timeline-dot.creacion { background: #14532d; }
.timeline-dot.derivacion { background: #f7c948; }
.timeline-dot.estado { background: #2dc76d; }
.timeline-dot.log { background: #e67e22; }

.timeline-content {
  margin-left: 2rem;
  background: #f6f8fa;
  border-radius: 10px;
  padding: 1rem 1.5rem;
  box-shadow: 0 1px 6px rgba(20, 83, 45, 0.04);
}

.evento-titulo {
  font-weight: bold;
  color: #14532d;
  font-size: 1.1rem;
}

.evento-detalle {
  color: #263238;
  margin: 0.5rem 0;
}

.evento-meta {
  font-size: 0.95rem;
  color: #888;
  display: flex;
  gap: 1.5rem;
}
</style> 