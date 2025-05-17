<template>
  <div class="dosaje-table-container">
    <!-- Filtros -->
    <div class="filtros-bar">
      <div class="filtros-izq">
        <div class="input-icon">
          <i class="fas fa-search"></i>
          <input type="text" v-model="busqueda" placeholder="Buscar dosaje..." @input="filtrarDosajes" />
        </div>
        <input type="date" v-model="filtroFecha" @change="filtrarDosajes" />
        <input type="text" v-model="filtroProcedencia" placeholder="Procedencia" @input="filtrarDosajes" />
        <input type="text" v-model="filtroExamen" placeholder="Examen" @input="filtrarDosajes" />
      </div>
      <div class="filtros-der">
        <button class="btn-nuevo" @click="abrirModalNuevo"><i class="fas fa-plus"></i> Nuevo Dosaje</button>
      </div>
    </div>
    <div class="table-responsive">
      <table class="dosaje-table">
        <thead>
          <tr>
            <th>Acciones</th>
            <th @click="ordenarPor('NumeroRegistro')" class="sortable">Nro <i :class="iconoOrden('NumeroRegistro')"></i></th>
            <th @click="ordenarPor('FechaIngreso')" class="sortable">Fecha Ingreso <i :class="iconoOrden('FechaIngreso')"></i></th>
            <th @click="ordenarPor('TipoDosaje')" class="sortable">Tipo de documento <i :class="iconoOrden('TipoDosaje')"></i></th>
            <th @click="ordenarPor('NumeroOficio')" class="sortable">Nro Oficio Entrada <i :class="iconoOrden('NumeroOficio')"></i></th>
            <th>Procedencia</th>
            <th>Examen</th>
            <th>Nombres</th>
            <th>Apellidos</th>
            <th>Delito/Infracción</th>
            <th>Como</th>
            <th>Nro Informe Salida</th>
            <th>Nro Oficio Salida</th>
            <th @click="ordenarPor('DocSalidaFecha')" class="sortable">Fecha Salida <i :class="iconoOrden('DocSalidaFecha')"></i></th>
            <th>Responsable</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="dosaje in dosajesPaginados" :key="dosaje.IDDosaje">
            <td>
              <div class="acciones-grupo">
                <button @click="verDetalle(dosaje)" class="btn-accion" title="Ver detalle"><i class="fas fa-eye"></i></button>
                <button @click="editarDosaje(dosaje)" class="btn-accion btn-editar" title="Editar"><i class="fas fa-edit"></i></button>
                <button @click="eliminarDosaje(dosaje)" class="btn-accion btn-eliminar" title="Eliminar"><i class="fas fa-trash"></i></button>
                <!-- Aquí se puede agregar trazabilidad o más acciones -->
              </div>
            </td>
            <td>{{ dosaje.NumeroRegistro }}</td>
            <td>{{ formatFecha(dosaje.FechaIngreso) }}</td>
            <td>{{ dosaje.TipoDosaje }}</td>
            <td>{{ dosaje.NumeroOficio }}</td>
            <td>{{ dosaje.Procedencia }}</td>
            <td>{{ dosaje.Examen }}</td>
            <td>{{ dosaje.Nombres }}</td>
            <td>{{ dosaje.Apellidos }}</td>
            <td>{{ dosaje.DelitoInfraccion }}</td>
            <td>{{ dosaje.Como }}</td>
            <td>{{ dosaje.DocSalidaNroInforme }}</td>
            <td>{{ dosaje.DocSalidaDFG }}</td>
            <td>{{ formatFecha(dosaje.DocSalidaFecha) }}</td>
            <td>{{ dosaje.Responsable }}</td>
          </tr>
          <tr v-if="dosajesFiltrados.length === 0">
            <td colspan="15" class="no-data">
              <div class="no-data-message">
                <i class="fas fa-search"></i>
                <p>No se encontraron registros de dosaje con los criterios de búsqueda</p>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div class="paginacion-bar" v-if="totalPaginas > 1">
      <button class="btn-pag" :disabled="paginaActual === 1" @click="irPagina(paginaActual - 1)">&laquo;</button>
      <button v-for="pag in totalPaginas" :key="pag" class="btn-pag" :class="{ activa: pag === paginaActual }" @click="irPagina(pag)">{{ pag }}</button>
      <button class="btn-pag" :disabled="paginaActual === totalPaginas" @click="irPagina(paginaActual + 1)">&raquo;</button>
    </div>
    <!-- Modal para ver detalle -->
    <div v-if="mostrarDetalle" class="modal-overlay" @click.self="cerrarDetalle">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h3>Detalle de Dosaje</h3>
            <button class="btn-cerrar" @click="cerrarDetalle">
              <i class="fas fa-times"></i>
            </button>
          </div>
          <div class="modal-body">
            <div v-if="dosajeActual" class="detalle-dosaje">
              <div class="detalle-grupo">
                <div class="detalle-item"><label>Nro Registro:</label><span>{{ dosajeActual.NumeroRegistro }}</span></div>
                <div class="detalle-item"><label>Fecha Ingreso:</label><span>{{ formatFecha(dosajeActual.FechaIngreso) }}</span></div>
              </div>
              <div class="detalle-grupo">
                <div class="detalle-item"><label>Tipo de documento:</label><span>{{ dosajeActual.TipoDosaje }}</span></div>
                <div class="detalle-item"><label>Nro Oficio Entrada:</label><span>{{ dosajeActual.NumeroOficio }}</span></div>
              </div>
              <div class="detalle-grupo">
                <div class="detalle-item"><label>Procedencia:</label><span>{{ dosajeActual.Procedencia }}</span></div>
                <div class="detalle-item"><label>Examen:</label><span>{{ dosajeActual.Examen }}</span></div>
              </div>
              <div class="detalle-grupo">
                <div class="detalle-item"><label>Nombres:</label><span>{{ dosajeActual.Nombres }}</span></div>
                <div class="detalle-item"><label>Apellidos:</label><span>{{ dosajeActual.Apellidos }}</span></div>
              </div>
              <div class="detalle-grupo">
                <div class="detalle-item"><label>Delito/Infracción:</label><span>{{ dosajeActual.DelitoInfraccion }}</span></div>
                <div class="detalle-item"><label>Como:</label><span>{{ dosajeActual.Como }}</span></div>
              </div>
              <div class="detalle-grupo">
                <div class="detalle-item"><label>Nro Informe Salida:</label><span>{{ dosajeActual.DocSalidaNroInforme }}</span></div>
                <div class="detalle-item"><label>Nro Oficio Salida:</label><span>{{ dosajeActual.DocSalidaDFG }}</span></div>
              </div>
              <div class="detalle-grupo">
                <div class="detalle-item"><label>Fecha Salida:</label><span>{{ formatFecha(dosajeActual.DocSalidaFecha) }}</span></div>
                <div class="detalle-item"><label>Responsable:</label><span>{{ dosajeActual.Responsable }}</span></div>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" @click="cerrarDetalle">Cerrar</button>
            <button v-if="dosajeActual" class="btn btn-primary" @click="editarDosaje(dosajeActual)">Editar</button>
          </div>
        </div>
      </div>
    </div>
    <!-- Modal para crear/editar dosaje (esqueleto) -->
    <Modal v-if="mostrarModal" @close="cerrarModal">
      <div>Formulario Dosaje (en construcción)</div>
    </Modal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import Modal from '../Modal.vue'
