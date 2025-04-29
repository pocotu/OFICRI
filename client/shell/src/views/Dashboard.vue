<template>
  <div class="dashboard">
    <div class="dashboard-header">
      <h1>Panel de Control</h1>
      <button @click="refreshData" class="actualizar-btn" v-if="hasPermission(8)">
        <i class="fas fa-sync-alt"></i> Actualizar
      </button>
    </div>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-card-inner">
          <div class="stat-value">{{ stats.users }}</div>
          <div class="stat-label">USUARIOS ACTIVOS</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-card-inner">
          <div class="stat-value">{{ stats.pending }}</div>
          <div class="stat-label">DOCUMENTOS PENDIENTES</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-card-inner">
          <div class="stat-value">{{ stats.areas }}</div>
          <div class="stat-label">ÁREAS ACTIVAS</div>
        </div>
      </div>
    </div>

    <div class="panel-content">
      <div class="panel-row">
        <!-- Actividad Reciente -->
        <div class="panel-card" v-if="hasPermission(8)">
          <h3>Actividad Reciente</h3>
          <div v-if="isLoading" class="loading-state">
            Cargando actividad reciente...
          </div>
          <div v-else-if="activity.length > 0" class="activity-list">
            <div v-for="(item, index) in activity" :key="index" class="activity-item">
              <div class="activity-info">
                <div class="activity-user">{{ item.usuario }}</div>
                <div class="activity-details">
                  <span class="activity-action">{{ item.accion }}</span>
                  <span class="activity-target">{{ item.detalles }}</span>
                </div>
              </div>
              <div class="activity-time">{{ formatTimeAgo(item.fecha) }}</div>
            </div>
          </div>
          <div v-else class="empty-state">
            No hay actividad reciente
          </div>
        </div>

        <!-- Documentos Pendientes -->
        <div class="panel-card" v-if="hasPermission(8)">
          <h3>Documentos Pendientes</h3>
          <div v-if="isLoading" class="loading-state">
            Cargando documentos pendientes...
          </div>
          <div v-else-if="pendingDocuments.length > 0" class="document-list">
            <div v-for="doc in pendingDocuments" :key="doc.id" class="document-item">
              <div class="document-info">
                <div class="document-title">{{ doc.titulo }}</div>
                <div class="document-meta">
                  <span class="document-type">{{ doc.tipo }}</span>
                  <span class="document-date">{{ formatDate(doc.fecha) }}</span>
                </div>
              </div>
              <div class="document-priority" :class="doc.prioridad.toLowerCase()">{{ doc.prioridad }}</div>
            </div>
          </div>
          <div v-else class="empty-state">
            No hay documentos pendientes
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useAuthStore } from '../store/auth'
import { getDashboardData } from '../services/dashboardService'

// Referencias al estado
const stats = ref({
  documents: 0,
  pending: 0,
  users: 0,
  areas: 0
})

const activity = ref([])
const pendingDocuments = ref([])
const isLoading = ref(true)

// Obtener store de autenticación para verificar permisos
const authStore = useAuthStore()

// Constantes para permisos según opciones.md
const PERMISSION_BITS = {
  CREAR: 1, // Bit 0
  EDITAR: 2, // Bit 1
  ELIMINAR: 4, // Bit 2
  VER: 8, // Bit 3
  DERIVAR: 16, // Bit 4
  AUDITAR: 32, // Bit 5
  EXPORTAR: 64, // Bit 6
  ADMINISTRAR: 128 // Bit 7
}

// Verificar si el usuario tiene permisos
const hasPermission = (permissionBit) => {
  return authStore.hasPermission(permissionBit)
}

// Verificar si el usuario es administrador
const isAdmin = computed(() => {
  return hasPermission(PERMISSION_BITS.ADMINISTRAR)
})

// Formatear fecha
const formatDate = (date) => {
  const dateObj = new Date(date)
  return dateObj.toLocaleDateString('es-ES')
}

// Formatear tiempo relativo
const formatTimeAgo = (date) => {
  const now = new Date()
  const dateObj = new Date(date)
  const diffMinutes = Math.floor((now - dateObj) / (1000 * 60))
  
  if (diffMinutes < 1) return 'Ahora mismo'
  if (diffMinutes < 60) return `Hace ${diffMinutes} minutos`
  if (diffMinutes < 1440) {
    const hours = Math.floor(diffMinutes / 60)
    return `Hace ${hours} ${hours === 1 ? 'hora' : 'horas'}`
  }
  const days = Math.floor(diffMinutes / 1440)
  return `Hace ${days} ${days === 1 ? 'día' : 'días'}`
}

