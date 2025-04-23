/**
 * sharedStore.js - Store compartido entre módulos
 * Implementa un patrón similar a Vuex/Redux pero más ligero y específico
 */

import eventBus from '../utils/eventBus';

// Eventos del store
const STORE_EVENTS = {
  STATE_CHANGED: 'store:state_changed',
  MODULE_CHANGED: 'store:module_changed',
  ACTION_DISPATCHED: 'store:action_dispatched',
  ERROR: 'store:error'
};

class SharedStore {
  constructor() {
    // Estado global dividido por módulos
    this.state = {};
    
    // Caché para optimizar rendimiento
    this.cache = {
      enabled: true,
      data: {},
      ttl: {} // Time to live
    };
    
    // Listeners por módulo
    this.listeners = {};
    
    // Módulos registrados
    this.modules = new Set();

    // Configuración inicial del store
    this.config = {
      debug: process.env.NODE_ENV !== 'production',
      persistence: {
        enabled: true,
        storage: localStorage,
        key: 'oficri_store'
      },
      syncBetweenTabs: true
    };
    
    // Escuchar cambios en otras pestañas si está habilitado
    if (this.config.syncBetweenTabs && typeof window !== 'undefined') {
      window.addEventListener('storage', this.handleStorageChange.bind(this));
    }
    
    // Recuperar estado persistente
    this.loadFromPersistence();
  }

  /**
   * Registrar un módulo en el store
   * @param {string} moduleName - Nombre del módulo
   * @param {Object} initialState - Estado inicial
   * @param {Object} actions - Acciones del módulo
   * @param {Object} getters - Getters del módulo
   */
  registerModule(moduleName, { initialState = {}, actions = {}, getters = {} }) {
    if (this.modules.has(moduleName)) {
      console.warn(`El módulo '${moduleName}' ya está registrado en el store.`);
      return;
    }
    
    // Registrar módulo
    this.modules.add(moduleName);
    
    // Inicializar estado del módulo
    this.state[moduleName] = { ...initialState };
    
    // Inicializar listeners del módulo
    this.listeners[moduleName] = [];
    
    // Agregar acciones al módulo
    this[moduleName] = {
      // Acciones
      actions: {},
      
      // Getters
      getters: {},
      
      // Obtener estado del módulo
      getState: () => this.getModuleState(moduleName),
      
      // Suscribirse a cambios del módulo
      subscribe: (callback) => this.subscribeToModule(moduleName, callback)
    };
    
    // Registrar acciones
    Object.entries(actions).forEach(([actionName, actionFn]) => {
      this[moduleName].actions[actionName] = (...args) => 
        this.dispatch(moduleName, actionName, actionFn, args);
    });
    
    // Registrar getters
    Object.entries(getters).forEach(([getterName, getterFn]) => {
      Object.defineProperty(this[moduleName].getters, getterName, {
        get: () => getterFn(this.state[moduleName], this.state)
      });
    });
    
    if (this.config.debug) {
      console.log(`Módulo '${moduleName}' registrado en el store.`);
    }
    
    // Notificar registro de módulo
    eventBus.emit(STORE_EVENTS.MODULE_CHANGED, { 
      type: 'register', 
      moduleName 
    });
  }

  /**
   * Deregistrar un módulo del store
   * @param {string} moduleName - Nombre del módulo
   */
  unregisterModule(moduleName) {
    if (!this.modules.has(moduleName)) {
      console.warn(`El módulo '${moduleName}' no está registrado en el store.`);
      return;
    }
    
    // Eliminar módulo
    this.modules.delete(moduleName);
    
    // Eliminar estado y listeners
    delete this.state[moduleName];
    delete this.listeners[moduleName];
    delete this[moduleName];
    
    // Limpiar caché relacionada
    this.clearModuleCache(moduleName);
    
    if (this.config.debug) {
      console.log(`Módulo '${moduleName}' eliminado del store.`);
    }
    
    // Notificar eliminación de módulo
    eventBus.emit(STORE_EVENTS.MODULE_CHANGED, { 
      type: 'unregister', 
      moduleName 
    });
    
    // Actualizar persistencia
    this.saveToPersistence();
  }

  /**
   * Ejecutar una acción en un módulo
   * @param {string} moduleName - Nombre del módulo
   * @param {string} actionName - Nombre de la acción
   * @param {Function} actionFn - Función de la acción
   * @param {Array} args - Argumentos para la acción
   */
  async dispatch(moduleName, actionName, actionFn, args) {
    try {
      if (this.config.debug) {
        console.log(`Dispatching [${moduleName}/${actionName}]`, args);
      }
      
      // Notificar acción dispatched
      eventBus.emit(STORE_EVENTS.ACTION_DISPATCHED, { 
        moduleName, 
        actionName, 
        args 
      });
      
      // Ejecutar acción con contexto (commit, state, rootState)
      const context = {
        commit: (mutation, payload) => this.commit(moduleName, mutation, payload),
        state: this.state[moduleName],
        rootState: this.state,
        dispatch: (action, ...actionArgs) => {
          // Si la acción pertenece al mismo módulo
          if (!action.includes('/')) {
            return this[moduleName].actions[action](...actionArgs);
          }
          
          // Si la acción pertenece a otro módulo
          const [targetModule, targetAction] = action.split('/');
          return this[targetModule].actions[targetAction](...actionArgs);
        }
      };
      
      return await actionFn(context, ...args);
    } catch (error) {
      console.error(`Error en acción [${moduleName}/${actionName}]:`, error);
      
      // Notificar error
      eventBus.emit(STORE_EVENTS.ERROR, { 
        type: 'action', 
        moduleName, 
        actionName, 
        error 
      });
      
      throw error;
    }
  }

