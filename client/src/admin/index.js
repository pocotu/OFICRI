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
import { debugLogger } from '../utils/debugLogger.js';
import { sidebarManager } from '../ui/sidebarManager.js';

// Create namespace if it doesn't exist
window.OFICRI = window.OFICRI || {};

// Asegurar que el gestor de notificaciones esté disponible en el namespace global
window.OFICRI.notifications = notificationManager;

// Admin Module
OFICRI.adminApp = (function() {
  'use strict';
  
  // Private variables
  let _sidebarVisible = true;
  let currentUser = null;
  
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
    currentUser = OFICRI.authService.getUser();
    
    // Verificar que sea admin
    if (currentUser.role !== 'Administrador') {
      OFICRI.authService.logout();
      return;
    }
    
    // Mostrar información del usuario
    _renderUserInfo(currentUser);
    
    // Inicializar componentes
    _setupEventListeners();
    _initializeComponents();
    
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
   * Configura eventos iniciales
   * @private
   */
  const _setupEventListeners = function() {
    // Evento para cerrar sesión
    const cerrarSesionBtn = document.getElementById('cerrar-sesion');
    if (cerrarSesionBtn) {
      cerrarSesionBtn.addEventListener('click', function(e) {
        e.preventDefault();
        _cerrarSesion();
      });
    }
    
    // Evento para actualización del dashboard (cada 5 min)
    setInterval(_refreshDashboard, 5 * 60 * 1000);
    
    // Configurar eventos de las pestañas
    _setupTabEvents();
  };
  
  /**
   * Inicializa los componentes necesarios
   */
  const _initializeComponents = function() {
    // Inicializar componentes BS
    try {
      const tooltips = document.querySelectorAll('[data-bs-toggle="tooltip"]');
      tooltips.forEach(tooltip => {
        new bootstrap.Tooltip(tooltip);
      });
    } catch (error) {
      // Error silencioso
    }
    
    // Inicializar módulos específicos si están disponibles
    try {
      if (OFICRI.dashboard) OFICRI.dashboard.init();
      if (OFICRI.usuarios) OFICRI.usuarios.init();
      if (OFICRI.roles) OFICRI.roles.init();
      if (OFICRI.areas) OFICRI.areas.init();
      if (OFICRI.documentos) OFICRI.documentos.init();
      if (OFICRI.auditoria) OFICRI.auditoria.init();
      if (OFICRI.exportar) OFICRI.exportar.init();
    } catch (error) {
      // Error silencioso
    }
    
    // Verificar que existan los elementos necesarios para el sidebar antes de inicializarlo
    const sidebarElement = document.querySelector('.oficri-sidebar');
    const menuToggleElement = document.querySelector('.menu-toggle');
    const mainContentElement = document.querySelector('.oficri-main');
    const appContainerElement = document.querySelector('.oficri-app');
    
    // Inicializar el gestor del sidebar solo si todos los elementos existen
    if (sidebarElement && menuToggleElement && mainContentElement && appContainerElement) {
      // Inicializar usando la API correcta del módulo
      try {
        const sidebarAPI = window.sidebarManager.init({
          sidebarSelector: '.oficri-sidebar',
          mainContentSelector: '.oficri-main',
          menuToggleSelector: '.menu-toggle',
          appContainerSelector: '.oficri-app',
          persistState: true
        });
        
        // Guardar la API en una variable global para acceso desde otras partes de la aplicación
        window.sidebarAPI = sidebarAPI;
        
        // En móviles, ocultar el sidebar inicialmente
        if (window.innerWidth < 992 && sidebarAPI && sidebarAPI.setSidebarState) {
          sidebarAPI.setSidebarState(true); // true = collapsed
        }
      } catch (error) {
        // Error silencioso
      }
    }
    
    // Disparar evento personalizado para notificar que el gestor del sidebar está listo
    try {
      window.dispatchEvent(new CustomEvent('OFICRISidebarManagerLoaded'));
    } catch (error) {
      // Error silencioso
    }
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
        // Error silencioso
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
    // Usar la API del sidebarManager en lugar de manipular directamente el DOM
    if (window.sidebarAPI && typeof window.sidebarAPI.toggleSidebar === 'function') {
      window.sidebarAPI.toggleSidebar();
    } else if (window.OFICRI && window.OFICRI.sidebarManager) {
      window.OFICRI.sidebarManager.toggleSidebar();
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
            // La redirección ya la maneja el servicio
          });
      } 
      // Fallback al servicio de autenticación
      else if (OFICRI.authService && typeof OFICRI.authService.logout === 'function') {
        OFICRI.authService.logout()
          .catch(error => {
            // Restaurar botón solo si hay error
            _resetLogoutButton(logoutButton, btnTextSpan, icon);
          });
      } 
      // Último recurso: logout manual
      else {
        _performBasicLogout();
      }
    } catch (error) {
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
        }).catch(() => {});
      }
      
      // Redirigir a login
      window.location.href = 'index.html';
    } catch (e) {
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
  
  // Función para asegurar que el sidebar tenga un estado consistente
  function _resetSidebarStateIfNeeded() {
    const sidebar = document.querySelector('.oficri-sidebar');
    const appContainer = document.querySelector('.oficri-app');
    
    if (!sidebar || !appContainer) {
      return;
    }
    
    // Verificar si el estado visual es inconsistente
    const hasCollapsedClass = appContainer.classList.contains('sidebar-collapsed');
    const isVisuallyHidden = 
      sidebar.offsetWidth === 0 || 
      sidebar.style.visibility === 'hidden' || 
      sidebar.style.display === 'none' || 
      getComputedStyle(sidebar).visibility === 'hidden';
    
    // Si hay inconsistencia (clase collapsed pero visualmente visible, o viceversa)
    const isInconsistent = (hasCollapsedClass && !isVisuallyHidden) || (!hasCollapsedClass && isVisuallyHidden);
    
    if (isInconsistent) {
      // Forzar un estado coherente
      if (hasCollapsedClass) {
        // Si tiene clase collapsed, asegurar que esté visualmente oculto
        sidebar.style.width = '0';
        sidebar.style.minWidth = '0';
        sidebar.style.visibility = 'hidden';
        sidebar.style.display = 'none';
        sidebar.style.transform = 'translateX(-100%)';
        sidebar.style.opacity = '0';
        sidebar.classList.remove('show');
      } else {
        // Si no tiene clase collapsed, asegurar que esté visualmente visible
        sidebar.style.width = 'var(--sidebar-width)';
        sidebar.style.minWidth = 'var(--sidebar-width)';
        sidebar.style.visibility = 'visible';
        sidebar.style.display = 'block';
        sidebar.style.transform = '';
        sidebar.style.opacity = '1';
        
        if (window.innerWidth < 992) {
          sidebar.classList.add('show');
        }
      }
    }
  }
  
  // Exponer API pública
  return {
    init: _init
  };
})();

