/**
 * userProfileNormalizer.js
 * Utilidad para normalizar datos de perfil de usuario en diferentes formatos
 */

// Crear namespace global
window.OFICRI = window.OFICRI || {};

// Importar logger para depuración detallada
import { debugLogger } from './debugLogger.js';
import { profileDebugger } from './profileDebugger.js';

const logger = debugLogger.createLogger('ProfileNormalizer');

/**
 * Normaliza los datos del perfil de usuario para garantizar una estructura consistente
 * @param {Object} userData - Datos de usuario en cualquier formato que puedan llegar de la API
 * @param {Object} currentUser - Usuario actual (opcional) para usar como fallback si faltan datos
 * @returns {Object} Perfil normalizado con estructura estandarizada
 */
export function normalizeUserProfile(userData, currentUser = null) {
  logger.debug('📥 ENTRADA - Datos recibidos para normalizar:', userData);
  logger.debug('📥 ENTRADA - Usuario actual para fallback:', currentUser);
  
  // Capturar entrada de normalización en el depurador
  if (window.OFICRI && window.OFICRI.profileDebugger) {
    try {
      const inputData = {
        timestamp: new Date(),
        userData: JSON.parse(JSON.stringify(userData)),
        currentUser: currentUser ? JSON.parse(JSON.stringify(currentUser)) : null
      };
      window.OFICRI._normalizerInputs = window.OFICRI._normalizerInputs || [];
      window.OFICRI._normalizerInputs.push(inputData);
    } catch (e) {
      logger.warn('Error al capturar entrada de normalización en depurador:', e);
    }
  }
  
  if (!userData) {
    logger.error('⚠️ Datos de usuario nulos o indefinidos');
    return null;
  }
  
  // Manejar diferentes estructuras de respuesta
  const data = userData.user || userData.data || userData;
  logger.debug('🔄 PROCESO - Estructura base para normalización:', data);
  
  // Analizar la estructura de datos recibida para diagnóstico
  logger.debug('🔍 ANÁLISIS - Campos disponibles en datos:', Object.keys(data));
  
  // Análisis detallado del objeto de rol para diagnóstico
  let rolObject = null;
  if (data.rol) {
    logger.debug('🔍 ANÁLISIS - Estructura de rol encontrada:', data.rol);
    rolObject = data.rol;
  } else if (data.Rol) {
    logger.debug('🔍 ANÁLISIS - Estructura de rol encontrada como "Rol":', data.Rol);
    rolObject = data.Rol;
  } else {
    logger.debug('⚠️ ANÁLISIS - No se encontró objeto rol estructurado - Construyendo uno');
    // Buscar campos relacionados con el rol
    const rolId = data.IDRol || data.rolId || data.idRol;
    const nombreRol = data.NombreRol || data.nombreRol || data.rolNombre;
    
    if (rolId || nombreRol) {
      logger.debug('🔍 ANÁLISIS - Encontrados campos sueltos de rol:', { rolId, nombreRol });
      rolObject = { IDRol: rolId, NombreRol: nombreRol };
    } else {
      logger.warn('⚠️ ANÁLISIS - No se encontraron datos de rol');
    }
  }
  
  // Análisis detallado del objeto de área para diagnóstico
  let areaObject = null;
  if (data.area) {
    logger.debug('🔍 ANÁLISIS - Estructura de área encontrada:', data.area);
    areaObject = data.area;
  } else if (data.Area) {
    logger.debug('🔍 ANÁLISIS - Estructura de área encontrada como "Area":', data.Area);
    areaObject = data.Area;
  } else {
    logger.debug('⚠️ ANÁLISIS - No se encontró objeto area estructurado - Construyendo uno');
    // Buscar campos relacionados con el área
    const areaId = data.IDArea || data.areaId || data.idArea;
    const nombreArea = data.NombreArea || data.nombreArea || data.areaNombre;
    
    if (areaId || nombreArea) {
      logger.debug('🔍 ANÁLISIS - Encontrados campos sueltos de área:', { areaId, nombreArea });
      areaObject = { IDArea: areaId, NombreArea: nombreArea };
    } else {
      logger.warn('⚠️ ANÁLISIS - No se encontraron datos de área');
    }
  }
  
  // Si encontramos objetos "CIP" o "codigo" como objetos anidados, buscar en ellos
  let cipValue = data.CodigoCIP || data.codigoCIP;
  
  if (!cipValue && data.CIP && typeof data.CIP === 'object') {
    logger.debug('🔍 ANÁLISIS - Encontrado objeto CIP anidado:', data.CIP);
    cipValue = data.CIP.codigo || data.CIP.valor;
  }
  
  if (!cipValue && data.codigo && typeof data.codigo === 'object') {
    logger.debug('🔍 ANÁLISIS - Encontrado objeto codigo anidado:', data.codigo);
    cipValue = data.codigo.valor || data.codigo.CIP;
  }

  // Crear estructura normalizada
  const normalizedProfile = {
    IDUsuario: data.IDUsuario || data.id || (currentUser ? currentUser.IDUsuario : null),
    CodigoCIP: cipValue || data.CIP || data.codigo || 'No disponible',
    Nombres: data.Nombres || data.nombres || data.name || data.nombre || 'No disponible',
    Apellidos: data.Apellidos || data.apellidos || data.lastname || data.apellido || 'No disponible',
    Grado: data.Grado || data.grado || data.grade || 'No disponible',
    IDRol: data.IDRol || (rolObject && rolObject.IDRol) || data.rolId || null,
    IDArea: data.IDArea || (areaObject && areaObject.IDArea) || data.areaId || null,
    UltimoAcceso: data.UltimoAcceso || data.ultimoAcceso || data.lastAccess || null,
    
    // Garantizar que siempre exista la estructura de rol
    rol: rolObject || {
      IDRol: data.IDRol || data.rolId || data.idRol || 1,
      NombreRol: data.NombreRol || data.nombreRol || data.rolNombre || 'No disponible'
    },
    
    // Garantizar que siempre exista la estructura de área
    area: areaObject || {
      IDArea: data.IDArea || data.areaId || data.idArea || 1,
      NombreArea: data.NombreArea || data.nombreArea || data.areaNombre || 'No asignada'
    }
  };
  
  logger.debug('📤 SALIDA - Perfil normalizado:', normalizedProfile);
  
  // Capturar resultado de normalización en el depurador
  if (window.OFICRI && window.OFICRI.profileDebugger) {
    try {
      const outputData = {
        timestamp: new Date(),
        normalizedProfile: JSON.parse(JSON.stringify(normalizedProfile)),
        originalData: JSON.parse(JSON.stringify(userData))
      };
      window.OFICRI._normalizerOutputs = window.OFICRI._normalizerOutputs || [];
      window.OFICRI._normalizerOutputs.push(outputData);
    } catch (e) {
      logger.warn('Error al capturar salida de normalización en depurador:', e);
    }
  }
  
  // Verificar que los campos críticos tengan valores
  const camposCriticos = ['CodigoCIP', 'Nombres', 'Apellidos', 'Grado', 'rol', 'area'];
  for (const campo of camposCriticos) {
    if (!normalizedProfile[campo]) {
      logger.warn(`⚠️ VALIDACIÓN - Campo crítico '${campo}' sin valor después de normalización`);
    } else if (typeof normalizedProfile[campo] === 'object' && Object.keys(normalizedProfile[campo]).length === 0) {
      logger.warn(`⚠️ VALIDACIÓN - Campo crítico '${campo}' es un objeto vacío después de normalización`);
    }
  }
  
  return normalizedProfile;
}

// Adjuntar al namespace global
window.OFICRI.userProfileNormalizer = { normalizeUserProfile }; 