// Control de sesiones

const TOKEN_KEY = 'token';
const REFRESH_TOKEN_KEY = 'refreshToken';
const USER_DATA_KEY = 'user';

export const sessionControl = {
  /**
   * Guarda los tokens en localStorage.
   * @param {string} token - Token de acceso.
   * @param {string} refreshToken - Token de refresco.
   */
  setTokens(token, refreshToken) {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    }
    if (refreshToken) {
      localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    }
  },

  /**
   * Guarda los datos del usuario en localStorage.
   * @param {object} userData - Datos del usuario.
   */
  setUserData(userData) {
    if (userData) {
      localStorage.setItem(USER_DATA_KEY, JSON.stringify(userData));
    }
  },

  /**
   * Obtiene el token de acceso de localStorage.
   * @returns {string|null} - El token o null.
   */
  getToken() {
    return localStorage.getItem(TOKEN_KEY);
  },

  /**
   * Obtiene el token de refresco de localStorage.
   * @returns {string|null} - El token de refresco o null.
   */
  getRefreshToken() {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  },

  /**
   * Obtiene los datos del usuario de localStorage.
   * @returns {object|null} - Los datos del usuario o null.
   */
  getUserData() {
    const userData = localStorage.getItem(USER_DATA_KEY);
    try {
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error al parsear datos de usuario desde localStorage:', error);
      this.clearSession(); // Limpiar si los datos están corruptos
      return null;
    }
  },

  /**
   * Limpia todos los datos de sesión de localStorage.
   */
  clearSession() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_DATA_KEY);
  }
};