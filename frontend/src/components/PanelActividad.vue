<template>
  <div class="activity-feed">
    <h2><i class="fa fa-history"></i> Actividad Reciente</h2>
    <div class="activity-scroll">
      <ul v-if="actividad && actividad.length">
        <li v-for="item in actividad" :key="item.IDLog">
          <span :class="['event-type', item.TipoEvento?.toLowerCase()]">{{ item.TipoEvento }}</span>
          <span class="event-desc">por {{ item.Usuario }}</span>
          <span class="event-meta">{{ new Date(item.FechaEvento).toLocaleString() }}</span>
        </li>
      </ul>
      <p v-else>No hay actividad reciente.</p>
    </div>
  </div>
</template>

<script setup>
import { defineProps } from 'vue';

defineProps({
  actividad: {
    type: Array,
    default: () => []
  }
});
</script>

<style scoped>
@import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css');
.activity-feed {
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 2px 12px rgba(44,62,80,0.08);
  padding: 1.2rem 1rem;
  flex: 2 1 350px;
  margin-right: 1rem;
  display: flex;
  flex-direction: column;
}
.activity-feed h2 {
  font-size: 1.2rem;
  color: #14532d;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.activity-scroll {
  max-height: 320px;
  overflow-y: auto;
  padding-right: 4px;
}
.activity-feed ul {
  list-style: none;
  padding: 0;
  margin: 0;
}
.activity-feed li {
  padding: 0.5rem 0;
  border-bottom: 1px solid #f1f1f1;
  display: flex;
  flex-direction: column;
}
.event-type {
  font-weight: 600;
  margin-right: 0.5rem;
  text-transform: uppercase;
}
.event-type.bloquear_usuario { color: #dc3545; }
.event-type.desbloquear_usuario { color: #28a745; }
.event-type.login { color: #14532d; }
.event-type.logout { color: #6c757d; }
.event-desc { margin-left: 0.2rem; }
.event-meta { font-size: 0.9em; color: #888; }
</style> 