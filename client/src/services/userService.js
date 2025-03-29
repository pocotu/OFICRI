/**
 * OFICRI User Service
 * Servicio para gestión de usuarios en el sistema OFICRI
 * Específico para personal de la Policía Nacional
 * Implementado siguiendo ISO/IEC 27001:2013
 */

// Importar módulos
import { apiClient } from '../api/apiClient.js';
import { authService } from './authService.js';

// User Service Module
const userService = (function() {
  'use strict';
  
  /**
   * Obtiene todos los usuarios policiales registrados en el sistema
   * @param {Object} [options] - Opciones de filtrado y paginación
   * @returns {Promise<Array>} Promesa que resuelve con la lista de usuarios
   */
  const getAllUsers = async function(options = {}) {
    try {
      // Construir parámetros de consulta
      let queryParams = '';
      
      if (options.page) {
        queryParams += `page=${options.page}&`;
      }
      
      if (options.limit) {
        queryParams += `limit=${options.limit}&`;
      }
      
      if (options.sort) {
        queryParams += `sort=${options.sort}&`;
      }
      
      if (options.filter) {
        const filterKeys = Object.keys(options.filter);
        
        filterKeys.forEach(key => {
          queryParams += `${key}=${options.filter[key]}&`;
        });
      }
      
      // Eliminar último & si existe
      if (queryParams.endsWith('&')) {
        queryParams = queryParams.slice(0, -1);
      }
      
      // Agregar ? al inicio si hay parámetros
      if (queryParams) {
        queryParams = '?' + queryParams;
      }
      
      // Realizar petición
      const response = await apiClient.get(`/users${queryParams}`);
      
      // Verificar respuesta
      if (!response || !response.data) {
        throw new Error('Respuesta inválida al obtener usuarios');
      }
      
      return response.data;
    } catch (error) {
      console.error('[USER] Error al obtener usuarios:', error.message);
      throw error;
    }
  };
  
  /**
   * Obtiene un usuario policial por su ID
   * @param {number} userId - ID del usuario a obtener
   * @returns {Promise<Object>} Promesa que resuelve con los datos del usuario
   */
  const getUserById = async function(userId) {
    try {
      // Validar ID
      if (!userId) {
        throw new Error('ID de usuario inválido');
      }
      
      // Realizar petición
      const response = await apiClient.get(`/users/${userId}`);
      
      // Verificar respuesta
      if (!response || !response.data) {
        throw new Error('Respuesta inválida al obtener usuario');
      }
      
      return response.data;
    } catch (error) {
      console.error(`[USER] Error al obtener usuario con ID ${userId}:`, error.message);
      throw error;
    }
  };
  
  /**
   * Obtiene un usuario policial por su código CIP
   * @param {string} codigoCIP - Código de Identificación Policial
   * @returns {Promise<Object>} Promesa que resuelve con los datos del usuario
   */
  const getUserByCIP = async function(codigoCIP) {
    try {
      // Validar código CIP
      if (!codigoCIP) {
        throw new Error('Código CIP inválido');
      }
      
      // Realizar petición
      const response = await apiClient.get(`/users/cip/${codigoCIP}`);
      
      // Verificar respuesta
      if (!response || !response.data) {
        throw new Error('Respuesta inválida al obtener usuario por CIP');
      }
      
      return response.data;
    } catch (error) {
      console.error(`[USER] Error al obtener usuario con CIP ${codigoCIP}:`, error.message);
      throw error;
    }
  };
  
  /**
   * Crea un nuevo usuario policial en el sistema
   * Restringido a administradores del sistema (ADMIN_SISTEMA)
   * @param {Object} userData - Datos del nuevo usuario
   * @returns {Promise<Object>} Promesa que resuelve con los datos del usuario creado
   */
  const createUser = async function(userData) {
    // Verificar si el usuario actual tiene permisos de administrador
    if (!authService.isAdmin()) {
      throw new Error('Solo usuarios con rol de Administrador pueden crear nuevos usuarios');
    }
    
    try {
      // Validar datos mínimos requeridos
      if (!userData || !userData.codigoCIP || !userData.nombre || !userData.apellidos || !userData.IDRol) {
        throw new Error('Datos de usuario incompletos. Se requiere codigoCIP, nombre, apellidos e IDRol');
      }
      
      // Verificar formato de Código CIP (específico para la Policía Nacional)
      if (!/^\d{1,8}$/.test(userData.codigoCIP)) {
        throw new Error('Formato de Código CIP inválido. Debe ser numérico y tener máximo 8 dígitos');
      }
      
      // Realizar petición
      const response = await apiClient.post('/users', userData);
      
      // Verificar respuesta
      if (!response || !response.data) {
        throw new Error('Respuesta inválida al crear usuario');
      }
      
      return response.data;
    } catch (error) {
      console.error('[USER] Error al crear usuario:', error.message);
      throw error;
    }
  };
  
  /**
   * Actualiza los datos de un usuario policial
   * @param {number} userId - ID del usuario a actualizar
   * @param {Object} userData - Nuevos datos del usuario
   * @returns {Promise<Object>} Promesa que resuelve con los datos actualizados
   */
  const updateUser = async function(userId, userData) {
    try {
      // Validar ID y datos
      if (!userId || !userData) {
        throw new Error('ID de usuario o datos inválidos');
      }
      
      // Verificar si está intentando cambiar el rol o permisos
      const currentUser = authService.getUser();
      const isChangingRoleOrPermissions = 
        userData.IDRol !== undefined || 
        userData.Permisos !== undefined;
      
      // Solo administradores pueden cambiar roles o permisos
      if (isChangingRoleOrPermissions && !authService.isAdmin()) {
        throw new Error('Solo administradores pueden modificar roles o permisos');
      }
      
      // Solo el mismo usuario o un administrador pueden modificar el perfil
      const isSelfUpdate = currentUser && currentUser.IDUsuario === userId;
      if (!isSelfUpdate && !authService.isAdmin()) {
        throw new Error('No tiene permisos para modificar este usuario');
      }
      
      // Realizar petición
      const response = await apiClient.put(`/users/${userId}`, userData);
      
      // Verificar respuesta
      if (!response || !response.data) {
        throw new Error('Respuesta inválida al actualizar usuario');
      }
      
      // Si el usuario actualizó su propio perfil, actualizar en el authService
      if (isSelfUpdate) {
        // Obtener datos actualizados
        const updatedUser = await getUserById(userId);
        
        // Actualizar localmente
        // Esto es una solución temporal, idealmente el authService debería tener un método para esto
        localStorage.setItem('oficri_user', JSON.stringify(updatedUser));
      }
      
      return response.data;
    } catch (error) {
      console.error(`[USER] Error al actualizar usuario con ID ${userId}:`, error.message);
      throw error;
    }
  };
  
  /**
   * Desactiva un usuario policial en el sistema
   * Restringido a administradores del sistema (ADMIN_SISTEMA)
   * @param {number} userId - ID del usuario a desactivar
   * @returns {Promise<Object>} Promesa que resuelve con la respuesta del servidor
   */
  const deactivateUser = async function(userId) {
    // Verificar si el usuario actual tiene permisos de administrador
    if (!authService.isAdmin()) {
      throw new Error('Solo usuarios con rol de Administrador pueden desactivar usuarios');
    }
    
    try {
      // Validar ID
      if (!userId) {
        throw new Error('ID de usuario inválido');
      }
      
      // No permitir desactivar al propio usuario
      const currentUser = authService.getUser();
      if (currentUser && currentUser.IDUsuario === userId) {
        throw new Error('No puede desactivar su propio usuario');
      }
      
      // Realizar petición
      const response = await apiClient.patch(`/users/${userId}/status`, {
        status: 'inactive'
      });
      
      // Verificar respuesta
      if (!response) {
        throw new Error('Respuesta inválida al desactivar usuario');
      }
      
      return response;
    } catch (error) {
      console.error(`[USER] Error al desactivar usuario con ID ${userId}:`, error.message);
      throw error;
    }
  };
  
  /**
   * Activa un usuario policial en el sistema
   * Restringido a administradores del sistema (ADMIN_SISTEMA)
   * @param {number} userId - ID del usuario a activar
   * @returns {Promise<Object>} Promesa que resuelve con la respuesta del servidor
   */
  const activateUser = async function(userId) {
    // Verificar si el usuario actual tiene permisos de administrador
    if (!authService.isAdmin()) {
      throw new Error('Solo usuarios con rol de Administrador pueden activar usuarios');
    }
    
    try {
      // Validar ID
      if (!userId) {
        throw new Error('ID de usuario inválido');
      }
      
      // Realizar petición
      const response = await apiClient.patch(`/users/${userId}/status`, {
        status: 'active'
      });
      
      // Verificar respuesta
      if (!response) {
        throw new Error('Respuesta inválida al activar usuario');
      }
      
      return response;
    } catch (error) {
      console.error(`[USER] Error al activar usuario con ID ${userId}:`, error.message);
      throw error;
    }
  };
  
  /**
   * Elimina permanentemente un usuario policial del sistema
   * Esta acción no se puede deshacer y está altamente restringida
   * Restringido a administradores del sistema (ADMIN_SISTEMA)
   * @param {number} userId - ID del usuario a eliminar
   * @returns {Promise<Object>} Promesa que resuelve con la respuesta del servidor
   */
  const deleteUser = async function(userId) {
    // Verificar si el usuario actual tiene permisos de administrador
    if (!authService.isAdmin()) {
      throw new Error('Solo usuarios con rol de Administrador pueden eliminar usuarios');
    }
    
    try {
      // Validar ID
      if (!userId) {
        throw new Error('ID de usuario inválido');
      }
      
      // No permitir eliminar al propio usuario
      const currentUser = authService.getUser();
      if (currentUser && currentUser.IDUsuario === userId) {
        throw new Error('No puede eliminar su propio usuario');
      }
      
      // Confirmar operación (debe hacerse en la UI antes de llamar a esta función)
      
      // Realizar petición
      const response = await apiClient.delete(`/users/${userId}`);
      
      // Verificar respuesta
      if (!response) {
        throw new Error('Respuesta inválida al eliminar usuario');
      }
      
      return response;
    } catch (error) {
      console.error(`[USER] Error al eliminar usuario con ID ${userId}:`, error.message);
      throw error;
    }
  };
  
  /**
   * Obtiene una lista de usuarios por filtro específico
   * @param {string} filterType - Tipo de filtro (area, rol, status)
   * @param {string|number} filterValue - Valor del filtro
   * @param {Object} [options] - Opciones adicionales de paginación
   * @returns {Promise<Array>} Promesa que resuelve con la lista de usuarios filtrados
   */
  const getUsersByFilter = async function(filterType, filterValue, options = {}) {
    try {
      // Validar parámetros
      if (!filterType || filterValue === undefined) {
        throw new Error('Parámetros de filtrado inválidos');
      }
      
      // Construir objeto de filtro para getAllUsers
      const filter = {
        [filterType]: filterValue
      };
      
      // Usar función existente con el filtro
      return await getAllUsers({
        ...options,
        filter
      });
    } catch (error) {
      console.error(`[USER] Error al obtener usuarios por filtro ${filterType}=${filterValue}:`, error.message);
      throw error;
    }
  };
  
  /**
   * Asigna permisos específicos a un usuario policial
   * Restringido a administradores del sistema (ADMIN_SISTEMA)
   * @param {number} userId - ID del usuario
   * @param {number} permissions - Valor numérico de permisos (máscara de bits)
   * @returns {Promise<Object>} Promesa que resuelve con la respuesta del servidor
   */
  const assignPermissions = async function(userId, permissions) {
    // Verificar si el usuario actual tiene permisos de administrador
    if (!authService.isAdmin()) {
      throw new Error('Solo usuarios con rol de Administrador pueden asignar permisos');
    }
    
    try {
      // Validar ID y permisos
      if (!userId || permissions === undefined) {
        throw new Error('ID de usuario o permisos inválidos');
      }
      
      // Realizar petición
      const response = await apiClient.put(`/users/${userId}/permissions`, {
        permissions
      });
      
      // Verificar respuesta
      if (!response || !response.data) {
        throw new Error('Respuesta inválida al asignar permisos');
      }
      
      return response.data;
    } catch (error) {
      console.error(`[USER] Error al asignar permisos al usuario con ID ${userId}:`, error.message);
      throw error;
    }
  };
  
  /**
   * Asigna un rol a un usuario policial
   * Restringido a administradores del sistema (ADMIN_SISTEMA)
   * @param {number} userId - ID del usuario
   * @param {number} roleId - ID del rol a asignar
   * @returns {Promise<Object>} Promesa que resuelve con la respuesta del servidor
   */
  const assignRole = async function(userId, roleId) {
    // Verificar si el usuario actual tiene permisos de administrador
    if (!authService.isAdmin()) {
      throw new Error('Solo usuarios con rol de Administrador pueden asignar roles');
    }
    
    try {
      // Validar IDs
      if (!userId || !roleId) {
        throw new Error('ID de usuario o rol inválidos');
      }
      
      // Realizar petición
      const response = await apiClient.put(`/users/${userId}/role`, {
        roleId
      });
      
      // Verificar respuesta
      if (!response || !response.data) {
        throw new Error('Respuesta inválida al asignar rol');
      }
      
      return response.data;
    } catch (error) {
      console.error(`[USER] Error al asignar rol ${roleId} al usuario con ID ${userId}:`, error.message);
      throw error;
    }
  };
  
  // API pública
  return {
    getAllUsers,
    getUserById,
    getUserByCIP,
    createUser,
    updateUser,
    deactivateUser,
    activateUser,
    deleteUser,
    getUsersByFilter,
    assignPermissions,
    assignRole
  };
})();

// Exportar para ES modules
export { userService }; 