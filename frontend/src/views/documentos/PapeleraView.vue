<template>
  <div class="papelera-view">
    <div class="papelera-header">
      <h1><i class="fas fa-trash-alt"></i> Papelera de Documentos</h1>
      <div class="papelera-actions">
        <PermissionGate :permission="PERMISSION_BITS.ADMIN">
          <button 
            v-if="documentosSeleccionados.length > 0" 
            class="btn btn-danger" 
            @click="mostrarEliminarSeleccionados = true"
          >
            <i class="fas fa-trash"></i> Eliminar Seleccionados
          </button>
        </PermissionGate>
      </div>
    </div>

    <div v-if="cargando" class="loading-container">
      <div class="spinner"></div>
      <p>Cargando documentos...</p>
    </div>

    <div v-else-if="documentos.length === 0" class="empty-state">
      <i class="fas fa-trash-alt"></i>
      <h3>La papelera está vacía</h3>
      <p>Los documentos eliminados aparecerán aquí</p>
    </div>

    <div v-else class="documents-table-container">
      <div class="table-filters">
        <div class="search-filter">
          <i class="fas fa-search"></i>
          <input 
            type="text" 
            v-model="busqueda" 
            placeholder="Buscar en papelera..." 
            @input="filtrarDocumentos"
          />
        </div>
      </div>

      <div class="table-responsive">
        <table class="documents-table">
          <thead>
            <tr>
              <th style="width: 50px">
                <input 
                  type="checkbox" 
                  :checked="seleccionarTodos" 
                  @change="toggleSeleccionarTodos"
                />
              </th>
              <th>Nro Registro</th>
              <th>Fecha</th>
              <th>Tipo</th>
              <th>Nro Documento</th>
              <th>Procedencia</th>
              <th>Área</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="documento in documentosFiltrados" :key="documento.IDDocumento">
              <td>
                <input 
                  type="checkbox" 
                  :value="documento.IDDocumento" 
                  v-model="documentosSeleccionados"
                />
              </td>
              <td>{{ documento.NroRegistro }}</td>
              <td>{{ formatearFecha(documento.FechaDocumento) }}</td>
              <td>{{ documento.OrigenDocumento }}</td>
              <td>{{ documento.NumeroOficioDocumento }}</td>
              <td>{{ documento.Procedencia }}</td>
              <td>{{ getNombreArea(documento.IDAreaActual) }}</td>
              <td>
                <div class="actions-group">
                  <button @click="verDetalle(documento)" class="btn-action" title="Ver detalle">
                    <i class="fas fa-eye"></i>
                  </button>
                  <PermissionGate :permission="PERMISSION_BITS.EDITAR">
                    <button @click="restaurarDocumento(documento)" class="btn-action btn-restore" title="Restaurar">
                      <i class="fas fa-undo"></i>
                    </button>
                  </PermissionGate>
                  <template v-if="canDeleteDocumentLocal(authStore.user, documento) && documento.Estado === 'PAPELERA'">
                    <button @click="eliminarPermanente(documento)" class="btn-action btn-delete" title="Eliminar permanentemente">
                      <i class="fas fa-trash"></i>
                    </button>
                  </template>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal para ver detalle del documento -->
    <div v-if="mostrarDetalle" class="modal-overlay" @click.self="cerrarDetalle">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h3>Detalle de Documento</h3>
            <button class="btn-close" @click="cerrarDetalle">
              <i class="fas fa-times"></i>
            </button>
          </div>
          <div class="modal-body">
            <div v-if="documentoActual" class="detail-document">
              <div class="detail-group">
                <div class="detail-item">
                  <label>Nro Registro:</label>
                  <span>{{ documentoActual.NroRegistro }}</span>
                </div>
                <div class="detail-item">
                  <label>Fecha:</label>
                  <span>{{ formatearFecha(documentoActual.FechaDocumento) }}</span>
                </div>
              </div>
              <div class="detail-group">
                <div class="detail-item">
                  <label>Tipo:</label>
                  <span>{{ documentoActual.OrigenDocumento }}</span>
                </div>
                <div class="detail-item">
                  <label>Nro Documento:</label>
                  <span>{{ documentoActual.NumeroOficioDocumento }}</span>
                </div>
              </div>
              <div class="detail-group">
                <div class="detail-item">
                  <label>Procedencia:</label>
                  <span>{{ documentoActual.Procedencia }}</span>
                </div>
                <div class="detail-item">
                  <label>Área Actual:</label>
                  <span>{{ getNombreArea(documentoActual.IDAreaActual) }}</span>
                </div>
              </div>
              <div class="detail-item full-width">
                <label>Contenido:</label>
                <p>{{ documentoActual.Contenido }}</p>
              </div>
              <div class="detail-item full-width" v-if="documentoActual.Observaciones">
                <label>Observaciones:</label>
                <p>{{ documentoActual.Observaciones }}</p>
              </div>
              <div class="detail-group">
                <div class="detail-item">
                  <label>Estado:</label>
                  <span class="status-badge status-papelera">
                    Papelera
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" @click="cerrarDetalle">Cerrar</button>
            <PermissionGate :permission="PERMISSION_BITS.EDITAR">
              <button class="btn btn-primary" @click="restaurarDocumento(documentoActual)">
                <i class="fas fa-undo"></i> Restaurar Documento
              </button>
            </PermissionGate>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal para confirmar eliminación permanente -->
    <div v-if="mostrarEliminarPermanente" class="modal-overlay" @click.self="mostrarEliminarPermanente = false">
      <div class="modal-dialog modal-sm">
        <div class="modal-content">
          <div class="modal-header">
            <h3>Eliminar Permanentemente</h3>
            <button class="btn-close" @click="mostrarEliminarPermanente = false">
              <i class="fas fa-times"></i>
            </button>
          </div>
          <div class="modal-body">
            <div class="warning-message">
              <i class="fas fa-exclamation-triangle"></i>
              <p>Esta acción no se puede deshacer</p>
            </div>
            <p class="confirmation-text">
              ¿Está seguro que desea eliminar permanentemente el documento <strong>{{ documentoAEliminar?.NroRegistro }}</strong>?
            </p>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" @click="mostrarEliminarPermanente = false">Cancelar</button>
            <button class="btn btn-danger" @click="confirmarEliminarPermanente">
              <i class="fas fa-trash"></i> Eliminar Permanentemente
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal para confirmar eliminación múltiple -->
    <div v-if="mostrarEliminarSeleccionados" class="modal-overlay" @click.self="mostrarEliminarSeleccionados = false">
      <div class="modal-dialog modal-sm">
        <div class="modal-content">
          <div class="modal-header">
            <h3>Eliminar Documentos Seleccionados</h3>
            <button class="btn-close" @click="mostrarEliminarSeleccionados = false">
              <i class="fas fa-times"></i>
            </button>
          </div>
          <div class="modal-body">
            <div class="warning-message">
              <i class="fas fa-exclamation-triangle"></i>
              <p>Esta acción no se puede deshacer</p>
            </div>
            <p class="confirmation-text">
              ¿Está seguro que desea eliminar permanentemente los <strong>{{ documentosSeleccionados.length }}</strong> documentos seleccionados?
            </p>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" @click="mostrarEliminarSeleccionados = false">Cancelar</button>
            <button 
              class="btn btn-danger" 
              @click="eliminarSeleccionados"
              :disabled="procesandoEliminarMultiple"
            >
              <i class="fas" :class="procesandoEliminarMultiple ? 'fa-spinner fa-spin' : 'fa-trash'"></i>
              {{ procesandoEliminarMultiple ? 'Eliminando...' : 'Eliminar Permanentemente' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '../../stores/auth'
import {
  fetchDocumentosPapelera,
  restaurarDocumento as apiRestaurarDocumento,
  eliminarDocumentoPermanente as apiEliminarPermanente
} from '../../api/documentoApi'
import { fetchAreasActivas } from '../../api/areaApi'
import { formatearFecha } from '../../utils/formatters'
import PermissionGate from '../../components/PermissionGate.vue'
import { PERMISSION_BITS, canDeleteDocumentLocal } from '../../services/permissionService'

// Estado
const authStore = useAuthStore()
const documentos = ref([])
const areas = ref([])
const cargando = ref(true)
const busqueda = ref('')
const mostrarDetalle = ref(false)
const documentoActual = ref(null)
const mostrarEliminarPermanente = ref(false)
const documentoAEliminar = ref(null)
const documentosSeleccionados = ref([])
const mostrarEliminarSeleccionados = ref(false)
const procesandoEliminarMultiple = ref(false)

// Selector para "seleccionar todos"
const seleccionarTodos = computed({
  get() {
    return documentos.value.length > 0 && documentosSeleccionados.value.length === documentos.value.length
  },
  set(value) {
    if (value) {
      documentosSeleccionados.value = documentos.value.map(doc => doc.IDDocumento)
    } else {
      documentosSeleccionados.value = []
    }
  }
})

// Toggle seleccionar todos
function toggleSeleccionarTodos(e) {
  seleccionarTodos.value = e.target.checked
}

// Cargar datos
async function cargarDatos() {
  cargando.value = true
  try {
    const [docsRes, areasRes] = await Promise.all([
      fetchDocumentosPapelera(authStore.token),
      fetchAreasActivas(authStore.token)
    ])
    documentos.value = docsRes.data
    areas.value = areasRes.data
  } catch (error) {
    console.error('Error cargando datos de papelera:', error)
  } finally {
    cargando.value = false
  }
}

// Filtrar documentos
const documentosFiltrados = computed(() => {
  if (!busqueda.value) return documentos.value
  
  const termino = busqueda.value.toLowerCase()
  return documentos.value.filter(doc => 
    doc.NroRegistro.toString().includes(termino) ||
    doc.NumeroOficioDocumento.toLowerCase().includes(termino) ||
    doc.Procedencia?.toLowerCase().includes(termino) ||
    doc.OrigenDocumento?.toLowerCase().includes(termino) ||
    doc.Contenido?.toLowerCase().includes(termino)
  )
})

// Filtrar documentos (función para event handlers)
function filtrarDocumentos() {
  // La computada documentosFiltrados se recalcula automáticamente
}

// Obtener el nombre del área por ID
function getNombreArea(idArea) {
  const area = areas.value.find(a => a.IDArea === idArea)
  return area ? area.NombreArea : 'Sin asignar'
}

// Ver detalle del documento
function verDetalle(documento) {
  documentoActual.value = documento
  mostrarDetalle.value = true
}

// Cerrar detalle
function cerrarDetalle() {
  mostrarDetalle.value = false
  documentoActual.value = null
}

// Restaurar documento
async function restaurarDocumento(documento) {
  if (!documento) return
  
  try {
    await apiRestaurarDocumento(documento.IDDocumento, authStore.token)
    
    // Actualizar la lista de documentos (eliminar de la vista actual)
    documentos.value = documentos.value.filter(d => d.IDDocumento !== documento.IDDocumento)
    
    // Si el documento restaurado estaba seleccionado, quitarlo de la selección
    documentosSeleccionados.value = documentosSeleccionados.value.filter(id => id !== documento.IDDocumento)
    
    // Cerrar modal si estaba abierto
    cerrarDetalle()
    
    // Mostrar mensaje de éxito
    alert('Documento restaurado con éxito')
  } catch (error) {
    console.error('Error restaurando documento:', error)
    alert(error.response?.data?.message || 'Error al restaurar el documento')
  }
}

// Eliminar permanentemente (mostrar confirmación)
function eliminarPermanente(documento) {
  documentoAEliminar.value = documento
  mostrarEliminarPermanente.value = true
}

// Confirmar eliminación permanente
async function confirmarEliminarPermanente() {
  if (!documentoAEliminar.value) return
  
  try {
    await apiEliminarPermanente(documentoAEliminar.value.IDDocumento, authStore.token)
    
    // Actualizar la lista de documentos
    documentos.value = documentos.value.filter(d => d.IDDocumento !== documentoAEliminar.value.IDDocumento)
    
    // Si el documento eliminado estaba seleccionado, quitarlo de la selección
    documentosSeleccionados.value = documentosSeleccionados.value.filter(id => id !== documentoAEliminar.value.IDDocumento)
    
    mostrarEliminarPermanente.value = false
    documentoAEliminar.value = null
    
    // Mostrar mensaje de éxito
    alert('Documento eliminado permanentemente')
  } catch (error) {
    console.error('Error eliminando documento permanentemente:', error)
    alert(error.response?.data?.message || 'Error al eliminar el documento')
  }
}

// Eliminar múltiples documentos
async function eliminarSeleccionados() {
  if (documentosSeleccionados.value.length === 0) return
  
  procesandoEliminarMultiple.value = true
  
  try {
    // Eliminar uno por uno (en serie para evitar problemas)
    for (const idDocumento of documentosSeleccionados.value) {
      await apiEliminarPermanente(idDocumento, authStore.token)
    }
    
    // Actualizar la lista de documentos
    documentos.value = documentos.value.filter(d => !documentosSeleccionados.value.includes(d.IDDocumento))
    
    documentosSeleccionados.value = []
    mostrarEliminarSeleccionados.value = false
    
    // Mostrar mensaje de éxito
    alert('Documentos eliminados permanentemente')
  } catch (error) {
    console.error('Error eliminando documentos:', error)
    alert(error.response?.data?.message || 'Error al eliminar los documentos')
  } finally {
    procesandoEliminarMultiple.value = false
  }
}

// Al montar el componente
onMounted(() => {
  cargarDatos()
})
</script>

<style scoped>
.papelera-view {
  padding: 1rem;
}

.papelera-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.papelera-header h1 {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.5rem;
  color: #343a40;
  margin: 0;
}

.papelera-header h1 i {
  color: #dc3545;
}

/* Loading state */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 3rem;
  color: #6c757d;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(0, 0, 0, 0.1);
  border-radius: 50%;
  border-top-color: #007bff;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Empty state */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 3rem;
  background-color: #f8f9fa;
  border-radius: 8px;
  color: #6c757d;
}

.empty-state i {
  font-size: 3rem;
  color: #adb5bd;
}

.empty-state h3 {
  margin: 0;
  font-size: 1.5rem;
}

.empty-state p {
  margin: 0;
  font-size: 1rem;
}

/* Table styles */
.documents-table-container {
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

.table-filters {
  display: flex;
  padding: 1rem;
  background-color: #f8f9fa;
  border-bottom: 1px solid #dee2e6;
}

.search-filter {
  position: relative;
  flex: 1;
}

.search-filter i {
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
  color: #6c757d;
}

.search-filter input {
  width: 100%;
  padding: 0.5rem 0.5rem 0.5rem 2rem;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 0.9rem;
}

.table-responsive {
  overflow-x: auto;
}

.documents-table {
  width: 100%;
  border-collapse: collapse;
}

.documents-table th,
.documents-table td {
  padding: 0.75rem;
  text-align: left;
  border-bottom: 1px solid #dee2e6;
}

.documents-table th {
  background-color: #f8f9fa;
  font-weight: 600;
  color: #495057;
}

.documents-table tbody tr:hover {
  background-color: #f8f9fa;
}

.actions-group {
  display: flex;
  gap: 0.5rem;
}

.btn-action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border-radius: 4px;
  border: none;
  background-color: #e9ecef;
  color: #495057;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-action:hover {
  background-color: #dee2e6;
}

.btn-action.btn-restore:hover {
  background-color: #d4edda;
  color: #28a745;
}

.btn-action.btn-delete:hover {
  background-color: #f8d7da;
  color: #dc3545;
}

/* Modal styles */
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

.modal-dialog {
  max-width: 600px;
  width: 100%;
  margin: 1rem;
}

.modal-dialog.modal-sm {
  max-width: 400px;
}

.modal-content {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  overflow: hidden;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  border-bottom: 1px solid #dee2e6;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.25rem;
  color: #343a40;
}

.btn-close {
  background: none;
  border: none;
  font-size: 1.25rem;
  cursor: pointer;
  color: #6c757d;
}

.modal-body {
  padding: 1rem;
  max-height: 70vh;
  overflow-y: auto;
}

.modal-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.5rem;
  padding: 1rem;
  border-top: 1px solid #dee2e6;
}

