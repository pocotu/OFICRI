import httpClient from '../api/httpClient'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

/**
 * Tipos de eventos de auditoría
 */
export const AUDIT_EVENT_TYPES = {
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILURE: 'LOGIN_FAILURE',
  LOGOUT: 'LOGOUT',
  USER_CREATE: 'USER_CREATE',
  USER_UPDATE: 'USER_UPDATE',
  USER_DELETE: 'USER_DELETE',
  USER_STATUS_CHANGE: 'USER_STATUS_CHANGE',
  PASSWORD_RESET: 'PASSWORD_RESET',
  PERMISSION_CHANGE: 'PERMISSION_CHANGE',
  UNAUTHORIZED_ACCESS: 'UNAUTHORIZED_ACCESS',
  SECURITY_VIOLATION: 'SECURITY_VIOLATION',
  DOCUMENT_CREATE: 'DOCUMENT_CREATE',
  DOCUMENT_UPDATE: 'DOCUMENT_UPDATE',
  DOCUMENT_DELETE: 'DOCUMENT_DELETE',
  DOCUMENT_DERIVE: 'DOCUMENT_DERIVE',
  MODULE_LOAD: 'MODULE_LOAD',
  MODULE_LOAD_SUCCESS: 'MODULE_LOAD_SUCCESS',
  MODULE_LOAD_ERROR: 'MODULE_LOAD_ERROR',
  ASSET_LOAD: 'ASSET_LOAD',
  ASSET_LOAD_SUCCESS: 'ASSET_LOAD_SUCCESS',
  ASSET_LOAD_ERROR: 'ASSET_LOAD_ERROR',
  CACHE_HIT: 'CACHE_HIT',
  CACHE_MISS: 'CACHE_MISS',
  CACHE_SET: 'CACHE_SET',
  BUNDLE_OPTIMIZATION: 'BUNDLE_OPTIMIZATION',
  TEST_RUN: 'TEST_RUN',
  PERFORMANCE_METRICS: 'PERFORMANCE_METRICS'
}

/**
 * Niveles de severidad para eventos de auditoría
 */
export const AUDIT_SEVERITY = {
  INFO: 'INFO',
  WARNING: 'WARNING',
  ERROR: 'ERROR',
  CRITICAL: 'CRITICAL'
}

/**
 * Servicio de auditoría para registrar eventos de seguridad
 */
