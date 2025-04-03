/**
 * OFICRI Admin Usuarios Module
 */

// Importaciones
import { apiClient } from '../api/apiClient.js';
import { notifications } from '../ui/notifications.js';

// Crear namespace si no existe
window.OFICRI = window.OFICRI || {};
window.OFICRI.usuarios = window.OFICRI.usuarios || {};

// Módulo de Usuarios
(function() {
  'use strict';
  
  // Variables privadas
  let _tablaUsuarios = null;
  let _editandoUsuarioId = null;
  
  /**
   * Inicializa el módulo
   */
  const init = function() {
    console.log('[USUARIOS] Inicializando módulo de usuarios');
    
    // Configurar listeners
    _setupListeners();
    
    // Cargar datos iniciales
    cargarUsuarios();
  };
  
  /**
   * Configura los listeners de eventos
   */
  const _setupListeners = function() {
    console.log('[USUARIOS] Configurando listeners');
    
    // Implementación de listeners para formularios,
    // botones y otros elementos de la interfaz
  };
  
  /**
   * Carga los usuarios del sistema
   */
  const cargarUsuarios = function() {
    console.log('[USUARIOS] Cargando usuarios del sistema');
    
    // Esta función se implementaría para cargar datos del servidor
    apiClient.get('/api/users')
      .then(response => {
        if (response.success && response.data) {
          console.log('[USUARIOS] Usuarios cargados:', response.data.length);
          // Renderizar datos en tabla
        }
      })
      .catch(error => {
        console.error('[USUARIOS] Error al cargar usuarios:', error);
        notifications.error('Error al cargar usuarios');
      });
  };
  
  // Exponer la API pública
  window.OFICRI.usuarios.init = init;
  window.OFICRI.usuarios.cargarUsuarios = cargarUsuarios;
})();

// Para compatibilidad con ES modules
export const usuarios = window.OFICRI.usuarios; 