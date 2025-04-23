/**
 * performanceMonitor.js - Servicio para monitorizar el rendimiento de la aplicación
 * 
 * Proporciona herramientas para medir, reportar y optimizar el rendimiento
 * de carga y ejecución de la aplicación OFICRI.
 */

// Constantes para métricas
const METRICS = {
  TTFB: 'time-to-first-byte',                // Tiempo hasta primer byte
  FCP: 'first-contentful-paint',             // Primera pintura con contenido
  LCP: 'largest-contentful-paint',           // Mayor pintura con contenido
  FID: 'first-input-delay',                  // Retardo primera interacción
  CLS: 'cumulative-layout-shift',            // Cambio acumulativo de diseño
  ROUTE_CHANGE: 'route-change-time',         // Tiempo cambio de ruta
  COMPONENT_LOAD: 'component-load-time',     // Tiempo carga componente
  RESOURCE_LOAD: 'resource-load-time',       // Tiempo carga recurso
  API_REQUEST: 'api-request-time',           // Tiempo petición API
  MEMORY_USAGE: 'memory-usage',              // Uso de memoria
  LONG_TASK: 'long-task',                    // Tareas largas (>50ms)
  JS_ERROR: 'javascript-error',              // Errores JavaScript
  RESOURCE_ERROR: 'resource-error',          // Errores carga recursos
  NETWORK_INFO: 'network-information',       // Información de red
  CACHE_PERFORMANCE: 'cache-performance'     // Rendimiento de caché
};

// Métricas acumuladas
let metrics = {
  [METRICS.TTFB]: [],
  [METRICS.FCP]: [],
  [METRICS.LCP]: [],
  [METRICS.FID]: [],
  [METRICS.CLS]: [],
  [METRICS.ROUTE_CHANGE]: [],
  [METRICS.COMPONENT_LOAD]: [],
  [METRICS.RESOURCE_LOAD]: [],
  [METRICS.API_REQUEST]: [],
  [METRICS.MEMORY_USAGE]: [],
  [METRICS.LONG_TASK]: [],
  [METRICS.JS_ERROR]: [],
  [METRICS.RESOURCE_ERROR]: [],
  [METRICS.NETWORK_INFO]: null,
  [METRICS.CACHE_PERFORMANCE]: {}
};

// Configuración
let config = {
  enabled: true,                     // Activar/desactivar monitoreo
  sampleRate: 1.0,                   // Porcentaje de usuarios monitoreados (0-1)
  reportingEndpoint: null,           // Endpoint para reportar métricas
  reportingInterval: 60000,          // Intervalo para reportar métricas (ms)
  reportingBatchSize: 50,            // Tamaño máximo del lote de métricas
  maxEventsStored: 1000,             // Máximo de eventos almacenados
  autoCollectWebVitals: true,        // Recolectar automáticamente Web Vitals
  autoCollectErrors: true,           // Recolectar automáticamente errores
  autoCollectResources: true,        // Recolectar automáticamente recursos
  logToConsole: false,               // Registrar métricas en consola
  storageKey: 'oficri_perf_metrics', // Clave para almacenar métricas en localStorage
  reportingCallback: null            // Función callback para reportes
};

// ID de sesión
const sessionId = generateSessionId();

// Variables internas
let isInitialized = false;
let reportingTimer = null;
let observers = [];
let longTaskObserver = null;

/**
 * Genera un ID único para la sesión
 * @returns {string} ID de sesión
 */
function generateSessionId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

/**
 * Inicializa el monitor de rendimiento
 * @param {Object} options - Opciones de configuración
 */
function init(options = {}) {
  if (isInitialized) return;
  
  // Fusionar configuración
  config = { ...config, ...options };
  
  // Decidir si se monitorea a este usuario según sampleRate
  if (Math.random() > config.sampleRate) {
    config.enabled = false;
    return;
  }
  
  if (!config.enabled) return;
  
  // Cargar métricas previas si están almacenadas
  loadStoredMetrics();
  
  // Recolectar métricas web vitales si está habilitado
  if (config.autoCollectWebVitals) {
    collectWebVitals();
  }
  
  // Recolectar errores si está habilitado
  if (config.autoCollectErrors) {
    setupErrorTracking();
  }
  
  // Recolectar recursos si está habilitado
  if (config.autoCollectResources) {
    setupResourceTracking();
  }
  
  // Configurar observador de tareas largas
  setupLongTaskObserver();
  
  // Iniciar reporte periódico
  if (config.reportingEndpoint || config.reportingCallback) {
    startPeriodicReporting();
  }
  
  // Recolectar información de red
  collectNetworkInformation();
  
  isInitialized = true;
}

