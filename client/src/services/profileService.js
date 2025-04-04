/**
 * OFICRI Profile Service
 * Servicio para gestión del perfil de usuario en el sistema OFICRI
 */

// Importar módulos
import { apiClient } from '../api/apiClient.js';
import { authService } from './authService.js';
import { debugLogger } from '../utils/debugLogger.js';
import { appConfig } from '../config/appConfig.js';

// Crear namespace
window.OFICRI = window.OFICRI || {};

// Crear logger específico para este módulo
const logger = debugLogger.createLogger('ProfileService');

// Profile Service Module
const profileService = (function() {
  'use strict';
  
  // Almacenamiento en caché del perfil
  let _cachedProfile = null;
  let _profilePromise = null;
  let _lastFetchTime = 0;
  let _mockUserInDev = null;
  
  /**
   * Obtiene los datos completos del perfil del usuario actual
   * @param {Object} options - Opciones adicionales
   * @param {boolean} options.forceRefresh - Forzar recarga desde API incluso si hay caché
   * @param {boolean} options.useMockInDev - Usar datos mock en desarrollo si hay error
   * @returns {Promise<Object>} Promesa que resuelve con los datos del perfil
   */
  const getCurrentUserProfile = async function(options = {}) {
    const { forceRefresh = false, useMockInDev = true } = options;
    
    try {
      // Si hay una petición en curso, retornar esa promesa
      if (_profilePromise && !forceRefresh) {
        logger.debug('Reutilizando promesa de perfil en curso');
        return _profilePromise;
      }
      
      // Si hay datos en caché y no se fuerza recarga, y han pasado menos de 5 minutos
      if (_cachedProfile && !forceRefresh && Date.now() - _lastFetchTime < 5 * 60 * 1000) {
        logger.debug('Usando datos de perfil en caché');
        return _cachedProfile;
      }
      
      // Obtener usuario actual del authService
      const currentUser = authService.getUser(true); // Forzar recarga desde localStorage
      
      // Si no hay usuario autenticado
      if (!currentUser || !currentUser.IDUsuario) {
        // En modo desarrollo, podemos usar un perfil mock para facilitar pruebas
        if (appConfig.isDevelopment() && useMockInDev) {
          logger.warn('No hay usuario autenticado, usando perfil MOCK para desarrollo');
          return _getMockProfile();
        }
        
        // Intentar verificar token para recuperar usuario
        try {
          logger.info('Intentando recuperar usuario desde token...');
          await _recoverUserFromToken();
          // Si llegamos aquí es que se pudo recuperar, intentamos de nuevo
          return getCurrentUserProfile({ forceRefresh: true, useMockInDev });
        } catch (recoveryError) {
          logger.error('Error al recuperar usuario desde token', { error: recoveryError.message });
          throw new Error('No hay usuario autenticado');
        }
      }
      
      // Crear promesa para evitar múltiples peticiones simultáneas
      _profilePromise = (async () => {
        try {
          // Realizar petición al endpoint de usuarios
          logger.debug(`Obteniendo perfil para usuario ID: ${currentUser.IDUsuario}`);
          const response = await apiClient.get(`/api/users/${currentUser.IDUsuario}`);
          
          // Verificar respuesta
          if (!response || !response.data) {
            throw new Error('Respuesta inválida al obtener perfil');
          }
          
          // Guardar en caché
          _cachedProfile = response.data;
          _lastFetchTime = Date.now();
          
          return _cachedProfile;
        } catch (error) {
          // Si hay error 404 en desarrollo, podemos usar un perfil mock
          if (appConfig.isDevelopment() && useMockInDev && 
             (error.status === 404 || error.message.includes('404'))) {
            logger.warn('Error 404 en endpoint de perfil, usando perfil MOCK para desarrollo', {
              error: error.message
            });
            return _getMockProfile();
          }
          
          logger.error('Error al obtener perfil de usuario', { 
            error: error.message,
            userId: currentUser.IDUsuario
          });
          throw error;
        } finally {
          // Limpiar promesa para permitir futuros intentos
          _profilePromise = null;
        }
      })();
      
      return _profilePromise;
    } catch (error) {
      logger.error('Error en getCurrentUserProfile', { error: error.message });
      throw error;
    }
  };
  
  /**
   * Intenta recuperar el usuario desde el token JWT
   * @private
   */
  async function _recoverUserFromToken() {
    try {
      const token = localStorage.getItem('oficri_token');
      
      if (!token) {
        throw new Error('No hay token disponible');
      }
      
      logger.info('Intentando verificar token para recuperar usuario');
      
      const response = await apiClient.get('/auth/verificar-token', null, null, null, false);
      
      if (!response || !response.user) {
        throw new Error('No se pudo obtener usuario desde token');
      }
      
      // Guardar usuario recuperado en localStorage y memoria
      logger.info('Usuario recuperado desde token', { userId: response.user.id });
      localStorage.setItem('oficri_user', JSON.stringify(response.user));
      
      // Actualizar usuario en memoria
      if (authService.getUser) {
        authService.getUser(true);
      }
      
      return response.user;
    } catch (error) {
      logger.error('Error al recuperar usuario desde token', { error: error.message });
      throw error;
    }
  }
  
  /**
   * Genera un perfil mock para desarrollo
   * @private
   */
  function _getMockProfile() {
    // Si ya tenemos un perfil mock, devolverlo
    if (_mockUserInDev) {
      return _mockUserInDev;
    }
    
    // Crear perfil mock básico
    _mockUserInDev = {
      IDUsuario: 1,
      CodigoCIP: "12345678",
      Nombres: "Usuario",
      Apellidos: "Desarrollo",
      Grado: "Desarrollador",
      IDRol: 1,
      rol: {
        IDRol: 1,
        NombreRol: "Desarrollador"
      },
      area: {
        IDArea: 1,
        NombreArea: "Desarrollo de Software"
      },
      UltimoAcceso: new Date().toISOString(),
      // Agregar más campos según sea necesario
      __isMockProfile: true
    };
    
    logger.info('Perfil MOCK generado para desarrollo', { profile: _mockUserInDev });
    
    return _mockUserInDev;
  }
  
  /**
   * Obtiene el historial de actividad del usuario actual
   * @param {Object} options - Opciones de paginación
   * @returns {Promise<Array>} Promesa que resuelve con la lista de actividades
   */
  const getUserActivity = async function(options = {}) {
    try {
      // Obtener usuario actual del authService
      const currentUser = authService.getUser();
      
      if (!currentUser || !currentUser.IDUsuario) {
        // En modo desarrollo, podemos usar datos mock
        if (appConfig.isDevelopment()) {
          logger.warn('No hay usuario autenticado, usando actividad MOCK para desarrollo');
          return _getMockActivity();
        }
        
        throw new Error('No hay usuario autenticado');
      }
      
      // Construir parámetros de consulta
      let queryParams = '';
      
      if (options.page) {
        queryParams += `page=${options.page}&`;
      }
      
      if (options.limit) {
        queryParams += `limit=${options.limit}&`;
      }
      
      // Eliminar último & si existe
      if (queryParams.endsWith('&')) {
        queryParams = queryParams.slice(0, -1);
      }
      
      // Agregar ? al inicio si hay parámetros
      if (queryParams) {
        queryParams = '?' + queryParams;
      }
      
      // Realizar petición
      const response = await apiClient.get(`/api/logs/usuario/${currentUser.IDUsuario}${queryParams}`);
      
      // Verificar respuesta
      if (!response || !response.data) {
        throw new Error('Respuesta inválida al obtener actividad del usuario');
      }
      
      return response.data;
    } catch (error) {
      logger.error('[PROFILE] Error al obtener actividad del usuario:', error.message);
      
      // En modo desarrollo, proporcionar datos mock en caso de error
      if (appConfig.isDevelopment()) {
        logger.warn('Usando datos MOCK de actividad en desarrollo debido a error');
        return _getMockActivity();
      }
      
      throw error;
    }
  };
  
  /**
   * Genera actividad mock para desarrollo
   * @returns {Array} Actividad mock
   * @private
   */
  function _getMockActivity() {
    return [
      {
        id: 1,
        tipo: 'LOGIN',
        fecha: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        detalles: 'Inicio de sesión exitoso'
      },
      {
        id: 2,
        tipo: 'DOCUMENTO_VISTO',
        fecha: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
        detalles: 'Visualización del documento #12345'
      },
      {
        id: 3,
        tipo: 'PERFIL_ACTUALIZADO',
        fecha: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        detalles: 'Actualización de datos de perfil'
      }
    ];
  }
  
  /**
   * Cambia la contraseña del usuario actual
   * @param {string} currentPassword - Contraseña actual
   * @param {string} newPassword - Nueva contraseña
   * @returns {Promise<Object>} Promesa que resuelve con el resultado de la operación
   */
  const changePassword = async function(currentPassword, newPassword) {
    try {
      // Validar contraseñas
      if (!currentPassword || !newPassword) {
        throw new Error('Contraseñas incompletas');
      }
      
      // Realizar petición
      const response = await apiClient.put('/api/auth/cambio-password', {
        currentPassword,
        newPassword
      });
      
      // Verificar respuesta
      if (!response || !response.data) {
        throw new Error('Respuesta inválida al cambiar contraseña');
      }
      
      return response.data;
    } catch (error) {
      console.error('[PROFILE] Error al cambiar contraseña:', error.message);
      throw error;
    }
  };
  
  /**
   * Limpia la caché del perfil
   */
  const clearProfileCache = function() {
    _cachedProfile = null;
    _lastFetchTime = 0;
    logger.debug('Caché de perfil limpiada');
  };
  
  /**
   * Verifica si hay un usuario autenticado y recupera su perfil
   * Si no hay usuario o hay error, usa un perfil mock en desarrollo
   * @returns {Promise<Object>} Promesa que resuelve con el perfil
   */
  const ensureUserProfile = async function() {
    try {
      // Intentar obtener perfil
      return await getCurrentUserProfile();
    } catch (error) {
      // Si estamos en desarrollo, usar mock
      if (appConfig.isDevelopment()) {
        logger.warn('Error al obtener perfil, usando mock para desarrollo', { error: error.message });
        return _getMockProfile();
      }
      
      // En producción, propagar el error
      throw error;
    }
  };
  
  // Public API
  return {
    getCurrentUserProfile,
    getUserActivity,
    changePassword,
    clearProfileCache,
    ensureUserProfile
  };
})();

// Asignar al namespace global
window.OFICRI.profileService = profileService;

// Exportar para ES modules
export { profileService }; 