<template>
  <div class="area-filters-container" :class="{ 'expanded': showAdvancedFilters }">
    <div class="filters-header">
      <div class="search-container">
        <input 
          type="text" 
          v-model="localFilters.searchQuery" 
          @input="applyFilters"
          placeholder="Buscar por nombre, código o descripción..." 
          class="search-input"
        />
        <i class="fas fa-search search-icon"></i>
        <button 
          v-if="localFilters.searchQuery" 
          @click="clearSearch" 
          class="clear-search"
          title="Limpiar búsqueda"
        >
          <i class="fas fa-times"></i>
        </button>
      </div>
      
      <div class="filters-actions">
        <button 
          @click="toggleAdvancedFilters" 
          class="toggle-filters-btn"
          :class="{ 'active': showAdvancedFilters }"
        >
          <i class="fas fa-filter"></i>
          <span class="btn-text">Filtros</span>
          <i :class="showAdvancedFilters ? 'fas fa-chevron-up' : 'fas fa-chevron-down'" class="toggle-icon"></i>
        </button>
        
        <button 
          v-if="hasActiveFilters" 
          @click="resetFilters" 
          class="reset-filters-btn"
          title="Restablecer filtros"
        >
          <i class="fas fa-undo-alt"></i>
          <span class="btn-text">Restablecer</span>
        </button>
      </div>
    </div>
    
    <transition name="slide-down">
      <div v-if="showAdvancedFilters" class="advanced-filters-panel">
        <div class="filters-row">
          <div class="filter-group">
            <label>Tipo de Área</label>
            <select v-model="localFilters.type" @change="applyFilters">
              <option value="">Todos los tipos</option>
              <option v-for="(label, value) in tiposArea" :key="value" :value="value">
                {{ label }}
              </option>
            </select>
          </div>
          
          <div class="filter-group">
            <label>Estado</label>
            <select v-model="localFilters.status" @change="applyFilters">
              <option value="">Todos los estados</option>
              <option value="active">Activos</option>
              <option value="inactive">Inactivos</option>
            </select>
          </div>
          
          <div class="filter-group">
            <label>Área Superior</label>
            <select v-model="localFilters.parentArea" @change="applyFilters">
              <option value="">Todas</option>
              <option value="root">Solo áreas raíz</option>
              <option v-for="area in areasParaPadre" :key="area.IDArea" :value="area.IDArea">
                {{ area.NombreArea }}
              </option>
            </select>
          </div>
        </div>
        
        <div class="filters-row">
          <div class="filter-group date-filter">
            <label>Fecha de Creación</label>
            <div class="date-inputs">
              <div class="date-field">
                <label class="sublabel">Desde</label>
                <input 
                  type="date" 
                  v-model="localFilters.dateFrom" 
                  @change="applyFilters"
                />
              </div>
              <div class="date-field">
                <label class="sublabel">Hasta</label>
                <input 
                  type="date" 
                  v-model="localFilters.dateTo" 
                  @change="applyFilters"
                />
              </div>
            </div>
          </div>
          
          <div class="filter-group">
            <label>Creado Por</label>
            <select v-model="localFilters.createdBy" @change="applyFilters">
              <option value="">Todos los usuarios</option>
              <option v-for="user in uniqueCreators" :key="user.id" :value="user.id">
                {{ user.name }}
              </option>
            </select>
          </div>
        </div>
        
        <div class="filters-row sort-row">
          <div class="filter-group sort-group">
            <label>Ordenar Por</label>
            <div class="sort-controls">
              <select v-model="localFilters.sortBy" @change="applyFilters">
                <option value="nombre">Nombre</option>
                <option value="codigo">Código</option>
                <option value="tipo">Tipo</option>
                <option value="fechaCreacion">Fecha de Creación</option>
              </select>
              <button 
                @click="toggleSortDirection" 
                class="sort-direction-btn"
                :title="localFilters.sortDirection === 'asc' ? 'Ascendente' : 'Descendente'"
              >
                <i :class="localFilters.sortDirection === 'asc' ? 'fas fa-sort-alpha-down' : 'fas fa-sort-alpha-up'"></i>
              </button>
            </div>
          </div>
          
          <div class="filter-group view-options">
            <label>Vista</label>
            <div class="view-buttons">
              <button 
                @click="changeViewMode('list')" 
                :class="{ 'active': localFilters.viewMode === 'list' }"
                title="Vista de lista"
              >
                <i class="fas fa-list"></i>
              </button>
              <button 
                @click="changeViewMode('grid')" 
                :class="{ 'active': localFilters.viewMode === 'grid' }"
                title="Vista de cuadrícula"
              >
                <i class="fas fa-th"></i>
              </button>
              <button 
                @click="changeViewMode('tree')" 
                :class="{ 'active': localFilters.viewMode === 'tree' }"
                title="Vista de árbol"
              >
                <i class="fas fa-sitemap"></i>
              </button>
            </div>
          </div>
        </div>
        
        <div class="applied-filters" v-if="hasActiveFilters">
          <div class="applied-filters-title">Filtros aplicados:</div>
          <div class="filter-tags">
            <div 
              v-if="localFilters.searchQuery" 
              class="filter-tag"
            >
              Búsqueda: "{{ localFilters.searchQuery }}"
              <button @click="clearSearch" class="remove-filter">
                <i class="fas fa-times"></i>
              </button>
            </div>
            
            <div 
              v-if="localFilters.type" 
              class="filter-tag"
            >
              Tipo: {{ tiposArea[localFilters.type] }}
              <button @click="localFilters.type = ''; applyFilters()" class="remove-filter">
                <i class="fas fa-times"></i>
              </button>
            </div>
            
            <div 
              v-if="localFilters.status" 
              class="filter-tag"
            >
              Estado: {{ localFilters.status === 'active' ? 'Activo' : 'Inactivo' }}
              <button @click="localFilters.status = ''; applyFilters()" class="remove-filter">
                <i class="fas fa-times"></i>
              </button>
            </div>
            
            <div 
              v-if="localFilters.parentArea" 
              class="filter-tag"
            >
              {{ localFilters.parentArea === 'root' ? 'Solo áreas raíz' : 'Área Superior: ' + getParentAreaName() }}
              <button @click="localFilters.parentArea = ''; applyFilters()" class="remove-filter">
                <i class="fas fa-times"></i>
              </button>
            </div>
            
            <div 
              v-if="localFilters.dateFrom || localFilters.dateTo" 
              class="filter-tag"
            >
              Fecha: {{ formatDateFilter() }}
              <button @click="clearDateFilter" class="remove-filter">
                <i class="fas fa-times"></i>
              </button>
            </div>
            
            <div 
              v-if="localFilters.createdBy" 
              class="filter-tag"
            >
              Creado por: {{ getCreatorName() }}
              <button @click="localFilters.createdBy = ''; applyFilters()" class="remove-filter">
                <i class="fas fa-times"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { debounce } from 'lodash'

