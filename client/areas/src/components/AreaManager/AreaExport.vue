<template>
  <div class="area-export-container">
    <button 
      @click="showExportModal = true" 
      class="export-button"
      title="Exportar datos"
    >
      <i class="fas fa-file-export"></i>
      <span>Exportar</span>
    </button>
    
    <!-- Modal de Exportación -->
    <div v-if="showExportModal" class="export-modal-backdrop" @click="closeModal">
      <div class="export-modal" @click.stop>
        <div class="modal-header">
          <h3>Exportar Datos de Áreas</h3>
          <button @click="closeModal" class="close-button">
            <i class="fas fa-times"></i>
          </button>
        </div>
        
        <div class="modal-body">
          <p class="export-description">
            Seleccione las opciones de exportación y el formato deseado.
          </p>
          
          <div class="form-group">
            <label class="form-label">Datos a Exportar</label>
            <div class="checkbox-group">
              <label class="checkbox-label">
                <input 
                  type="checkbox" 
                  v-model="exportOptions.includeAll"
                  @change="toggleAllFields"
                >
                Seleccionar todos los campos
              </label>
            </div>
          </div>
          
          <div class="form-group fields-group" :class="{ 'disabled': exportOptions.includeAll }">
            <label class="form-label">Campos Específicos</label>
            <div class="checkbox-columns">
              <div>
                <label class="checkbox-label">
                  <input 
                    type="checkbox" 
                    v-model="exportOptions.fields.id"
                    :disabled="exportOptions.includeAll"
                  >
                  ID
                </label>
                <label class="checkbox-label">
                  <input 
                    type="checkbox" 
                    v-model="exportOptions.fields.codigo"
                    :disabled="exportOptions.includeAll"
                  >
                  Código
                </label>
                <label class="checkbox-label">
                  <input 
                    type="checkbox" 
                    v-model="exportOptions.fields.nombre"
                    :disabled="exportOptions.includeAll"
                  >
                  Nombre
                </label>
                <label class="checkbox-label">
                  <input 
                    type="checkbox" 
                    v-model="exportOptions.fields.tipo"
                    :disabled="exportOptions.includeAll"
                  >
                  Tipo
                </label>
              </div>
              <div>
                <label class="checkbox-label">
                  <input 
                    type="checkbox" 
                    v-model="exportOptions.fields.descripcion"
                    :disabled="exportOptions.includeAll"
                  >
                  Descripción
                </label>
                <label class="checkbox-label">
                  <input 
                    type="checkbox" 
                    v-model="exportOptions.fields.estado"
                    :disabled="exportOptions.includeAll"
                  >
                  Estado
                </label>
                <label class="checkbox-label">
                  <input 
                    type="checkbox" 
                    v-model="exportOptions.fields.fechaCreacion"
                    :disabled="exportOptions.includeAll"
                  >
                  Fecha de Creación
                </label>
                <label class="checkbox-label">
                  <input 
                    type="checkbox" 
                    v-model="exportOptions.fields.creadoPor"
                    :disabled="exportOptions.includeAll"
                  >
                  Creado Por
                </label>
              </div>
            </div>
          </div>
          
          <div class="form-group">
            <label class="form-label">Opciones Adicionales</label>
            <div class="checkbox-group">
              <label class="checkbox-label">
                <input 
                  type="checkbox" 
                  v-model="exportOptions.includeHierarchy"
                >
                Incluir estructura jerárquica
              </label>
              <label class="checkbox-label">
                <input 
                  type="checkbox" 
                  v-model="exportOptions.includeOnlyFiltered"
                >
                Exportar solo áreas filtradas ({{ filteredCount }} áreas)
              </label>
            </div>
          </div>
          
          <div class="form-group">
            <label class="form-label">Formato de Exportación</label>
            <div class="format-options">
              <button 
                v-for="format in exportFormats" 
                :key="format.id"
                @click="selectFormat(format.id)"
                class="format-button"
                :class="{ 'selected': exportOptions.format === format.id }"
              >
                <i :class="format.icon"></i>
                <span>{{ format.name }}</span>
              </button>
            </div>
          </div>
        </div>
        
        <div class="modal-footer">
          <button 
            @click="closeModal" 
            class="btn btn-secondary"
          >
            Cancelar
          </button>
          <button 
            @click="exportData" 
            class="btn btn-primary"
            :disabled="isExporting || !isExportable"
          >
            <span v-if="isExporting">
              <i class="fas fa-spinner fa-spin"></i>
              Exportando...
            </span>
            <span v-else>
              <i class="fas fa-file-export"></i>
              Exportar
            </span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useToast } from '@/shared/composables/useToast'
