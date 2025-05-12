<template>
  <div class="documentos-view">
    <h1 class="main-title"><i class="fa-solid fa-file-alt"></i> Recepción de Documentos</h1>
    <div class="acciones-bar">
      <button v-if="puedeCrear" class="btn btn-primary" @click="mostrarFormulario">
        <i :class="mostrarForm ? 'fa-solid fa-xmark' : 'fa-solid fa-plus'" style="margin-right: 6px;"></i>
        {{ mostrarForm ? 'Cancelar' : 'Nuevo Documento' }}
      </button>
    </div>

    <div v-if="mostrarForm" class="formulario-centrado">
      <form @submit.prevent="guardarDocumento" class="formulario-documento-rediseñado card">
        <h2 class="form-title">Nuevo Documento</h2>
        <div class="form-row">
          <div class="form-group">
            <label for="nro-registro">Nro Registro</label>
            <input id="nro-registro" v-model="form.NroRegistro" required />
          </div>
          <div class="form-group">
            <label for="area-derivado">Área Derivado</label>
            <select id="area-derivado" v-model="form.IDAreaActual" required>
              <option value="" disabled>Seleccione un área</option>
              <option v-for="area in areas" :key="area.IDArea" :value="area.IDArea">
                {{ area.NombreArea }}
              </option>
            </select>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label for="fecha-ingreso">Fecha Ingreso doc entrada</label>
            <input id="fecha-ingreso" v-model="form.FechaDocumento" type="date" required />
          </div>
          <div class="form-group">
            <label for="contenido">Contenido</label>
            <textarea id="contenido" v-model="form.Contenido" required />
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label for="tipo-doc-clase">Tipo Doc Entrada (Clase)</label>
            <input id="tipo-doc-clase" v-model="form.OrigenDocumento" required />
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label for="tipo-doc-nro">Tipo Doc Entrada (Nro)</label>
            <input id="tipo-doc-nro" v-model="form.NumeroOficioDocumento" required />
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label for="procedencia">Procedencia</label>
            <input id="procedencia" v-model="form.Procedencia" required />
          </div>
          <div class="form-group">
            <label for="observaciones">Observaciones</label>
            <textarea id="observaciones" v-model="form.Observaciones" />
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label for="estado">Estado</label>
            <select id="estado" v-model="form.Estado" required>
              <option value="" disabled>Seleccione un estado</option>
              <option v-for="estado in ESTADOS_DOCUMENTO" :key="estado" :value="estado">
                {{ estado }}
              </option>
            </select>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label for="tipo-doc-salida">Tipo Doc Salida</label>
            <input id="tipo-doc-salida" v-model="form.TipoDocumentoSalida" />
          </div>
          <div class="form-group">
            <label for="fecha-doc-salida">Fecha doc salida</label>
            <input id="fecha-doc-salida" v-model="form.FechaDocumentoSalida" type="date" />
          </div>
        </div>
        <div class="form-actions-horizontal">
          <button type="submit" class="btn btn-primary">Guardar</button>
          <button type="button" class="btn btn-secondary" @click="mostrarFormulario">Cancelar</button>
        </div>
      </form>
    </div>

    <div class="card docs-table-wrapper">
      <ResponsiveWrapper :documentos="documentos" :areas="areas" :estados="ESTADOS_DOCUMENTO" />
    </div>
    <Modal v-if="mostrarTrazabilidad" @close="cerrarTrazabilidad">
      <TrazabilidadView />
    </Modal>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useAuthStore } from '../stores/auth'
import { fetchDocumentos, createDocumento } from '../api/documentoApi'
import { fetchAreasActivas } from '../api/areaApi'
import ResponsiveWrapper from '../components/ResponsiveWrapper.vue'
import { useRoute, useRouter } from 'vue-router'
import Modal from '../components/Modal.vue'
import TrazabilidadView from './documentos/TrazabilidadView.vue'

const authStore = useAuthStore()
const token = authStore.token
const user = authStore.user
const puedeCrear = user && user.Permisos && (user.Permisos & 1) === 1

