<template>
  <div class="documentos-table-container">
    <div class="table-filters">
      <div class="search-filter">
        <i class="fas fa-search"></i>
        <input 
          type="text" 
          v-model="busqueda" 
          placeholder="Buscar documento..." 
          @input="filtrarDocumentos"
        />
      </div>
      <div class="advanced-filters">
        <div class="filter-group">
          <label>Área:</label>
          <select v-model="filtroArea" @change="filtrarDocumentos">
            <option value="">Todas</option>
            <option v-for="area in areas" :key="area.IDArea" :value="area.IDArea">
              {{ area.NombreArea }}
            </option>
          </select>
        </div>
        <div class="filter-group">
          <label>Estado:</label>
          <select v-model="filtroEstado" @change="filtrarDocumentos">
            <option value="">Todos</option>
            <option v-for="estado in estados" :key="estado" :value="estado">
              {{ estado }}
            </option>
          </select>
        </div>
        <div class="filter-group">
          <label>Fecha:</label>
          <input type="date" v-model="filtroFecha" @change="filtrarDocumentos" />
        </div>
      </div>
    </div>

    <div class="table-responsive">
      <table class="documentos-table">
      <thead>
        <tr>
          <th>Acciones</th>
          <th @click="ordenarPor('NroRegistro')" class="sortable">
            Nro <i :class="iconoOrden('NroRegistro')"></i>
          </th>
          <th @click="ordenarPor('FechaDocumento')" class="sortable">
            Fecha Ingreso <i :class="iconoOrden('FechaDocumento')"></i>
          </th>
          <th @click="ordenarPor('OrigenDocumento')" class="sortable">
            Tipo Doc <i :class="iconoOrden('OrigenDocumento')"></i>
          </th>
          <th>Nro Doc</th>
          <th>Fecha Doc</th>
          <th>Procedencia</th>
          <th>Área</th>
          <th>Contenido</th>
          <th>Tipo Salida</th>
          <th>Fecha Salida</th>
          <th>Observaciones</th>
          <th @click="ordenarPor('Estado')" class="sortable">
            Estado <i :class="iconoOrden('Estado')"></i>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="documento in documentosFiltrados" :key="documento.IDDocumento">
          <td>
            <div class="acciones-grupo">
              <button @click="verDetalle(documento)" class="btn-accion" title="Ver detalle">
                <i class="fas fa-eye"></i>
              </button>
              <PermissionGate :permission="PERMISSION_BITS.EDITAR">
                <button @click="editarDocumento(documento)" class="btn-accion btn-editar" title="Editar">
                  <i class="fas fa-edit"></i>
                </button>
              </PermissionGate>
              <PermissionGate :permission="PERMISSION_BITS.DERIVAR">
                <button @click="derivarDocumento(documento)" class="btn-accion btn-derivar" title="Derivar">
                  <i class="fas fa-share"></i>
                </button>
              </PermissionGate>
              <PermissionGate :permission="PERMISSION_BITS.ELIMINAR">
                <button @click="eliminarDocumento(documento)" class="btn-accion btn-eliminar" title="Eliminar">
                  <i class="fas fa-trash"></i>
                </button>
              </PermissionGate>
              <button 
                v-if="permisosContextuales[documento.IDDocumento]?.eliminar" 
                @click="eliminarDocumento(documento)" 
                class="btn-accion btn-eliminar" 
                title="Eliminar (permiso contextual)">
                <i class="fas fa-trash"></i>
              </button>
            </div>
          </td>
          <td>{{ documento.NroRegistro }}</td>
          <td>{{ formatearFecha(documento.FechaDocumento) }}</td>
          <td>{{ documento.OrigenDocumento }}</td>
          <td>{{ documento.NumeroOficioDocumento }}</td>
          <td>{{ formatearFecha(documento.FechaDocumento) }}</td>
          <td>{{ documento.Procedencia }}</td>
          <td>{{ getNombreArea(documento.IDAreaActual) }}</td>
          <td>{{ documento.Contenido }}</td>
          <td>{{ documento.TipoDocumentoSalida }}</td>
          <td>{{ formatearFecha(documento.FechaDocumentoSalida) }}</td>
          <td>{{ documento.Observaciones }}</td>
          <td>
            <span class="estado-badge" :class="'estado-' + documento.Estado?.toLowerCase().replace(/\s+/g, '-')">
              {{ documento.Estado }}
            </span>
          </td>
        </tr>
        <tr v-if="documentosFiltrados.length === 0">
          <td colspan="13" class="no-data">
            <div class="no-data-message">
              <i class="fas fa-search"></i>
              <p>No se encontraron documentos con los criterios de búsqueda</p>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
    </div>

    <!-- Modal para ver detalle -->
    <div v-if="mostrarDetalle" class="modal-overlay" @click.self="cerrarDetalle">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h3>Detalle de Documento</h3>
            <button class="btn-cerrar" @click="cerrarDetalle">
              <i class="fas fa-times"></i>
            </button>
          </div>
          <div class="modal-body">
            <div v-if="documentoActual" class="detalle-documento">
              <div class="detalle-grupo">
                <div class="detalle-item">
                  <label>Nro Registro:</label>
                  <span>{{ documentoActual.NroRegistro }}</span>
                </div>
                <div class="detalle-item">
                  <label>Fecha:</label>
                  <span>{{ formatearFecha(documentoActual.FechaDocumento) }}</span>
                </div>
              </div>
              <div class="detalle-grupo">
                <div class="detalle-item">
                  <label>Tipo:</label>
                  <span>{{ documentoActual.OrigenDocumento }}</span>
                </div>
                <div class="detalle-item">
                  <label>Nro Documento:</label>
                  <span>{{ documentoActual.NumeroOficioDocumento }}</span>
                </div>
              </div>
              <div class="detalle-grupo">
                <div class="detalle-item">
                  <label>Procedencia:</label>
                  <span>{{ documentoActual.Procedencia }}</span>
                </div>
                <div class="detalle-item">
                  <label>Área Actual:</label>
                  <span>{{ getNombreArea(documentoActual.IDAreaActual) }}</span>
                </div>
              </div>
              <div class="detalle-item full-width">
                <label>Contenido:</label>
                <p>{{ documentoActual.Contenido }}</p>
              </div>
              <div class="detalle-item full-width" v-if="documentoActual.Observaciones">
                <label>Observaciones:</label>
                <p>{{ documentoActual.Observaciones }}</p>
              </div>
              <div class="detalle-grupo">
                <div class="detalle-item">
                  <label>Estado:</label>
                  <span class="estado-badge" :class="'estado-' + documentoActual.Estado?.toLowerCase().replace(/\s+/g, '-')">
                    {{ documentoActual.Estado }}
                  </span>
                </div>
              </div>
              <div class="detalle-grupo" v-if="documentoActual.TipoDocumentoSalida">
                <div class="detalle-item">
                  <label>Tipo Doc. Salida:</label>
                  <span>{{ documentoActual.TipoDocumentoSalida }}</span>
                </div>
                <div class="detalle-item" v-if="documentoActual.FechaDocumentoSalida">
                  <label>Fecha Doc. Salida:</label>
                  <span>{{ formatearFecha(documentoActual.FechaDocumentoSalida) }}</span>
                </div>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" @click="cerrarDetalle">Cerrar</button>
            <PermissionGate :permission="PERMISSION_BITS.EDITAR">
              <button v-if="documentoActual" class="btn btn-primary" @click="editarDocumento(documentoActual)">Editar</button>
            </PermissionGate>
            <PermissionGate :permission="PERMISSION_BITS.DERIVAR">
              <button v-if="documentoActual" class="btn btn-success" @click="derivarDocumento(documentoActual)">Derivar</button>
            </PermissionGate>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal para confirmar eliminación -->
    <div v-if="mostrarConfirmacion" class="modal-overlay" @click.self="mostrarConfirmacion = false">
      <div class="modal-dialog modal-sm">
        <div class="modal-content">
          <div class="modal-header">
            <h3>Confirmar Eliminación</h3>
            <button class="btn-cerrar" @click="mostrarConfirmacion = false">
              <i class="fas fa-times"></i>
            </button>
          </div>
          <div class="modal-body">
            <p class="confirmacion-mensaje">
              ¿Está seguro que desea mover a papelera el documento <strong>{{ documentoAEliminar?.NroRegistro }}</strong>?
            </p>
            <p class="confirmacion-info">
              <i class="fas fa-info-circle"></i> Esta acción moverá el documento a la papelera. Podrá restaurarlo posteriormente.
            </p>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" @click="mostrarConfirmacion = false">Cancelar</button>
            <button class="btn btn-danger" @click="confirmarEliminacion">
              <i class="fas fa-trash"></i> Mover a Papelera
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { formatearFecha } from '../utils/formatters'
import PermissionGate from './PermissionGate.vue'
import { PERMISSION_BITS } from '../services/permissionService'
import { useAuthStore } from '../stores/auth'
import { eliminarDocumento as apiEliminarDocumento } from '../api/documentoApi'
import { canDeleteDocument } from '../services/permissionService'

