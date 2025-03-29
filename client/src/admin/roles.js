/**
 * OFICRI Admin Roles Module
 */

// Importaciones
import { apiClient } from '../api/apiClient.js';
import { notifications } from '../ui/notifications.js';

// Crear namespace si no existe
window.OFICRI = window.OFICRI || {};
window.OFICRI.roles = window.OFICRI.roles || {};

// Módulo de Roles
(function() {
  'use strict';
  
  // Variables privadas
  let _tablaRoles = null;
  let _editandoRolId = null;
  
  /**
   * Inicializa el módulo
   */
  const init = function() {
    console.log('[ROLES] Inicializando módulo de roles');
    
    // Configurar listeners
    _setupListeners();
    
    // Cargar datos iniciales
    cargarRoles();
  };
  
  /**
   * Configura los listeners de eventos
   */
  const _setupListeners = function() {
    console.log('[ROLES] Configurando listeners');
    
    // Implementación de listeners para formularios,
    // botones y otros elementos de la interfaz
  };
  
  /**
   * Carga los roles del sistema
   */
  const cargarRoles = function() {
    console.log('[ROLES] Cargando roles del sistema');
    
    // Esta función se implementaría para cargar datos del servidor
    apiClient.get('/roles')
      .then(response => {
        if (response.success && response.data) {
          console.log('[ROLES] Roles cargados:', response.data.length);
          // Renderizar datos en tabla
        }
      })
      .catch(error => {
        console.error('[ROLES] Error al cargar roles:', error);
        notifications.error('Error al cargar roles');
      });
  };
  
  // Exponer la API pública
  window.OFICRI.roles.init = init;
  window.OFICRI.roles.cargarRoles = cargarRoles;
})();

// Para compatibilidad con ES modules
export const roles = window.OFICRI.roles; 