const documentos = ref([])
const areas = ref([])
const mostrarForm = ref(false)
const ESTADOS_DOCUMENTO = [
  'En trámite',
  'Finalizado',
  'Observado',
  'Archivado'
]
const form = ref({
  NroRegistro: '', FechaDocumento: '', OrigenDocumento: '', NumeroOficioDocumento: '',
  Procedencia: '', IDAreaActual: '', Contenido: '', Estado: '', IDMesaPartes: 1, IDUsuarioCreador: user?.IDUsuario,
  Observaciones: '', TipoDocumentoSalida: '', FechaDocumentoSalida: ''
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

function mostrarFormulario() {
  mostrarForm.value = !mostrarForm.value
  if (mostrarForm.value) {
    const maxNro = documentos.value.length
      ? Math.max(...documentos.value.map(d => Number(d.NroRegistro) || 0))
      : 0
    form.value = {
      NroRegistro: String(maxNro + 1),
      FechaDocumento: '', OrigenDocumento: '', NumeroOficioDocumento: '',
      Procedencia: '', IDAreaActual: '', Contenido: '', Estado: '', IDMesaPartes: 1, IDUsuarioCreador: user?.IDUsuario,
      Observaciones: '', TipoDocumentoSalida: '', FechaDocumentoSalida: ''
    }
  }
}

async function guardarDocumento() {
  try {
  await createDocumento(form.value, token)
  mostrarForm.value = false
  cargarDocumentos()
  } catch (error) {
    alert('Error al guardar el documento: ' + (error.response?.data?.message || error.message))
  }
}

function fechaDesglosada(fecha) {
  if (!fecha) return ''
  const d = new Date(fecha)
  if (isNaN(d)) return fecha
  return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`
}

onMounted(() => {
  cargarDocumentos()
  cargarAreas()
})

const route = useRoute()
const router = useRouter()
const mostrarTrazabilidad = computed(() => route.name === 'documentos-trazabilidad')

function cerrarTrazabilidad() {
  router.push({ name: 'documentos' })
}
</script>

<style scoped>
.main-title {
  font-size: 1.7rem;
  font-weight: 700;
  color: #184d2b;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  gap: 10px;
}

.acciones-bar {
  margin-bottom: 1.2rem;
  display: flex;
  justify-content: flex-end;
}

.btn-principal {
  background: #2dc76d;
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 0.5rem 1.3rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-principal:hover {
  background: #184d2b;
}

.formulario-centrado {
  display: flex;
  justify-content: center;
  align-items: flex-start;
  width: 100%;
  margin-bottom: 2rem;
}

.formulario-documento-rediseñado {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(44, 62, 80, 0.07);
  padding: 2rem 2.5rem 1.5rem 2.5rem;
  max-width: 800px;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
}

.form-title {
  color: #184d2b;
  font-size: 1.3rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
  text-align: left;
}

.form-row {
  display: flex;
  gap: 1.5rem;
}

.form-group {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.form-group label {
  font-weight: 600;
  color: #184d2b;
  font-size: 0.97rem;
}

.form-group input,
.form-group textarea {
  padding: 0.45rem 0.7rem;
  border: 1px solid #e1e1e1;
  border-radius: 6px;
  font-size: 1rem;
  background: #fafbfa;
  transition: border 0.2s;
}

.form-group input:focus,
.form-group textarea:focus {
  border: 1.5px solid #2dc76d;
  outline: none;
}

.form-group textarea {
  min-height: 38px;
  resize: vertical;
}

.form-actions-horizontal {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 0.5rem;
}

.btn-cerrar {
  background: #e74c3c;
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 0.5rem 1.3rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-cerrar:hover {
  background: #c0392b;
}

.docs-table-wrapper {
  width: 100%;
  overflow-x: auto;
  margin-bottom: 1.5rem;
}

.docs-table {
  min-width: 1200px;
  width: 100%;
  border-collapse: collapse;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(44, 62, 80, 0.07);
  overflow: hidden;
}

.docs-table th,
.docs-table td {
  border: 1px solid #e0e0e0;
  padding: 8px 12px;
  text-align: left;
}

.docs-table th {
  background: #e8f5e9;
  color: #184d2b;
  font-weight: 700;
}
</style> 