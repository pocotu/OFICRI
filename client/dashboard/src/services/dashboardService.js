import { api } from '../../shared/src/services/api';
import { logOperation } from '../../shared/src/services/audit/auditService';

// Tipos de estadísticas disponibles
export const STAT_TYPES = {
  DOCUMENTOS_ESTADO: 'documentos-estado',
  TIEMPOS_ATENCION: 'tiempos-atencion',
  DERIVACIONES: 'derivaciones',
  USUARIOS_ACTIVOS: 'usuarios-activos'
};

// Tipos de KPIs disponibles
export const KPI_TYPES = {
  EFICIENCIA_AREA: 'eficiencia-area',
  TIEMPOS_PROMEDIO: 'tiempos-promedio',
  VOLUMEN_TRABAJO: 'volumen-trabajo',
  CALIDAD_SERVICIO: 'calidad-servicio'
};

// Tipos de alertas disponibles
export const ALERT_TYPES = {
  DOCUMENTOS_PENDIENTES: 'documentos-pendientes',
  TIEMPOS_EXCEDIDOS: 'tiempos-excedidos',
  ERRORES_SISTEMA: 'errores-sistema',
  ACTIVIDAD_INUSUAL: 'actividad-inusual'
};

// Configuración de caché
const cacheConfig = {
  enabled: true,
  ttl: 5 * 60 * 1000, // 5 minutos
  maxSize: 100, // máximo 100 items en caché
  compression: true
};

// Almacén de caché
const cacheStore = new Map();

// Limpiador de caché
const cacheCleaner = setInterval(() => {
  const now = Date.now();
  for (const [key, value] of cacheStore.entries()) {
    if (now - value.timestamp > cacheConfig.ttl) {
      cacheStore.delete(key);
    }
  }
}, cacheConfig.ttl);

// Función para comprimir datos
const compressData = (data) => {
  if (!cacheConfig.compression) return data;
  try {
    return JSON.stringify(data);
  } catch (error) {
    console.error('Error comprimiendo datos:', error);
    return data;
  }
};

// Función para descomprimir datos
const decompressData = (data) => {
  if (!cacheConfig.compression) return data;
  try {
    return JSON.parse(data);
  } catch (error) {
    console.error('Error descomprimiendo datos:', error);
    return data;
  }
};

// Función para generar clave de caché
const generateCacheKey = (endpoint, params) => {
  const sortedParams = Object.keys(params)
    .sort()
    .reduce((acc, key) => {
      acc[key] = params[key];
      return acc;
    }, {});
  return `${endpoint}:${JSON.stringify(sortedParams)}`;
};

// Función para obtener datos con caché
const getCachedData = async (endpoint, params = {}, forceRefresh = false) => {
  if (!cacheConfig.enabled || forceRefresh) {
    return await getDashboardData(endpoint, params);
  }

  const cacheKey = generateCacheKey(endpoint, params);
  const cached = cacheStore.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < cacheConfig.ttl) {
    return decompressData(cached.data);
  }

  const data = await getDashboardData(endpoint, params);
  cacheStore.set(cacheKey, {
    data: compressData(data),
    timestamp: Date.now()
  });

  // Limpiar caché si excede el tamaño máximo
  if (cacheStore.size > cacheConfig.maxSize) {
    const oldestKey = Array.from(cacheStore.entries())
      .sort((a, b) => a[1].timestamp - b[1].timestamp)[0][0];
    cacheStore.delete(oldestKey);
  }

  return data;
};

/**
 * Obtiene estadísticas del dashboard
 * @param {string} statType - Tipo de estadística a obtener
 * @param {Object} filters - Filtros opcionales
 * @returns {Promise<Object>} Datos estadísticos
 */
export async function getDashboardStats(statType, filters = {}) {
  return await getCachedData('stats', { statType, ...filters });
}

/**
 * Obtiene KPIs del dashboard
 * @param {string} kpiType - Tipo de KPI a obtener
 * @param {Object} filters - Filtros opcionales
 * @returns {Promise<Object>} Datos de KPIs
 */
export async function getDashboardKPIs(kpiType, filters = {}) {
  return await getCachedData('kpis', { kpiType, ...filters });
}

/**
 * Obtiene alertas del dashboard
 * @param {string} alertType - Tipo de alerta a obtener
 * @param {Object} filters - Filtros opcionales
 * @returns {Promise<Object>} Datos de alertas
 */
export async function getDashboardAlerts(alertType, filters = {}) {
  return await getCachedData('alerts', { alertType, ...filters });
}

/**
 * Configura la caché para datos del dashboard
 * @param {Object} config - Configuración de caché
 * @returns {Promise<void>}
 */
export async function configureDashboardCache(config) {
  Object.assign(cacheConfig, config);
  return cacheConfig;
}

/**
 * Limpia la caché del dashboard
 * @param {string} cacheType - Tipo de caché a limpiar
 * @returns {Promise<void>}
 */
export async function clearDashboardCache(cacheType) {
  if (cacheType) {
    for (const [key] of cacheStore.entries()) {
      if (key.startsWith(cacheType)) {
        cacheStore.delete(key);
      }
    }
  } else {
    cacheStore.clear();
  }
}

/**
 * Suscribe a actualizaciones en tiempo real del dashboard
 * @param {Function} callback - Función a ejecutar cuando hay actualizaciones
 * @returns {Function} Función para cancelar la suscripción
 */
export function subscribeToDashboardUpdates(callback) {
  const eventSource = new EventSource('/api/dashboard/updates');
  
  eventSource.onmessage = (event) => {
    const data = JSON.parse(event.data);
    callback(data);
  };

  eventSource.onerror = (error) => {
    logOperation('ERROR', 'dashboard', 'subscribeToDashboardUpdates', {
      error: error.message
    });
    eventSource.close();
  };

  return () => {
    eventSource.close();
  };
} 