const props = defineProps({
  documentos: {
    type: Array,
    required: true
  },
  areas: {
    type: Array,
    required: true
  },
  estados: {
    type: Array,
    required: true
  }
})

const emit = defineEmits(['ver-detalle', 'editar', 'derivar', 'eliminar', 'refresh'])

// Referencias
const busqueda = ref('')
const filtroArea = ref('')
const filtroEstado = ref('')
const filtroFecha = ref('')
const ordenPor = ref('NroRegistro')
const ordenAsc = ref(false)
const documentoSeleccionado = ref(null)
const documentoActual = ref(null)
const mostrarDetalle = ref(false)
const mostrarConfirmacion = ref(false)
const documentoAEliminar = ref(null)
const permisosContextuales = ref({})

const authStore = useAuthStore()

// Cargar permisos contextuales para documentos mostrados
async function cargarPermisosContextuales() {
  // Inicializar todos los documentos
  const idsDocumentos = props.documentos.map(doc => doc.IDDocumento)
  
  // Para cada documento, verificar permisos contextuales
  for (const idDocumento of idsDocumentos) {
    try {
      const puedeEliminar = await canDeleteDocument(idDocumento)
      permisosContextuales.value[idDocumento] = {
        eliminar: puedeEliminar
      }
    } catch (error) {
      console.error('Error verificando permisos contextuales:', error)
      permisosContextuales.value[idDocumento] = {
        eliminar: false
      }
    }
  }
}

