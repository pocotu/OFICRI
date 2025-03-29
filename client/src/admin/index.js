/**
 * OFICRI Admin Interface Main Module
 * Script principal para la interfaz de administración
 */

// Importar módulos necesarios
import { config } from '../config/app.config.js';
import { apiClient } from '../api/apiClient.js';
import { authService } from '../services/authService.js';
import { notifications } from '../ui/notifications.js';
import './dashboard.js';

// Create namespace if it doesn't exist
window.OFICRI = window.OFICRI || {};

// Admin Module
OFICRI.adminApp = (function() {
  'use strict';
  
  // Private variables
  let _sidebarVisible = true;
  
  /**
   * Inicialización de la aplicación
   */
  const _init = function() {
    // Verificar autenticación
    if (!OFICRI.authService.isAuthenticated()) {
      window.location.href = '/';
      return;
    }
    
    // Obtener datos del usuario
    const user = OFICRI.authService.getUser();
    
    // Verificar que sea admin
    if (user.role !== 'Administrador') {
      console.error('Acceso no autorizado: rol incorrecto');
      OFICRI.authService.logout();
      return;
    }
    
    // Mostrar información del usuario
    _renderUserInfo(user);
    
    // Inicializar componentes
    _setupEventListeners();
    _initializeComponents();
    
    console.log('OFICRI Admin App inicializada');
    
    // Cargar datos iniciales de estadísticas
    _loadInitialData();
  };
  
  /**
   * Renderiza la información del usuario en el header
   * @param {Object} user - Objeto con datos del usuario
   */
  const _renderUserInfo = function(user) {
    const userNameElement = document.getElementById('user-name');
    
    if (userNameElement) {
      userNameElement.textContent = `${user.nombre} ${user.apellidos}`;
    }
  };
  
  /**
   * Establece los listeners de eventos
   */
  const _setupEventListeners = function() {
    // Toggle sidebar
    const menuToggle = document.getElementById('menu-toggle');
    if (menuToggle) {
      menuToggle.addEventListener('click', _toggleSidebar);
    }
    
    // Cerrar sesión
    const logoutButton = document.getElementById('cerrar-sesion');
    if (logoutButton) {
      logoutButton.addEventListener('click', _handleLogout);
    }
    
    // Botón de actualización
    const refreshButton = document.getElementById('actualizar');
    if (refreshButton) {
      refreshButton.addEventListener('click', _refreshDashboard);
    }
    
    // Listener para manejo de tabs con Bootstrap
    const tabElements = document.querySelectorAll('[data-bs-toggle="tab"]');
    tabElements.forEach(tab => {
      tab.addEventListener('shown.bs.tab', _handleTabChange);
    });
  };
  
  /**
   * Inicializa los componentes necesarios
   */
  const _initializeComponents = function() {
    // Inicializar componentes BS
    const tooltips = document.querySelectorAll('[data-bs-toggle="tooltip"]');
    tooltips.forEach(tooltip => {
      new bootstrap.Tooltip(tooltip);
    });
    
    // Inicializar módulos específicos si están disponibles
    if (OFICRI.dashboard) OFICRI.dashboard.init();
    if (OFICRI.usuarios) OFICRI.usuarios.init();
    if (OFICRI.roles) OFICRI.roles.init();
    if (OFICRI.areas) OFICRI.areas.init();
    if (OFICRI.documentos) OFICRI.documentos.init();
    if (OFICRI.auditoria) OFICRI.auditoria.init();
    if (OFICRI.exportar) OFICRI.exportar.init();
  };
  
  /**
   * Carga los datos iniciales para el dashboard
   */
  const _loadInitialData = function() {
    // Cargar estadísticas del sistema
    OFICRI.apiClient.get('/system/info')
      .then(response => {
        if (response.success && response.data) {
          _updateStatistics(response.data);
        }
      })
      .catch(error => {
        console.error('Error al cargar información del sistema:', error);
      });
  };
  
  /**
   * Actualiza los widgets de estadísticas
   * @param {Object} data - Datos de estadísticas
   */
  const _updateStatistics = function(data) {
    // Actualizar valores en UI
    const usuariosElement = document.querySelector('.dashboard-stats .stat-value:nth-child(1)');
    const documentosElement = document.querySelector('.dashboard-stats .stat-value:nth-child(3)');
    const areasElement = document.querySelector('.dashboard-stats .stat-value:nth-child(5)');
    
    if (usuariosElement && data.usuarios_activos !== undefined) {
      usuariosElement.textContent = data.usuarios_activos;
    }
    
    if (documentosElement && data.documentos_pendientes !== undefined) {
      documentosElement.textContent = data.documentos_pendientes;
    }
    
    if (areasElement && data.areas_activas !== undefined) {
      areasElement.textContent = data.areas_activas || 3; // Valor por defecto en caso de no existir
    }
  };
  
  /**
   * Refresca los datos del dashboard
   */
  const _refreshDashboard = function() {
    _loadInitialData();
    
    // Actualizar paneles de actividad reciente y documentos pendientes
    // si hay componentes específicos para esto
    if (OFICRI.dashboard && typeof OFICRI.dashboard.refreshData === 'function') {
      OFICRI.dashboard.refreshData();
    }
  };
  
  /**
   * Muestra/oculta el sidebar
   */
  const _toggleSidebar = function() {
    const sidebar = document.getElementById('sidebar');
    
    if (sidebar) {
      _sidebarVisible = !_sidebarVisible;
      sidebar.classList.toggle('show', _sidebarVisible);
    }
  };
  
  /**
   * Maneja el cambio de tabs
   * @param {Event} event - Evento de cambio de tab
   */
  const _handleTabChange = function(event) {
    const { target } = event;
    const tabId = target.getAttribute('href').substring(1);
    
    // Actualizar URL con hash
    window.location.hash = tabId;
    
    // Activar el item del menú correspondiente
    document.querySelectorAll('.sidebar-nav li').forEach(item => {
      item.classList.remove('active');
    });
    
    target.closest('li').classList.add('active');
  };
  
  /**
   * Maneja el cierre de sesión
   * @param {Event} event - Evento de click
   */
  const _handleLogout = function(event) {
    event.preventDefault();
    
    // Llamar al servicio de autenticación para cerrar sesión
    OFICRI.authService.logout()
      .then(() => {
        // La redirección la maneja el servicio de auth
        console.log('Sesión cerrada exitosamente');
      })
      .catch(error => {
        console.error('Error al cerrar sesión:', error);
      });
  };
  
  // Exponer API pública
  return {
    init: _init
  };
})();

// Inicializar la aplicación cuando se cargue la página
document.addEventListener('DOMContentLoaded', function() {
  // Crear directorios anidados para módulos
  window.OFICRI.dashboard = window.OFICRI.dashboard || {};
  window.OFICRI.usuarios = window.OFICRI.usuarios || {};
  window.OFICRI.roles = window.OFICRI.roles || {};
  window.OFICRI.areas = window.OFICRI.areas || {};
  window.OFICRI.documentos = window.OFICRI.documentos || {};
  window.OFICRI.auditoria = window.OFICRI.auditoria || {};
  window.OFICRI.exportar = window.OFICRI.exportar || {};
  
  // Inicializar la aplicación
  OFICRI.adminApp.init();
}); 