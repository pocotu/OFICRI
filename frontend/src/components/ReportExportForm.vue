<template>
  <div class="export-form-card">
    <h2 class="export-title">Reportes y Exportación</h2>
    <form @submit.prevent="onExport" class="export-form">
      <div class="form-group">
        <label for="tipo">Tipo de reporte
          <span class="tooltip" title="Seleccione el tipo de información a exportar.">?</span>
        </label>
        <select id="tipo" v-model="tipoReporte" @change="resetFiltros">
          <option value="usuarios">Usuarios</option>
          <option value="documentos">Documentos</option>
          <option value="logs">Logs de Usuario</option>
        </select>
      </div>
      <div v-if="tipoReporte === 'usuarios'" class="form-group-grouped">
        <div class="form-group">
          <label>Área</label>
          <select v-model="filtros.IDArea">
            <option value="">Todas</option>
            <option v-for="area in areas" :key="area.IDArea" :value="area.IDArea">{{ area.NombreArea }}</option>
          </select>
        </div>
        <div class="form-group">
          <label>Rol</label>
          <select v-model="filtros.IDRol">
            <option value="">Todos</option>
            <option v-for="rol in roles" :key="rol.IDRol" :value="rol.IDRol">{{ rol.NombreRol }}</option>
          </select>
        </div>
      </div>
      <div v-else-if="tipoReporte === 'documentos'" class="form-group-grouped">
        <div class="form-group">
          <label>Área</label>
          <select v-model="filtros.IDAreaActual">
            <option value="">Todas</option>
            <option v-for="area in areas" :key="area.IDArea" :value="area.IDArea">{{ area.NombreArea }}</option>
          </select>
        </div>
        <div class="form-group">
          <label>Estado</label>
          <select v-model="filtros.Estado">
            <option value="">Todos</option>
            <option v-for="estado in estadosDocumento" :key="estado">{{ estado }}</option>
          </select>
        </div>
        <div class="form-group">
          <label>Fecha inicio</label>
          <input type="date" v-model="filtros.FechaInicio" />
        </div>
        <div class="form-group">
          <label>Fecha fin</label>
          <input type="date" v-model="filtros.FechaFin" />
        </div>
      </div>
      <div v-else-if="tipoReporte === 'logs'" class="form-group-grouped">
        <div class="form-group">
          <label>Usuario</label>
          <select v-model="filtros.usuarioId">
            <option value="">Todos</option>
            <option v-for="usuario in usuarios" :key="usuario.IDUsuario" :value="usuario.IDUsuario">{{ usuario.Nombres }} {{ usuario.Apellidos }}</option>
          </select>
        </div>
        <div class="form-group">
          <label>Tipo de evento</label>
          <input v-model="filtros.tipoEvento" placeholder="(opcional)" />
        </div>
        <div class="form-group">
          <label>Fecha inicio</label>
          <input type="date" v-model="filtros.fechaInicio" />
        </div>
        <div class="form-group">
          <label>Fecha fin</label>
          <input type="date" v-model="filtros.fechaFin" />
        </div>
      </div>
      <div class="form-group">
        <label for="formato">Formato
          <span class="tooltip" title="Elija el formato de archivo para exportar.">?</span>
        </label>
        <select id="formato" v-model="formato">
          <option value="csv">CSV</option>
          <option value="excel">Excel</option>
          <option value="pdf">PDF</option>
        </select>
      </div>
      <button class="export-btn" :disabled="loading || !puedeExportar">
        <span v-if="loading" class="loader"></span>
        <span v-else>Exportar</span>
      </button>
      <div v-if="!puedeExportar" class="error"><i class="fa fa-lock"></i> No tiene permisos para exportar este reporte.</div>
      <div v-if="error" class="error"><i class="fa fa-exclamation-circle"></i> {{ error }}</div>
      <div v-if="success" class="success"><i class="fa fa-check-circle"></i> ¡Reporte exportado correctamente!</div>
    </form>
    <slot name="preview"></slot>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { useAuthStore } from '../stores/auth';
import axiosAuth from '../api/axiosAuth';

const props = defineProps({
  areas: Array,
  roles: Array,
  usuarios: Array,
  estadosDocumento: Array
});
const emit = defineEmits(['preview-request']);

const authStore = useAuthStore();
const tipoReporte = ref('usuarios');
const formato = ref('csv');
const filtros = ref({});
const loading = ref(false);
const error = ref('');
const success = ref(false);

const puedeExportar = computed(() => {
  const p = authStore.user?.Permisos || 0;
  if ((p & 64) === 64 || (p & 128) === 128) return true;
  if (tipoReporte.value === 'documentos' && filtros.value.IDAreaActual && authStore.user?.IDArea == filtros.value.IDAreaActual) return true;
  if (tipoReporte.value === 'logs' && filtros.value.usuarioId && authStore.user?.IDUsuario == filtros.value.usuarioId) return true;
  return false;
});

function resetFiltros() {
  filtros.value = {};
  emit('preview-request', { tipo: tipoReporte.value, filtros: filtros.value });
}

watch([tipoReporte, filtros], () => {
  emit('preview-request', { tipo: tipoReporte.value, filtros: filtros.value });
}, { deep: true });

async function onExport() {
  error.value = '';
  success.value = false;
  loading.value = true;
  try {
    const res = await axiosAuth.post('/api/reportes/exportar', {
      tipo: tipoReporte.value,
      filtros: filtros.value,
      formato: formato.value
    }, { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${tipoReporte.value}_reporte.${formato.value === 'excel' ? 'xlsx' : formato.value}`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    success.value = true;
  } catch (e) {
    error.value = e.response?.data?.message || 'Error al exportar.';
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.export-form-card {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 24px #0002;
  padding: 32px 36px 24px 36px;
  max-width: 420px;
  margin: 32px auto;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.export-title {
  font-size: 1.6rem;
  font-weight: 700;
  margin-bottom: 18px;
  color: #1a3d4c;
  text-align: center;
}
.export-form {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 18px;
}
.form-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.form-group-grouped {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}
label {
  font-weight: 600;
  color: #1a3d4c;
  font-size: 1rem;
}
select, input[type='date'], input[type='text'] {
  padding: 7px 10px;
  border-radius: 5px;
  border: 1px solid #b0bec5;
  font-size: 1rem;
  background: #f8fafb;
  transition: border 0.2s;
}
select:focus, input:focus {
  border: 1.5px solid #1976d2;
  outline: none;
}
.export-btn {
  background: #1976d2;
  color: #fff;
  border: none;
  padding: 12px 0;
  border-radius: 6px;
  font-size: 1.1rem;
  font-weight: 700;
  cursor: pointer;
  margin-top: 10px;
  transition: background 0.2s;
}
.export-btn:disabled {
  background: #b0bec5;
  cursor: not-allowed;
}
.loader {
  border: 3px solid #f3f3f3;
  border-top: 3px solid #1976d2;
  border-radius: 50%;
  width: 18px;
  height: 18px;
  animation: spin 1s linear infinite;
  display: inline-block;
  vertical-align: middle;
}
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
.error {
  color: #e74c3c;
  font-weight: 600;
  margin-top: 6px;
  display: flex;
  align-items: center;
  gap: 6px;
}
.success {
  color: #27ae60;
  font-weight: 600;
  margin-top: 6px;
  display: flex;
  align-items: center;
  gap: 6px;
}
.tooltip {
  margin-left: 6px;
  color: #1976d2;
  cursor: help;
  font-size: 0.95em;
  border-bottom: 1px dotted #1976d2;
}
</style> 