<template>
  <div class="area-hierarchy">
    <div class="hierarchy-header">
      <h2>Jerarquía de Áreas</h2>
      <div class="hierarchy-actions">
        <button 
          @click="showExportModal = true"
          class="export-button"
          title="Exportar jerarquía"
          :disabled="!hasExportPermission"
        >
          <i class="fas fa-file-export"></i> Exportar
        </button>
        <button 
          v-if="hasPermissionToEdit"
          @click="showEditModal = true"
          class="edit-button"
          title="Editar jerarquía"
        >
          <i class="fas fa-edit"></i> Editar Jerarquía
        </button>
      </div>
    </div>

    <div class="hierarchy-filters">
      <div class="search-box">
        <input 
          type="text" 
          v-model="searchQuery" 
          placeholder="Buscar área..." 
          class="search-input"
        />
        <i class="fas fa-search"></i>
      </div>
      
      <div class="filter-controls">
        <div class="filter-group">
          <label>Tipo de Área:</label>
          <select v-model="filters.type">
            <option value="">Todos los tipos</option>
            <option value="RECEPCION">Recepción</option>
            <option value="ADMINISTRATIVA">Administrativa</option>
            <option value="OPERATIVA">Operativa</option>
            <option value="LEGAL">Legal</option>
            <option value="ESPECIALIZADA">Especializada</option>
            <option value="MESA_PARTES">Mesa de Partes</option>
          </select>
        </div>
        
        <div class="filter-group">
          <label>Estado:</label>
          <select v-model="filters.status">
            <option value="">Todos</option>
            <option value="active">Activos</option>
            <option value="inactive">Inactivos</option>
          </select>
        </div>
      </div>
      
      <div class="view-controls">
        <button 
          @click="expandAll" 
          class="view-button"
          title="Expandir todo"
        >
          <i class="fas fa-expand-alt"></i>
        </button>
        <button 
          @click="collapseAll" 
          class="view-button"
          title="Colapsar todo"
        >
          <i class="fas fa-compress-alt"></i>
        </button>
      </div>
    </div>

    <div class="hierarchy-content">
      <div v-if="isLoading" class="loading-overlay">
        <div class="spinner">
          <i class="fas fa-circle-notch fa-spin"></i>
              </div>
        <p>Cargando jerarquía...</p>
            </div>
      
      <div v-else-if="filteredRootAreas.length === 0" class="empty-state">
        <i class="fas fa-sitemap"></i>
        <p v-if="searchQuery || filters.type || filters.status">
          No se encontraron áreas con los filtros aplicados
        </p>
        <p v-else>
          No hay áreas definidas en el sistema
        </p>
        <button 
          v-if="hasPermissionToCreate && !searchQuery && !filters.type && !filters.status"
          @click="createArea"
          class="create-button"
        >
          <i class="fas fa-plus"></i> Crear Primera Área
        </button>
          </div>

      <div v-else class="hierarchy-tree">
        <ul class="tree">
          <li 
            v-for="area in filteredRootAreas" 
            :key="area.IDArea"
            class="tree-node"
          >
            <div 
              class="node-content"
              :class="{ 'highlighted': isAreaHighlighted(area) }"
            >
              <div class="node-toggle" @click="toggleNode(area.IDArea)">
                <i 
                  v-if="hasChildren(area.IDArea)"
                  :class="[
                    expandedNodes.has(area.IDArea) 
                      ? 'fas fa-caret-down' 
                      : 'fas fa-caret-right'
                  ]"
                ></i>
                <i v-else class="node-spacer"></i>
              </div>
              
              <div 
                class="node-details"
                :draggable="hasPermissionToEdit"
                @dragstart="handleDragStart($event, area)"
                @dragover.prevent
                @dragend="handleDragEnd"
                @drop="handleDrop($event, area)"
              >
                <div class="node-icon">
                  <i :class="getAreaIcon(area)"></i>
                </div>
                
                <div class="node-info">
                  <div class="node-name">{{ area.NombreArea }}</div>
                  <div class="node-meta">
                    <span class="area-code">{{ area.CodigoIdentificacion }}</span>
                    <span :class="['status-badge', area.IsActive ? 'active' : 'inactive']">
                      {{ area.IsActive ? 'Activo' : 'Inactivo' }}
                    </span>
                  </div>
                </div>
                
                <div class="node-actions">
                  <button 
                    v-if="hasPermissionToCreate"
                    @click="createChildArea(area)"
                    class="action-button add"
                    title="Agregar sub-área"
                  >
                    <i class="fas fa-plus"></i>
                  </button>
                  <button 
                    v-if="hasPermissionToEdit"
                    @click="editArea(area)"
                    class="action-button edit"
                    title="Editar área"
                  >
                    <i class="fas fa-edit"></i>
                  </button>
                  <button 
                    v-if="hasPermissionToDelete"
                    @click="confirmDeleteArea(area)"
                    class="action-button delete"
                    title="Eliminar área"
                  >
                    <i class="fas fa-trash"></i>
                  </button>
              </div>
            </div>
          </div>
            
            <ul v-if="expandedNodes.has(area.IDArea)" class="tree-children">
              <li 
                v-for="child in getFilteredChildren(area.IDArea)" 
                :key="child.IDArea"
                class="tree-node"
              >
                <div 
                  class="node-content"
                  :class="{ 'highlighted': isAreaHighlighted(child) }"
                >
                  <div class="node-toggle" @click="toggleNode(child.IDArea)">
                    <i 
                      v-if="hasChildren(child.IDArea)"
                      :class="[
                        expandedNodes.has(child.IDArea) 
                          ? 'fas fa-caret-down' 
                          : 'fas fa-caret-right'
                      ]"
                    ></i>
                    <i v-else class="node-spacer"></i>
        </div>
                  
                  <div 
                    class="node-details"
                    :draggable="hasPermissionToEdit"
                    @dragstart="handleDragStart($event, child)"
                    @dragover.prevent
                    @dragend="handleDragEnd"
                    @drop="handleDrop($event, child)"
                  >
                    <div class="node-icon">
                      <i :class="getAreaIcon(child)"></i>
                    </div>
                    
                    <div class="node-info">
                      <div class="node-name">{{ child.NombreArea }}</div>
                      <div class="node-meta">
                        <span class="area-code">{{ child.CodigoIdentificacion }}</span>
                        <span :class="['status-badge', child.IsActive ? 'active' : 'inactive']">
                          {{ child.IsActive ? 'Activo' : 'Inactivo' }}
                        </span>
                      </div>
                    </div>
                    
                    <div class="node-actions">
                      <button 
                        v-if="hasPermissionToCreate"
                        @click="createChildArea(child)"
                        class="action-button add"
                        title="Agregar sub-área"
                      >
                        <i class="fas fa-plus"></i>
                      </button>
                      <button 
                        v-if="hasPermissionToEdit"
                        @click="editArea(child)"
                        class="action-button edit"
                        title="Editar área"
                      >
                        <i class="fas fa-edit"></i>
                      </button>
                      <button 
                        v-if="hasPermissionToDelete"
                        @click="confirmDeleteArea(child)"
                        class="action-button delete"
                        title="Eliminar área"
                      >
                        <i class="fas fa-trash"></i>
                      </button>
                    </div>
                  </div>
                </div>
                
                <!-- Renderizar recursivamente sub-áreas -->
                <area-tree-recursive
                  v-if="expandedNodes.has(child.IDArea)"
                  :areas="areas"
                  :parent-id="child.IDArea"
                  :expanded-nodes="expandedNodes"
                  :is-draggable="hasPermissionToEdit"
                  :filters="filters"
                  :search-query="searchQuery"
                  @toggle-node="toggleNode"
                  @create-child="createChildArea"
                  @edit-area="editArea"
                  @delete-area="confirmDeleteArea"
                  @drag-start="handleDragStart"
                  @drag-end="handleDragEnd"
                  @drop="handleDrop"
                />
              </li>
            </ul>
          </li>
        </ul>
      </div>
    </div>

    <!-- Modal de Edición de Jerarquía -->
    <div v-if="showEditModal" class="modal">
      <div class="modal-content">
        <div class="modal-header">
        <h3>Editar Jerarquía de Áreas</h3>
          <button @click="closeEditModal" class="close-button">
            <i class="fas fa-times"></i>
          </button>
        </div>
        
        <div class="modal-body">
          <p class="modal-description">
            Arrastre y suelte las áreas para reordenarlas. Puede cambiar la jerarquía arrastrando un área sobre otra para convertirla en su área padre.
          </p>
        
        <div class="hierarchy-editor">
            <div class="editor-search">
              <input 
                type="text" 
                v-model="editorSearch" 
                placeholder="Buscar área..." 
                class="search-input"
              />
              <i class="fas fa-search"></i>
            </div>
            
            <div class="draggable-areas">
              <div 
                v-for="area in filteredAreasForEditor" 
              :key="area.IDArea"
              class="draggable-area"
              draggable="true"
                @dragstart="handleEditorDragStart($event, area)"
              @dragover.prevent
                @drop="handleEditorDrop($event, area)"
                :class="{
                  'drag-over': dragOverArea === area.IDArea,
                  'being-dragged': draggedArea?.IDArea === area.IDArea
                }"
            >
              <div class="area-content">
                <i :class="getAreaIcon(area)" class="area-icon"></i>
                <div class="area-details">
                  <span class="area-name">{{ area.NombreArea }}</span>
                  <span v-if="area.CodigoIdentificacion" class="area-code">
                    {{ area.CodigoIdentificacion }}
                  </span>
                </div>
              </div>
              <div class="area-parent" v-if="area.IDAreaPadre">
                <span class="parent-label">Padre:</span>
                <span class="parent-name">
                  {{ getParentName(area.IDAreaPadre) }}
                </span>
              </div>
            </div>
          </div>
        </div>

          <div v-if="hierarchyChanges.size > 0" class="changes-summary">
            <h4>Cambios Pendientes ({{ hierarchyChanges.size }})</h4>
            <ul class="changes-list">
              <li v-for="(targetId, sourceId) in Object.fromEntries(hierarchyChanges)" :key="sourceId">
                <i class="fas fa-arrow-right"></i>
                <span class="change-source">{{ getAreaName(Number(sourceId)) }}</span> 
                ahora bajo 
                <span class="change-target">{{ getAreaName(targetId) || 'Raíz' }}</span>
              </li>
            </ul>
          </div>
        </div>

        <div class="modal-footer">
          <button @click="closeEditModal" class="cancel-button">
            Cancelar
          </button>
          <button 
            @click="saveHierarchy" 
            class="save-button"
            :disabled="hierarchyChanges.size === 0 || isSaving"
          >
            <i v-if="isSaving" class="fas fa-spinner fa-spin"></i>
            <span v-else>Guardar Cambios</span>
          </button>
        </div>
      </div>
    </div>
    
    <!-- Modal de Exportación -->
    <div v-if="showExportModal" class="modal">
      <div class="modal-content">
        <div class="modal-header">
          <h3>Exportar Jerarquía de Áreas</h3>
          <button @click="closeExportModal" class="close-button">
            <i class="fas fa-times"></i>
          </button>
        </div>
        
        <div class="modal-body">
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
            <label>Opciones de Exportación</label>
            <div class="export-options">
              <label class="checkbox-label">
                <input type="checkbox" v-model="exportOptions.includeInactive">
                Incluir áreas inactivas
              </label>
              <label class="checkbox-label">
                <input type="checkbox" v-model="exportOptions.includeInfo">
                Incluir información detallada
              </label>
              <label class="checkbox-label">
                <input type="checkbox" v-model="exportOptions.applyFilters">
                Aplicar filtros actuales
              </label>
            </div>
          </div>
          
          <div class="form-group">
            <label>Vista Previa</label>
            <div class="export-preview">
              <div class="preview-hierarchy">
                <div class="preview-loading" v-if="isGeneratingPreview">
                  <i class="fas fa-spinner fa-spin"></i>
                  <span>Generando vista previa...</span>
                </div>
                <div v-else class="preview-content">
                  <div class="preview-tree">
                    <ul>
                      <li v-for="area in previewData" :key="area.id">
                        <div class="preview-node">
                          <span class="preview-name">{{ area.name }}</span>
                        </div>
                        <ul v-if="area.children && area.children.length">
                          <li v-for="child in area.children" :key="child.id">
                            <div class="preview-node">
                              <span class="preview-name">{{ child.name }}</span>
                            </div>
                            <!-- Solo mostramos dos niveles en la vista previa -->
                          </li>
                        </ul>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="modal-footer">
          <button @click="closeExportModal" class="cancel-button">
            Cancelar
          </button>
          <button 
            @click="exportHierarchy" 
            class="export-button"
            :disabled="isExporting"
          >
            <i v-if="isExporting" class="fas fa-spinner fa-spin"></i>
            <span v-else>Exportar</span>
          </button>
        </div>
      </div>
    </div>
    
    <!-- Modal de Confirmación de Eliminación -->
    <div v-if="showDeleteModal" class="modal">
      <div class="modal-content">
        <div class="modal-header">
          <h3>Confirmar Eliminación</h3>
          <button @click="closeDeleteModal" class="close-button">
            <i class="fas fa-times"></i>
          </button>
        </div>
        
        <div class="modal-body">
          <div class="confirm-delete">
            <i class="fas fa-exclamation-triangle"></i>
            <p class="confirm-message">
              ¿Está seguro que desea eliminar el área <strong>{{ areaToDelete?.NombreArea }}</strong>?
            </p>
            
            <div v-if="hasChildAreas" class="warning-message">
              <i class="fas fa-exclamation-circle"></i>
              <p>Esta área tiene {{ childAreaCount }} sub-área(s) que también serán eliminadas.</p>
            </div>
            
            <p class="delete-warning">Esta acción no se puede deshacer.</p>
          </div>
        </div>
        
        <div class="modal-footer">
          <button @click="closeDeleteModal" class="cancel-button">
            Cancelar
          </button>
          <button 
            @click="deleteArea" 
            class="delete-button"
            :disabled="isDeletingArea"
          >
            <i v-if="isDeletingArea" class="fas fa-spinner fa-spin"></i>
            <span v-else>Eliminar</span>
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
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import { useAreaStore } from '@/store/areas'
import { useAuthStore } from '@/store/auth'
import { auditService } from '@/shared/services/security/auditTrail'
import AreaTreeRecursive from './AreaTreeRecursive.vue'

