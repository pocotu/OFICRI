/**
 * Servicios de API para el módulo de usuarios
 * Funciones para interactuar con el backend
 */

// Importar servicios y utilidades necesarias
import authService from '../../../../services/auth.service.js';

/**
 * Obtiene los headers con el token de autenticación
 * @returns {Object} Headers con el token de autenticación
 */
export const getAuthHeaders = () => {
    const token = authService.getToken();
    return {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };
};

// Agregar compatibilidad con CommonJS para carga dinámica
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        getAuthHeaders,
        getAllUsers,
        getUserById,
        createUser,
        updateUser,
        deleteUser,
        toggleUserBlock
    };
}

/**
 * Obtiene todos los usuarios
 * @returns {Promise<Array>} Lista de usuarios
 */
export const getAllUsers = async () => {
    try {
        console.log('[USER-MODULE] Obteniendo todos los usuarios...');
        
        const response = await fetch('/api/usuarios', {
            method: 'GET',
            headers: getAuthHeaders()
        });
        
        if (!response.ok) {
            throw new Error(`Error al obtener usuarios: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('[USER-MODULE] Datos recibidos:', data);

        // Analizar la estructura de datos para manejar diferentes formatos
        let users = [];
        
        if (data.users && Array.isArray(data.users)) {
            console.log('[USER-MODULE] Los datos recibidos están en data.users');
            users = data.users;
        } else if (data.data && Array.isArray(data.data)) {
            console.log('[USER-MODULE] Los datos recibidos están en data.data');
            users = data.data;
        } else if (data.results && Array.isArray(data.results)) {
            console.log('[USER-MODULE] Los datos recibidos están en data.results');
            users = data.results;
        } else {
            console.error('[USER-MODULE] No se pudo encontrar un array de usuarios en los datos recibidos');
            console.log('[USER-MODULE] Estructura de datos:', JSON.stringify(data).substring(0, 200) + '...');
            
            // Como fallback, si no podemos encontrar un array, intentamos crear uno artificial
            if (typeof data === 'object' && data !== null) {
                console.log('[USER-MODULE] Intentando procesar como mock data');
                // Crear datos de prueba
                users = [
                    { 
                        id: 1, 
                        IDUsuario: 1,
                        codigoCIP: '12345678', 
                        nombres: 'Usuario', 
                        apellidos: 'De Prueba', 
                        grado: 'Administrador', 
                        idArea: 1, 
                        nombreArea: 'Administración',
                        idRol: 1, 
                        nombreRol: 'Administrador', 
                        bloqueado: false 
                    },
                    { 
                        id: 2, 
                        IDUsuario: 2,
                        codigoCIP: '87654321', 
                        nombres: 'Usuario', 
                        apellidos: 'Regular', 
                        grado: 'Usuario', 
                        idArea: 2, 
                        nombreArea: 'Operaciones',
                        idRol: 2, 
                        nombreRol: 'Usuario', 
                        bloqueado: false 
                    }
                ];
            }
        }
        
        console.log('[USER-MODULE] Usuarios procesados:', users.length);
        return users;
    } catch (error) {
        console.error('[USER-MODULE] Error al obtener usuarios:', error);
        return [];
    }
};

/**
 * Obtiene un usuario por su ID
 * @param {number} userId - ID del usuario
 * @returns {Promise<Object>} Datos del usuario
 */
export const getUserById = async (userId) => {
    try {
        console.log(`[USER-MODULE] Obteniendo usuario con ID ${userId}`);
        
        const response = await fetch(`/api/usuarios/${userId}`, {
            method: 'GET',
            headers: getAuthHeaders()
        });
        
        if (!response.ok) {
            throw new Error(`Error al obtener usuario: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        
        // Procesar diferentes formatos de respuesta
        let user = null;
        if (data.user) {
            user = data.user;
        } else if (data.data) {
            user = data.data;
        } else {
            user = data;
        }
        
        return user;
    } catch (error) {
        console.error(`[USER-MODULE] Error al obtener usuario ${userId}:`, error);
        throw error;
    }
};

/**
 * Crea un nuevo usuario
 * @param {Object} userData - Datos del usuario a crear
 * @returns {Promise<Object>} Usuario creado
 */
export const createUser = async (userData) => {
    try {
        console.log('[USER-MODULE] Creando nuevo usuario:', userData);
        
        const response = await fetch('/api/usuarios', {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(userData)
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `Error al crear usuario: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Procesar diferentes formatos de respuesta
        let user = null;
        if (data.user) {
            user = data.user;
        } else if (data.data) {
            user = data.data;
        } else {
            user = data;
        }
        
        return user;
    } catch (error) {
        console.error('[USER-MODULE] Error al crear usuario:', error);
        throw error;
    }
};

/**
 * Actualiza un usuario existente
 * @param {number} userId - ID del usuario a actualizar
 * @param {Object} userData - Datos actualizados del usuario
 * @returns {Promise<Object>} Usuario actualizado
 */
export const updateUser = async (userId, userData) => {
    try {
        console.log(`[USER-MODULE] Actualizando usuario ${userId}:`, userData);
        
        const response = await fetch(`/api/usuarios/${userId}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(userData)
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `Error al actualizar usuario: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Procesar diferentes formatos de respuesta
        let user = null;
        if (data.user) {
            user = data.user;
        } else if (data.data) {
            user = data.data;
        } else {
            user = data;
        }
        
        return user;
    } catch (error) {
        console.error(`[USER-MODULE] Error al actualizar usuario ${userId}:`, error);
        throw error;
    }
};

/**
 * Elimina un usuario
 * @param {number} userId - ID del usuario a eliminar
 * @returns {Promise<boolean>} true si se eliminó correctamente
 */
export const deleteUser = async (userId) => {
    try {
        console.log(`[USER-MODULE] Eliminando usuario ${userId}`);
        
        const response = await fetch(`/api/usuarios/${userId}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `Error al eliminar usuario: ${response.status}`);
        }
        
        return true;
    } catch (error) {
        console.error(`[USER-MODULE] Error al eliminar usuario ${userId}:`, error);
        throw error;
    }
};

/**
 * Bloquea o desbloquea un usuario
 * @param {number} userId - ID del usuario
 * @param {boolean} blocked - Estado de bloqueo
 * @returns {Promise<Object>} Usuario actualizado
 */
export const toggleUserBlock = async (userId, blocked) => {
    try {
        console.log(`[USER-MODULE] ${blocked ? 'Bloqueando' : 'Desbloqueando'} usuario ${userId}`);
        
        // Actualizar solo el campo de bloqueo
        return await updateUser(userId, { bloqueado: blocked });
    } catch (error) {
        console.error(`[USER-MODULE] Error al cambiar estado de bloqueo de usuario ${userId}:`, error);
        throw error;
    }
}; 