/**
 * Carga métricas almacenadas previamente
 */
function loadStoredMetrics() {
  if (typeof localStorage === 'undefined') return;
  
  try {
    const storedMetrics = localStorage.getItem(config.storageKey);
    if (storedMetrics) {
      const parsedMetrics = JSON.parse(storedMetrics);
      // Fusionar con las métricas actuales
      Object.keys(parsedMetrics).forEach(key => {
        if (metrics[key] && Array.isArray(metrics[key]) && Array.isArray(parsedMetrics[key])) {
          metrics[key] = [...parsedMetrics[key], ...metrics[key]];
        } else if (typeof parsedMetrics[key] === 'object' && parsedMetrics[key] !== null) {
          metrics[key] = { ...parsedMetrics[key], ...metrics[key] };
        } else {
          metrics[key] = parsedMetrics[key];
        }
      });
    }
  } catch (error) {
    console.error('Error cargando métricas almacenadas:', error);
  }
}

/**
 * Almacena métricas en localStorage
 */
function storeMetrics() {
  if (typeof localStorage === 'undefined') return;
  
  try {
    localStorage.setItem(config.storageKey, JSON.stringify(metrics));
  } catch (error) {
    console.error('Error almacenando métricas:', error);
  }
}

/**
 * Iniciar reportes periódicos
 */
function startPeriodicReporting() {
  if (reportingTimer) clearInterval(reportingTimer);
  
  reportingTimer = setInterval(() => {
    reportMetrics();
  }, config.reportingInterval);
  
  // Reportar métricas antes de que el usuario abandone la página
  if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', reportMetrics);
  }
}

/**
 * Detener reportes periódicos
 */
function stopPeriodicReporting() {
  if (reportingTimer) {
    clearInterval(reportingTimer);
    reportingTimer = null;
  }
  
  if (typeof window !== 'undefined') {
    window.removeEventListener('beforeunload', reportMetrics);
  }
}

/**
 * Configura observador de tareas largas
 */
function setupLongTaskObserver() {
  if (typeof window === 'undefined' || !window.PerformanceObserver) return;
  
  try {
    longTaskObserver = new PerformanceObserver((entryList) => {
      entryList.getEntries().forEach(entry => {
        recordMetric(METRICS.LONG_TASK, {
          duration: entry.duration,
          startTime: entry.startTime,
          name: entry.name,
          timestamp: Date.now()
        });
      });
    });
    
    longTaskObserver.observe({ entryTypes: ['longtask'] });
    observers.push(longTaskObserver);
  } catch (error) {
    console.error('Error configurando observador de tareas largas:', error);
  }
}

/**
 * Recolecta Web Vitals
 */
function collectWebVitals() {
  if (typeof window === 'undefined' || !window.PerformanceObserver) return;
  
  try {
    // Observador para FCP
    const fcpObserver = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      entries.forEach(entry => {
        if (entry.name === 'first-contentful-paint') {
          recordMetric(METRICS.FCP, {
            value: entry.startTime,
            timestamp: Date.now()
          });
        }
      });
    });
    fcpObserver.observe({ type: 'paint', buffered: true });
    observers.push(fcpObserver);
    
    // Observador para LCP
    const lcpObserver = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      entries.forEach(entry => {
        recordMetric(METRICS.LCP, {
          value: entry.startTime,
          size: entry.size,
          timestamp: Date.now()
        });
      });
    });
    lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
    observers.push(lcpObserver);
    
    // Observador para FID
    const fidObserver = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      entries.forEach(entry => {
        if (entry.processingStart && entry.startTime) {
          const fid = entry.processingStart - entry.startTime;
          recordMetric(METRICS.FID, {
            value: fid,
            timestamp: Date.now()
          });
        }
      });
    });
    fidObserver.observe({ type: 'first-input', buffered: true });
    observers.push(fidObserver);
    
    // Observador para CLS
    const clsObserver = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      let clsValue = 0;
      
      entries.forEach(entry => {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
        }
      });
      
      recordMetric(METRICS.CLS, {
        value: clsValue,
        timestamp: Date.now()
      });
    });
    clsObserver.observe({ type: 'layout-shift', buffered: true });
    observers.push(clsObserver);
    
    // TTFB desde performance timing
    if (performance.timing) {
      const ttfb = performance.timing.responseStart - performance.timing.navigationStart;
      recordMetric(METRICS.TTFB, {
        value: ttfb,
        timestamp: Date.now()
      });
    }
  } catch (error) {
    console.error('Error recolectando Web Vitals:', error);
  }
}

