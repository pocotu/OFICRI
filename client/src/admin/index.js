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

// Inicializar logger para este módulo
const logger = debugLogger.createLogger('ADMIN_PANEL');

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
      console.error('Acceso no autorizado: rol incorrecto');
      OFICRI.authService.logout();
      return;
    }
    
    // Mostrar información del usuario
    _renderUserInfo(currentUser);
    
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
   * Configura eventos iniciales
   * @private
   */
  const _setupEventListeners = function() {
    console.group('[AdminApp] CONFIGURACIÓN DE EVENTOS');
    
    // Evento para cerrar sesión
    const cerrarSesionBtn = document.getElementById('cerrar-sesion');
    if (cerrarSesionBtn) {
      console.log('[AdminApp-DEBUG] Configurando evento para cerrar sesión:', cerrarSesionBtn);
      cerrarSesionBtn.addEventListener('click', function(e) {
        console.log('[AdminApp-DEBUG] Botón cerrar sesión clickeado');
        e.preventDefault();
        _cerrarSesion();
      });
    } else {
      console.error('[AdminApp-DEBUG] ⛔ No se encontró el botón de cerrar sesión (#cerrar-sesion)');
    }
    
    // IMPORTANTE: NO CONFIGURAR EL BOTÓN HAMBURGUESA AQUÍ
    // La configuración del botón hamburguesa la hacemos en la solución de emergencia
    // para evitar tener múltiples manejadores compitiendo entre sí
    console.log('[AdminApp-DEBUG] El botón hamburguesa será configurado por la solución de emergencia');
    
    // Evento para actualización del dashboard (cada 5 min)
    setInterval(_refreshDashboard, 5 * 60 * 1000);
    console.log('[AdminApp-DEBUG] Configurado refresh del dashboard cada 5 minutos');
    
    // Configurar eventos de las pestañas
    _setupTabEvents();
    console.log('[AdminApp-DEBUG] Eventos de pestañas configurados');
    
    console.groupEnd();
  };
  
  /**
   * Inicializa los componentes necesarios
   */
  const _initializeComponents = function() {
    console.group('[AdminApp] INICIALIZACIÓN DE COMPONENTES');
    
    // Inicializar componentes BS
    try {
      const tooltips = document.querySelectorAll('[data-bs-toggle="tooltip"]');
      console.log('[AdminApp-DEBUG] Tooltips encontrados:', tooltips.length);
      tooltips.forEach(tooltip => {
        new bootstrap.Tooltip(tooltip);
      });
    } catch (error) {
      console.error('[AdminApp-DEBUG] Error al inicializar tooltips:', error);
    }
    
    console.log('[AdminApp-DEBUG] Inicializando módulos específicos si están disponibles');
    
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
      console.error('[AdminApp-DEBUG] Error al inicializar módulos:', error);
    }
    
    console.log('[AdminApp-DEBUG] Verificando elementos DOM para el sidebar');
    
    // Verificar que existan los elementos necesarios para el sidebar antes de inicializarlo
    const sidebarElement = document.querySelector('.oficri-sidebar');
    const menuToggleElement = document.querySelector('.menu-toggle');
    const mainContentElement = document.querySelector('.oficri-main');
    const appContainerElement = document.querySelector('.oficri-app');
    
    console.log('[AdminApp-DEBUG] Elementos para sidebar:');
    console.log('  sidebarElement (.oficri-sidebar):', sidebarElement ? '✅ ENCONTRADO' : '❌ NO ENCONTRADO');
    console.log('  menuToggleElement (.menu-toggle):', menuToggleElement ? '✅ ENCONTRADO' : '❌ NO ENCONTRADO');
    console.log('  mainContentElement (.oficri-main):', mainContentElement ? '✅ ENCONTRADO' : '❌ NO ENCONTRADO');
    console.log('  appContainerElement (.oficri-app):', appContainerElement ? '✅ ENCONTRADO' : '❌ NO ENCONTRADO');
    
    if (sidebarElement) {
      console.log('[AdminApp-DEBUG] HTML del sidebar:', sidebarElement.outerHTML.substring(0, 100) + '...');
      console.log('[AdminApp-DEBUG] Clases del sidebar:', sidebarElement.className);
    }
    
    if (menuToggleElement) {
      console.log('[AdminApp-DEBUG] HTML del botón toggle:', menuToggleElement.outerHTML);
      console.log('[AdminApp-DEBUG] Clases del botón toggle:', menuToggleElement.className);
    }
    
    // Inicializar el gestor del sidebar solo si todos los elementos existen
    if (sidebarElement && menuToggleElement && mainContentElement && appContainerElement) {
      console.log('[AdminApp-DEBUG] Todos los elementos encontrados, inicializando sidebarManager...');
      
      // Verificar si el sidebarManager existe
      if (!window.sidebarManager) {
        console.error('[AdminApp-DEBUG] ⛔ Error: sidebarManager no está disponible en window');
        console.log('[AdminApp-DEBUG] window.sidebarManager:', window.sidebarManager);
        console.groupEnd();
        return;
      }
      
      console.log('[AdminApp-DEBUG] window.sidebarManager encontrado:', window.sidebarManager);
      
      // Inicializar usando la API correcta del módulo
      try {
        console.log('[AdminApp-DEBUG] Llamando a window.sidebarManager.init()');
        const sidebarAPI = window.sidebarManager.init({
          sidebarSelector: '.oficri-sidebar',
          mainContentSelector: '.oficri-main',
          menuToggleSelector: '.menu-toggle',
          appContainerSelector: '.oficri-app',
          persistState: true
        });
        
        console.log('[AdminApp-DEBUG] Resultado de la inicialización:', sidebarAPI);
        
        // Guardar la API en una variable global para acceso desde otras partes de la aplicación
        window.sidebarAPI = sidebarAPI;
        console.log('[AdminApp-DEBUG] API asignada a window.sidebarAPI');
        
        // En móviles, ocultar el sidebar inicialmente
        if (window.innerWidth < 992 && sidebarAPI && sidebarAPI.setSidebarState) {
          console.log('[AdminApp-DEBUG] Ocultando sidebar en dispositivo móvil (ancho:', window.innerWidth, 'px)');
          sidebarAPI.setSidebarState(true); // true = collapsed
        }
        
        // Escuchar eventos de cambio de estado del sidebar
        try {
          window.addEventListener(window.sidebarManager.SIDEBAR_STATE_CHANGED_EVENT, function(e) {
            console.log('[AdminApp-DEBUG] Evento de cambio de estado de sidebar recibido:', e.detail);
          });
          console.log('[AdminApp-DEBUG] Listener para evento de cambio de estado configurado');
        } catch (error) {
          console.error('[AdminApp-DEBUG] Error al configurar listener de eventos de cambio:', error);
        }
        
        console.log('[AdminApp-DEBUG] SidebarManager inicializado correctamente');
      } catch (error) {
        console.error('[AdminApp-DEBUG] ⛔ Error al inicializar sidebarManager:', error);
      }
    } else {
      console.error('[AdminApp-DEBUG] ⛔ No se puede inicializar el sidebar: faltan elementos DOM necesarios');
    }
    
    console.log('[AdminApp-DEBUG] Disparando evento de sidebar manager cargado');
    
    // Disparar evento personalizado para notificar que el gestor del sidebar está listo
    try {
      window.dispatchEvent(new CustomEvent('OFICRISidebarManagerLoaded'));
      console.log('[AdminApp-DEBUG] Evento OFICRISidebarManagerLoaded disparado');
    } catch (error) {
      console.error('[AdminApp-DEBUG] Error al disparar evento OFICRISidebarManagerLoaded:', error);
    }
    
    console.groupEnd();
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
    console.group('[AdminApp] TOGGLE SIDEBAR');
    console.log('[AdminApp-DEBUG] ⚡ _toggleSidebar llamado');
    
    // Verificar disponibilidad de APIs
    console.log('[AdminApp-DEBUG] Verificando disponibilidad de sidebarAPI:');
    console.log('  window.sidebarAPI existe:', !!window.sidebarAPI);
    console.log('  window.sidebarAPI.toggleSidebar existe:', !!(window.sidebarAPI && typeof window.sidebarAPI.toggleSidebar === 'function'));
    console.log('  window.sidebarManager existe:', !!window.sidebarManager);
    console.log('  window.sidebarManager.init existe:', !!(window.sidebarManager && typeof window.sidebarManager.init === 'function'));
    
    // Usar la API del sidebarManager en lugar de manipular directamente el DOM
    if (window.sidebarAPI && typeof window.sidebarAPI.toggleSidebar === 'function') {
      console.log('[AdminApp-DEBUG] Usando window.sidebarAPI.toggleSidebar()');
      try {
        window.sidebarAPI.toggleSidebar();
        console.log('[AdminApp-DEBUG] toggleSidebar llamado exitosamente');
      } catch (error) {
        console.error('[AdminApp-DEBUG] ⛔ Error al llamar a toggleSidebar:', error);
      }
    } else if (window.sidebarManager && typeof window.sidebarManager.init === 'function') {
      console.log('[AdminApp-DEBUG] sidebarAPI no disponible, intentando usar window.sidebarManager');
      
      // Intentar inicializar el sidebar si no está disponible
      try {
        console.log('[AdminApp-DEBUG] Reinicializando sidebarManager...');
        const sidebarAPI = window.sidebarManager.init({
          sidebarSelector: '.oficri-sidebar',
          mainContentSelector: '.oficri-main',
          menuToggleSelector: '.menu-toggle',
          appContainerSelector: '.oficri-app',
          persistState: true
        });
        
        console.log('[AdminApp-DEBUG] Resultado de la reinicialización:', sidebarAPI);
        
        if (sidebarAPI && typeof sidebarAPI.toggleSidebar === 'function') {
          window.sidebarAPI = sidebarAPI;
          console.log('[AdminApp-DEBUG] Llamando a sidebarAPI.toggleSidebar() después de reinicializar');
          sidebarAPI.toggleSidebar();
        } else {
          console.error('[AdminApp-DEBUG] ⛔ No se pudo obtener una API válida al reinicializar');
        }
      } catch (error) {
        console.error('[AdminApp-DEBUG] ⛔ Error al reinicializar sidebarManager:', error);
      }
    } else {
      console.error('[AdminApp-DEBUG] ⛔ No se encontró API del sidebar, intentando manipulación directa del DOM');
      
      // Implementación de respaldo: manipular directamente el DOM
      try {
        const sidebar = document.querySelector('.oficri-sidebar');
        const appContainer = document.querySelector('.oficri-app');
        
        if (sidebar && appContainer) {
          console.log('[AdminApp-DEBUG] Elementos encontrados, haciendo toggle manual');
          
          // Verificar estado actual (básicamente, si tiene clase collapsed)
          const isCollapsed = appContainer.classList.contains('sidebar-collapsed');
          console.log('[AdminApp-DEBUG] Estado actual isCollapsed:', isCollapsed);
          
          if (isCollapsed) {
            console.log('[AdminApp-DEBUG] Expandiendo sidebar manualmente');
            appContainer.classList.remove('sidebar-collapsed');
            sidebar.style.transform = '';
            sidebar.style.width = '';
            sidebar.style.minWidth = '';
            sidebar.style.visibility = '';
            
            if (window.innerWidth < 992) {
              sidebar.classList.add('show');
            }
          } else {
            console.log('[AdminApp-DEBUG] Colapsando sidebar manualmente');
            appContainer.classList.add('sidebar-collapsed');
            sidebar.style.transform = 'translateX(-100%)';
            sidebar.style.width = '0';
            sidebar.style.minWidth = '0';
            sidebar.style.visibility = 'hidden';
            
            if (window.innerWidth < 992) {
              sidebar.classList.remove('show');
            }
          }
          
          // Guardar estado en localStorage para persistencia
          try {
            localStorage.setItem('oficri_sidebar_state', JSON.stringify({
              collapsed: !isCollapsed,
              timestamp: Date.now()
            }));
            console.log('[AdminApp-DEBUG] Estado guardado en localStorage');
          } catch (error) {
            console.error('[AdminApp-DEBUG] Error guardando estado:', error);
          }
        } else {
          console.error('[AdminApp-DEBUG] ⛔ No se encontraron elementos DOM para el toggle manual');
        }
      } catch (error) {
        console.error('[AdminApp-DEBUG] ⛔ Error en la manipulación directa del DOM:', error);
      }
    }
    
    console.log('[AdminApp-DEBUG] _toggleSidebar completado');
    console.groupEnd();
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
  
  // Función para asegurar que el sidebar tenga un estado consistente
  // (solución de emergencia para casos extremos)
  function _resetSidebarStateIfNeeded() {
    console.log('[AdminApp-DEBUG] Verificando consistencia del estado del sidebar');
    
    const sidebar = document.querySelector('.oficri-sidebar');
    const appContainer = document.querySelector('.oficri-app');
    
    if (!sidebar || !appContainer) {
      console.log('[AdminApp-DEBUG] No se encontraron elementos del sidebar para verificar');
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
      console.warn('[AdminApp-DEBUG] ⚠️ Estado inconsistente del sidebar detectado, corrigiendo...');
      
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
      
      console.log('[AdminApp-DEBUG] Estado del sidebar corregido');
    } else {
      console.log('[AdminApp-DEBUG] Estado del sidebar es consistente');
    }
  }
  
  // Exponer API pública
  return {
    init: _init
  };
})();

