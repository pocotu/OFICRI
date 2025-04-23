<template>
  <div class="dashboard" :class="{ 'dark-mode': dashboardStore.uiConfig.darkMode }">
    <div class="dashboard-header">
      <h1>Dashboard</h1>
      <div class="dashboard-controls">
        <div class="time-range">
          <select v-model="dashboardStore.filters.timeRange" @change="handleTimeRangeChange">
            <option value="today">Hoy</option>
            <option value="week">Esta semana</option>
            <option value="month">Este mes</option>
            <option value="year">Este año</option>
            <option value="custom">Personalizado</option>
          </select>
        </div>
        <div class="area-filters" v-if="areas.length > 0">
          <div class="area-selector">
            <label>Área:</label>
            <select v-model="dashboardStore.filters.areaId" @change="handleAreaChange">
              <option value="">Todas las áreas</option>
              <option v-for="area in areas" :key="area.IDArea" :value="area.IDArea">
                {{ area.NombreArea }}
              </option>
            </select>
          </div>
          <div class="subarea-selector" v-if="dashboardStore.filters.areaId && subareas.length > 0">
            <label>Subárea:</label>
            <select v-model="dashboardStore.filters.subareaId" @change="handleSubareaChange">
              <option value="">Todas las subáreas</option>
              <option v-for="subarea in subareas" :key="subarea.IDArea" :value="subarea.IDArea">
                {{ subarea.NombreArea }}
              </option>
            </select>
          </div>
        </div>
        <div class="export-controls">
          <button @click="showExportModal = true" :disabled="dashboardStore.isLoading">
            <i class="icon-download"></i> Exportar
          </button>
        </div>
        <button @click="refreshDashboard" :disabled="dashboardStore.isLoading" class="refresh-btn">
          <i class="icon-refresh" :class="{ 'rotating': dashboardStore.isLoading }"></i>
          {{ dashboardStore.isLoading ? 'Actualizando...' : 'Actualizar' }}
        </button>
      </div>
    </div>
    
    <!-- Mostrar error si existe -->
    <div v-if="dashboardStore.error" class="dashboard-error">
      <i class="icon-alert-circle"></i>
      <span>{{ dashboardStore.error }}</span>
      <button @click="dashboardStore.error = null" class="close-btn">
        <i class="icon-x"></i>
      </button>
    </div>
    
    <!-- Sección de KPIs -->
    <div class="dashboard-section kpis-section">
      <h2>Indicadores Clave de Rendimiento</h2>
      <div class="kpi-cards">
        <KpiCard 
          v-for="kpi in dashboardStore.kpis" 
          :key="kpi.id" 
          :title="kpi.title" 
          :value="kpi.value" 
          :trend="kpi.trend" 
          :icon="kpi.icon" 
          :loading="dashboardStore.isLoading"
        />
      </div>
    </div>
    
    <!-- Sección de Estadísticas -->
    <div class="dashboard-section stats-section">
      <h2>Estadísticas</h2>
      <div class="stats-cards">
        <StatsCard 
          v-for="stat in dashboardStore.stats" 
          :key="stat.id" 
          :title="stat.title" 
          :data="stat.data" 
          :loading="dashboardStore.isLoading"
        >
          <template #chart>
            <!-- Chart se renderiza dentro del slot -->
            <div class="chart-container">
              <!-- Aquí iría el gráfico específico para cada estadística -->
            </div>
          </template>
        </StatsCard>
      </div>
    </div>
    
    <!-- Sección de Alertas -->
    <div class="dashboard-section alerts-section" v-if="dashboardStore.alerts.length > 0 || dashboardStore.isLoading">
      <div class="section-header">
        <h2>Alertas</h2>
        <div class="section-actions">
          <button 
            @click="dashboardStore.updateUIConfig({ showAllAlerts: !dashboardStore.uiConfig.showAllAlerts })"
            class="toggle-btn"
          >
            {{ dashboardStore.uiConfig.showAllAlerts ? 'Mostrar no confirmadas' : 'Mostrar todas' }}
          </button>
        </div>
      </div>
      
      <div class="alert-cards">
        <template v-if="!dashboardStore.isLoading">
          <AlertCard 
            v-for="alert in filteredAlerts" 
            :key="alert.id" 
            :alert="alert"
            @alert-acknowledged="handleAlertAcknowledged"
            @alert-escalated="handleAlertEscalated"
            @action-executed="handleAlertAction"
          />
          <div v-if="filteredAlerts.length === 0" class="no-alerts">
            <i class="icon-check-circle"></i>
            <p>No hay alertas {{ dashboardStore.uiConfig.showAllAlerts ? '' : 'sin confirmar' }} en este momento.</p>
          </div>
        </template>
        <div v-else class="loading-alerts">
          <div class="loading-card" v-for="i in 3" :key="i"></div>
        </div>
      </div>
    </div>
    
    <!-- Modal de exportación -->
    <div v-if="showExportModal" class="export-modal">
      <div class="modal-content">
        <div class="modal-header">
          <h3>Exportar Datos del Dashboard</h3>
          <button @click="showExportModal = false" class="close-btn">
            <i class="icon-x"></i>
          </button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>Datos a exportar:</label>
            <select v-model="exportOptions.dataType">
              <option value="kpis">Indicadores (KPIs)</option>
              <option value="stats">Estadísticas</option>
              <option value="alerts">Alertas</option>
              <option value="all">Todo el dashboard</option>
            </select>
          </div>
          <div class="form-group">
            <label>Formato:</label>
            <div class="format-options">
              <label v-for="format in exportFormats" :key="format.value" class="format-option">
                <input type="radio" v-model="exportOptions.format" :value="format.value">
                <span>{{ format.label }}</span>
              </label>
            </div>
          </div>
          <div class="form-group">
            <label>Opciones:</label>
            <div class="checkbox-group">
              <label class="checkbox-option">
                <input type="checkbox" v-model="exportOptions.includeHeaders">
                <span>Incluir encabezados</span>
              </label>
              <label class="checkbox-option">
                <input type="checkbox" v-model="exportOptions.timestamp">
                <span>Añadir fecha y hora</span>
              </label>
              <label class="checkbox-option" v-if="exportOptions.format === 'excel'">
                <input type="checkbox" v-model="exportOptions.autoFilter">
                <span>Auto-filtros en Excel</span>
              </label>
            </div>
          </div>
          <div v-if="exportOptions.dataType === 'all'" class="form-group">
            <label>Nombre del archivo:</label>
            <input 
              type="text" 
              v-model="exportOptions.filename" 
              placeholder="dashboard-export"
            >
          </div>
        </div>
        <div class="modal-footer">
          <button @click="showExportModal = false" class="cancel-btn">Cancelar</button>
          <button @click="exportData" class="export-btn" :disabled="exporting">
            {{ exporting ? 'Exportando...' : 'Exportar' }}
          </button>
        </div>
      </div>
    </div>
    
    <!-- Mostrar última actualización -->
    <div class="dashboard-footer" v-if="dashboardStore.lastUpdated">
      <span>Última actualización: {{ formattedLastUpdate }}</span>
      <span v-if="dashboardStore.uiConfig.autoRefresh">
        (Actualización automática cada {{ dashboardStore.uiConfig.refreshInterval / 60000 }} minutos)
      </span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { getAreas } from '../../shared/src/services/areaRegistry/areaService';
