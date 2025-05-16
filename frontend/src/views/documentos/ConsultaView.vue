<template>
  <div class="consulta-documentos-view">
    <h1 class="main-title"><i class="fa-solid fa-search"></i> Consulta de Documentos</h1>

    <div class="card">
      <div class="filtros-container">
        <div class="form-row">
          <div class="form-group">
            <label for="nro-registro">Nro Registro</label>
            <input id="nro-registro" v-model="filtros.NroRegistro" />
          </div>
          <div class="form-group">
            <label for="area">Área</label>
            <select id="area" v-model="filtros.IDArea">
              <option value="">Todas las áreas</option>
              <option v-for="area in areas" :key="area.IDArea" :value="area.IDArea">
                {{ area.NombreArea }}
              </option>
            </select>
          </div>
          <div class="form-group">
            <label for="estado">Estado</label>
            <select id="estado" v-model="filtros.Estado">
              <option value="">Todos los estados</option>
              <option v-for="estado in ESTADOS_DOCUMENTO" :key="estado" :value="estado">
                {{ estado }}
              </option>
            </select>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label for="fecha-inicio">Fecha Inicio</label>
            <input id="fecha-inicio" v-model="filtros.FechaInicio" type="date" />
          </div>
          <div class="form-group">
            <label for="fecha-fin">Fecha Fin</label>
            <input id="fecha-fin" v-model="filtros.FechaFin" type="date" />
          </div>
          <div class="form-group">
            <label for="procedencia">Procedencia</label>
            <input id="procedencia" v-model="filtros.Procedencia" />
          </div>
        </div>
        <div class="form-actions">
          <button @click="aplicarFiltros" class="btn btn-primary">
            <i class="fa-solid fa-filter"></i> Filtrar
          </button>
          <button @click="limpiarFiltros" class="btn btn-secondary">
            <i class="fa-solid fa-eraser"></i> Limpiar
          </button>
        </div>
      </div>

      <div class="tabla-container">
        <table class="table">
          <thead>
            <tr>
              <th>Nro Registro</th>
              <th>Fecha</th>
              <th>Procedencia</th>
              <th>Área</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="doc in documentosPaginados" :key="doc.IDDocumento">
              <td>{{ doc.NroRegistro }}</td>
              <td>{{ formatearFecha(doc.FechaDocumento) }}</td>
              <td>{{ doc.Procedencia }}</td>
              <td>{{ obtenerNombreArea(doc.IDAreaActual) }}</td>
              <td>
                <span :class="['estado-badge', doc.Estado.toLowerCase()]">
                  {{ doc.Estado }}
                </span>
              </td>
              <td>
                <div class="acciones">
                  <button @click="verDetalle(doc)" class="btn-icon" title="Ver detalle">
                    <i class="fa-solid fa-eye"></i>
                  </button>
                  <button @click="verTrazabilidad(doc)" class="btn-icon" title="Ver trazabilidad">
                    <i class="fa-solid fa-history"></i>
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="documentosPaginados.length === 0">
              <td colspan="6" class="no-data">No se encontraron documentos</td>
            </tr>
          </tbody>
        </table>
        <!-- Paginación -->
        <div class="paginacion-bar" v-if="totalPaginas > 1">
          <button class="btn-pag" :disabled="paginaActual === 1" @click="irPagina(paginaActual - 1)">&laquo;</button>
          <button v-for="pag in totalPaginas" :key="pag" class="btn-pag" :class="{ activa: pag === paginaActual }" @click="irPagina(pag)">{{ pag }}</button>
          <button class="btn-pag" :disabled="paginaActual === totalPaginas" @click="irPagina(paginaActual + 1)">&raquo;</button>
        </div>
      </div>
    </div>

    <!-- Modal de Detalle -->
    <Modal v-if="mostrarDetalle" @close="cerrarDetalle">
      <div class="detalle-documento" v-if="documentoSeleccionado">
        <h2>Detalle del Documento</h2>
        <div class="detalle-grid">
          <div class="detalle-item">
            <label>Nro Registro:</label>
            <span>{{ documentoSeleccionado.NroRegistro }}</span>
          </div>
          <div class="detalle-item">
            <label>Fecha:</label>
            <span>{{ formatearFecha(documentoSeleccionado.FechaDocumento) }}</span>
          </div>
          <div class="detalle-item">
            <label>Procedencia:</label>
            <span>{{ documentoSeleccionado.Procedencia }}</span>
          </div>
          <div class="detalle-item">
            <label>Área:</label>
            <span>{{ obtenerNombreArea(documentoSeleccionado.IDAreaActual) }}</span>
          </div>
          <div class="detalle-item">
            <label>Estado:</label>
            <span>{{ documentoSeleccionado.Estado }}</span>
          </div>
          <div class="detalle-item">
            <label>Contenido:</label>
            <span>{{ documentoSeleccionado.Contenido }}</span>
          </div>
          <div class="detalle-item">
            <label>Observaciones:</label>
            <span>{{ documentoSeleccionado.Observaciones }}</span>
          </div>
        </div>
      </div>
    </Modal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '../../stores/auth'
import { fetchDocumentos } from '../../api/documentoApi'
import { fetchAreasActivas } from '../../api/areaApi'
import Modal from '../../components/Modal.vue'

const authStore = useAuthStore()
const token = authStore.token

const documentos = ref([])
const areas = ref([])
const mostrarDetalle = ref(false)
const documentoSeleccionado = ref(null)

const ESTADOS_DOCUMENTO = [
  'En trámite',
  'Finalizado',
  'Observado',
  'Archivado'
]

const filtros = ref({
  NroRegistro: '',
  IDArea: '',
  Estado: '',
  FechaInicio: '',
  FechaFin: '',
  Procedencia: ''
})

