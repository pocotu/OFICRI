<template>
  <div class="area-manager">
    <!-- Encabezado -->
    <div class="area-manager-header">
      <div class="title-section">
        <h2>Gestión de Áreas</h2>
        <span class="area-count">{{ filteredAreas.length }} áreas encontradas</span>
      </div>
      <div class="actions-section">
        <div v-if="isLoading" class="loading-indicator">
          <i class="fas fa-sync fa-spin"></i> Cargando...
        </div>
        
        <button 
          v-if="!isLoading" 
          @click="loadAreas" 
          class="reload-button" 
          title="Recargar datos"
        >
          <i class="fas fa-sync"></i>
        </button>
        
        <AreaExport 
          :areas="areaStore.areas"
          :filtered-areas="filteredAreas"
          :filters="filters"
          @export-completed="handleExportCompleted"
        />
        
        <button 
          v-if="hasPermissionToCreate" 
          @click="showCreateModal = true"
          class="create-button"
        >
          <i class="fas fa-plus"></i> Nueva Área
        </button>
      </div>
    </div>

    <!-- Filtros -->
    <AreaFilters
      :areas="areaStore.areas"
      v-model:filters="filters"
      @filter-changed="handleFilterChange"
    />

    <!-- Vista principal - Condicional según modo -->
    <div v-if="currentView === 'tree'" class="area-tree-view">
      <AreaHierarchyTree
        :initial-selected-area-id="null"
        @create-area="showCreateModal = true"
        @edit-area="editArea"
        @delete-area="confirmDelete"
        @create-child="createChildArea"
      />
    </div>

    <div v-else-if="currentView === 'grid'" class="area-grid-view">
      <div v-if="filteredAreas.length === 0" class="empty-state">
        <i class="fas fa-search"></i>
        <p>No se encontraron áreas con los filtros aplicados</p>
        <button @click="filters = {...filters, searchQuery: '', type: '', status: ''}" class="reset-filters">
          Limpiar filtros
        </button>
      </div>
      <div v-else class="area-grid">
        <div 
          v-for="area in filteredAreas" 
          :key="area.IDArea"
          class="area-card"
        >
          <div class="area-card-header">
            <div class="area-badge" :class="area.TipoArea.toLowerCase()">
              {{ getAreaTypeLabel(area.TipoArea) }}
            </div>
            <div :class="['status-badge', area.IsActive ? 'active' : 'inactive']">
              {{ area.IsActive ? 'Activo' : 'Inactivo' }}
            </div>
          </div>
          
          <div class="area-card-content">
            <h3 class="area-name">{{ area.NombreArea }}</h3>
            <p class="area-code">{{ area.CodigoIdentificacion }}</p>
            <p v-if="area.Descripcion" class="area-description">
              {{ area.Descripcion.length > 80 ? area.Descripcion.substring(0, 80) + '...' : area.Descripcion }}
            </p>
          </div>
          
          <div class="area-card-footer">
            <button 
              v-if="hasPermissionToEdit"
              @click="editArea(area)"
              class="action-button edit"
              title="Editar"
            >
              <i class="fas fa-edit"></i>
            </button>
            <button 
              v-if="hasPermissionToDelete"
              @click="confirmDelete(area)"
              class="action-button delete"
              title="Eliminar"
            >
              <i class="fas fa-trash"></i>
            </button>
            <button 
              v-if="hasPermissionToCreate"
              @click="createChildArea(area)"
              class="action-button add-child"
              title="Añadir Sub-área"
            >
              <i class="fas fa-plus"></i>
            </button>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="area-list-view">
      <div v-if="filteredAreas.length === 0" class="empty-state">
        <i class="fas fa-search"></i>
        <p>No se encontraron áreas con los filtros aplicados</p>
        <button @click="filters = {...filters, searchQuery: '', type: '', status: ''}" class="reset-filters">
          Limpiar filtros
        </button>
      </div>
      <div v-else class="area-list">
        <table class="area-table">
          <thead>
            <tr>
              <th @click="filters.sortBy = 'codigo'; filters.sortDirection = filters.sortDirection === 'asc' ? 'desc' : 'asc'">
                Código
                <i v-if="filters.sortBy === 'codigo'" :class="filters.sortDirection === 'asc' ? 'fas fa-sort-up' : 'fas fa-sort-down'"></i>
              </th>
              <th @click="filters.sortBy = 'nombre'; filters.sortDirection = filters.sortDirection === 'asc' ? 'desc' : 'asc'">
                Nombre
                <i v-if="filters.sortBy === 'nombre'" :class="filters.sortDirection === 'asc' ? 'fas fa-sort-up' : 'fas fa-sort-down'"></i>
              </th>
              <th @click="filters.sortBy = 'tipo'; filters.sortDirection = filters.sortDirection === 'asc' ? 'desc' : 'asc'">
                Tipo
                <i v-if="filters.sortBy === 'tipo'" :class="filters.sortDirection === 'asc' ? 'fas fa-sort-up' : 'fas fa-sort-down'"></i>
              </th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="area in filteredAreas" :key="area.IDArea">
              <td>{{ area.CodigoIdentificacion }}</td>
              <td>{{ area.NombreArea }}</td>
              <td>{{ getAreaTypeLabel(area.TipoArea) }}</td>
              <td>
                <span :class="['status-badge', area.IsActive ? 'active' : 'inactive']">
                  {{ area.IsActive ? 'Activo' : 'Inactivo' }}
                </span>
              </td>
              <td class="actions">
                <button 
                  v-if="hasPermissionToEdit"
                  @click="editArea(area)"
                  class="action-button edit"
                  title="Editar"
                >
                  <i class="fas fa-edit"></i>
                </button>
                <button 
                  v-if="hasPermissionToDelete"
                  @click="confirmDelete(area)"
                  class="action-button delete"
                  title="Eliminar"
                >
                  <i class="fas fa-trash"></i>
                </button>
                <button 
                  v-if="hasPermissionToCreate"
                  @click="createChildArea(area)"
                  class="action-button add-child"
                  title="Añadir Sub-área"
                >
                  <i class="fas fa-plus"></i>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal de Creación/Edición usando el componente AreaForm -->
    <div v-if="showCreateModal || showEditModal" class="modal-overlay">
      <AreaForm
        :area="showEditModal ? formData : null"
        :all-areas="areaStore.areas"
        @save="handleSubmit"
        @close="closeModal"
        @validation-error="(errors) => showToast('Por favor corrija los errores en el formulario', 'warning')"
      />
    </div>

    <!-- Modal de Confirmación de Eliminación -->
    <div v-if="showDeleteModal" class="modal-overlay" @click="showDeleteModal = false">
      <div class="confirmation-modal" @click.stop>
        <h3>Confirmar Eliminación</h3>
        <p>¿Está seguro que desea eliminar el área "{{ areaToDelete?.NombreArea }}"?</p>
        
        <div v-if="areaStore.getChildrenOf(areaToDelete?.IDArea)?.length > 0" class="warning-message">
          <i class="fas fa-exclamation-triangle"></i>
          <span>Esta área tiene sub-áreas que también serán afectadas.</span>
        </div>
        
        <p class="warning">Esta acción no se puede deshacer.</p>
        
        <div class="form-actions">
          <button @click="showDeleteModal = false" class="cancel-button">
            Cancelar
          </button>
          <button @click="deleteArea" class="delete-button">
            Eliminar
          </button>
        </div>
      </div>
    </div>

    <!-- Componente de Toast para notificaciones -->
    <ToastContainer />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useAreaStore } from '@/store/areas'
