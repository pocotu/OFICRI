<template>
  <div class="reportes-view">
    <ReportExportForm
      :areas="areas"
      :roles="roles"
      :usuarios="usuarios"
      :estadosDocumento="estadosDocumento"
      @preview-request="handlePreviewRequest"
    >
      <template #preview>
        <!-- Aquí irá la previsualización de datos (tabla) -->
      </template>
    </ReportExportForm>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import axiosAuth from '../api/axiosAuth';
import ReportExportForm from '../components/ReportExportForm.vue';

const areas = ref([]);
const roles = ref([]);
const usuarios = ref([]);
const estadosDocumento = ['En trámite', 'Finalizado', 'Observado', 'Archivado'];

async function cargarAreas() {
  const res = await axiosAuth.get('/api/areas');
  areas.value = res.data;
}
async function cargarRoles() {
  const res = await axiosAuth.get('/api/roles');
  roles.value = res.data;
}
async function cargarUsuarios() {
  const res = await axiosAuth.get('/api/usuarios');
  usuarios.value = res.data;
}

onMounted(() => {
  cargarAreas();
  cargarRoles();
  cargarUsuarios();
});

function handlePreviewRequest({ tipo, filtros }) {
  // Aquí se puede implementar la lógica para previsualizar datos
}
</script>

<style scoped>
.reportes-view {
  min-height: 100vh;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  background: #f4f7fa;
  padding-top: 40px;
}
</style> 