/**
 * OFICRI Admin Interface Main Module
 * Script principal para la interfaz de administración
 */

// Importar módulos necesarios
import { appConfig } from '../config/appConfig.js';
import { apiClient } from '../api/apiClient.js';
import { authService } from '../services/authService.js';
import { notificationManager } from '../ui/notificationManager.js';
import { logoutService } from '../services/logoutService.js';
import { sessionEvents } from '../utils/sessionEvents.js';
import './dashboard.js';

// Create namespace if it doesn't exist
window.OFICRI = window.OFICRI || {};

// Asegurar que el gestor de notificaciones esté disponible en el namespace global
window.OFICRI.notifications = notificationManager;

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
    
    // Obtener referencias a los elementos del botón
    const logoutButton = document.getElementById('cerrar-sesion');
    const btnTextSpan = logoutButton ? logoutButton.querySelector('.btn-text') : null;
    const icon = logoutButton ? logoutButton.querySelector('i') : null;
    
    // Desactivar el botón para evitar múltiples clicks
    if (logoutButton) {
      // Cambiar estado visual del botón
      logoutButton.disabled = true;
      logoutButton.classList.add('disabled');
      
      // Cambiar texto
      if (btnTextSpan) {
        btnTextSpan.innerHTML = 'Cerrando sesión...';
      }
      
      // Mostrar spinner
      if (icon) {
        icon.className = 'fas fa-spinner fa-spin';
      }
    }
    
    try {
      // Usar el nuevo servicio de logout si está disponible 
      if (logoutService && typeof logoutService.logout === 'function') {
        // Usar el servicio dedicado
        logoutService.logout()
          .catch(error => {
            console.error('Error en proceso de logout:', error);
            // La redirección ya la maneja el servicio
          });
      } 
      // Fallback al servicio de autenticación
      else if (OFICRI.authService && typeof OFICRI.authService.logout === 'function') {
        OFICRI.authService.logout()
          .catch(error => {
            console.error('Error al cerrar sesión:', error);
            // Restaurar botón solo si hay error
            _resetLogoutButton(logoutButton, btnTextSpan, icon);
          });
      } 
      // Último recurso: logout manual
      else {
        console.warn('Servicios de logout no disponibles, realizando cierre de sesión básico');
        _performBasicLogout();
      }
    } catch (error) {
      console.error('Error crítico al intentar cerrar sesión:', error);
      // Realizar logout manual como último recurso
      _performBasicLogout();
    }
  };
  
  /**
   * Realiza un cierre de sesión básico como último recurso
   * @private
   */
  const _performBasicLogout = function() {
    try {
      // Limpiar datos de sesión
      localStorage.removeItem('oficri_token');
      localStorage.removeItem('oficri_user');
      localStorage.removeItem('oficri_refresh_token');
      sessionStorage.setItem('oficri_from_logout', 'true');
      
      // Intentar registrar evento si está disponible
      if (sessionEvents && typeof sessionEvents.logLogout === 'function') {
        sessionEvents.logLogout({
          success: true,
          manual: true,
          reason: 'MANUAL_FALLBACK'
        }).catch(e => console.warn('No se pudo registrar evento de logout:', e));
      }
      
      // Redirigir a login
      window.location.href = 'index.html';
    } catch (e) {
      console.error('Error en logout básico:', e);
      // Como último recurso, simplemente redirigir
      window.location.href = 'index.html';
    }
  };
  
  /**
   * Restaura el botón de logout a su estado normal
   * @param {HTMLElement} button - El botón de logout
   * @param {HTMLElement} textSpan - El span de texto en el botón
   * @param {HTMLElement} icon - El ícono del botón
   * @private
   */
  const _resetLogoutButton = function(button, textSpan, icon) {
    if (button) {
      button.disabled = false;
      button.classList.remove('disabled');
      
      // Restaurar texto original
      if (textSpan) {
        textSpan.innerHTML = 'Cerrar Sesión';
      }
      
      // Restaurar ícono original
      if (icon) {
        icon.className = 'fas fa-sign-out-alt';
      }
    }
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