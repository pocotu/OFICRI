/**
 * moduleConflictResolver.js - Utilidad para resolver conflictos entre módulos
 * 
 * Proporciona funciones para gestionar y resolver conflictos de nombres,
 * rutas, eventos y estados entre los diferentes módulos de la aplicación.
 */

// Mapa de elementos registrados por tipo
const registeredItems = {
  ROUTE: new Map(),
  COMPONENT: new Map(),
  STATE: new Map(),
  EVENT: new Map(),
  NAME: new Map(),
  ENDPOINT: new Map()
};

// Mapa de estrategias de resolución de conflictos
const resolutionStrategies = {
  REJECT: 'reject',       // Rechazar el registro duplicado
  REPLACE: 'replace',     // Reemplazar el registro existente
  NAMESPACE: 'namespace', // Agregar un namespace al nuevo registro
  MERGE: 'merge',         // Fusionar los registros (para objetos)
  APPEND: 'append'        // Agregar al existente (para arrays)
};

// Configuración por defecto
const defaultConfig = {
  defaultStrategy: resolutionStrategies.REJECT,
  namespaceDelimiter: ':',
  enableLogging: true,
  autoResolve: false,
  strategyByType: {
    ROUTE: resolutionStrategies.NAMESPACE,
    COMPONENT: resolutionStrategies.NAMESPACE,
    STATE: resolutionStrategies.MERGE,
    EVENT: resolutionStrategies.NAMESPACE,
    NAME: resolutionStrategies.NAMESPACE,
    ENDPOINT: resolutionStrategies.NAMESPACE
  }
};

// Configuración actual
let config = { ...defaultConfig };

/**
 * Registrar un elemento con detección y resolución de conflictos
 * @param {string} type - Tipo de elemento ('ROUTE', 'COMPONENT', 'STATE', 'EVENT', etc.)
 * @param {string} name - Nombre del elemento
 * @param {any} value - Valor/definición del elemento
 * @param {string} moduleName - Nombre del módulo que registra
 * @param {Object} options - Opciones adicionales
 * @returns {Object} - Resultado del registro {success, name, value, conflict}
 */
const register = (type, name, value, moduleName, options = {}) => {
  // Validar que el tipo sea válido
  if (!registeredItems[type]) {
    throw new Error(`Tipo de elemento '${type}' no válido para registro.`);
  }
  
  const registry = registeredItems[type];
  const strategy = options.strategy || config.strategyByType[type] || config.defaultStrategy;
  
  // Verificar si ya existe un registro con el mismo nombre
  if (registry.has(name)) {
    const existing = registry.get(name);
    
    // Detectamos un conflicto
    const conflict = {
      type,
      name,
      existingValue: existing.value,
      existingModule: existing.moduleName,
      newValue: value,
      newModule: moduleName
    };
    
    // Loguear conflicto si está habilitado
    if (config.enableLogging) {
      console.warn(`Conflicto detectado: Elemento '${name}' de tipo '${type}' ya está registrado por '${existing.moduleName}'.`);
    }
    
    // Resolver según estrategia
    switch (strategy) {
      case resolutionStrategies.REJECT:
        return {
          success: false,
          name,
          value: null,
          conflict
        };
        
      case resolutionStrategies.REPLACE:
        registry.set(name, { value, moduleName, timestamp: Date.now() });
        return {
          success: true,
          name,
          value,
          conflict,
          resolution: 'replaced'
        };
        
      case resolutionStrategies.NAMESPACE:
        const namespacedName = `${moduleName}${config.namespaceDelimiter}${name}`;
        registry.set(namespacedName, { value, moduleName, timestamp: Date.now() });
        return {
          success: true,
          name: namespacedName,
          originalName: name,
          value,
          conflict,
          resolution: 'namespaced'
        };
        
      case resolutionStrategies.MERGE:
        if (typeof existing.value === 'object' && typeof value === 'object') {
          const mergedValue = deepMerge(existing.value, value);
          registry.set(name, { 
            value: mergedValue, 
            moduleName: `${existing.moduleName},${moduleName}`, 
            timestamp: Date.now() 
          });
          return {
            success: true,
            name,
            value: mergedValue,
            conflict,
            resolution: 'merged'
          };
        } else {
          // Si no son objetos, no se puede fusionar
          return {
            success: false,
            name,
            value: null,
            conflict,
            error: 'No se pueden fusionar elementos que no son objetos'
          };
        }
        
      case resolutionStrategies.APPEND:
        if (Array.isArray(existing.value) && Array.isArray(value)) {
          const appendedValue = [...existing.value, ...value];
          registry.set(name, { 
            value: appendedValue, 
            moduleName: `${existing.moduleName},${moduleName}`, 
            timestamp: Date.now() 
          });
          return {
            success: true,
            name,
            value: appendedValue,
            conflict,
            resolution: 'appended'
          };
        } else {
          // Si no son arrays, no se puede anexar
          return {
            success: false,
            name,
            value: null,
            conflict,
            error: 'No se pueden anexar elementos que no son arrays'
          };
        }
        
      default:
        return {
          success: false,
          name,
          value: null,
          conflict,
          error: `Estrategia de resolución '${strategy}' no implementada`
        };
    }
  }
  
  // Si no hay conflicto, registrar normalmente
  registry.set(name, {
    value,
    moduleName,
    timestamp: Date.now()
  });
  
  return {
    success: true,
    name,
    value
  };
};

