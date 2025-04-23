/**
 * Sistema Dinámico de Registro de Áreas
 * 
 * Este módulo proporciona un sistema completo para gestionar áreas en la aplicación:
 * - Registro de áreas nuevas
 * - Validación de datos
 * - Caché local para rendimiento
 * - Sincronización con el servidor
 * - Gestión de conflictos
 * - Monitoreo del sistema
 */

import areaRegistryService from './areaRegistryService';
import areaValidatorService from './areaValidatorService';
import areaCacheService from './areaCacheService';
import areaSyncService from './areaSyncService';
import areaMonitoringService from './areaMonitoringService';

// Re-exportar servicios individuales
export const areaRegistry = areaRegistryService;
export const areaValidator = areaValidatorService;
export const areaCache = areaCacheService;
export const areaSync = areaSyncService;
export const areaMonitor = areaMonitoringService;

/**
 * Inicializa todo el sistema de registro de áreas
 * @param {Object} options Opciones de configuración
 * @returns {Promise<boolean>} true si se inicializó correctamente
 */
export async function initializeAreaRegistry(options = {}) {
  try {
    // Inicializar caché primero
    areaCacheService.initCache(options.cache);
    
    // Inicializar sincronización
    await areaSyncService.initializeSyncService(options.sync);
    
    // Finalizar inicialización del registro
    await areaRegistryService.initializeAreaRegistry();
    
    // Iniciar monitoreo si está habilitado
    if (options.enableMonitoring !== false) {
      if (options.monitoring) {
        areaMonitoringService.configureMonitoring(options.monitoring);
      }
      areaMonitoringService.startMonitoring();
    }
    
    return true;
  } catch (error) {
    console.error('Error inicializando sistema de registro de áreas:', error);
    return false;
  }
}

/**
 * Detiene todos los servicios del sistema de registro de áreas
 */
export function shutdownAreaRegistry() {
  // Detener monitoreo
  areaMonitoringService.stopMonitoring();
  
  // Detener sincronización
  areaSyncService.stopSyncService();
  
  // Limpiar caché si es necesario
  if (arguments[0]?.clearCache) {
    areaCacheService.clearCache();
  }
}

/**
 * Devuelve el plugin Vue para integrar el sistema de registro de áreas
 */
export const AreaRegistryPlugin = {
  install(app, options = {}) {
    // Proporcionar servicios
    app.provide('areaRegistry', areaRegistryService);
    app.provide('areaValidator', areaValidatorService);
    app.provide('areaCache', areaCacheService);
    app.provide('areaSync', areaSyncService);
    app.provide('areaMonitor', areaMonitoringService);
    
    // Inicializar automáticamente si se configura
    if (options.autoInit) {
      initializeAreaRegistry(options);
      
      // Registrar cierre al desmontar la aplicación
      app.unmounted(() => {
        shutdownAreaRegistry();
      });
    }
    
    // Añadir método global
    app.config.globalProperties.$areas = {
      registry: areaRegistryService,
      validator: areaValidatorService,
      cache: areaCacheService,
      sync: areaSyncService,
      monitor: areaMonitoringService,
      initialize: initializeAreaRegistry,
      shutdown: shutdownAreaRegistry
    };
  }
};

// Exportar como default un objeto con todos los servicios
export default {
  registry: areaRegistryService,
  validator: areaValidatorService,
  cache: areaCacheService,
  sync: areaSyncService,
  monitor: areaMonitoringService,
  initialize: initializeAreaRegistry,
  shutdown: shutdownAreaRegistry,
  plugin: AreaRegistryPlugin
}; 