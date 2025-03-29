/**
 * OFICRI Admin Documentos Module
 */

// Importaciones
import { apiClient } from '../api/apiClient.js';
import { notifications } from '../ui/notifications.js';

// Crear namespace si no existe
window.OFICRI = window.OFICRI || {};
window.OFICRI.documentos = window.OFICRI.documentos || {};

// Módulo de Documentos
(function() {
  'use strict';
  
  // Variables privadas
  let _tablaDocumentos = null;
  let _editandoDocumentoId = null;
  let _filtros = {
    estado: 'TODOS',
    fechaInicio: null,
    fechaFin: null
  };
  
  /**
   * Inicializa el módulo
   */
  const init = function() {
    console.log('[DOCUMENTOS] Inicializando módulo de documentos');
    
    // Configurar listeners
    _setupListeners();
    
    // Cargar datos iniciales
    cargarDocumentos();
  };
  
  /**
   * Configura los listeners de eventos
   */
  const _setupListeners = function() {
    console.log('[DOCUMENTOS] Configurando listeners');
    
    // Implementación de listeners para formularios,
    // botones y otros elementos de la interfaz
  };
  
  /**
   * Carga los documentos del sistema
   */
  const cargarDocumentos = function(filtros = _filtros) {
    console.log('[DOCUMENTOS] Cargando documentos del sistema', filtros);
    
    // Esta función se implementaría para cargar datos del servidor
    apiClient.get('/documentos', filtros)
      .then(response => {
        if (response.success && response.data) {
          console.log('[DOCUMENTOS] Documentos cargados:', response.data.length);
          // Renderizar datos en tabla
        }
      })
      .catch(error => {
        console.error('[DOCUMENTOS] Error al cargar documentos:', error);
        notifications.error('Error al cargar documentos');
      });
  };
  
  // Exponer la API pública
  window.OFICRI.documentos.init = init;
  window.OFICRI.documentos.cargarDocumentos = cargarDocumentos;
})();

// Para compatibilidad con ES modules
export const documentos = window.OFICRI.documentos; 