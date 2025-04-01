/**
 * OFICRI App Configuration
 * Configuración centralizada de la aplicación
 */

// Constantes de entorno
const ENV = {
  DEVELOPMENT: 'development',
  PRODUCTION: 'production',
  TESTING: 'testing'
};

// Configuración por defecto
const defaultConfig = {
  // Entorno actual (development, production, testing)
  environment: ENV.DEVELOPMENT,
  
  // API base URL
  apiUrl: 'http://localhost:3000/api',
  
  // Timeout para peticiones API (ms)
  apiTimeout: 30000,
  
  // Opciones de seguridad
  security: {
    // Tiempo de expiración de sesión (ms) - 30 minutos
    sessionTimeout: 30 * 60 * 1000,
    
    // Comprobación de sesión periódica (ms) - 1 minuto
    sessionCheckInterval: 60 * 1000,
    
    // Mostrar advertencia de sesión a punto de expirar (ms antes de expirar)
    sessionWarningTime: 5 * 60 * 1000
  },
  
  // Opciones de notificaciones
  notifications: {
    // Duración por defecto (ms)
    duration: 5000,
    
    // Posición por defecto
    position: 'top-right',
    
    // Límite de notificaciones simultáneas
    maxNotifications: 5
  },
  
  // Opciones de logging
  logging: {
    // Nivel de log (trace, debug, info, warn, error, critical)
    level: 'info',
    
    // Registrar eventos en el servidor en entorno de desarrollo
    logEventsInDev: false,
    
    // Registrar performance metrics
    logPerformance: false,
    
    // Nuevas opciones para el depurador global
    persistLogs: true,                // Guardar logs en localStorage
    maxPersistedLogs: 1000,           // Número máximo de logs almacenados
    captureGlobalErrors: true,        // Capturar errores no controlados
    enablePerformanceMonitoring: true, // Monitoreo de rendimiento
    allowLogExport: true,             // Permitir exportar logs
    
    // Configuración por módulo
    moduleLevels: {
      // 'NOMBRE_MODULO': 'debug'
    }
  }
};

// Configuración específica por entorno
const envConfig = {
  [ENV.DEVELOPMENT]: {
    logging: {
      level: 'debug',
      logEventsInDev: false,
      persistLogs: true,
      captureGlobalErrors: true,
      enablePerformanceMonitoring: true
    }
  },
  [ENV.PRODUCTION]: {
    apiUrl: window.location.origin + '/api',
    logging: {
      level: 'warn',          // En producción solo warn, error y critical
      logEventsInDev: true,
      persistLogs: false,     // Deshabilitar persistencia en producción por defecto
      captureGlobalErrors: true,
      enablePerformanceMonitoring: false
    }
  },
  [ENV.TESTING]: {
    apiUrl: 'http://localhost:3000/api',
    logging: {
      level: 'debug',
      logEventsInDev: true,
      persistLogs: true,
      captureGlobalErrors: true,
      enablePerformanceMonitoring: true
    }
  }
};

// Detectar entorno actual
function detectEnvironment() {
  const hostname = window.location.hostname;
  
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return ENV.DEVELOPMENT;
  }
  
  // Si hay una variable específica en la URL
  if (window.location.search.includes('env=test')) {
    return ENV.TESTING;
  }
  
  return ENV.PRODUCTION;
}

// Combinar configuraciones
function createConfig() {
  const currentEnv = detectEnvironment();
  const envSpecificConfig = envConfig[currentEnv] || {};
  
  // Combinar configuraciones (deep merge)
  const mergedConfig = {
    ...defaultConfig,
    ...envSpecificConfig,
    environment: currentEnv,
    security: {
      ...defaultConfig.security,
      ...(envSpecificConfig.security || {})
    },
    notifications: {
      ...defaultConfig.notifications,
      ...(envSpecificConfig.notifications || {})
    },
    logging: {
      ...defaultConfig.logging,
      ...(envSpecificConfig.logging || {}),
      moduleLevels: {
        ...defaultConfig.logging.moduleLevels,
        ...((envSpecificConfig.logging && envSpecificConfig.logging.moduleLevels) || {})
      }
    }
  };
  
  return mergedConfig;
}

// Crear la configuración final
const appConfig = createConfig();

// Funciones de ayuda
appConfig.isDevelopment = () => appConfig.environment === ENV.DEVELOPMENT;
appConfig.isProduction = () => appConfig.environment === ENV.PRODUCTION;
appConfig.isTesting = () => appConfig.environment === ENV.TESTING;

// Función para manejo de eventos
appConfig.shouldLogEventsInDev = () => appConfig.logging.logEventsInDev || false;

// Habilitar debug con parámetro URL
if (window.location.search.includes('debug=true')) {
  appConfig.logging.level = 'debug';
  appConfig.logging.persistLogs = true;
  appConfig.logging.enablePerformanceMonitoring = true;
  
  // Marcar en la consola que se activó el modo debug
  console.info('%c[OFICRI]%c Modo debug activado vía URL', 'color:#0dcaf0;font-weight:bold', 'color:inherit');
}

// Exponer configuración
export { appConfig };
export default appConfig; 