/**
 * OFICRI Profile Service
 * Servicio para gestión del perfil de usuario en el sistema OFICRI
 */

// Importar módulos
import { apiClient } from '../api/apiClient.js';
import { authService } from './authService.js';
import { debugLogger } from '../utils/debugLogger.js';
import { appConfig } from '../config/appConfig.js';
import { normalizeUserProfile } from '../utils/userProfileNormalizer.js';
import { profileDebugger } from '../utils/profileDebugger.js';

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
      logger.debug('🔍 getCurrentUserProfile - Opciones:', { forceRefresh, useMockInDev });
      
      // Si hay una petición en curso, retornar esa promesa
      if (_profilePromise && !forceRefresh) {
        logger.debug('🔄 Reutilizando promesa de perfil en curso');
        return _profilePromise;
      }
      
      // Si hay datos en caché y no se fuerza recarga, y han pasado menos de 5 minutos
      if (_cachedProfile && !forceRefresh && Date.now() - _lastFetchTime < 5 * 60 * 1000) {
        logger.debug('📋 Usando datos de perfil en caché:', _cachedProfile);
        return _cachedProfile;
      }
      
      // Obtener usuario actual del authService
      const currentUser = authService.getUser(true); // Forzar recarga desde localStorage
      logger.debug('👤 Usuario actual obtenido del authService:', currentUser);
      
      // Si no hay usuario autenticado
      if (!currentUser || !currentUser.IDUsuario) {
        // Intentar verificar token para recuperar usuario
        try {
          logger.info('Intentando recuperar usuario desde token...');
          await _recoverUserFromToken();
          // Si llegamos aquí es que se pudo recuperar, intentamos de nuevo
          return getCurrentUserProfile({ forceRefresh: true, useMockInDev });
        } catch (recoveryError) {
          logger.error('Error al recuperar usuario desde token', { error: recoveryError.message });
          
          // Solo usar MOCK en último caso, priorizando siempre datos reales
          if (appConfig.isDevelopment() && useMockInDev) {
            logger.warn('No hay usuario autenticado, usando perfil MOCK para desarrollo');
            return _getMockProfile();
          }
          
          throw new Error('No hay usuario autenticado');
        }
      }
      
      // Crear promesa para evitar múltiples peticiones simultáneas
      _profilePromise = (async () => {
        try {
          // Usar el endpoint correcto según la documentación de API
          // La documentación indica que debe ser /api/users/:id o /usuarios/:id
          logger.debug(`🔄 Obteniendo perfil para usuario ID: ${currentUser.IDUsuario}`);
          
          // Intentar usar el endpoint principal
          const endpoint = `/users/${currentUser.IDUsuario}`;
          logger.debug(`🔄 Llamando al endpoint: ${endpoint}`);
          
          const response = await apiClient.get(endpoint);
          logger.debug('📦 Respuesta recibida del endpoint:', response);
          
          // Capturar respuesta en el depurador de perfil si está disponible
          if (window.OFICRI && window.OFICRI.profileDebugger) {
            try {
              const responseData = {
                timestamp: new Date(),
                endpoint: endpoint,
                userId: currentUser.IDUsuario,
                data: JSON.parse(JSON.stringify(response))
              };
              logger.debug('🔍 Capturando respuesta en depurador de perfil');
              window.OFICRI._capturedResponses = window.OFICRI._capturedResponses || [];
              window.OFICRI._capturedResponses.push(responseData);
            } catch (e) {
              logger.warn('Error al capturar respuesta en depurador:', e);
            }
          }
          
          // Verificar respuesta
          if (!response || !response.data) {
            logger.error('❌ Respuesta inválida al obtener perfil - sin datos', { response });
            throw new Error('Respuesta inválida al obtener perfil');
          }
          
          // Analizar la estructura de la respuesta para depuración
          logger.debug('🔍 Estructura de respuesta completa:', response);
          logger.debug('🔍 Estructura de data en respuesta:', response.data);
          
          // Log detallado de la estructura de datos antes de normalizar
          if (typeof response.data === 'object') {
            logger.debug('🔍 Campos disponibles en response.data:', Object.keys(response.data));
            
            // Verificar si hay un objeto usuario en la respuesta
            if (response.data.user) {
              logger.debug('🔍 Campos en response.data.user:', Object.keys(response.data.user));
            }
            
            // Verificar estructura de rol y área antes de normalizar
            const dataObj = response.data.user || response.data;
            
            if (dataObj.rol) {
              logger.debug('🔍 Estructura de rol antes de normalizar:', dataObj.rol);
            } else {
              logger.warn('⚠️ No se encontró objeto rol en la respuesta');
            }
            
            if (dataObj.area) {
              logger.debug('🔍 Estructura de área antes de normalizar:', dataObj.area);
            } else {
              logger.warn('⚠️ No se encontró objeto area en la respuesta');
            }
          }
          
          // Normalizar los campos del perfil para asegurar compatibilidad con interfaces
          const userData = response.data.user || response.data;
          logger.debug('🔄 Datos a normalizar:', userData);
          
          // Usar la utilidad de normalización
          _cachedProfile = normalizeUserProfile(userData, currentUser);
          logger.debug('✅ Perfil normalizado y guardado en caché:', _cachedProfile);
          
          _lastFetchTime = Date.now();
          
          logger.info('✅ Perfil obtenido correctamente de la base de datos', {
            userId: currentUser.IDUsuario,
            profile: _cachedProfile
          });
          
          return _cachedProfile;
        } catch (error) {
          logger.error('Error al obtener perfil de usuario', { 
            error: error.message,
            userId: currentUser.IDUsuario
          });
          
          // Capturar error en el depurador
          if (window.OFICRI && window.OFICRI.profileDebugger) {
            try {
              const errorData = {
                timestamp: new Date(),
                error: error.message,
                userId: currentUser.IDUsuario,
                stack: error.stack
              };
              window.OFICRI._capturedErrors = window.OFICRI._capturedErrors || [];
              window.OFICRI._capturedErrors.push(errorData);
            } catch (e) {
              logger.warn('Error al capturar error en depurador:', e);
            }
          }
          
          // Intentar endpoint alternativo si el primero falla
          try {
            const alternativeEndpoint = `/usuarios/${currentUser.IDUsuario}`;
            logger.debug(`Intentando endpoint alternativo: ${alternativeEndpoint}`);
            
            const altResponse = await apiClient.get(alternativeEndpoint);
            
            // Capturar respuesta alternativa en el depurador
            if (window.OFICRI && window.OFICRI.profileDebugger) {
              try {
                const responseData = {
                  timestamp: new Date(),
                  endpoint: alternativeEndpoint,
                  userId: currentUser.IDUsuario,
                  data: JSON.parse(JSON.stringify(altResponse))
                };
                window.OFICRI._capturedResponses = window.OFICRI._capturedResponses || [];
                window.OFICRI._capturedResponses.push(responseData);
              } catch (e) {
                logger.warn('Error al capturar respuesta alternativa en depurador:', e);
              }
            }
            
            if (!altResponse || !altResponse.data) {
              throw new Error('Respuesta inválida en endpoint alternativo');
            }
            
            // Normalizar los campos del perfil para asegurar compatibilidad con interfaces
            const altUserData = altResponse.data.user || altResponse.data;
            
            // Usar la utilidad de normalización
            _cachedProfile = normalizeUserProfile(altUserData, currentUser);
            
            _lastFetchTime = Date.now();
            
            logger.info('Perfil obtenido correctamente usando endpoint alternativo', {
              userId: currentUser.IDUsuario
            });
            
            return _cachedProfile;
          } catch (altError) {
            logger.error('Error en endpoint alternativo', { error: altError.message });
            
            // Capturar error alternativo en el depurador
            if (window.OFICRI && window.OFICRI.profileDebugger) {
              try {
                const errorData = {
                  timestamp: new Date(),
                  error: altError.message,
                  userId: currentUser.IDUsuario,
                  source: 'endpoint alternativo',
                  stack: altError.stack
                };
                window.OFICRI._capturedErrors = window.OFICRI._capturedErrors || [];
                window.OFICRI._capturedErrors.push(errorData);
              } catch (e) {
                logger.warn('Error al capturar error alternativo en depurador:', e);
              }
            }
            
            // Solo usar MOCK en último caso y solo en desarrollo
            if (appConfig.isDevelopment() && useMockInDev) {
              logger.warn('Error al obtener perfil de API, usando perfil MOCK para desarrollo');
              return _getMockProfile();
            }
            
            throw error;
          }
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
        logger.error('❌ No hay token disponible en localStorage');
        throw new Error('No hay token disponible');
      }
      
      logger.info('🔄 Intentando verificar token para recuperar usuario');
      
      // Array de posibles endpoints para probar (en orden de preferencia)
      const endpoints = [
        '/api/auth/verificar-token',  // Endpoint correcto según documentación
        '/auth/verificar-token',      // Endpoint alternativo sin prefijo /api
        '/api/auth/verificarToken',   // Variante sin guion
        '/api/auth/verify-token'      // Variante en inglés
      ];
      
      logger.debug('🔍 Intentando verificar token con estos endpoints:', endpoints);
      
      let lastError = null;
      
      // Probar cada endpoint hasta encontrar uno que funcione
      for (const endpoint of endpoints) {
        try {
          logger.debug(`🔄 Intentando verificar token con endpoint: ${endpoint}`);
          
          const response = await apiClient.get(endpoint);
          logger.debug(`📦 Respuesta de ${endpoint}:`, response);
          
          // Verificar la estructura de la respuesta
          if (!response) {
            logger.warn(`⚠️ El endpoint ${endpoint} devolvió una respuesta vacía`);
            continue;
          }
          
          // Verificar si la respuesta contiene datos de usuario
          // Diferentes endpoints pueden devolver estructuras diferentes
          const user = response.user || 
                      (response.data && response.data.user) || 
                      (response.success && response.user) ||
                      response;
          
          logger.debug(`🔍 Datos de usuario extraídos de ${endpoint}:`, user);
          
          if (!user || (!user.id && !user.IDUsuario)) {
            logger.warn(`⚠️ El endpoint ${endpoint} no devolvió datos de usuario válidos:`, user);
            continue;
          }
          
          // Endpoint funcionó, guardar usuario recuperado en localStorage y memoria
          logger.info(`✅ Usuario recuperado desde token usando endpoint: ${endpoint}`);
          logger.debug('📦 Estructura completa de respuesta:', response);
          
          // Normalizar el formato del usuario antes de guardarlo
          const normalizedUser = {
            IDUsuario: user.id || user.IDUsuario,
            codigoCIP: user.codigoCIP || user.CodigoCIP,
            nombres: user.nombres || user.Nombres,
            apellidos: user.apellidos || user.Apellidos,
            rol: user.rol || user.IDRol
          };
          
          logger.debug('👤 Usuario normalizado:', normalizedUser);
          
          localStorage.setItem('oficri_user', JSON.stringify(normalizedUser));
          logger.debug('💾 Usuario guardado en localStorage');
          
          // Actualizar usuario en memoria
          if (authService.getUser) {
            authService.getUser(true);
            logger.debug('🔄 Usuario actualizado en memoria a través de authService');
          }
          
          return normalizedUser;
        } catch (endpointError) {
          logger.warn(`Error con endpoint ${endpoint}:`, endpointError.message);
          lastError = endpointError;
          // Continuar con el siguiente endpoint
        }
      }
      
      // Si llegamos aquí, ningún endpoint funcionó
      throw lastError || new Error('Ningún endpoint de verificación de token funcionó');
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
    
    // Crear perfil mock básico con la misma estructura que usamos en normalización
    _mockUserInDev = {
      IDUsuario: 1,
      CodigoCIP: "12345678",
      Nombres: "Usuario",
      Apellidos: "Desarrollo",
      Grado: "Desarrollador",
      IDRol: 1,
      IDArea: 1,
      UltimoAcceso: new Date().toISOString(),
      rol: {
        IDRol: 1,
        NombreRol: "Desarrollador"
      },
      area: {
        IDArea: 1,
        NombreArea: "Desarrollo de Software"
      },
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
      
      // Intentar primero el endpoint de la documentación
      try {
        const response = await apiClient.get(`/logs/usuario/${currentUser.IDUsuario}${queryParams}`);
        
        if (!response || !response.data) {
          throw new Error('Respuesta inválida al obtener actividad del usuario');
        }
        
        return response.data;
      } catch (primaryError) {
        // Intentar endpoint alternativo
        logger.warn('Intentando endpoint alternativo para actividad de usuario');
        const altResponse = await apiClient.get(`/api/logs/usuario/${currentUser.IDUsuario}${queryParams}`);
        
        if (!altResponse || !altResponse.data) {
          throw new Error('Respuesta inválida al obtener actividad del usuario');
        }
        
        return altResponse.data;
      }
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
   * Genera datos mock para la actividad en desarrollo
   * @private
   */
  function _getMockActivity() {
    return [{
      IDLog: 1,
      FechaHora: new Date().toISOString(),
      Accion: 'LOGIN',
      Descripcion: 'Inicio de sesión exitoso',
      IP: '127.0.0.1',
      Navegador: 'Chrome'
    }, {
      IDLog: 2,
      FechaHora: new Date(Date.now() - 3600000).toISOString(),
      Accion: 'VER_DOCUMENTO',
      Descripcion: 'Visualización de documento #12345',
      IP: '127.0.0.1',
      Navegador: 'Chrome'
    }];
  }
  
  /**
   * Cambia la contraseña del usuario actual
   * @param {string} currentPassword - Contraseña actual
   * @param {string} newPassword - Nueva contraseña
   * @returns {Promise<Object>} Promesa que resuelve con la respuesta
   */
  const changePassword = async function(currentPassword, newPassword) {
    try {
      // Obtener usuario actual
      const currentUser = authService.getUser();
      
      if (!currentUser || !currentUser.IDUsuario) {
        throw new Error('No hay usuario autenticado');
      }
      
      // Validar que las contraseñas no sean vacías
      if (!currentPassword || !newPassword) {
        throw new Error('Las contraseñas no pueden estar vacías');
      }
      
      // Enviar petición
      const response = await apiClient.put('/auth/cambio-password', {
        currentPassword: currentPassword,
        newPassword: newPassword
      });
      
      return response;
    } catch (error) {
      logger.error('Error al cambiar contraseña:', error.message);
      throw error;
    }
  };
  
  /**
   * Limpia la caché del perfil para forzar recarga
   */
  const clearProfileCache = function() {
    _cachedProfile = null;
    _lastFetchTime = 0;
    logger.debug('Caché de perfil limpiada');
  };
  
  /**
   * Asegura que exista un perfil de usuario cargado
   * @returns {Promise<Object>} Promesa que resuelve con el perfil
   */
  const ensureUserProfile = async function() {
    try {
      logger.debug('🔄 ensureUserProfile - Iniciando obtención de perfil');
      const profile = await getCurrentUserProfile();
      
      logger.debug('📦 ensureUserProfile - Perfil obtenido:', profile);
      
      if (!profile) {
        logger.error('❌ ensureUserProfile - No se obtuvo un perfil válido');
        throw new Error('No se pudo obtener un perfil válido');
      }
      
      if (profile.__isMockProfile) {
        logger.warn('🔶 ensureUserProfile - Usando datos de perfil simulados para desarrollo');
      } else {
        logger.info('✅ ensureUserProfile - Perfil cargado correctamente');
      }
      
      return profile;
    } catch (error) {
      logger.error('❌ [PERFIL] Error al cargar perfil:', error.message);
      throw error;
    }
  };
  
  // Exportar API pública
  return {
    getCurrentUserProfile,
    getUserActivity,
    changePassword,
    clearProfileCache,
    ensureUserProfile
  };
})();

// Exportar el módulo
export { profileService };

// Agregar al namespace global
window.OFICRI.profileService = profileService; 