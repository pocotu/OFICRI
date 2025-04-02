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
    
    // Configurar eventos
    _setupEvents();
  };
  
  /**
   * Configura los eventos para los botones del dashboard
   */
  const _setupEvents = function() {
    // Botón de actualizar principal
    const updateBtn = document.getElementById('actualizar');
    if (updateBtn) {
      updateBtn.addEventListener('click', _refreshData);
    }
    
    // Botones de recarga en los paneles
    const reloadButtons = document.querySelectorAll('.panel-actions a[title="Recargar"]');
    reloadButtons.forEach(btn => {
      btn.addEventListener('click', function(e) {
        e.preventDefault();
        const panel = this.closest('.dashboard-panel');
        if (panel) {
          if (panel.querySelector('#actividad-reciente')) {
            _loadActividad();
          } else if (panel.querySelector('#documentos-pendientes')) {
            _loadDocumentosPendientes();
          }
        }
      });
    });
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
    actividadContainer.innerHTML = '<div class="text-center"><div class="spinner-border text-primary" role="status"></div><p class="mt-2">Cargando actividad reciente...</p></div>';
    
    // Cargar datos de la API
    apiClient.get('/actividad', { limit: 5 })
      .then(response => {
        if (response.success && response.data) {
          _renderActividad(response.data, actividadContainer);
        } else {
          actividadContainer.innerHTML = '<div class="alert alert-info">No se encontraron datos de actividad reciente.</div>';
        }
      })
      .catch(error => {
        console.error('Error al cargar actividad reciente:', error);
        actividadContainer.innerHTML = '<div class="alert alert-danger">Error al cargar datos de actividad reciente.</div>';
      });
  };
  
  /**
   * Renderiza los datos de actividad en el contenedor
   * @param {Array} data - Datos de actividad
   * @param {HTMLElement} container - Contenedor donde mostrar los datos
   */
  const _renderActividad = function(data, container) {
    if (!data || data.length === 0) {
      container.innerHTML = '<div class="alert alert-info">No hay actividad reciente para mostrar.</div>';
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
    container.innerHTML = '<div class="text-center"><div class="spinner-border text-primary" role="status"></div><p class="mt-2">Cargando documentos pendientes...</p></div>';
    
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
          container.innerHTML = '<div class="alert alert-info">No se encontraron documentos pendientes.</div>';
        }
      })
      .catch(error => {
        console.error('Error al cargar documentos pendientes:', error);
        container.innerHTML = '<div class="alert alert-danger">Error al cargar documentos pendientes.</div>';
      });
  };
  
  /**
   * Renderiza los documentos pendientes en el contenedor
   * @param {Array} data - Datos de documentos
   * @param {HTMLElement} container - Contenedor donde mostrar los datos
   */
  const _renderDocumentosPendientes = function(data, container) {
    if (!data || data.length === 0) {
      container.innerHTML = '<div class="alert alert-info">No hay documentos pendientes para mostrar.</div>';
      return;
    }
    
    let html = '<div class="table-responsive">';
    html += '<table class="document-table">';
    html += `
      <thead>
        <tr>
          <th>Nro. Registro</th>
          <th>Fecha</th>
          <th>Área</th>
          <th>Estado</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody>
    `;
    
    data.forEach(doc => {
      const fecha = new Date(doc.fechaDocumento).toLocaleDateString('es-ES');
      let estadoClass = '';
      
      switch (doc.estado) {
        case 'RECIBIDO':
          estadoClass = 'pending';
          break;
        case 'EN_PROCESO':
          estadoClass = 'inprocess';
          break;
        case 'COMPLETADO':
          estadoClass = 'completed';
          break;
        default:
          estadoClass = 'pending';
      }
      
      html += `
        <tr>
          <td>${doc.nroRegistro}</td>
          <td>${fecha}</td>
          <td>${doc.AreaActual?.NombreArea || 'No asignada'}</td>
          <td><span class="document-badge ${estadoClass}">${doc.estado}</span></td>
          <td>
            <button class="btn-view" data-doc-id="${doc.id}">
              <i class="fas fa-eye"></i> Ver
            </button>
          </td>
        </tr>
      `;
    });
    
    html += '</tbody></table></div>';
    container.innerHTML = html;
    
    // Agregar event listeners a los botones "Ver"
    const verButtons = container.querySelectorAll('.btn-view');
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
          if (window.OFICRI.documentos && typeof window.OFICRI.documentos.mostrarDetalle === 'function') {
            window.OFICRI.documentos.mostrarDetalle(docId);
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
    
    // Actualizar estadísticas
    _loadEstadisticas();
    
    // Notificar al usuario
    notifications.info('Datos del dashboard actualizados');
  };
  
  /**
   * Carga las estadísticas globales
   */
  const _loadEstadisticas = function() {
    apiClient.get('/estadisticas/dashboard')
      .then(response => {
        if (response.success && response.data) {
          // Actualizar valores
          const usuariosActivos = document.querySelector('.stat-card:nth-child(1) .stat-value');
          const docsPendientes = document.querySelector('.stat-card:nth-child(2) .stat-value');
          const areasActivas = document.querySelector('.stat-card:nth-child(3) .stat-value');
          
          if (usuariosActivos) {
            usuariosActivos.textContent = response.data.usuariosActivos || '0';
          }
          
          if (docsPendientes) {
            docsPendientes.textContent = response.data.documentosPendientes || '0';
          }
          
          if (areasActivas) {
            areasActivas.textContent = response.data.areasActivas || '0';
          }
        }
      })
      .catch(error => {
        console.error('Error al cargar estadísticas:', error);
      });
  };
  
  // API pública
  window.OFICRI.dashboard.init = _init;
  window.OFICRI.dashboard.refreshData = _refreshData;
})(); 