import { fetchDosajes } from '../../api/dosajeApi'
import { useAuthStore } from '../../stores/auth'

const dosajes = ref([])
const busqueda = ref('')
const filtroFecha = ref('')
const filtroProcedencia = ref('')
const filtroExamen = ref('')
const mostrarModal = ref(false)
const mostrarDetalle = ref(false)
const dosajeActual = ref(null)
const ordenPor = ref('NumeroRegistro')
const ordenAsc = ref(false)
const paginaActual = ref(1)
const dosajesPorPagina = 10
const authStore = useAuthStore()

onMounted(async () => {
  if (authStore.token) {
    const res = await fetchDosajes(authStore.token)
    dosajes.value = res.data
  }
})

const dosajesFiltrados = computed(() => {
  let filtrados = [...dosajes.value]
  if (busqueda.value) {
    const term = busqueda.value.toLowerCase()
    filtrados = filtrados.filter(d =>
      d.NumeroRegistro?.toString().includes(term) ||
      d.Nombres?.toLowerCase().includes(term) ||
      d.Apellidos?.toLowerCase().includes(term) ||
      d.Procedencia?.toLowerCase().includes(term)
    )
  }
  if (filtroFecha.value) {
    filtrados = filtrados.filter(d => d.FechaIngreso && d.FechaIngreso.startsWith(filtroFecha.value))
  }
  if (filtroProcedencia.value) {
    filtrados = filtrados.filter(d => d.Procedencia?.toLowerCase().includes(filtroProcedencia.value.toLowerCase()))
  }
  if (filtroExamen.value) {
    filtrados = filtrados.filter(d => d.Examen?.toLowerCase().includes(filtroExamen.value.toLowerCase()))
  }
  // Ordenar
  filtrados.sort((a, b) => {
    let valorA = a[ordenPor.value]
    let valorB = b[ordenPor.value]
    if (valorA === null || valorA === undefined) valorA = ''
    if (valorB === null || valorB === undefined) valorB = ''
    // Manejar fechas
    if (ordenPor.value === 'FechaIngreso' || ordenPor.value === 'DocSalidaFecha') {
      valorA = valorA ? new Date(valorA).getTime() : 0
      valorB = valorB ? new Date(valorB).getTime() : 0
    }
    if (valorA < valorB) return ordenAsc.value ? -1 : 1
    if (valorA > valorB) return ordenAsc.value ? 1 : -1
    return 0
  })
  return filtrados
})

