/**
 * OFICRI Profile Service
 * Servicio para gestión del perfil de usuario en el sistema OFICRI
 */

// Importar módulos
import { apiClient } from '../api/apiClient.js';
import { authService } from './authService.js';

// Crear namespace
window.OFICRI = window.OFICRI || {};

// Profile Service Module
const profileService = (function() {
  'use strict';
  
  /**
   * Obtiene los datos completos del perfil del usuario actual
   * @returns {Promise<Object>} Promesa que resuelve con los datos del perfil
   */
  const getCurrentUserProfile = async function() {
    try {
      // Obtener usuario actual del authService
      const currentUser = authService.getUser();
      
      if (!currentUser || !currentUser.IDUsuario) {
        throw new Error('No hay usuario autenticado');
      }
      
      // Realizar petición al endpoint de usuarios
      const response = await apiClient.get(`/api/users/${currentUser.IDUsuario}`);
      
      // Verificar respuesta
      if (!response || !response.data) {
        throw new Error('Respuesta inválida al obtener perfil');
      }
      
      return response.data;
    } catch (error) {
      console.error('[PROFILE] Error al obtener perfil de usuario:', error.message);
      throw error;
    }
  };
  
  /**
   * Obtiene el historial de actividad del usuario actual
   * @param {Object} options - Opciones de paginación
   * @returns {Promise<Array>} Promesa que resuelve con la lista de actividades
   */
  const getUserActivity = async function(options = {}) {
    try {
      // Obtener usuario actual del authService
      const currentUser = authService.getUser();
      
      if (!currentUser || !currentUser.IDUsuario) {
        throw new Error('No hay usuario autenticado');
      }
      
      // Construir parámetros de consulta
      let queryParams = '';
      
      if (options.page) {
        queryParams += `page=${options.page}&`;
      }
      
      if (options.limit) {
        queryParams += `limit=${options.limit}&`;
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
      const response = await apiClient.get(`/api/logs/usuario/${currentUser.IDUsuario}${queryParams}`);
      
      // Verificar respuesta
      if (!response || !response.data) {
        throw new Error('Respuesta inválida al obtener actividad del usuario');
      }
      
      return response.data;
    } catch (error) {
      console.error('[PROFILE] Error al obtener actividad del usuario:', error.message);
      throw error;
    }
  };
  
  /**
   * Cambia la contraseña del usuario actual
   * @param {string} currentPassword - Contraseña actual
   * @param {string} newPassword - Nueva contraseña
   * @returns {Promise<Object>} Promesa que resuelve con el resultado de la operación
   */
  const changePassword = async function(currentPassword, newPassword) {
    try {
      // Validar contraseñas
      if (!currentPassword || !newPassword) {
        throw new Error('Contraseñas incompletas');
      }
      
      // Realizar petición
      const response = await apiClient.put('/api/auth/cambio-password', {
        currentPassword,
        newPassword
      });
      
      // Verificar respuesta
      if (!response || !response.data) {
        throw new Error('Respuesta inválida al cambiar contraseña');
      }
      
      return response.data;
    } catch (error) {
      console.error('[PROFILE] Error al cambiar contraseña:', error.message);
      throw error;
    }
  };
  
  // Public API
  return {
    getCurrentUserProfile,
    getUserActivity,
    changePassword
  };
})();

// Asignar al namespace global
window.OFICRI.profileService = profileService;

// Exportar para ES modules
export { profileService }; 