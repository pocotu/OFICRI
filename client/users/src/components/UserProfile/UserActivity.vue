<template>
  <div class="user-activity">
    <div class="activity-filters">
      <OfiSelect
        v-model="filters.type"
        label="Tipo de Actividad"
        :options="activityTypes"
        clearable
      />
      <OfiDateRangePicker
        v-model="filters.dateRange"
        label="Rango de Fechas"
      />
      <OfiButton
        variant="secondary"
        @click="resetFilters"
      >
        Limpiar Filtros
      </OfiButton>
    </div>

    <div class="activity-list">
      <OfiTable
        :items="filteredActivities"
        :columns="columns"
        :loading="loading"
        :pagination="pagination"
        @page-change="handlePageChange"
      >
        <template #empty>
          <div class="empty-state">
            <OfiIcon name="activity" size="xl" />
            <p>No se encontraron registros de actividad</p>
          </div>
        </template>

        <template #type="{ item }">
          <OfiBadge
            :variant="getActivityTypeVariant(item.type)"
          >
            {{ getActivityTypeLabel(item.type) }}
          </OfiBadge>
        </template>

        <template #timestamp="{ item }">
          {{ formatDate(item.timestamp) }}
        </template>

        <template #details="{ item }">
          <div class="activity-details">
            <p class="activity-description">{{ item.description }}</p>
            <div v-if="item.metadata" class="activity-metadata">
              <pre>{{ JSON.stringify(item.metadata, null, 2) }}</pre>
            </div>
          </div>
        </template>
      </OfiTable>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useUserStore } from '@/store/userStore'
import OfiTable from '@shared/components/OfiTable.vue'
import OfiSelect from '@shared/components/OfiSelect.vue'
import OfiDateRangePicker from '@shared/components/OfiDateRangePicker.vue'
import OfiButton from '@shared/components/OfiButton.vue'
import OfiBadge from '@shared/components/OfiBadge.vue'
import OfiIcon from '@shared/components/OfiIcon.vue'
import { formatDate } from '@shared/utils/date'

const props = defineProps({
  userId: {
    type: String,
    required: true
  }
})

const userStore = useUserStore()
const loading = ref(false)
const activities = ref([])
const pagination = ref({
  page: 1,
  pageSize: 10,
  total: 0
})

const filters = ref({
  type: null,
  dateRange: null
})

const activityTypes = [
  { value: 'LOGIN', label: 'Inicio de sesión' },
  { value: 'LOGOUT', label: 'Cierre de sesión' },
  { value: 'PASSWORD_CHANGE', label: 'Cambio de contraseña' },
  { value: 'PROFILE_UPDATE', label: 'Actualización de perfil' },
  { value: 'DOCUMENT_CREATE', label: 'Creación de documento' },
  { value: 'DOCUMENT_UPDATE', label: 'Actualización de documento' },
  { value: 'DOCUMENT_DELETE', label: 'Eliminación de documento' }
]

const columns = [
  { key: 'type', label: 'Tipo', width: '150px' },
  { key: 'timestamp', label: 'Fecha y Hora', width: '180px' },
  { key: 'details', label: 'Detalles' }
]

const getActivityTypeVariant = (type) => {
  const variants = {
    LOGIN: 'success',
    LOGOUT: 'info',
    PASSWORD_CHANGE: 'warning',
    PROFILE_UPDATE: 'primary',
    DOCUMENT_CREATE: 'success',
    DOCUMENT_UPDATE: 'primary',
    DOCUMENT_DELETE: 'danger'
  }
  return variants[type] || 'default'
}

const getActivityTypeLabel = (type) => {
  const typeObj = activityTypes.find(t => t.value === type)
  return typeObj ? typeObj.label : type
}

const filteredActivities = computed(() => {
  let result = [...activities.value]

  if (filters.value.type) {
    result = result.filter(activity => activity.type === filters.value.type)
  }

  if (filters.value.dateRange) {
    const [start, end] = filters.value.dateRange
    result = result.filter(activity => {
      const timestamp = new Date(activity.timestamp)
      return timestamp >= start && timestamp <= end
    })
  }

  return result
})

const loadActivities = async () => {
  try {
    loading.value = true
    const response = await userStore.getUserActivities(props.userId, {
      page: pagination.value.page,
      pageSize: pagination.value.pageSize
    })
    activities.value = response.items
    pagination.value.total = response.total
  } catch (err) {
    console.error('Error loading activities:', err)
  } finally {
    loading.value = false
  }
}

const handlePageChange = (page) => {
  pagination.value.page = page
  loadActivities()
}

const resetFilters = () => {
  filters.value = {
    type: null,
    dateRange: null
  }
}

onMounted(() => {
  loadActivities()
})
</script>

<style scoped>
.user-activity {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.activity-filters {
  display: flex;
  gap: var(--spacing-md);
  align-items: flex-end;
}

.activity-list {
  flex: 1;
  min-height: 0;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-md);
  padding: var(--spacing-xl);
  color: var(--color-text-secondary);
}

.activity-details {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.activity-description {
  margin: 0;
  color: var(--color-text-primary);
}

.activity-metadata {
  background-color: var(--color-background-secondary);
  padding: var(--spacing-sm);
  border-radius: var(--border-radius-sm);
  font-family: monospace;
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.activity-metadata pre {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
}
</style> 