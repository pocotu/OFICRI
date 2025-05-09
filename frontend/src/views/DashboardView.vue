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
import { computed, ref, onMounted } from 'vue'
import axios from 'axios'

const authStore = useAuthStore()
const metrics = ref({
  totalDocs: 0,
  pendientes: 0,
  derivados: 0,
  usuariosActivos: 0,
  areasActivas: 0
})
const loading = ref(true)
const token = computed(() => authStore.token)

onMounted(async () => {
  try {
    const res = await axios.get('/api/dashboard/metrics', {
      headers: { Authorization: `Bearer ${token.value}` }
    })
    metrics.value = res.data
  } finally {
    loading.value = false
  }
})

const widgets = computed(() => {
  if (!authStore.user) return []
  const rol = authStore.user?.NombreRol?.toLowerCase() || ''
  if (rol.includes('admin')) {
    return [
      { label: 'USUARIOS ACTIVOS', value: metrics.value.usuariosActivos },
      { label: 'DOCUMENTOS PENDIENTES', value: metrics.value.pendientes },
      { label: 'DOCUMENTOS REGISTRADOS', value: metrics.value.totalDocs },
      { label: 'ÁREAS ACTIVAS', value: metrics.value.areasActivas },
    ]
  }
  if (rol.includes('mesa')) {
    return [
      { label: 'DOCUMENTOS PENDIENTES', value: metrics.value.pendientes },
      { label: 'DOCUMENTOS DERIVADOS', value: metrics.value.derivados },
    ]
  }
  if (rol.includes('responsable')) {
    return [
      { label: 'DOCUMENTOS DE MI ÁREA', value: 0 },
      { label: 'DOCUMENTOS PENDIENTES', value: metrics.value.pendientes },
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