.warning-message {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background-color: #fff3cd;
  color: #856404;
  padding: 0.75rem;
  border-radius: 4px;
  margin-bottom: 1rem;
}

.warning-message i {
  font-size: 1.25rem;
}

.confirmation-text {
  font-size: 1rem;
  margin: 0;
}

/* Document detail styles */
.detail-document {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.detail-group {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.detail-item.full-width {
  grid-column: 1 / -1;
}

.detail-item label {
  font-size: 0.8rem;
  color: #6c757d;
  font-weight: 500;
}

.detail-item p {
  margin: 0;
  padding: 0.5rem;
  background-color: #f8f9fa;
  border-radius: 4px;
  font-size: 0.9rem;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 500;
}

.status-badge.status-papelera {
  background-color: #f8d7da;
  color: #dc3545;
}

/* Button styles */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  border: none;
  border-radius: 4px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn.btn-primary {
  background-color: #007bff;
  color: white;
}

.btn.btn-primary:hover {
  background-color: #0069d9;
}

.btn.btn-secondary {
  background-color: #6c757d;
  color: white;
}

.btn.btn-secondary:hover {
  background-color: #5a6268;
}

.btn.btn-danger {
  background-color: #dc3545;
  color: white;
}

.btn.btn-danger:hover {
  background-color: #c82333;
}

.btn:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .papelera-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
  
  .detail-group {
    grid-template-columns: 1fr;
  }
  
  .documents-table th:nth-child(4),
  .documents-table th:nth-child(5),
  .documents-table th:nth-child(6),
  .documents-table td:nth-child(4),
  .documents-table td:nth-child(5),
  .documents-table td:nth-child(6) {
    display: none;
  }
}
</style> 