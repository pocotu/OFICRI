<template>
  <div class="auditoria-view">
    <h1>Auditoría del Sistema</h1>
    <div class="auditoria-filtros">
      <label>
        Usuario:
        <input v-model="filtros.usuarioId" type="number" min="1" placeholder="ID Usuario" />
      </label>
      <label>
        Tipo de Evento:
        <input v-model="filtros.tipoEvento" placeholder="Tipo de Evento" />
      </label>
      <label>
        Fecha Inicio:
        <input v-model="filtros.fechaInicio" type="date" />
      </label>
      <label>
        Fecha Fin:
        <input v-model="filtros.fechaFin" type="date" />
      </label>
      <button @click="buscarLogs">Buscar</button>
    </div>
    <table class="log-table">
      <thead>
        <tr>
          <th v-for="col in columns" :key="col.key">{{ col.label }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in logs" :key="row.IDLog">
          <td v-for="col in columns" :key="col.key">
            <template v-if="col.key === 'detalles'">
              <button class="btn-detalles" @click="verDetalles(row)">Ver detalles</button>
            </template>
            <template v-else>
              {{ row[col.key] }}
            </template>
          </td>
        </tr>
      </tbody>
    </table>
    <div class="pagination">
      <button :disabled="page === 1" @click="cambiarPagina(page - 1)">Anterior</button>
      <span>Página {{ page }}</span>
      <button :disabled="!hasMore" @click="cambiarPagina(page + 1)">Siguiente</button>
    </div>
    <div v-if="showModal" class="modal">
      <div class="modal-content">
        <h2>Detalles del Log</h2>
        <table class="detalles-table">
          <tbody>
            <tr v-for="(valor, clave) in logSeleccionado" :key="clave">
              <td><strong>{{ clave }}</strong></td>
              <td>{{ valor }}</td>
            </tr>
          </tbody>
        </table>
        <button class="btn-cerrar" @click="cerrarModal">Cerrar</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useAuthStore } from '../stores/auth'
import { fetchUsuarioLogs } from '../api/auditApi'
import LogTable from '../components/LogTable.vue'

const authStore = useAuthStore()
const token = computed(() => authStore.token)

const filtros = ref({ usuarioId: '', tipoEvento: '', fechaInicio: '', fechaFin: '' })
const logs = ref([])
const page = ref(1)
const pageSize = 20
const hasMore = ref(false)

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

async function buscarLogs() {
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
}

function cambiarPagina(nuevaPagina) {
  page.value = nuevaPagina
  buscarLogs()
}

buscarLogs()
</script>

<style scoped>
.auditoria-view {
  padding: 2rem 1.5rem;
}
.auditoria-filtros {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
}
.auditoria-filtros label {
  display: flex;
  flex-direction: column;
  font-size: 1rem;
}
.auditoria-filtros input {
  padding: 0.4rem 0.7rem;
  border-radius: 6px;
  border: 1px solid #e1e1e1;
  margin-top: 0.2rem;
}
.auditoria-filtros button {
  padding: 0.5rem 1.2rem;
  border-radius: 6px;
  background: #2dc76d;
  color: #fff;
  border: none;
  font-weight: 500;
  cursor: pointer;
}
.log-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 1rem;
}
.log-table th, .log-table td {
  border: 1px solid #e1e1e1;
  padding: 0.5rem 1rem;
  text-align: left;
}
.btn-detalles {
  background: #2980b9;
  color: #fff;
  border: none;
  border-radius: 6px;
  padding: 0.3rem 1rem;
  cursor: pointer;
  font-size: 0.95rem;
}
.btn-detalles:hover {
  background: #145a86;
}
.pagination {
  display: flex;
  gap: 1rem;
  align-items: center;
}
.modal {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.modal-content {
  background: #fff;
  padding: 2.5rem 2rem 2rem 2rem;
  border-radius: 18px;
  min-width: 320px;
  max-width: 400px;
  max-height: 80vh;
  box-shadow: 0 4px 24px rgba(44, 62, 80, 0.13);
  display: flex;
  flex-direction: column;
  align-items: stretch;
  overflow-y: auto;
}
.detalles-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 1.2rem;
}
.detalles-table td {
  border: 1px solid #e1e1e1;
  padding: 0.4rem 0.7rem;
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
}
.btn-cerrar:hover {
  background: #c0392b;
}
</style> 