import { EXPORT_FORMATS } from '../services/exportService';
import { useDashboardStore } from '../store/dashboardStore';
import KpiCard from './KpiCard.vue';
import StatsCard from './StatsCard.vue';
import AlertCard from './AlertCard.vue';

// Acceder al store
const dashboardStore = useDashboardStore();

// Estado local
const areas = ref([]);
const subareas = ref([]);
const showExportModal = ref(false);
const exporting = ref(false);
const exportOptions = ref({
  dataType: 'all',
  format: EXPORT_FORMATS.EXCEL,
  includeHeaders: true,
  timestamp: true,
  autoFilter: true,
  filename: 'dashboard-export'
});

// Formatos de exportación disponibles
const exportFormats = [
  { value: EXPORT_FORMATS.EXCEL, label: 'Excel (.xlsx)' },
  { value: EXPORT_FORMATS.PDF, label: 'PDF (.pdf)' },
  { value: EXPORT_FORMATS.CSV, label: 'CSV (.csv)' },
  { value: EXPORT_FORMATS.JSON, label: 'JSON (.json)' }
];

// Filtrar alertas según configuración
const filteredAlerts = computed(() => {
  if (dashboardStore.uiConfig.showAllAlerts) {
    return dashboardStore.alerts;
  } else {
    return dashboardStore.alerts.filter(alert => !alert.acknowledged);
  }
});

// Formatear última actualización
const formattedLastUpdate = computed(() => {
  if (!dashboardStore.lastUpdated) return '';
  
  const now = new Date();
  const lastUpdate = new Date(dashboardStore.lastUpdated);
  const diffMinutes = Math.floor((now - lastUpdate) / (1000 * 60));
  
  if (diffMinutes < 1) return 'hace menos de un minuto';
  if (diffMinutes < 60) return `hace ${diffMinutes} minutos`;
  if (diffMinutes < 1440) return `hace ${Math.floor(diffMinutes / 60)} horas`;
  return lastUpdate.toLocaleString('es-ES');
});

