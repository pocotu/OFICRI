<template>
  <div class="table-responsive">
    <table class="table">
      <thead>
        <tr>
          <th>Nro Registro</th>
          <th>Fecha Ingreso</th>
          <th class="hide-mobile">Tipo Doc</th>
          <th class="hide-mobile">Nro Doc</th>
          <th class="hide-mobile">Fecha Doc</th>
          <th class="hide-mobile">Procedencia</th>
          <th class="hide-mobile">Área</th>
          <th class="hide-mobile">Contenido</th>
          <th class="hide-mobile">Tipo Salida</th>
          <th class="hide-mobile">Fecha Salida</th>
          <th class="hide-mobile">Observaciones</th>
          <th class="hide-mobile">Estado</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="doc in documentos" :key="doc.IDDocumento">
          <td>{{ doc.NroRegistro }}</td>
          <td>
            <template v-if="editRowId === doc.IDDocumento">
              <input v-model="editRowData.FechaDocumento" type="date" class="edit-input" />
            </template>
            <template v-else>
              {{ fechaDesglosada(doc.FechaDocumento) }}
            </template>
          </td>
          <td class="hide-mobile">
            <template v-if="editRowId === doc.IDDocumento">
              <input v-model="editRowData.OrigenDocumento" class="edit-input" />
            </template>
            <template v-else>
              {{ doc.OrigenDocumento }}
            </template>
          </td>
          <td class="hide-mobile">
            <template v-if="editRowId === doc.IDDocumento">
              <input v-model="editRowData.NumeroOficioDocumento" class="edit-input" />
            </template>
            <template v-else>
              {{ doc.NumeroOficioDocumento }}
            </template>
          </td>
          <td class="hide-mobile">
            <template v-if="editRowId === doc.IDDocumento">
              <input v-model="editRowData.FechaDocumento" type="date" class="edit-input" />
            </template>
            <template v-else>
              {{ fechaDesglosada(doc.FechaDocumento) }}
            </template>
          </td>
          <td class="hide-mobile">
            <template v-if="editRowId === doc.IDDocumento">
              <input v-model="editRowData.Procedencia" class="edit-input" />
            </template>
            <template v-else>
              {{ doc.Procedencia }}
            </template>
          </td>
          <td class="hide-mobile">
            <template v-if="editRowId === doc.IDDocumento">
              <select v-if="areaOptions.length" v-model="editRowData.IDAreaActual" class="edit-input">
                <option v-for="area in areaOptions" :key="area.IDArea" :value="area.IDArea">{{ area.NombreArea }}</option>
              </select>
              <input v-else v-model="editRowData.IDAreaActual" class="edit-input" />
            </template>
            <template v-else>
              {{ areaOptions.find(a => a.IDArea == doc.IDAreaActual)?.NombreArea || doc.IDAreaActual }}
            </template>
          </td>
          <td class="hide-mobile">
            <template v-if="editRowId === doc.IDDocumento">
              <input v-model="editRowData.Contenido" class="edit-input" />
            </template>
            <template v-else>
              {{ doc.Contenido }}
            </template>
          </td>
          <td class="hide-mobile">
            <template v-if="editRowId === doc.IDDocumento">
              <input v-model="editRowData.TipoDocumentoSalida" class="edit-input" />
            </template>
            <template v-else>
              {{ doc.TipoDocumentoSalida }}
            </template>
          </td>
          <td class="hide-mobile">
            <template v-if="editRowId === doc.IDDocumento">
              <input v-model="editRowData.FechaDocumentoSalida" type="date" class="edit-input" />
            </template>
            <template v-else>
              {{ fechaDesglosada(doc.FechaDocumentoSalida) }}
            </template>
          </td>
          <td class="hide-mobile">
            <template v-if="editRowId === doc.IDDocumento">
              <input v-model="editRowData.Observaciones" class="edit-input" />
            </template>
            <template v-else>
              {{ doc.Observaciones }}
            </template>
          </td>
          <td class="hide-mobile">
            <template v-if="editRowId === doc.IDDocumento">
              <select v-if="estadoOptions.length" v-model="editRowData.Estado" class="edit-input">
                <option v-for="estado in estadoOptions" :key="estado" :value="estado">{{ estado }}</option>
              </select>
              <input v-else v-model="editRowData.Estado" class="edit-input" />
            </template>
            <template v-else>
              {{ doc.EstadoNombre || 'Desconocido' }}
            </template>
          </td>
          <td>
            <template v-if="editRowId === doc.IDDocumento">
              <button class="action-btn save" @click="saveEdit(doc)"><i class="fa-solid fa-check"></i></button>
              <button class="action-btn cancel" @click="cancelEdit"><i class="fa-solid fa-xmark"></i></button>
            </template>
            <template v-else>
              <button class="action-btn" @click="$emit('show-details', doc)"><i class="fa-solid fa-eye"></i></button>
              <button class="action-btn edit" @click="startEdit(doc)"><i class="fa-solid fa-pen"></i></button>
              <button class="action-btn trace" @click="verTrazabilidad(doc.IDDocumento)" :title="'Ver trazabilidad del documento #' + doc.NroRegistro">
                <i class="fa-solid fa-route"></i>
              </button>
            </template>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useAuthStore } from '../stores/auth'