// Stores
const areaStore = useAreaStore()
const authStore = useAuthStore()

// Estado
const isLoading = ref(false)
const searchQuery = ref('')
const filters = ref({
  type: '',
  status: ''
})
const expandedNodes = ref(new Set())
const showEditModal = ref(false)
const showExportModal = ref(false)
const showDeleteModal = ref(false)
const draggedArea = ref(null)
const dragOverArea = ref(null)
const hierarchyChanges = ref(new Map())
const editorSearch = ref('')
const areaToDelete = ref(null)
const isDeletingArea = ref(false)
const isSaving = ref(false)
const isExporting = ref(false)
const isGeneratingPreview = ref(false)

// Opciones de exportación
const exportOptions = ref({
  format: 'pdf',
  includeInactive: true,
  includeInfo: true,
  applyFilters: false
})

const exportFormats = [
  { value: 'pdf', label: 'PDF', icon: 'fas fa-file-pdf' },
  { value: 'excel', label: 'Excel', icon: 'fas fa-file-excel' },
  { value: 'image', label: 'Imagen', icon: 'fas fa-file-image' }
]

// Toast
const toast = ref({
  show: false,
  message: '',
  type: 'info'
})

// Vista previa de exportación (simplificada para el ejemplo)
const previewData = ref([])

