<template>
  <div class="ofi-table">
    <div class="ofi-table__filters" v-if="showFilters">
      <slot name="filters"></slot>
    </div>
    
    <div class="ofi-table__container">
      <table>
        <thead>
          <tr>
            <th
              v-for="column in columns"
              :key="column.key"
              :class="{ 'sortable': column.sortable }"
              @click="column.sortable && handleSort(column.key)"
            >
              {{ column.label }}
              <span v-if="column.sortable" class="sort-icon">
                {{ getSortIcon(column.key) }}
              </span>
            </th>
            <th v-if="showActions" class="actions-column">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading">
            <td :colspan="columns.length + (showActions ? 1 : 0)" class="loading-cell">
              <div class="loading-spinner"></div>
            </td>
          </tr>
          <tr v-else-if="!items.length">
            <td :colspan="columns.length + (showActions ? 1 : 0)" class="empty-cell">
              No hay datos disponibles
            </td>
          </tr>
          <tr v-else v-for="(item, index) in items" :key="getItemKey(item, index)">
            <td v-for="column in columns" :key="column.key">
              <slot
                :name="column.key"
                :item="item"
                :value="item[column.key]"
              >
                {{ item[column.key] }}
              </slot>
            </td>
            <td v-if="showActions" class="actions-cell">
              <slot name="actions" :item="item">
                <OfiButton
                  v-if="showEdit"
                  variant="secondary"
                  size="small"
                  @click="$emit('edit', item)"
                >
                  Editar
                </OfiButton>
                <OfiButton
                  v-if="showDelete"
                  variant="danger"
                  size="small"
                  @click="$emit('delete', item)"
                >
                  Eliminar
                </OfiButton>
              </slot>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="ofi-table__pagination" v-if="showPagination">
      <div class="pagination-info">
        Mostrando {{ paginationInfo.start }} - {{ paginationInfo.end }} de {{ totalItems }} registros
      </div>
      <div class="pagination-controls">
        <OfiButton
          :disabled="currentPage === 1"
          variant="secondary"
          size="small"
          @click="handlePageChange(currentPage - 1)"
        >
          Anterior
        </OfiButton>
        <span class="page-info">Página {{ currentPage }} de {{ totalPages }}</span>
        <OfiButton
          :disabled="currentPage === totalPages"
          variant="secondary"
          size="small"
          @click="handlePageChange(currentPage + 1)"
        >
          Siguiente
        </OfiButton>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import OfiButton from '../OfiButton/OfiButton.vue'

const props = defineProps({
  columns: {
    type: Array,
    required: true
  },
  items: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  },
  totalItems: {
    type: Number,
    default: 0
  },
  itemsPerPage: {
    type: Number,
    default: 10
  },
  showActions: {
    type: Boolean,
    default: true
  },
  showEdit: {
    type: Boolean,
    default: true
  },
  showDelete: {
    type: Boolean,
    default: true
  },
  showFilters: {
    type: Boolean,
    default: true
  },
  showPagination: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['page-change', 'sort', 'edit', 'delete'])

const currentPage = ref(1)
const sortBy = ref(null)
const sortDirection = ref('asc')

const totalPages = computed(() => {
  return Math.ceil(props.totalItems / props.itemsPerPage)
})

const paginationInfo = computed(() => {
  const start = (currentPage.value - 1) * props.itemsPerPage + 1
  const end = Math.min(start + props.itemsPerPage - 1, props.totalItems)
  return { start, end }
})

const getItemKey = (item, index) => {
  return item.id || item._id || index
}

const getSortIcon = (columnKey) => {
  if (sortBy.value !== columnKey) return '↕'
  return sortDirection.value === 'asc' ? '↑' : '↓'
}

const handleSort = (columnKey) => {
  if (sortBy.value === columnKey) {
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortBy.value = columnKey
    sortDirection.value = 'asc'
  }
  emit('sort', { column: columnKey, direction: sortDirection.value })
}

const handlePageChange = (page) => {
  if (page < 1 || page > totalPages.value) return
  currentPage.value = page
  emit('page-change', page)
}
</script>

<style scoped>
.ofi-table {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.ofi-table__filters {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.ofi-table__container {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
  background: white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

th, td {
  padding: 0.75rem 1rem;
  text-align: left;
  border-bottom: 1px solid #e2e8f0;
}

th {
  background: #f8fafc;
  font-weight: 600;
  color: #475569;
}

.sortable {
  cursor: pointer;
  user-select: none;
}

.sortable:hover {
  background: #f1f5f9;
}

.sort-icon {
  margin-left: 0.5rem;
  font-size: 0.875rem;
}

.actions-column {
  width: 150px;
  text-align: center;
}

.actions-cell {
  display: flex;
  gap: 0.5rem;
  justify-content: center;
}

.loading-cell, .empty-cell {
  text-align: center;
  padding: 2rem;
  color: #64748b;
}

.loading-spinner {
  width: 24px;
  height: 24px;
  border: 2px solid #e2e8f0;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto;
}

.ofi-table__pagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: white;
  border-top: 1px solid #e2e8f0;
}

.pagination-controls {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.page-info {
  color: #64748b;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style> 