// Inicializar la aplicación cuando se cargue la página
document.addEventListener('DOMContentLoaded', function() {
  console.group('[AdminApp] INICIO DE APLICACIÓN');
  console.log('[AdminApp-DEBUG] Evento DOMContentLoaded disparado');
  
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
    console.group('[AdminApp] CONFIGURACIÓN BOTÓN HAMBURGUESA');
    console.log('[AdminApp-DEBUG] Interceptando directamente botón hamburguesa (solución de emergencia)');
    
    // Buscar botón toggle con cualquiera de estos selectores
    const menuBtn = document.querySelector('.menu-toggle') || document.getElementById('menu-toggle');
    
    if (menuBtn) {
      console.log('[AdminApp-DEBUG] ✅ Botón hamburguesa encontrado:', menuBtn);
      
      // Eliminar todos los listeners previos para evitar conflictos
      const oldBtn = menuBtn;
      const newBtn = oldBtn.cloneNode(true);
      
      console.log('[AdminApp-DEBUG] Reemplazando botón para eliminar listeners anteriores');
      oldBtn.parentNode.replaceChild(newBtn, oldBtn);
      
      // Agregar manejador directo al evento onclick (mayor prioridad que addEventListener)
      newBtn.onclick = function(e) {
        console.group('[AdminApp] 🍔 CLICK EN HAMBURGUESA');
        console.log('[AdminApp-DEBUG] Click en hamburguesa interceptado');
        e.preventDefault();
        e.stopPropagation();
        
        // Hacer toggle directo del sidebar sin usar APIs intermedias
        const sidebar = document.querySelector('.oficri-sidebar');
        const appContainer = document.querySelector('.oficri-app');
        const mainContent = document.querySelector('.oficri-main');
        
        if (sidebar && appContainer) {
          const isCollapsed = appContainer.classList.contains('sidebar-collapsed');
          console.log('[AdminApp-DEBUG] Estado actual del sidebar:', isCollapsed ? 'COLAPSADO' : 'EXPANDIDO');
          
          if (isCollapsed) {
            // EXPANDIR SIDEBAR
            console.log('[AdminApp-DEBUG] Expandiendo sidebar...');
            
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
              console.log('[AdminApp-DEBUG] Aplicando estilos móviles para sidebar expandido');
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
            console.log('[AdminApp-DEBUG] Colapsando sidebar...');
            
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
              console.log('[AdminApp-DEBUG] Aplicando estilos móviles para sidebar colapsado');
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
            console.log('[AdminApp-DEBUG] Estado guardado en localStorage');
          } catch (error) {
            console.error('[AdminApp-DEBUG] Error al guardar estado:', error);
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
            console.log('[AdminApp-DEBUG] Evento de cambio de estado disparado');
          } catch (error) {
            console.error('[AdminApp-DEBUG] Error al disparar evento:', error);
          }
          
          // Forzar repintado del DOM para aplicar cambios
          setTimeout(function() {
            console.log('[AdminApp-DEBUG] Forzando repintado del DOM');
            sidebar.style.display = sidebar.style.display; // Truco para forzar repintado
            if (sidebar.offsetHeight) {
              console.log('[AdminApp-DEBUG] Offset height del sidebar:', sidebar.offsetHeight);
            }
          }, 0);
        } else {
          console.error('[AdminApp-DEBUG] ⛔ No se encontraron elementos DOM para el sidebar');
        }
        
        console.log('[AdminApp-DEBUG] Manejo de click completado');
        console.groupEnd();
        
        // Importante: retornar false para evitar comportamiento por defecto
        return false;
      };
      
      console.log('[AdminApp-DEBUG] ✅ Manejador de evento onclick instalado en el botón hamburguesa');
      
      // Restaurar estado inicial del sidebar según localStorage
      try {
        const savedState = localStorage.getItem('oficri_sidebar_state');
        if (savedState) {
          const { collapsed } = JSON.parse(savedState);
          console.log('[AdminApp-DEBUG] Estado guardado del sidebar encontrado:', collapsed ? 'COLAPSADO' : 'EXPANDIDO');
          
          const appContainer = document.querySelector('.oficri-app');
          const sidebar = document.querySelector('.oficri-sidebar');
          
          if (appContainer && sidebar) {
            const isCurrentlyCollapsed = appContainer.classList.contains('sidebar-collapsed');
            
            // Si el estado guardado no coincide con el actual, forzar actualización
            if (collapsed !== isCurrentlyCollapsed) {
              console.log('[AdminApp-DEBUG] Forzando estado inicial del sidebar según localStorage');
              
              // Simular click en el botón
              setTimeout(function() {
                newBtn.click();
              }, 200);
            }
          }
        }
      } catch (error) {
        console.error('[AdminApp-DEBUG] Error al recuperar estado guardado:', error);
      }
    } else {
      console.error('[AdminApp-DEBUG] ⛔ No se pudo encontrar el botón hamburguesa');
    }
    
    console.groupEnd();
  }, 200);  // Esperar 200ms para asegurar que el DOM esté completamente cargado
  
  // Inicializar la aplicación
  OFICRI.adminApp.init();
  console.log('[AdminApp-DEBUG] Aplicación inicializada');
  
  // Agregar esta verificación al inicio y periódicamente
  setTimeout(_resetSidebarStateIfNeeded, 800);  // Verificar después de cargar
  setInterval(_resetSidebarStateIfNeeded, 5000); // Verificar cada 5 segundos por si hay desincronización
  
  console.groupEnd();
}); 