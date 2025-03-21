/**
 * Cliente API para el frontend OFICRI
 * 
 * Este archivo muestra cómo consumir la API desde el frontend
 * Puede ser utilizado como referencia para la integración
 */

/**
 * Cliente API con funciones para interactuar con el backend
 */
class ApiClient {
  /**
   * Constructor
   * @param {string} baseUrl - URL base de la API
   */
  constructor(baseUrl = '/api') {
    this.baseUrl = baseUrl;
    this.token = localStorage.getItem('token');
  }

  /**
   * Obtener headers para las peticiones
   * @returns {Object} - Headers para fetch
   */
  getHeaders() {
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-API-Version': 'v1'
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    return headers;
  }

  /**
   * Realizar solicitud HTTP
   * @param {string} endpoint - Endpoint de la API
   * @param {string} method - Método HTTP
   * @param {Object} data - Datos para enviar (opcional)
   * @returns {Promise} - Promesa con la respuesta
   */
  async request(endpoint, method = 'GET', data = null) {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = this.getHeaders();
    
    const options = {
      method,
      headers,
      credentials: 'include' // Incluir cookies
    };

    if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      options.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(url, options);
      
      // Si la respuesta no es JSON, lanzar error
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Respuesta no es JSON');
      }

      const result = await response.json();

      // Si hay error de autenticación, limpiar token
      if (response.status === 401) {
        this.clearToken();
        // Opcional: redirigir a login
        // window.location.href = '/login';
      }

      // Si hay error, agregar código de estado
      if (!response.ok) {
        result.statusCode = response.status;
        throw result;
      }

      return result;
    } catch (error) {
      console.error('Error en solicitud API:', error);
      throw error;
    }
  }

  /**
   * Iniciar sesión
   * @param {string} username - Nombre de usuario
   * @param {string} password - Contraseña
   * @returns {Promise} - Promesa con datos de usuario y token
   */
  async login(username, password) {
    const response = await this.request('/auth/login', 'POST', { username, password });
    
    if (response.success && response.data.tokens.accessToken) {
      this.token = response.data.tokens.accessToken;
      localStorage.setItem('token', this.token);
      localStorage.setItem('refreshToken', response.data.tokens.refreshToken);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    
    return response;
  }

  /**
   * Cerrar sesión
   * @returns {Promise} - Promesa con resultado
   */
  async logout() {
    try {
      await this.request('/auth/logout', 'POST');
    } finally {
      this.clearToken();
    }
  }

  /**
   * Limpiar token y datos de sesión
   */
  clearToken() {
    this.token = null;
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  }

  /**
   * Refrescar token
   * @returns {Promise} - Promesa con nuevo token
   */
  async refreshToken() {
    const refreshToken = localStorage.getItem('refreshToken');
    
    if (!refreshToken) {
      throw new Error('No hay refresh token');
    }
    
    const response = await this.request('/auth/refresh-token', 'POST', { refreshToken });
    
    if (response.success && response.data.accessToken) {
      this.token = response.data.accessToken;
      localStorage.setItem('token', this.token);
    }
    
    return response;
  }

  /**
   * Verificar si el usuario está autenticado
   * @returns {Promise} - Promesa con datos de usuario
   */
  async checkAuth() {
    return this.request('/auth/check', 'GET');
  }

  /**
   * Obtener lista de usuarios
   * @param {Object} params - Parámetros de búsqueda
   * @returns {Promise} - Promesa con lista de usuarios
   */
  async getUsers(params = {}) {
    // Convertir parámetros a string query
    const queryParams = new URLSearchParams(params).toString();
    const endpoint = queryParams ? `/users?${queryParams}` : '/users';
    
    return this.request(endpoint, 'GET');
  }

  /**
   * Obtener lista de documentos
   * @param {Object} params - Parámetros de búsqueda
   * @returns {Promise} - Promesa con lista de documentos
   */
  async getDocuments(params = {}) {
    // Convertir parámetros a string query
    const queryParams = new URLSearchParams(params).toString();
    const endpoint = queryParams ? `/documents?${queryParams}` : '/documents';
    
    return this.request(endpoint, 'GET');
  }

  /**
   * Crear documento
   * @param {Object} documentData - Datos del documento
   * @returns {Promise} - Promesa con resultado
   */
  async createDocument(documentData) {
    return this.request('/documents', 'POST', documentData);
  }
}

// Exportar singleton
const apiClient = new ApiClient();
export default apiClient;

/**
 * Ejemplo de uso:
 *
 * import apiClient from './api-client';
 * 
 * // Login
 * try {
 *   const response = await apiClient.login('admin', 'Admin123!');
 *   console.log('Usuario logueado:', response.data.user);
 * } catch (error) {
 *   console.error('Error de login:', error.message);
 * }
 * 
 * // Obtener documentos
 * try {
 *   const response = await apiClient.getDocuments({ limit: 10, page: 1 });
 *   console.log('Documentos:', response.data.documents);
 * } catch (error) {
 *   console.error('Error al obtener documentos:', error.message);
 * }
 */ 