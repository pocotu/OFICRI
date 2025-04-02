/**
 * OFICRI Admin Dashboard Module
 * Módulo para la gestión del dashboard principal del administrador
 */

// Importar módulos necesarios
import { appConfig } from '../config/appConfig.js';
import { apiClient } from '../api/apiClient.js';
import { notifications } from '../ui/notifications.js';

// Crear el namespace si no existe
window.OFICRI = window.OFICRI || {};
window.OFICRI.dashboard = window.OFICRI.dashboard || {};

// Módulo de Dashboard
(function() {
  'use strict';
  
  // Variables privadas
  let _actividadTimer = null;
  
  /**
   * Inicializa el módulo de dashboard
   */
  const _init = function() {
    console.log('Inicializando módulo de dashboard');
    
    // Cargar datos iniciales
    _loadActividad();
    _loadDocumentosPendientes();
    
    // Configurar temporizador para actualización automática
    _setupAutoRefresh();
  };
  
  /**
   * Configura la actualización automática de datos
   */
  const _setupAutoRefresh = function() {
    // Limpiar timer anterior si existe
    if (_actividadTimer) {
      clearInterval(_actividadTimer);
    }
    
    // Actualizar cada 5 minutos (300000 ms)
    _actividadTimer = setInterval(() => {
      _refreshData();
    }, 300000);
  };
  
  /**
   * Carga los datos de actividad reciente
   */
  const _loadActividad = function() {
    const actividadContainer = document.getElementById('actividad-reciente');
    
    if (!actividadContainer) {
      return;
    }
    
    // Mostrar estado de carga
    actividadContainer.innerHTML = '<p class="text-center"><div class="spinner-border spinner-border-sm text-primary" role="status"></div> Cargando actividad reciente...</p>';
    
    // Cargar datos de la API
    apiClient.get('/actividad', { limit: 5 })
      .then(response => {
        if (response.success && response.data) {
          _renderActividad(response.data, actividadContainer);
        } else {
          actividadContainer.innerHTML = '<p class="text-center text-muted">No se encontraron datos de actividad reciente.</p>';
        }
      })
      .catch(error => {
        console.error('Error al cargar actividad reciente:', error);
        actividadContainer.innerHTML = '<p class="text-center text-danger">Error al cargar datos de actividad reciente.</p>';
      });
  };
  
  /**
   * Renderiza los datos de actividad en el contenedor
   * @param {Array} data - Datos de actividad
   * @param {HTMLElement} container - Contenedor donde mostrar los datos
   */
  const _renderActividad = function(data, container) {
    if (!data || data.length === 0) {
      container.innerHTML = '<p class="text-center text-muted">No hay actividad reciente para mostrar.</p>';
      return;
    }
    
    let html = '<ul class="timeline">';
    
    data.forEach(item => {
      const time = new Date(item.timestamp).toLocaleString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      
      let icon = '';
      
      // Elegir ícono según tipo de actividad
      switch (item.tipo) {
        case 'LOGIN':
          icon = '<i class="fas fa-sign-in-alt text-primary"></i>';
          break;
        case 'DOCUMENTO':
          icon = '<i class="fas fa-file-alt text-info"></i>';
          break;
        case 'USUARIO':
          icon = '<i class="fas fa-user text-warning"></i>';
          break;
        case 'AREA':
          icon = '<i class="fas fa-building text-success"></i>';
          break;
        default:
          icon = '<i class="fas fa-bell text-secondary"></i>';
      }
      
      html += `
        <li class="timeline-item">
          <div class="timeline-icon">${icon}</div>
          <div class="timeline-content">
            <p class="mb-0"><strong>${item.usuario || 'Sistema'}</strong> ${item.descripcion}</p>
            <small class="text-muted">${time}</small>
          </div>
        </li>
      `;
    });
    
    html += '</ul>';
    container.innerHTML = html;
  };
  
  /**
   * Carga los documentos pendientes
   */
  const _loadDocumentosPendientes = function() {
    const container = document.getElementById('documentos-pendientes');
    
    if (!container) {
      return;
    }
    
    // Mostrar estado de carga
    container.innerHTML = '<p class="text-center"><div class="spinner-border spinner-border-sm text-primary" role="status"></div> Cargando documentos pendientes...</p>';
    
    // Cargar datos de documentos pendientes
    apiClient.get('/documentos', { 
      estado: 'EN_PROCESO',
      limit: 5,
      sort: 'fechaRegistro',
      order: 'desc'
    })
      .then(response => {
        if (response.success && response.data && response.data.documents) {
          _renderDocumentosPendientes(response.data.documents, container);
        } else {
          container.innerHTML = '<p class="text-center text-muted">No se encontraron documentos pendientes.</p>';
        }
      })
      .catch(error => {
        console.error('Error al cargar documentos pendientes:', error);
        container.innerHTML = '<p class="text-center text-danger">Error al cargar documentos pendientes.</p>';
      });
  };
  
  /**
   * Renderiza los documentos pendientes en el contenedor
   * @param {Array} data - Datos de documentos
   * @param {HTMLElement} container - Contenedor donde mostrar los datos
   */
  const _renderDocumentosPendientes = function(data, container) {
    if (!data || data.length === 0) {
      container.innerHTML = '<p class="text-center text-muted">No hay documentos pendientes para mostrar.</p>';
      return;
    }
    
    let html = '<div class="table-responsive">';
    html += '<table class="table table-sm table-hover">';
    html += `
      <thead>
        <tr>
          <th scope="col">Nro. Registro</th>
          <th scope="col">Fecha</th>
          <th scope="col">Área</th>
          <th scope="col">Acciones</th>
        </tr>
      </thead>
      <tbody>
    `;
    
    data.forEach(doc => {
      const fecha = new Date(doc.fechaDocumento).toLocaleDateString('es-ES');
      
      html += `
        <tr>
          <td>${doc.nroRegistro}</td>
          <td>${fecha}</td>
          <td>${doc.AreaActual?.NombreArea || 'No asignada'}</td>
          <td>
            <a href="#documentos" data-bs-toggle="tab" data-doc-id="${doc.id}" class="btn btn-sm btn-outline-primary ver-doc">
              <i class="fas fa-eye"></i> Ver
            </a>
          </td>
        </tr>
      `;
    });
    
    html += '</tbody></table></div>';
    container.innerHTML = html;
    
    // Agregar event listeners a los botones "Ver"
    const verButtons = container.querySelectorAll('.ver-doc');
    verButtons.forEach(button => {
      button.addEventListener('click', function(e) {
        e.preventDefault();
        const docId = this.getAttribute('data-doc-id');
        
        // Activar la pestaña de documentos
        const documentosTab = document.querySelector('a[href="#documentos"]');
        if (documentosTab) {
          const tab = new bootstrap.Tab(documentosTab);
          tab.show();
          
          // Comunicar con el módulo de documentos para mostrar el detalle
          if (OFICRI.documentos && typeof OFICRI.documentos.mostrarDetalle === 'function') {
            OFICRI.documentos.mostrarDetalle(docId);
          }
        }
      });
    });
  };
  
  /**
   * Refresca todos los datos del dashboard
   */
  const _refreshData = function() {
    _loadActividad();
    _loadDocumentosPendientes();
    
    // Notificar al usuario
    if (notifications) {
      notifications.info('Datos del dashboard actualizados');
    }
  };
  
  // API pública
  OFICRI.dashboard.init = _init;
  OFICRI.dashboard.refreshData = _refreshData;
})(); 