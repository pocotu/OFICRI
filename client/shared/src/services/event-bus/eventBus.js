import { ref } from 'vue'

// Eventos del sistema
export const EVENTS = {
  // Autenticación
  AUTH_LOGIN: 'auth:login',
  AUTH_LOGOUT: 'auth:logout',
  AUTH_TOKEN_EXPIRED: 'auth:token-expired',
  
  // Usuarios
  USER_UPDATED: 'user:updated',
  USER_DELETED: 'user:deleted',
  
  // Documentos
  DOCUMENT_CREATED: 'document:created',
  DOCUMENT_UPDATED: 'document:updated',
  DOCUMENT_DELETED: 'document:deleted',
  DOCUMENT_DERIVED: 'document:derived',
  
  // Áreas
  AREA_UPDATED: 'area:updated',
  AREA_DELETED: 'area:deleted',
  
  // Notificaciones
  NOTIFICATION_RECEIVED: 'notification:received',
  NOTIFICATION_READ: 'notification:read',
  
  // Sistema
  SYSTEM_ERROR: 'system:error',
  SYSTEM_WARNING: 'system:warning',
  SYSTEM_INFO: 'system:info'
}

// Implementación del Event Bus
class EventBus {
  constructor() {
    this.listeners = new Map()
    this.history = ref([])
    this.maxHistory = 100
  }

  // Emitir evento
  emit(event, data) {
    // Registrar en historial
    this.history.value.push({
      timestamp: new Date(),
      event,
      data
    })
    
    // Mantener historial limitado
    if (this.history.value.length > this.maxHistory) {
      this.history.value.shift()
    }

    // Notificar a los listeners
    const eventListeners = this.listeners.get(event) || []
    eventListeners.forEach(listener => {
      try {
        listener(data)
      } catch (error) {
        console.error(`Error en listener de evento ${event}:`, error)
        // Emitir error del sistema
        this.emit(EVENTS.SYSTEM_ERROR, {
          event,
          error: error.message
        })
      }
    })
  }

  // Escuchar evento
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, [])
    }
    this.listeners.get(event).push(callback)
    
    // Retornar función para remover listener
    return () => {
      const listeners = this.listeners.get(event)
      const index = listeners.indexOf(callback)
      if (index !== -1) {
        listeners.splice(index, 1)
      }
    }
  }

  // Escuchar evento una vez
  once(event, callback) {
    const removeListener = this.on(event, (...args) => {
      removeListener()
      callback(...args)
    })
    return removeListener
  }

  // Remover todos los listeners de un evento
  off(event) {
    this.listeners.delete(event)
  }

  // Limpiar todos los listeners
  clear() {
    this.listeners.clear()
    this.history.value = []
  }

  // Obtener historial de eventos
  getHistory() {
    return this.history.value
  }
}

// Exportar instancia única del Event Bus
export const eventBus = new EventBus()

// Exportar funciones de conveniencia
export const emit = (event, data) => eventBus.emit(event, data)
export const on = (event, callback) => eventBus.on(event, callback)
export const once = (event, callback) => eventBus.once(event, callback)
export const off = (event) => eventBus.off(event)
export const clear = () => eventBus.clear()
export const getHistory = () => eventBus.getHistory()

export default eventBus 