// Permisos
const hasPermissionToCreate = computed(() => authStore.hasPermission(1)) // Bit 0
const hasPermissionToEdit = computed(() => authStore.hasPermission(2))   // Bit 1
const hasPermissionToDelete = computed(() => authStore.hasPermission(4)) // Bit 2
const hasExportPermission = computed(() => authStore.hasPermission(64))  // Bit 6 - Exportar

// Computed
const areas = computed(() => areaStore.areas || [])

const filteredAreas = computed(() => {
  let result = [...areas.value]
  
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(area => 
      area.NombreArea.toLowerCase().includes(query) ||
      (area.CodigoIdentificacion && area.CodigoIdentificacion.toLowerCase().includes(query)) ||
      (area.Descripcion && area.Descripcion.toLowerCase().includes(query))
    )
  }
  
  if (filters.value.type) {
    result = result.filter(area => area.TipoArea === filters.value.type)
  }
  
  if (filters.value.status === 'active') {
    result = result.filter(area => area.IsActive)
  } else if (filters.value.status === 'inactive') {
    result = result.filter(area => !area.IsActive)
  }
  
  return result
})

const filteredRootAreas = computed(() => {
  return filteredAreas.value.filter(area => !area.IDAreaPadre)
})

const filteredAreasForEditor = computed(() => {
  if (!editorSearch.value) return areas.value
  
  const query = editorSearch.value.toLowerCase()
  return areas.value.filter(area => 
    area.NombreArea.toLowerCase().includes(query) ||
    (area.CodigoIdentificacion && area.CodigoIdentificacion.toLowerCase().includes(query))
  )
})