// Observar cambios en props.documentos para actualizar permisos contextuales
watch(() => props.documentos, async () => {
  await cargarPermisosContextuales()
}, { immediate: true })

// Al montar el componente
onMounted(() => {
  cargarPermisosContextuales()
})

// Obtener el nombre del área por ID
function getNombreArea(idArea) {
  const area = props.areas.find(a => a.IDArea === idArea)
  return area ? area.NombreArea : 'Sin asignar'
}

// Filtrar documentos
const documentosFiltrados = computed(() => {
  let filtrados = [...props.documentos]
  
  // Aplicar búsqueda
  if (busqueda.value) {
    const termino = busqueda.value.toLowerCase()
    filtrados = filtrados.filter(doc => 
      doc.NroRegistro.toString().includes(termino) ||
      doc.NumeroOficioDocumento.toLowerCase().includes(termino) ||
      doc.Procedencia?.toLowerCase().includes(termino) ||
      doc.OrigenDocumento?.toLowerCase().includes(termino) ||
      doc.Contenido?.toLowerCase().includes(termino)
    )
  }
  
  // Aplicar filtro de área
  if (filtroArea.value) {
    filtrados = filtrados.filter(doc => doc.IDAreaActual == filtroArea.value)
  }
  
  // Aplicar filtro de estado
  if (filtroEstado.value) {
    filtrados = filtrados.filter(doc => doc.Estado === filtroEstado.value)
  }
  
  // Aplicar filtro de fecha
  if (filtroFecha.value) {
    const fechaSeleccionada = new Date(filtroFecha.value)
    fechaSeleccionada.setHours(0, 0, 0, 0)
    
    filtrados = filtrados.filter(doc => {
      if (!doc.FechaDocumento) return false
      const fechaDoc = new Date(doc.FechaDocumento)
      fechaDoc.setHours(0, 0, 0, 0)
      return fechaDoc.getTime() === fechaSeleccionada.getTime()
    })
  }
  
  // Aplicar orden
  filtrados.sort((a, b) => {
    let valorA = a[ordenPor.value]
    let valorB = b[ordenPor.value]
    
    // Manejar valores nulos
    if (valorA === null || valorA === undefined) valorA = ''
    if (valorB === null || valorB === undefined) valorB = ''
    
    // Manejar fechas
    if (ordenPor.value === 'FechaDocumento' || ordenPor.value === 'FechaDocumentoSalida') {
      valorA = valorA ? new Date(valorA).getTime() : 0
      valorB = valorB ? new Date(valorB).getTime() : 0
    }
    
    // Comparación
    if (valorA < valorB) return ordenAsc.value ? -1 : 1
    if (valorA > valorB) return ordenAsc.value ? 1 : -1
    return 0
  })
  
  return filtrados
})