/**
 * Configura seguimiento de errores
 */
function setupErrorTracking() {
  if (typeof window === 'undefined') return;
  
  // Capturar errores no manejados
  window.addEventListener('error', (event) => {
    recordMetric(METRICS.JS_ERROR, {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      stack: event.error?.stack,
      timestamp: Date.now()
    });
  });
  
  // Capturar promesas rechazadas no manejadas
  window.addEventListener('unhandledrejection', (event) => {
    recordMetric(METRICS.JS_ERROR, {
      message: 'Unhandled Promise Rejection',
      reason: String(event.reason),
      stack: event.reason?.stack,
      timestamp: Date.now()
    });
  });
}

/**
 * Configura seguimiento de recursos
 */
function setupResourceTracking() {
  if (typeof window === 'undefined' || !window.PerformanceObserver) return;
  
  try {
    const resourceObserver = new PerformanceObserver((entryList) => {
      entryList.getEntries().forEach(entry => {
        // Incluir solo recursos relevantes (JS, CSS, imágenes)
        if (/\.(js|css|png|jpe?g|gif|svg|webp|ico|woff2?)$/i.test(entry.name)) {
          recordMetric(METRICS.RESOURCE_LOAD, {
            name: entry.name,
            initiatorType: entry.initiatorType,
            duration: entry.duration,
            transferSize: entry.transferSize,
            decodedBodySize: entry.decodedBodySize,
            timestamp: Date.now()
          });
          
          // Detectar errores de carga (transferSize === 0 podría indicar un error o caché)
          if (entry.transferSize === 0 && entry.decodedBodySize === 0 && !entry.responseEnd) {
            recordMetric(METRICS.RESOURCE_ERROR, {
              name: entry.name,
              initiatorType: entry.initiatorType,
              timestamp: Date.now()
            });
          }
          
          // Comprobar si se usó caché
          if (entry.transferSize === 0 && entry.decodedBodySize > 0) {
            const cacheKey = entry.initiatorType || 'other';
            metrics[METRICS.CACHE_PERFORMANCE][cacheKey] = metrics[METRICS.CACHE_PERFORMANCE][cacheKey] || { hits: 0, misses: 0 };
            metrics[METRICS.CACHE_PERFORMANCE][cacheKey].hits++;
          } else {
            const cacheKey = entry.initiatorType || 'other';
            metrics[METRICS.CACHE_PERFORMANCE][cacheKey] = metrics[METRICS.CACHE_PERFORMANCE][cacheKey] || { hits: 0, misses: 0 };
            metrics[METRICS.CACHE_PERFORMANCE][cacheKey].misses++;
          }
        }
      });
    });
    
    resourceObserver.observe({ entryTypes: ['resource'] });
    observers.push(resourceObserver);
  } catch (error) {
    console.error('Error configurando seguimiento de recursos:', error);
  }
}

/**
 * Recolecta información de red
 */
function collectNetworkInformation() {
  if (typeof navigator === 'undefined' || !navigator.connection) return;
  
  try {
    const connection = navigator.connection;
    
    metrics[METRICS.NETWORK_INFO] = {
      effectiveType: connection.effectiveType,
      downlink: connection.downlink,
      rtt: connection.rtt,
      saveData: connection.saveData,
      timestamp: Date.now()
    };
    
    // Actualizar cuando cambia la conexión
    connection.addEventListener('change', () => {
      metrics[METRICS.NETWORK_INFO] = {
        effectiveType: connection.effectiveType,
        downlink: connection.downlink,
        rtt: connection.rtt,
        saveData: connection.saveData,
        timestamp: Date.now()
      };
    });
  } catch (error) {
    console.error('Error recolectando información de red:', error);
  }
}

