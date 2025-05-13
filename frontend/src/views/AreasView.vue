<template>
  <div class="areas-view">
    <h1 class="main-title"><i class="fa-solid fa-building"></i> Gestión de Áreas</h1>
    <div v-if="loading" class="loading">Cargando...</div>
    <div v-else>
      <div class="acciones-bar">
        <button v-if="esAdmin" class="btn-principal" @click="abrirModalNueva">+ Nueva Área</button>
      </div>
      <table class="areas-table">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Código</th>
            <th>Tipo</th>
            <th>Descripción</th>
            <th>Estado</th>
            <th v-if="esAdmin">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="area in areas" :key="area.IDArea">
            <td>{{ area.NombreArea }}</td>
            <td>{{ area.CodigoIdentificacion }}</td>
            <td>{{ area.TipoArea }}</td>
            <td>{{ area.Descripcion }}</td>
            <td>
              <span :class="['estado-chip', area.IsActive ? 'activo' : 'inactivo']">
                {{ area.IsActive ? 'Activa' : 'Inactiva' }}
              </span>
            </td>
            <td v-if="esAdmin">
              <button class="btn-accion editar" @click="abrirModalEditar(area)"><i class="fa-solid fa-pen"></i></button>
              <button class="btn-accion eliminar" @click="confirmarEliminar(area)"><i class="fa-solid fa-trash"></i></button>
            </td>
          </tr>
        </tbody>
      </table>
      <div v-if="modalAbierto" class="modal-area" @click.self="cerrarModal">
        <div class="modal-area-content">
          <h2>{{ areaEdit ? 'Editar Área' : 'Nueva Área' }}</h2>
          <form @submit.prevent="guardarArea">
            <label>Nombre:<input v-model="form.NombreArea" required maxlength="100" /></label>
            <label>Código:<input v-model="form.CodigoIdentificacion" required maxlength="50" /></label>
            <label>Tipo:<input v-model="form.TipoArea" required maxlength="50" /></label>
            <label>Descripción:<textarea v-model="form.Descripcion" maxlength="255" /></label>
            <label v-if="areaEdit">Estado:
              <select v-model="form.IsActive">
                <option :value="1">Activa</option>
                <option :value="0">Inactiva</option>
              </select>
            </label>
            <div class="modal-acciones">
              <button type="submit" class="btn-principal">Guardar</button>
              <button type="button" class="btn-cerrar" @click="cerrarModal">Cancelar</button>
            </div>
          </form>
        </div>
      </div>
      <div v-if="areaAEliminar" class="modal-area" @click.self="areaAEliminar = null">
        <div class="modal-area-content">
          <h2>¿Eliminar área?</h2>
          <p>Esta acción no se puede deshacer.</p>
          <div class="modal-acciones">
            <button class="btn-cerrar" @click="areaAEliminar = null">Cancelar</button>
            <button class="btn-principal eliminar" @click="eliminarArea">Eliminar</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAuthStore } from '../stores/auth'
import { fetchAreas, createArea, updateArea, deleteArea } from '../api/userApi'

const authStore = useAuthStore()
const token = authStore.token
const user = authStore.user
const esAdmin = user && user.Permisos && (user.Permisos & 128) === 128

const areas = ref([])
const loading = ref(true)
const modalAbierto = ref(false)
const areaEdit = ref(null)
const areaAEliminar = ref(null)
const form = ref({ NombreArea: '', CodigoIdentificacion: '', TipoArea: '', Descripcion: '', IsActive: 1 })

function cargarAreas() {
  loading.value = true
  fetchAreas(token).then(res => {
    areas.value = res.data
  }).finally(() => loading.value = false)
}
function abrirModalNueva() {
  areaEdit.value = null
  form.value = { NombreArea: '', CodigoIdentificacion: '', TipoArea: '', Descripcion: '', IsActive: 1 }
  modalAbierto.value = true
}
function abrirModalEditar(area) {
  areaEdit.value = area
  form.value = { ...area }
  modalAbierto.value = true
}
function cerrarModal() {
  modalAbierto.value = false
  areaEdit.value = null
}
async function guardarArea() {
  if (!form.value.NombreArea || !form.value.CodigoIdentificacion || !form.value.TipoArea) return
  loading.value = true
  try {
    if (areaEdit.value) {
      await updateArea(areaEdit.value.IDArea, form.value, token)
    } else {
      await createArea(form.value, token)
    }
    cerrarModal()
    cargarAreas()
  } finally {
    loading.value = false
  }
}
function confirmarEliminar(area) {
  areaAEliminar.value = area
}
async function eliminarArea() {
  if (!areaAEliminar.value) return
  loading.value = true
  try {
    await deleteArea(areaAEliminar.value.IDArea, token)
    areaAEliminar.value = null
    cargarAreas()
  } finally {
    loading.value = false
  }
}
onMounted(cargarAreas)
</script>

