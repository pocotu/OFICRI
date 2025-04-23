import { ref, onMounted, onUnmounted } from 'vue'
import { eventBus } from '../services/event-bus/eventBus'

// Estado global para toasts
const toasts = ref([])
let toastIdCounter = 0

/**
 * Composable para manejo de notificaciones toast
 * 
 * @returns {Object} Métodos y estado para controlar toasts
 */
export function useToast() {
  // Agregar escucha a eventos globales para toasts
  const showToastHandler = (message, type = 'info', options = {}) => {
    addToast(message, type, options)
  }
  
  onMounted(() => {
    eventBus.on('toast:show', showToastHandler)
  })
  
  onUnmounted(() => {
    eventBus.off('toast:show', showToastHandler)
  })
  
  /**
   * Agrega un nuevo toast
   * 
   * @param {string} message - Mensaje a mostrar
   * @param {string} type - Tipo de toast (info, success, warning, error)
   * @param {Object} options - Opciones adicionales
   * @returns {number} ID del toast creado
   */
  const addToast = (message, type = 'info', options = {}) => {
    const id = ++toastIdCounter
    const duration = options.duration || getDurationByType(type)
    
    const toast = {
      id,
      message,
      type,
      duration,
      visible: true,
      ...options
    }
    
    toasts.value.push(toast)
    
    // Auto-eliminar después de la duración
    if (duration > 0) {
      setTimeout(() => {
        removeToast(id)
      }, duration)
    }
    
    return id
  }
  
  /**
   * Elimina un toast por su ID
   * 
   * @param {number} id - ID del toast a eliminar
   */
  const removeToast = (id) => {
    const index = toasts.value.findIndex(toast => toast.id === id)
    if (index !== -1) {
      // Marcar como no visible primero para animación
      toasts.value[index].visible = false
      
      // Remover después de la animación
      setTimeout(() => {
        toasts.value = toasts.value.filter(toast => toast.id !== id)
      }, 300)
    }
  }
  
  /**
   * Muestra un toast informativo
   * 
   * @param {string} message - Mensaje a mostrar
   * @param {Object} options - Opciones adicionales
   * @returns {number} ID del toast creado
   */
  const showToast = (message, type = 'info', options = {}) => {
    return addToast(message, type, options)
  }
  
  /**
   * Muestra un toast de éxito
   * 
   * @param {string} message - Mensaje a mostrar
   * @param {Object} options - Opciones adicionales
   * @returns {number} ID del toast creado
   */
  const showSuccess = (message, options = {}) => {
    return addToast(message, 'success', options)
  }
  
  /**
   * Muestra un toast de advertencia
   * 
   * @param {string} message - Mensaje a mostrar
   * @param {Object} options - Opciones adicionales
   * @returns {number} ID del toast creado
   */
  const showWarning = (message, options = {}) => {
    return addToast(message, 'warning', options)
  }
  
  /**
   * Muestra un toast de error
   * 
   * @param {string} message - Mensaje a mostrar
   * @param {Object} options - Opciones adicionales
   * @returns {number} ID del toast creado
   */
  const showError = (message, options = {}) => {
    return addToast(message, 'error', options)
  }
  
  /**
   * Determina la duración base según el tipo de toast
   * 
   * @param {string} type - Tipo de toast
   * @returns {number} Duración en milisegundos
   */
  const getDurationByType = (type) => {
    switch (type) {
      case 'success':
        return 3000
      case 'info':
        return 4000
      case 'warning':
        return 5000
      case 'error':
        return 6000
      default:
        return 4000
    }
  }
  
  /**
   * Elimina todos los toasts activos
   */
  const clearAllToasts = () => {
    toasts.value.forEach(toast => {
      removeToast(toast.id)
    })
  }
  
  return {
    toasts,
    showToast,
    showSuccess,
    showWarning,
    showError,
    removeToast,
    clearAllToasts
  }
}

/**
 * Muestra un toast global desde cualquier parte de la aplicación
 * 
 * @param {string} message - Mensaje a mostrar
 * @param {string} type - Tipo de toast (info, success, warning, error)
 * @param {Object} options - Opciones adicionales
 */
export function showGlobalToast(message, type = 'info', options = {}) {
  eventBus.emit('toast:show', message, type, options)
} 