  /**
   * Actualizar el estado de un módulo
   * @param {string} moduleName - Nombre del módulo
   * @param {string} mutation - Nombre de la mutación
   * @param {any} payload - Datos para la mutación
   */
  commit(moduleName, mutation, payload) {
    try {
      if (this.config.debug) {
        console.log(`Commit [${moduleName}/${mutation}]`, payload);
      }
      
      // Crear copia del estado anterior para comparación
      const previousState = JSON.parse(JSON.stringify(this.state[moduleName]));
      
      // Aplicar mutación
      if (typeof mutation === 'function') {
        // Si mutation es una función, ejecutarla con el estado actual
        mutation(this.state[moduleName], payload);
      } else if (typeof mutation === 'string') {
        // Si es un string, asumimos que es una mutación simple de asignación
        const path = mutation.split('.');
        let target = this.state[moduleName];
        
        // Navegar hasta el penúltimo nivel
        for (let i = 0; i < path.length - 1; i++) {
          if (!target[path[i]]) {
            target[path[i]] = {};
          }
          target = target[path[i]];
        }
        
        // Asignar valor
        target[path[path.length - 1]] = payload;
      }
      
      // Notificar cambios
      this.notifyModuleListeners(moduleName, this.state[moduleName], previousState);
      
      // Limpiar caché relacionada
      this.clearModuleCache(moduleName);
      
      // Guardar en persistencia
      this.saveToPersistence();
      
      // Notificar cambio de estado global
      eventBus.emit(STORE_EVENTS.STATE_CHANGED, { 
        moduleName, 
        mutation, 
        payload 
      });
    } catch (error) {
      console.error(`Error en mutación [${moduleName}/${mutation}]:`, error);
      
      // Notificar error
      eventBus.emit(STORE_EVENTS.ERROR, { 
        type: 'mutation', 
        moduleName, 
        mutation, 
        error 
      });
      
      throw error;
    }
  }

  /**
   * Obtener el estado de un módulo
   * @param {string} moduleName - Nombre del módulo
   * @returns {Object} - Estado del módulo
   */
  getModuleState(moduleName) {
    if (!this.modules.has(moduleName)) {
      console.warn(`El módulo '${moduleName}' no está registrado en el store.`);
      return {};
    }
    
    return this.state[moduleName];
  }

  /**
   * Suscribirse a cambios en un módulo
   * @param {string} moduleName - Nombre del módulo
   * @param {Function} callback - Función a llamar cuando cambie el estado
   * @returns {Function} - Función para cancelar la suscripción
   */
  subscribeToModule(moduleName, callback) {
    if (!this.modules.has(moduleName)) {
      console.warn(`El módulo '${moduleName}' no está registrado en el store.`);
      return () => {};
    }
    
    this.listeners[moduleName].push(callback);
    
    // Retornar función para cancelar suscripción
    return () => {
      this.listeners[moduleName] = this.listeners[moduleName].filter(cb => cb !== callback);
    };
  }

  /**
   * Notificar a los listeners de un módulo sobre cambios
   * @param {string} moduleName - Nombre del módulo
   * @param {Object} currentState - Estado actual
   * @param {Object} previousState - Estado anterior
   */
  notifyModuleListeners(moduleName, currentState, previousState) {
    if (!this.listeners[moduleName]) return;
    
    this.listeners[moduleName].forEach(callback => {
      try {
        callback(currentState, previousState);
      } catch (error) {
        console.error(`Error en listener del módulo '${moduleName}':`, error);
      }
    });
  }

  /**
   * Guardar estado en persistencia
   */
  saveToPersistence() {
    if (!this.config.persistence.enabled || typeof window === 'undefined') return;
    
    try {
      // Filtrar módulos que no deben persistirse
      const persistentState = {};
      this.modules.forEach(moduleName => {
        // No persistir módulos temporales o privados
        if (!moduleName.startsWith('_')) {
          persistentState[moduleName] = this.state[moduleName];
        }
      });
      
      const serializedState = JSON.stringify(persistentState);
      this.config.persistence.storage.setItem(this.config.persistence.key, serializedState);
    } catch (error) {
      console.error('Error al guardar estado en persistencia:', error);
    }
  }

