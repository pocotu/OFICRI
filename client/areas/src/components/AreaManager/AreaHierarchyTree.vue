<template>
  <div class="area-hierarchy-tree">
    <div class="tree-header">
      <h3>Estructura Jerárquica de Áreas</h3>
      <div class="tree-controls">
        <button class="collapse-all" @click="collapseAll">
          <i class="fas fa-compress-alt"></i> Colapsar Todo
        </button>
        <button class="expand-all" @click="expandAll">
          <i class="fas fa-expand-alt"></i> Expandir Todo
        </button>
      </div>
    </div>
    
    <div class="search-container">
      <input 
        type="text" 
        v-model="searchTree" 
        placeholder="Buscar área en el árbol..." 
        class="tree-search"
      />
      <i class="fas fa-search search-icon"></i>
    </div>

    <div class="tree-container" ref="treeContainer">
      <div v-if="loading" class="tree-loading">
        <i class="fas fa-spinner fa-spin"></i> Cargando estructura...
      </div>
      <div v-else-if="error" class="tree-error">
        <i class="fas fa-exclamation-triangle"></i> 
        {{ error }}
        <button @click="loadHierarchy" class="retry-button">
          <i class="fas fa-redo"></i> Reintentar
        </button>
      </div>
      <div v-else-if="!hasAreas" class="tree-empty">
        <i class="fas fa-sitemap"></i>
        <p>No hay áreas disponibles para mostrar en la estructura.</p>
        <button 
          v-if="hasPermissionToCreate" 
          @click="$emit('create-area')" 
          class="create-button"
        >
          <i class="fas fa-plus"></i> Crear Primera Área
        </button>
      </div>
      <ul v-else class="tree-root">
        <area-tree-node
          v-for="area in rootAreas"
          :key="area.IDArea"
          :area="area"
          :all-areas="areas"
          :expanded-nodes="expandedNodes"
          :search-term="searchTree"
          :selected-area="selectedArea"
          @toggle-node="toggleNode"
          @select-node="selectNode"
          @drag-start="handleDragStart"
          @drag-over="handleDragOver"
          @drop="handleDrop"
        />
      </ul>
    </div>

    <div v-if="selectedArea" class="area-details">
      <h4>Área Seleccionada</h4>
      <div class="details-content">
        <p><strong>Código:</strong> {{ selectedArea.CodigoIdentificacion }}</p>
        <p><strong>Nombre:</strong> {{ selectedArea.NombreArea }}</p>
        <p><strong>Tipo:</strong> {{ getAreaTypeLabel(selectedArea.TipoArea) }}</p>
        <p><strong>Estado:</strong> 
          <span :class="['status-badge', selectedArea.IsActive ? 'active' : 'inactive']">
            {{ selectedArea.IsActive ? 'Activo' : 'Inactivo' }}
          </span>
        </p>
        <p v-if="selectedArea.Descripcion"><strong>Descripción:</strong> {{ selectedArea.Descripcion }}</p>
      </div>
      <div class="details-actions">
        <button 
          v-if="hasPermissionToEdit"
          @click="$emit('edit-area', selectedArea)"
          class="action-button edit"
        >
          <i class="fas fa-edit"></i> Editar
        </button>
        <button 
          v-if="hasPermissionToCreate"
          @click="$emit('create-child', selectedArea)"
          class="action-button add-child"
        >
          <i class="fas fa-plus"></i> Añadir Sub-área
        </button>
        <button 
          v-if="hasPermissionToDelete"
          @click="$emit('delete-area', selectedArea)"
          class="action-button delete"
        >
          <i class="fas fa-trash"></i> Eliminar
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useAreaStore } from '@/store/areas'
import { useAuthStore } from '@/store/auth'
import AreaTreeNode from './AreaTreeNode.vue'
import { auditService } from '@/shared/services/security/auditTrail'

const props = defineProps({
  initialSelectedAreaId: {
    type: Number,
    default: null
  }
})

