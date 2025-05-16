<template>
  <div class="documentos-view">
    <h1 class="main-title"><i class="fa-solid fa-file-alt"></i> Recepción de Documentos</h1>

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
        <div class="form-row">
          <div class="form-group file-upload-group">
            <label for="archivos">Archivos Adjuntos</label>
            <div class="file-upload-container">
              <input 
                type="file" 
                id="archivos" 
                multiple 
                @change="handleFileUpload" 
                accept="image/*,.pdf,.doc,.docx"
                class="file-input"
              />
              <div class="file-upload-label">
                <i class="fa-solid fa-cloud-upload-alt"></i>
                <span>Arrastra archivos aquí o haz clic para seleccionar</span>
              </div>
            </div>
            <div v-if="archivosSeleccionados.length > 0" class="archivos-preview">
              <div v-for="(archivo, index) in archivosSeleccionados" 
                   :key="index" 
                   class="archivo-item">
                <div class="archivo-info">
                  <i :class="getFileIcon(archivo.type)"></i>
                  <span class="archivo-nombre">{{ archivo.name }}</span>
                  <span class="archivo-tamano">({{ formatFileSize(archivo.size) }})</span>
                </div>
                <button type="button" 
                        class="btn-eliminar" 
                        @click="eliminarArchivo(index)">
                  <i class="fa-solid fa-times"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
        <div class="form-actions-horizontal">
          <button type="submit" class="btn btn-primary">Guardar</button>
          <button type="button" class="btn btn-secondary" @click="mostrarFormulario">Cancelar</button>
        </div>
      </form>
    </div>

    <div class="card docs-table-wrapper">
      <ResponsiveWrapper 
        :documentos="documentos" 
        :areas="areas" 
        :estados="ESTADOS_DOCUMENTO" 
        @nuevo-documento="mostrarFormulario" 
        @editar="editarDocumento" 
      />
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

const archivosSeleccionados = ref([])

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

function handleFileUpload(event) {
  const files = Array.from(event.target.files)
  archivosSeleccionados.value = [...archivosSeleccionados.value, ...files]
}

function eliminarArchivo(index) {
  archivosSeleccionados.value.splice(index, 1)
}

function getFileIcon(type) {
  if (type.startsWith('image/')) return 'fa-solid fa-image'
  if (type === 'application/pdf') return 'fa-solid fa-file-pdf'
  if (type.includes('word')) return 'fa-solid fa-file-word'
  return 'fa-solid fa-file'
}

function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

async function guardarDocumento() {
  try {
    const formData = new FormData()
    
    // Agregar datos del formulario
    Object.keys(form.value).forEach(key => {
      formData.append(key, form.value[key])
    })
    
    // Agregar archivos
    archivosSeleccionados.value.forEach(archivo => {
      formData.append('archivos', archivo)
    })
    
    await createDocumento(formData, token)
  mostrarForm.value = false
    archivosSeleccionados.value = []
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

function editarDocumento(documento) {
  form.value = { ...documento };
  mostrarForm.value = true;
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
  border-radius: 18px;
  box-shadow: 0 4px 24px rgba(44, 62, 80, 0.10);
  padding: 2.5rem 2.5rem 2rem 2.5rem;
  max-width: 700px;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin: 0 auto;
}

.form-title {
  color: #14532d;
  font-size: 1.5rem;
  font-weight: 800;
  margin-bottom: 1.2rem;
  letter-spacing: 0.5px;
}

.form-row {
  display: flex;
  gap: 1.5rem;
  flex-wrap: wrap;
}

.form-group {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  min-width: 180px;
}

.form-group label {
  font-weight: 600;
  color: #2dc76d;
  font-size: 1rem;
  margin-bottom: 0.1rem;
  letter-spacing: 0.2px;
}

.form-group input,
.form-group textarea,
.form-group select {
  padding: 0.7rem 1rem;
  border: 1.5px solid #e1e1e1;
  border-radius: 8px;
  font-size: 1.05rem;
  background: #f8fafc;
  transition: border 0.2s, box-shadow 0.2s;
  outline: none;
}

.form-group input:focus,
.form-group textarea:focus,
.form-group select:focus {
  border: 1.5px solid #2dc76d;
  box-shadow: 0 0 0 2px #e6f9ef;
}

.form-group textarea {
  min-height: 40px;
  resize: vertical;
}

.form-actions-horizontal {
  display: flex;
  gap: 1.2rem;
  justify-content: flex-end;
  margin-top: 1.2rem;
}

.btn {
  border: none;
  border-radius: 8px;
  padding: 0.7rem 2.2rem;
  font-size: 1.1rem;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.2s, box-shadow 0.2s;
  box-shadow: 0 2px 8px rgba(44, 62, 80, 0.07);
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.btn-primary {
  background: #2dc76d;
  color: #fff;
}

.btn-primary:hover {
  background: #14532d;
}

.btn-secondary {
  background: #e1e1e1;
  color: #14532d;
}

.btn-secondary:hover {
  background: #cfd8dc;
  color: #184d2b;
}

@media (max-width: 900px) {
  .formulario-documento-rediseñado {
    padding: 1.2rem 0.7rem 1.2rem 0.7rem;
  }
  .form-row {
    flex-direction: column;
    gap: 0.7rem;
  }
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

.file-upload-group {
  width: 100%;
}

.file-upload-container {
  position: relative;
  border: 2px dashed #2dc76d;
  border-radius: 8px;
  padding: 2rem;
  text-align: center;
  background: #f8fafc;
  transition: all 0.3s ease;
}

.file-upload-container:hover {
  background: #e6f9ef;
  border-color: #14532d;
}

.file-input {
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  opacity: 0;
  cursor: pointer;
}

.file-upload-label {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  color: #14532d;
}

.file-upload-label i {
  font-size: 2rem;
  color: #2dc76d;
}

.archivos-preview {
  margin-top: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.archivo-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem;
  background: #f8fafc;
  border-radius: 6px;
  border: 1px solid #e1e1e1;
}

.archivo-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.archivo-info i {
  color: #2dc76d;
}

.archivo-nombre {
  font-weight: 500;
  color: #14532d;
}

.archivo-tamano {
  color: #666;
  font-size: 0.9rem;
}

.btn-eliminar {
  background: none;
  border: none;
  color: #dc2626;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.btn-eliminar:hover {
  background: #fee2e2;
}

@media (max-width: 900px) {
  .file-upload-container {
    padding: 1rem;
  }
  
  .archivo-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
  
  .btn-eliminar {
    align-self: flex-end;
  }
}
</style> 