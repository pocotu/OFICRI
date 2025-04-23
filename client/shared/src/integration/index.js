/**
 * Índice de herramientas de integración entre módulos
 * 
 * Este archivo centraliza la exportación de todas las funcionalidades
 * desarrolladas para la integración de módulos en OFICRI.
 */

// Comunicación entre módulos
import eventBus from '../utils/eventBus';
import sharedStore from '../store/sharedStore';
import internalApi from '../services/internalApi';
import webSocketService, { WS_EVENTS, CONNECTION_STATES } from '../services/webSocketService';

// Resolución de conflictos
import moduleConflictResolver from '../utils/moduleConflictResolver';

// Utilidades compartidas
import * as utils from '../utils';
import * as hooks from '../components/ui/hooks';

/**
 * Inicializa todos los servicios de integración
 * @param {Object} options - Opciones de inicialización
 */
export const initializeIntegration = (options = {}) => {
  // Configurar resolver de conflictos
  if (options.conflictResolver) {
    moduleConflictResolver.configure(options.conflictResolver);
  }
  
  // Configurar store compartido
  if (options.sharedStore) {
    sharedStore.configure(options.sharedStore);
  }
  
  // Configurar API interna
  if (options.internalApi) {
    internalApi.configure(options.internalApi);
  }
  
  // Configurar WebSocket
  if (options.webSocket) {
    webSocketService.configure(options.webSocket);
    
    // Conectar WebSocket si está habilitado
    if (options.webSocket.autoConnect && options.webSocket.url) {
      webSocketService.connect(options.webSocket.url);
    }
  }
  
  // Registrar módulos en store compartido
  if (options.modules) {
    Object.entries(options.modules).forEach(([moduleName, moduleConfig]) => {
      if (moduleConfig.store) {
        sharedStore.registerModule(moduleName, moduleConfig.store);
      }
    });
  }
  
  return {
    eventBus,
    sharedStore,
    internalApi,
    webSocketService,
    moduleConflictResolver
  };
};

// Exportar todo para acceso directo
export {
  // Comunicación entre módulos
  eventBus,
  sharedStore,
  internalApi,
  webSocketService,
  WS_EVENTS,
  CONNECTION_STATES,
  
  // Resolución de conflictos
  moduleConflictResolver,
  
  // Utilidades
  utils,
  hooks
};

// Exportación por defecto para importación completa
export default {
  eventBus,
  sharedStore,
  internalApi,
  webSocketService,
  moduleConflictResolver,
  initializeIntegration,
  utils,
  hooks,
  WS_EVENTS,
  CONNECTION_STATES
}; 