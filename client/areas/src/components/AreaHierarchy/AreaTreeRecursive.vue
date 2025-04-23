<template>
  <ul class="tree-children">
    <li 
      v-for="area in filteredAreas" 
      :key="area.IDArea"
      class="tree-node"
    >
      <div 
        class="node-content"
        :class="{ 'highlighted': isAreaHighlighted(area) }"
      >
        <div class="node-toggle" @click="$emit('toggle-node', area.IDArea)">
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
          :draggable="isDraggable"
          @dragstart="handleDragStart($event, area)"
          @dragover.prevent
          @dragend="$emit('drag-end', $event)"
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
              @click="$emit('create-child', area)"
              class="action-button add"
              title="Agregar sub-área"
            >
              <i class="fas fa-plus"></i>
            </button>
            <button 
              @click="$emit('edit-area', area)"
              class="action-button edit"
              title="Editar área"
            >
              <i class="fas fa-edit"></i>
            </button>
            <button 
              @click="$emit('delete-area', area)"
              class="action-button delete"
              title="Eliminar área"
            >
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
      </div>
      
      <!-- Renderizar recursivamente -->
      <area-tree-recursive
        v-if="expandedNodes.has(area.IDArea)"
        :areas="areas"
        :parent-id="area.IDArea"
        :expanded-nodes="expandedNodes"
        :is-draggable="isDraggable"
        :filters="filters"
        :search-query="searchQuery"
        @toggle-node="$emit('toggle-node', $event)"
        @create-child="$emit('create-child', $event)"
        @edit-area="$emit('edit-area', $event)"
        @delete-area="$emit('delete-area', $event)"
        @drag-start="$emit('drag-start', $event[0], $event[1])"
        @drag-end="$emit('drag-end', $event)"
        @drop="$emit('drop', $event[0], $event[1])"
      />
    </li>
  </ul>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  areas: {
    type: Array,
    required: true
  },
  parentId: {
    type: Number,
    required: true
  },
  expandedNodes: {
    type: Set,
    required: true
  },
  isDraggable: {
    type: Boolean,
    default: false
  },
  filters: {
    type: Object,
    default: () => ({})
  },
  searchQuery: {
    type: String,
    default: ''
  }
})

const emit = defineEmits([
  'toggle-node',
  'create-child',
  'edit-area',
  'delete-area',
  'drag-start',
  'drag-end',
  'drop'
])

// Computed
const filteredAreas = computed(() => {
  let result = props.areas.filter(area => area.IDAreaPadre === props.parentId)
  
  if (props.searchQuery) {
    const query = props.searchQuery.toLowerCase()
    result = result.filter(area => 
      area.NombreArea.toLowerCase().includes(query) ||
      (area.CodigoIdentificacion && area.CodigoIdentificacion.toLowerCase().includes(query)) ||
      (area.Descripcion && area.Descripcion.toLowerCase().includes(query))
    )
  }
  
  if (props.filters.type) {
    result = result.filter(area => area.TipoArea === props.filters.type)
  }
  
  if (props.filters.status === 'active') {
    result = result.filter(area => area.IsActive)
  } else if (props.filters.status === 'inactive') {
    result = result.filter(area => !area.IsActive)
  }
  
  return result
})

// Métodos
const hasChildren = (areaId) => {
  return props.areas.some(area => area.IDAreaPadre === areaId)
}

const isAreaHighlighted = (area) => {
  if (!props.searchQuery) return false
  
  const query = props.searchQuery.toLowerCase()
  return (
    area.NombreArea.toLowerCase().includes(query) ||
    (area.CodigoIdentificacion && area.CodigoIdentificacion.toLowerCase().includes(query)) ||
    (area.Descripcion && area.Descripcion.toLowerCase().includes(query))
  )
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

const handleDragStart = (event, area) => {
  if (!props.isDraggable) return
  emit('drag-start', event, area)
}

const handleDrop = (event, area) => {
  emit('drop', event, area)
}
</script>

<style scoped>
.tree-children {
  padding-left: 1.5rem;
  list-style: none;
}

.tree-node {
  position: relative;
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
</style> 