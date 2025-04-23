import { reactive, watchEffect } from 'vue';
import { eventBus } from '../event-bus/eventBus';

/**
 * Servicio de caché para áreas
 * Proporciona almacenamiento local eficiente y sincronización
 */

// Duración en minutos para expiración del caché
const CACHE_EXPIRATION_MINUTES = 30;

// Estado global del caché
const cacheState = reactive({
  areas: [],
  lastUpdate: null,
  isInitialized: false,
  isPersistent: true, // Indica si se debe persistir en localStorage
  expirationTime: CACHE_EXPIRATION_MINUTES * 60 * 1000,
  indexes: {
    byId: {},
    byCode: {},
    byType: {},
    byParent: {}
  }
});

/**
 * Inicializa el caché de áreas
 * @param {Object} options Opciones de configuración
 * @returns {void}
 */
export function initCache(options = {}) {
  // Configurar opciones
  if (options.isPersistent !== undefined) {
    cacheState.isPersistent = options.isPersistent;
  }
  
  if (options.expirationMinutes) {
    cacheState.expirationTime = options.expirationMinutes * 60 * 1000;
  }
  
  // Cargar caché desde localStorage si está habilitado
  if (cacheState.isPersistent) {
    loadFromStorage();
  }
  
  // Configurar vigilancia para guardar automáticamente
  if (cacheState.isPersistent) {
    watchEffect(() => {
      if (cacheState.isInitialized && cacheState.areas.length > 0) {
        saveToStorage();
      }
    });
  }
  
  cacheState.isInitialized = true;
  
  // Suscribirse a eventos relevantes
  eventBus.on('area:registered', (area) => updateAreaInCache(area));
  eventBus.on('area:updated', (area) => updateAreaInCache(area));
  eventBus.on('area:deleted', (areaInfo) => removeAreaFromCache(areaInfo.IDArea));
  
  return cacheState.areas;
}

/**
 * Carga el caché desde localStorage
 * @returns {boolean} true si se cargó correctamente, false si no
 */
