/**
 * webSocketService.js - Servicio de WebSocket para comunicación en tiempo real
 * 
 * Proporciona una abstracción sobre WebSocket para integración con el sistema OFICRI,
 * incluyendo reconexión automática, gestión de eventos y suscripciones.
 */

import eventBus from '../utils/eventBus';

// Eventos del servicio WebSocket
const WS_EVENTS = {
  CONNECTED: 'websocket:connected',
  DISCONNECTED: 'websocket:disconnected',
  ERROR: 'websocket:error',
  MESSAGE: 'websocket:message',
  SUBSCRIBE: 'websocket:subscribe',
  UNSUBSCRIBE: 'websocket:unsubscribe'
};

// Estados de conexión
const CONNECTION_STATES = {
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  DISCONNECTED: 'disconnected',
  RECONNECTING: 'reconnecting'
};

class WebSocketService {
  constructor() {
    this.socket = null;
    this.url = null;
    this.subscriptions = new Map();
    this.connectionState = CONNECTION_STATES.DISCONNECTED;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 3000; // ms
    this.reconnectBackoffFactor = 1.5;
    this.reconnectTimeout = null;
    this.messageQueue = [];
    this.maxQueueSize = 100;
    this.debug = process.env.NODE_ENV !== 'production';
    this.connectionOptions = {
      autoReconnect: true,
      autoConnect: false
    };
    this.token = null;
  }