// Ordenar por campo
function ordenarPor(campo) {
  if (ordenPor.value === campo) {
    ordenAsc.value = !ordenAsc.value
  } else {
    ordenPor.value = campo
    ordenAsc.value = true
  }
}

// Icono para la columna de orden
function iconoOrden(campo) {
  if (ordenPor.value !== campo) return 'fas fa-sort'
  return ordenAsc.value ? 'fas fa-sort-up' : 'fas fa-sort-down'
}

// Filtrar documentos (función para event handlers)
function filtrarDocumentos() {
  // La computada documentosFiltrados se recalcula automáticamente
}

// Ver detalle del documento
function verDetalle(documento) {
  documentoSeleccionado.value = documento.IDDocumento
  documentoActual.value = documento
  mostrarDetalle.value = true
  emit('ver-detalle', documento)
}

// Cerrar detalle
function cerrarDetalle() {
  mostrarDetalle.value = false
  documentoActual.value = null
}

// Editar documento
function editarDocumento(documento) {
  emit('editar', documento)
  cerrarDetalle()
}

// Derivar documento
function derivarDocumento(documento) {
  emit('derivar', documento)
  cerrarDetalle()
}

// Eliminar documento (mostrar confirmación)
function eliminarDocumento(documento) {
  documentoAEliminar.value = documento
  mostrarConfirmacion.value = true
}

// Confirmar eliminación
async function confirmarEliminacion() {
  if (!documentoAEliminar.value) return
  
  try {
    // Llamar a la API para eliminar el documento
    await apiEliminarDocumento(
      documentoAEliminar.value.IDDocumento,
      authStore.token
    )
    
    mostrarConfirmacion.value = false
    documentoAEliminar.value = null
    
    // Refrescar la lista de documentos
    emit('refresh')
  } catch (error) {
    console.error('Error al eliminar documento:', error)
    // Mostrar error en UI
    alert(error.response?.data?.message || 'Error al eliminar el documento')
  }
}
</script>

<style scoped>
/* Estilos para la tabla de documentos */
.documentos-table-container {
  width: 100%;
}

.table-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 1rem;
  background-color: #f8f9fa;
  border-radius: 8px;
  padding: 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.search-filter {
  position: relative;
  flex: 1;
  min-width: 250px;
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

.advanced-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}

.filter-group {
  display: flex;
  flex-direction: column;
  min-width: 150px;
}

.filter-group label {
  font-size: 0.8rem;
  color: #495057;
  margin-bottom: 0.25rem;
}

.filter-group select,
.filter-group input {
  padding: 0.4rem 0.5rem;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 0.9rem;
}

.table-responsive {
  overflow-x: auto;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.documentos-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.95rem;
}

.documentos-table th,
.documentos-table td {
  padding: 0.75rem;
  text-align: left;
  border-bottom: 1px solid #dee2e6;
}

.documentos-table th {
  background-color: #f8f9fa;
  font-weight: 600;
  color: #495057;
  position: sticky;
  top: 0;
  z-index: 1;
}

