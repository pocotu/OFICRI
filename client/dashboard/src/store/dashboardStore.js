import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { 
  getDashboardStats, 
  getDashboardKPIs, 
  getDashboardAlerts, 
  configureDashboardCache,
  clearDashboardCache
} from '../services/dashboardService';
import { 
  getAlerts, 
  acknowledgeAlert, 
  escalateAlert, 
  getUserAlertConfig 
} from '../services/alertService';
import { 
  exportStats, 
  exportKPIs, 
  exportAlerts 
} from '../services/exportService';

export const useDashboardStore = defineStore('dashboard', () => {
  // Estado
  const stats = ref([]);
  const kpis = ref([]);
  const alerts = ref([]);
  const isLoading = ref(false);
  const error = ref(null);
  const lastUpdated = ref(null);
  const filters = ref({
    timeRange: 'week',
    areaId: '',
    subareaId: '',
    startDate: null,
    endDate: null
  });
  const uiConfig = ref({
    darkMode: false,
    autoRefresh: true,
    refreshInterval: 5 * 60 * 1000, // 5 minutos
    compactView: false,
    showAllAlerts: false
  });
  const alertConfig = ref({
    thresholds: {},
    notificationChannels: {
      dashboard: true,
      email: true,
      push: false
    },
    alertsEnabled: true
  });

  // Getters
  const statsByType = computed(() => {
    return (type) => stats.value.filter(stat => stat.type === type);
  });

  const kpisByType = computed(() => {
    return (type) => kpis.value.filter(kpi => kpi.type === type);
  });

  const alertsBySeverity = computed(() => {
    return (severity) => alerts.value.filter(alert => alert.severity === severity);
  });

  const criticalAlerts = computed(() => {
    return alerts.value.filter(alert => alert.severity === 'critical' && !alert.acknowledged);
  });

  const unacknowledgedAlerts = computed(() => {
    return alerts.value.filter(alert => !alert.acknowledged);
  });

  const totalDocuments = computed(() => {
    const statsData = stats.value.find(stat => stat.type === 'documentos-estado');
    if (!statsData || !statsData.data) return 0;
    
    return Object.values(statsData.data).reduce((total, count) => total + count, 0);
  });

  const kpiTrends = computed(() => {
    return kpis.value.map(kpi => ({
      id: kpi.id,
      title: kpi.title,
      trend: kpi.trend,
      trendPercentage: kpi.trendPercentage
    }));
  });

  // Acciones
  async function loadDashboardData(forceRefresh = false) {
    if (isLoading.value) return;
    
    isLoading.value = true;
    error.value = null;
    
    try {
      // Cargar datos en paralelo
      const [statsData, kpisData, alertsData] = await Promise.all([
        getDashboardStats('general', filters.value, forceRefresh),
        getDashboardKPIs('general', filters.value, forceRefresh),
        getDashboardAlerts('general', filters.value, forceRefresh)
      ]);
      
      stats.value = statsData;
      kpis.value = kpisData;
      alerts.value = alertsData;
      lastUpdated.value = new Date();
    } catch (err) {
      error.value = err.message || 'Error al cargar datos del dashboard';
      console.error('Error cargando datos del dashboard:', err);
    } finally {
      isLoading.value = false;
    }
  }

  async function updateFilters(newFilters) {
    filters.value = { ...filters.value, ...newFilters };
    await loadDashboardData();
  }

  async function acknowledgeAlertAndUpdate(alertId) {
    try {
      await acknowledgeAlert(alertId);
      // Actualizar la alerta en local
      const alertIndex = alerts.value.findIndex(alert => alert.id === alertId);
      if (alertIndex !== -1) {
        alerts.value[alertIndex] = { 
          ...alerts.value[alertIndex], 
          acknowledged: true,
          acknowledgedAt: new Date(),
        };
      }
    } catch (err) {
      error.value = err.message || 'Error al confirmar la alerta';
      console.error('Error al confirmar la alerta:', err);
    }
  }

  async function escalateAlertAndUpdate(alertId, options = {}) {
    try {
      await escalateAlert(alertId, options);
      // Actualizar la alerta en local
      const alertIndex = alerts.value.findIndex(alert => alert.id === alertId);
      if (alertIndex !== -1) {
        alerts.value[alertIndex] = { 
          ...alerts.value[alertIndex], 
          escalated: true,
          escalatedAt: new Date(),
          escalatedTo: options.escalateTo
        };
      }
    } catch (err) {
      error.value = err.message || 'Error al escalar la alerta';
      console.error('Error al escalar la alerta:', err);
    }
  }

  async function exportDashboardStats(format, options = {}) {
    try {
      const statType = options.statType || 'general';
      return await exportStats(statType, filters.value, format, options);
    } catch (err) {
      error.value = err.message || 'Error al exportar estadísticas';
      console.error('Error al exportar estadísticas:', err);
      throw err;
    }
  }

  async function exportDashboardKPIs(format, options = {}) {
    try {
      const kpiType = options.kpiType || 'general';
      return await exportKPIs(kpiType, filters.value, format, options);
    } catch (err) {
      error.value = err.message || 'Error al exportar KPIs';
      console.error('Error al exportar KPIs:', err);
      throw err;
    }
  }

  async function exportDashboardAlerts(format, options = {}) {
    try {
      const alertType = options.alertType || 'general';
      return await exportAlerts(alertType, filters.value, format, options);
    } catch (err) {
      error.value = err.message || 'Error al exportar alertas';
      console.error('Error al exportar alertas:', err);
      throw err;
    }
  }

  async function updateUIConfig(newConfig) {
    uiConfig.value = { ...uiConfig.value, ...newConfig };
    // Guardar en localStorage para persistencia
    localStorage.setItem('dashboardUIConfig', JSON.stringify(uiConfig.value));
  }

  async function loadSavedConfig() {
    try {
      // Cargar configuración UI desde localStorage
      const savedUIConfig = localStorage.getItem('dashboardUIConfig');
      if (savedUIConfig) {
        uiConfig.value = { ...uiConfig.value, ...JSON.parse(savedUIConfig) };
      }
      
      // Cargar configuración de alertas desde el servidor
      const userAlertCfg = await getUserAlertConfig();
      alertConfig.value = userAlertCfg;
      
      // Cargar filtros guardados
      const savedFilters = localStorage.getItem('dashboardFilters');
      if (savedFilters) {
        const parsedFilters = JSON.parse(savedFilters);
        // Solo aplicar filtros válidos
        const validFilters = {};
        for (const key in parsedFilters) {
          if (key in filters.value) {
            validFilters[key] = parsedFilters[key];
          }
        }
        filters.value = { ...filters.value, ...validFilters };
      }
    } catch (err) {
      console.error('Error al cargar configuración guardada:', err);
    }
  }

  async function saveFilters() {
    localStorage.setItem('dashboardFilters', JSON.stringify(filters.value));
  }

  async function configureCache(config) {
    try {
      await configureDashboardCache(config);
    } catch (err) {
      error.value = err.message || 'Error al configurar caché';
      console.error('Error al configurar caché:', err);
    }
  }

  async function clearCache(cacheType) {
    try {
      await clearDashboardCache(cacheType);
    } catch (err) {
      error.value = err.message || 'Error al limpiar caché';
      console.error('Error al limpiar caché:', err);
    }
  }

  return {
    // Estado
    stats,
    kpis,
    alerts,
    isLoading,
    error,
    lastUpdated,
    filters,
    uiConfig,
    alertConfig,
    
    // Getters
    statsByType,
    kpisByType,
    alertsBySeverity,
    criticalAlerts,
    unacknowledgedAlerts,
    totalDocuments,
    kpiTrends,
    
    // Acciones
    loadDashboardData,
    updateFilters,
    acknowledgeAlertAndUpdate,
    escalateAlertAndUpdate,
    exportDashboardStats,
    exportDashboardKPIs,
    exportDashboardAlerts,
    updateUIConfig,
    loadSavedConfig,
    saveFilters,
    configureCache,
    clearCache
  };
}); 