/**
 * Servicio de API centralizado
 * Proporciona métodos para realizar peticiones HTTP a la API
 * Centraliza el manejo de tokens de autenticación, cabeceras y errores
 */

import * as errorHandler from '../utils/errorHandler.js';

class ApiService {
    constructor() {
        this.baseUrl = '/api';
        this.defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            credentials: 'same-origin'
        };
    }

    /**
     * Obtiene las cabeceras para una petición autenticada
     * @returns {Object} - Cabeceras con token de autenticación
     */
    getAuthHeaders() {
        // Obtener el token del localStorage o sessionStorage directamente
        // para evitar la dependencia circular
        let token = null;
        try {
            token = localStorage.getItem('token') || sessionStorage.getItem('token');
        } catch (e) {
            errorHandler.log('API', 'Error al obtener token: ' + e.message, null, errorHandler.LOG_LEVEL.WARN);
        }
        
        return {
            ...this.defaultOptions.headers,
            'Authorization': token ? `Bearer ${token}` : ''
        };
    }

    /**
     * Realiza una petición GET
     * @param {string} endpoint - Endpoint de la API
     * @param {boolean} auth - Si se requiere autenticación
     * @returns {Promise<Object>} - Respuesta en formato JSON
     */
    async get(endpoint, auth = true) {
        try {
            const url = `${this.baseUrl}${endpoint}`;
            const options = {
                ...this.defaultOptions,
                method: 'GET',
                headers: auth ? this.getAuthHeaders() : this.defaultOptions.headers
            };

            errorHandler.log('API', `GET ${url}`, null, errorHandler.LOG_LEVEL.DEBUG);
            const response = await fetch(url, options);
            return this.handleResponse(response);
        } catch (error) {
            return this.handleError(error, `GET ${endpoint}`);
        }
    }

    /**
     * Realiza una petición POST
     * @param {string} endpoint - Endpoint de la API
     * @param {Object} data - Datos a enviar
     * @param {boolean} auth - Si se requiere autenticación
     * @returns {Promise<Object>} - Respuesta en formato JSON
     */
    async post(endpoint, data, auth = true) {
        try {
            const url = `${this.baseUrl}${endpoint}`;
            const options = {
                ...this.defaultOptions,
                method: 'POST',
                headers: auth ? this.getAuthHeaders() : this.defaultOptions.headers,
                body: JSON.stringify(data)
            };

            errorHandler.log('API', `POST ${url}`, { data }, errorHandler.LOG_LEVEL.DEBUG);
            const response = await fetch(url, options);
            return this.handleResponse(response);
        } catch (error) {
            return this.handleError(error, `POST ${endpoint}`);
        }
    }

    /**
     * Realiza una petición PUT
     * @param {string} endpoint - Endpoint de la API
     * @param {Object} data - Datos a enviar
     * @param {boolean} auth - Si se requiere autenticación
     * @returns {Promise<Object>} - Respuesta en formato JSON
     */
    async put(endpoint, data, auth = true) {
        try {
            const url = `${this.baseUrl}${endpoint}`;
            const options = {
                ...this.defaultOptions,
                method: 'PUT',
                headers: auth ? this.getAuthHeaders() : this.defaultOptions.headers,
                body: JSON.stringify(data)
            };

            errorHandler.log('API', `PUT ${url}`, { data }, errorHandler.LOG_LEVEL.DEBUG);
            const response = await fetch(url, options);
            return this.handleResponse(response);
        } catch (error) {
            return this.handleError(error, `PUT ${endpoint}`);
        }
    }

    /**
     * Realiza una petición DELETE
     * @param {string} endpoint - Endpoint de la API
     * @param {boolean} auth - Si se requiere autenticación
     * @returns {Promise<Object>} - Respuesta en formato JSON
     */
    async delete(endpoint, auth = true) {
        try {
            const url = `${this.baseUrl}${endpoint}`;
            const options = {
                ...this.defaultOptions,
                method: 'DELETE',
                headers: auth ? this.getAuthHeaders() : this.defaultOptions.headers
            };

            errorHandler.log('API', `DELETE ${url}`, null, errorHandler.LOG_LEVEL.DEBUG);
            const response = await fetch(url, options);
            return this.handleResponse(response);
        } catch (error) {
            return this.handleError(error, `DELETE ${endpoint}`);
        }
    }

    /**
     * Maneja la respuesta de la API
     * @param {Response} response - Respuesta de fetch
     * @returns {Promise<Object>} - Datos de la respuesta
     */
    async handleResponse(response) {
        // Agregar log con información de la respuesta
        errorHandler.log('API', `Respuesta recibida: ${response.status} ${response.statusText}`, {
            url: response.url,
            ok: response.ok,
            contentType: response.headers.get('Content-Type')
        }, errorHandler.LOG_LEVEL.DEBUG);
        
        // Obtener texto de la respuesta
        const text = await response.text();
        
        // Log de respuesta en formato texto (limitado para evitar logs enormes)
        const previewLength = Math.min(text.length, 150);
        errorHandler.log('API', `Respuesta en texto: ${text.substring(0, previewLength)}${text.length > previewLength ? '...' : ''}`, null, errorHandler.LOG_LEVEL.DEBUG);
        
        // Intentar parsear como JSON
        let data;
        try {
            data = text ? JSON.parse(text) : {};
            errorHandler.log('API', 'Respuesta parseada como JSON correctamente', { keys: Object.keys(data) }, errorHandler.LOG_LEVEL.DEBUG);
        } catch (e) {
            errorHandler.log('API', 'Error al parsear JSON', { error: e.message, text: text.substring(0, 100) }, errorHandler.LOG_LEVEL.WARN);
            
            // Si no es JSON y la respuesta es exitosa, devolver un objeto simple
            if (response.ok) {
                return { success: true, message: text };
            }
            throw new Error(`Respuesta no válida: ${text.substring(0, 100)}`);
        }
        
        // Si la respuesta es de un login, asegurarnos que tiene la estructura esperada
        if (response.url.includes('/auth/login') && response.ok) {
            errorHandler.log('API', 'Procesando respuesta de login', { dataKeys: Object.keys(data) }, errorHandler.LOG_LEVEL.DEBUG);
            
            // Si la respuesta es exitosa pero no tiene el formato exacto que espera el cliente, adaptarla
            if (!data.token || !data.user) {
                errorHandler.log('API', 'Formato de respuesta incompleto, adaptando estructura', null, errorHandler.LOG_LEVEL.INFO);
                
                // Diversos casos de formato que podemos encontrar
                let token = data.token;
                let user = data.user;
                
                // Caso 1: Datos anidados en data
                if (data.data) {
                    if (!token && data.data.token) token = data.data.token;
                    if (!user && data.data.user) user = data.data.user;
                }
                
                // Caso 2: Usuario en data directamente
                if (!user && data.data && typeof data.data === 'object' && data.data.IDUsuario) {
                    user = data.data;
                }
                
                // Caso 3: El objeto principal es el usuario y el token está en una propiedad
                if (!user && data.IDUsuario) {
                    user = data;
                    if (!token && data.token) token = data.token;
                }
                
                // Si encontramos token y usuario, crear estructura estandarizada
                if (token && user) {
                    errorHandler.log('API', 'Estructura adaptada exitosamente', {
                        tieneToken: !!token,
                        tieneUser: !!user
                    }, errorHandler.LOG_LEVEL.INFO);
                    
                    return {
                        success: true,
                        token: token,
                        user: user
                    };
                }
            }
        }
        
        // Si la respuesta no es exitosa, lanzar error
        if (!response.ok) {
            const errorMsg = data.message || `Error: ${response.status} ${response.statusText}`;
            errorHandler.log('API', 'Respuesta con error', { status: response.status, mensaje: errorMsg }, errorHandler.LOG_LEVEL.ERROR);
            
            const error = new Error(errorMsg);
            error.status = response.status;
            error.data = data;
            throw error;
        }
        
        // Asegurar que todas las respuestas tengan un campo success
        if (data && typeof data === 'object' && data.success === undefined) {
            data.success = true;
        }
        
        return data;
    }

    /**
     * Maneja errores de peticiones
     * @param {Error} error - Error ocurrido
     * @param {string} context - Contexto donde ocurrió el error
     * @returns {Promise<Object>} - Objeto con error
     */
    handleError(error, context) {
        errorHandler.handleError('API', error, context, false);
        
        // Si es un error de autenticación (401), redirigir al login
        if (error.status === 401) {
            // En lugar de usar authService directamente, usamos una función para redirigir
            this.redirectToLogin();
        }
        
        // Devolver un objeto estandarizado con el error
        return Promise.reject({
            success: false,
            error: error.message,
            status: error.status,
            data: error.data
        });
    }
    
    /**
     * Redirige al usuario a la página de login
     * Método auxiliar para evitar la dependencia circular con authService
     */
    redirectToLogin() {
        try {
            // Limpiar almacenamiento
            try {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                sessionStorage.removeItem('token');
                sessionStorage.removeItem('user');
            } catch (e) {
                errorHandler.log('API', 'Error al limpiar almacenamiento: ' + e.message, null, errorHandler.LOG_LEVEL.WARN);
            }
            
            // Redirigir a la página de login
            window.location.replace('/index.html');
        } catch (e) {
            errorHandler.log('API', 'Error al redirigir: ' + e.message, null, errorHandler.LOG_LEVEL.ERROR);
        }
    }
}

// Exportar una única instancia del servicio
const apiService = new ApiService();
export default apiService; 