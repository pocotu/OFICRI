<template>
  <div class="document-list">
    <div class="filters">
      <div class="search-box">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Buscar documentos..."
          @input="handleSearch"
        />
        <i class="fas fa-search"></i>
      </div>

      <div class="filter-group">
        <select v-model="selectedType" @change="handleFilterChange">
          <option value="">Todos los tipos</option>
          <option v-for="type in documentTypes" :key="type.value" :value="type.value">
            {{ type.label }}
          </option>
        </select>

        <select v-model="selectedStatus" @change="handleFilterChange">
          <option value="">Todos los estados</option>
          <option v-for="status in documentStatuses" :key="status.value" :value="status.value">
            {{ status.label }}
          </option>
        </select>

        <select v-model="selectedArea" @change="handleFilterChange">
          <option value="">Todas las áreas</option>
          <option v-for="area in areas" :key="area.id" :value="area.id">
            {{ area.name }}
          </option>
        </select>

        <div class="date-range">
          <input
            type="date"
            v-model="dateFrom"
            @change="handleFilterChange"
            placeholder="Desde"
          />
          <input
            type="date"
            v-model="dateTo"
            @change="handleFilterChange"
            placeholder="Hasta"
          />
        </div>

        <button @click="clearFilters" class="clear-filters">
          <i class="fas fa-times"></i> Limpiar filtros
        </button>
      </div>
    </div>

    <div class="document-table">
      <table>
        <thead>
          <tr>
            <th>Número</th>
            <th>Título</th>
            <th>Tipo</th>
            <th>Estado</th>
            <th>Área</th>
            <th>Fecha</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="isLoading">
            <td colspan="7" class="loading">
              <i class="fas fa-spinner fa-spin"></i> Cargando documentos...
            </td>
          </tr>
          <tr v-else-if="filteredDocuments.length === 0">
            <td colspan="7" class="no-results">
              No se encontraron documentos
            </td>
          </tr>
          <tr v-for="doc in filteredDocuments" :key="doc.id">
            <td>{{ doc.number }}</td>
            <td>{{ doc.title }}</td>
            <td>{{ getTypeLabel(doc.type) }}</td>
            <td>
              <span :class="['status-badge', doc.status]">
                {{ getStatusLabel(doc.status) }}
              </span>
            </td>
            <td>{{ getAreaName(doc.areaId) }}</td>
            <td>{{ formatDate(doc.createdAt) }}</td>
            <td class="actions">
              <button @click="viewDocument(doc.id)" title="Ver documento">
                <i class="fas fa-eye"></i>
              </button>
              <button 
                v-if="hasPermission('edit')"
                @click="editDocument(doc.id)"
                title="Editar documento"
              >
                <i class="fas fa-edit"></i>
              </button>
              <button 
                v-if="hasPermission('derive')"
                @click="deriveDocument(doc.id)"
                title="Derivar documento"
              >
                <i class="fas fa-share"></i>
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="pagination">
      <button 
        :disabled="currentPage === 1"
        @click="changePage(currentPage - 1)"
      >
        <i class="fas fa-chevron-left"></i>
      </button>
      <span>Página {{ currentPage }} de {{ totalPages }}</span>
      <button 
        :disabled="currentPage === totalPages"
        @click="changePage(currentPage + 1)"
      >
        <i class="fas fa-chevron-right"></i>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useDocumentStore } from '@/store/documents'
import { useAuthStore } from '@/store'
import { formatDate } from '@/utils/dateUtils'

const router = useRouter()
const documentStore = useDocumentStore()
const authStore = useAuthStore()

// Filtros
const searchQuery = ref('')
const selectedType = ref('')
const selectedStatus = ref('')
const selectedArea = ref('')
const dateFrom = ref('')
const dateTo = ref('')

// Paginación
const currentPage = ref(1)
const itemsPerPage = 10

// Tipos y estados de documentos
const documentTypes = [
  { value: 'oficio', label: 'Oficio' },
  { value: 'memorandum', label: 'Memorándum' },
  { value: 'resolucion', label: 'Resolución' },
  { value: 'informe', label: 'Informe' }
]

