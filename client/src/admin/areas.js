/**
 * OFICRI Admin Areas Module
 */

// Importaciones
import { apiClient } from '../api/apiClient.js';
import { notifications } from '../ui/notifications.js';

// Crear namespace si no existe
window.OFICRI = window.OFICRI || {};
window.OFICRI.areas = window.OFICRI.areas || {};

// Módulo de Áreas
(function() {
  'use strict';
  
  // Variables privadas
  let _tablaAreas = null;
  let _editandoAreaId = null;
  
  /**
   * Inicializa el módulo
   */
  const init = function() {
    console.log('[AREAS] Inicializando módulo de áreas');
    
    // Configurar listeners
    _setupListeners();
    
    // Cargar datos iniciales
    cargarAreas();
  };
  
  /**
   * Configura los listeners de eventos
   */
  const _setupListeners = function() {
    console.log('[AREAS] Configurando listeners');
    
    // Implementación de listeners para formularios,
    // botones y otros elementos de la interfaz
  };
  
  /**
   * Carga las áreas del sistema
   */
  const cargarAreas = function() {
    console.log('[AREAS] Cargando áreas del sistema');
    
    // Esta función se implementaría para cargar datos del servidor
    apiClient.get('/areas')
      .then(response => {
        if (response.success && response.data) {
          console.log('[AREAS] Áreas cargadas:', response.data.length);
          // Renderizar datos en tabla
        }
      })
      .catch(error => {
        console.error('[AREAS] Error al cargar áreas:', error);
        notifications.error('Error al cargar áreas');
      });
  };
  
  // Exponer la API pública
  window.OFICRI.areas.init = init;
  window.OFICRI.areas.cargarAreas = cargarAreas;
})();

// Para compatibilidad con ES modules
export const areas = window.OFICRI.areas; 