.documentos-table th.sortable {
  cursor: pointer;
}

.documentos-table th.sortable:hover {
  background-color: #e9ecef;
}

.documentos-table tbody tr:hover {
  background-color: #f8f9fa;
}

.documentos-table tr.highlighted {
  background-color: #e9f5ff;
}

.estado-badge {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 500;
  text-transform: capitalize;
}

.estado-en-trámite {
  background-color: #fff3cd;
  color: #856404;
}

.estado-finalizado {
  background-color: #d4edda;
  color: #155724;
}

.estado-observado {
  background-color: #f8d7da;
  color: #721c24;
}

.estado-archivado {
  background-color: #e2e3e5;
  color: #383d41;
}

.acciones-grupo {
  display: flex;
  gap: 0.5rem;
}

.btn-accion {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 4px;
  border: none;
  background-color: #e9ecef;
  color: #495057;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-accion:hover {
  background-color: #dee2e6;
}

.btn-editar:hover {
  background-color: #c8e1ff;
  color: #0056b3;
}

.btn-derivar:hover {
  background-color: #c5f2d4;
  color: #107a40;
}

.btn-eliminar:hover {
  background-color: #ffcdd2;
  color: #d32f2f;
}

.no-data {
  text-align: center;
  padding: 2rem;
}

.no-data-message {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  color: #6c757d;
}

.no-data-message i {
  font-size: 2rem;
  opacity: 0.5;
}

.no-data-message p {
  margin: 0;
}

/* Estilos para los modales */
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
  border-radius: 8px;
  overflow: hidden;
}

.modal-dialog.modal-sm {
  max-width: 400px;
}

.modal-content {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
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

.btn-cerrar {
  background: none;
  border: none;
  font-size: 1.25rem;
  cursor: pointer;
  color: #6c757d;
}

.btn-cerrar:hover {
  color: #343a40;
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

/* Estilos para el detalle de documento */
.detalle-documento {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.detalle-grupo {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.detalle-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.detalle-item.full-width {
  grid-column: 1 / -1;
}

.detalle-item label {
  font-size: 0.8rem;
  color: #6c757d;
  font-weight: 500;
}

.detalle-item p {
  margin: 0;
  padding: 0.5rem;
  background-color: #f8f9fa;
  border-radius: 4px;
  font-size: 0.9rem;
}

/* Estilos para la confirmación */
.confirmacion-mensaje {
  font-size: 1rem;
  margin-bottom: 1rem;
}

.confirmacion-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
  color: #6c757d;
  background-color: #f8f9fa;
  padding: 0.75rem;
  border-radius: 4px;
  margin: 0;
}

.confirmacion-info i {
  color: #0d6efd;
}

/* Botones */
.btn {
  padding: 0.5rem 1rem;
  border-radius: 4px;
  border: none;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
}

.btn-primary {
  background-color: #0d6efd;
  color: white;
}

.btn-primary:hover {
  background-color: #0a58ca;
}

.btn-success {
  background-color: #198754;
  color: white;
}

.btn-success:hover {
  background-color: #146c43;
}

.btn-secondary {
  background-color: #6c757d;
  color: white;
}

.btn-secondary:hover {
  background-color: #5c636a;
}

.btn-danger {
  background-color: #dc3545;
  color: white;
}

.btn-danger:hover {
  background-color: #bb2d3b;
}

/* Responsive design */
@media (max-width: 768px) {
  .detalle-grupo {
    grid-template-columns: 1fr;
  }
  
  .documentos-table th:nth-child(4),
  .documentos-table th:nth-child(5),
  .documentos-table td:nth-child(4),
  .documentos-table td:nth-child(5) {
    display: none;
  }
}

@media (max-width: 576px) {
  .table-filters {
    flex-direction: column;
    gap: 0.75rem;
  }
  
  .advanced-filters {
    flex-direction: column;
    gap: 0.75rem;
  }
  
  .filter-group {
    min-width: 100%;
  }
  
  .documentos-table th:nth-child(3),
  .documentos-table td:nth-child(3) {
    display: none;
  }
}
</style> 