const documentStatuses = [
  { value: 'pending', label: 'Pendiente' },
  { value: 'in_progress', label: 'En proceso' },
  { value: 'completed', label: 'Completado' },
  { value: 'archived', label: 'Archivado' }
]

// Computed
const filteredDocuments = computed(() => documentStore.filteredDocuments)
const isLoading = computed(() => documentStore.isLoading)
const totalPages = computed(() => Math.ceil(filteredDocuments.value.length / itemsPerPage))

// Métodos
const handleSearch = () => {
  documentStore.setFilters({ search: searchQuery.value })
  documentStore.fetchDocuments()
}

const handleFilterChange = () => {
  documentStore.setFilters({
    type: selectedType.value,
    status: selectedStatus.value,
    area: selectedArea.value,
    dateFrom: dateFrom.value,
    dateTo: dateTo.value
  })
  documentStore.fetchDocuments()
}

const clearFilters = () => {
  searchQuery.value = ''
  selectedType.value = ''
  selectedStatus.value = ''
  selectedArea.value = ''
  dateFrom.value = ''
  dateTo.value = ''
  documentStore.clearFilters()
  documentStore.fetchDocuments()
}

const changePage = (page) => {
  currentPage.value = page
  // Aquí se implementaría la lógica de paginación del servidor
}

const viewDocument = (id) => {
  router.push(`/documents/${id}`)
}

const editDocument = (id) => {
  router.push(`/documents/${id}/edit`)
}

const deriveDocument = (id) => {
  router.push(`/documents/${id}/derive`)
}

const getTypeLabel = (type) => {
  const found = documentTypes.find(t => t.value === type)
  return found ? found.label : type
}

const getStatusLabel = (status) => {
  const found = documentStatuses.find(s => s.value === status)
  return found ? found.label : status
}

const getAreaName = (areaId) => {
  // Implementar lógica para obtener nombre del área
  return areaId
}

const hasPermission = (permission) => {
  return authStore.hasPermission(permission)
}

onMounted(() => {
  documentStore.fetchDocuments()
})
</script>

<style scoped>
.document-list {
  padding: 1rem;
}

.filters {
  margin-bottom: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.search-box {
  position: relative;
  max-width: 400px;
}

.search-box input {
  width: 100%;
  padding: 0.5rem 2rem 0.5rem 1rem;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.search-box i {
  position: absolute;
  right: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: #666;
}

.filter-group {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.filter-group select,
.filter-group input {
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  min-width: 150px;
}

.date-range {
  display: flex;
  gap: 0.5rem;
}

.clear-filters {
  padding: 0.5rem 1rem;
  background-color: #f5f5f5;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.clear-filters:hover {
  background-color: #e0e0e0;
}

.document-table {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 1rem;
}

th, td {
  padding: 0.75rem;
  text-align: left;
  border-bottom: 1px solid #ddd;
}

th {
  background-color: #f5f5f5;
  font-weight: 600;
}

.status-badge {
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.875rem;
}

.status-badge.pending {
  background-color: #fff3cd;
  color: #856404;
}

.status-badge.in_progress {
  background-color: #cce5ff;
  color: #004085;
}

.status-badge.completed {
  background-color: #d4edda;
  color: #155724;
}

.status-badge.archived {
  background-color: #f8d7da;
  color: #721c24;
}

.actions {
  display: flex;
  gap: 0.5rem;
}

.actions button {
  padding: 0.25rem;
  background: none;
  border: none;
  cursor: pointer;
  color: #666;
}

.actions button:hover {
  color: #333;
}

.loading, .no-results {
  text-align: center;
  padding: 2rem;
  color: #666;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  margin-top: 1rem;
}

.pagination button {
  padding: 0.5rem 1rem;
  background-color: #f5f5f5;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
}

.pagination button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .filter-group {
    flex-direction: column;
  }

  .filter-group select,
  .filter-group input {
    width: 100%;
  }

  .date-range {
    flex-direction: column;
  }
}
</style> 