const hasChildAreas = computed(() => {
  if (!areaToDelete.value) return false
  return getChildrenCount(areaToDelete.value.IDArea) > 0
})

const childAreaCount = computed(() => {
  if (!areaToDelete.value) return 0
  return getChildrenCount(areaToDelete.value.IDArea)
})

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

const getAreaIcon = (area) => {
  switch (area.TipoArea) {
    case 'RECEPCION':
      return 'fas fa-inbox'
    case 'ESPECIALIZADA':
      return 'fas fa-flask'
    case 'ADMINISTRATIVA':
      return 'fas fa-building'
    case 'OPERATIVA':
      return 'fas fa-cogs'
    case 'LEGAL':
      return 'fas fa-gavel'
    case 'MESA_PARTES':
      return 'fas fa-archive'
    default:
      return 'fas fa-folder'
  }
}

const getParentName = (parentId) => {
  const parent = areas.value.find(a => a.IDArea === parentId)
  return parent ? parent.NombreArea : 'Desconocido'
}

const getAreaName = (areaId) => {
  if (!areaId) return 'Raíz'
  const area = areas.value.find(a => a.IDArea === areaId)
  return area ? area.NombreArea : 'Desconocido'
}

const hasChildren = (areaId) => {
  return areas.value.some(area => area.IDAreaPadre === areaId)
}

