import { logOperation } from './auditTrail';

// Claves para almacenamiento local
const TOKEN_KEY = 'oficri_token';
const REFRESH_TOKEN_KEY = 'oficri_refresh_token';
const USER_DATA_KEY = 'oficri_user_data';
const SESSION_START_KEY = 'oficri_session_start';
const LAST_ACTIVITY_KEY = 'oficri_last_activity';

// Tiempos en milisegundos
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutos
const INACTIVITY_TIMEOUT = 15 * 60 * 1000; // 15 minutos

class SessionControl {
  constructor() {
    this._setupActivityListeners();
    this._checkSessionTimeout();
  }

  // Configurar listeners de actividad
  _setupActivityListeners() {
    ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'].forEach(event => {
      document.addEventListener(event, () => this._updateLastActivity());
    });
  }

  // Actualizar última actividad
  _updateLastActivity() {
    localStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());
  }

  // Verificar timeout de sesión
  _checkSessionTimeout() {
    setInterval(() => {
      const sessionStart = parseInt(localStorage.getItem(SESSION_START_KEY) || '0');
      const lastActivity = parseInt(localStorage.getItem(LAST_ACTIVITY_KEY) || '0');
      const now = Date.now();

      // Verificar timeout de sesión total
      if (sessionStart && (now - sessionStart) > SESSION_TIMEOUT) {
        this.clearSession();
        logOperation('SESSION_TIMEOUT', 'INFO', 'Sesión expirada por timeout total');
        return;
      }

      // Verificar timeout por inactividad
      if (lastActivity && (now - lastActivity) > INACTIVITY_TIMEOUT) {
        this.clearSession();
        logOperation('SESSION_TIMEOUT', 'INFO', 'Sesión expirada por inactividad');
        return;
      }
    }, 60000); // Verificar cada minuto
  }

  // Guardar tokens
  setTokens(token, refreshToken) {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    localStorage.setItem(SESSION_START_KEY, Date.now().toString());
    this._updateLastActivity();
  }

  // Obtener token de acceso
  getToken() {
    return localStorage.getItem(TOKEN_KEY);
  }

  // Obtener token de refresco
  getRefreshToken() {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  }

  // Guardar datos de usuario
  setUserData(userData) {
    localStorage.setItem(USER_DATA_KEY, JSON.stringify(userData));
  }

  // Obtener datos de usuario
  getUserData() {
    const userData = localStorage.getItem(USER_DATA_KEY);
    return userData ? JSON.parse(userData) : null;
  }

  // Verificar si hay sesión activa
  isSessionActive() {
    return !!this.getToken() && !!this.getUserData();
  }

  // Limpiar sesión
  clearSession() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_DATA_KEY);
    localStorage.removeItem(SESSION_START_KEY);
    localStorage.removeItem(LAST_ACTIVITY_KEY);
  }

  // Obtener tiempo restante de sesión
  getRemainingSessionTime() {
    const sessionStart = parseInt(localStorage.getItem(SESSION_START_KEY) || '0');
    if (!sessionStart) return 0;

    const now = Date.now();
    const elapsed = now - sessionStart;
    return Math.max(0, SESSION_TIMEOUT - elapsed);
  }

  // Obtener tiempo restante de inactividad
  getRemainingInactivityTime() {
    const lastActivity = parseInt(localStorage.getItem(LAST_ACTIVITY_KEY) || '0');
    if (!lastActivity) return 0;

    const now = Date.now();
    const elapsed = now - lastActivity;
    return Math.max(0, INACTIVITY_TIMEOUT - elapsed);
  }
}

// Exportar instancia única
export const sessionControl = new SessionControl(); 