/**
 * Obtener un elemento registrado
 * @param {string} type - Tipo de elemento
 * @param {string} name - Nombre del elemento
 * @returns {any} - Valor del elemento o undefined si no existe
 */
const get = (type, name) => {
  if (!registeredItems[type]) {
    throw new Error(`Tipo de elemento '${type}' no válido para obtención.`);
  }
  
  const registry = registeredItems[type];
  return registry.has(name) ? registry.get(name).value : undefined;
};

/**
 * Verificar si un elemento está registrado
 * @param {string} type - Tipo de elemento
 * @param {string} name - Nombre del elemento
 * @returns {boolean} - true si el elemento está registrado
 */
const isRegistered = (type, name) => {
  if (!registeredItems[type]) {
    throw new Error(`Tipo de elemento '${type}' no válido para verificación.`);
  }
  
  return registeredItems[type].has(name);
};

/**
 * Enumerar todos los elementos registrados de un tipo
 * @param {string} type - Tipo de elemento
 * @returns {Array} - Lista de elementos registrados con metadata
 */
const listRegistered = (type) => {
  if (!registeredItems[type]) {
    throw new Error(`Tipo de elemento '${type}' no válido para enumeración.`);
  }
  
  const result = [];
  
  registeredItems[type].forEach((data, name) => {
    result.push({
      name,
      value: data.value,
      moduleName: data.moduleName,
      timestamp: data.timestamp
    });
  });
  
  return result;
};

/**
 * Eliminar un elemento registrado
 * @param {string} type - Tipo de elemento
 * @param {string} name - Nombre del elemento
 * @param {string} moduleName - Nombre del módulo que elimina (para verificación)
 * @returns {boolean} - true si se eliminó correctamente
 */
const unregister = (type, name, moduleName) => {
  if (!registeredItems[type]) {
    throw new Error(`Tipo de elemento '${type}' no válido para eliminación.`);
  }
  
  const registry = registeredItems[type];
  
  if (!registry.has(name)) {
    return false;
  }
  
  const existing = registry.get(name);
  
  // Verificar que solo el módulo que registró pueda eliminar
  if (moduleName && existing.moduleName !== moduleName && 
      !existing.moduleName.includes(moduleName)) {
    if (config.enableLogging) {
      console.warn(`El módulo '${moduleName}' no puede eliminar '${name}' registrado por '${existing.moduleName}'.`);
    }
    return false;
  }
  
  registry.delete(name);
  return true;
};

/**
 * Buscar elementos registrados por patrón de nombre
 * @param {string} type - Tipo de elemento
 * @param {string|RegExp} pattern - Patrón de búsqueda
 * @returns {Array} - Lista de elementos que coinciden
 */
const findRegistered = (type, pattern) => {
  if (!registeredItems[type]) {
    throw new Error(`Tipo de elemento '${type}' no válido para búsqueda.`);
  }
  
  const result = [];
  const registry = registeredItems[type];
  
  // Convertir string a RegExp si es necesario
  const regex = pattern instanceof RegExp ? pattern : new RegExp(pattern);
  
  registry.forEach((data, name) => {
    if (regex.test(name)) {
      result.push({
        name,
        value: data.value,
        moduleName: data.moduleName,
        timestamp: data.timestamp
      });
    }
  });
  
  return result;
};

/**
 * Configurar el resolver
 * @param {Object} newConfig - Nueva configuración
 */
const configure = (newConfig) => {
  config = {
    ...config,
    ...newConfig,
    strategyByType: {
      ...config.strategyByType,
      ...(newConfig.strategyByType || {})
    }
  };
};

/**
 * Resetear la configuración a valores por defecto
 */
const resetConfig = () => {
  config = { ...defaultConfig };
};

/**
 * Limpiar todos los registros
 * @param {string} type - Tipo de elemento (opcional, si no se especifica limpia todo)
 */
const clearRegistry = (type) => {
  if (type) {
    if (!registeredItems[type]) {
      throw new Error(`Tipo de elemento '${type}' no válido para limpieza.`);
    }
    registeredItems[type].clear();
  } else {
    Object.keys(registeredItems).forEach(t => {
      registeredItems[t].clear();
    });
  }
};

/**
 * Fusiona profundamente dos objetos (utilidad interna)
 * @param {Object} target - Objeto destino
 * @param {Object} source - Objeto fuente
 * @returns {Object} - Objeto fusionado
 */
const deepMerge = (target, source) => {
  const output = { ...target };
  
  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach(key => {
      if (isObject(source[key])) {
        if (!(key in target)) {
          output[key] = source[key];
        } else {
          output[key] = deepMerge(target[key], source[key]);
        }
      } else {
        output[key] = source[key];
      }
    });
  }
  
  return output;
};

/**
 * Verifica si un valor es un objeto (utilidad interna)
 * @param {any} item - Valor a verificar
 * @returns {boolean} - true si es un objeto
 */
const isObject = (item) => {
  return (item && typeof item === 'object' && !Array.isArray(item));
};

// Exportar API pública
export default {
  // Registro y acceso
  register,
  get,
  isRegistered,
  unregister,
  
  // Enumeración y búsqueda
  listRegistered,
  findRegistered,
  
  // Configuración
  configure,
  resetConfig,
  clearRegistry,
  
  // Constantes
  TYPES: Object.keys(registeredItems),
  STRATEGIES: resolutionStrategies
}; 