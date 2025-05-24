<template>
  <div class="forensedigital-table-container documentos-table-container">
    <h2 class="sub-title">Tabla de Documentos de Forense Digital</h2>
    
    <div v-if="loading">Cargando documentos de Forense Digital...</div>
    <div v-else-if="error">Error al cargar documentos de Forense Digital: {{ error }}</div>
    <div v-else>
      <div class="table-responsive">
        <table class="forensedigital-table documentos-table">
          <thead>
            <tr>
              <th>Acciones</th>
              <th>Nro Registro</th>
              <th>Fecha Ingreso</th>
              <th>Oficio Doc</th>
              <th>Numero Oficio</th>
              <th>Tipo Pericia</th>
              <th>Nombres</th>
              <th>Apellidos</th>
              <th>Delito Investigado</th>
              <th>Dispositivo Tipo</th>
              <th>Doc Salida Nro Informe</th>
              <th>Doc Salida Fecha</th>
              <th>Responsable</th>
            </tr>
          </thead>
          <tbody>
            <template v-if="forenseDigitalRecords.length > 0">
              <tr v-for="record in forenseDigitalRecords" :key="record.IDForenseDigital">
                <td>
                  <!-- TODO: Add action buttons -->
                  Acciones
                </td>
                <td>{{ record.NumeroRegistro }}</td>
                <td>{{ formatFecha(record.FechaIngreso) }}</td>
                <td>{{ record.OficioDoc }}</td>
                <td>{{ record.NumeroOficio }}</td>
                <td>{{ record.TipoPericia }}</td>
                <td>{{ record.Nombres }}</td>
                <td>{{ record.Apellidos }}</td>
                <td>{{ record.DelitoInvestigado }}</td>
                <td>{{ record.DispositivoTipo }}</td>
                <td>{{ record.DocSalidaNroInforme }}</td>
                <td>{{ formatFecha(record.DocSalidaFecha) }}</td>
                <td>{{ record.Responsable }}</td>
              </tr>
            </template>
            <tr v-else>
              <td colspan="13" class="no-data">
                <div class="no-data-message">
                  <i class="fas fa-search"></i>
                  <p>No se encontraron registros de Forense Digital</p>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { fetchForenseDigital } from '../../api/forenseDigitalApi'
import { useAuthStore } from '../../stores/auth'

const forenseDigitalRecords = ref([])
const loading = ref(true)
const error = ref(null)
const authStore = useAuthStore()

onMounted(async () => {
  try {
    await authStore.initialize();
    if (authStore.token) {
      const res = await fetchForenseDigital(authStore.token)
      forenseDigitalRecords.value = res.data
    } else {
      error.value = 'Usuario no autenticado.';
    }
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
})

function formatFecha(fecha) {
  if (!fecha) return ''
  const d = new Date(fecha)
  if (isNaN(d)) return fecha
  return `${d.getDate().toString().padStart(2, '0')}-${(d.getMonth()+1).toString().padStart(2, '0')}-${d.getFullYear()}`
}

</script>

<style scoped>
.documentos-table-container {
  /* You might keep some specific container styles here if needed */
}

.table-responsive {
  overflow-x: auto;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.documentos-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.95rem;
}

.documentos-table th,
.documentos-table td {
  padding: 0.5rem 0.75rem;
  text-align: left;
  border-bottom: 1px solid #e5e7eb;
}

.documentos-table th {
  background: #f6f8fa;
  font-weight: 600;
  position: sticky;
  top: 0;
  z-index: 2;
}

.documentos-table tbody tr:hover {
  background: #f0f4f8;
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

/* Specific styles for Forense Digital table if needed */
.forensedigital-table-container {
  padding: 1rem 0;
}

.sub-title {
  font-size: 1.2rem;
  margin-bottom: 1rem;
  color: #333;
}

.forensedigital-table th,
.forensedigital-table td {
  /* Override if Forense Digital needs different column padding/alignment */
}

.forensedigital-table th {
   /* Override if Forense Digital needs different header background/weight */
}

.forensedigital-table tbody tr:hover {
   /* Override if Forense Digital needs different hover effect */
}

.forensedigital-table-container .no-data {
    /* Override if Forense Digital needs different no data styles */
}

.forensedigital-table-container .no-data-message {
     /* Override if Forense Digital needs different no data message styles */
}

.forensedigital-table-container .no-data-message i {
      /* Override if Forense Digital needs different no data icon styles */
}

.forensedigital-table-container .no-data-message p {
      /* Override if Forense Digital needs different no data text styles */
}

</style> 