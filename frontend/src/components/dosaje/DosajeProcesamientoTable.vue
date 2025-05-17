<template>
  <div class="dosaje-table-container">
    <div class="table-responsive">
      <table class="dosaje-table">
        <thead>
          <tr>
            <th>Acciones</th>
            <th>Nro Registro</th>
            <th>Fecha Ingreso</th>
            <th>Tipo Dosaje</th>
            <th>Nombre</th>
            <th>Apellidos</th>
            <th>Estado</th>
            <th>Responsable</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="dosaje in dosajesFiltrados" :key="dosaje.IDDosaje">
            <td>
              <div class="acciones-grupo">
                <button v-if="puedeProcesar(dosaje)" class="btn-accion btn-procesar" @click="$emit('procesar', dosaje)">
                  <i class="fas fa-cogs"></i>
                </button>
              </div>
            </td>
            <td>{{ dosaje.NumeroRegistro }}</td>
            <td>{{ formatFecha(dosaje.FechaIngreso) }}</td>
            <td>{{ dosaje.TipoDosaje }}</td>
            <td>{{ dosaje.Nombres }}</td>
            <td>{{ dosaje.Apellidos }}</td>
            <td>{{ dosaje.Estado }}</td>
            <td>{{ dosaje.Responsable }}</td>
          </tr>
          <tr v-if="dosajesFiltrados.length === 0">
            <td colspan="8" class="no-data">
              <div class="no-data-message">
                <i class="fas fa-search"></i>
                <p>No hay registros pendientes de procesamiento.</p>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { fetchDosajesPendientes } from '../../api/dosajeApi'
import { useAuthStore } from '../../stores/auth'

const authStore = useAuthStore()
const dosajes = ref([])
const loading = ref(true)

onMounted(async () => {
  loading.value = true
  try {
    const res = await fetchDosajesPendientes(authStore.token, authStore.user.IDArea)
    dosajes.value = res.data
  } finally {
    loading.value = false
  }
})

const dosajesFiltrados = computed(() => dosajes.value.filter(d => d.Estado === 'En trámite'))

function puedeProcesar(dosaje) {
  const permisos = authStore.user?.Permisos || 0
  return (permisos & 2) === 2 || authStore.user?.Rol === 'Responsable de Área'
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
.dosaje-table tbody tr:hover {
  background: #f0f4f8;
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
.btn-procesar:hover {
  background-color: #c8e1ff;
  color: #0056b3;
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
}
</style> 