// PAGINACIÓN
const documentosPorPagina = 5
const paginaActual = ref(1)
const totalPaginas = computed(() => Math.ceil(documentosFiltrados.value.length / documentosPorPagina))
const documentosPaginados = computed(() => {
  const inicio = (paginaActual.value - 1) * documentosPorPagina
  return documentosFiltrados.value.slice(inicio, inicio + documentosPorPagina)
})

const documentosFiltrados = computed(() => {
  return documentos.value.filter(doc => {
    const cumpleNroRegistro = !filtros.value.NroRegistro || 
      doc.NroRegistro.toString().includes(filtros.value.NroRegistro)
    
    const cumpleArea = !filtros.value.IDArea || 
      doc.IDAreaActual === parseInt(filtros.value.IDArea)
    
    const cumpleEstado = !filtros.value.Estado || 
      doc.Estado === filtros.value.Estado
    
    const cumpleProcedencia = !filtros.value.Procedencia || 
      doc.Procedencia.toLowerCase().includes(filtros.value.Procedencia.toLowerCase())
    
    let cumpleFechas = true
    if (filtros.value.FechaInicio && filtros.value.FechaFin) {
      const fechaDoc = new Date(doc.FechaDocumento)
      const fechaInicio = new Date(filtros.value.FechaInicio)
      const fechaFin = new Date(filtros.value.FechaFin)
      cumpleFechas = fechaDoc >= fechaInicio && fechaDoc <= fechaFin
    }
    
    return cumpleNroRegistro && cumpleArea && cumpleEstado && 
           cumpleProcedencia && cumpleFechas
  })
})

function cargarDocumentos() {
  fetchDocumentos(token).then(res => {
    documentos.value = res.data
  })
}

function cargarAreas() {
  fetchAreasActivas(token).then(res => {
    areas.value = res.data
  })
}

function aplicarFiltros() {
  paginaActual.value = 1 // Reiniciar a la primera página al filtrar
}

function limpiarFiltros() {
  filtros.value = {
    NroRegistro: '',
    IDArea: '',
    Estado: '',
    FechaInicio: '',
    FechaFin: '',
    Procedencia: ''
  }
  paginaActual.value = 1
}

function verDetalle(doc) {
  documentoSeleccionado.value = doc
  mostrarDetalle.value = true
}

function cerrarDetalle() {
  mostrarDetalle.value = false
  documentoSeleccionado.value = null
}

function verTrazabilidad(doc) {
  // Implementar lógica de trazabilidad
}

function formatearFecha(fecha) {
  if (!fecha) return ''
  const d = new Date(fecha)
  if (isNaN(d)) return fecha
  return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`
}

function obtenerNombreArea(idArea) {
  const area = areas.value.find(a => a.IDArea === idArea)
  return area ? area.NombreArea : 'N/A'
}

function irPagina(pag) {
  if (pag < 1 || pag > totalPaginas.value) return
  paginaActual.value = pag
}

onMounted(() => {
  cargarDocumentos()
  cargarAreas()
})
</script>

<style scoped>
.consulta-documentos-view {
  padding: 20px;
}

.filtros-container {
  margin-bottom: 20px;
  padding: 20px;
  background-color: #f8f9fa;
  border-radius: 8px;
}

.form-row {
  display: flex;
  gap: 20px;
  margin-bottom: 15px;
}

.form-group {
  flex: 1;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: 500;
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.form-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

.tabla-container {
  overflow-x: auto;
  max-width: 100vw;
}

.table {
  width: 100%;
  min-width: 700px;
  border-collapse: collapse;
}

.table th,
.table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #ddd;
}

.table th {
  background-color: #f8f9fa;
  font-weight: 600;
}

.estado-badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.9em;
}

.estado-badge.en-trámite {
  background-color: #ffd700;
  color: #000;
}

.estado-badge.finalizado {
  background-color: #28a745;
  color: #fff;
}

.estado-badge.observado {
  background-color: #dc3545;
  color: #fff;
}

.estado-badge.archivado {
  background-color: #6c757d;
  color: #fff;
}

.acciones {
  display: flex;
  gap: 8px;
}

.btn-icon {
  padding: 6px;
  border: none;
  background: none;
  cursor: pointer;
  color: #666;
  transition: color 0.2s;
}

.btn-icon:hover {
  color: #007bff;
}

.detalle-documento {
  padding: 20px;
}

.detalle-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 15px;
  margin-top: 20px;
}

.detalle-item {
  display: flex;
  flex-direction: column;
}

.detalle-item label {
  font-weight: 600;
  margin-bottom: 5px;
  color: #666;
}

.detalle-item span {
  color: #333;
}

.paginacion-bar {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 0.3rem;
  margin: 1rem 0 0.5rem 0;
}
.btn-pag {
  background: #16c784;
  border: 1px solid #16c784;
  color: #fff;
  border-radius: 5px;
  padding: 0.35rem 0.85rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s, color 0.2s;
}
.btn-pag.activa, .btn-pag:hover:not(:disabled) {
  background: #13a06b;
  color: #fff;
  border-color: #13a06b;
}
.btn-pag:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.no-data {
  text-align: center;
  color: #888;
}
@media (max-width: 900px) {
  .tabla-container {
    max-width: 100vw;
    overflow-x: auto;
  }
  .table {
    min-width: 600px;
  }
}
@media (max-width: 600px) {
  .tabla-container {
    max-width: 100vw;
    overflow-x: auto;
  }
  .table {
    min-width: 500px;
    font-size: 0.95em;
  }
  .form-row {
    flex-direction: column;
    gap: 10px;
  }
}
</style> 