  /**
   * Cargar estado desde persistencia
   */
  loadFromPersistence() {
    if (!this.config.persistence.enabled || typeof window === 'undefined') return;
    
    try {
      const serializedState = this.config.persistence.storage.getItem(this.config.persistence.key);
      
      if (serializedState) {
        const persistentState = JSON.parse(serializedState);
        
        // Fusionar con el estado actual
        Object.entries(persistentState).forEach(([moduleName, state]) => {
          if (this.state[moduleName]) {
            this.state[moduleName] = { ...this.state[moduleName], ...state };
          } else {
            this.state[moduleName] = state;
          }
        });
      }
    } catch (error) {
      console.error('Error al cargar estado desde persistencia:', error);
    }
  }

  /**
   * Manejar cambios de storage en otras pestañas
   * @param {StorageEvent} event - Evento de storage
   */
  handleStorageChange(event) {
    if (event.key !== this.config.persistence.key || !event.newValue) return;
    
    try {
      const newState = JSON.parse(event.newValue);
      
      // Actualizar estado desde otra pestaña
      Object.entries(newState).forEach(([moduleName, state]) => {
        if (this.modules.has(moduleName)) {
          const previousState = this.state[moduleName];
          this.state[moduleName] = state;
          this.notifyModuleListeners(moduleName, state, previousState);
        }
      });
    } catch (error) {
      console.error('Error al sincronizar estado entre pestañas:', error);
    }
  }

  /**
   * Limpiar la caché de un módulo
   * @param {string} moduleName - Nombre del módulo
   */
  clearModuleCache(moduleName) {
    if (!this.cache.enabled) return;
    
    // Eliminar entradas de caché relacionadas con el módulo
    const keysToDelete = [];
    
    Object.keys(this.cache.data).forEach(key => {
      if (key.startsWith(`${moduleName}:`)) {
        keysToDelete.push(key);
      }
    });
    
    keysToDelete.forEach(key => {
      delete this.cache.data[key];
      delete this.cache.ttl[key];
    });
  }

  /**
   * Almacenar datos en caché
   * @param {string} key - Clave de caché
   * @param {any} data - Datos a almacenar
   * @param {number} ttlSeconds - Tiempo de vida en segundos
   */
  setCache(key, data, ttlSeconds = 300) {
    if (!this.cache.enabled) return;
    
    this.cache.data[key] = data;
    this.cache.ttl[key] = Date.now() + (ttlSeconds * 1000);
  }

  /**
   * Obtener datos de caché
   * @param {string} key - Clave de caché
   * @returns {any|null} - Datos almacenados o null si no existen o expiraron
   */
  getCache(key) {
    if (!this.cache.enabled || !this.cache.data[key]) return null;
    
    // Verificar si expiró
    if (Date.now() > this.cache.ttl[key]) {
      delete this.cache.data[key];
      delete this.cache.ttl[key];
      return null;
    }
    
    return this.cache.data[key];
  }

  /**
   * Limpiar toda la caché
   */
  clearCache() {
    this.cache.data = {};
    this.cache.ttl = {};
  }

  /**
   * Configurar opciones del store
   * @param {Object} options - Opciones de configuración
   */
  configure(options = {}) {
    this.config = {
      ...this.config,
      ...options
    };
    
    // Actualizar configuración de caché
    if (options.cache !== undefined) {
      this.cache.enabled = !!options.cache;
      
      if (!this.cache.enabled) {
        this.clearCache();
      }
    }
    
    // Actualizar configuración de persistencia
    if (options.persistence !== undefined) {
      const previousEnabled = this.config.persistence.enabled;
      this.config.persistence = {
        ...this.config.persistence,
        ...options.persistence
      };
      
      // Si se activó la persistencia, cargar datos
      if (!previousEnabled && this.config.persistence.enabled) {
        this.loadFromPersistence();
      }
      
      // Si se desactivó, limpiar datos de persistencia
      if (previousEnabled && !this.config.persistence.enabled && typeof window !== 'undefined') {
        this.config.persistence.storage.removeItem(this.config.persistence.key);
      }
    }
    
    // Actualizar sincronización entre pestañas
    if (options.syncBetweenTabs !== undefined && typeof window !== 'undefined') {
      const previousSync = this.config.syncBetweenTabs;
      this.config.syncBetweenTabs = options.syncBetweenTabs;
      
      // Agregar listener si se activó
      if (!previousSync && this.config.syncBetweenTabs) {
        window.addEventListener('storage', this.handleStorageChange.bind(this));
      }
      
      // Quitar listener si se desactivó
      if (previousSync && !this.config.syncBetweenTabs) {
        window.removeEventListener('storage', this.handleStorageChange.bind(this));
      }
    }
  }
}

// Crear instancia única del store
const sharedStore = new SharedStore();

// Congelar el constructor para prevenir instancias adicionales
Object.freeze(SharedStore);

export default sharedStore;
export { STORE_EVENTS }; 