export const auditService = {
  /**
   * Registrar un evento de auditoría
   * @param {string} eventType - Tipo de evento (de AUDIT_EVENT_TYPES)
   * @param {string} description - Descripción detallada del evento
   * @param {string} severity - Nivel de severidad (de AUDIT_SEVERITY)
   * @param {Object} metadata - Datos adicionales relacionados con el evento
   * @returns {Promise<Object>} - Respuesta del servidor
   */
  async logEvent(eventType, description, severity = AUDIT_SEVERITY.INFO, metadata = {}) {
    try {
      // COMENTADO TEMPORALMENTE: Endpoint /api/audit/log no existe o no responde (404)
      /* 
      const response = await httpClient.post(`${API_URL}/audit/log`, {
        eventType,
        description,
        severity,
        metadata,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        ipAddress: await this._getClientIP()
      });
      return response.data;
      */
     // Simular éxito temporalmente
     console.warn(`Log de auditoría omitido (endpoint 404): ${eventType} - ${description}`);
     return { success: true, message: "Log omitido" };
    } catch (error) {
      console.error('Error al registrar evento de auditoría:', error)
      // No lanzamos el error para evitar interrumpir el flujo principal
      return { success: false, error: error.message }
    }
  },

  /**
   * Registrar un intento de acceso no autorizado
   * @param {string} resource - Recurso al que se intentó acceder
   * @param {string} action - Acción intentada
   * @param {Object} userData - Datos del usuario que intentó el acceso
   * @returns {Promise<Object>} - Respuesta del servidor
   */
  async logUnauthorizedAccess(resource, action, userData = {}) {
    const description = `Intento de acceso no autorizado a ${resource} con acción ${action}`
    const metadata = {
      resource,
      action,
      userData
    }
    
    return this.logEvent(
      AUDIT_EVENT_TYPES.UNAUTHORIZED_ACCESS,
      description,
      AUDIT_SEVERITY.WARNING,
      metadata
    )
  },

  /**
   * Registrar una violación de seguridad
   * @param {string} description - Descripción de la violación
   * @param {Object} metadata - Datos adicionales sobre la violación
   * @returns {Promise<Object>} - Respuesta del servidor
   */
  async logSecurityViolation(description, metadata = {}) {
    return this.logEvent(
      AUDIT_EVENT_TYPES.SECURITY_VIOLATION,
      description,
      AUDIT_SEVERITY.CRITICAL,
      metadata
    )
  },

  /**
   * Registrar un intento fallido de inicio de sesión
   * @param {string} codigoCIP - Código CIP utilizado
   * @param {string} reason - Razón del fallo
   * @returns {Promise<Object>} - Respuesta del servidor
   */
  async logLoginFailure(codigoCIP, reason) {
    const description = `Intento fallido de inicio de sesión con CIP ${codigoCIP}: ${reason}`
    const metadata = {
      codigoCIP,
      reason
    }
    
    return this.logEvent(
      AUDIT_EVENT_TYPES.LOGIN_FAILURE,
      description,
      AUDIT_SEVERITY.WARNING,
      metadata
    )
  },

  /**
   * Registrar un inicio de sesión exitoso
   * @param {string} codigoCIP - Código CIP del usuario
   * @param {Object} userData - Datos del usuario
   * @returns {Promise<Object>} - Respuesta del servidor
   */
  async logLoginSuccess(codigoCIP, userData = {}) {
    const description = `Inicio de sesión exitoso con CIP ${codigoCIP}`
    const metadata = {
      codigoCIP,
      userData
    }
    
    return this.logEvent(
      AUDIT_EVENT_TYPES.LOGIN_SUCCESS,
      description,
      AUDIT_SEVERITY.INFO,
      metadata
    )
  },

  /**
   * Registrar un cierre de sesión
   * @param {string} codigoCIP - Código CIP del usuario
   * @returns {Promise<Object>} - Respuesta del servidor
   */
  async logLogout(codigoCIP) {
    const description = `Cierre de sesión del usuario con CIP ${codigoCIP}`
    const metadata = {
      codigoCIP
    }
    
    return this.logEvent(
      AUDIT_EVENT_TYPES.LOGOUT,
      description,
      AUDIT_SEVERITY.INFO,
      metadata
    )
  },

  /**
   * Registrar carga de módulo
   * @param {Object} moduleInfo - Información del módulo
   * @returns {Promise<Object>} - Respuesta del servidor
   */
  async logModuleLoad(moduleInfo) {
    const description = `Intento de carga del módulo ${moduleInfo.name}`
    return this.logEvent(
      AUDIT_EVENT_TYPES.MODULE_LOAD,
      description,
      AUDIT_SEVERITY.INFO,
      moduleInfo
    )
  },

  /**
   * Registrar carga exitosa de módulo
   * @param {Object} moduleInfo - Información del módulo
   * @returns {Promise<Object>} - Respuesta del servidor
   */
  async logModuleLoadSuccess(moduleInfo) {
    const description = `Carga exitosa del módulo ${moduleInfo.name}`
    return this.logEvent(
      AUDIT_EVENT_TYPES.MODULE_LOAD_SUCCESS,
      description,
      AUDIT_SEVERITY.INFO,
      moduleInfo
    )
  },

  /**
   * Registrar error de carga de módulo
   * @param {Object} moduleInfo - Información del módulo y error
   * @returns {Promise<Object>} - Respuesta del servidor
   */
  async logModuleLoadError(moduleInfo) {
    const description = `Error al cargar el módulo ${moduleInfo.name}: ${moduleInfo.error}`
    return this.logEvent(
      AUDIT_EVENT_TYPES.MODULE_LOAD_ERROR,
      description,
      AUDIT_SEVERITY.ERROR,
      moduleInfo
    )
  },

  /**
   * Registrar carga de asset
   * @param {Object} assetInfo - Información del asset
   * @returns {Promise<Object>} - Respuesta del servidor
   */
  async logAssetLoad(assetInfo) {
    const description = `Intento de carga del asset ${assetInfo.url}`
    return this.logEvent(
      AUDIT_EVENT_TYPES.ASSET_LOAD,
      description,
      AUDIT_SEVERITY.INFO,
      assetInfo
    )
  },

  /**
   * Registrar carga exitosa de asset
   * @param {Object} assetInfo - Información del asset
   * @returns {Promise<Object>} - Respuesta del servidor
   */
  async logAssetLoadSuccess(assetInfo) {
    const description = `Carga exitosa del asset ${assetInfo.url}`
    return this.logEvent(
      AUDIT_EVENT_TYPES.ASSET_LOAD_SUCCESS,
      description,
      AUDIT_SEVERITY.INFO,
      assetInfo
    )
  },

  /**
   * Registrar error de carga de asset
   * @param {Object} assetInfo - Información del asset y error
   * @returns {Promise<Object>} - Respuesta del servidor
   */
  async logAssetLoadError(assetInfo) {
    const description = `Error al cargar el asset ${assetInfo.url}: ${assetInfo.error}`
    return this.logEvent(
      AUDIT_EVENT_TYPES.ASSET_LOAD_ERROR,
      description,
      AUDIT_SEVERITY.ERROR,
      assetInfo
    )
  },

  /**
   * Registrar hit de caché
   * @param {Object} cacheInfo - Información del caché
   * @returns {Promise<Object>} - Respuesta del servidor
   */
  async logCacheHit(cacheInfo) {
    const description = `Cache hit para ${cacheInfo.endpoint}`
    return this.logEvent(
      AUDIT_EVENT_TYPES.CACHE_HIT,
      description,
      AUDIT_SEVERITY.INFO,
      cacheInfo
    )
  },

  /**
   * Registrar miss de caché
   * @param {Object} cacheInfo - Información del caché
   * @returns {Promise<Object>} - Respuesta del servidor
   */
  async logCacheMiss(cacheInfo) {
    const description = `Cache miss para ${cacheInfo.endpoint}`
    return this.logEvent(
      AUDIT_EVENT_TYPES.CACHE_MISS,
      description,
      AUDIT_SEVERITY.INFO,
      cacheInfo
    )
  },

  /**
   * Registrar actualización de caché
   * @param {Object} cacheInfo - Información del caché
   * @returns {Promise<Object>} - Respuesta del servidor
   */
  async logCacheSet(cacheInfo) {
    const description = `Cache set para ${cacheInfo.endpoint}`
    return this.logEvent(
      AUDIT_EVENT_TYPES.CACHE_SET,
      description,
      AUDIT_SEVERITY.INFO,
      cacheInfo
    )
  },

  /**
   * Registrar optimización de bundle
   * @param {Object} bundleInfo - Información del bundle
   * @returns {Promise<Object>} - Respuesta del servidor
   */
  async logBundleOptimization(bundleInfo) {
    const description = `Optimización de bundle usando estrategia ${bundleInfo.strategy}`
    return this.logEvent(
      AUDIT_EVENT_TYPES.BUNDLE_OPTIMIZATION,
      description,
      AUDIT_SEVERITY.INFO,
      bundleInfo
    )
  },

  /**
   * Registrar ejecución de pruebas
   * @param {Object} testInfo - Información de la prueba
   * @returns {Promise<Object>} - Respuesta del servidor
   */
  async logTestRun(testInfo) {
    const description = `Ejecución de prueba de tipo ${testInfo.type}`
    return this.logEvent(
      AUDIT_EVENT_TYPES.TEST_RUN,
      description,
      AUDIT_SEVERITY.INFO,
      testInfo
    )
  },

  /**
   * Registrar métricas de rendimiento
   * @param {Object} metricsInfo - Información de métricas
   * @returns {Promise<Object>} - Respuesta del servidor
   */
  async logPerformanceMetrics(metricsInfo) {
    const description = `Métricas de rendimiento para ${metricsInfo.type}`
    return this.logEvent(
      AUDIT_EVENT_TYPES.PERFORMANCE_METRICS,
      description,
      AUDIT_SEVERITY.INFO,
      metricsInfo
    )
  },

  /**
   * Obtener la IP del cliente (simulado)
   * @returns {Promise<string>} - IP del cliente
   * @private
   */
  async _getClientIP() {
    try {
      // En un entorno real, esto se obtendría del servidor
      // Aquí simulamos obteniendo la IP del cliente
      const response = await fetch('https://api.ipify.org?format=json')
      const data = await response.json()
      return data.ip
    } catch (error) {
      console.error('Error al obtener IP del cliente:', error)
      return 'unknown'
    }
  }
}

export default auditService