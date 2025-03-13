/**
 * Módulo de usuarios - Versión compatible
 * 
 * Este archivo sirve como punto de entrada unificado para todas las
 * funcionalidades del módulo de usuarios, diseñado para ser importado
 * de manera dinámica y compatible con diferentes sistemas de módulos.
 */

import * as apiService from './user/services/apiService.js';
import * as userComponents from './user/components/userComponents.js';
import * as userEvents from './user/events/userEvents.js';
import * as metadataService from './user/services/metadataService.js';
import * as userUtils from './user/utils/userUtils.js';

// Combinar todas las exportaciones
const userModule = {
    // Servicios de API
    ...apiService,
    
    // Funciones de renderizado
    ...userComponents,
    
    // Funciones de eventos
    ...userEvents,
    
    // Funciones de áreas y roles
    ...metadataService,
    
    // Funciones de utilidad
    ...userUtils
};

// Exportar para ES modules
export default userModule;

// Exportar funciones individuales para ES modules
export const {
    // Servicios de API
    getAuthHeaders,
    getAllUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser,
    toggleUserBlock,
    
    // Funciones de renderizado
    renderUsersTable,
    renderUserForm,
    showUserDetails,
    renderUserFormModal,
    
    // Funciones de eventos
    initUserEvents,
    showUserForm,
    loadUsers,
    
    // Funciones de áreas y roles
    getAllAreas,
    getAllRoles,
    
    // Funciones de utilidad
    showAlert,
    showModal,
    closeModal,
    forcePageReload
} = userModule; 