// Manejadores de eventos
const handleTimeRangeChange = () => {
  dashboardStore.saveFilters();
  dashboardStore.loadDashboardData();
};

const handleAreaChange = () => {
  // Resetear subárea cuando cambia el área
  dashboardStore.updateFilters({ subareaId: '' });
  dashboardStore.saveFilters();
};

const handleSubareaChange = () => {
  dashboardStore.saveFilters();
  dashboardStore.loadDashboardData();
};

const refreshDashboard = () => {
  dashboardStore.loadDashboardData(true); // true = forzar recarga ignorando caché
};

const handleAlertAcknowledged = (alertId) => {
  dashboardStore.acknowledgeAlertAndUpdate(alertId);
};

const handleAlertEscalated = (alertId) => {
  dashboardStore.escalateAlertAndUpdate(alertId);
};

const handleAlertAction = ({ alertId, actionId }) => {
  // Recargar datos después de ejecutar acción de alerta
  dashboardStore.loadDashboardData();
};

// Exportar datos
const exportData = async () => {
  if (exporting.value) return;
  
  exporting.value = true;
  try {
    const options = { ...exportOptions.value };
    const format = options.format;
    
    switch (options.dataType) {
      case 'kpis':
        await dashboardStore.exportDashboardKPIs(format, { filename: 'kpis-export', ...options });
        break;
      case 'stats':
        await dashboardStore.exportDashboardStats(format, { filename: 'estadisticas-export', ...options });
        break;
      case 'alerts':
        await dashboardStore.exportDashboardAlerts(format, { filename: 'alertas-export', ...options });
        break;
      case 'all':
      default:
        // Exportar todo requiere especial manejo, creamos un objeto con todos los datos
        const data = {
          kpis: dashboardStore.kpis,
          stats: dashboardStore.stats,
          alerts: dashboardStore.alerts,
          filters: dashboardStore.filters,
          lastUpdated: dashboardStore.lastUpdated
        };
        
        // Utilizamos exportDashboardStats como base, pero pasamos todo el conjunto de datos
        await dashboardStore.exportDashboardStats(format, { 
          filename: options.filename,
          allData: data,
          ...options 
        });
        break;
    }
    
    showExportModal.value = false;
  } catch (error) {
    console.error('Error al exportar datos:', error);
  } finally {
    exporting.value = false;
  }
};

let refreshInterval = null;

// Observar cambios en autoRefresh para configurar intervalo
watch(() => dashboardStore.uiConfig.autoRefresh, (autoRefresh) => {
  if (autoRefresh) {
    if (refreshInterval) clearInterval(refreshInterval);
    refreshInterval = setInterval(() => {
      dashboardStore.loadDashboardData();
    }, dashboardStore.uiConfig.refreshInterval);
  } else if (refreshInterval) {
    clearInterval(refreshInterval);
    refreshInterval = null;
  }
});

// Observar cambios en refreshInterval para actualizar temporizador
watch(() => dashboardStore.uiConfig.refreshInterval, (newInterval) => {
  if (dashboardStore.uiConfig.autoRefresh) {
    if (refreshInterval) clearInterval(refreshInterval);
    refreshInterval = setInterval(() => {
      dashboardStore.loadDashboardData();
    }, newInterval);
  }
});

// Al montar el componente
onMounted(async () => {
  // Cargar configuración guardada
  await dashboardStore.loadSavedConfig();
  
  // Cargar áreas
  try {
    const response = await getAreas();
    areas.value = response.data;
  } catch (error) {
    console.error('Error cargando áreas:', error);
  }
  
  // Cargar datos iniciales
  dashboardStore.loadDashboardData();
  
  // Configurar intervalo de actualización automática si está habilitado
  if (dashboardStore.uiConfig.autoRefresh) {
    refreshInterval = setInterval(() => {
      dashboardStore.loadDashboardData();
    }, dashboardStore.uiConfig.refreshInterval);
  }
});

// Observar cambios en el área seleccionada para cargar subáreas
watch(() => dashboardStore.filters.areaId, async (newAreaId) => {
  if (newAreaId) {
    try {
      const response = await getAreas({ parentId: newAreaId });
      subareas.value = response.data;
    } catch (error) {
      console.error('Error cargando subáreas:', error);
      subareas.value = [];
    }
  } else {
    subareas.value = [];
  }
});

// Limpiar al desmontar
onUnmounted(() => {
  if (refreshInterval) {
    clearInterval(refreshInterval);
  }
});
</script>

