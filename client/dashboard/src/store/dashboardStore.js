import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { 
  getDashboardStats, 
  getDashboardKPIs, 
  getDashboardAlerts 
} from '../services/dashboardService';
import { 
  acknowledgeAlert, 
  escalateAlert 
} from '../services/alertService';
import { exportData as exportDashboardData } from '../services/exportService';

export const useDashboardStore = defineStore('dashboard', () => {
  // Estado
  const stats = ref({
    documents: {},
    users: 0,
    areas: 0,
    pending: 0
  });
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

  // Getters computados
  const criticalAlerts = computed(() => {
    return alerts.value.filter(alert => 
      alert.severity === 'critical' && !alert.acknowledged
    );
  });

  const unacknowledgedAlerts = computed(() => {
    return alerts.value.filter(alert => !alert.acknowledged);
  });

  const totalDocuments = computed(() => {
    return Object.values(stats.value.documents).reduce((total, count) => total + count, 0);
  });

  const kpiTrends = computed(() => {
    return kpis.value.map(kpi => ({
      id: kpi.id,
      title: kpi.title,
      trend: kpi.trend,
      trendPercentage: kpi.trend.value
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
        getDashboardStats(filters.value),
        getDashboardKPIs(filters.value),
        getDashboardAlerts(filters.value)
      ]);
      
      // Actualizar estado
      stats.value = statsData;
      kpis.value = kpisData;
      alerts.value = alertsData;
      lastUpdated.value = new Date();
      
      // Guardar en caché si no es una recarga forzada
      if (!forceRefresh) {
        saveToCache();
      }
    } catch (err) {
      error.value = err.message || 'Error al cargar datos del dashboard';
      console.error('Error cargando datos del dashboard:', err);
    } finally {
      isLoading.value = false;
    }
  }

  async function updateFilters(newFilters) {
    filters.value = { ...filters.value, ...newFilters };
  }

  async function saveFilters() {
    try {
      localStorage.setItem('dashboard_filters', JSON.stringify(filters.value));
    } catch (error) {
      console.error('Error guardando filtros:', error);
    }
  }

  async function loadSavedConfig() {
    try {
      // Cargar filtros guardados
      const savedFilters = localStorage.getItem('dashboard_filters');
      if (savedFilters) {
        filters.value = { ...filters.value, ...JSON.parse(savedFilters) };
      }

      // Cargar configuración UI guardada
      const savedUIConfig = localStorage.getItem('dashboard_ui_config');
      if (savedUIConfig) {
        uiConfig.value = { ...uiConfig.value, ...JSON.parse(savedUIConfig) };
      }
    } catch (error) {
      console.error('Error cargando configuración guardada:', error);
    }
  }

  async function acknowledgeAlertAndUpdate(alertId) {
    try {
      await acknowledgeAlert(alertId);
      // Actualizar estado local
      const alert = alerts.value.find(a => a.id === alertId);
      if (alert) {
        alert.acknowledged = true;
      }
    } catch (error) {
      console.error('Error al confirmar alerta:', error);
      throw error;
    }
  }

  async function escalateAlertAndUpdate(alertId) {
    try {
      await escalateAlert(alertId);
      // Recargar alertas para obtener el estado actualizado
      await loadDashboardData();
    } catch (error) {
      console.error('Error al escalar alerta:', error);
      throw error;
    }
  }

  async function exportData(options) {
    try {
      const data = {
        kpis: kpis.value,
        stats: stats.value,
        alerts: alerts.value,
        filters: filters.value,
        lastUpdated: lastUpdated.value
      };
      
      await exportDashboardData(data, options);
    } catch (error) {
      console.error('Error al exportar datos:', error);
      throw error;
    }
  }

  function saveToCache() {
    try {
      const cacheData = {
        stats: stats.value,
        kpis: kpis.value,
        alerts: alerts.value,
        lastUpdated: lastUpdated.value
      };
      localStorage.setItem('dashboard_cache', JSON.stringify(cacheData));
    } catch (error) {
      console.error('Error guardando en caché:', error);
    }
  }

  function loadFromCache() {
    try {
      const cached = localStorage.getItem('dashboard_cache');
      if (cached) {
        const data = JSON.parse(cached);
        stats.value = data.stats;
        kpis.value = data.kpis;
        alerts.value = data.alerts;
        lastUpdated.value = new Date(data.lastUpdated);
        return true;
      }
    } catch (error) {
      console.error('Error cargando desde caché:', error);
    }
    return false;
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
    
    // Getters
    criticalAlerts,
    unacknowledgedAlerts,
    totalDocuments,
    kpiTrends,
    
    // Acciones
    loadDashboardData,
    updateFilters,
    saveFilters,
    loadSavedConfig,
    acknowledgeAlertAndUpdate,
    escalateAlertAndUpdate,
    exportData
  };
}); 
}); 