  /**
   * Conectar al servidor WebSocket
   * @param {string} url - URL del servidor WebSocket
   * @param {Object} options - Opciones de conexión
   * @returns {Promise<boolean>} - True si se conectó correctamente
   */
  connect(url, options = {}) {
    return new Promise((resolve, reject) => {
      // Si ya está conectado o conectando, rechazar
      if (this.connectionState === CONNECTION_STATES.CONNECTED || 
          this.connectionState === CONNECTION_STATES.CONNECTING) {
        if (url === this.url) {
          resolve(true);
          return;
        } else {
          this.disconnect(); // Desconectar antes de reconectar a una nueva URL
        }
      }
      
      this.url = url;
      this.connectionOptions = { ...this.connectionOptions, ...options };
      this.connectionState = CONNECTION_STATES.CONNECTING;
      
      if (this.debug) {
        console.log(`Conectando a WebSocket: ${url}`);
      }
      
      try {
        // Crear nueva conexión WebSocket
        this.socket = new WebSocket(url);
        
        // Configurar manejadores de eventos
        this.socket.onopen = (event) => {
          this.connectionState = CONNECTION_STATES.CONNECTED;
          this.reconnectAttempts = 0;
          
          if (this.debug) {
            console.log('Conexión WebSocket establecida');
          }
          
          // Notificar conexión
          eventBus.emit(WS_EVENTS.CONNECTED, { url });
          
          // Enviar mensajes en cola
          this.flushMessageQueue();
          
          // Si hay un token de autenticación, enviarlo
          if (this.token) {
            this.authenticate(this.token);
          }
          
          // Renovar suscripciones
          this.renewSubscriptions();
          
          resolve(true);
        };
        
        this.socket.onclose = (event) => {
          const wasConnected = this.connectionState === CONNECTION_STATES.CONNECTED;
          this.connectionState = CONNECTION_STATES.DISCONNECTED;
          
          if (this.debug) {
            console.log(`Conexión WebSocket cerrada. Código: ${event.code}, Razón: ${event.reason || 'No especificada'}`);
          }
          
          // Notificar desconexión
          eventBus.emit(WS_EVENTS.DISCONNECTED, { 
            code: event.code, 
            reason: event.reason, 
            wasConnected 
          });
          
          // Intentar reconexión si está habilitado
          if (wasConnected && this.connectionOptions.autoReconnect) {
            this.scheduleReconnect();
          }
          
          if (!wasConnected) {
            reject(new Error(`Conexión WebSocket cerrada. Código: ${event.code}, Razón: ${event.reason || 'No especificada'}`));
          }
        };
        
        this.socket.onerror = (error) => {
          if (this.debug) {
            console.error('Error en conexión WebSocket:', error);
          }
          
          // Notificar error
          eventBus.emit(WS_EVENTS.ERROR, { error });
          
          if (this.connectionState === CONNECTION_STATES.CONNECTING) {
            reject(new Error('Error al conectar al servidor WebSocket'));
          }
        };
        
        this.socket.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            
            if (this.debug) {
              console.log('Mensaje WebSocket recibido:', message);
            }
            
            // Notificar mensaje general
            eventBus.emit(WS_EVENTS.MESSAGE, message);
            
            // Notificar a suscripciones específicas
            if (message.type && this.subscriptions.has(message.type)) {
              this.subscriptions.get(message.type).forEach(callback => {
                try {
                  callback(message.data, message);
                } catch (error) {
                  console.error(`Error en manejador de suscripción para ${message.type}:`, error);
                }
              });
            }
          } catch (error) {
            console.error('Error al procesar mensaje WebSocket:', error);
          }
        };
      } catch (error) {
        this.connectionState = CONNECTION_STATES.DISCONNECTED;
        console.error('Error al inicializar conexión WebSocket:', error);
        reject(error);
      }
    });
  }

  /**
   * Desconectar del servidor WebSocket
   */
  disconnect() {
    if (this.socket) {
      try {
        this.socket.close(1000, 'Desconexión iniciada por cliente');
      } catch (error) {
        console.error('Error al cerrar conexión WebSocket:', error);
      }
      
      this.socket = null;
    }
    
    // Limpiar timeout de reconexión
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    
    this.connectionState = CONNECTION_STATES.DISCONNECTED;
  }

  /**
   * Programar intento de reconexión
   */
  scheduleReconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }
    
    this.reconnectAttempts++;
    
    if (this.reconnectAttempts > this.maxReconnectAttempts) {
      if (this.debug) {
        console.log(`Máximo número de intentos de reconexión (${this.maxReconnectAttempts}) alcanzado.`);
      }
      return;
    }
    
    const delay = this.reconnectDelay * Math.pow(this.reconnectBackoffFactor, this.reconnectAttempts - 1);
    
    if (this.debug) {
      console.log(`Programando reconexión en ${delay}ms (intento ${this.reconnectAttempts} de ${this.maxReconnectAttempts}).`);
    }
    
    this.connectionState = CONNECTION_STATES.RECONNECTING;
    
    this.reconnectTimeout = setTimeout(() => {
      if (this.debug) {
        console.log(`Intentando reconexión a ${this.url}...`);
      }
      
      this.connect(this.url, this.connectionOptions)
        .catch(error => {
          console.error('Error al reconectar:', error);
          this.scheduleReconnect();
        });
    }, delay);
  }

  /**
   * Enviar mensaje al servidor WebSocket
   * @param {string} type - Tipo de mensaje
   * @param {Object} data - Datos del mensaje
   * @param {Object} options - Opciones adicionales
   * @returns {boolean} - True si se envió correctamente
   */
  send(type, data = {}, options = {}) {
    const message = {
      type,
      data,
      timestamp: Date.now(),
      ...options
    };
    
    // Si no está conectado, encolar mensaje
    if (this.connectionState !== CONNECTION_STATES.CONNECTED) {
      return this.queueMessage(message);
    }
    
    try {
      this.socket.send(JSON.stringify(message));
      
      if (this.debug) {
        console.log('Mensaje WebSocket enviado:', message);
      }
      
      return true;
    } catch (error) {
      console.error('Error al enviar mensaje WebSocket:', error);
      
      // Encolar mensaje para reintento
      if (options.queueOnError !== false) {
        return this.queueMessage(message);
      }
      
      return false;
    }
  }

  /**
   * Encolar mensaje para envío posterior
   * @param {Object} message - Mensaje a encolar
   * @returns {boolean} - True si se encoló correctamente
   */
  queueMessage(message) {
    // Verificar si la cola está llena
    if (this.messageQueue.length >= this.maxQueueSize) {
      console.warn('Cola de mensajes WebSocket llena. El mensaje se descartará.');
      return false;
    }
    
    this.messageQueue.push(message);
    
    if (this.debug) {
      console.log(`Mensaje encolado. Cola: ${this.messageQueue.length} mensajes.`);
    }
    
    return true;
  }

  /**
   * Enviar mensajes encolados
   */
  flushMessageQueue() {
    if (this.messageQueue.length === 0 || this.connectionState !== CONNECTION_STATES.CONNECTED) {
      return;
    }
    
    if (this.debug) {
      console.log(`Enviando ${this.messageQueue.length} mensajes encolados.`);
    }
    
    // Crear copia para evitar problemas si se agregan mensajes durante el proceso
    const queueCopy = [...this.messageQueue];
    this.messageQueue = [];
    
    queueCopy.forEach(message => {
      try {
        this.socket.send(JSON.stringify(message));
      } catch (error) {
        console.error('Error al enviar mensaje encolado:', error);
        this.messageQueue.push(message); // Volver a encolar
      }
    });
  }

  /**
   * Autenticar la conexión WebSocket
   * @param {string} token - Token de autenticación
   */
  authenticate(token) {
    this.token = token;
    
    if (this.connectionState === CONNECTION_STATES.CONNECTED) {
      this.send('authenticate', { token });
    }
  }

  /**
   * Suscribirse a un tipo de mensaje
   * @param {string} type - Tipo de mensaje
   * @param {Function} callback - Función a llamar cuando se reciba un mensaje
   * @returns {Function} - Función para cancelar la suscripción
   */
  subscribe(type, callback) {
    if (!this.subscriptions.has(type)) {
      this.subscriptions.set(type, new Set());
      
      // Notificar suscripción al servidor si está conectado
      if (this.connectionState === CONNECTION_STATES.CONNECTED) {
        this.send('subscribe', { type });
      }
      
      // Notificar suscripción local
      eventBus.emit(WS_EVENTS.SUBSCRIBE, { type });
    }
    
    this.subscriptions.get(type).add(callback);
    
    // Retornar función para cancelar suscripción
    return () => {
      this.unsubscribe(type, callback);
    };
  }

  /**
   * Cancelar suscripción a un tipo de mensaje
   * @param {string} type - Tipo de mensaje
   * @param {Function} callback - Función a eliminar
   */
  unsubscribe(type, callback) {
    if (!this.subscriptions.has(type)) {
      return;
    }
    
    const callbacks = this.subscriptions.get(type);
    callbacks.delete(callback);
    
    // Si no quedan callbacks, eliminar la suscripción
    if (callbacks.size === 0) {
      this.subscriptions.delete(type);
      
      // Notificar cancelación al servidor si está conectado
      if (this.connectionState === CONNECTION_STATES.CONNECTED) {
        this.send('unsubscribe', { type });
      }
      
      // Notificar cancelación local
      eventBus.emit(WS_EVENTS.UNSUBSCRIBE, { type });
    }
  }

  /**
   * Renovar todas las suscripciones
   */
  renewSubscriptions() {
    if (this.connectionState !== CONNECTION_STATES.CONNECTED || this.subscriptions.size === 0) {
      return;
    }
    
    // Enviar suscripciones al servidor
    for (const type of this.subscriptions.keys()) {
      this.send('subscribe', { type });
    }
  }

  /**
   * Obtener estado actual de la conexión
   * @returns {string} - Estado de conexión
   */
  getConnectionState() {
    return this.connectionState;
  }

  /**
   * Verificar si está conectado
   * @returns {boolean} - True si está conectado
   */
  isConnected() {
    return this.connectionState === CONNECTION_STATES.CONNECTED;
  }

  /**
   * Configurar opciones del servicio
   * @param {Object} options - Opciones de configuración
   */
  configure(options = {}) {
    if (options.debug !== undefined) {
      this.debug = !!options.debug;
    }
    
    if (options.maxReconnectAttempts !== undefined) {
      this.maxReconnectAttempts = options.maxReconnectAttempts;
    }
    
    if (options.reconnectDelay !== undefined) {
      this.reconnectDelay = options.reconnectDelay;
    }
    
    if (options.reconnectBackoffFactor !== undefined) {
      this.reconnectBackoffFactor = options.reconnectBackoffFactor;
    }
    
    if (options.maxQueueSize !== undefined) {
      this.maxQueueSize = options.maxQueueSize;
    }
    
    if (options.autoReconnect !== undefined) {
      this.connectionOptions.autoReconnect = !!options.autoReconnect;
    }
  }
}

// Crear instancia única
const webSocketService = new WebSocketService();

// Congelar constructor para prevenir instancias adicionales
Object.freeze(WebSocketService);

export default webSocketService;
export { WS_EVENTS, CONNECTION_STATES }; 