<style scoped>
@import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css');
.areas-view {
  padding: 24px 16px 18px 16px;
  background: #f7f9fa;
}
.main-title {
  font-size: 2rem;
  font-weight: 700;
  color: #184d2b;
  margin-bottom: 2rem;
  display: flex;
  align-items: center;
  gap: 12px;
}
.acciones-bar {
  margin-bottom: 1.5rem;
  display: flex;
  justify-content: flex-end;
}
.btn-principal {
  background: #2dc76d;
  color: #fff;
  border: none;
  border-radius: 10px;
  padding: 0.6rem 1.5rem;
  font-size: 1.08rem;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(44, 62, 80, 0.07);
  transition: background 0.2s, box-shadow 0.2s;
}
.btn-principal:hover {
  background: #184d2b;
  box-shadow: 0 4px 16px rgba(44, 62, 80, 0.13);
}
.areas-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 2px 8px rgba(44, 62, 80, 0.07);
  overflow: hidden;
}
.areas-table th {
  background: #e8f5e9;
  color: #184d2b;
  font-weight: 800;
  font-size: 1.08em;
  padding: 12px 14px;
  border-bottom: 2px solid #2dc76d;
}
.areas-table td {
  padding: 10px 14px;
  border-bottom: 1px solid #e0e0e0;
  font-size: 1.01em;
}
.areas-table tr:nth-child(even) td {
  background: #f7f9fa;
}
.areas-table tr:last-child td {
  border-bottom: none;
}
.estado-chip {
  display: inline-block;
  padding: 3px 16px;
  border-radius: 12px;
  font-size: 1em;
  font-weight: 700;
  letter-spacing: 0.5px;
  box-shadow: 0 1px 2px rgba(44, 62, 80, 0.04);
}
.activo {
  background: #e8f5e9;
  color: #2dc76d;
  border: 1.5px solid #2dc76d;
}
.inactivo {
  background: #fbe9e7;
  color: #e74c3c;
  border: 1.5px solid #e74c3c;
}
.btn-accion {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.15em;
  margin: 0 4px;
  padding: 5px 8px;
  border-radius: 7px;
  transition: background 0.2s, color 0.2s;
  position: relative;
}
.btn-accion.editar:hover {
  background: #e8f5e9;
  color: #184d2b;
}
.btn-accion.eliminar:hover {
  background: #fbe9e7;
  color: #e74c3c;
}
.btn-accion[title]:hover::after {
  content: attr(title);
  position: absolute;
  left: 50%;
  top: 110%;
  transform: translateX(-50%);
  background: #184d2b;
  color: #fff;
  padding: 2px 10px;
  border-radius: 6px;
  font-size: 0.95em;
  white-space: nowrap;
  z-index: 10;
  pointer-events: none;
}
.modal-area {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.18);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.modal-area-content {
  background: #fff;
  padding: 2rem 2.2rem 1.5rem 2.2rem;
  border-radius: 18px;
  min-width: 260px;
  max-width: 400px;
  box-shadow: 0 4px 24px rgba(44, 62, 80, 0.13);
  display: flex;
  flex-direction: column;
  align-items: stretch;
}
.modal-area-content h2 {
  margin: 0 0 1rem 0;
  color: #184d2b;
  font-size: 1.25rem;
  display: flex;
  align-items: center;
  gap: 8px;
}
.modal-area-content label {
  font-weight: 600;
  color: #184d2b;
  margin-bottom: 0.3rem;
  display: flex;
  flex-direction: column;
  font-size: 1em;
}
.modal-area-content input, .modal-area-content textarea, .modal-area-content select {
  margin-top: 2px;
  margin-bottom: 0.7rem;
  padding: 0.4rem 0.7rem;
  border-radius: 7px;
  border: 1px solid #e1e1e1;
  font-size: 1em;
}
.modal-acciones {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 1.2rem;
}
.btn-cerrar {
  background: #e74c3c;
  color: #fff;
  border: none;
  border-radius: 7px;
  padding: 0.5rem 1.2rem;
  cursor: pointer;
  font-size: 1rem;
  align-self: flex-end;
  font-weight: 600;
}
.btn-cerrar:hover {
  background: #c0392b;
}
.loading {
  font-size: 1.2em;
  color: #888;
  margin-top: 2rem;
}
@media (max-width: 900px) {
  .areas-view {
    padding: 10px 2px 10px 2px;
  }
  .areas-table th, .areas-table td {
    padding: 6px 6px;
    font-size: 0.97em;
  }
  .modal-area-content {
    min-width: 0;
    max-width: 98vw;
    padding: 1.2rem 0.7rem 1rem 0.7rem;
  }
}
</style> 