const getFilteredChildren = (parentId) => {
  return filteredAreas.value.filter(area => area.IDAreaPadre === parentId)
}

const getChildrenCount = (areaId) => {
  // Contamos recursivamente todas las sub-áreas
  let count = 0
  
  const countChildren = (id) => {
    const children = areas.value.filter(a => a.IDAreaPadre === id)
    count += children.length
    
    children.forEach(child => {
      countChildren(child.IDArea)
    })
  }
  
  countChildren(areaId)
  return count
}

const isAreaHighlighted = (area) => {
  if (!searchQuery.value) return false
  
  const query = searchQuery.value.toLowerCase()
  return (
    area.NombreArea.toLowerCase().includes(query) ||
    (area.CodigoIdentificacion && area.CodigoIdentificacion.toLowerCase().includes(query)) ||
    (area.Descripcion && area.Descripcion.toLowerCase().includes(query))
  )
}

const toggleNode = (areaId) => {
  if (expandedNodes.value.has(areaId)) {
    expandedNodes.value.delete(areaId)
  } else {
    expandedNodes.value.add(areaId)
  }
}

const expandAll = () => {
  areas.value.forEach(area => {
    expandedNodes.value.add(area.IDArea)
  })
}

const collapseAll = () => {
  expandedNodes.value.clear()
}

// Manejo de arrastrar y soltar en el árbol
const handleDragStart = (event, area) => {
  if (!hasPermissionToEdit.value) return
  
  draggedArea.value = area
  event.dataTransfer.effectAllowed = 'move'
  
  // Agregar clase para estilo durante arrastre
  event.target.classList.add('dragging')
}

const handleDragEnd = (event) => {
  // Eliminar clase de estilo
  event.target.classList.remove('dragging')
  draggedArea.value = null
}

const handleDrop = (event, targetArea) => {
  event.preventDefault()
  
  if (!draggedArea.value || !hasPermissionToEdit.value) return
  
  // Evitar soltar un área sobre sí misma
  if (draggedArea.value.IDArea === targetArea.IDArea) return
  
    // Evitar ciclos en la jerarquía
    if (wouldCreateCycle(draggedArea.value.IDArea, targetArea.IDArea)) {
    showLocalToast('No se puede crear un ciclo en la jerarquía', 'error')
      return
    }

  // Verificar si es un cambio real
  if (draggedArea.value.IDAreaPadre === targetArea.IDArea) return
  
  // Actualizar la jerarquía
  updateAreaParent(draggedArea.value.IDArea, targetArea.IDArea)
}

const wouldCreateCycle = (sourceId, targetId) => {
  let current = targetId
  
  // Verificamos si el área objetivo es descendiente del área a mover
  while (current) {
    if (current === sourceId) return true
    
    const area = areas.value.find(a => a.IDArea === current)
    current = area ? area.IDAreaPadre : null
  }
  
  return false
}

const updateAreaParent = async (areaId, newParentId) => {
  try {
    isLoading.value = true
    
    // Actualizar en el backend
    await areaStore.updateAreaParent(areaId, newParentId)
    
    // Registrar en auditoría
    await auditService.log({
      action: 'AREA_HIERARCHY_UPDATED',
      resource: { id: areaId, type: 'AREA' },
      details: `Se movió el área al nuevo padre: ${getAreaName(newParentId)}`
    })
    
    // Actualizar localmente
    const areaIndex = areas.value.findIndex(a => a.IDArea === areaId)
    if (areaIndex !== -1) {
      areas.value[areaIndex].IDAreaPadre = newParentId
    }
    
    // Expandir el nodo padre para mostrar el área recién movida
    if (newParentId) {
      expandedNodes.value.add(newParentId)
    }
    
    showLocalToast('Jerarquía actualizada correctamente', 'success')
  } catch (error) {
    console.error('Error al actualizar jerarquía:', error)
    showLocalToast('Error al actualizar la jerarquía', 'error')
  } finally {
    isLoading.value = false
  }
}

// Modal de edición de jerarquía
const handleEditorDragStart = (event, area) => {
  draggedArea.value = area
  event.dataTransfer.effectAllowed = 'move'
}

const handleEditorDragOver = (event, area) => {
  event.preventDefault()
  dragOverArea.value = area.IDArea
}

const handleEditorDrop = (event, targetArea) => {
  event.preventDefault()
  dragOverArea.value = null
  
  if (!draggedArea.value) return
  
  // Evitar soltar un área sobre sí misma
  if (draggedArea.value.IDArea === targetArea.IDArea) return
  
  // Evitar ciclos en la jerarquía
  if (wouldCreateCycle(draggedArea.value.IDArea, targetArea.IDArea)) {
    showLocalToast('No se puede crear un ciclo en la jerarquía', 'error')
    return
  }
  
  // Registrar el cambio para guardarlo después
  hierarchyChanges.value.set(draggedArea.value.IDArea, targetArea.IDArea)
}