const emit = defineEmits([
  'create-area', 
  'edit-area', 
  'delete-area', 
  'create-child',
  'area-structure-changed',
  'area-selected'
])

// Stores
const areaStore = useAreaStore()
const authStore = useAuthStore()

// Estado
const loading = ref(false)
const error = ref(null)
const searchTree = ref('')
const selectedArea = ref(null)
const expandedNodes = ref(new Set())
const isDragging = ref(false)
const draggedArea = ref(null)
const dropTarget = ref(null)

// Permisos
const hasPermissionToCreate = computed(() => authStore.hasPermission(1)) // Bit 0
const hasPermissionToEdit = computed(() => authStore.hasPermission(2))   // Bit 1
const hasPermissionToDelete = computed(() => authStore.hasPermission(4)) // Bit 2

// Computed
const areas = computed(() => areaStore.areas || [])
const hasAreas = computed(() => areas.value.length > 0)

const rootAreas = computed(() => {
  return areas.value.filter(area => !area.IDAreaPadre)
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

const loadHierarchy = async () => {
  loading.value = true
  error.value = null
  
  try {
    await areaStore.fetchAreas()
    
    // Si hay un área seleccionada inicialmente, encontrarla y expandir sus nodos padres
    if (props.initialSelectedAreaId) {
      selectAreaById(props.initialSelectedAreaId)
    }
  } catch (err) {
    console.error('Error cargando jerarquía de áreas:', err)
    error.value = 'No se pudo cargar la estructura de áreas. Por favor, intente nuevamente.'
  } finally {
    loading.value = false
  }
}

const selectAreaById = (areaId) => {
  const area = areas.value.find(a => a.IDArea === areaId)
  if (area) {
    selectNode(area)
    expandParents(area)
  }
}

const expandParents = (area) => {
  let currentArea = area
  while (currentArea && currentArea.IDAreaPadre) {
    const parentArea = areas.value.find(a => a.IDArea === currentArea.IDAreaPadre)
    if (parentArea) {
      expandedNodes.value.add(parentArea.IDArea)
      currentArea = parentArea
    } else {
      break
    }
  }
}

const toggleNode = (areaId) => {
  if (expandedNodes.value.has(areaId)) {
    expandedNodes.value.delete(areaId)
  } else {
    expandedNodes.value.add(areaId)
  }
}

const selectNode = (area) => {
  selectedArea.value = area
  emit('area-selected', area)
}

const expandAll = () => {
  areas.value.forEach(area => {
    expandedNodes.value.add(area.IDArea)
  })
}

const collapseAll = () => {
  expandedNodes.value.clear()
}

// Manejo de drag & drop para reorganizar la estructura
const handleDragStart = (area) => {
  if (!hasPermissionToEdit.value) return
  
  draggedArea.value = area
  isDragging.value = true
}

const handleDragOver = (area, event) => {
  if (!isDragging.value || !hasPermissionToEdit.value) return
  
  // Prevenir ciclos (un área no puede ser su propio hijo o descendiente)
  if (isDescendantOf(area, draggedArea.value.IDArea)) {
    event.dataTransfer.dropEffect = 'none'
    return
  }
  
  // No permitir soltar en sí mismo
  if (area.IDArea === draggedArea.value.IDArea) {
    event.dataTransfer.dropEffect = 'none'
    return
  }
  
  dropTarget.value = area
  event.dataTransfer.dropEffect = 'move'
  event.preventDefault()
}

const handleDrop = async (targetArea) => {
  if (!isDragging.value || !hasPermissionToEdit.value) return
  
  const sourceArea = draggedArea.value
  
  // Evitar ciclos y operaciones inválidas
  if (isDescendantOf(targetArea, sourceArea.IDArea) || targetArea.IDArea === sourceArea.IDArea) {
    return
  }
  
  try {
    // Actualizar el área padre
    const updatedArea = { ...sourceArea, IDAreaPadre: targetArea.IDArea }
    await areaStore.updateArea(updatedArea)
    
    // Registrar en auditoría
    await auditService.log({
      action: 'AREA_HIERARCHY_CHANGED',
      resource: { id: sourceArea.IDArea, type: 'AREA' },
      details: `Área "${sourceArea.NombreArea}" movida bajo "${targetArea.NombreArea}"`
    })
    
    // Expandir el nodo destino
    expandedNodes.value.add(targetArea.IDArea)
    
    // Notificar cambio en la estructura
    emit('area-structure-changed', { sourceArea, targetArea })
  } catch (error) {
    console.error('Error al actualizar jerarquía:', error)
    areaStore.setError('No se pudo actualizar la jerarquía de áreas')
  } finally {
    isDragging.value = false
    draggedArea.value = null
    dropTarget.value = null
  }
}

// Verifica si un área es descendiente de otra
const isDescendantOf = (area, potentialAncestorId) => {
  let current = area
  while (current && current.IDAreaPadre) {
    if (current.IDAreaPadre === potentialAncestorId) {
      return true
    }
    current = areas.value.find(a => a.IDArea === current.IDAreaPadre)
  }
  return false
}

// Búsqueda en el árbol
watch(searchTree, (newValue) => {
  if (newValue) {
    // Expandir todos los nodos cuando se realiza una búsqueda
    expandAll()
  }
})

onMounted(() => {
  loadHierarchy()
})
</script>

<style scoped>
.area-hierarchy-tree {
  display: flex;
  flex-direction: column;
  height: 100%;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  background-color: #f8f9fa;
}

.tree-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background-color: #f0f4f8;
  border-bottom: 1px solid #e0e0e0;
}

.tree-header h3 {
  margin: 0;
  font-size: 16px;
  color: #2c3e50;
}

.tree-controls {
  display: flex;
  gap: 8px;
}

.tree-controls button {
  background-color: #eef2f7;
  border: 1px solid #d0d7de;
  border-radius: 4px;
  padding: 4px 8px;
  font-size: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  color: #444;
}

.tree-controls button:hover {
  background-color: #e5e9f0;
}

.search-container {
  padding: 8px 16px;
  border-bottom: 1px solid #e0e0e0;
  position: relative;
}

.tree-search {
  width: 100%;
  padding: 8px 12px 8px 32px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 14px;
}

.search-icon {
  position: absolute;
  left: 24px;
  top: 16px;
  color: #666;
}

.tree-container {
  flex: 1;
  overflow: auto;
  padding: 16px;
}

.tree-loading, .tree-error, .tree-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: #666;
  text-align: center;
  gap: 12px;
}

