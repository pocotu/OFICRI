<template>
  <div class="consulta-view">
    <h1>Consulta de Documentos</h1>
    <div class="consulta-filtros">
      <input v-model="filtros.texto" type="text" placeholder="Buscar por Nro, Oficio, Procedencia, Contenido..." />
      <select v-model="filtros.area">
        <option value="">Todas las áreas</option>
        <option v-for="area in areas" :key="area.IDArea" :value="area.IDArea">{{ area.NombreArea }}</option>
      </select>
      <select v-model="filtros.estado">
        <option value="">Todos los estados</option>
        <option v-for="estado in estados" :key="estado" :value="estado">{{ estado }}</option>
      </select>
      <select v-model="filtros.tipo">
        <option value="">Todos los tipos</option>
        <option v-for="tipo in tiposDoc" :key="tipo" :value="tipo">{{ tipo }}</option>
      </select>
      <input v-model="filtros.fechaInicio" type="date" />
      <input v-model="filtros.fechaFin" type="date" />
      <button class="btn-buscar" @click="buscar">Buscar</button>
      <button v-if="puedeExportar" class="btn-exportar" @click="exportar">Exportar</button>
    </div>
    <div class="consulta-table-wrapper">
      <table class="consulta-table">
        <thead>
          <tr>
            <th>Nro</th>
            <th>Fecha Ingreso</th>
            <th>Tipo Doc</th>
            <th>Nro Doc</th>
            <th>Fecha Doc</th>
            <th>Procedencia</th>
            <th>Área</th>
            <th>Estado</th>
            <th>Ver</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="doc in documentos" :key="doc.IDDocumento">
            <td>{{ doc.NroRegistro }}</td>
            <td>{{ formatearFecha(doc.FechaDocumento) }}</td>
            <td>{{ doc.OrigenDocumento }}</td>
            <td>{{ doc.NumeroOficioDocumento }}</td>
            <td>{{ formatearFecha(doc.FechaDocumento) }}</td>
            <td>{{ doc.Procedencia }}</td>
            <td>{{ getNombreArea(doc.IDAreaActual) }}</td>
            <td><span class="estado-badge" :class="'estado-' + doc.Estado?.toLowerCase().replace(/\s+/g, '-')">{{ doc.Estado }}</span></td>
            <td><button class="btn-ver" @click="verDetalle(doc)"><i class="fas fa-eye"></i></button></td>
          </tr>
          <tr v-if="documentos.length === 0">
            <td colspan="9" class="no-data">No se encontraron documentos</td>
          </tr>
        </tbody>
      </table>
      <div class="paginacion-bar" v-if="totalPaginas > 1">
        <button class="btn-pag" :disabled="paginaActual === 1" @click="irPagina(paginaActual - 1)">&laquo;</button>
        <button v-for="pag in totalPaginas" :key="pag" class="btn-pag" :class="{ activa: pag === paginaActual }" @click="irPagina(pag)">{{ pag }}</button>
        <button class="btn-pag" :disabled="paginaActual === totalPaginas" @click="irPagina(paginaActual + 1)">&raquo;</button>
      </div>
    </div>
    <div v-if="mostrarDetalle" class="modal-overlay" @click.self="cerrarDetalle">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h3>Detalle de Documento</h3>
            <button class="btn-cerrar" @click="cerrarDetalle"><i class="fas fa-times"></i></button>
          </div>
          <div class="modal-body">
            <div v-if="documentoActual">
              <div><b>Nro Registro:</b> {{ documentoActual.NroRegistro }}</div>
              <div><b>Fecha Ingreso:</b> {{ formatearFecha(documentoActual.FechaDocumento) }}</div>
              <div><b>Tipo Doc:</b> {{ documentoActual.OrigenDocumento }}</div>
              <div><b>Nro Doc:</b> {{ documentoActual.NumeroOficioDocumento }}</div>
              <div><b>Procedencia:</b> {{ documentoActual.Procedencia }}</div>
              <div><b>Área:</b> {{ getNombreArea(documentoActual.IDAreaActual) }}</div>
              <div><b>Estado:</b> {{ documentoActual.Estado }}</div>
              <div><b>Contenido:</b> {{ documentoActual.Contenido }}</div>
              <div v-if="documentoActual.Observaciones"><b>Observaciones:</b> {{ documentoActual.Observaciones }}</div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn" @click="cerrarDetalle">Cerrar</button>
            <button v-if="puedeVerTrazabilidad" class="btn" @click="verTrazabilidad(documentoActual)"><i class="fas fa-route"></i> Trazabilidad</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { fetchDocumentosConsulta } from '../../api/documentoApi'
import { useAuthStore } from '../../stores/auth'
import { formatearFecha } from '../../utils/formatters'
import { fetchAreasActivas } from '../../api/areaApi'
import { PERMISSION_BITS, hasPermission } from '../../services/permissionService'