const closeEditModal = () => {
  showEditModal.value = false
  hierarchyChanges.value.clear()
  editorSearch.value = ''
}

const saveHierarchy = async () => {
  if (hierarchyChanges.value.size === 0) return
  
  isSaving.value = true
  
  try {
    // Guardar todos los cambios
    for (const [areaId, newParentId] of hierarchyChanges.value.entries()) {
      await areaStore.updateAreaParent(parseInt(areaId), newParentId)
    }
    
    // Registrar en auditoría
    await auditService.log({
      action: 'AREA_HIERARCHY_BULK_UPDATE',
      resource: { type: 'AREA' },
      details: `Se actualizó la jerarquía de ${hierarchyChanges.value.size} áreas`
    })
    
    // Recargar áreas
    await areaStore.fetchAreas({ force: true })
    
    showLocalToast('Jerarquía actualizada correctamente', 'success')
    closeEditModal()
  } catch (error) {
    console.error('Error al guardar jerarquía:', error)
    showLocalToast('Error al guardar la jerarquía', 'error')
  } finally {
    isSaving.value = false
  }
}

// Gestión de áreas
const createArea = () => {
  // Redirigir a la creación de áreas o abrir modal
  // Esta función sería implementada según la arquitectura de la aplicación
  showLocalToast('Redirección a creación de áreas', 'info')
}

const createChildArea = (parentArea) => {
  // Redirigir a la creación de áreas con el padre preseleccionado
  // Esta función sería implementada según la arquitectura de la aplicación
  showLocalToast(`Creando sub-área para ${parentArea.NombreArea}`, 'info')
}

const editArea = (area) => {
  // Redirigir a la edición del área
  // Esta función sería implementada según la arquitectura de la aplicación
  showLocalToast(`Editando área ${area.NombreArea}`, 'info')
}

const confirmDeleteArea = (area) => {
  areaToDelete.value = area
  showDeleteModal.value = true
}

const closeDeleteModal = () => {
  showDeleteModal.value = false
  areaToDelete.value = null
}

const deleteArea = async () => {
  if (!areaToDelete.value) return
  
  isDeletingArea.value = true
  
  try {
    await areaStore.deleteArea(areaToDelete.value.IDArea)
    
    // Registrar en auditoría
    await auditService.log({
      action: 'AREA_DELETED',
      resource: { 
        id: areaToDelete.value.IDArea, 
        type: 'AREA' 
      },
      details: `Se eliminó el área "${areaToDelete.value.NombreArea}" y sus ${childAreaCount.value} sub-áreas`
    })
    
    showLocalToast(`Área ${areaToDelete.value.NombreArea} eliminada correctamente`, 'success')
    closeDeleteModal()
    
    // Recargar áreas
    await areaStore.fetchAreas({ force: true })
  } catch (error) {
    console.error('Error al eliminar área:', error)
    showLocalToast('Error al eliminar el área', 'error')
  } finally {
    isDeletingArea.value = false
  }
}

// Exportación
const closeExportModal = () => {
  showExportModal.value = false
  isGeneratingPreview.value = false
}

const generatePreview = async () => {
  isGeneratingPreview.value = true
  
  try {
    // Simplemente generamos una estructura de vista previa básica
    // En una implementación real, esto utilizaría la lógica de exportación real
    
    // Filtrar áreas si es necesario
    let areasToPreview = areas.value
    
    if (exportOptions.value.applyFilters) {
      areasToPreview = filteredAreas.value
    } else if (!exportOptions.value.includeInactive) {
      areasToPreview = areasToPreview.filter(a => a.IsActive)
    }
    
    // Crear datos para la vista previa (solo 2 niveles)
    const rootsForPreview = areasToPreview.filter(a => !a.IDAreaPadre)
    
    previewData.value = rootsForPreview.map(root => {
      const children = areasToPreview.filter(a => a.IDAreaPadre === root.IDArea)
      
      return {
        id: root.IDArea,
        name: root.NombreArea,
        children: children.map(child => ({
          id: child.IDArea,
          name: child.NombreArea
        }))
      }
    })
    
    // Limitamos a 3 raíces para la vista previa
    previewData.value = previewData.value.slice(0, 3)
  } catch (error) {
    console.error('Error al generar vista previa:', error)
  } finally {
    isGeneratingPreview.value = false
  }
}