import { updateDocumento } from '../api/documentoApi'
import { useRouter } from 'vue-router'

const props = defineProps({
  documentos: {
    type: Array,
    required: true
  },
  areas: {
    type: Array,
    required: false,
    default: () => []
  },
  estados: {
    type: Array,
    required: false,
    default: () => []
  }
})

const authStore = useAuthStore()
const token = authStore.token
const router = useRouter()

const editRowId = ref(null)
const editRowData = ref({})

function startEdit(doc) {
  editRowId.value = doc.IDDocumento
  editRowData.value = { ...doc }
}

function cancelEdit() {
  editRowId.value = null
  editRowData.value = {}
}

async function saveEdit(doc) {
  try {
    await updateDocumento(doc.IDDocumento, editRowData.value, token)
    editRowId.value = null
    editRowData.value = {}
    emits('update')
  } catch (e) {
    alert('Error al guardar: ' + (e.response?.data?.message || e.message))
  }
}

const emits = defineEmits(['update'])

function fechaDesglosada(fecha) {
  if (!fecha) return ''
  const d = new Date(fecha)
  if (isNaN(d)) return fecha
  return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`
}

const areaOptions = computed(() => props.areas || [])
const estadoOptions = computed(() => props.estados || [])

function verTrazabilidad(id) {
  if (!id || isNaN(Number(id))) {
    alert('ID de documento no válido para trazabilidad.')
    return
  }
  router.push({ 
    name: 'documentos-trazabilidad', 
    query: { id: String(id) }
  })
}
</script>

<style scoped>
.table-responsive {
  width: 100%;
  overflow-x: auto;
  margin-bottom: 1rem;
}

.table {
  width: 100%;
  border-collapse: collapse;
  min-width: 1000px;
}

.table th,
.table td {
  padding: 0.75rem;
  text-align: left;
  border-bottom: 1px solid #e1e1e1;
}

.table th {
  background: #f8f9fa;
  font-weight: 600;
  color: #14532d;
  white-space: nowrap;
}

.table tbody tr:hover {
  background: #f8f9fa;
}

.action-btn {
  background: #14532d;
  color: #fff;
  border: none;
  padding: 0.5rem;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.2s;
}

.action-btn:hover {
  background: #0f492e;
}

.hide-mobile {
  display: table-cell;
}

@media (max-width: 768px) {
  .hide-mobile {
    display: none;
  }
  
  .table {
    min-width: 600px;
  }
}

.edit-input {
  width: 100%;
  padding: 0.3rem 0.5rem;
  border: 1px solid #b0c4b1;
  border-radius: 4px;
  font-size: 1rem;
}
.action-btn.edit {
  background: #f7c948;
  color: #fff;
}
.action-btn.edit:hover {
  background: #e1b200;
}
.action-btn.save {
  background: #2dc76d;
  color: #fff;
}
.action-btn.save:hover {
  background: #184d2b;
}
.action-btn.cancel {
  background: #e74c3c;
  color: #fff;
}
.action-btn.cancel:hover {
  background: #c0392b;
}
.action-btn.trace {
  background: #2dc76d;
}
.action-btn.trace:hover {
  background: #22a55e;
}
</style> 