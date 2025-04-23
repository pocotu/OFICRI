import { httpClient } from '@shared/src/services/api';
import { validateCIP } from '@shared/src/utils/validators/cipValidator.js';
import { auditService } from '@shared/src/services/security/auditTrail.js';
import { sessionControl } from '@shared/src/services/security/sessionControl.js';

/**
 * Servicio de autenticación extendido para el módulo auth
 */
export const authService = {
  /**
   * Validar formato de CIP (8 dígitos)
   * @param {string} codigoCIP - Código CIP a validar
   * @returns {boolean} - true si el formato es válido
   */
  validateCIP(codigoCIP) {
    return validateCIP(codigoCIP);
  },

  /**
   * Iniciar sesión en el sistema
   * @param {string} codigoCIP - Código CIP del usuario
   * @param {string} password - Contraseña del usuario
   * @returns {Promise<Object>} - Respuesta del servidor con token y datos del usuario
   */
  async login(cip, password) {
    try {
      // Validar CIP
      if (!this.validateCIP(cip)) {
        throw new Error('CIP inválido');
      }

      const response = await httpClient.post('/auth/login', {
        codigoCIP: cip,
        password
      });

      // Guardar tokens y datos de usuario
      sessionControl.setTokens(response.data.token, response.data.refreshToken);
      sessionControl.setUserData(response.data.user);

      await auditService.logLoginSuccess(cip, response.data.user);
      return response.data;
    } catch (error) {
      await auditService.logLoginFailure(cip, error.message);
      throw error;
    }
  },
  
  /**
   * Cerrar sesión en el sistema
   * @returns {Promise<Object>} - Respuesta del servidor
   */
  async logout() {
    try {
      const token = sessionControl.getToken();
      const refreshToken = sessionControl.getRefreshToken();
      const user = sessionControl.getUserData();

      if (token) {
        await httpClient.post('/auth/logout', {
          refreshToken
        }, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
      }

      // Limpiar sesión local
      sessionControl.clearSession();

      await auditService.logLogout(user?.CodigoCIP || 'desconocido');
    } catch (error) {
      const user = sessionControl.getUserData();
      await auditService.logEvent(auditService.AUDIT_EVENT_TYPES.LOGOUT, `Error al cerrar sesión: ${error.message}`, auditService.AUDIT_SEVERITY.ERROR, { codigoCIP: user?.CodigoCIP || 'desconocido' });
      // Aún así limpiamos la sesión local
      sessionControl.clearSession();
      throw error;
    }
  },
  
  /**
   * Verificar si el token actual es válido
   * @returns {Promise<Object>} - Respuesta del servidor con datos del usuario
   */
  async verifySession() {
    try {
      const token = sessionControl.getToken();
      if (!token) {
        throw new Error('No hay sesión activa');
      }

      const response = await httpClient.get('/auth/verify-session', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      // Actualizar datos de usuario si es necesario
      if (response.data.user) {
        sessionControl.setUserData(response.data.user);
      }

      return response.data;
    } catch (error) {
      const user = sessionControl.getUserData();
      await auditService.logEvent(auditService.AUDIT_EVENT_TYPES.SECURITY_VIOLATION, `Error verificando sesión: ${error.message}`, auditService.AUDIT_SEVERITY.WARNING, { codigoCIP: user?.CodigoCIP || 'desconocido' });
      throw error;
    }
  },
  
  /**
   * Refrescar token de autenticación
   * @returns {Promise<Object>} - Respuesta del servidor con nuevo token
   */
  async refreshToken() {
    try {
      const refreshToken = sessionControl.getRefreshToken();
      if (!refreshToken) {
        throw new Error('No hay token de refresco disponible');
      }

      const response = await httpClient.post('/auth/refresh', {
        refreshToken
      });

      // Actualizar tokens
      sessionControl.setTokens(response.data.token, response.data.refreshToken);

      const user = sessionControl.getUserData();
      await auditService.logEvent(auditService.AUDIT_EVENT_TYPES.TOKEN_REFRESH, 'Token renovado exitosamente', auditService.AUDIT_SEVERITY.INFO, { codigoCIP: user?.CodigoCIP || 'desconocido' });
      return response.data;
    } catch (error) {
      const user = sessionControl.getUserData();
      await auditService.logEvent(auditService.AUDIT_EVENT_TYPES.TOKEN_REFRESH, `Error al renovar token: ${error.message}`, auditService.AUDIT_SEVERITY.ERROR, { codigoCIP: user?.CodigoCIP || 'desconocido' });
      throw error;
    }
  },
  
  /**
   * Obtener el token almacenado
   * @returns {string|null} - Token de acceso o null si no existe
   */
  getStoredToken() {
    return sessionControl.getToken();
  },
  
  /**
   * Obtener los datos del usuario almacenados
   * @returns {Object|null} - Datos del usuario o null si no existen
   */
  getStoredUser() {
    return sessionControl.getUserData();
  },

  // Recuperar sesión
  async recoverSession() {
    try {
      const refreshToken = sessionControl.getRefreshToken();
      if (!refreshToken) {
        throw new Error('No hay token de refresco disponible');
      }

      const response = await httpClient.post('/auth/recover-session', {
        refreshToken
      });

      // Restaurar sesión
      sessionControl.setTokens(response.data.token, response.data.refreshToken);
      sessionControl.setUserData(response.data.user);

      await auditService.logEvent(auditService.AUDIT_EVENT_TYPES.SESSION_RECOVER, 'Sesión recuperada exitosamente', auditService.AUDIT_SEVERITY.INFO, { codigoCIP: response.data.user?.CodigoCIP || 'desconocido' });
      return response.data;
    } catch (error) {
      const user = sessionControl.getUserData();
      await auditService.logEvent(auditService.AUDIT_EVENT_TYPES.SESSION_RECOVER, `Error al recuperar sesión: ${error.message}`, auditService.AUDIT_SEVERITY.ERROR, { codigoCIP: user?.CodigoCIP || 'desconocido' });
      sessionControl.clearSession();
      throw error;
    }
  }
} 