const props = defineProps({
  areas: {
    type: Array,
    required: true
  },
  filters: {
    type: Object,
    default: () => ({
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
  },
  tiposArea: {
    type: Object,
    default: () => ({
      'RECEPCION': 'Recepción',
      'ESPECIALIZADA': 'Especializada',
      'ADMINISTRATIVA': 'Administrativa',
      'OPERATIVA': 'Operativa',
      'LEGAL': 'Legal',
      'MESA_PARTES': 'Mesa de Partes',
      'OTRO': 'Otro'
    })
  }
})

const emit = defineEmits(['update:filters', 'filter-changed'])

// Estado local
const showAdvancedFilters = ref(false)
const localFilters = ref({ ...props.filters })

// Lista de áreas para filtro por padre, limitada a un número manejable
const areasParaPadre = computed(() => {
  // Tomamos máximo 20 áreas para no sobrecargar el dropdown
  return props.areas
    .filter(area => area.IsActive)
    .slice(0, 20)
    .sort((a, b) => a.NombreArea.localeCompare(b.NombreArea))
})

// Lista única de creadores de áreas
const uniqueCreators = computed(() => {
  const creators = new Map()
  
  props.areas.forEach(area => {
    if (area.CreadoPor) {
      creators.set(area.CreadoPor, {
        id: area.CreadoPor,
        name: area.CreadoPorNombre || area.CreadoPor
      })
    }
  })
  
  return Array.from(creators.values())
})

// Determina si hay filtros activos
const hasActiveFilters = computed(() => {
  return (
    localFilters.value.searchQuery ||
    localFilters.value.type ||
    localFilters.value.status ||
    localFilters.value.parentArea ||
    localFilters.value.dateFrom ||
    localFilters.value.dateTo ||
    localFilters.value.createdBy ||
    localFilters.value.sortBy !== 'nombre' ||
    localFilters.value.sortDirection !== 'asc'
  )
})

// Métodos
const applyFilters = debounce(() => {
  emit('update:filters', { ...localFilters.value })
  emit('filter-changed', { ...localFilters.value })
}, 300)

const toggleAdvancedFilters = () => {
  showAdvancedFilters.value = !showAdvancedFilters.value
}

const resetFilters = () => {
  localFilters.value = {
    searchQuery: '',
    type: '',
    status: '',
    parentArea: '',
    dateFrom: '',
    dateTo: '',
    createdBy: '',
    sortBy: 'nombre',
    sortDirection: 'asc',
    viewMode: localFilters.value.viewMode // Mantener la vista actual
  }
  
  applyFilters()
}

const clearSearch = () => {
  localFilters.value.searchQuery = ''
  applyFilters()
}

const toggleSortDirection = () => {
  localFilters.value.sortDirection = localFilters.value.sortDirection === 'asc' ? 'desc' : 'asc'
  applyFilters()
}

const changeViewMode = (mode) => {
  localFilters.value.viewMode = mode
  applyFilters()
}

const clearDateFilter = () => {
  localFilters.value.dateFrom = ''
  localFilters.value.dateTo = ''
  applyFilters()
}

const getParentAreaName = () => {
  if (localFilters.value.parentArea === 'root') {
    return 'Áreas raíz'
  }
  
  const parentArea = props.areas.find(area => area.IDArea == localFilters.value.parentArea)
  return parentArea ? parentArea.NombreArea : ''
}

const getCreatorName = () => {
  const creator = uniqueCreators.value.find(user => user.id == localFilters.value.createdBy)
  return creator ? creator.name : ''
}

const formatDateFilter = () => {
  let result = ''
  
  if (localFilters.value.dateFrom && localFilters.value.dateTo) {
    result = `Desde ${formatDateString(localFilters.value.dateFrom)} hasta ${formatDateString(localFilters.value.dateTo)}`
  } else if (localFilters.value.dateFrom) {
    result = `Desde ${formatDateString(localFilters.value.dateFrom)}`
  } else if (localFilters.value.dateTo) {
    result = `Hasta ${formatDateString(localFilters.value.dateTo)}`
  }
  
  return result
}

const formatDateString = (dateString) => {
  if (!dateString) return ''
  
  try {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(date)
  } catch (e) {
    return dateString
  }
}

// Sincronizar filtros cuando cambien externamente
watch(() => props.filters, (newFilters) => {
  localFilters.value = { ...newFilters }
}, { deep: true })

onMounted(() => {
  // Inicializar los filtros locales
  localFilters.value = { ...props.filters }
})
</script>

<style scoped>
.area-filters-container {
  background-color: #fff;
  border-radius: 6px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  border: 1px solid #e0e0e0;
  margin-bottom: 16px;
  transition: all 0.3s ease;
}

.area-filters-container.expanded {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.filters-header {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #e0e0e0;
}

.search-container {
  flex: 1;
  position: relative;
}

.search-input {
  width: 100%;
  padding: 8px 12px 8px 36px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  transition: border-color 0.2s;
}

.search-input:focus {
  border-color: #4285f4;
  outline: none;
  box-shadow: 0 0 0 2px rgba(66, 133, 244, 0.25);
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #666;
}

.clear-search {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: #999;
  cursor: pointer;
  font-size: 12px;
  padding: 0;
}

.clear-search:hover {
  color: #666;
}

.filters-actions {
  display: flex;
  gap: 8px;
  margin-left: 16px;
}

.toggle-filters-btn, .reset-filters-btn {
  display: flex;
  align-items: center;
  padding: 6px 12px;
  border-radius: 4px;
  border: 1px solid #ddd;
  background-color: #f8f9fa;
  color: #333;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
  gap: 6px;
}

.toggle-filters-btn.active, .toggle-filters-btn:hover, .reset-filters-btn:hover {
  background-color: #e9ecef;
}

.toggle-filters-btn.active {
  border-color: #adb5bd;
}

.toggle-icon {
  font-size: 10px;
  color: #666;
}

.advanced-filters-panel {
  padding: 16px;
  border-top: 1px solid #e0e0e0;
}

.filters-row {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 16px;
}

.filters-row:last-child {
  margin-bottom: 0;
}

.filter-group {
  flex: 1;
  min-width: 200px;
}

.filter-group label {
  display: block;
  font-size: 13px;
  font-weight: 500;
  margin-bottom: 6px;
  color: #333;
}

.filter-group select, .filter-group input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 13px;
  background-color: #fff;
}

.filter-group select:focus, .filter-group input:focus {
  border-color: #4285f4;
  outline: none;
  box-shadow: 0 0 0 2px rgba(66, 133, 244, 0.25);
}

.date-filter {
  flex: 2;
}

.date-inputs {
  display: flex;
  gap: 12px;
}

.date-field {
  flex: 1;
}

.sublabel {
  display: block;
  font-size: 12px;
  font-weight: normal;
  margin-bottom: 4px;
  color: #666;
}

.sort-row {
  align-items: flex-end;
}

.sort-group {
  flex: 2;
}

.sort-controls {
  display: flex;
  gap: 8px;
}

.sort-controls select {
  flex: 1;
}

.sort-direction-btn {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background-color: #f8f9fa;
  cursor: pointer;
}

.sort-direction-btn:hover {
  background-color: #e9ecef;
}

.view-options {
  display: flex;
  flex-direction: column;
}

.view-buttons {
  display: flex;
  gap: 4px;
}

.view-buttons button {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background-color: #f8f9fa;
  cursor: pointer;
  flex: 1;
}

.view-buttons button:hover {
  background-color: #e9ecef;
}

.view-buttons button.active {
  background-color: #e0eafc;
  border-color: #4285f4;
  color: #4285f4;
}

.applied-filters {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #e0e0e0;
}

.applied-filters-title {
  font-size: 13px;
  font-weight: 500;
  margin-bottom: 8px;
  color: #333;
}

.filter-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.filter-tag {
  display: flex;
  align-items: center;
  padding: 4px 8px;
  background-color: #e8f0fe;
  border: 1px solid #c6d8f9;
  border-radius: 16px;
  font-size: 12px;
  color: #1967d2;
}

.remove-filter {
  background: none;
  border: none;
  color: #1967d2;
  cursor: pointer;
  padding: 0;
  margin-left: 6px;
  font-size: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  border-radius: 50%;
}

.remove-filter:hover {
  background-color: rgba(25, 103, 210, 0.1);
}

/* Transición para el panel de filtros */
.slide-down-enter-active, .slide-down-leave-active {
  transition: all 0.3s ease;
  max-height: 500px;
  overflow: hidden;
}

.slide-down-enter-from, .slide-down-leave-to {
  max-height: 0;
  opacity: 0;
  padding-top: 0;
  padding-bottom: 0;
}

.btn-text {
  display: inline;
}

/* Estilos para dispositivos móviles */
@media (max-width: 768px) {
  .filters-row {
    flex-direction: column;
    gap: 12px;
  }
  
  .filter-group {
    width: 100%;
  }
  
  .btn-text {
    display: none;
  }
  
  .filters-actions {
    margin-left: 8px;
  }
  
  .toggle-filters-btn, .reset-filters-btn {
    padding: 6px;
  }
}
</style> 