const totalPaginas = computed(() => Math.ceil(dosajesFiltrados.value.length / dosajesPorPagina))
const dosajesPaginados = computed(() => {
  const inicio = (paginaActual.value - 1) * dosajesPorPagina
  return dosajesFiltrados.value.slice(inicio, inicio + dosajesPorPagina)
})

function ordenarPor(campo) {
  if (ordenPor.value === campo) {
    ordenAsc.value = !ordenAsc.value
  } else {
    ordenPor.value = campo
    ordenAsc.value = true
  }
}
function iconoOrden(campo) {
  if (ordenPor.value !== campo) return 'fas fa-sort'
  return ordenAsc.value ? 'fas fa-sort-up' : 'fas fa-sort-down'
}
function irPagina(pag) {
  if (pag < 1 || pag > totalPaginas.value) return
  paginaActual.value = pag
}
function abrirModalNuevo() {
  mostrarModal.value = true
}
function cerrarModal() {
  mostrarModal.value = false
}
function verDetalle(dosaje) {
  dosajeActual.value = dosaje
  mostrarDetalle.value = true
}
function cerrarDetalle() {
  mostrarDetalle.value = false
  dosajeActual.value = null
}
function editarDosaje(dosaje) {
  // TODO: mostrar modal edición
  cerrarDetalle()
}
function eliminarDosaje(dosaje) {
  // TODO: eliminar registro
}
function formatFecha(fecha) {
  if (!fecha) return ''
  const d = new Date(fecha)
  if (isNaN(d)) return fecha
  return `${d.getDate().toString().padStart(2, '0')}-${(d.getMonth()+1).toString().padStart(2, '0')}-${d.getFullYear()}`
}
</script>

<style scoped>
.dosaje-table-container {
  width: 100%;
}
.filtros-bar {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  background: #f6f8fa;
  border-radius: 8px;
  padding: 0.75rem 1rem;
  margin-bottom: 1rem;
  box-shadow: 0 1px 3px rgba(0,0,0,0.03);
  flex-wrap: wrap;
  gap: 1rem;
}
.filtros-izq {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}
.filtros-der {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  margin-left: auto;
}
.input-icon {
  position: relative;
  display: flex;
  align-items: center;
}
.input-icon i {
  position: absolute;
  left: 10px;
  color: #b0b8c1;
  font-size: 1rem;
}
.input-icon input {
  padding-left: 2rem;
  border-radius: 6px;
  border: 1px solid #d1d5db;
  background: #fff;
  height: 2.2rem;
  font-size: 1rem;
}
.filtros-bar select,
.filtros-bar input[type='date'] {
  border-radius: 6px;
  border: 1px solid #d1d5db;
  background: #fff;
  height: 2.2rem;
  font-size: 1rem;
  padding: 0 0.75rem;
}
.btn-nuevo {
  background: #16c784;
  color: #fff;
  border: none;
  border-radius: 6px;
  padding: 0.6rem 1.2rem;
  font-weight: 600;
  font-size: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  box-shadow: 0 2px 8px rgba(22,199,132,0.08);
  transition: background 0.2s;
}
.btn-nuevo:hover {
  background: #13a06b;
}
.table-responsive {
  overflow-x: auto;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}
.dosaje-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.95rem;
}
.dosaje-table th,
.dosaje-table td {
  padding: 0.5rem 0.75rem;
  text-align: left;
  border-bottom: 1px solid #e5e7eb;
}
.dosaje-table th {
  background: #f6f8fa;
  font-weight: 600;
  position: sticky;
  top: 0;
  z-index: 2;
}
.dosaje-table th.sortable {
  cursor: pointer;
}
.dosaje-table th.sortable:hover {
  background-color: #e9ecef;
}
.dosaje-table tbody tr:hover {
  background: #f0f4f8;
}
.dosaje-table tr.highlighted {
  background-color: #e9f5ff;
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
.detalle-dosaje {
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
.detalle-item label {
  font-size: 0.8rem;
  color: #6c757d;
  font-weight: 500;
}
.detalle-item.full-width {
  grid-column: 1 / -1;
}
.paginacion-bar {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.3rem;
  margin: 1rem 0;
}
.btn-pag {
  background: #fff;
  border: 1px solid #e1e4e8;
  color: #14532d;
  padding: 0.3rem 0.7rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  transition: background 0.2s, color 0.2s;
}
.btn-pag.activa, .btn-pag:hover {
  background: #14532d;
  color: #fff;
}
</style> 