/**
 * EventBus.js - Sistema de comunicación entre módulos
 * Implementa un patrón de publicación/suscripción para comunicación desacoplada
 */

class EventBus {
  constructor() {
    this.events = {};
    this.onceEvents = {};
  }

  /**
   * Suscribirse a un evento
   * @param {string} event - Nombre del evento
   * @param {Function} callback - Función a ejecutar cuando ocurra el evento
   * @returns {Function} - Función para cancelar la suscripción
   */
  on(event, callback) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    
    this.events[event].push(callback);
    
    // Retornar función para cancelar la suscripción
    return () => {
      this.off(event, callback);
    };
  }

  /**
   * Suscribirse a un evento una sola vez
   * @param {string} event - Nombre del evento
   * @param {Function} callback - Función a ejecutar cuando ocurra el evento
   * @returns {Function} - Función para cancelar la suscripción
   */
  once(event, callback) {
    if (!this.onceEvents[event]) {
      this.onceEvents[event] = [];
    }
    
    this.onceEvents[event].push(callback);
    
    // Retornar función para cancelar la suscripción
    return () => {
      this.off(event, callback, true);
    };
  }

  /**
   * Cancelar suscripción a un evento
   * @param {string} event - Nombre del evento
   * @param {Function} callback - Función a eliminar
   * @param {boolean} once - Si es un evento de una sola vez
   */
  off(event, callback, once = false) {
    const collection = once ? this.onceEvents : this.events;
    
    if (collection[event]) {
      collection[event] = collection[event].filter(cb => cb !== callback);
      
      if (collection[event].length === 0) {
        delete collection[event];
      }
    }
  }

  /**
   * Emitir un evento
   * @param {string} event - Nombre del evento
   * @param {any} data - Datos a pasar a los callbacks
   */
  emit(event, data) {
    // Procesar eventos normales
    if (this.events[event]) {
      this.events[event].forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error en eventBus.emit(${event}):`, error);
        }
      });
    }
    
    // Procesar eventos de una sola vez
    if (this.onceEvents[event]) {
      const callbacks = [...this.onceEvents[event]]; // Crear copia para evitar problemas al eliminar
      delete this.onceEvents[event];
      
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error en eventBus.emit(${event}) para evento once:`, error);
        }
      });
    }
  }

  /**
   * Eliminar todos los eventos
   */
  clear() {
    this.events = {};
    this.onceEvents = {};
  }
}

// Singleton para toda la aplicación
const eventBus = new EventBus();

// Congelar el objeto para prevenir modificaciones
Object.freeze(eventBus);

export default eventBus; 