const authStore = useAuthStore()
const filtros = ref({ texto: '', area: '', estado: '', tipo: '', fechaInicio: '', fechaFin: '', page: 1, pageSize: 10 })
const documentos = ref([])
const total = ref(0)
const paginaActual = ref(1)
const areas = ref([])
const estados = ref(['RECIBIDO', 'DERIVADO', 'FINALIZADO', 'EN PROCESO', 'ARCHIVADO'])
const tiposDoc = ref(['OF', 'IN'])
const mostrarDetalle = ref(false)
const documentoActual = ref(null)

const puedeExportar = computed(() => hasPermission(PERMISSION_BITS.EXPORTAR))
const puedeVerTrazabilidad = computed(() => hasPermission(PERMISSION_BITS.VER))

onMounted(async () => {
  await cargarAreas()
  buscar()
})

async function cargarAreas() {
  const { data } = await fetchAreasActivas(authStore.token)
  areas.value = data
}

function buscar() {
  paginaActual.value = 1
  filtros.value.page = 1
  fetchResultados()
}

async function fetchResultados() {
  const { data } = await fetchDocumentosConsulta(filtros.value, authStore.token)
  documentos.value = data.data
  total.value = data.total
}

function irPagina(pag) {
  if (pag < 1 || pag > totalPaginas.value) return
  paginaActual.value = pag
  filtros.value.page = pag
  fetchResultados()
}

const totalPaginas = computed(() => Math.ceil(total.value / filtros.value.pageSize))

function getNombreArea(idArea) {
  const area = areas.value.find(a => a.IDArea === idArea)
  return area ? area.NombreArea : 'Sin asignar'
}

function verDetalle(doc) {
  documentoActual.value = doc
  mostrarDetalle.value = true
}

function cerrarDetalle() {
  mostrarDetalle.value = false
  documentoActual.value = null
}

function exportar() {
  // Implementar exportación a Excel/PDF según permisos
  alert('Funcionalidad de exportar próximamente')
}

function verTrazabilidad(doc) {
  // Implementar navegación o modal de trazabilidad
  alert('Funcionalidad de trazabilidad próximamente')
}
</script>

<style scoped>
.consulta-view { padding: 20px; }
.consulta-filtros { display: flex; flex-wrap: wrap; gap: 0.7rem; margin-bottom: 1rem; align-items: center; }
.consulta-filtros input, .consulta-filtros select { border-radius: 6px; border: 1px solid #d1d5db; background: #fff; height: 2.2rem; font-size: 1rem; padding: 0 0.75rem; }
.btn-buscar { background: #16c784; color: #fff; border: none; border-radius: 6px; padding: 0.6rem 1.2rem; font-weight: 600; font-size: 1rem; }
.btn-buscar:hover { background: #13a06b; }
.btn-exportar { background: #2dc76d; color: #fff; border: none; border-radius: 6px; padding: 0.6rem 1.2rem; font-weight: 600; font-size: 1rem; }
.btn-exportar:hover { background: #1e9e4a; }
.consulta-table-wrapper { overflow-x: auto; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
.consulta-table { width: 100%; border-collapse: collapse; font-size: 0.95rem; }
.consulta-table th, .consulta-table td { padding: 0.5rem 0.75rem; text-align: left; border-bottom: 1px solid #e5e7eb; }
.consulta-table th { background: #f6f8fa; font-weight: 600; position: sticky; top: 0; z-index: 2; }
.estado-badge { display: inline-block; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.8rem; font-weight: 500; text-transform: capitalize; }
.btn-ver { background: #e9ecef; color: #495057; border: none; border-radius: 4px; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; cursor: pointer; }
.btn-ver:hover { background: #c8e1ff; color: #0056b3; }
.paginacion-bar { display: flex; justify-content: flex-end; align-items: center; gap: 0.3rem; margin: 1rem 0 0.5rem 0; }
.btn-pag { background: #f6f8fa; border: 1px solid #d1d5db; color: #184d2b; border-radius: 5px; padding: 0.35rem 0.85rem; font-size: 1rem; font-weight: 600; cursor: pointer; transition: background 0.2s, color 0.2s; }
.btn-pag.activa, .btn-pag:hover:not(:disabled) { background: #2dc76d; color: #fff; border-color: #2dc76d; }
.btn-pag:disabled { opacity: 0.5; cursor: not-allowed; }
.no-data { text-align: center; color: #888; }
.modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background-color: rgba(0, 0, 0, 0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
.modal-dialog { max-width: 600px; width: 100%; margin: 1rem; border-radius: 8px; overflow: hidden; }
.modal-content { background-color: white; border-radius: 8px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15); }
.modal-header { display: flex; align-items: center; justify-content: space-between; padding: 1rem; border-bottom: 1px solid #dee2e6; }
.modal-header h3 { margin: 0; font-size: 1.25rem; color: #343a40; }
.btn-cerrar { background: none; border: none; font-size: 1.25rem; cursor: pointer; color: #6c757d; }
.btn-cerrar:hover { color: #343a40; }
.modal-body { padding: 1rem; max-height: 70vh; overflow-y: auto; }
.modal-footer { display: flex; align-items: center; justify-content: flex-end; gap: 0.5rem; padding: 1rem; border-top: 1px solid #dee2e6; }
</style> 