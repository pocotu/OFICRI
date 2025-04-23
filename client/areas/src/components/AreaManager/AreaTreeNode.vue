<template>
  <li class="area-tree-node" :class="{ 'has-children': hasChildren }">
    <div 
      class="node-content" 
      :class="{ 
        'selected': isSelected, 
        'highlighted': isHighlighted,
        'dragging': isDragging,
        'drop-target': isDropTarget 
      }"
      draggable="true"
      @dragstart="onDragStart"
      @dragover="onDragOver"
      @drop="onDrop"
      @dragend="onDragEnd"
    >
      <div 
        v-if="hasChildren" 
        class="toggle-icon" 
        @click.stop="toggleExpand"
      >
        <i :class="isExpanded ? 'fas fa-caret-down' : 'fas fa-caret-right'"></i>
      </div>
      <div v-else class="toggle-icon-placeholder"></div>
      
      <div class="node-icon">
        <i :class="getNodeIcon(area.TipoArea)"></i>
      </div>
      
      <div 
        class="node-label" 
        @click="onSelect" 
        :title="area.NombreArea"
      >
        {{ area.NombreArea }}
        <span v-if="area.CodigoIdentificacion" class="node-code">
          ({{ area.CodigoIdentificacion }})
        </span>
      </div>
      
      <div class="node-status">
        <span 
          v-if="!area.IsActive" 
          class="status-indicator inactive" 
          title="Inactivo"
        >
          <i class="fas fa-times-circle"></i>
        </span>
      </div>
    </div>
    
    <transition name="slide">
      <ul v-if="isExpanded && hasChildren" class="children-container">
        <area-tree-node
          v-for="child in childAreas"
          :key="child.IDArea"
          :area="child"
          :all-areas="allAreas"
          :expanded-nodes="expandedNodes"
          :search-term="searchTerm"
          :selected-area="selectedArea"
          @toggle-node="$emit('toggle-node', $event)"
          @select-node="$emit('select-node', $event)"
          @drag-start="$emit('drag-start', $event)"
          @drag-over="$emit('drag-over', $event)"
          @drop="$emit('drop', $event)"
        />
      </ul>
    </transition>
  </li>
</template>

<script setup>
import { computed, ref } from 'vue'

const props = defineProps({
  area: {
    type: Object,
    required: true
  },
  allAreas: {
    type: Array,
    required: true
  },
  expandedNodes: {
    type: Object, // Set
    required: true
  },
  searchTerm: {
    type: String,
    default: ''
  },
  selectedArea: {
    type: Object,
    default: null
  }
})

const emit = defineEmits([
  'toggle-node', 
  'select-node', 
  'drag-start', 
  'drag-over', 
  'drop'
])

// Estado local
const isDragging = ref(false)
const isDropTarget = ref(false)

// Computed props
const childAreas = computed(() => {
  return props.allAreas.filter(a => a.IDAreaPadre === props.area.IDArea)
})

const hasChildren = computed(() => {
  return childAreas.value.length > 0
})

const isExpanded = computed(() => {
  return props.expandedNodes.has(props.area.IDArea)
})

const isSelected = computed(() => {
  return props.selectedArea && props.selectedArea.IDArea === props.area.IDArea
})

const isHighlighted = computed(() => {
  if (!props.searchTerm) return false
  
  const searchTerms = props.searchTerm.toLowerCase().split(' ')
  const areaName = props.area.NombreArea.toLowerCase()
  const areaCode = (props.area.CodigoIdentificacion || '').toLowerCase()
  
  return searchTerms.some(term => 
    areaName.includes(term) || areaCode.includes(term)
  )
})

// Métodos
const toggleExpand = () => {
  emit('toggle-node', props.area.IDArea)
}

const onSelect = () => {
  emit('select-node', props.area)
}

const getNodeIcon = (type) => {
  switch (type) {
    case 'RECEPCION':
      return 'fas fa-inbox'
    case 'ESPECIALIZADA':
      return 'fas fa-briefcase'
    case 'ADMINISTRATIVA':
      return 'fas fa-building'
    case 'OPERATIVA':
      return 'fas fa-users'
    case 'LEGAL':
      return 'fas fa-balance-scale'
    case 'MESA_PARTES':
      return 'fas fa-folder-open'
    default:
      return 'fas fa-sitemap'
  }
}

// Manejo de Drag & Drop
const onDragStart = (event) => {
  isDragging.value = true
  emit('drag-start', props.area)
  
  // Set datos para drag & drop
  event.dataTransfer.effectAllowed = 'move'
  event.dataTransfer.setData('text/plain', props.area.IDArea.toString())
  
  // Agregar clase para estilo de arrastre
  if (event.target.classList) {
    event.target.classList.add('dragging')
  }
}

const onDragOver = (event) => {
  // Prevenir comportamiento por defecto para permitir drop
  event.preventDefault()
  isDropTarget.value = true
  
  emit('drag-over', props.area, event)
}

const onDrop = (event) => {
  event.preventDefault()
  isDropTarget.value = false
  
  emit('drop', props.area)
}

const onDragEnd = () => {
  isDragging.value = false
  isDropTarget.value = false
}
</script>

<style scoped>
.area-tree-node {
  list-style: none;
  margin: 0;
  padding: 0;
}

.node-content {
  display: flex;
  align-items: center;
  padding: 6px 8px;
  margin: 2px 0;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
  user-select: none;
}

.node-content:hover {
  background-color: #f0f4f8;
}

.node-content.selected {
  background-color: #e0eafc;
  border-left: 3px solid #4285f4;
}

.node-content.highlighted {
  background-color: #fdf6e3;
  font-weight: 500;
}

.node-content.dragging {
  opacity: 0.5;
  background-color: #f0f4f8;
}

.node-content.drop-target {
  background-color: #e8f0fe;
  box-shadow: 0 0 0 2px #4285f4;
}

.toggle-icon, .toggle-icon-placeholder {
  width: 20px;
  height: 20px;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-right: 4px;
  cursor: pointer;
}

.toggle-icon i {
  transition: transform 0.2s;
  font-size: 12px;
  color: #5f6368;
}

.node-icon {
  width: 24px;
  height: 24px;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-right: 8px;
  color: #5f6368;
}

.node-label {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 14px;
  color: #3c4043;
}

.node-code {
  font-size: 12px;
  color: #5f6368;
  margin-left: 6px;
}

.node-status {
  margin-left: 8px;
}

.status-indicator {
  font-size: 12px;
}

.status-indicator.inactive {
  color: #ea4335;
}

.children-container {
  list-style: none;
  padding-left: 32px;
  margin: 0;
}

/* Transición de expansión */
.slide-enter-active, .slide-leave-active {
  transition: all 0.3s;
  max-height: 1000px;
  overflow: hidden;
}

.slide-enter-from, .slide-leave-to {
  max-height: 0;
  opacity: 0;
}
</style> 