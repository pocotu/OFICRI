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
    
    try {
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
        throw new Error('Respuesta de login inválida');
      }
      
      // Guardar token y datos de usuario
      _setTokens(response.token, response.refreshToken);
      _setUser(response.user);
      
      // Iniciar verificación de sesión
      _setupSessionCheck();
      
      // Devolver usuario
      return response.user;
    } catch (error) {
      // Registrar intento fallido (solo el intento, no la contraseña)
      console.warn(`[AUTH] Intento de login fallido para usuario policial: ${username}`);
      console.error('[AUTH] Error durante login:', error.message);
      
      // Lanzar error para manejo en UI
      throw error;
    }
  };
  
  /**
   * Cierra la sesión del usuario policial actual
   * @param {Object} options - Opciones adicionales
   * @returns {Promise} Promesa que resuelve cuando se completa el logout
   */
  const logout = async function(options = {}) {
    try {
      // Si hay token, intentar hacer logout en el servidor
      const token = getToken();
      if (token) {
        try {
          await apiClient.post('/auth/logout', {}, {}, {
            'Authorization': `Bearer ${token}`
          });
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
        window.location.href = options.redirectUrl || '/';
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
   * Obtiene el token actual
   * @returns {string|null} Token JWT o null si no hay sesión
   */
  const getToken = function() {
    return localStorage.getItem(TOKEN_KEY);
  };
  
  /**
   * Obtiene el token de refresco
   * @returns {string|null} Token de refresco o null si no hay
   */
  const getRefreshToken = function() {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  };
  
  /**
   * Obtiene el usuario policial actual
   * @returns {Object|null} Datos del usuario o null si no hay sesión
   */
  const getUser = function() {
    // Si ya tenemos el usuario en memoria, devolverlo
    if (_currentUser) {
      return _currentUser;
    }
    
    // Intentar cargar desde localStorage
    _loadUserFromStorage();
    
    return _currentUser;
  };
  
  /**
   * Verifica si el usuario tiene un rol específico
   * @param {string|Array<string>} roles - Rol o array de roles a verificar
   * @returns {boolean} True si tiene alguno de los roles especificados
   */
  const hasRole = function(roles) {
    const user = getUser();
    
    // Si no hay usuario o no tiene rol, devolver false
    if (!user || !user.rol) {
      return false;
    }
    
    // Convertir roles a array si es string
    const rolesArray = Array.isArray(roles) ? roles : [roles];
    
    // Verificar si el usuario tiene alguno de los roles
    return rolesArray.includes(user.rol);
  };
  
  /**
   * Verifica si el usuario actual es administrador
   * @returns {boolean} True si el usuario tiene permisos de administrador
   */
  const isAdmin = function() {
    const user = getUser();
    
    // Si no hay usuario o no tiene permisos, devolver false
    if (!user || !user.Permisos) {
      return false;
    }
    
    // Verificar el bit 7 (128) que corresponde al permiso de administrador
    return (user.Permisos & 128) === 128;
  };
  
  /**
   * Resetea la contraseña del usuario policial
   * @param {string|Object} userIdentifier - CodigoCIP del usuario
   * @returns {Promise} Promesa que resuelve con la respuesta del servidor
   */
  const resetPassword = async function(userIdentifier) {
    // Verificar si el usuario actual tiene permisos de administrador
    if (!isAdmin()) {
      throw new Error('Solo usuarios con rol de Administrador pueden resetear contraseñas');
    }
    
    let requestData = {};
    
    // Comprobar si es un objeto o un string
    if (typeof userIdentifier === 'object') {
      // Si es un objeto, extraer codigoCIP
      if (userIdentifier.codigoCIP) {
        requestData.codigoCIP = userIdentifier.codigoCIP;
      } else {
        throw new Error('Debe proporcionar el Código CIP del usuario');
      }
    } else {
      // Asumir que es un string con codigoCIP
      requestData.codigoCIP = userIdentifier;
      
      // Validar codigoCIP
      if (!validateInput(requestData.codigoCIP, 'codigoCIP')) {
        throw new Error('Código CIP inválido. Debe ser numérico y tener 8 dígitos como máximo');
      }
    }
    
    try {
      // Solicitar reset de contraseña
      const response = await apiClient.post('/auth/reset-password', requestData);
      
      return response;
    } catch (error) {
      throw error;
    }
  };
  
  /**
   * Cambia la contraseña del usuario policial
   * @param {string} currentPassword - Contraseña actual
   * @param {string} newPassword - Nueva contraseña
   * @param {number} [userId] - ID del usuario (solo para administradores)
   * @returns {Promise} Promesa que resuelve con la respuesta del servidor
   */
  const changePassword = async function(currentPassword, newPassword, userId) {
    // Si se proporciona un userId y no es el propio usuario, verificar si es admin
    const currentUser = getUser();
    const isChangingOwnPassword = !userId || (currentUser && currentUser.IDUsuario === userId);
    
    if (!isChangingOwnPassword && !isAdmin()) {
      throw new Error('Solo administradores pueden cambiar la contraseña de otros usuarios');
    }
    
    // Validar entradas
    if (!isAdmin() && !validateInput(currentPassword, 'password')) {
      throw new Error('Contraseña actual inválida');
    }
    
    if (!validateInput(newPassword, 'newPassword')) {
      throw new Error('La nueva contraseña no cumple con los requisitos de seguridad');
    }
    
    try {
      // Preparar datos para la petición
      const requestData = {
        newPassword
      };
      
      // Incluir contraseña actual solo si no es admin o está cambiando su propia contraseña
      if (!isAdmin() || isChangingOwnPassword) {
        requestData.currentPassword = currentPassword;
      }
      
      // Incluir el ID de usuario si se proporciona y no es el propio usuario
      if (userId && !isChangingOwnPassword) {
        requestData.userId = userId;
      }
      
      // Solicitar cambio de contraseña
      const response = await apiClient.post('/auth/change-password', requestData);
      
      return response;
    } catch (error) {
      throw error;
    }
  };
  
  /**
   * Guarda los tokens en localStorage
   * @param {string} token - Token JWT
   * @param {string} refreshToken - Token de refresco
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
   * Guarda los datos del usuario en localStorage y memoria
   * @param {Object} user - Datos del usuario
   * @private
   */
  const _setUser = function(user) {
    if (!user) return;
    
    // Guardar en localStorage
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    
    // Guardar en memoria
    _currentUser = user;
    
    // Actualizar timestamp de última actividad
    _lastActivity = Date.now();
  };
  
  /**
   * Carga el usuario desde localStorage a memoria
   * @private
   */
  const _loadUserFromStorage = function() {
    try {
      const userJson = localStorage.getItem(USER_KEY);
      
      if (userJson) {
        _currentUser = JSON.parse(userJson);
      }
    } catch (error) {
      console.error('[AUTH] Error al cargar usuario desde localStorage:', error.message);
      _currentUser = null;
    }
  };
  
  /**
   * Configura la verificación periódica de sesión
   * @private
   */
  const _setupSessionCheck = function() {
    // Limpiar intervalo existente si hay
    if (_sessionCheckInterval) {
      clearInterval(_sessionCheckInterval);
    }
    
    // Crear nuevo intervalo
    _sessionCheckInterval = setInterval(() => {
      _checkSessionTimeout();
    }, 60000); // Verificar cada minuto
  };
  
  /**
   * Verifica si la sesión ha expirado por inactividad
   * @private
   */
  const _checkSessionTimeout = function() {
    // Si no hay usuario, no verificar
    if (!isAuthenticated()) {
      return;
    }
    
    const currentTime = Date.now();
    const timeSinceLastActivity = currentTime - _lastActivity;
    
    // Si ha pasado más del tiempo de sesión, cerrar sesión
    if (timeSinceLastActivity > SESSION_DURATION) {
      console.warn('[AUTH] Sesión expirada por inactividad');
      logout({ redirect: true });
    } 
    // Si está cerca de expirar (5 minutos antes), mostrar advertencia
    else if (timeSinceLastActivity > (SESSION_DURATION - 5 * 60 * 1000) && !_sessionTimeoutWarning) {
      _showSessionTimeoutWarning();
    }
  };
  
  /**
   * Muestra advertencia de expiración de sesión
   * @private
   */
  const _showSessionTimeoutWarning = function() {
    // Evitar mostrar múltiples advertencias
    if (_sessionTimeoutWarning) return;
    
    // Crear elemento de advertencia
    const warningElement = document.createElement('div');
    warningElement.className = 'session-timeout-warning';
    warningElement.innerHTML = `
      <div class="session-timeout-content">
        <h3>La sesión está por expirar</h3>
        <p>Su sesión expirará en menos de 5 minutos por inactividad.</p>
        <div class="session-timeout-actions">
          <button id="session-extend">Extender sesión</button>
          <button id="session-logout">Cerrar sesión</button>
        </div>
      </div>
    `;
    
    // Estilos
    warningElement.style.cssText = `
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
    `;
    
    // Agregar al DOM
    document.body.appendChild(warningElement);
    
    // Guardar referencia
    _sessionTimeoutWarning = warningElement;
    
    // Configurar handlers
    document.getElementById('session-extend').addEventListener('click', () => {
      _extendSession();
      _removeSessionTimeoutWarning();
    });
    
    document.getElementById('session-logout').addEventListener('click', () => {
      logout({ redirect: true });
    });
  };
  
  /**
   * Elimina la advertencia de expiración de sesión
   * @private
   */
  const _removeSessionTimeoutWarning = function() {
    if (_sessionTimeoutWarning) {
      document.body.removeChild(_sessionTimeoutWarning);
      _sessionTimeoutWarning = null;
    }
  };
  
  /**
   * Extiende la sesión actual
   * @private
   */
  const _extendSession = function() {
    // Actualizar timestamp de última actividad
    _lastActivity = Date.now();
    
    // Intentar refrescar token
    refreshToken().catch(error => {
      console.error('[AUTH] Error al extender sesión:', error.message);
    });
  };
  
  /**
   * Configura tracking de actividad del usuario
   * @private
   */
  const _setupActivityTracking = function() {
    // Lista de eventos a monitorear
    const events = ['mousedown', 'keydown', 'touchstart', 'scroll'];
    
    // Throttle para no actualizar en cada evento
    let throttleTimeout = null;
    const throttle = 10000; // 10 segundos
    
    // Función para actualizar timestamp de actividad
    const updateActivity = () => {
      if (!throttleTimeout) {
        throttleTimeout = setTimeout(() => {
          _lastActivity = Date.now();
          throttleTimeout = null;
        }, throttle);
      }
    };
    
    // Agregar listeners a los eventos
    events.forEach(event => {
      window.addEventListener(event, updateActivity, { passive: true });
    });
  };
  
  /**
   * Limpia los datos de sesión
   * @private
   */
  const _clearSession = function() {
    // Limpiar localStorage
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    
    // Limpiar variables de memoria
    _currentUser = null;
    
    // Limpiar intervalo de verificación
    if (_sessionCheckInterval) {
      clearInterval(_sessionCheckInterval);
      _sessionCheckInterval = null;
    }
    
    // Limpiar advertencia de timeout
    _removeSessionTimeoutWarning();
  };
  
  // Inicializar el servicio cuando se carga el script
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

// Exportar para ES modules
export { authService };

// Para compatibilidad con navegadores antiguos
window.OFICRI.authService = authService; 