// Inicializar la aplicación cuando se cargue la página
document.addEventListener('DOMContentLoaded', function() {
  // Crear directorios anidados para módulos
  window.OFICRI = window.OFICRI || {};
  window.OFICRI.dashboard = window.OFICRI.dashboard || {};
  window.OFICRI.usuarios = window.OFICRI.usuarios || {};
  window.OFICRI.roles = window.OFICRI.roles || {};
  window.OFICRI.areas = window.OFICRI.areas || {};
  window.OFICRI.documentos = window.OFICRI.documentos || {};
  window.OFICRI.auditoria = window.OFICRI.auditoria || {};
  window.OFICRI.exportar = window.OFICRI.exportar || {};
  
  // INTERCEPCIÓN DIRECTA DEL BOTÓN HAMBURGUESA - Solución de emergencia
  setTimeout(function() {
    // Buscar botón toggle con cualquiera de estos selectores
    const menuBtn = document.querySelector('.menu-toggle') || document.getElementById('menu-toggle');
    
    if (menuBtn) {
      // Eliminar todos los listeners previos para evitar conflictos
      const oldBtn = menuBtn;
      const newBtn = oldBtn.cloneNode(true);
      oldBtn.parentNode.replaceChild(newBtn, oldBtn);
      
      // Agregar manejador directo al evento onclick (mayor prioridad que addEventListener)
      newBtn.onclick = function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        // Hacer toggle directo del sidebar sin usar APIs intermedias
        const sidebar = document.querySelector('.oficri-sidebar');
        const appContainer = document.querySelector('.oficri-app');
        const mainContent = document.querySelector('.oficri-main');
        
        if (sidebar && appContainer) {
          const isCollapsed = appContainer.classList.contains('sidebar-collapsed');
          
          if (isCollapsed) {
            // EXPANDIR SIDEBAR
            // 1. Quitar clase de colapso en el contenedor
            appContainer.classList.remove('sidebar-collapsed');
            
            // 2. Configurar sidebar para que sea visible
            sidebar.style.transform = '';
            sidebar.style.width = 'var(--sidebar-width)';
            sidebar.style.minWidth = 'var(--sidebar-width)';
            sidebar.style.visibility = 'visible';
            sidebar.style.display = 'block';
            sidebar.style.overflow = 'auto';
            sidebar.style.marginLeft = '0';
            
            // 3. Configurar main content
            if (mainContent) {
              mainContent.style.width = 'calc(100% - var(--sidebar-width))';
              mainContent.style.marginLeft = '';
            }
            
            // 4. Manejar caso móvil especial
            if (window.innerWidth < 992) {
              sidebar.classList.add('show');
              sidebar.style.position = 'fixed';
              sidebar.style.zIndex = '1031';
              sidebar.style.top = 'var(--header-height)';
              sidebar.style.left = '0';
              sidebar.style.height = 'calc(100vh - var(--header-height))';
              sidebar.style.transform = 'translateX(0)';
              
              // Añadir clase al body para evitar scroll
              document.body.classList.add('sidebar-open');
            }
          } else {
            // COLAPSAR SIDEBAR
            // 1. Agregar clase de colapso en el contenedor
            appContainer.classList.add('sidebar-collapsed');
            
            // 2. Configurar sidebar para que se oculte
            sidebar.style.width = '0';
            sidebar.style.minWidth = '0';
            sidebar.style.visibility = 'hidden';
            sidebar.style.overflow = 'hidden';
            sidebar.style.transform = 'translateX(-100%)';
            sidebar.style.marginLeft = '-260px';
            
            // 3. Configurar main content
            if (mainContent) {
              mainContent.style.width = '100%';
              mainContent.style.marginLeft = '0';
            }
            
            // 4. Manejar caso móvil especial
            if (window.innerWidth < 992) {
              sidebar.classList.remove('show');
              
              // Quitar clase del body para permitir scroll
              document.body.classList.remove('sidebar-open');
            }
          }
          
          // Guardar el estado en localStorage para que persista
          try {
            localStorage.setItem('oficri_sidebar_state', JSON.stringify({
              collapsed: !isCollapsed,
              timestamp: Date.now()
            }));
          } catch (error) {
            // Error silencioso
          }
          
          // Disparar evento personalizado para notificar cambio de estado
          try {
            const eventName = window.sidebarManager?.SIDEBAR_STATE_CHANGED_EVENT || 'OFICRI_SIDEBAR_STATE_CHANGED';
            window.dispatchEvent(new CustomEvent(eventName, {
              detail: {
                collapsed: !isCollapsed,
                isMobile: window.innerWidth < 992,
                timestamp: Date.now()
              }
            }));
          } catch (error) {
            // Error silencioso
          }
          
          // Forzar repintado del DOM para aplicar cambios
          setTimeout(function() {
            sidebar.style.display = sidebar.style.display; // Truco para forzar repintado
          }, 0);
        }
        
        // Importante: retornar false para evitar comportamiento por defecto
        return false;
      };
      
      // Restaurar estado inicial del sidebar según localStorage
      try {
        const savedState = localStorage.getItem('oficri_sidebar_state');
        if (savedState) {
          const { collapsed } = JSON.parse(savedState);
          
          const appContainer = document.querySelector('.oficri-app');
          const sidebar = document.querySelector('.oficri-sidebar');
          
          if (appContainer && sidebar) {
            const isCurrentlyCollapsed = appContainer.classList.contains('sidebar-collapsed');
            
            // Si el estado guardado no coincide con el actual, forzar actualización
            if (collapsed !== isCurrentlyCollapsed) {
              // Simular click en el botón
              setTimeout(function() {
                newBtn.click();
              }, 200);
            }
          }
        }
      } catch (error) {
        // Error silencioso
      }
    }
  }, 200);  // Esperar 200ms para asegurar que el DOM esté completamente cargado
  
  // Inicializar la aplicación
  OFICRI.adminApp.init();
  
  // Agregar esta verificación al inicio y periódicamente
  setTimeout(_resetSidebarStateIfNeeded, 800);  // Verificar después de cargar
  setInterval(_resetSidebarStateIfNeeded, 5000); // Verificar cada 5 segundos por si hay desincronización
}); 