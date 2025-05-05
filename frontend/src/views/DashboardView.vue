<template>
  <div>
    <div class="dashboard-widgets">
      <WidgetCard v-for="widget in widgets" :key="widget.label" :value="widget.value" :label="widget.label" />
    </div>
    <div class="dashboard-panels">
      <PanelActividad />
      <PanelPendientes />
    </div>
  </div>
</template>

<script setup>
import WidgetCard from '../components/WidgetCard.vue'
import PanelActividad from '../components/PanelActividad.vue'
import PanelPendientes from '../components/PanelPendientes.vue'
import { useAuthStore } from '../stores/auth'
import { computed } from 'vue'

const authStore = useAuthStore()

const widgets = computed(() => {
  if (!authStore.user) return []
  const rol = authStore.user?.NombreRol?.toLowerCase() || ''
  if (rol.includes('admin')) {
    return [
      { label: 'USUARIOS ACTIVOS', value: 0 },
      { label: 'DOCUMENTOS PENDIENTES', value: 0 },
      { label: 'ÁREAS ACTIVAS', value: 0 },
    ]
  }
  if (rol.includes('mesa')) {
    return [
      { label: 'DOCUMENTOS PENDIENTES', value: 0 },
      { label: 'DOCUMENTOS DERIVADOS', value: 0 },
    ]
  }
  if (rol.includes('responsable')) {
    return [
      { label: 'DOCUMENTOS DE MI ÁREA', value: 0 },
      { label: 'DOCUMENTOS PENDIENTES', value: 0 },
    ]
  }
  return []
})
</script>

<style scoped>
.dashboard-widgets {
  display: flex;
  gap: 2rem;
  flex-wrap: wrap;
}
.dashboard-panels {
  display: flex;
  gap: 2rem;
  flex-wrap: wrap;
}
</style> 