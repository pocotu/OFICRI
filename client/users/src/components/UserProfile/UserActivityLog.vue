<template>
  <div class="user-activity-log">
    <div v-if="loading" class="loading-state">
      <OfiSpinner />
    </div>

    <div v-else-if="error" class="error-state">
      <OfiAlert type="error" :message="error" />
    </div>

    <div v-else-if="activities.length === 0" class="empty-state">
      <OfiAlert type="info" message="No hay registros de actividad para mostrar" />
    </div>

    <div v-else class="activity-list">
      <div v-for="activity in activities" :key="activity.id" class="activity-item">
        <div class="activity-icon">
          <OfiIcon :name="getActivityIcon(activity.tipo)" />
        </div>
        
        <div class="activity-content">
          <div class="activity-header">
            <span class="activity-type">{{ getActivityTypeLabel(activity.tipo) }}</span>
            <span class="activity-date">{{ formatDate(activity.fecha) }}</span>
          </div>
          
          <div class="activity-details">
            <p>{{ activity.descripcion }}</p>
            <div v-if="activity.detalles" class="activity-metadata">
              <div v-for="(value, key) in activity.detalles" :key="key" class="metadata-item">
                <span class="metadata-label">{{ formatMetadataLabel(key) }}:</span>
                <span class="metadata-value">{{ value }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="hasMorePages" class="load-more">
      <OfiButton
        variant="secondary"
        :loading="loadingMore"
        @click="loadMore"
      >
        Cargar más
      </OfiButton>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useUserStore } from '@/store/userStore'
import OfiSpinner from '@shared/components/OfiSpinner.vue'
import OfiAlert from '@shared/components/OfiAlert.vue'
import OfiIcon from '@shared/components/OfiIcon.vue'
import OfiButton from '@shared/components/OfiButton.vue'

const props = defineProps({
  userId: {
    type: String,
    required: true
  }
})

const userStore = useUserStore()
const activities = ref([])
const loading = ref(true)
const loadingMore = ref(false)
const error = ref(null)
const hasMorePages = ref(false)
const currentPage = ref(1)

const getActivityIcon = (type) => {
  const icons = {
    LOGIN: 'login',
    LOGOUT: 'logout',
    UPDATE: 'edit',
    CREATE: 'plus',
    DELETE: 'trash',
    PASSWORD_CHANGE: 'key',
    ROLE_CHANGE: 'users',
    AREA_CHANGE: 'building'
  }
  return icons[type] || 'info'
}

const getActivityTypeLabel = (type) => {
  const labels = {
    LOGIN: 'Inicio de sesión',
    LOGOUT: 'Cierre de sesión',
    UPDATE: 'Actualización',
    CREATE: 'Creación',
    DELETE: 'Eliminación',
    PASSWORD_CHANGE: 'Cambio de contraseña',
    ROLE_CHANGE: 'Cambio de rol',
    AREA_CHANGE: 'Cambio de área'
  }
  return labels[type] || type
}

const formatDate = (date) => {
  return new Date(date).toLocaleString('es-PE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const formatMetadataLabel = (key) => {
  const labels = {
    ip: 'IP',
    userAgent: 'Navegador',
    oldValue: 'Valor anterior',
    newValue: 'Nuevo valor',
    area: 'Área',
    role: 'Rol'
  }
  return labels[key] || key
}

const loadActivities = async (page = 1) => {
  try {
    if (page === 1) {
      loading.value = true
    } else {
      loadingMore.value = true
    }

    const response = await userStore.getUserActivities(props.userId, page)
    activities.value = page === 1 ? response.data : [...activities.value, ...response.data]
    hasMorePages.value = response.hasMore
    currentPage.value = page
  } catch (err) {
    error.value = 'Error al cargar el historial de actividad'
    console.error('Error loading activities:', err)
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

const loadMore = () => {
  loadActivities(currentPage.value + 1)
}

onMounted(() => {
  loadActivities()
})
</script>

<style scoped>
.user-activity-log {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.loading-state,
.error-state,
.empty-state {
  display: flex;
  justify-content: center;
  padding: var(--spacing-xl);
}

.activity-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.activity-item {
  display: flex;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  background-color: var(--color-background-secondary);
  border-radius: var(--border-radius-md);
}

.activity-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background-color: var(--color-primary-light);
  border-radius: 50%;
  color: var(--color-primary);
}

.activity-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.activity-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.activity-type {
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
}

.activity-date {
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
}

.activity-details {
  color: var(--color-text-secondary);
}

.activity-metadata {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--spacing-sm);
  margin-top: var(--spacing-sm);
  padding: var(--spacing-sm);
  background-color: var(--color-background-tertiary);
  border-radius: var(--border-radius-sm);
}

.metadata-item {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.metadata-label {
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
}

.metadata-value {
  color: var(--color-text-secondary);
}

.load-more {
  display: flex;
  justify-content: center;
  margin-top: var(--spacing-lg);
}
</style> 