<template>
  <div class="document-tracking">
    <h2>Seguimiento de Documentos</h2>

    <!-- Estadísticas -->
    <div class="stats" v-if="authStore.hasPermission(mesaPartesStore.PERMISSION_BITS.EXPORTAR)">
      <div class="stat-card">
        <h3>Tiempo Promedio de Atención</h3>
        <p>{{ estadisticas.tiempoPromedio }} días</p>
      </div>
      <div class="stat-card">
        <h3>Documentos Pendientes</h3>
        <p>{{ estadisticas.pendientes }}</p>
      </div>
      <div class="stat-card">
        <h3>Documentos Derivados</h3>
        <p>{{ estadisticas.derivados }}</p>
      </div>
    </div>

    <!-- Filtros -->
    <div class="filters">
      <div class="filter-group">
        <input 
          type="text" 
          v-model="filters.search" 
          placeholder="Buscar por número o asunto..."
          @input="handleSearch"
        >
      </div>

      <div class="filter-group">
        <select v-model="filters.estado" @change="handleFilterChange">
          <option value="">Todos los estados</option>
          <option v-for="estado in estados" :key="estado.value" :value="estado.value">
            {{ estado.label }}
          </option>
        </select>
      </div>

      <div class="filter-group">
        <select v-model="filters.area" @change="handleFilterChange">
          <option value="">Todas las áreas</option>
          <option v-for="area in areas" :key="area.id" :value="area.id">
            {{ area.nombre }}
          </option>
        </select>
      </div>

      <div class="filter-group">
        <input 
          type="date" 
          v-model="filters.fechaDesde"
          @change="handleFilterChange"
        >
        <input 
          type="date" 
          v-model="filters.fechaHasta"
          @change="handleFilterChange"
        >
      </div>

      <button @click="clearFilters">Limpiar Filtros</button>
    </div>

    <!-- Botones de Acción -->
    <div class="action-buttons" v-if="authStore.hasPermission(mesaPartesStore.PERMISSION_BITS.EXPORTAR)">
      <button @click="exportarExcel">Exportar a Excel</button>
      <button @click="exportarPDF">Exportar a PDF</button>
    </div>

    <!-- Tabla de Documentos -->
    <div class="documents-table">
      <table>
        <thead>
          <tr>
            <th>Número</th>
            <th>Asunto</th>
            <th>Remitente</th>
            <th>Área Actual</th>
            <th>Estado</th>
            <th>Fecha Recepción</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="documento in documentosFiltrados" :key="documento.id">
            <td>{{ documento.numero }}</td>
            <td>{{ documento.asunto }}</td>
            <td>{{ documento.remitente }}</td>
            <td>{{ getAreaNombre(documento.areaActual) }}</td>
            <td>
              <span :class="['estado-badge', documento.estado.toLowerCase()]">
                {{ getEstadoLabel(documento.estado) }}
              </span>
            </td>
            <td>{{ formatDate(documento.fechaRecepcion) }}</td>
            <td>
              <button 
                class="action-button view"
                @click="verDetalles(documento.id)"
                title="Ver detalles"
              >
                👁️
              </button>
              <button 
                class="action-button track"
                @click="verSeguimiento(documento.id)"
                title="Ver seguimiento"
              >
                📋
              </button>
              <button 
                v-if="puedeDerivar(documento)"
                class="action-button derive"
                @click="derivarDocumento(documento.id)"
                title="Derivar documento"
              >
                ➡️
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Paginación -->
    <div class="pagination">
      <button 
        :disabled="pagination.page === 1"
        @click="changePage(pagination.page - 1)"
      >
        Anterior
      </button>
      <span>Página {{ pagination.page }} de {{ pagination.pages }}</span>
      <button 
        :disabled="pagination.page === pagination.pages"
        @click="changePage(pagination.page + 1)"
      >
        Siguiente
      </button>
    </div>

    <!-- Modal de Detalles -->
    <div v-if="documentoSeleccionado" class="modal">
      <div class="modal-content">
        <h3>Detalles del Documento</h3>
        <div class="document-details">
          <div class="detail-row">
            <span class="label">Número:</span>
            <span>{{ documentoSeleccionado.numero }}</span>
          </div>
          <div class="detail-row">
            <span class="label">Asunto:</span>
            <span>{{ documentoSeleccionado.asunto }}</span>
          </div>
          <div class="detail-row">
            <span class="label">Remitente:</span>
            <span>{{ documentoSeleccionado.remitente }}</span>
          </div>
          <div class="detail-row">
            <span class="label">Área Actual:</span>
            <span>{{ getAreaNombre(documentoSeleccionado.areaActual) }}</span>
          </div>
          <div class="detail-row">
            <span class="label">Estado:</span>
            <span :class="['estado-badge', documentoSeleccionado.estado.toLowerCase()]">
              {{ getEstadoLabel(documentoSeleccionado.estado) }}
            </span>
          </div>
          <div class="detail-row">
            <span class="label">Fecha Recepción:</span>
            <span>{{ formatDate(documentoSeleccionado.fechaRecepcion) }}</span>
          </div>
          <div class="detail-row">
            <span class="label">Observaciones:</span>
            <span>{{ documentoSeleccionado.observaciones }}</span>
          </div>
          
          <!-- Historial de Derivaciones -->
          <div class="derivation-history" v-if="documentoSeleccionado.historial">
            <h4>Historial de Derivaciones</h4>
            <div v-for="(derivacion, index) in documentoSeleccionado.historial" :key="index" class="derivation-item">
              <div class="derivation-info">
                <span class="date">{{ formatDate(derivacion.fecha) }}</span>
                <span class="from">{{ getAreaNombre(derivacion.areaOrigen) }}</span>
                <span class="arrow">→</span>
                <span class="to">{{ getAreaNombre(derivacion.areaDestino) }}</span>
              </div>
              <div class="derivation-notes" v-if="derivacion.observaciones">
                {{ derivacion.observaciones }}
              </div>
            </div>
          </div>
        </div>
        <button @click="cerrarModal">Cerrar</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useMesaPartesStore } from '../../shared/src/store/mesaPartes';
