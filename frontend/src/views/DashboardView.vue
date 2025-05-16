<template>
  <div class="dashboard-container">
    <div class="dashboard-header">
      <h1>
        <i class="fa fa-shield-alt"></i>
        Sistema de Gestión OFICRI
        <span v-if="dashboardSubtitle">- {{ dashboardSubtitle }}</span>
      </h1>
    </div>
    <div class="dashboard-metrics">
      <WidgetCard v-for="widget in widgets" :key="widget.label" :value="widget.value" :label="widget.label" :icon="widget.icon" :color="widget.color" />
    </div>
    <div class="dashboard-content">
      <PanelActividad v-if="esAdmin" :actividad="actividadReciente" />
      <PanelPendientes :documentos="documentosPendientes" />
    </div>
  </div>
</template>

<script setup>
import WidgetCard from '../components/WidgetCard.vue'
import PanelActividad from '../components/PanelActividad.vue'
import PanelPendientes from '../components/PanelPendientes.vue'
import { useAuthStore } from '../stores/auth'
import { computed, ref, onMounted } from 'vue'
import { fetchDashboardMetrics, fetchActividadReciente, fetchDocumentosPendientes } from '../api/dashboardApi';

const authStore = useAuthStore()
const metrics = ref({
  totalDocs: 0,
  pendientes: 0,
  derivados: 0,
  usuariosActivos: 0,
  areasActivas: 0
})
const actividadReciente = ref([]);
const documentosPendientes = ref([]);
const loading = ref(true)
const token = computed(() => authStore.token)

const userName = computed(() => authStore.user?.Nombres + ' ' + authStore.user?.Apellidos || '')

const dashboardSubtitle = computed(() => {
  const rol = authStore.user?.NombreRol?.toLowerCase() || '';
  if (rol.includes('admin')) return 'ADMINISTRACIÓN';
  if (rol.includes('mesa')) return 'MESA DE PARTES';
  if (rol.includes('responsable')) return 'RESPONSABLE DE ÁREA';
  return '';
});

onMounted(async () => {
  try {
    const [metricsRes, actividadRes, pendientesRes] = await Promise.all([
      fetchDashboardMetrics(token.value),
      fetchActividadReciente(token.value),
      fetchDocumentosPendientes(token.value)
    ]);
    metrics.value = metricsRes.data;
    actividadReciente.value = actividadRes.data;
    documentosPendientes.value = pendientesRes.data;
  } catch (error) {
    console.error("Error al cargar datos del dashboard:", error);
  } finally {
    loading.value = false
  }
})

const widgets = computed(() => {
  if (!authStore.user) return []
  const rol = authStore.user?.NombreRol?.toLowerCase() || ''
  if (rol.includes('admin')) {
    return [
      { label: 'USUARIOS ACTIVOS', value: metrics.value.usuariosActivos, icon: 'fa-users', color: 'primary' },
      { label: 'DOCUMENTOS PENDIENTES', value: metrics.value.pendientes, icon: 'fa-file-alt', color: 'warning' },
      { label: 'DOCUMENTOS REGISTRADOS', value: metrics.value.totalDocs, icon: 'fa-archive', color: 'success' },
      { label: 'ÁREAS ACTIVAS', value: metrics.value.areasActivas, icon: 'fa-sitemap', color: 'info' },
    ]
  }
  if (rol.includes('mesa')) {
    return [
      { label: 'DOCUMENTOS PENDIENTES', value: metrics.value.pendientes, icon: 'fa-file-alt', color: 'warning' },
      { label: 'DOCUMENTOS DERIVADOS', value: metrics.value.derivados, icon: 'fa-share-square', color: 'info' },
    ]
  }
  if (rol.includes('responsable')) {
    return [
      { label: 'DOCUMENTOS DE MI ÁREA', value: 0, icon: 'fa-folder-open', color: 'primary' },
      { label: 'DOCUMENTOS PENDIENTES', value: metrics.value.pendientes, icon: 'fa-file-alt', color: 'warning' },
    ]
  }
  return []
})

const esAdmin = computed(() => {
  const user = authStore.user
  return user && user.Permisos && (user.Permisos & 128) === 128
})
</script>

<style scoped>
@import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css');
.dashboard-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem 1rem;
  font-family: 'Roboto', Arial, sans-serif;
}
.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}
.dashboard-header h1 {
  font-size: 2rem;
  color: #14532d;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 0.7rem;
}
.dashboard-header span {
  font-size: 1.1rem;
  color: #4b5563;
  font-weight: 400;
}
.dashboard-metrics {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
}
.dashboard-content {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}
@media (max-width: 900px) {
  .dashboard-metrics, .dashboard-content {
    flex-direction: column;
  }
}
</style> 