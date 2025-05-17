<template>
  <div class="auditoria-view">
    <h1 class="main-title">
      <i class="fa-solid fa-clipboard-list"></i> Auditoría del Sistema
    </h1>
    <AuditFilters :filtros="filtros" @buscar="onBuscar" :loading="loading" />

    <div class="table-container">
      <table class="log-table">
        <thead>
          <tr>
            <th v-for="col in columns" :key="col.key" :class="{ sticky: true }">
              {{ col.label }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading">
            <td :colspan="columns.length" class="loading-row">
              <i class="fa fa-spinner fa-spin"></i> Cargando registros...
            </td>
          </tr>
          <tr v-else-if="logs.length === 0">
            <td :colspan="columns.length" class="empty-row">
              <i class="fa fa-info-circle"></i> No se encontraron registros
            </td>
          </tr>
          <tr v-for="row in logs" :key="row.IDLog" class="log-row" @mouseover="hovered = row.IDLog" @mouseleave="hovered = null" :class="{ hovered: hovered === row.IDLog }">
            <td v-for="col in columns" :key="col.key">
              <template v-if="col.key === 'detalles'">
                <button class="btn-detalles" @click="verDetalles(row)">
                  <i class="fa-solid fa-eye"></i> Detalles
                </button>
              </template>
              <template v-else-if="col.key === 'Exitoso'">
                <span :class="row.Exitoso ? 'success' : 'fail'">
                  <i :class="row.Exitoso ? 'fa fa-check-circle' : 'fa fa-times-circle'"></i>
                  {{ row.Exitoso ? 'Sí' : 'No' }}
                </span>
              </template>
              <template v-else-if="col.key === 'FechaEvento'">
                {{ formatDate(row.FechaEvento) }}
              </template>
              <template v-else>
                {{ row[col.key] }}
              </template>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div class="pagination-bar">
      <button :disabled="page === 1 || loading" @click="cambiarPagina(page - 1)">
        <i class="fa fa-angle-left"></i>
      </button>
      <span>Página {{ page }}</span>
      <button :disabled="!hasMore || loading" @click="cambiarPagina(page + 1)">
        <i class="fa fa-angle-right"></i>
      </button>
    </div>
    <Modal v-if="showModal" @close="cerrarModal">
      <template #header>
        <i class="fa-solid fa-file-alt"></i> Detalles del Log
      </template>
      <template #body>
        <div class="detalles-table-wrapper">
          <table class="detalles-table">
            <tbody>
              <tr v-for="(valor, clave) in logSeleccionado" :key="clave">
                <td><strong>{{ clave }}</strong></td>
                <td>{{ valor }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </template>
      <template #footer>
        <button class="btn-cerrar" @click="cerrarModal">
          <i class="fa fa-times"></i> Cerrar
        </button>
      </template>
    </Modal>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useAuthStore } from '../stores/auth'
import { fetchUsuarioLogs } from '../api/auditApi'
import Modal from '../components/Modal.vue'
import AuditFilters from '../components/AuditFilters.vue'

const authStore = useAuthStore()
const token = computed(() => authStore.token)

const filtros = ref({ usuarioId: '', tipoEvento: '', fechaInicio: '', fechaFin: '' })
const logs = ref([])
const page = ref(1)
const pageSize = 20
const hasMore = ref(false)
const loading = ref(false)
const hovered = ref(null)

const columns = [
  { key: 'IDLog', label: 'ID' },
  { key: 'IDUsuario', label: 'Usuario' },
  { key: 'TipoEvento', label: 'Evento' },
  { key: 'IPOrigen', label: 'IP' },
  { key: 'FechaEvento', label: 'Fecha' },
  { key: 'Exitoso', label: 'Éxito' },
  { key: 'detalles', label: 'Detalles' }
]

const showModal = ref(false)
const logSeleccionado = ref(null)

function verDetalles(log) {
  logSeleccionado.value = log
  showModal.value = true
}
function cerrarModal() {
  showModal.value = false
  logSeleccionado.value = null
}

function formatDate(fecha) {
  if (!fecha) return ''
  const d = new Date(fecha)
  if (isNaN(d)) return fecha
  return d.toLocaleString()
}

async function buscarLogs() {
  loading.value = true
  try {
    const { usuarioId, tipoEvento, fechaInicio, fechaFin } = filtros.value
    const res = await fetchUsuarioLogs({
      token: token.value,
      usuarioId,
      tipoEvento,
      fechaInicio,
      fechaFin,
      page: page.value,
      pageSize
    })
    logs.value = res.data
    hasMore.value = res.data.length === pageSize
  } catch (e) {
    logs.value = []
    hasMore.value = false
  } finally {
    loading.value = false
  }
}

function cambiarPagina(nuevaPagina) {
  if (nuevaPagina < 1) return
  page.value = nuevaPagina
  buscarLogs()
}

function onBuscar() {
  page.value = 1
  buscarLogs()
}

buscarLogs()
</script>

<style scoped>
.auditoria-view {
  padding: 2.5rem 1.5rem 2rem 1.5rem;
  max-width: 1200px;
  margin: 0 auto;
}
.main-title {
  font-size: 2rem;
  font-weight: 700;
  color: #1a3c2b;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.7rem;
}
.table-container {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(44,62,80,0.07);
  overflow-x: auto;
  margin-bottom: 1.2rem;
}
.log-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 800px;
}
.log-table th {
  background: #f4f7fa;
  font-weight: 600;
  padding: 0.7rem 1rem;
  border-bottom: 2px solid #e1e1e1;
  position: sticky;
  top: 0;
  z-index: 2;
}
.log-table td {
  padding: 0.6rem 1rem;
  border-bottom: 1px solid #f0f0f0;
  font-size: 1rem;
}
.log-row {
  transition: background 0.15s;
}
.log-row.hovered {
  background: #f0f7f4;
}
.log-table tr:nth-child(even) {
  background: #fafbfc;
}
.loading-row, .empty-row {
  text-align: center;
  color: #888;
  font-size: 1.1rem;
  padding: 2rem 0;
}
.success {
  color: #27ae60;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.3rem;
}
.fail {
  color: #e74c3c;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.3rem;
}
.btn-detalles {
  background: #2980b9;
  color: #fff;
  border: none;
  border-radius: 6px;
  padding: 0.35rem 1.1rem;
  cursor: pointer;
  font-size: 0.97rem;
  transition: background 0.15s;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.btn-detalles:hover {
  background: #145a86;
}
.pagination-bar {
  display: flex;
  gap: 1.2rem;
  align-items: center;
  justify-content: flex-end;
  margin-bottom: 1.5rem;
}
.pagination-bar button {
  background: #f4f7fa;
  border: none;
  border-radius: 6px;
  padding: 0.4rem 1.1rem;
  font-size: 1.1rem;
  cursor: pointer;
  transition: background 0.15s;
}
.pagination-bar button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.detalles-table-wrapper {
  background: #fff;
  border-radius: 18px;
  box-shadow: 0 2px 8px rgba(44,62,80,0.10);
  padding: 1.1rem 1.2rem 1.1rem 1.2rem;
  margin-bottom: 1.2rem;
  max-height: 60vh;
  overflow-y: auto;
}
.detalles-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  background: transparent;
}
.detalles-table td {
  border-bottom: 1px solid #e1e1e1;
  padding: 0.4rem 0.7rem;
  background: transparent;
}
.detalles-table tr:last-child td {
  border-bottom: none;
}
.btn-cerrar {
  background: #e74c3c;
  color: #fff;
  border: none;
  border-radius: 6px;
  padding: 0.5rem 1.2rem;
  cursor: pointer;
  font-size: 1rem;
  align-self: flex-end;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.btn-cerrar:hover {
  background: #c0392b;
}
</style> 