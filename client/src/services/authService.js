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
  
  // Variables privadas
  let _currentUser = null;
  let _sessionCheckInterval = null;
  let _lastActivity = Date.now();
  let _sessionTimeoutWarning = null;
  let _isAuthenticating = false; // Bandera para evitar múltiples intentos simultáneos
  let _isRedirecting = false; // Bandera para evitar múltiples redirecciones
  
  /**
   * Inicializa el servicio de autenticación
   */
  const init = function() {
    console.log('[AUTH] Inicializando servicio de autenticación');
    
    // Cargar usuario desde localStorage si existe
    _loadUserFromStorage();
    
    // Configurar verificación de sesión
    _setupSessionCheck();
    
    // Configurar listener de actividad
    _setupActivityTracking();
  };
  
  /**
   * Autentica al usuario policial con sus credenciales
   * @param {Object|string} credentials - Credenciales o nombre de usuario
   * @param {string} [password] - Contraseña (si el primer parámetro es username)
   * @param {Object} [options] - Opciones adicionales
   * @returns {Promise} Promesa que resuelve con los datos del usuario autenticado
   */
  const login = async function(credentials, password, options = {}) {
    // Evitar intentos múltiples de login simultáneos
    if (_isAuthenticating) {
      console.warn('[AUTH] Ya hay un proceso de autenticación en curso');
      return Promise.reject(new Error('Ya hay un proceso de autenticación en curso'));
    }
    
    _isAuthenticating = true;
    
    try {
      let username, pwd, opts;
      
      // Verificar si se pasó un objeto de credenciales o parámetros individuales
      if (typeof credentials === 'object' && credentials !== null) {
        // Formato: login({codigoCIP: '12345', password: 'pwd'})
        username = credentials.codigoCIP || credentials.username;
        pwd = credentials.password;
        opts = password || {}; // El segundo parámetro sería options
      } else {
        // Formato antiguo: login('username', 'password', {})
        username = credentials;
        pwd = password;
        opts = options;
      }
      
      // Validar entradas
      if (!username || !pwd) {
        throw new Error('Credenciales inválidas: falta Código CIP o contraseña');
      }
      
      console.log('[AUTH] Intentando login con usuario policial:', username);
      
      // Preparar objeto de request
      const loginData = {
        username: username,
        password: pwd
      };
      
      // Si se recibió como codigoCIP, incluirlo también para compatibilidad
      if (credentials.codigoCIP) {
        loginData.codigoCIP = credentials.codigoCIP;
      }
      
      // Incluir opciones adicionales si existen
      if (credentials.remember || opts.remember) {
        loginData.remember = true;
      }
      
      if (opts.captcha) {
        loginData.captcha = opts.captcha;
      }
      
      console.log('[AUTH] Datos de login (sin password):', { 
        username: loginData.username, 
        codigoCIP: loginData.codigoCIP,
        remember: loginData.remember 
      });
      
      // Realizar petición de login
      const response = await apiClient.post('/auth/login', loginData);
      
      // Verificar respuesta
      if (!response || !response.token) {
        console.error('[AUTH] Respuesta de login inválida:', response);
        throw new Error('Respuesta de login inválida');
      }
      
      // Guardar token y datos de usuario
      _setTokens(response.token, response.refreshToken);
      _setUser(response.user);
      
      // Iniciar verificación de sesión
      _setupSessionCheck();
      
      console.log('[AUTH] Login exitoso para usuario:', response.user.CodigoCIP);
      
      // Devolver usuario
      return response.user;
    } catch (error) {
      // Registrar intento fallido (solo el intento, no la contraseña)
      console.warn(`[AUTH] Intento de login fallido para usuario policial: ${credentials.codigoCIP || credentials.username || credentials}`);
      console.error('[AUTH] Error durante login:', error.message);
      
      // Lanzar error para manejo en UI
      throw error;
    } finally {
      // Siempre marcar como no autenticando al final
      _isAuthenticating = false;
    }
  };
  
  /**
   * Cierra la sesión del usuario policial actual
   * @param {Object} options - Opciones adicionales
   * @returns {Promise} Promesa que resuelve cuando se completa el logout
   */
  const logout = async function(options = {}) {
    // Evitar múltiples logouts simultáneos
    if (_isRedirecting) {
      console.warn('[AUTH] Ya hay una redirección en proceso');
      return;
    }
    
    _isRedirecting = true;
    
    try {
      // Si hay token, intentar hacer logout en el servidor
      const token = getToken();
      if (token) {
        try {
          await apiClient.post('/auth/logout', {}, {}, {
            'Authorization': `Bearer ${token}`
          });
          console.log('[AUTH] Logout exitoso en el servidor');
        } catch (error) {
          // Ignorar errores al hacer logout en el servidor
          console.warn('[AUTH] Error al hacer logout en el servidor:', error.message);
        }
      }
    } finally {
      // Limpiar datos de sesión
      _clearSession();
      
      // Redirigir a página de login si se especifica
      if (options.redirect !== false) {
        const redirectUrl = options.redirectUrl || '/';
        console.log('[AUTH] Redirigiendo a:', redirectUrl);
        
        // Usar setTimeout para evitar problemas de redirección
        setTimeout(() => {
          window.location.href = redirectUrl;
          _isRedirecting = false;
        }, 100);
      } else {
        _isRedirecting = false;
      }
    }
  };
  
  /**
   * Refresca el token de autenticación
   * @returns {Promise<boolean>} Promesa que resuelve a true si el refresh fue exitoso
   */
  const refreshToken = async function() {
    try {
      const refreshToken = getRefreshToken();
      
      if (!refreshToken) {
        return false;
      }
      
      // Intentar refrescar token
      const response = await apiClient.post('/auth/refresh', {
        refreshToken
      }, {}, {}, true);
      
      // Verificar respuesta
      if (!response || !response.token) {
        return false;
      }
      
      // Actualizar tokens
      _setTokens(response.token, response.refreshToken);
      
      return true;
    } catch (error) {
      console.error('[AUTH] Error al refrescar token:', error.message);
      return false;
    }
  };
  
  /**
   * Verifica si el usuario policial está autenticado
   * @returns {boolean} True si está autenticado
   */
  const isAuthenticated = function() {
    return !!getToken() && !!getUser();
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
        logout({
          redirect: true,
          redirectUrl: '/'
        });
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
      logout({
        redirect: true,
        redirectUrl: '/'
      });
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
  
  /**
   * Limpia todos los datos de sesión
   * @private
   */
  const _clearSession = function() {
    // Limpiar tokens de localStorage
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    
    // Limpiar datos en memoria
    _currentUser = null;
    
    // Limpiar verificación de sesión
    if (_sessionCheckInterval) {
      clearInterval(_sessionCheckInterval);
      _sessionCheckInterval = null;
    }
    
    console.log('[AUTH] Sesión limpiada exitosamente');
  };
  
  // Inicializar
  init();
  
  // API pública
  return {
    login,
    logout,
    refreshToken,
    isAuthenticated,
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