import { useAuthStore } from '@/store/auth'
import { useToast } from '@/shared/composables/useToast'
import { auditService } from '@/shared/services/security/auditTrail'
import AreaFilters from './AreaFilters.vue'
import AreaHierarchyTree from './AreaHierarchyTree.vue'
import AreaForm from './AreaForm.vue'
import AreaExport from './AreaExport.vue'
import ToastContainer from '@/shared/components/Toast/ToastContainer.vue'

const areaStore = useAreaStore()
const authStore = useAuthStore()
const { showToast } = useToast()

// Estado
const searchQuery = ref('')
const typeFilter = ref('')
const showCreateModal = ref(false)
const showEditModal = ref(false)
const showDeleteModal = ref(false)
const areaToDelete = ref(null)
const isLoading = ref(false)
const currentView = ref('list') // 'list', 'grid', 'tree'

const formData = ref({
  CodigoIdentificacion: '',
  NombreArea: '',
  TipoArea: '',
  Descripcion: '',
  IsActive: true
})

const filters = ref({
  searchQuery: '',
  type: '',
  status: '',
  parentArea: '',
  dateFrom: '',
  dateTo: '',
  createdBy: '',
  sortBy: 'nombre',
  sortDirection: 'asc',
  viewMode: 'list'
})

// Permisos
const hasPermissionToCreate = computed(() => authStore.hasPermission(1)) // Bit 0
const hasPermissionToEdit = computed(() => authStore.hasPermission(2))   // Bit 1
const hasPermissionToDelete = computed(() => authStore.hasPermission(4)) // Bit 2