import { useAreasStore } from '../../shared/src/store/areas';
import { useAuthStore } from '../../shared/src/store/auth';

const mesaPartesStore = useMesaPartesStore();
const areasStore = useAreasStore();
const authStore = useAuthStore();

// Estado
const filters = ref({
  search: '',
  estado: '',
  area: '',
  fechaDesde: '',
  fechaHasta: ''
});

const pagination = ref({
  page: 1,
  limit: 10,
  total: 0,
  pages: 0
});

const documentoSeleccionado = ref(null);
const areas = ref([]);

// Constantes
const estados = [
  { value: 'RECIBIDO', label: 'Recibido' },
  { value: 'EN_PROCESO', label: 'En Proceso' },
  { value: 'DERIVADO', label: 'Derivado' },
  { value: 'FINALIZADO', label: 'Finalizado' }
];

// Estado adicional
const estadisticas = ref({
  tiempoPromedio: 0,
  pendientes: 0,
  derivados: 0
});

// Computed
const documentosFiltrados = computed(() => {
  return mesaPartesStore.filteredRecepciones;
});

// Métodos
const handleSearch = () => {
  mesaPartesStore.setFilters({ search: filters.value.search });
  fetchDocumentos();
};

const handleFilterChange = () => {
  mesaPartesStore.setFilters({
    estado: filters.value.estado,
    area: filters.value.area,
    fechaDesde: filters.value.fechaDesde,
    fechaHasta: filters.value.fechaHasta
  });
  fetchDocumentos();
};

const clearFilters = () => {
  filters.value = {
    search: '',
    estado: '',
    area: '',
    fechaDesde: '',
    fechaHasta: ''
  };
  mesaPartesStore.clearFilters();
  fetchDocumentos();
};

const changePage = (newPage) => {
  pagination.value.page = newPage;
  fetchDocumentos();
};

const fetchDocumentos = async () => {
  await mesaPartesStore.fetchRecepciones();
  pagination.value = {
    page: mesaPartesStore.pagination.page,
    limit: mesaPartesStore.pagination.limit,
    total: mesaPartesStore.pagination.total,
    pages: mesaPartesStore.pagination.pages
  };
};

const getAreaNombre = (areaId) => {
  const area = areas.value.find(a => a.id === areaId);
  return area ? area.nombre : 'Desconocida';
};

const getEstadoLabel = (estado) => {
  const estadoObj = estados.find(e => e.value === estado);
  return estadoObj ? estadoObj.label : estado;
};

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('es-PE');
};

const verDetalles = async (documentoId) => {
  const documento = await mesaPartesStore.fetchMesaPartesById(documentoId);
  documentoSeleccionado.value = documento;
};