.tree-error i, .tree-empty i {
  font-size: 36px;
  color: #999;
}

.retry-button, .create-button {
  margin-top: 8px;
  padding: 6px 12px;
  background-color: #4285f4;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
}

.retry-button:hover, .create-button:hover {
  background-color: #3367d6;
}

.tree-root {
  list-style: none;
  padding: 0;
  margin: 0;
}

.area-details {
  padding: 16px;
  background-color: #f0f4f8;
  border-top: 1px solid #e0e0e0;
}

.area-details h4 {
  margin: 0 0 12px 0;
  color: #2c3e50;
  font-size: 16px;
}

.details-content {
  margin-bottom: 12px;
}

.details-content p {
  margin: 4px 0;
  font-size: 14px;
}

.status-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.active {
  background-color: #e6f4ea;
  color: #137333;
}

.inactive {
  background-color: #fce8e6;
  color: #c5221f;
}

.details-actions {
  display: flex;
  gap: 8px;
}

.action-button {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  font-size: 13px;
  cursor: pointer;
  white-space: nowrap;
}

.edit {
  background-color: #4285f4;
  color: white;
}

.edit:hover {
  background-color: #3367d6;
}

.add-child {
  background-color: #34a853;
  color: white;
}

.add-child:hover {
  background-color: #2e8b57;
}

.delete {
  background-color: #ea4335;
  color: white;
}

.delete:hover {
  background-color: #d32f2f;
}
</style> 