const exportHierarchy = async () => {
  if (!hasExportPermission.value) {
    showLocalToast('No tiene permisos para exportar', 'warning')
    return
  }
  
  isExporting.value = true
  
  try {
    // Aquí implementaríamos la lógica real de exportación
    // Por ahora, simulamos un tiempo de procesamiento
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    // Registrar en auditoría
    await auditService.log({
      action: 'HIERARCHY_EXPORTED',
      resource: { type: 'AREA' },
      details: `Se exportó la jerarquía de áreas en formato ${exportOptions.value.format}`
    })
    
    showLocalToast(`Jerarquía exportada correctamente en formato ${exportOptions.value.format.toUpperCase()}`, 'success')
    closeExportModal()
  } catch (error) {
    console.error('Error al exportar jerarquía:', error)
    showLocalToast('Error al exportar la jerarquía', 'error')
  } finally {
    isExporting.value = false
  }
}

// Hooks
onMounted(async () => {
  isLoading.value = true
  
  try {
    await areaStore.fetchAreas()
    
    // Expandir nodos raíz por defecto
    nextTick(() => {
      areas.value
        .filter(area => !area.IDAreaPadre)
        .forEach(area => expandedNodes.value.add(area.IDArea))
    })
    
    // Generar vista previa para exportación
    generatePreview()
  } catch (error) {
    console.error('Error al cargar áreas:', error)
    showLocalToast('Error al cargar las áreas', 'error')
  } finally {
    isLoading.value = false
  }
})

// Observadores
// Regenerar vista previa cuando cambian las opciones de exportación
watch(exportOptions, () => {
  if (showExportModal.value) {
    generatePreview()
  }
})
</script>

<style scoped>
.area-hierarchy {
  padding: 1rem;
  position: relative;
}

.hierarchy-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.hierarchy-header h2 {
  margin: 0;
  color: #1a237e;
}

.hierarchy-actions {
  display: flex;
  gap: 0.5rem;
}

.edit-button,
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
  transition: background-color 0.2s;
}

.edit-button:hover,
.export-button:hover {
  background-color: #303f9f;
}

.edit-button:disabled,
.export-button:disabled {
  background-color: #9e9e9e;
  cursor: not-allowed;
}