/**
 * Registra una métrica
 * @param {string} metricType - Tipo de métrica
 * @param {Object} metricData - Datos de la métrica
 */
function recordMetric(metricType, metricData) {
  if (!config.enabled || !metrics[metricType]) return;
  
  const metricEntry = {
    sessionId,
    ...metricData
  };
  
  // Añadir métrica al array correspondiente
  if (Array.isArray(metrics[metricType])) {
    metrics[metricType].push(metricEntry);
    
    // Limitar tamaño del array
    if (metrics[metricType].length > config.maxEventsStored) {
      metrics[metricType] = metrics[metricType].slice(-config.maxEventsStored);
    }
  } else if (typeof metrics[metricType] === 'object' && metrics[metricType] !== null) {
    metrics[metricType] = { ...metrics[metricType], ...metricEntry };
  } else {
    metrics[metricType] = metricEntry;
  }
  
  // Log en consola si está habilitado
  if (config.logToConsole) {
    console.log(`[Performance Monitor] ${metricType}:`, metricEntry);
  }
  
  // Almacenar métricas
  if (typeof localStorage !== 'undefined') {
    storeMetrics();
  }
}

/**
 * Marca el inicio de una medición personalizada
 * @param {string} markName - Nombre de la marca
 */
function mark(markName) {
  if (!config.enabled || typeof performance === 'undefined') return;
  
  try {
    performance.mark(`${markName}-start`);
  } catch (error) {
    console.error(`Error creando marca de inicio ${markName}:`, error);
  }
}

/**
 * Marca el final de una medición personalizada y registra la duración
 * @param {string} markName - Nombre de la marca
 * @param {string} metricType - Tipo de métrica a registrar
 */
function measure(markName, metricType) {
  if (!config.enabled || typeof performance === 'undefined') return;
  
  try {
    performance.mark(`${markName}-end`);
    performance.measure(markName, `${markName}-start`, `${markName}-end`);
    
    const entry = performance.getEntriesByName(markName).pop();
    if (entry) {
      recordMetric(metricType || markName, {
        value: entry.duration,
        name: markName,
        timestamp: Date.now()
      });
    }
    
    // Limpiar marcas usadas
    performance.clearMarks(`${markName}-start`);
    performance.clearMarks(`${markName}-end`);
    performance.clearMeasures(markName);
  } catch (error) {
    console.error(`Error midiendo ${markName}:`, error);
  }
}

/**
 * Mide el tiempo de cambio de ruta
 * @param {string} fromRoute - Ruta origen
 * @param {string} toRoute - Ruta destino
 */
function measureRouteChange(fromRoute, toRoute) {
  if (!config.enabled) return;
  
  const routeChangeId = `route-${Date.now()}`;
  mark(routeChangeId);
  
  // Esperar al siguiente ciclo para medir cuando se ha renderizado
  setTimeout(() => {
    measure(routeChangeId, METRICS.ROUTE_CHANGE);
    
    recordMetric(METRICS.ROUTE_CHANGE, {
      from: fromRoute,
      to: toRoute,
      timestamp: Date.now()
    });
  }, 100);
}

/**
 * Mide tiempo de carga de un componente
 * @param {string} componentName - Nombre del componente
 */
function measureComponentLoad(componentName) {
  if (!config.enabled) return;
  
  const componentLoadId = `component-${componentName}-${Date.now()}`;
  mark(componentLoadId);
  
  return {
    end: () => {
      measure(componentLoadId, METRICS.COMPONENT_LOAD);
      
      recordMetric(METRICS.COMPONENT_LOAD, {
        component: componentName,
        timestamp: Date.now()
      });
    }
  };
}

/**
 * Mide tiempo de petición API
 * @param {string} endpoint - Endpoint de la API
 * @param {string} method - Método HTTP
 */
