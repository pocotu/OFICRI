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
        this.logResponseInfo(response);
        
        // Obtener texto y datos parseados de la respuesta
        const { text, data } = await this.parseResponseText(response);
        
        // Procesar respuesta de login si es necesario
        if (response.url.includes('/auth/login') && response.ok) {
            return this.processLoginResponse(data);
        }
        
        return data;
    }
    
    /**
     * Registra información básica de la respuesta
     * @param {Response} response - Respuesta de fetch
     */
    logResponseInfo(response) {
        errorHandler.log('API', `Respuesta recibida: ${response.status} ${response.statusText}`, {
            url: response.url,
            ok: response.ok,
            contentType: response.headers.get('Content-Type')
        }, errorHandler.LOG_LEVEL.DEBUG);
    }
    
    /**
     * Parsea el texto de la respuesta a un objeto de datos
     * @param {Response} response - Respuesta de fetch
     * @returns {Promise<Object>} - Texto original y datos parseados
     */
    async parseResponseText(response) {
        // Obtener texto de la respuesta
        const text = await response.text();
        
        // Log de respuesta en formato texto (limitado para evitar logs enormes)
        this.logResponseText(text);
        
        // Intentar parsear como JSON
        const data = this.parseJsonData(text, response);
        
        return { text, data };
    }
    
    /**
     * Registra un extracto del texto de respuesta
     * @param {string} text - Texto de la respuesta
     */
    logResponseText(text) {
        const previewLength = Math.min(text.length, 150);
        errorHandler.log(
            'API', 
            `Respuesta en texto: ${text.substring(0, previewLength)}${text.length > previewLength ? '...' : ''}`, 
            null, 
            errorHandler.LOG_LEVEL.DEBUG
        );
    }
    
    /**
     * Parsea el texto como JSON
     * @param {string} text - Texto a parsear
     * @param {Response} response - Respuesta original
     * @returns {Object} - Datos parseados
     */
    parseJsonData(text, response) {
        let data;
        try {
            data = text ? JSON.parse(text) : {};
            errorHandler.log('API', 'Respuesta parseada como JSON correctamente', { keys: Object.keys(data) }, errorHandler.LOG_LEVEL.DEBUG);
        } catch (e) {
            return this.handleParseError(e, text, response);
        }
        return data;
    }
    
    /**
     * Maneja errores al parsear JSON
     * @param {Error} error - Error de parsing
     * @param {string} text - Texto original
     * @param {Response} response - Respuesta original
     * @returns {Object} - Objeto de respuesta alternativo
     */
    handleParseError(error, text, response) {
        errorHandler.log('API', 'Error al parsear JSON', { error: error.message, text: text.substring(0, 100) }, errorHandler.LOG_LEVEL.WARN);
        
        // Si no es JSON y la respuesta es exitosa, devolver un objeto simple
        if (response.ok) {
            return { success: true, message: text };
        }
        throw new Error(`Respuesta no válida: ${text.substring(0, 100)}`);
    }
    
    /**
     * Procesa específicamente las respuestas de login
     * @param {Object} data - Datos de la respuesta
     * @returns {Object} - Datos de login estandarizados
     */
    processLoginResponse(data) {
        errorHandler.log('API', 'Procesando respuesta de login', { dataKeys: Object.keys(data) }, errorHandler.LOG_LEVEL.DEBUG);
        
        // Si ya tiene el formato esperado, devolver directamente
        if (data.token && data.user) {
            return data;
        }
        
        return this.standardizeLoginResponse(data);
    }
    
    /**
     * Estandariza el formato de respuesta de login
     * @param {Object} data - Datos originales
     * @returns {Object} - Datos estandarizados
     */
    standardizeLoginResponse(data) {
        errorHandler.log('API', 'Formato de respuesta incompleto, adaptando estructura', null, errorHandler.LOG_LEVEL.INFO);
        
        // Diversos casos de formato que podemos encontrar
        const { token, user } = this.extractLoginData(data);
        
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
        
        // Mantener estructura original si no podemos adaptarla
        return data;
    }
    
    /**
     * Extrae token y datos de usuario de diferentes estructuras de respuesta
     * @param {Object} data - Datos originales
     * @returns {Object} - Token y usuario extraídos
     */
    extractLoginData(data) {
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
        
        return { token, user };
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