function loadFromStorage() {
  try {
    const cachedData = localStorage.getItem('officri_areas_cache');
    
    if (cachedData) {
      const parsedData = JSON.parse(cachedData);
      
      // Verificar si el caché ha expirado
      const now = new Date().getTime();
      const lastUpdate = new Date(parsedData.lastUpdate).getTime();
      
      if (now - lastUpdate > cacheState.expirationTime) {
        // El caché ha expirado, limpiar
        clearStorage();
        return false;
      }
      
      // Cargar datos
      cacheState.areas = parsedData.areas || [];
      cacheState.lastUpdate = parsedData.lastUpdate ? new Date(parsedData.lastUpdate) : new Date();
      
      // Reconstruir índices
      rebuildIndexes();
      
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error cargando caché de áreas:', error);
    clearStorage();
    return false;
  }
}

/**
 * Guarda el caché en localStorage
 * @returns {boolean} true si se guardó correctamente, false si no
 */
function saveToStorage() {
  if (!cacheState.isPersistent) {
    return false;
  }
  
  try {
    const dataToSave = {
      areas: cacheState.areas,
      lastUpdate: cacheState.lastUpdate || new Date()
    };
    
    localStorage.setItem('officri_areas_cache', JSON.stringify(dataToSave));
    return true;
  } catch (error) {
    console.error('Error guardando caché de áreas:', error);
    return false;
  }
}

/**
 * Limpia el almacenamiento local
 */
function clearStorage() {
  try {
    localStorage.removeItem('officri_areas_cache');
  } catch (error) {
    console.error('Error limpiando caché de áreas:', error);
  }
}

/**
 * Reconstruye los índices para búsqueda eficiente
 */
function rebuildIndexes() {
  // Limpiar índices existentes
  cacheState.indexes = {
    byId: {},
    byCode: {},
    byType: {},
    byParent: {}
  };
  
  // Reconstruir a partir de las áreas actuales
  for (const area of cacheState.areas) {
    addToIndexes(area);
  }
}

/**
 * Añade un área a los índices
 * @param {Object} area Área a indexar
 */
function addToIndexes(area) {
  // Indexar por ID
  cacheState.indexes.byId[area.IDArea] = area;
  
  // Indexar por código si existe
  if (area.CodigoIdentificacion) {
    cacheState.indexes.byCode[area.CodigoIdentificacion] = area;
  }
  
  // Indexar por tipo
  if (!cacheState.indexes.byType[area.TipoArea]) {
    cacheState.indexes.byType[area.TipoArea] = [];
  }
  cacheState.indexes.byType[area.TipoArea].push(area);
  
  // Indexar por parentId si existe
  if (area.IDAreaPadre) {
    if (!cacheState.indexes.byParent[area.IDAreaPadre]) {
      cacheState.indexes.byParent[area.IDAreaPadre] = [];
    }
    cacheState.indexes.byParent[area.IDAreaPadre].push(area);
  }
}

/**
 * Elimina un área de los índices
 * @param {Object} area Área a eliminar de los índices
 */
function removeFromIndexes(area) {
  // Eliminar de índice por ID
  if (cacheState.indexes.byId[area.IDArea]) {
    delete cacheState.indexes.byId[area.IDArea];
  }
  
  // Eliminar de índice por código
  if (area.CodigoIdentificacion && cacheState.indexes.byCode[area.CodigoIdentificacion]) {
    delete cacheState.indexes.byCode[area.CodigoIdentificacion];
  }
  
  // Eliminar de índice por tipo
  if (area.TipoArea && cacheState.indexes.byType[area.TipoArea]) {
    cacheState.indexes.byType[area.TipoArea] = cacheState.indexes.byType[area.TipoArea].filter(
      a => a.IDArea !== area.IDArea
    );
  }
  
  // Eliminar de índice por parent
  if (area.IDAreaPadre && cacheState.indexes.byParent[area.IDAreaPadre]) {
    cacheState.indexes.byParent[area.IDAreaPadre] = cacheState.indexes.byParent[area.IDAreaPadre].filter(
      a => a.IDArea !== area.IDArea
    );
  }
}

/**
 * Actualiza el caché con múltiples áreas
 * @param {Array} areas Lista de áreas a almacenar
 * @returns {Array} Lista de áreas actualizada
 */
export function updateCache(areas) {
  if (!Array.isArray(areas)) {
    console.error('updateCache requiere un array de áreas');
    return cacheState.areas;
  }
  
  // Actualizar caché
  cacheState.areas = [...areas];
  cacheState.lastUpdate = new Date();
  
  // Reconstruir índices
  rebuildIndexes();
  
  // Guardar en almacenamiento si está habilitado
  if (cacheState.isPersistent) {
    saveToStorage();
  }
  
  return cacheState.areas;
}

/**
 * Actualiza un área específica en el caché
 * @param {Object} area Área a actualizar
 * @returns {Object} Área actualizada
 */
export function updateAreaInCache(area) {
  if (!area || !area.IDArea) {
    console.error('updateAreaInCache requiere un área con IDArea');
    return null;
  }
  
  // Buscar si el área ya existe
  const existingIndex = cacheState.areas.findIndex(a => a.IDArea === area.IDArea);
  
  // Eliminar de índices si ya existe
  if (existingIndex >= 0) {
    removeFromIndexes(cacheState.areas[existingIndex]);
    cacheState.areas.splice(existingIndex, 1, area);
  } else {
    cacheState.areas.push(area);
  }
  
  // Añadir a índices
  addToIndexes(area);
  
  // Actualizar timestamp
  cacheState.lastUpdate = new Date();
  
  // Guardar en almacenamiento si está habilitado
  if (cacheState.isPersistent) {
    saveToStorage();
  }
  
  return area;
}

/**
 * Elimina un área del caché por su ID
 * @param {number} areaId ID del área a eliminar
 * @returns {boolean} true si se eliminó correctamente
 */
export function removeAreaFromCache(areaId) {
  const area = cacheState.indexes.byId[areaId];
  
  if (!area) {
    return false;
  }
  
  // Eliminar de índices
  removeFromIndexes(area);
  
  // Eliminar de la lista
  cacheState.areas = cacheState.areas.filter(a => a.IDArea !== areaId);
  
  // Actualizar timestamp
  cacheState.lastUpdate = new Date();
  
  // Guardar en almacenamiento si está habilitado
  if (cacheState.isPersistent) {
    saveToStorage();
  }
  
  return true;
}

/**
 * Limpia todo el caché de áreas
 */
export function clearCache() {
  cacheState.areas = [];
  cacheState.lastUpdate = new Date();
  cacheState.indexes = {
    byId: {},
    byCode: {},
    byType: {},
    byParent: {}
  };
  
  // Limpiar almacenamiento
  if (cacheState.isPersistent) {
    clearStorage();
  }
}

/**
 * Verifica si el caché ha expirado
 * @returns {boolean} true si el caché ha expirado
 */
export function isCacheExpired() {
  if (!cacheState.lastUpdate) {
    return true;
  }
  
  const now = new Date().getTime();
  const lastUpdate = cacheState.lastUpdate.getTime();
  
  return now - lastUpdate > cacheState.expirationTime;
}

/**
 * Obtiene todas las áreas del caché
 * @returns {Array} Lista de áreas
 */
export function getAllAreas() {
  return [...cacheState.areas];
}

/**
 * Busca un área por su ID
 * @param {number} areaId ID del área
 * @returns {Object|null} Área encontrada o null
 */
export function getAreaById(areaId) {
  return cacheState.indexes.byId[areaId] || null;
}

/**
 * Busca un área por su código de identificación
 * @param {string} code Código de identificación
 * @returns {Object|null} Área encontrada o null
 */
export function getAreaByCode(code) {
  return cacheState.indexes.byCode[code] || null;
}

/**
 * Obtiene áreas por tipo
 * @param {string} type Tipo de área
 * @returns {Array} Lista de áreas del tipo especificado
 */
export function getAreasByType(type) {
  return cacheState.indexes.byType[type] || [];
}

/**
 * Obtiene áreas hijas de un área específica
 * @param {number} parentId ID del área padre
 * @returns {Array} Lista de áreas hijas
 */
export function getChildAreas(parentId) {
  return cacheState.indexes.byParent[parentId] || [];
}

/**
 * Obtiene el estado actual del caché
 * @returns {Object} Estado del caché
 */
export function getCacheState() {
  return {
    count: cacheState.areas.length,
    lastUpdate: cacheState.lastUpdate,
    isInitialized: cacheState.isInitialized,
    isPersistent: cacheState.isPersistent,
    isExpired: isCacheExpired()
  };
}

export default {
  initCache,
  updateCache,
  updateAreaInCache,
  removeAreaFromCache,
  clearCache,
  isCacheExpired,
  getAllAreas,
  getAreaById,
  getAreaByCode,
  getAreasByType,
  getChildAreas,
  getCacheState
}; 