.hierarchy-filters {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
  background-color: white;
  padding: 1rem;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.search-box {
  position: relative;
  flex: 1;
}

.search-input {
  width: 100%;
  padding: 0.5rem 0.75rem;
  padding-left: 2rem;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.search-box i {
  position: absolute;
  left: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  color: #666;
}

.filter-controls {
  display: flex;
  gap: 1rem;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.filter-group label {
  font-size: 0.8rem;
  color: #666;
}

.filter-group select {
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  min-width: 150px;
}

.view-controls {
  display: flex;
  gap: 0.25rem;
}

.view-button {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f5f5f5;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
}

.view-button:hover {
  background-color: #e0e0e0;
}

.hierarchy-content {
  background-color: white;
  padding: 1rem;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  min-height: 400px;
  position: relative;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.8);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 10;
}

.spinner {
  font-size: 2rem;
  color: #1a237e;
  margin-bottom: 1rem;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  color: #666;
  text-align: center;
}

.empty-state i {
  font-size: 3rem;
  margin-bottom: 1rem;
  color: #1a237e;
}

.create-button {
  margin-top: 1rem;
  padding: 0.5rem 1rem;
  background-color: #4caf50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.hierarchy-tree {
  overflow-x: auto;
}

.tree {
  padding: 0;
  margin: 0;
  list-style: none;
}

.tree-node {
  position: relative;
}

.node-content {
  display: flex;
  align-items: center;
  margin: 0.5rem 0;
}

.node-content.highlighted {
  background-color: rgba(33, 150, 243, 0.1);
  border-radius: 4px;
}

.node-toggle {
  width: 20px;
  text-align: center;
  cursor: pointer;
  color: #666;
}

.node-spacer {
  display: inline-block;
  width: 14px;
}

.node-details {
  display: flex;
  align-items: center;
  flex: 1;
  padding: 0.5rem;
  border: 1px solid #eee;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.node-details:hover {
  background-color: #f5f5f5;
}

.node-details.dragging {
  opacity: 0.5;
  border-style: dashed;
}

.node-icon {
  margin-right: 0.5rem;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f5f5f5;
  border-radius: 50%;
  color: #1a237e;
}

.node-info {
  flex: 1;
}

.node-name {
  font-weight: bold;
}

.node-meta {
  display: flex;
  gap: 1rem;
  font-size: 0.8rem;
  color: #666;
}

.area-code {
  color: #1a237e;
  font-weight: 500;
}

.status-badge {
  padding: 0.1rem 0.5rem;
  border-radius: 10px;
  font-size: 0.7rem;
  font-weight: bold;
}

.status-badge.active {
  background-color: #e8f5e9;
  color: #2e7d32;
}

.status-badge.inactive {
  background-color: #ffebee;
  color: #c62828;
}

.node-actions {
  display: flex;
  gap: 0.25rem;
  opacity: 0;
  transition: opacity 0.2s;
}

.node-details:hover .node-actions {
  opacity: 1;
}

.action-button {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background-color 0.2s;
}

.action-button.add {
  background-color: #e8f5e9;
  color: #2e7d32;
}

.action-button.edit {
  background-color: #e3f2fd;
  color: #1565c0;
}

.action-button.delete {
  background-color: #ffebee;
  color: #c62828;
}

.action-button:hover {
  filter: brightness(0.9);
}

.tree-children {
  padding-left: 1.5rem;
  list-style: none;
}

.tree-node:before {
  content: '';
  position: absolute;
  top: 0;
  left: -1rem;
  width: 1px;
  height: 100%;
  background-color: #ddd;
}

/* Modal Styles */
.modal {
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

.modal-content {
  background-color: white;
  border-radius: 8px;
  width: 600px;
  max-width: 90%;
  max-height: 90vh;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
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

.modal-body {
  padding: 1.5rem;
  overflow-y: auto;
  flex: 1;
}

.modal-description {
  margin-bottom: 1.5rem;
  color: #666;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  padding: 1rem;
  background-color: #f5f5f5;
  gap: 1rem;
}

.cancel-button, 
.save-button,
.delete-button,
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

.save-button {
  background-color: #1a237e;
  color: white;
  border: none;
}

.delete-button {
  background-color: #f44336;
  color: white;
  border: none;
}

.save-button:disabled,
.delete-button:disabled {
  background-color: #9e9e9e;
  cursor: not-allowed;
}

/* Editor styles */
.hierarchy-editor {
  margin-bottom: 1.5rem;
}

.editor-search {
  position: relative;
  margin-bottom: 1rem;
}

.editor-search input {
  width: 100%;
  padding: 0.5rem 0.75rem;
  padding-left: 2rem;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.editor-search i {
  position: absolute;
  left: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  color: #666;
}

.draggable-areas {
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid #eee;
  border-radius: 4px;
  padding: 0.5rem;
}

.draggable-area {
  padding: 0.5rem;
  border: 1px solid #eee;
  border-radius: 4px;
  margin-bottom: 0.5rem;
  cursor: move;
  transition: all 0.2s;
}

.draggable-area:hover {
  background-color: #f5f5f5;
}

.draggable-area.drag-over {
  background-color: #e3f2fd;
  border-color: #2196f3;
}

.draggable-area.being-dragged {
  opacity: 0.5;
  border-style: dashed;
}

.area-content {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.area-icon {
  color: #1a237e;
}

.area-name {
  font-weight: bold;
}

.area-parent {
  margin-top: 0.25rem;
  font-size: 0.8rem;
  color: #666;
}

.parent-label {
  color: #1a237e;
  font-weight: 500;
}

.changes-summary {
  margin-top: 1.5rem;
  padding: 1rem;
  background-color: #e8eaf6;
  border-radius: 4px;
}

.changes-summary h4 {
  margin-top: 0;
  margin-bottom: 0.5rem;
  color: #1a237e;
}

.changes-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.changes-list li {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.25rem;
}

.changes-list i {
  color: #1a237e;
}

.change-source, .change-target {
  font-weight: 500;
}

/* Export styles */
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
  flex: 1;
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

.export-options {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.export-preview {
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 1rem;
  height: 200px;
  overflow: auto;
  background-color: #f9f9f9;
}

.preview-loading {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #666;
}

.preview-tree {
  font-size: 0.9rem;
}

.preview-tree ul {
  list-style: none;
  padding-left: 1.5rem;
}

.preview-node {
  padding: 0.25rem 0;
}

.preview-name {
  font-weight: 500;
}

/* Confirm delete styles */
.confirm-delete {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.confirm-delete i {
  font-size: 3rem;
  color: #f44336;
  margin-bottom: 1rem;
}

.confirm-message {
  font-size: 1.1rem;
  margin-bottom: 1rem;
}

.warning-message {
  padding: 1rem;
  background-color: #fff8e1;
  border-radius: 4px;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.warning-message i {
  font-size: 1.2rem;
  color: #ff9800;
  margin-bottom: 0;
}

.delete-warning {
  color: #f44336;
  font-weight: 500;
}

/* Toast */
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
  max-width: 300px;
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
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

/* Responsividad */
@media (max-width: 768px) {
  .hierarchy-filters {
    flex-direction: column;
  }
  
  .filter-controls {
    flex-direction: column;
  }
  
  .format-options {
    flex-wrap: wrap;
  }
  
  .export-options {
    grid-template-columns: 1fr;
  }
}
</style> 