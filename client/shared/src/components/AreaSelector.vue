<template>
  <div class="area-selector">
    <div class="area-tree">
      <div v-for="area in rootAreas" :key="area.IDArea" class="area-node">
        <div class="area-item" :class="{ 'is-selected': isSelected(area.IDArea) }">
          <div class="area-content" @click="toggleArea(area)">
            <i :class="getAreaIcon(area)" class="area-icon"></i>
            <span class="area-name">{{ area.NombreArea }}</span>
            <span v-if="area.CodigoIdentificacion" class="area-code">
              ({{ area.CodigoIdentificacion }})
            </span>
          </div>
          <div v-if="area.children && area.children.length" class="area-children">
            <div v-for="child in area.children" :key="child.IDArea" class="area-node">
              <div class="area-item" :class="{ 'is-selected': isSelected(child.IDArea) }">
                <div class="area-content" @click="toggleArea(child)">
                  <i :class="getAreaIcon(child)" class="area-icon"></i>
                  <span class="area-name">{{ child.NombreArea }}</span>
                  <span v-if="child.CodigoIdentificacion" class="area-code">
                    ({{ child.CodigoIdentificacion }})
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="selectedArea" class="selected-area">
      <h4>Área Seleccionada:</h4>
      <p>{{ getSelectedAreaName }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAreaStore } from '@/store/areas'

const props = defineProps({
  modelValue: {
    type: [Number, String],
    default: null
  },
  excludeArea: {
    type: [Number, String],
    default: null
  }
})

const emit = defineEmits(['update:modelValue', 'area-selected'])

const areaStore = useAreaStore()
const rootAreas = ref([])
const selectedArea = ref(null)

const isSelected = (areaId) => {
  return props.modelValue === areaId
}

const getAreaIcon = (area) => {
  switch (area.TipoArea) {
    case 'RECEPCION':
      return 'fas fa-inbox'
    case 'ESPECIALIZADA':
      return 'fas fa-flask'
    default:
      return 'fas fa-folder'
  }
}

const getSelectedAreaName = computed(() => {
  if (!selectedArea.value) return ''
  return selectedArea.value.NombreArea
})

const toggleArea = (area) => {
  if (props.excludeArea && area.IDArea === props.excludeArea) {
    return
  }
  selectedArea.value = area
  emit('update:modelValue', area.IDArea)
  emit('area-selected', area)
}

const buildAreaTree = (areas) => {
  const areaMap = new Map()
  const roots = []

  // Primero, mapear todas las áreas
  areas.forEach(area => {
    areaMap.set(area.IDArea, { ...area, children: [] })
  })

  // Luego, construir el árbol
  areas.forEach(area => {
    const node = areaMap.get(area.IDArea)
    if (area.IDAreaPadre) {
      const parent = areaMap.get(area.IDAreaPadre)
      if (parent) {
        parent.children.push(node)
      }
    } else {
      roots.push(node)
    }
  })

  return roots
}

onMounted(async () => {
  try {
    await areaStore.fetchAreas()
    rootAreas.value = buildAreaTree(areaStore.areas)
    
    if (props.modelValue) {
      const area = areaStore.areas.find(a => a.IDArea === props.modelValue)
      if (area) {
        selectedArea.value = area
      }
    }
  } catch (error) {
    console.error('Error al cargar áreas:', error)
  }
})
</script>

<style scoped>
.area-selector {
  width: 100%;
  max-height: 400px;
  overflow-y: auto;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 1rem;
}

.area-tree {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.area-node {
  display: flex;
  flex-direction: column;
}

.area-item {
  padding: 0.5rem;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.area-item:hover {
  background-color: #f5f5f5;
}

.area-item.is-selected {
  background-color: #e3f2fd;
  border-left: 3px solid #1a237e;
}

.area-content {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.area-icon {
  color: #666;
  width: 20px;
  text-align: center;
}

.area-name {
  font-weight: 500;
}

.area-code {
  color: #666;
  font-size: 0.875rem;
}

.area-children {
  margin-left: 1.5rem;
  padding-left: 1rem;
  border-left: 1px dashed #ddd;
}

.selected-area {
  margin-top: 1rem;
  padding: 1rem;
  background-color: #f8f9fa;
  border-radius: 4px;
}

.selected-area h4 {
  margin: 0 0 0.5rem 0;
  color: #333;
}

.selected-area p {
  margin: 0;
  color: #666;
}
</style> 