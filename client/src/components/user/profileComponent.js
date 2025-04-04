/**
 * Componente de Perfil de Usuario para OFICRI
 * Muestra la información del perfil y permite cambiar la contraseña
 */

import { profileService } from '../../services/profileService.js';
import { authService } from '../../services/authService.js';
import { notificationManager } from '../../ui/notificationManager.js';

// Crear namespace
window.OFICRI = window.OFICRI || {};

// Componente de Perfil
const profileComponent = (function() {
  'use strict';
  
  // Referencias a elementos del DOM
  let mainContentElement = null;
  let currentUser = null;
  
  // Opciones de configuración
  let config = {
    mainContentSelector: '.oficri-main .tab-content',
    userInfoSelector: '#user-info',
    loadingMessage: 'Cargando información del perfil...',
    errorMessage: 'No se pudo cargar la información del perfil'
  };
  
  /**
   * Inicializa el componente con opciones personalizadas
   * @param {Object} options - Opciones de configuración
   */
  const init = function(options = {}) {
    // Fusionar opciones con configuración predeterminada
    config = { ...config, ...options };
    
    // Buscar el contenedor principal
    mainContentElement = document.querySelector(config.mainContentSelector);
    
    if (!mainContentElement) {
      console.error('[PERFIL] No se encontró el contenedor principal');
      return;
    }
    
    try {
      // Obtener el usuario actual
      currentUser = authService.getUser();
      
      // Verificar si hay un usuario activo, pero no bloqueamos la inicialización
      if (!currentUser) {
        console.warn('[PERFIL] No se encontró usuario autenticado en la inicialización. El perfil estará disponible cuando haya un usuario activo.');
      }
      
      // Añadir evento de clic al botón de usuario
      setupUserInfoButton();
      
      console.log('[PERFIL] Componente inicializado');
    } catch (error) {
      console.error('[PERFIL] Error al inicializar componente:', error);
      // No bloqueamos la inicialización por errores
    }
  };
  
  /**
   * Configura el botón de información de usuario
   */
  const setupUserInfoButton = function() {
    const userInfoElement = document.querySelector(config.userInfoSelector);
    
    if (userInfoElement) {
      userInfoElement.style.cursor = 'pointer';
      userInfoElement.addEventListener('click', handleUserInfoClick);
    }
  };
  
  /**
   * Maneja el clic en el botón de información de usuario
   * @param {Event} event - Evento de clic
   */
  const handleUserInfoClick = function(event) {
    event.preventDefault();
    
    // Crear pestaña si no existe
    let profileTab = document.getElementById('profile');
    
    if (!profileTab) {
      // Buscar el contenedor principal de pestañas
      const tabContent = document.getElementById('mainTabContent');
      
      if (!tabContent) {
        console.error('[PERFIL] No se encontró el contenedor de pestañas');
        return;
      }
      
      // Crear nueva pestaña
      profileTab = document.createElement('div');
      profileTab.id = 'profile';
      profileTab.className = 'tab-pane fade';
      profileTab.setAttribute('role', 'tabpanel');
      
      // Añadir al contenedor
      tabContent.appendChild(profileTab);
    }
    
    // Activar pestaña
    const tabList = document.querySelectorAll('.sidebar-nav li');
    tabList.forEach(tab => tab.classList.remove('active'));
    
    // Mostrar pestaña
    document.querySelectorAll('.tab-pane').forEach(tab => {
      tab.classList.remove('show', 'active');
    });
    
    profileTab.classList.add('show', 'active');
    
    // Cargar contenido
    loadProfileContent(profileTab);
  };
  
  /**
   * Carga el contenido del perfil en la pestaña
   * @param {HTMLElement} tabElement - Elemento de la pestaña
   */
  const loadProfileContent = function(tabElement) {
    // Mostrar spinner de carga
    tabElement.innerHTML = `
      <div class="d-flex justify-content-center align-items-center" style="height: 200px;">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Cargando...</span>
        </div>
        <p class="ms-3">${config.loadingMessage}</p>
      </div>
    `;
    
    // Usar el método mejorado que maneja mejor los errores y tiene recuperación
    profileService.ensureUserProfile()
      .then(profileData => {
        // Verificar si tenemos datos válidos
        if (!profileData) {
          throw new Error('No se recibieron datos del perfil');
        }
        
        // Si el perfil es mock (en desarrollo), mostrar indicador
        if (profileData.__isMockProfile) {
          console.info('[PERFIL] Usando datos de perfil simulados para desarrollo');
        }
        
        renderProfileContent(tabElement, profileData);
      })
      .catch(error => {
        console.error('[PERFIL] Error al cargar perfil:', error);
        
        // Determinar mensaje de error específico
        let errorMessage = config.errorMessage;
        let errorDetails = '';
        
        if (error.status === 404) {
          errorMessage = "No se pudo cargar la información del perfil: Endpoint no encontrado";
          errorDetails = "El servidor no tiene implementado el endpoint de perfil de usuario.";
        } else if (error.message.includes('autenticado')) {
          errorMessage = "Error al cargar perfil: No hay usuario autenticado";
          errorDetails = "No se encontró una sesión activa. Intente cerrar sesión y volver a ingresar.";
        } else if (error.message) {
          errorMessage = `${config.errorMessage}: ${error.message}`;
        }
        
        tabElement.innerHTML = `
          <div class="alert alert-danger m-4" role="alert">
            <h4 class="alert-heading">Error al cargar perfil</h4>
            <p>${errorMessage}</p>
            ${errorDetails ? `<p>${errorDetails}</p>` : ''}
            <hr>
            <p class="mb-0">Si el problema persiste, por favor contacte al administrador del sistema.</p>
            ${window.location.hostname === 'localhost' ? 
              `<div class="mt-3">
                <button id="profile-retry-btn" class="btn btn-sm btn-primary">
                  <i class="fas fa-sync"></i> Reintentar
                </button>
                <button id="profile-debug-btn" class="btn btn-sm btn-secondary ms-2">
                  <i class="fas fa-bug"></i> Depurar
                </button>
              </div>` : ''}
          </div>
        `;
        
        // En ambiente de desarrollo, agregar botones para reintentar y depurar
        if (window.location.hostname === 'localhost') {
          // Configurar botón de reintento
          const retryButton = document.getElementById('profile-retry-btn');
          if (retryButton) {
            retryButton.addEventListener('click', () => {
              // Limpiar caché y reintentar con forzado
              profileService.clearProfileCache();
              loadProfileContent(tabElement);
            });
          }
          
          // Configurar botón de depuración
          const debugButton = document.getElementById('profile-debug-btn');
          if (debugButton) {
            debugButton.addEventListener('click', () => {
              // Intentar usar el depurador de perfil si está disponible
              if (window.OFICRI && window.OFICRI.profileDebugger) {
                window.OFICRI.profileDebugger.enable(true);
                window.OFICRI.profileDebugger.checkAuthState();
                window.OFICRI.profileDebugger.printSummary();
                alert('Información de depuración generada. Vea la consola para detalles.');
              } else {
                alert('Depurador de perfil no disponible. Importe profileDebugger.js.');
              }
            });
          }
        }
      });
  };
  
  /**
   * Renderiza el contenido principal del perfil
   * @param {HTMLElement} container - Contenedor donde renderizar
   * @param {Object} profileData - Datos del perfil
   */
  const renderProfileContent = function(container, profileData) {
    // Extraer datos del perfil con valores por defecto para evitar errores
    const { 
      IDUsuario = 0, 
      Nombres = 'Usuario', 
      Apellidos = 'Desconocido', 
      Grado = 'No disponible', 
      CodigoCIP = 'No disponible',
      rol = { NombreRol: 'No disponible' },
      area = { NombreArea: 'No disponible' } 
    } = profileData;
    
    // Iniciales para avatar (con manejo para evitar errores)
    const inicialNombre = Nombres && Nombres.length > 0 ? Nombres.charAt(0) : 'U';
    const inicialApellido = Apellidos && Apellidos.length > 0 ? Apellidos.charAt(0) : 'D';
    const initials = (inicialNombre + inicialApellido).toUpperCase();
    
    // Template del perfil
    const template = `
      <div class="container-fluid px-4">
        <div class="row mb-4">
          <div class="col-12">
            <h1 class="mt-4 mb-3">Mi Perfil</h1>
          </div>
        </div>
        
        <div class="profile-container">
          <div class="profile-header">
            <div class="profile-avatar">
              ${initials}
            </div>
            <div class="profile-title">
              <h2>${Nombres} ${Apellidos}</h2>
              <p>${Grado} - ${rol.NombreRol}</p>
            </div>
          </div>
          
          <div class="profile-section">
            <h3 class="profile-section-title">Información Personal</h3>
            
            <div class="profile-info-item">
              <div class="profile-info-label">Código CIP:</div>
              <div class="profile-info-value">${CodigoCIP}</div>
            </div>
            
            <div class="profile-info-item">
              <div class="profile-info-label">Grado:</div>
              <div class="profile-info-value">${Grado}</div>
            </div>
            
            <div class="profile-info-item">
              <div class="profile-info-label">Área:</div>
              <div class="profile-info-value">${area.NombreArea}</div>
            </div>
            
            <div class="profile-info-item">
              <div class="profile-info-label">Rol:</div>
              <div class="profile-info-value">${rol.NombreRol}</div>
            </div>
          </div>
          
          <div class="profile-section">
            <h3 class="profile-section-title">Seguridad de la Cuenta</h3>
            
            <div class="profile-info-item">
              <div class="profile-info-label">Contraseña:</div>
              <div class="profile-info-value">••••••••••</div>
            </div>
            
            <div class="profile-actions">
              <button type="button" class="btn btn-change-password" id="btn-change-password">
                <i class="fas fa-key me-2"></i> Cambiar Contraseña
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
    
    // Actualizar contenido
    container.innerHTML = template;
    
    // Añadir evento al botón de cambiar contraseña
    const changePasswordButton = document.getElementById('btn-change-password');
    if (changePasswordButton) {
      changePasswordButton.addEventListener('click', showChangePasswordModal);
    }
  };
  
  /**
   * Muestra el modal para cambiar la contraseña
   */
  const showChangePasswordModal = function() {
    // Crear modal
    const modalHTML = `
      <div class="modal fade" id="changePasswordModal" tabindex="-1" aria-labelledby="changePasswordModalLabel" aria-hidden="true">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title" id="changePasswordModalLabel">Cambiar Contraseña</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
              <form id="changePasswordForm">
                <div class="mb-3">
                  <label for="currentPassword" class="form-label">Contraseña Actual</label>
                  <input type="password" class="form-control" id="currentPassword" required>
                </div>
                <div class="mb-3">
                  <label for="newPassword" class="form-label">Nueva Contraseña</label>
                  <input type="password" class="form-control" id="newPassword" required>
                  <div class="form-text">La contraseña debe tener al menos 8 caracteres, incluir mayúsculas, minúsculas y números.</div>
                </div>
                <div class="mb-3">
                  <label for="confirmPassword" class="form-label">Confirmar Nueva Contraseña</label>
                  <input type="password" class="form-control" id="confirmPassword" required>
                </div>
              </form>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
              <button type="button" class="btn btn-change-password" id="savePasswordBtn">Guardar Cambios</button>
            </div>
          </div>
        </div>
      </div>
    `;
    
    // Añadir al body
    const modalContainer = document.createElement('div');
    modalContainer.innerHTML = modalHTML;
    document.body.appendChild(modalContainer);
    
    // Obtener referencia al modal
    const modalElement = document.getElementById('changePasswordModal');
    const modal = new bootstrap.Modal(modalElement);
    
    // Mostrar modal
    modal.show();
    
    // Añadir evento al botón de guardar
    const saveButton = document.getElementById('savePasswordBtn');
    saveButton.addEventListener('click', function() {
      handleChangePassword(modal);
    });
    
    // Limpiar DOM cuando se cierre
    modalElement.addEventListener('hidden.bs.modal', function() {
      document.body.removeChild(modalContainer);
    });
  };
  
  /**
   * Maneja el cambio de contraseña
   * @param {Object} modal - Instancia del modal de Bootstrap
   */
  const handleChangePassword = function(modal) {
    // Obtener valores
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    // Validar que no estén vacíos
    if (!currentPassword || !newPassword || !confirmPassword) {
      notificationManager.showError('Error', 'Todos los campos son obligatorios');
      return;
    }
    
    // Validar que coincidan
    if (newPassword !== confirmPassword) {
      notificationManager.showError('Error', 'Las contraseñas nuevas no coinciden');
      return;
    }
    
    // Validar requisitos mínimos
    if (newPassword.length < 8 || !/[A-Z]/.test(newPassword) || !/[a-z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      notificationManager.showError('Error', 'La contraseña debe tener al menos 8 caracteres, incluir mayúsculas, minúsculas y números');
      return;
    }
    
    // Mostrar spinner en botón
    const saveButton = document.getElementById('savePasswordBtn');
    const originalText = saveButton.innerHTML;
    saveButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Guardando...';
    saveButton.disabled = true;
    
    // Enviar solicitud
    profileService.changePassword(currentPassword, newPassword)
      .then(response => {
        modal.hide();
        notificationManager.showSuccess('Éxito', 'Contraseña actualizada correctamente');
      })
      .catch(error => {
        notificationManager.showError('Error', error.message || 'No se pudo cambiar la contraseña');
      })
      .finally(() => {
        saveButton.innerHTML = originalText;
        saveButton.disabled = false;
      });
  };
  
  // Public API
  return {
    init
  };
})();

// Asignar al namespace global
window.OFICRI.profileComponent = profileComponent;

// Exportar para ES modules
export { profileComponent }; 