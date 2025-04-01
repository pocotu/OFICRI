/**
 * OFICRI Auth Service
 * Servicio de autenticación que maneja el login, logout y sesión
 * Cumple con ISO/IEC 27001 para control de acceso y gestión de identidad
 * Sistema específico para la Policía Nacional del Perú
 */

// Importar módulos
import { config } from '../config/app.config.js';
import { apiClient } from '../api/apiClient.js';
import { validateInput } from '../utils/validators.js';
import { userService } from './userService.js';
import { authStateManager } from '../utils/authStateManager.js';

// Crear namespace global para compatibilidad
window.OFICRI = window.OFICRI || {};

// Auth Service Module
const authService = (function() {
  'use strict';
  
  // Constantes privadas
  const TOKEN_KEY = 'oficri_token';
  const REFRESH_TOKEN_KEY = 'oficri_refresh_token';
  const USER_KEY = 'oficri_user';
  const SESSION_DURATION = 30 * 60 * 1000; // 30 minutos en ms
  const AUTH_STATE_KEY = 'oficri_auth_state'; // Para controlar estado de autenticación
  
  // Variables privadas
  let _currentUser = null;
  let _sessionCheckInterval = null;
  let _lastActivity = Date.now();
  let _sessionTimeoutWarning = null;
  let _isAuthenticating = false; // Bandera para evitar múltiples intentos simultáneos
  let _isRedirecting = false; // Bandera para evitar múltiples redirecciones
  let _isInitialized = false; // Bandera para evitar inicializaciones múltiples
  
  /**
   * Inicializa el servicio de autenticación
   */
  const init = function() {
    // Evitar inicializaciones múltiples
    if (_isInitialized) {
      if (config.isDevelopment()) {
        console.log('[AUTH] Servicio ya inicializado, omitiendo');
      }
      return Promise.resolve();
    }
    
    _isInitialized = true;
    
    if (config.isDevelopment()) {
    console.log('[AUTH] Inicializando servicio de autenticación');
    }
    
    // Verificar si hay estado previo (login en proceso, etc)
    const authState = sessionStorage.getItem(AUTH_STATE_KEY);
    if (authState) {
      console.log('[AUTH] Estado previo detectado:', authState);
      
      // NUEVO: Limpiar estado solo si no estamos en medio de una operación crítica
      if (authState !== 'logging_out' && authState !== 'redirecting' && authState !== 'refreshing') {
        sessionStorage.removeItem(AUTH_STATE_KEY);
      } else {
        console.log('[AUTH] Manteniendo estado actual para operación en curso:', authState);
      }
    }
    
    // Cargar usuario desde localStorage si existe
    _loadUserFromStorage();
    
    // Configurar verificación de sesión
    _setupSessionCheck();
    
    // Configurar listener de actividad
    _setupActivityTracking();
    
    return Promise.resolve();
  };
  
  /**
   * Verifica si el usuario está autenticado
   * @returns {boolean} - True si el usuario está autenticado
   */
  const isAuthenticated = function() {
    try {
      const token = localStorage.getItem('oficri_token');
      return !!token;
    } catch (e) {
      console.error('[AuthService] Error verificando autenticación:', e);
      return false;
    }
  };
  
  /**
   * Inicia sesión en el sistema
   * @param {Object} credentials - Credenciales de usuario
   * @returns {Promise} - Promesa que resuelve con la respuesta del servidor
   */
  const login = function(credentials) {
    // NUEVO: Intentar limpiar cualquier estado de autenticación pendiente
    authStateManager.clearAuthenticationState();
    
    // Prevenir múltiples intentos de login
    if (authStateManager.getState() === authStateManager.STATES.AUTHENTICATING) {
      console.warn('[AuthService] Ya hay un intento de login en curso');
      return Promise.reject({ error: 'Ya hay un intento de login en curso' });
    }
    
    // Marcar como autenticando
    authStateManager.setState(authStateManager.STATES.AUTHENTICATING);
    _isAuthenticating = true;
    
    return new Promise((resolve, reject) => {
      // Validar credenciales
      if (!credentials || !credentials.codigoCIP || !credentials.password) {
        // Limpiar estado de autenticación
        authStateManager.setState(null);
        _isAuthenticating = false;
        
        reject({ error: 'Credenciales incompletas' });
        return;
      }
      
      // Realizar solicitud de login
      apiClient.post('/auth/login', credentials)
        .then(response => {
          // Verificar que la respuesta no sea null o undefined
          if (!response) {
            throw new Error('La respuesta del servidor está vacía');
          }

          // CORREGIDO: Usar la respuesta directamente si no tiene propiedad data
          // En algunos casos la API puede devolver directamente el objeto sin wrappearlo en "data"
          const responseData = response.data || response;
          
          // Verificar que tengamos un token
          if (!responseData.token) {
            throw new Error('No se recibió un token de acceso válido');
          }
          
          // Guardar token en localStorage
          localStorage.setItem('oficri_token', responseData.token);
          
          // Si hay información de usuario, guardarla
          if (responseData.user) {
            localStorage.setItem('oficri_user', JSON.stringify(responseData.user));
            _currentUser = responseData.user;
          }
          
          // Reset del contador de ciclos y marcar como idle
          authStateManager.resetCycleCount();
          authStateManager.setState(null);
          _isAuthenticating = false;
          
          // Devolver responseData al llamador
          resolve(responseData);
        })
        .catch(error => {
          console.error('[AuthService] Error en login:', error);
          
          // Formatear mensaje de error para el usuario
          let errorMessage = 'Error de autenticación';
          
          if (error.response) {
            if (error.response.status === 401) {
              errorMessage = 'Credenciales incorrectas';
            } else if (error.response.data && error.response.data.message) {
              errorMessage = error.response.data.message;
            }
          } else if (error.message) {
            // Si hay un mensaje de error específico, usarlo
            errorMessage = error.message;
          }
          
          // Reset estado
          authStateManager.setState(null);
          _isAuthenticating = false;
          
          reject({ error: errorMessage });
        });
    });
  };
  
  /**
   * Cierra la sesión del usuario
   * @returns {Promise} Promesa que resuelve cuando se completa el proceso de cierre de sesión
   */
  const logout = function() {
    // Importar el servicio de logout aquí para evitar dependencias circulares
    // ya que authService y logoutService se podrían importar mutuamente
    return import('../services/logoutService.js').then(module => {
      const logoutService = module.default;
      return logoutService.logout();
    });
  };
  
  /**
   * Redirige al usuario según su estado de autenticación
   */
  const redirectIfNeeded = function() {
    // Obtener página actual
    const currentPage = window.location.pathname.split('/').pop();
    
    // Registrar carga de página para detectar ciclos
    authStateManager.registerPageLoad(currentPage);
    
    // Si estamos en modo rescate, no hacer nada
    if (authStateManager.getState() === authStateManager.STATES.RESCUED) {
      console.warn('[AuthService] En modo rescate, no se realizarán redirecciones');
      return;
    }
    
    try {
      const isAuth = isAuthenticated();
      const isLoginPage = currentPage === 'index.html' || currentPage === '';
      
      // Si está autenticado pero está en login, redirigir a dashboard
      if (isAuth && isLoginPage) {
        if (authStateManager.canRedirect('dashboard')) {
          console.log('[AuthService] Usuario autenticado en login, redirigiendo a dashboard');
          
          // Marcar como redirigiendo
          authStateManager.setState(authStateManager.STATES.REDIRECTING);
          
          // Añadir delay para evitar problemas
          setTimeout(() => {
            window.location.href = 'dashboard.html';
            
            // Reset estado después de iniciar redirección
            setTimeout(() => {
              authStateManager.setState(null);
            }, 500);
          }, 100);
        }
      }
      // Si no está autenticado y no está en login, redirigir a login
      else if (!isAuth && !isLoginPage) {
        // Verificar si venimos de un logout para no contar como ciclo
        const fromLogout = sessionStorage.getItem('oficri_from_logout') === 'true';
        
        if (fromLogout) {
          // Limpiar flag
          sessionStorage.removeItem('oficri_from_logout');
        }
        
        if (authStateManager.canRedirect('login')) {
          console.log('[AuthService] Usuario no autenticado, redirigiendo a login');
          
          // Marcar como redirigiendo
          authStateManager.setState(authStateManager.STATES.REDIRECTING);
          
          // Añadir delay para evitar problemas
          setTimeout(() => {
            window.location.href = 'index.html';
            
            // Reset estado después de iniciar redirección
            setTimeout(() => {
              authStateManager.setState(null);
            }, 500);
          }, 100);
        }
      }
    } catch (e) {
      console.error('[AuthService] Error en redirección:', e);
    }
  };
  
  /**
   * Obtiene el token de autenticación actual
   * @returns {string|null} Token JWT o null si no hay token
   */
  const getToken = function() {
    return localStorage.getItem(TOKEN_KEY);
  };
  
  /**
   * Obtiene el refresh token actual
   * @returns {string|null} Refresh token o null si no hay token
   */
  const getRefreshToken = function() {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  };
  
  /**
   * Obtiene los datos del usuario actual
   * @param {boolean} refresh - Si es true, recarga los datos desde localStorage
   * @returns {Object|null} Datos del usuario o null si no hay usuario
   */
  const getUser = function(refresh = false) {
    if (refresh || !_currentUser) {
      _loadUserFromStorage();
    }
    
    return _currentUser;
  };
  
  /**
   * Verifica si el usuario tiene el rol especificado
   * @param {string|Array} roles - Rol o array de roles a verificar
   * @returns {boolean} True si el usuario tiene el rol
   */
  const hasRole = function(roles) {
    const user = getUser();
    
    if (!user || !user.NombreRol) {
      return false;
    }
    
    if (Array.isArray(roles)) {
      return roles.includes(user.NombreRol);
    }
    
    return user.NombreRol === roles;
  };
  
  /**
   * Verifica si el usuario es administrador
   * @returns {boolean} True si el usuario es administrador
   */
  const isAdmin = function() {
    const user = getUser();
    
    if (!user) {
      return false;
    }
    
    // Verificar si tiene el rol de administrador o el permiso bit 7 (128)
    return hasRole('ADMINISTRADOR') || 
           (user.Permisos && (user.Permisos & 128) === 128);
  };
  
  /**
   * Solicita un reset de contraseña para un usuario policial
   * @param {string} userIdentifier - Código CIP del usuario
   * @returns {Promise} Promesa que resuelve cuando se completa la solicitud
   */
  const resetPassword = async function(userIdentifier) {
    try {
      if (!userIdentifier) {
        throw new Error('Se requiere el Código CIP del usuario');
      }
      
      // Solo administradores pueden resetear contraseñas
      const user = getUser();
      if (!user || !isAdmin()) {
        throw new Error('No tiene permisos para realizar esta operación');
      }
      
      // Verificar formato de identificador (solo CIP, no email)
      if (!/^\d{6,8}$/.test(userIdentifier)) {
        throw new Error('Código CIP inválido. Debe ser un número de 6-8 dígitos');
      }
      
      // Enviar solicitud de reset
      const response = await apiClient.post('/auth/reset-password', {
        codigoCIP: userIdentifier
      });
      
      return response;
      } catch (error) {
      console.error('[AUTH] Error al solicitar reset de contraseña:', error.message);
        throw error;
      }
  };
  
  /**
   * Cambia la contraseña del usuario policial
   * @param {string} currentPassword - Contraseña actual
   * @param {string} newPassword - Nueva contraseña
   * @param {number} [userId] - ID del usuario (solo para administradores)
   * @returns {Promise} Promesa que resuelve cuando se completa el cambio
   */
  const changePassword = async function(currentPassword, newPassword, userId) {
    try {
      if (!currentPassword || !newPassword) {
        throw new Error('Se requieren la contraseña actual y la nueva contraseña');
      }
      
      // Verificar si la solicitud es para cambiar la contraseña de otro usuario (solo administradores)
      if (userId) {
        const user = getUser();
        if (!user || !isAdmin()) {
          throw new Error('No tiene permisos para cambiar la contraseña de otro usuario');
        }
      }
      
      // Validar nueva contraseña (seguridad)
      if (newPassword.length < 8) {
        throw new Error('La nueva contraseña debe tener al menos 8 caracteres');
      }
      
      if (!/[A-Z]/.test(newPassword)) {
        throw new Error('La nueva contraseña debe incluir al menos una letra mayúscula');
      }
      
      if (!/[a-z]/.test(newPassword)) {
        throw new Error('La nueva contraseña debe incluir al menos una letra minúscula');
      }
      
      if (!/[0-9]/.test(newPassword)) {
        throw new Error('La nueva contraseña debe incluir al menos un número');
      }
      
      if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword)) {
        throw new Error('La nueva contraseña debe incluir al menos un carácter especial');
      }
      
      // Preparar solicitud
      const requestData = {
        currentPassword,
        newPassword
      };
      
      // Si se especifica un ID de usuario, agregarlo (solo administradores)
      if (userId) {
        requestData.userId = userId;
      }
      
      // Enviar solicitud
      const response = await apiClient.post('/auth/change-password', requestData);
      
      return response;
          } catch (error) {
      console.error('[AUTH] Error al cambiar contraseña:', error.message);
      throw error;
    }
  };
  
  /**
   * Guarda los tokens de autenticación
   * @param {string} token - Token JWT
   * @param {string} refreshToken - Refresh token
   * @private
   */
  const _setTokens = function(token, refreshToken) {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    }
    
    if (refreshToken) {
      localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    }
  };
  
  /**
   * Guarda los datos del usuario
   * @param {Object} user - Datos del usuario
   * @private
   */
  const _setUser = function(user) {
    if (!user) {
      _currentUser = null;
      localStorage.removeItem(USER_KEY);
      return;
    }
    
    _currentUser = user;
    
    try {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } catch (error) {
      console.error('[AUTH] Error al guardar usuario en localStorage:', error.message);
    }
  };
  
  /**
   * Carga los datos del usuario desde localStorage
   * @private
   */
  const _loadUserFromStorage = function() {
    try {
      const userJson = localStorage.getItem(USER_KEY);
      
      if (userJson) {
        _currentUser = JSON.parse(userJson);
      } else {
        _currentUser = null;
      }
    } catch (error) {
      console.error('[AUTH] Error al cargar usuario desde localStorage:', error.message);
      _currentUser = null;
    }
  };
  
  /**
   * Configura la verificación periódica de la sesión
   * @private
   */
  const _setupSessionCheck = function() {
    // Limpiar intervalo existente si hay
    if (_sessionCheckInterval) {
      clearInterval(_sessionCheckInterval);
    }
    
    // Configurar nuevo intervalo
    _sessionCheckInterval = setInterval(() => {
      _checkSessionTimeout();
    }, 60000); // Verificar cada minuto
  };
  
  /**
   * Verifica si la sesión ha expirado por inactividad
   * @private
   */
  const _checkSessionTimeout = function() {
    // Si no está autenticado, no hacer nada
    if (!isAuthenticated()) {
      return;
    }
    
    const currentTime = Date.now();
    const timeSinceLastActivity = currentTime - _lastActivity;
    
    // Si ha pasado más tiempo del permitido de inactividad
    if (timeSinceLastActivity > SESSION_DURATION) {
      console.warn('[AUTH] Sesión expirada por inactividad');
      
      // Mostrar advertencia antes de cerrar sesión
      _showSessionTimeoutWarning();
    }
  };
  
  /**
   * Muestra advertencia de expiración de sesión
   * @private
   */
  const _showSessionTimeoutWarning = function() {
    // Evitar mostrar múltiples advertencias
    if (_sessionTimeoutWarning) {
      return;
    }
    
    // Crear elemento de advertencia
    const warningDiv = document.createElement('div');
    warningDiv.className = 'session-timeout-warning';
    warningDiv.innerHTML = `
      <div class="session-timeout-content">
        <h3>Sesión por expirar</h3>
        <p>Su sesión está por expirar debido a inactividad.</p>
        <div class="session-timeout-actions">
          <button id="session-extend-btn" class="btn btn-primary">Extender sesión</button>
          <button id="session-logout-btn" class="btn btn-secondary">Cerrar sesión</button>
        </div>
        <div class="session-timeout-timer">
          <span id="session-timer">60</span> segundos
        </div>
      </div>
    `;
    
    // Agregar estilos inline
    const style = document.createElement('style');
    style.textContent = `
      .session-timeout-warning {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
      }
      .session-timeout-content {
        background-color: white;
        padding: 20px;
        border-radius: 5px;
        max-width: 400px;
        text-align: center;
      }
      .session-timeout-actions {
        margin: 20px 0;
      }
      .session-timeout-timer {
        font-weight: bold;
      }
    `;
    
    // Agregar al DOM
    document.head.appendChild(style);
    document.body.appendChild(warningDiv);
    
    // Guardar referencia
    _sessionTimeoutWarning = {
      div: warningDiv,
      style: style
    };
    
    // Configurar contador regresivo
    let timeLeft = 60;
    const timerElement = document.getElementById('session-timer');
    const timerInterval = setInterval(() => {
      timeLeft--;
      
      if (timerElement) {
        timerElement.textContent = timeLeft;
      }
      
      if (timeLeft <= 0) {
        clearInterval(timerInterval);
        logout();
      }
    }, 1000);
    
    // Configurar botones
    document.getElementById('session-extend-btn').addEventListener('click', () => {
      clearInterval(timerInterval);
      _extendSession();
      _removeSessionTimeoutWarning();
    });
    
    document.getElementById('session-logout-btn').addEventListener('click', () => {
      clearInterval(timerInterval);
      _removeSessionTimeoutWarning();
      logout();
    });
  };
  
  /**
   * Elimina la advertencia de expiración de sesión
   * @private
   */
  const _removeSessionTimeoutWarning = function() {
    if (_sessionTimeoutWarning) {
      if (_sessionTimeoutWarning.div && _sessionTimeoutWarning.div.parentNode) {
        _sessionTimeoutWarning.div.parentNode.removeChild(_sessionTimeoutWarning.div);
      }
      
      if (_sessionTimeoutWarning.style && _sessionTimeoutWarning.style.parentNode) {
        _sessionTimeoutWarning.style.parentNode.removeChild(_sessionTimeoutWarning.style);
      }
      
      _sessionTimeoutWarning = null;
    }
  };
  
  /**
   * Extiende la sesión actual
   * @private
   */
  const _extendSession = function() {
    // Actualizar tiempo de última actividad
    _lastActivity = Date.now();
    
    // Refrescar token si es posible
    refreshToken().catch(error => {
      console.warn('[AUTH] Error al refrescar token:', error.message);
    });
  };
  
  /**
   * Configura el seguimiento de actividad del usuario
   * @private
   */
  const _setupActivityTracking = function() {
    // Eventos que consideramos como actividad
    const activityEvents = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    
    // Definir función de actualización de actividad
    const updateActivity = () => {
          _lastActivity = Date.now();
    };
    
    // Aplicar a eventos
    activityEvents.forEach(eventType => {
      document.addEventListener(eventType, updateActivity, { passive: true });
    });
    
    // Actualizar en primer evento de red (XHR o fetch)
    const originalFetch = window.fetch;
    window.fetch = function(...args) {
      updateActivity();
      return originalFetch.apply(this, args);
    };
    
    // Inicializar tiempo de última actividad
    updateActivity();
  };
  
  // Inicializar
  init();
  
  // API pública
  return {
    isAuthenticated,
    login,
    logout,
    redirectIfNeeded,
    getToken,
    getRefreshToken,
    getUser,
    hasRole,
    isAdmin,
    resetPassword,
    changePassword
  };
})(); 

// Para compatibilidad con ES modules y UMD
// El build process convertirá esto a formato compatible con navegadores
export { authService };

// Para compatibilidad con código que usa la variable global
window.OFICRI.authService = authService; 