// Cargar datos del dashboard
const loadDashboardData = async () => {
  isLoading.value = true
  try {
    const data = await getDashboardData()
    stats.value = data.stats
    activity.value = data.activity
    pendingDocuments.value = data.pendingDocuments
  } catch (error) {
    console.error('Error al cargar datos del dashboard:', error)
  } finally {
    isLoading.value = false
  }
}

// Actualizar datos
const refreshData = () => {
  loadDashboardData()
}

// Al montar el componente
onMounted(() => {
  // Verificar que el usuario tiene permiso para ver el dashboard
  if (!hasPermission(PERMISSION_BITS.VER)) {
    // En un caso real, redirigiríamos a una página de acceso denegado
    console.error('No tiene permisos para acceder al dashboard')
    return
  }
  
  loadDashboardData()
})
</script>

<style scoped>
/* Variables de color para mantener consistencia */
:root {
  --primary-color: #0d4e25;
  --primary-dark: #083719;
  --primary-light: #e9f5ee; 
  --text-dark: #212529;
  --text-medium: #495057;
  --text-light: #6c757d;
  --background-light: #f8f9fa;
  --background-blue: #cfe2f3;
  --border-color: #dee2e6;
  --white: #ffffff;
  --box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
  --border-radius: 0.375rem;
}

.dashboard {
  padding: 1rem;
  background-color: var(--background-light);
  height: auto;
  min-height: auto;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

/* Encabezado del dashboard */
.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.dashboard-header h1 {
  margin: 0;
  color: var(--text-dark);
  font-size: 1.5rem;
  font-weight: 600;
}

/* Botón de actualizar estilizado */
.actualizar-btn {
  background-color: var(--primary-color);
  color: var(--white);
  border: none;
  border-radius: var(--border-radius);
  padding: 0.375rem 0.75rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: background-color 0.2s ease;
}

.actualizar-btn:hover {
  background-color: var(--primary-dark);
}

.actualizar-btn i {
  font-size: 0.875rem;
}

/* Grid de estadísticas */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin-bottom: 1rem;
}

.stat-card {
  background-color: var(--white);
  border-radius: var(--border-radius);
  overflow: hidden;
  box-shadow: var(--box-shadow);
  border-top: 3px solid var(--primary-color);
}

.stat-card-inner {
  padding: 1rem;
  text-align: center;
}

.stat-value {
  font-size: 2.5rem;
  font-weight: 700;
  color: var(--primary-color);
  line-height: 1;
  margin-bottom: 0.25rem;
}

.stat-label {
  color: var(--text-light);
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* Panel principal */
.panel-content {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
}

.panel-card {
  background-color: var(--white);
  border-radius: var(--border-radius);
  padding: 1rem;
  box-shadow: var(--box-shadow);
}

.panel-card h3 {
  margin: 0 0 1rem 0;
  color: var(--text-dark);
  font-size: 1.1rem;
  font-weight: 600;
}

/* Estados de carga y vacío */
.loading-state, .empty-state {
  text-align: center;
  color: var(--text-light);
  padding: 2rem;
}

/* Lista de actividades */
.activity-list, .document-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.activity-item, .document-item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 0.75rem;
  border-radius: var(--border-radius);
  background-color: var(--background-light);
}

.activity-info, .document-info {
  flex: 1;
}

.activity-user {
  font-weight: 500;
  color: var(--text-dark);
}

.activity-details {
  color: var(--text-medium);
  font-size: 0.875rem;
}

.activity-time {
  color: var(--text-light);
  font-size: 0.75rem;
}

/* Información de documentos */
.document-title {
  font-weight: 500;
  color: var(--text-dark);
}

.document-meta {
  display: flex;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: var(--text-medium);
}

.document-priority {
  padding: 0.25rem 0.5rem;
  border-radius: var(--border-radius);
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: uppercase;
}

.document-priority.alta {
  background-color: #f8d7da;
  color: #721c24;
}

.document-priority.media {
  background-color: #fff3cd;
  color: #856404;
}

.document-priority.baja {
  background-color: #d1e7dd;
  color: #0f5132;
}

/* Responsive */
@media (min-width: 768px) {
  .panel-content {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 576px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .dashboard-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
}
</style> 