<style scoped>
.dashboard {
  padding: 20px;
  min-height: 100vh;
  background-color: #f5f5f7;
  color: #333;
}

.dashboard.dark-mode {
  background-color: #121212;
  color: #f5f5f7;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.dashboard-controls {
  display: flex;
  gap: 15px;
  align-items: center;
}

.time-range select,
.area-filters select {
  padding: 8px 12px;
  border-radius: 6px;
  border: 1px solid #d1d1d6;
  background-color: white;
  font-size: 14px;
}

.area-filters {
  display: flex;
  gap: 10px;
}

.area-selector,
.subarea-selector {
  display: flex;
  align-items: center;
  gap: 5px;
}

.area-selector label,
.subarea-selector label {
  font-size: 14px;
  color: #8e8e93;
}

.refresh-btn,
.export-btn,
button {
  padding: 8px 16px;
  background-color: #007aff;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: background-color 0.2s;
}

.refresh-btn:hover,
.export-btn:hover,
button:hover {
  background-color: #0062cc;
}

.refresh-btn:disabled,
.export-btn:disabled,
button:disabled {
  background-color: #8e8e93;
  cursor: not-allowed;
}

.dashboard-error {
  background-color: #ff3b30;
  color: white;
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.dashboard-error .close-btn {
  margin-left: auto;
  background: transparent;
  border: none;
  color: white;
  cursor: pointer;
  padding: 0;
}

.dashboard-section {
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  padding: 20px;
  margin-bottom: 24px;
}

.dark-mode .dashboard-section {
  background-color: #1c1c1e;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
}

.dashboard-section h2 {
  margin-top: 0;
  margin-bottom: 16px;
  font-size: 18px;
  color: #1c1c1e;
}

.dark-mode .dashboard-section h2 {
  color: #f5f5f7;
}

.kpi-cards,
.stats-cards,
.alert-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.section-actions .toggle-btn {
  background-color: transparent;
  color: #007aff;
  border: 1px solid #007aff;
  padding: 4px 10px;
  font-size: 12px;
}

.dark-mode .section-actions .toggle-btn {
  color: #0a84ff;
  border-color: #0a84ff;
}

.no-alerts {
  grid-column: 1 / -1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 32px;
  color: #8e8e93;
}

.no-alerts i {
  font-size: 36px;
  color: #34c759;
  margin-bottom: 12px;
}

.loading-card {
  height: 120px;
  background: linear-gradient(90deg, #f0f0f0 25%, #f8f8f8 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: loading 1.5s infinite;
  border-radius: 8px;
}

.dark-mode .loading-card {
  background: linear-gradient(90deg, #2c2c2e 25%, #3a3a3c 50%, #2c2c2e 75%);
  background-size: 200% 100%;
}

@keyframes loading {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

.rotating {
  animation: rotate 1s linear infinite;
}

@keyframes rotate {
  100% { transform: rotate(360deg); }
}

.dashboard-footer {
  text-align: center;
  padding: 16px;
  color: #8e8e93;
  font-size: 14px;
}

/* Modal de exportación */
.export-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background-color: white;
  border-radius: 12px;
  width: 90%;
  max-width: 480px;
  box-shadow: 0 4px 23px rgba(0, 0, 0, 0.2);
  overflow: hidden;
}

.dark-mode .modal-content {
  background-color: #2c2c2e;
}

.modal-header {
  padding: 16px 20px;
  border-bottom: 1px solid #d1d1d6;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.dark-mode .modal-header {
  border-bottom-color: #3a3a3c;
}

.modal-header h3 {
  margin: 0;
  font-size: 18px;
}

.modal-body {
  padding: 20px;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
}

.form-group select,
.form-group input[type="text"] {
  width: 100%;
  padding: 10px;
  border-radius: 6px;
  border: 1px solid #d1d1d6;
  background-color: white;
  font-size: 14px;
}

.dark-mode .form-group select,
.dark-mode .form-group input[type="text"] {
  background-color: #3a3a3c;
  border-color: #48484a;
  color: white;
}

.format-options,
.checkbox-group {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.format-option,
.checkbox-option {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
}

.modal-footer {
  padding: 16px 20px;
  border-top: 1px solid #d1d1d6;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.dark-mode .modal-footer {
  border-top-color: #3a3a3c;
}

.cancel-btn {
  background-color: transparent;
  color: #8e8e93;
  border: 1px solid #8e8e93;
}

.export-btn {
  background-color: #007aff;
}

.dark-mode .export-btn {
  background-color: #0a84ff;
}
</style> 