const verSeguimiento = (documentoId) => {
  // Implementar navegación a vista de seguimiento
  console.log('Ver seguimiento:', documentoId);
};

const derivarDocumento = (documentoId) => {
  // Implementar derivación de documento
  console.log('Derivar documento:', documentoId);
};

const puedeDerivar = (documento) => {
  return authStore.hasPermission(mesaPartesStore.PERMISSION_BITS.DERIVAR) &&
         documento.estado !== 'FINALIZADO';
};

const cerrarModal = () => {
  documentoSeleccionado.value = null;
};

const fetchEstadisticas = async () => {
  if (authStore.hasPermission(mesaPartesStore.PERMISSION_BITS.EXPORTAR)) {
    try {
      const stats = await mesaPartesStore.getEstadisticas();
      estadisticas.value = stats;
    } catch (error) {
      console.error('Error al cargar estadísticas:', error);
    }
  }
};

const exportarExcel = async () => {
  if (!authStore.hasPermission(mesaPartesStore.PERMISSION_BITS.EXPORTAR)) {
    alert('No tiene permisos para exportar documentos');
    return;
  }

  try {
    await mesaPartesStore.exportarDocumentos('excel', filters.value);
    alert('Exportación a Excel iniciada');
  } catch (error) {
    console.error('Error al exportar a Excel:', error);
    alert('Error al exportar a Excel: ' + error.message);
  }
};

const exportarPDF = async () => {
  if (!authStore.hasPermission(mesaPartesStore.PERMISSION_BITS.EXPORTAR)) {
    alert('No tiene permisos para exportar documentos');
    return;
  }

  try {
    await mesaPartesStore.exportarDocumentos('pdf', filters.value);
    alert('Exportación a PDF iniciada');
  } catch (error) {
    console.error('Error al exportar a PDF:', error);
    alert('Error al exportar a PDF: ' + error.message);
  }
};

// Inicialización
onMounted(async () => {
  try {
    await areasStore.fetchAreas();
    areas.value = areasStore.areas;
    await fetchDocumentos();
    await fetchEstadisticas();
  } catch (error) {
    console.error('Error al inicializar:', error);
  }
});
</script>

<style scoped>
.document-tracking {
  padding: 20px;
}

.filters {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.filter-group {
  display: flex;
  gap: 10px;
}

input, select {
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.documents-table {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 20px;
}

th, td {
  padding: 10px;
  text-align: left;
  border-bottom: 1px solid #ddd;
}

th {
  background-color: #f5f5f5;
}

.estado-badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.9em;
}

.recibido {
  background-color: #e3f2fd;
  color: #1976d2;
}

.en_proceso {
  background-color: #fff3e0;
  color: #f57c00;
}

.derivado {
  background-color: #e8f5e9;
  color: #388e3c;
}

.finalizado {
  background-color: #f5f5f5;
  color: #616161;
}

.action-button {
  padding: 5px 10px;
  margin: 0 2px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  background: none;
}

.action-button:hover {
  background-color: #f0f0f0;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
  margin-top: 20px;
}

.modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
}

.modal-content {
  background-color: white;
  padding: 20px;
  border-radius: 5px;
  max-width: 600px;
  width: 90%;
}

.document-details {
  margin: 20px 0;
}

.detail-row {
  display: flex;
  margin-bottom: 10px;
}

.detail-row .label {
  font-weight: bold;
  width: 150px;
}

.stats {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.stat-card {
  flex: 1;
  min-width: 200px;
  padding: 15px;
  background-color: #f5f5f5;
  border-radius: 5px;
  text-align: center;
}

.stat-card h3 {
  margin: 0 0 10px 0;
  font-size: 1em;
  color: #666;
}

.stat-card p {
  margin: 0;
  font-size: 1.5em;
  font-weight: bold;
  color: #333;
}

.action-buttons {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  justify-content: flex-end;
}

.derivation-history {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #ddd;
}

.derivation-item {
  margin-bottom: 15px;
  padding: 10px;
  background-color: #f9f9f9;
  border-radius: 4px;
}

.derivation-info {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 5px;
}

.derivation-info .date {
  color: #666;
  font-size: 0.9em;
}

.derivation-info .from,
.derivation-info .to {
  font-weight: bold;
}

.derivation-info .arrow {
  color: #666;
}

.derivation-notes {
  font-size: 0.9em;
  color: #666;
  padding-left: 20px;
  border-left: 2px solid #ddd;
}
</style> 