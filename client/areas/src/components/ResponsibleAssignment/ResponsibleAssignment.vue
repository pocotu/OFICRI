<template>
  <div class="responsible-assignment">
    <div class="assignment-header">
      <h2>Asignación de Responsables</h2>
      <div class="header-actions">
        <div class="area-selector">
          <label for="area">Seleccionar Área:</label>
          <select 
            id="area"
            v-model="selectedAreaId"
            @change="loadAreaResponsibles"
          >
            <option value="">Seleccione un área</option>
            <option 
              v-for="area in areas" 
              :key="area.IDArea" 
              :value="area.IDArea"
            >
              {{ area.NombreArea }}
            </option>
          </select>
        </div>
        
        <div class="action-buttons">
          <button 
            @click="refreshData" 
            class="refresh-button"
            title="Recargar datos"
          >
            <i class="fas fa-sync" :class="{ 'fa-spin': isLoading }"></i>
          </button>
          <button 
            @click="openExportModal" 
            class="export-button"
            :disabled="!selectedAreaId || currentResponsibles.length === 0"
            title="Exportar datos"
          >
            <i class="fas fa-file-export"></i> Exportar
          </button>
        </div>
      </div>
    </div>

    <div v-if="isLoading" class="loading-state">
      <i class="fas fa-circle-notch fa-spin"></i>
      <span>Cargando datos...</span>
    </div>

    <div v-else-if="selectedAreaId" class="assignment-content">
      <div class="current-responsibles">
        <h3>Responsables Actuales <span v-if="currentResponsibles.length">({{ currentResponsibles.length }})</span></h3>
        <div v-if="currentResponsibles.length === 0" class="empty-list">
          <i class="fas fa-users-slash"></i>
          <p>No hay responsables asignados a esta área</p>
          <button 
            v-if="hasAssignPermission"
            @click="focusSearchInput"
            class="add-first-button"
          >
            <i class="fas fa-user-plus"></i> Añadir Primer Responsable
          </button>
        </div>
        <div v-else class="responsible-list">
          <div 
            v-for="responsible in currentResponsibles" 
            :key="responsible.IDUsuario"
            class="responsible-item"
          >
            <div class="responsible-info">
              <div class="user-avatar">
                {{ getInitials(responsible.Nombres, responsible.Apellidos) }}
              </div>
              <div class="user-details">
                <span class="responsible-name">
                  {{ responsible.Nombres }} {{ responsible.Apellidos }}
                </span>
                <div class="user-metadata">
                  <span class="responsible-grade">
                    {{ responsible.Grado }}
                  </span>
                  <span class="responsible-cip">
                    CIP: {{ responsible.CodigoCIP }}
                  </span>
                </div>
              </div>
            </div>
            <button 
              v-if="hasRemovePermission"
              @click="removeResponsible(responsible)"
              class="remove-button"
              title="Remover responsable"
            >
              <i class="fas fa-times"></i>
            </button>
          </div>
        </div>
      </div>

      <div v-if="hasAssignPermission" class="add-responsible">
        <h3>Agregar Responsable</h3>
        <div class="search-box">
          <input 
            type="text"
            ref="searchInput"
            v-model="searchQuery"
            placeholder="Buscar por nombre o CIP..."
            @input="searchUsers"
          >
          <i class="fas fa-search"></i>
        </div>

        <div class="search-results" v-if="filteredUsers.length">
          <div 
            v-for="user in filteredUsers" 
            :key="user.IDUsuario"
            class="user-item"
            @click="addResponsible(user)"
          >
            <div class="user-info">
              <div class="user-avatar">
                {{ getInitials(user.Nombres, user.Apellidos) }}
              </div>
              <div class="user-details">
                <span class="user-name">
                  {{ user.Nombres }} {{ user.Apellidos }}
                </span>
                <div class="user-metadata">
                  <span class="user-grade">
                    {{ user.Grado }}
                  </span>
                  <span class="user-cip">
                    CIP: {{ user.CodigoCIP }}
                  </span>
                </div>
              </div>
            </div>
            <div class="add-icon-container">
              <i class="fas fa-plus add-icon"></i>
            </div>
          </div>
        </div>
        <div v-else-if="searchQuery" class="no-results">
          <i class="fas fa-search-minus"></i>
          <p>No se encontraron usuarios que coincidan con "{{ searchQuery }}"</p>
        </div>
        <div v-else-if="!searchQuery" class="search-hint">
          <i class="fas fa-info-circle"></i>
          <p>Ingrese al menos 3 caracteres para buscar usuarios</p>
        </div>
      </div>
    </div>

    <div v-else class="no-area-selected">
      <i class="fas fa-building"></i>
      <p>Seleccione un área para gestionar sus responsables</p>
    </div>

    <!-- Modal de Exportación -->
    <div v-if="showExportModal" class="modal-overlay" @click="closeExportModal">
      <div class="export-modal" @click.stop>
        <div class="modal-header">
          <h3>Exportar Responsables</h3>
          <button @click="closeExportModal" class="close-button">
            <i class="fas fa-times"></i>
          </button>
        </div>
        
        <div class="modal-content">
          <div class="form-group">
            <label>Formato de Exportación</label>
            <div class="format-options">
              <button 
                v-for="format in exportFormats" 
                :key="format.value"
                @click="exportOptions.format = format.value"
                class="format-button"
                :class="{ active: exportOptions.format === format.value }"
              >
                <i :class="format.icon"></i>
                <span>{{ format.label }}</span>
              </button>
            </div>
          </div>
          
          <div class="form-group">
            <label>Datos a Incluir</label>
            <div class="export-fields">
              <label class="checkbox-label">
                <input type="checkbox" v-model="exportOptions.includeNames">
                Nombres y Apellidos
              </label>
              <label class="checkbox-label">
                <input type="checkbox" v-model="exportOptions.includeCIP">
                Código CIP
              </label>
              <label class="checkbox-label">
                <input type="checkbox" v-model="exportOptions.includeGrado">
                Grado
              </label>
              <label class="checkbox-label">
                <input type="checkbox" v-model="exportOptions.includeArea">
                Área
              </label>
            </div>
          </div>
        </div>
        
        <div class="modal-footer">
          <button @click="closeExportModal" class="cancel-button">
            Cancelar
          </button>
          <button 
            @click="performExport" 
            class="export-button"
            :disabled="isExporting"
          >
            <i v-if="isExporting" class="fas fa-spinner fa-spin"></i>
            <i v-else class="fas fa-file-export"></i>
            {{ isExporting ? 'Exportando...' : 'Exportar' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Toast de notificaciones -->
    <div 
      v-if="toast.show" 
      class="toast"
      :class="toast.type"
    >
      <i :class="getToastIcon()"></i>
      <span>{{ toast.message }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { useAreaStore } from '@/store/areas'
import { useUserStore } from '@/store/users'
import { useAuthStore } from '@/store/auth'
import { useToast } from '@/shared/composables/useToast'
import { auditService } from '@/shared/services/security/auditTrail'

const areaStore = useAreaStore()
const userStore = useUserStore()
const authStore = useAuthStore()
const { showToast } = useToast()

// Estado
const selectedAreaId = ref('')
const searchQuery = ref('')
const currentResponsibles = ref([])
const allUsers = ref([])
const isLoading = ref(false)
const searchInput = ref(null)
const showExportModal = ref(false)
const isExporting = ref(false)
const toast = ref({
  show: false,
  message: '',
  type: 'info'
})

// Opciones de exportación
const exportOptions = ref({
  format: 'excel',
  includeNames: true,
  includeCIP: true,
  includeGrado: true,
  includeArea: true
})

const exportFormats = [
  { value: 'excel', label: 'Excel', icon: 'fas fa-file-excel' },
  { value: 'csv', label: 'CSV', icon: 'fas fa-file-csv' },
  { value: 'pdf', label: 'PDF', icon: 'fas fa-file-pdf' }
]

// Computed
const areas = computed(() => areaStore.areas || [])

const filteredUsers = computed(() => {
  if (!searchQuery.value || searchQuery.value.length < 3) return []
  
  const query = searchQuery.value.toLowerCase()
  return allUsers.value.filter(user => 
    !currentResponsibles.value.some(r => r.IDUsuario === user.IDUsuario) &&
    (user.Nombres.toLowerCase().includes(query) ||
     user.Apellidos.toLowerCase().includes(query) ||
     user.CodigoCIP.toLowerCase().includes(query))
  )
})

// Permisos
const hasAssignPermission = computed(() => authStore.hasPermission(2)) // Bit 1 - Editar
const hasRemovePermission = computed(() => authStore.hasPermission(4)) // Bit 2 - Eliminar
const hasExportPermission = computed(() => authStore.hasPermission(64)) // Bit 6 - Exportar

// Métodos
const showLocalToast = (message, type = 'info') => {
  toast.value = { show: true, message, type }
  setTimeout(() => {
    toast.value.show = false
  }, 3000)
}

const getToastIcon = () => {
  switch (toast.value.type) {
    case 'success': return 'fas fa-check-circle'
    case 'error': return 'fas fa-exclamation-circle'
    case 'warning': return 'fas fa-exclamation-triangle'
    default: return 'fas fa-info-circle'
  }
}

const getInitials = (nombre, apellido) => {
  if (!nombre || !apellido) return '?'
  return (nombre.charAt(0) + apellido.charAt(0)).toUpperCase()
}

const loadAreaResponsibles = async () => {
  if (!selectedAreaId.value) {
    currentResponsibles.value = []
    return
  }

  isLoading.value = true
  
  try {
    const responsibles = await areaStore.getAreaResponsibles(selectedAreaId.value)
    currentResponsibles.value = responsibles
  } catch (error) {
    console.error('Error al cargar responsables:', error)
    showLocalToast('Error al cargar los responsables del área', 'error')
  } finally {
    isLoading.value = false
  }
}

const searchUsers = async () => {
  if (!searchQuery.value || searchQuery.value.length < 3) {
    allUsers.value = []
    return
  }

  try {
    const users = await userStore.searchUsers(searchQuery.value)
    allUsers.value = users
  } catch (error) {
    console.error('Error al buscar usuarios:', error)
    showLocalToast('Error al buscar usuarios', 'error')
  }
}

const addResponsible = async (user) => {
  if (!hasAssignPermission.value) {
    showLocalToast('No tiene permisos para asignar responsables', 'warning')
    return
  }
  
  try {
    await areaStore.addAreaResponsible(selectedAreaId.value, user.IDUsuario)
    
    // Registrar auditoría
    await auditService.log({
      action: 'RESPONSIBLE_ASSIGNED',
      resource: { 
        id: selectedAreaId.value, 
        type: 'AREA',
        targetId: user.IDUsuario,
        targetType: 'USER'
      },
      details: `Se asignó a ${user.Nombres} ${user.Apellidos} como responsable del área`
    })
    
    showLocalToast(`${user.Nombres} ${user.Apellidos} ha sido asignado como responsable`, 'success')
    await loadAreaResponsibles()
    searchQuery.value = ''
    allUsers.value = []
  } catch (error) {
    console.error('Error al agregar responsable:', error)
    showLocalToast('Error al agregar el responsable al área', 'error')
  }
}

const removeResponsible = async (responsible) => {
  if (!hasRemovePermission.value) {
    showLocalToast('No tiene permisos para remover responsables', 'warning')
    return
  }
  
  if (!confirm(`¿Está seguro de remover a ${responsible.Nombres} ${responsible.Apellidos} como responsable?`)) {
    return
  }

  try {
    await areaStore.removeAreaResponsible(selectedAreaId.value, responsible.IDUsuario)
    
    // Registrar auditoría
    await auditService.log({
      action: 'RESPONSIBLE_REMOVED',
      resource: { 
        id: selectedAreaId.value, 
        type: 'AREA',
        targetId: responsible.IDUsuario,
        targetType: 'USER'
      },
      details: `Se removió a ${responsible.Nombres} ${responsible.Apellidos} como responsable del área`
    })
    
    showLocalToast(`${responsible.Nombres} ${responsible.Apellidos} ya no es responsable`, 'success')
    await loadAreaResponsibles()
  } catch (error) {
    console.error('Error al remover responsable:', error)
    showLocalToast('Error al remover el responsable del área', 'error')
  }
}

const refreshData = async () => {
  if (isLoading.value) return
  
  isLoading.value = true
  try {
    await areaStore.fetchAreas({ force: true })
    if (selectedAreaId.value) {
      await loadAreaResponsibles()
    }
    showLocalToast('Datos actualizados correctamente', 'success')
  } catch (error) {
    console.error('Error al actualizar datos:', error)
    showLocalToast('Error al actualizar los datos', 'error')
  } finally {
    isLoading.value = false
  }
}

const focusSearchInput = () => {
  nextTick(() => {
    if (searchInput.value) {
      searchInput.value.focus()
    }
  })
}

const openExportModal = () => {
  if (!hasExportPermission.value) {
    showLocalToast('No tiene permisos para exportar datos', 'warning')
    return
  }
  
  if (!selectedAreaId.value || currentResponsibles.length === 0) {
    showLocalToast('No hay datos para exportar', 'warning')
    return
  }
  
  showExportModal.value = true
}

const closeExportModal = () => {
  showExportModal.value = false
}

const performExport = async () => {
  if (isExporting.value) return
  
  isExporting.value = true
  try {
    // Preparar datos para exportación
    const selectedArea = areas.value.find(a => a.IDArea === selectedAreaId.value)
    const exportData = currentResponsibles.value.map(user => {
      const data = {}
      
      if (exportOptions.value.includeNames) {
        data.Nombres = user.Nombres
        data.Apellidos = user.Apellidos
      }
      
      if (exportOptions.value.includeCIP) {
        data.CodigoCIP = user.CodigoCIP
      }
      
      if (exportOptions.value.includeGrado) {
        data.Grado = user.Grado
      }
      
      if (exportOptions.value.includeArea && selectedArea) {
        data.Area = selectedArea.NombreArea
      }
      
      return data
    })
    
    // Registrar auditoría
    await auditService.log({
      action: 'RESPONSIBLES_EXPORTED',
      resource: { 
        id: selectedAreaId.value, 
        type: 'AREA'
      },
      details: `Se exportaron datos de ${currentResponsibles.value.length} responsables del área en formato ${exportOptions.value.format}`
    })
    
    // Aquí se implementaría la exportación real de los datos
    // Por ahora simulamos la exportación
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    showLocalToast(`Datos exportados correctamente en formato ${exportOptions.value.format.toUpperCase()}`, 'success')
    closeExportModal()
  } catch (error) {
    console.error('Error al exportar datos:', error)
    showLocalToast('Error al exportar los datos', 'error')
  } finally {
    isExporting.value = false
  }
}

// Cargar datos iniciales
onMounted(async () => {
  isLoading.value = true
  try {
    await areaStore.fetchAreas()
  } catch (error) {
    console.error('Error al cargar áreas:', error)
    showLocalToast('Error al cargar las áreas', 'error')
  } finally {
    isLoading.value = false
  }
})
</script>

<style scoped>
.responsible-assignment {
  padding: 1rem;
  position: relative;
}

.assignment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: a2rem;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.area-selector {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.area-selector select {
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  min-width: 250px;
}

.action-buttons {
  display: flex;
  gap: 0.5rem;
}

.refresh-button,
.export-button {
  padding: 0.5rem 1rem;
  background-color: #1a237e;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.refresh-button:hover,
.export-button:hover {
  background-color: #303f9f;
}

.refresh-button:disabled,
.export-button:disabled {
  background-color: #9e9e9e;
  cursor: not-allowed;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  gap: 1rem;
  color: #666;
}

.loading-state i {
  font-size: 2rem;
}

.assignment-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  margin-top: 1rem;
}

.current-responsibles,
.add-responsible {
  background-color: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.current-responsibles h3,
.add-responsible h3 {
  margin-top: 0;
  margin-bottom: 1rem;
  color: #1a237e;
  font-size: 1.2rem;
}

.responsible-list,
.search-results {
  margin-top: 1rem;
  max-height: 400px;
  overflow-y: auto;
}

.responsible-item,
.user-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  border: 1px solid #eee;
  border-radius: 4px;
  margin-bottom: 0.5rem;
  transition: background-color 0.2s;
}

.user-item {
  cursor: pointer;
}

.user-item:hover {
  background-color: #f5f5f5;
}

.responsible-info,
.user-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: #1a237e;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
}

.user-details {
  display: flex;
  flex-direction: column;
}

.responsible-name,
.user-name {
  font-weight: bold;
}

.user-metadata {
  display: flex;
  gap: 1rem;
  font-size: 0.9rem;
  color: #666;
}

.remove-button {
  background-color: transparent;
  border: none;
  color: #f44336;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 50%;
}

.remove-button:hover {
  background-color: rgba(244, 67, 54, 0.1);
}

.add-icon-container {
  color: #4caf50;
}

.search-box {
  position: relative;
  margin-bottom: 1rem;
}

.search-box input {
  width: 100%;
  padding: 0.75rem;
  padding-left: 2.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.search-box i {
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: #666;
}

.empty-list,
.no-results,
.search-hint,
.no-area-selected {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  gap: 1rem;
  color: #666;
  text-align: center;
}

.empty-list i,
.no-results i,
.search-hint i,
.no-area-selected i {
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

.add-first-button {
  padding: 0.5rem 1rem;
  background-color: #4caf50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 1rem;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.export-modal {
  background-color: white;
  border-radius: 8px;
  width: 100%;
  max-width: 500px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background-color: #1a237e;
  color: white;
}

.modal-header h3 {
  margin: 0;
}

.close-button {
  background-color: transparent;
  border: none;
  color: white;
  font-size: 1.2rem;
  cursor: pointer;
}

.modal-content {
  padding: 1.5rem;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  padding: 1rem;
  background-color: #f5f5f5;
  gap: 1rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: bold;
}

.format-options {
  display: flex;
  gap: 1rem;
}

.format-button {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  background-color: white;
  cursor: pointer;
  transition: all 0.2s;
}

.format-button.active {
  border-color: #1a237e;
  background-color: rgba(26, 35, 126, 0.1);
}

.format-button i {
  font-size: 1.5rem;
  margin-bottom: 0.5rem;
}

.export-fields {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.cancel-button,
.export-button {
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.cancel-button {
  background-color: transparent;
  border: 1px solid #ddd;
}

.export-button {
  background-color: #1a237e;
  color: white;
  border: none;
}

.export-button:disabled {
  background-color: #9e9e9e;
  cursor: not-allowed;
}

.toast {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  padding: 1rem;
  border-radius: 4px;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  z-index: 1100;
  animation: slide-in 0.3s ease-out;
}

.toast.success {
  background-color: #4caf50;
}

.toast.error {
  background-color: #f44336;
}

.toast.warning {
  background-color: #ff9800;
}

.toast.info {
  background-color: #2196f3;
}

@keyframes slide-in {
  from {
    transform: translateY(100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

/* Responsividad */
@media (max-width: 768px) {
  .assignment-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
  
  .header-actions {
    width: 100%;
    justify-content: space-between;
  }
  
  .assignment-content {
    grid-template-columns: 1fr;
  }
  
  .format-options {
    flex-wrap: wrap;
  }
  
  .format-button {
    flex: 1;
    min-width: 100px;
  }
}
</style> 