// Computed
const filteredAreas = computed(() => {
  const filtered = areaStore.filterAreas({
    searchQuery: filters.value.searchQuery,
    type: filters.value.type,
    status: filters.value.status,
    parentArea: filters.value.parentArea,
    dateFrom: filters.value.dateFrom,
    dateTo: filters.value.dateTo,
    createdBy: filters.value.createdBy
  })
  
  return areaStore.sortAreas(
    filtered, 
    filters.value.sortBy, 
    filters.value.sortDirection
  )
})

// Métodos
const getAreaTypeLabel = (type) => {
  switch (type) {
    case 'RECEPCION':
      return 'Recepción'
    case 'ESPECIALIZADA':
      return 'Especializada'
    case 'ADMINISTRATIVA':
      return 'Administrativa'
    case 'OPERATIVA':
      return 'Operativa'
    case 'LEGAL':
      return 'Legal'
    case 'MESA_PARTES':
      return 'Mesa de Partes'
    default:
      return 'Otro'
  }
}

const editArea = (area) => {
  formData.value = { ...area }
  showEditModal.value = true
}

const createChildArea = (parentArea) => {
  formData.value = {
    CodigoIdentificacion: '',
    NombreArea: '',
    TipoArea: '',
    Descripcion: '',
    IsActive: true,
    IDAreaPadre: parentArea.IDArea
  }
  showCreateModal.value = true
}

const confirmDelete = (area) => {
  areaToDelete.value = area
  showDeleteModal.value = true
}

const closeModal = () => {
  showCreateModal.value = false
  showEditModal.value = false
  formData.value = {
    CodigoIdentificacion: '',
    NombreArea: '',
    TipoArea: '',
    Descripcion: '',
    IsActive: true
  }
}

const handleSubmit = async () => {
  try {
    if (showEditModal.value) {
      await areaStore.updateArea(formData.value)
      showToast('Área actualizada correctamente', 'success')
    } else {
      await areaStore.createArea(formData.value)
      showToast('Área creada correctamente', 'success')
    }
    
    closeModal()
  } catch (error) {
    showToast(`Error: ${error.message || 'Ha ocurrido un error al guardar'}`, 'error')
  }
}

const deleteArea = async () => {
  if (!areaToDelete.value) return
  
  try {
    await areaStore.deleteArea(areaToDelete.value.IDArea)
    showToast('Área eliminada correctamente', 'success')
    showDeleteModal.value = false
    areaToDelete.value = null
  } catch (error) {
    showToast(`Error: ${error.message || 'Ha ocurrido un error al eliminar'}`, 'error')
  }
}

const handleFilterChange = (newFilters) => {
  filters.value = { ...newFilters }
  currentView.value = newFilters.viewMode
}

const handleExportCompleted = (result) => {
  showToast(`Exportación completada: ${result.fileName}`, 'success')
  
  // Registrar en auditoría
  auditService.log({
    action: 'AREAS_EXPORTED',
    resource: { type: 'AREA_LIST' },
    details: `Exportación de ${result.itemCount} áreas en formato ${result.type.toUpperCase()}`
  })
}

const loadAreas = async () => {
  isLoading.value = true
  
  try {
    await areaStore.fetchAreas({ force: true })
  } catch (error) {
    showToast('Error al cargar las áreas', 'error')
  } finally {
    isLoading.value = false
  }
}

// Observar cambios en el viewMode para cambiar la vista
watch(() => filters.value.viewMode, (newViewMode) => {
  currentView.value = newViewMode
})

// Cargar áreas al montar el componente
onMounted(() => {
  loadAreas()
})
</script>

<style scoped>
.area-manager {
  padding: 20px;
  max-width: 100%;
}

.area-manager-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.title-section {
  display: flex;
  flex-direction: column;
}

.title-section h2 {
  margin: 0;
  font-size: 24px;
  color: #333;
}

.area-count {
  font-size: 14px;
  color: #666;
  margin-top: 4px;
}

.actions-section {
  display: flex;
  gap: 10px;
  align-items: center;
}

.loading-indicator {
  display: flex;
  align-items: center;
  color: #666;
  font-size: 14px;
}

.loading-indicator i {
  margin-right: 6px;
  color: #4285f4;
}

.reload-button {
  background: none;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 8px;
  cursor: pointer;
  color: #666;
}

.reload-button:hover {
  background-color: #f5f5f5;
}

.create-button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background-color: #4285f4;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
}

.create-button:hover {
  background-color: #3367d6;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: #666;
  text-align: center;
  background-color: #f9f9f9;
  border-radius: 8px;
  border: 1px dashed #ddd;
}

.empty-state i {
  font-size: 48px;
  color: #ccc;
  margin-bottom: 16px;
}

