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

    <div class="panel-section">
      <div class="panel-header">
        <h2>Panel de Control</h2>
        <button @click="refreshData" class="actualizar-btn" v-if="hasPermission(8)">
          <i class="fas fa-sync-alt"></i> Actualizar
        </button>
      </div>

      <div class="panel-content">
        <div class="panel-card" v-if="hasPermission(8)">
          <h3>Actividad Reciente</h3>
          <div v-if="isLoading" class="loading-state">
            Cargando actividad reciente...
          </div>
          <div v-else-if="activity.length > 0" class="activity-list">
            <div v-for="(item, index) in activity" :key="index" class="activity-item">
              <div class="user-info">{{ item.user }}</div>
              <div class="activity-content">
                <span class="activity-action">{{ item.action }}</span>
                <span class="activity-details">{{ item.details }}</span>
              </div>
              <div class="activity-time">{{ formatTimeAgo(item.date) }}</div>
            </div>
          </div>
          <div v-else class="empty-state">
            No hay actividad reciente para mostrar
          </div>
        </div>

        <div class="panel-card" v-if="hasPermission(8)">
          <h3>Documentos Pendientes</h3>
          <div v-if="isLoading" class="loading-state">
            Cargando documentos pendientes...
          </div>
          <div v-else-if="pendingDocuments.length > 0" class="document-list">
            <div v-for="(doc, index) in pendingDocuments" :key="index" class="document-item">
              <div class="document-info">
                <div class="document-title">{{ doc.title }}</div>
                <div class="document-meta">
                  <span class="document-type">{{ doc.type }}</span>
                  <span class="document-date">{{ formatDate(doc.date) }}</span>
                </div>
              </div>
              <div class="document-priority" :class="doc.priority">{{ doc.priority }}</div>
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
import { useAuthStore } from '@/store/auth'

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
    // En un escenario real, estos datos vendrían de una API
    // Por ahora, usamos datos simulados
    
    // Simular retraso de red
    await new Promise(resolve => setTimeout(resolve, 800))
    
    stats.value = {
      documents: 157,
      pending: 0,
      users: 0,
      areas: 0
    }

    // Obtener actividad reciente
    activity.value = [
      { 
        date: new Date(Date.now() - 1000 * 60 * 10), 
        user: 'Capitán García', 
        action: 'Documento creado', 
        details: 'Informe #2023-042'
      },
      { 
        date: new Date(Date.now() - 1000 * 60 * 30), 
        user: 'Teniente Rodríguez', 
        action: 'Documento derivado', 
        details: 'A Oficina Central'
      },
      { 
        date: new Date(Date.now() - 1000 * 60 * 60), 
        user: 'Coronel Martínez', 
        action: 'Usuario actualizado', 
        details: 'Cambio de área'
      },
      { 
        date: new Date(Date.now() - 1000 * 60 * 60 * 3), 
        user: 'Mayor López', 
        action: 'Documento archivado', 
        details: 'Caso cerrado'
      },
    ]

    // Obtener documentos pendientes basados en rol
    // Si es administrador, ve todos. Sino, solo ve los de su área
    pendingDocuments.value = [
      {
        id: 1,
        title: 'Informe Pericial #2023-042',
        type: 'Informe',
        date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
        priority: 'alta',
        areaId: 1
      },
      {
        id: 2,
        title: 'Solicitud de Revisión Técnica',
        type: 'Solicitud',
        date: new Date(Date.now() - 1000 * 60 * 60 * 24),
        priority: 'media',
        areaId: 2
      },
      {
        id: 3,
        title: 'Memorándum Interno #MEM-2023-108',
        type: 'Memorándum',
        date: new Date(Date.now() - 1000 * 60 * 60 * 5),
        priority: 'baja',
        areaId: 1
      }
    ]

    // Aplicar filtro según permisos contextuales
    if (!isAdmin.value) {
      const userAreaId = authStore.user?.areaId || 0
      pendingDocuments.value = pendingDocuments.value.filter(
        doc => doc.areaId === userAreaId
      )
    }
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
.panel-section {
  background-color: var(--white);
  border-radius: var(--border-radius);
  box-shadow: var(--box-shadow);
  overflow: hidden;
  margin-bottom: 1rem;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--border-color);
}

.panel-header h2 {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-dark);
}

.panel-content {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  padding: 1rem;
}

.panel-card {
  background-color: var(--background-blue);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  overflow: hidden;
}

.panel-card h3 {
  margin: 0;
  padding: 0.75rem 1rem;
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-medium);
  background-color: var(--white);
  border-bottom: 1px solid var(--border-color);
}

/* Estados de carga y vacío */
.loading-state, .empty-state {
  padding: 1rem;
  text-align: center;
  color: var(--text-light);
  font-style: italic;
}

/* Lista de actividades */
.activity-list, .document-list {
  padding: 0;
}

.activity-item, .document-item {
  padding: 0.5rem 1rem;
  border-bottom: 1px solid rgba(0,0,0,0.05);
}

.activity-item:hover, .document-item:hover {
  background-color: rgba(255,255,255,0.4);
}

.activity-item:last-child, .document-item:last-child {
  border-bottom: none;
}

.user-info {
  font-weight: 600;
  color: var(--text-dark);
  margin-bottom: 0.25rem;
}

.activity-content {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
}

.activity-action {
  color: var(--primary-color);
  font-weight: 500;
}

.activity-details {
  color: var(--text-medium);
}

.activity-time {
  font-size: 0.75rem;
  color: var(--text-light);
  display: block;
  margin-top: 0.1rem;
}

/* Información de documentos */
.document-info {
  margin-bottom: 0.25rem;
}

.document-title {
  font-weight: 600;
  color: var(--text-dark);
}

.document-meta {
  display: flex;
  gap: 0.5rem;
  font-size: 0.75rem;
  color: var(--text-light);
}

.document-type {
  font-weight: 500;
}

.document-priority {
  align-self: flex-start;
  font-size: 0.7rem;
  font-weight: 600;
  padding: 0.125rem 0.5rem;
  border-radius: 1rem;
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
@media (max-width: 992px) {
  .stats-grid {
    grid-template-columns: repeat(3, 1fr);
  }
  
  .panel-content {
    grid-template-columns: 1fr 1fr;
  }
}

@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .panel-content {
    grid-template-columns: 1fr;
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
  
  .panel-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
  
  .stat-value {
    font-size: 2rem;
  }
}
</style> 