import { auditService } from '@/shared/services/security/auditTrail'

const props = defineProps({
  areas: {
    type: Array,
    required: true
  },
  filteredAreas: {
    type: Array,
    required: true
  },
  filters: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits(['export-completed'])

// Composables
const { showToast } = useToast()

// Estado
const showExportModal = ref(false)
const isExporting = ref(false)
const exportOptions = ref({
  includeAll: true,
  fields: {
    id: true,
    codigo: true,
    nombre: true,
    tipo: true,
    descripcion: true,
    estado: true,
    fechaCreacion: true,
    creadoPor: true
  },
  includeHierarchy: true,
  includeOnlyFiltered: false,
  format: 'excel'
})

// Formatos de exportación disponibles
const exportFormats = [
  { id: 'excel', name: 'Excel', icon: 'fas fa-file-excel', extension: '.xlsx' },
  { id: 'csv', name: 'CSV', icon: 'fas fa-file-csv', extension: '.csv' },
  { id: 'pdf', name: 'PDF', icon: 'fas fa-file-pdf', extension: '.pdf' },
  { id: 'json', name: 'JSON', icon: 'fas fa-file-code', extension: '.json' }
]

// Computed
const filteredCount = computed(() => {
  return props.filteredAreas.length
})

const isExportable = computed(() => {
  const hasSelectedFields = exportOptions.value.includeAll || 
    Object.values(exportOptions.value.fields).some(field => field)
    
  return hasSelectedFields && exportOptions.value.format
})

// Métodos
const closeModal = () => {
  showExportModal.value = false
}

const toggleAllFields = () => {
  if (exportOptions.value.includeAll) {
    // Si se selecciona "todos", marcar todos los campos individuales
    Object.keys(exportOptions.value.fields).forEach(fieldKey => {
      exportOptions.value.fields[fieldKey] = true
    })
  }
}

const selectFormat = (formatId) => {
  exportOptions.value.format = formatId
}

const exportData = async () => {
  if (!isExportable.value) return
  
  isExporting.value = true
  
  try {
    // Determinar qué áreas exportar
    const areasToExport = exportOptions.value.includeOnlyFiltered 
      ? props.filteredAreas 
      : props.areas
    
    if (areasToExport.length === 0) {
      showToast('No hay áreas para exportar', 'warning')
      isExporting.value = false
      return
    }
    
    // Preparar datos para exportación
    const exportData = prepareExportData(areasToExport)
    
    // Exportar según el formato seleccionado
    const result = await executeExport(exportData)
    
    // Registro en auditoría
    await auditService.log({
      action: 'AREAS_EXPORTED',
      resource: { type: 'AREA_LIST' },
      details: `Exportación de ${areasToExport.length} áreas en formato ${exportOptions.value.format.toUpperCase()}`
    })
    
    showToast('Exportación completada con éxito', 'success')
    emit('export-completed', result)
    closeModal()
  } catch (error) {
    console.error('Error en exportación:', error)
    showToast('Error al exportar datos: ' + (error.message || 'Error desconocido'), 'error')
  } finally {
    isExporting.value = false
  }
}

const prepareExportData = (areas) => {
  const result = []
  
  // Mapear datos según campos seleccionados
  for (const area of areas) {
    const exportItem = {}
    
    if (exportOptions.value.includeAll || exportOptions.value.fields.id) {
      exportItem.IDArea = area.IDArea
    }
    
    if (exportOptions.value.includeAll || exportOptions.value.fields.codigo) {
      exportItem.CodigoIdentificacion = area.CodigoIdentificacion
    }
    
    if (exportOptions.value.includeAll || exportOptions.value.fields.nombre) {
      exportItem.NombreArea = area.NombreArea
    }
    
    if (exportOptions.value.includeAll || exportOptions.value.fields.tipo) {
      exportItem.TipoArea = area.TipoArea
    }
    
    if (exportOptions.value.includeAll || exportOptions.value.fields.descripcion) {
      exportItem.Descripcion = area.Descripcion
    }
    
    if (exportOptions.value.includeAll || exportOptions.value.fields.estado) {
      exportItem.Estado = area.IsActive ? 'Activo' : 'Inactivo'
    }
    
    if (exportOptions.value.includeAll || exportOptions.value.fields.fechaCreacion) {
      exportItem.FechaCreacion = formatDate(area.FechaCreacion)
    }
    
    if (exportOptions.value.includeAll || exportOptions.value.fields.creadoPor) {
      exportItem.CreadoPor = area.CreadoPorNombre || area.CreadoPor || 'No disponible'
    }
    
    if (exportOptions.value.includeHierarchy) {
      // Agregar información de jerarquía
      if (area.IDAreaPadre) {
        const parentArea = props.areas.find(a => a.IDArea === area.IDAreaPadre)
        exportItem.AreaPadre = parentArea ? parentArea.NombreArea : 'No disponible'
        exportItem.CodigoPadre = parentArea ? parentArea.CodigoIdentificacion : 'No disponible'
      } else {
        exportItem.AreaPadre = 'Ninguna (Raíz)'
        exportItem.CodigoPadre = '-'
      }
      
      // Agregar nivel jerárquico
      exportItem.NivelJerarquico = calcularNivelJerarquico(area, props.areas)
    }
    
    result.push(exportItem)
  }
  
  return result
}

const calcularNivelJerarquico = (area, allAreas) => {
  let nivel = 1
  let currentArea = area
  
  while (currentArea && currentArea.IDAreaPadre) {
    nivel++
    currentArea = allAreas.find(a => a.IDArea === currentArea.IDAreaPadre)
  }
  
  return nivel
}

const executeExport = async (data) => {
  const format = exportOptions.value.format
  const formatInfo = exportFormats.find(f => f.id === format)
  const fileName = `areas_${new Date().toISOString().slice(0, 10)}${formatInfo.extension}`
  
  switch (format) {
    case 'excel':
      return await exportExcel(data, fileName)
      
    case 'csv':
      return await exportCSV(data, fileName)
      
    case 'pdf':
      return await exportPDF(data, fileName)
      
    case 'json':
      return await exportJSON(data, fileName)
      
    default:
      throw new Error(`Formato no soportado: ${format}`)
  }
}

const exportExcel = async (data, fileName) => {
  // Simulación de exportación a Excel (en producción se usaría ExcelJS o similar)
  return simulateFileDownload(data, fileName, 'excel')
}

const exportCSV = async (data, fileName) => {
  // Convertir datos a CSV
  const headers = Object.keys(data[0]).join(',')
  const rows = data.map(item => Object.values(item).join(','))
  const csvContent = [headers, ...rows].join('\n')
  
  return simulateFileDownload(csvContent, fileName, 'csv')
}

const exportJSON = async (data, fileName) => {
  const jsonContent = JSON.stringify(data, null, 2)
  return simulateFileDownload(jsonContent, fileName, 'json')
}

const exportPDF = async (data, fileName) => {
  // Simulación de exportación a PDF (en producción se usaría pdfmake o similar)
  return simulateFileDownload(data, fileName, 'pdf')
}

const simulateFileDownload = (data, fileName, type) => {
  return new Promise((resolve) => {
    // Simular retraso de procesamiento
    setTimeout(() => {
      console.log(`Exportación simulada: ${fileName}`, data)
      
      // En una implementación real, aquí crearíamos y descargaríamos el archivo
      
      resolve({
        success: true,
        fileName,
        type,
        itemCount: data.length
      })
    }, 1000)
  })
}

const formatDate = (dateString) => {
  if (!dateString) return ''
  
  try {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  } catch (e) {
    return dateString
  }
}

// Limpiar estado al cerrar
watch(showExportModal, (newValue) => {
  if (!newValue) {
    isExporting.value = false
  }
})
</script>

<style scoped>
.area-export-container {
  display: inline-block;
}

.export-button {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background-color: #f8f9fa;
  border: 1px solid #d0d7de;
  border-radius: 4px;
  font-size: 14px;
  color: #333;
  cursor: pointer;
  transition: all 0.2s;
}

.export-button:hover {
  background-color: #e9ecef;
  border-color: #c0c7d0;
}

.export-modal-backdrop {
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

.export-modal {
  background-color: white;
  border-radius: 8px;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  overflow: hidden;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  border-bottom: 1px solid #e0e0e0;
  background-color: #f8f9fa;
}

.modal-header h3 {
  margin: 0;
  font-size: 18px;
  color: #2c3e50;
}

.close-button {
  background: none;
  border: none;
  font-size: 18px;
  color: #666;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
}

.close-button:hover {
  background-color: #e9ecef;
}

.modal-body {
  padding: 20px 24px;
  overflow-y: auto;
}

.export-description {
  margin-bottom: 20px;
  color: #666;
  font-size: 14px;
}

.form-group {
  margin-bottom: 20px;
}

.form-label {
  display: block;
  font-weight: 500;
  margin-bottom: 10px;
  color: #333;
  font-size: 14px;
}

.checkbox-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #333;
  cursor: pointer;
}

.checkbox-label input {
  margin: 0;
}

.fields-group.disabled {
  opacity: 0.7;
  pointer-events: none;
}

.checkbox-columns {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
}

.checkbox-columns > div {
  flex: 1;
  min-width: 180px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.format-options {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.format-button {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  background-color: #f8f9fa;
  cursor: pointer;
  transition: all 0.2s;
  flex: 1;
  min-width: 90px;
}

.format-button i {
  font-size: 20px;
  color: #666;
}

.format-button span {
  font-size: 13px;
  color: #333;
}

.format-button:hover {
  background-color: #e9ecef;
}

.format-button.selected {
  background-color: #e0eafc;
  border-color: #4285f4;
}

.format-button.selected i,
.format-button.selected span {
  color: #4285f4;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid #e0e0e0;
  background-color: #f8f9fa;
}

.btn {
  padding: 8px 16px;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 100px;
  border: 1px solid transparent;
  gap: 6px;
}

.btn-primary {
  background-color: #4285f4;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background-color: #3367d6;
}

.btn-primary:disabled {
  background-color: #a0bffc;
  cursor: not-allowed;
}

.btn-secondary {
  background-color: #f5f5f5;
  color: #333;
  border-color: #ddd;
}

.btn-secondary:hover {
  background-color: #e9ecef;
}

/* Estilos para dispositivos móviles */
@media (max-width: 576px) {
  .checkbox-columns {
    flex-direction: column;
    gap: 0;
  }
  
  .format-options {
    justify-content: center;
  }
  
  .format-button {
    padding: 8px;
    min-width: 70px;
  }
  
  .modal-footer {
    flex-direction: column;
  }
  
  .btn {
    width: 100%;
  }
}
</style> 