.reset-filters {
  margin-top: 16px;
  padding: 8px 16px;
  background-color: #f0f4f8;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.reset-filters:hover {
  background-color: #e5e9f0;
}

/* Estilos para la vista de tabla */
.area-list {
  margin-top: 20px;
  overflow-x: auto;
}

.area-table {
  width: 100%;
  border-collapse: collapse;
  background-color: white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border-radius: 4px;
}

.area-table thead {
  background-color: #f8f9fa;
}

.area-table th {
  padding: 12px 16px;
  text-align: left;
  font-weight: 600;
  color: #444;
  border-bottom: 2px solid #e0e0e0;
  cursor: pointer;
  user-select: none;
}

.area-table th i {
  margin-left: 6px;
  font-size: 14px;
}

.area-table td {
  padding: 12px 16px;
  border-bottom: 1px solid #e0e0e0;
  color: #333;
}

.area-table tbody tr:hover {
  background-color: #f5f8ff;
}

.status-badge {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  text-align: center;
}

.active {
  background-color: #e6f4ea;
  color: #137333;
}

.inactive {
  background-color: #fce8e6;
  color: #c5221f;
}

.actions {
  display: flex;
  gap: 8px;
}

.action-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.edit {
  background-color: #e8f0fe;
  color: #4285f4;
}

.edit:hover {
  background-color: #d2e3fc;
}

.delete {
  background-color: #fce8e6;
  color: #ea4335;
}

.delete:hover {
  background-color: #fad2cf;
}

.add-child {
  background-color: #e6f4ea;
  color: #34a853;
}

.add-child:hover {
  background-color: #ceead6;
}

/* Estilos para la vista de cuadrícula */
.area-grid-view {
  margin-top: 20px;
}

.area-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.area-card {
  background-color: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  transition: transform 0.2s, box-shadow 0.2s;
}

.area-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.area-card-header {
  display: flex;
  justify-content: space-between;
  padding: 12px 16px;
  background-color: #f8f9fa;
  border-bottom: 1px solid #e0e0e0;
}

.area-badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.area-card .status-badge {
  font-size: 11px;
  padding: 3px 6px;
}

.area-card-content {
  padding: 16px;
  flex: 1;
}

.area-name {
  margin: 0 0 8px 0;
  font-size: 16px;
  color: #333;
}

.area-code {
  margin: 0 0 12px 0;
  font-size: 13px;
  color: #666;
  font-family: monospace;
}

.area-description {
  margin: 0;
  font-size: 13px;
  color: #555;
  line-height: 1.4;
}

.area-card-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 12px 16px;
  background-color: #f8f9fa;
  border-top: 1px solid #e0e0e0;
}

/* Estilos para la vista de árbol */
.area-tree-view {
  margin-top: 20px;
  height: calc(100vh - 250px);
  min-height: 400px;
}

/* Estilos para el modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.confirmation-modal {
  background-color: white;
  border-radius: 8px;
  width: 90%;
  max-width: 500px;
  padding: 24px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.confirmation-modal h3 {
  margin-top: 0;
  color: #333;
}

.warning-message {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 16px 0;
  padding: 12px;
  background-color: #fff8e1;
  border-left: 4px solid #ffab00;
  color: #bf360c;
}

.warning {
  color: #ea4335;
  font-weight: 500;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
}

.cancel-button, .delete-button {
  padding: 8px 16px;
  border-radius: 4px;
  font-weight: 500;
  cursor: pointer;
}

.cancel-button {
  background-color: #f5f5f5;
  border: 1px solid #ddd;
  color: #333;
}

.cancel-button:hover {
  background-color: #e9ecef;
}

.delete-button {
  background-color: #ea4335;
  border: none;
  color: white;
}

.delete-button:hover {
  background-color: #d32f2f;
}

/* Estilos para los tipos de área */
.recepcion {
  background-color: #e8f0fe;
  color: #4285f4;
}

.especializada {
  background-color: #e6f4ea;
  color: #34a853;
}

.administrativa {
  background-color: #fef7e0;
  color: #fbbc04;
}

.operativa {
  background-color: #f0e8fc;
  color: #a142f4;
}

.legal {
  background-color: #e8eaed;
  color: #5f6368;
}

.mesa_partes {
  background-color: #f8d7da;
  color: #d73a49;
}

.otro {
  background-color: #e8eaed;
  color: #5f6368;
}

/* Estilos responsivos */
@media (max-width: 768px) {
  .area-manager-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }
  
  .actions-section {
    width: 100%;
    justify-content: space-between;
  }
  
  .area-grid {
    grid-template-columns: 1fr;
  }
}
</style> 