function measureApiRequest(endpoint, method) {
  if (!config.enabled) return { end: () => {} };
  
  const apiRequestId = `api-${endpoint}-${Date.now()}`;
  mark(apiRequestId);
  
  return {
    end: (success = true, statusCode = 200) => {
      measure(apiRequestId, METRICS.API_REQUEST);
      
      recordMetric(METRICS.API_REQUEST, {
        endpoint,
        method,
        success,
        statusCode,
        timestamp: Date.now()
      });
    }
  };
}

/**
 * Reporta las métricas recolectadas
 */
function reportMetrics() {
  if (!config.enabled) return;
  
  const metricsToReport = {
    sessionId,
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
    metrics: { ...metrics },
    timestamp: Date.now()
  };
  
  // Si hay callback, llamarlo
  if (typeof config.reportingCallback === 'function') {
    try {
      config.reportingCallback(metricsToReport);
    } catch (error) {
      console.error('Error en reportingCallback:', error);
    }
  }
  
  // Si hay endpoint, enviar métricas
  if (config.reportingEndpoint && typeof fetch !== 'undefined') {
    try {
      fetch(config.reportingEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(metricsToReport),
        // No esperar respuesta
        keepalive: true
      }).catch(error => {
        console.error('Error reportando métricas:', error);
      });
    } catch (error) {
      console.error('Error enviando métricas:', error);
    }
  }
  
  // Limpiar métricas enviadas
  clearMetrics();
}

/**
 * Limpia las métricas recolectadas
 */
function clearMetrics() {
  Object.keys(metrics).forEach(key => {
    if (Array.isArray(metrics[key])) {
      metrics[key] = [];
    } else if (typeof metrics[key] === 'object' && metrics[key] !== null) {
      metrics[key] = {};
    } else {
      metrics[key] = null;
    }
  });
  
  // Limpiar localStorage
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem(config.storageKey);
  }
}

/**
 * Limpia todos los recursos del monitor
 */
function cleanup() {
  stopPeriodicReporting();
  
  // Desconectar todos los observadores
  observers.forEach(observer => {
    if (observer && typeof observer.disconnect === 'function') {
      observer.disconnect();
    }
  });
  
  observers = [];
  isInitialized = false;
}

/**
 * Obtiene un resumen de las métricas
 * @returns {Object} Resumen de métricas
 */
function getMetricsSummary() {
  const summary = {};
  
  // Procesar métricas de array
  Object.keys(metrics).forEach(key => {
    if (Array.isArray(metrics[key]) && metrics[key].length > 0) {
      const values = metrics[key]
        .filter(m => typeof m.value === 'number')
        .map(m => m.value);
        
      if (values.length > 0) {
        summary[key] = {
          min: Math.min(...values),
          max: Math.max(...values),
          avg: values.reduce((a, b) => a + b, 0) / values.length,
          count: metrics[key].length
        };
      }
    } else if (key === METRICS.NETWORK_INFO) {
      summary[key] = metrics[key];
    } else if (key === METRICS.CACHE_PERFORMANCE) {
      summary[key] = {};
      
      Object.keys(metrics[key]).forEach(cacheKey => {
        const cacheData = metrics[key][cacheKey];
        const total = cacheData.hits + cacheData.misses;
        
        if (total > 0) {
          summary[key][cacheKey] = {
            ...cacheData,
            hitRate: cacheData.hits / total
          };
        }
      });
    }
  });
  
  return summary;
}

/**
 * Obtiene métricas relacionadas con Web Vitals
 * @returns {Object} Métricas Web Vitals
 */
function getWebVitals() {
  const webVitals = {};
  
  [METRICS.FCP, METRICS.LCP, METRICS.CLS, METRICS.FID, METRICS.TTFB].forEach(metricName => {
    if (Array.isArray(metrics[metricName]) && metrics[metricName].length > 0) {
      // Usar el último valor registrado para cada métrica
      webVitals[metricName] = metrics[metricName][metrics[metricName].length - 1].value;
    }
  });
  
  return webVitals;
}

// Exportar API pública
export default {
  init,
  recordMetric,
  mark,
  measure,
  measureRouteChange,
  measureComponentLoad,
  measureApiRequest,
  reportMetrics,
  clearMetrics,
  cleanup,
  getMetricsSummary,
  getWebVitals,
  METRICS
}; 