/**
 * Store de Configuración - Gestión de configuraciones del módulo de áreas
 * Implementado con Pinia para mayor rendimiento y escalabilidad
 */

import { defineStore } from 'pinia';
import { ref, watch } from 'vue';
import { logOperation } from '@/shared/services/security/auditTrail';

// Clave para almacenar la configuración en localStorage
const STORAGE_KEY = 'oficri_areas_config';

// Configuración por defecto
const DEFAULT_CONFIG = {
  // Visualización
  theme: 'light',
  density: 'comfortable',
  showInactive: false,
  defaultView: 'tree', // 'tree', 'list', 'grid'
  
  // Comportamiento
  confirmDelete: true,
  autoExpand: true,
  dragAndDrop: true,
  
  // Tabla de áreas
  tableColumns: [
    { key: 'NombreArea', label: 'Nombre', visible: true, width: '30%' },
    { key: 'CodigoIdentificacion', label: 'Código', visible: true, width: '15%' },
    { key: 'TipoArea', label: 'Tipo', visible: true, width: '15%' },
    { key: 'Descripcion', label: 'Descripción', visible: true, width: '25%' },
    { key: 'IsActive', label: 'Estado', visible: true, width: '15%' }
  ],
  
  // Exportación
  exportFormat: 'pdf', // 'pdf', 'excel', 'csv', 'json'
  includeResponsibles: true,
  
  // Responsables
  responsiblesView: 'cards', // 'cards', 'list', 'table'
  
  // Rendimiento
  cacheEnabled: true,
  cacheExpiration: 5, // minutos
  
  // Notificaciones
  notifyOnChanges: true
};

export const useConfigStore = defineStore('areasConfig', () => {
  // Estado reactivo
  const config = ref(loadConfig());
  
  // Cargar configuración desde localStorage
  function loadConfig() {
    try {
      const storedConfig = localStorage.getItem(STORAGE_KEY);
      if (storedConfig) {
        // Fusionar configuración almacenada con la configuración por defecto
        // para asegurar que existan todas las propiedades necesarias
        return { ...DEFAULT_CONFIG, ...JSON.parse(storedConfig) };
      }
    } catch (error) {
      console.error('Error al cargar configuración:', error);
      // Registrar error
      logOperation('CONFIG', 'ERROR', 'Error al cargar configuración', {
        error: error.message
      });
    }
    
    return { ...DEFAULT_CONFIG };
  }
  
  // Guardar configuración en localStorage
  function saveConfig() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config.value));
      
      // Registrar operación
      logOperation('CONFIG', 'INFO', 'Configuración guardada');
      
      return true;
    } catch (error) {
      console.error('Error al guardar configuración:', error);
      // Registrar error
      logOperation('CONFIG', 'ERROR', 'Error al guardar configuración', {
        error: error.message
      });
      
      return false;
    }
  }
  
  // Observar cambios en la configuración y guardar automáticamente
  watch(config, () => {
    saveConfig();
  }, { deep: true });
  
  /**
   * Actualizar una configuración específica
   * @param {string} key - Clave de configuración
   * @param {any} value - Valor a establecer
   */
  function updateConfig(key, value) {
    if (key.includes('.')) {
      // Actualizar configuración anidada
      const keys = key.split('.');
      let obj = config.value;
      
      for (let i = 0; i < keys.length - 1; i++) {
        if (!obj[keys[i]]) {
          obj[keys[i]] = {};
        }
        obj = obj[keys[i]];
      }
      
      obj[keys[keys.length - 1]] = value;
    } else {
      // Actualizar configuración de primer nivel
      config.value[key] = value;
    }
    
    // Registrar actualización
    logOperation('CONFIG', 'INFO', `Configuración actualizada: ${key}`, {
      key,
      value
    });
  }
  
  /**
   * Actualizar múltiples configuraciones
   * @param {Object} updates - Objeto con actualizaciones { key: value }
   */
  function updateMultipleConfig(updates) {
    Object.entries(updates).forEach(([key, value]) => {
      updateConfig(key, value);
    });
  }
  
  /**
   * Restablecer toda la configuración a los valores predeterminados
   */
  function resetConfig() {
    config.value = { ...DEFAULT_CONFIG };
    saveConfig();
    
    // Registrar operación
    logOperation('CONFIG', 'INFO', 'Configuración restablecida a valores predeterminados');
  }
  
  /**
   * Exportar configuración actual
   * @returns {Object} Configuración actual
   */
  function exportConfig() {
    return { ...config.value };
  }
  
  /**
   * Importar configuración
   * @param {Object} importedConfig - Configuración a importar
   * @returns {boolean} Éxito de la operación
   */
  function importConfig(importedConfig) {
    try {
      // Validar que sea un objeto
      if (!importedConfig || typeof importedConfig !== 'object') {
        throw new Error('Formato de configuración inválido');
      }
      
      // Fusionar importación con configuración por defecto
      config.value = { ...DEFAULT_CONFIG, ...importedConfig };
      saveConfig();
      
      // Registrar operación
      logOperation('CONFIG', 'INFO', 'Configuración importada correctamente');
      
      return true;
    } catch (error) {
      console.error('Error al importar configuración:', error);
      // Registrar error
      logOperation('CONFIG', 'ERROR', 'Error al importar configuración', {
        error: error.message
      });
      
      return false;
    }
  }
  
  /**
   * Obtener una propiedad de configuración específica
   * @param {string} key - Clave de configuración
   * @param {any} defaultValue - Valor por defecto si no existe
   * @returns {any} Valor de configuración
   */
  function getConfig(key, defaultValue = null) {
    if (key.includes('.')) {
      // Obtener configuración anidada
      const keys = key.split('.');
      let value = config.value;
      
      for (const k of keys) {
        if (value === undefined || value === null || typeof value !== 'object') {
          return defaultValue;
        }
        value = value[k];
      }
      
      return value !== undefined ? value : defaultValue;
    }
    
    // Obtener configuración de primer nivel
    return config.value[key] !== undefined ? config.value[key] : defaultValue;
  }
  
  /**
   * Verificar si una característica está habilitada
   * @param {string} feature - Nombre de la característica
   * @returns {boolean} true si está habilitada
   */
  function isFeatureEnabled(feature) {
    return getConfig(feature, false) === true;
  }
  
  /**
   * Verificar si una columna de tabla está visible
   * @param {string} columnKey - Clave de la columna
   * @returns {boolean} true si está visible
   */
  function isColumnVisible(columnKey) {
    const columns = config.value.tableColumns || [];
    const column = columns.find(col => col.key === columnKey);
    return column ? column.visible : false;
  }
  
  /**
   * Actualizar visibilidad de una columna
   * @param {string} columnKey - Clave de la columna
   * @param {boolean} visible - Estado de visibilidad
   */
  function setColumnVisibility(columnKey, visible) {
    const columns = config.value.tableColumns || [];
    const columnIndex = columns.findIndex(col => col.key === columnKey);
    
    if (columnIndex !== -1) {
      columns[columnIndex].visible = visible;
      // Registrar cambio
      logOperation('CONFIG', 'INFO', `Visibilidad de columna actualizada: ${columnKey}`, {
        columnKey,
        visible
      });
    }
  }
  
  return {
    // Estado
    config,
    
    // Acciones
    loadConfig,
    saveConfig,
    updateConfig,
    updateMultipleConfig,
    resetConfig,
    exportConfig,
    importConfig,
    getConfig,
    isFeatureEnabled,
    isColumnVisible,
    setColumnVisibility
  };
}); 