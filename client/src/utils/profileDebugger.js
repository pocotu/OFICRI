/**
 * profileDebugger.js
 * Herramienta de depuración especializada para el módulo de perfil
 */

// Importar dependencias
import { debugLogger } from './debugLogger.js';

// Crear namespace global
window.OFICRI = window.OFICRI || {};

// Crear variables de almacenamiento en el namespace global
window.OFICRI._capturedProfiles = window.OFICRI._capturedProfiles || [];
window.OFICRI._capturedResponses = window.OFICRI._capturedResponses || [];
window.OFICRI._capturedErrors = window.OFICRI._capturedErrors || [];
window.OFICRI._normalizerInputs = window.OFICRI._normalizerInputs || [];
window.OFICRI._normalizerOutputs = window.OFICRI._normalizerOutputs || [];

// Crear logger específico
const logger = debugLogger.createLogger('ProfileDebugger');

/**
 * Depurador especializado para el módulo de perfil
 */
const profileDebugger = (function() {
  'use strict';
  
  // Estado interno
  let _isDebugEnabled = false;
  
  /**
   * Habilita o deshabilita el modo de depuración
   * @param {boolean} enable - Si se debe habilitar la depuración
   */
  const enable = function(enable = true) {
    _isDebugEnabled = enable;
  logger.info(`Depurador de perfil ${enable ? 'habilitado' : 'deshabilitado'}`);
    
    if (enable) {
      monkeyPatchProfileService();
    }
    
    return _isDebugEnabled;
  };
  
  /**
   * Aplica monkey patching al servicio de perfil
   */
  const monkeyPatchProfileService = function() {
    try {
      // Verificar que el servicio de perfil exista
      if (!window.OFICRI || !window.OFICRI.profileService) {
        logger.error('No se puede aplicar monkey patch: profileService no encontrado');
        return;
      }
      
      // Obtener servicio original
      const service = window.OFICRI.profileService;
      
      // Interceptar getCurrentUserProfile
      const originalGetProfile = service.getCurrentUserProfile;
      service.getCurrentUserProfile = async function(...args) {
        logger.debug('Interceptando getCurrentUserProfile');
        
        try {
          const result = await originalGetProfile.apply(this, args);
          
          if (_isDebugEnabled) {
            window.OFICRI._capturedProfiles.push({
              timestamp: new Date(),
              profile: JSON.parse(JSON.stringify(result)),
              source: 'getCurrentUserProfile'
            });
            
            logger.debug('Perfil capturado:', result);
          }
          
          return result;
        } catch (error) {
          logger.error('Error en getCurrentUserProfile interceptado:', error);
          throw error;
        }
      };
      
      // Interceptar normalizeUserProfile si existe
      if (window.OFICRI.userProfileNormalizer) {
        const normalizer = window.OFICRI.userProfileNormalizer;
        const originalNormalize = normalizer.normalizeUserProfile;
        
        normalizer.normalizeUserProfile = function(...args) {
          logger.debug('Interceptando normalizeUserProfile');
          
          try {
            const result = originalNormalize.apply(this, args);
            
            if (_isDebugEnabled) {
              window.OFICRI._capturedProfiles.push({
                timestamp: new Date(),
                profile: JSON.parse(JSON.stringify(result)),
                source: 'normalizeUserProfile',
                inputData: args[0],
                currentUser: args[1]
              });
              
              logger.debug('Normalización capturada:', result);
            }
            
            return result;
          } catch (error) {
            logger.error('Error en normalizeUserProfile interceptado:', error);
            throw error;
          }
        };
      }
      
      logger.info('Monkey patch aplicado exitosamente');
    } catch (error) {
      logger.error('Error al aplicar monkey patch:', error);
    }
  };
  
  /**
   * Verifica el estado de autenticación actual
   */
  const checkAuthState = function() {
    try {
      const token = localStorage.getItem('oficri_token');
      const user = localStorage.getItem('oficri_user');
      
      console.group('Estado de autenticación');
      console.log('Token almacenado:', token ? 'Presente' : 'Ausente');
      console.log('Usuario almacenado:', user ? 'Presente' : 'Ausente');
      
      if (user) {
        try {
          const userData = JSON.parse(user);
          console.log('Datos de usuario:', userData);
        } catch (e) {
          console.log('Error al parsear usuario:', e);
        }
      }
      
      console.groupEnd();
    } catch (error) {
      logger.error('Error al verificar autenticación:', error);
    }
  };
  
  /**
   * Muestra una tabla con el último perfil capturado
   */
  const showLastProfile = function() {
    // Obtenemos el último perfil capturado directamente o desde la normalización
    let lastProfile = null;
    
    if (window.OFICRI._capturedProfiles && window.OFICRI._capturedProfiles.length > 0) {
      lastProfile = window.OFICRI._capturedProfiles[window.OFICRI._capturedProfiles.length - 1];
    } else if (window.OFICRI._normalizerOutputs && window.OFICRI._normalizerOutputs.length > 0) {
      const lastOutput = window.OFICRI._normalizerOutputs[window.OFICRI._normalizerOutputs.length - 1];
      lastProfile = {
        timestamp: lastOutput.timestamp,
        profile: lastOutput.normalizedProfile,
        source: 'normalizerOutput'
      };
    }
    
    if (!lastProfile) {
      console.log('No hay perfiles capturados');
      return;
    }
    
    console.group('Último perfil capturado');
    console.log('Fuente:', lastProfile.source);
    console.log('Timestamp:', lastProfile.timestamp);
    
    const profile = lastProfile.profile;
    
    // Mostrar campos principales en una tabla
    console.table({
      'ID Usuario': profile.IDUsuario || 'N/A',
      'Código CIP': profile.CodigoCIP || 'N/A',
      'Nombres': profile.Nombres || 'N/A',
      'Apellidos': profile.Apellidos || 'N/A',
      'Grado': profile.Grado || 'N/A',
      'Rol ID': profile.IDRol || (profile.rol && profile.rol.IDRol) || 'N/A',
      'Nombre Rol': profile.rol && profile.rol.NombreRol ? profile.rol.NombreRol : 'N/A',
      'Área ID': profile.IDArea || (profile.area && profile.area.IDArea) || 'N/A',
      'Nombre Área': profile.area && profile.area.NombreArea ? profile.area.NombreArea : 'N/A'
    });
    
    // Mostrar datos completos
    console.log('Perfil completo:', profile);
    
    if (lastProfile.inputData) {
      console.log('Datos de entrada:', lastProfile.inputData);
    }
    
    console.groupEnd();
    
    return profile;
  };
  
  /**
   * Muestra información sobre las respuestas de API capturadas
   */
  const showResponses = function() {
    if (!window.OFICRI._capturedResponses || window.OFICRI._capturedResponses.length === 0) {
      console.log('No hay respuestas API capturadas');
      return;
    }
    
    console.group('Respuestas API capturadas');
    console.log(`Total de respuestas: ${window.OFICRI._capturedResponses.length}`);
    
    window.OFICRI._capturedResponses.forEach((response, index) => {
      console.group(`Respuesta #${index + 1} - ${response.timestamp.toLocaleTimeString()}`);
      console.log('Endpoint:', response.endpoint);
      console.log('Usuario ID:', response.userId);
      
      if (response.data && response.data.data) {
        console.log('Estructura de datos:', Object.keys(response.data.data));
        
        // Verificar si hay campos importantes
        const data = response.data.data;
        if (data.rol) console.log('Rol encontrado:', data.rol);
        if (data.area) console.log('Área encontrada:', data.area);
        if (data.CodigoCIP || data.codigoCIP) console.log('CIP encontrado:', data.CodigoCIP || data.codigoCIP);
      }
      
      console.log('Respuesta completa:', response.data);
      console.groupEnd();
    });
    
    console.groupEnd();
  };
  
  /**
   * Muestra información sobre los errores capturados
   */
  const showErrors = function() {
    if (!window.OFICRI._capturedErrors || window.OFICRI._capturedErrors.length === 0) {
      console.log('No hay errores capturados');
      return;
    }
    
    console.group('Errores capturados');
    console.log(`Total de errores: ${window.OFICRI._capturedErrors.length}`);
    
    window.OFICRI._capturedErrors.forEach((error, index) => {
      console.group(`Error #${index + 1} - ${error.timestamp.toLocaleTimeString()}`);
      console.log('Mensaje:', error.error);
      console.log('Usuario ID:', error.userId);
      if (error.source) console.log('Fuente:', error.source);
      if (error.stack) console.log('Stack:', error.stack);
      console.groupEnd();
    });
    
    console.groupEnd();
  };
  
  /**
   * Muestra información sobre el proceso de normalización
   */
  const showNormalizationProcess = function() {
    if ((!window.OFICRI._normalizerInputs || window.OFICRI._normalizerInputs.length === 0) &&
        (!window.OFICRI._normalizerOutputs || window.OFICRI._normalizerOutputs.length === 0)) {
      console.log('No hay datos de normalización capturados');
      return;
    }
    
    console.group('Proceso de normalización');
    
    if (window.OFICRI._normalizerInputs && window.OFICRI._normalizerInputs.length > 0) {
      console.group('Entradas de normalización');
      console.log(`Total de entradas: ${window.OFICRI._normalizerInputs.length}`);
      
      // Mostrar la última entrada
      const lastInput = window.OFICRI._normalizerInputs[window.OFICRI._normalizerInputs.length - 1];
      console.group(`Última entrada - ${lastInput.timestamp.toLocaleTimeString()}`);
      
      if (lastInput.userData) {
        console.log('Campos en userData:', Object.keys(lastInput.userData));
        
        // Verificar campos clave
        const data = lastInput.userData;
        if (data.rol) console.log('Rol original:', data.rol);
        if (data.area) console.log('Área original:', data.area);
      }
      
      console.log('Datos completos:', lastInput.userData);
      console.log('Usuario actual como fallback:', lastInput.currentUser);
      console.groupEnd();
      
      console.groupEnd();
    }
    
    if (window.OFICRI._normalizerOutputs && window.OFICRI._normalizerOutputs.length > 0) {
      console.group('Salidas de normalización');
      console.log(`Total de salidas: ${window.OFICRI._normalizerOutputs.length}`);
      
      // Mostrar la última salida
      const lastOutput = window.OFICRI._normalizerOutputs[window.OFICRI._normalizerOutputs.length - 1];
      console.group(`Última salida - ${lastOutput.timestamp.toLocaleTimeString()}`);
      
      if (lastOutput.normalizedProfile) {
        // Mostrar comparativa de campos importantes
        console.table({
          'Rol (Original)': lastOutput.originalData.rol ? 'Presente' : 'Ausente',
          'Rol (Normalizado)': lastOutput.normalizedProfile.rol ? 'Presente' : 'Ausente',
          'Área (Original)': lastOutput.originalData.area ? 'Presente' : 'Ausente',
          'Área (Normalizado)': lastOutput.normalizedProfile.area ? 'Presente' : 'Ausente',
          'CIP (Original)': lastOutput.originalData.CodigoCIP || lastOutput.originalData.codigoCIP || 'Ausente',
          'CIP (Normalizado)': lastOutput.normalizedProfile.CodigoCIP || 'Ausente'
        });
        
        // Mostrar detalles de rol normalizado
        if (lastOutput.normalizedProfile.rol) {
          console.log('Rol normalizado:', lastOutput.normalizedProfile.rol);
        }
        
        // Mostrar detalles de área normalizada
        if (lastOutput.normalizedProfile.area) {
          console.log('Área normalizada:', lastOutput.normalizedProfile.area);
        }
      }
      
      console.log('Perfil normalizado completo:', lastOutput.normalizedProfile);
      console.groupEnd();
      
      console.groupEnd();
    }
    
    console.groupEnd();
  };
  
  /**
   * Limpia los datos capturados
   */
  const clear = function() {
    window.OFICRI._capturedProfiles = [];
    window.OFICRI._capturedResponses = [];
    window.OFICRI._capturedErrors = [];
    window.OFICRI._normalizerInputs = [];
    window.OFICRI._normalizerOutputs = [];
    logger.info('Datos de depuración limpiados');
  };
  
  /**
   * Imprime un resumen del estado actual
   */
  const printSummary = function() {
    console.group('Resumen de depuración de perfil');
    console.log('Estado:', _isDebugEnabled ? 'Habilitado' : 'Deshabilitado');
    console.log('Perfiles capturados:', window.OFICRI._capturedProfiles.length);
    console.log('Respuestas API capturadas:', window.OFICRI._capturedResponses.length);
    console.log('Errores capturados:', window.OFICRI._capturedErrors.length);
    console.log('Entradas de normalización:', window.OFICRI._normalizerInputs.length);
    console.log('Salidas de normalización:', window.OFICRI._normalizerOutputs.length);
    
    if (window.OFICRI._capturedProfiles.length > 0) {
      const lastProfile = window.OFICRI._capturedProfiles[window.OFICRI._capturedProfiles.length - 1];
      console.log('Último perfil capturado:', 
        lastProfile.timestamp.toLocaleTimeString(), 
        'desde', 
        lastProfile.source);
    }
    
    console.log('');
    console.log('Comandos disponibles:');
    console.log('window.OFICRI.profileDebugger.showLastProfile() - Muestra el último perfil');
    console.log('window.OFICRI.profileDebugger.showResponses() - Muestra respuestas API');
    console.log('window.OFICRI.profileDebugger.showErrors() - Muestra errores capturados');
    console.log('window.OFICRI.profileDebugger.showNormalizationProcess() - Muestra el proceso de normalización');
    console.log('window.OFICRI.profileDebugger.checkAuthState() - Verifica el estado de autenticación');
    console.log('window.OFICRI.profileDebugger.clear() - Limpia los datos capturados');
    
    console.groupEnd();
  };
  
  // API pública
  return {
  enable,
  checkAuthState,
    showLastProfile,
    showResponses,
    showErrors,
    showNormalizationProcess,
    clear,
    printSummary
  };
})();

// Adjuntar al namespace global
window.OFICRI.profileDebugger = profileDebugger;

// Exportar el módulo
export { profileDebugger };
