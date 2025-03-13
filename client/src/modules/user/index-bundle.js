/**
 * Punto de entrada unificado para el módulo de usuarios (versión bundle)
 * Este archivo usa CommonJS para mejor compatibilidad con carga dinámica
 */

// Importar todos los servicios
const apiService = require('./services/apiService.js');
const userComponents = require('./components/userComponents.js');
const userEvents = require('./events/userEvents.js');
const metadataService = require('./services/metadataService.js');
const userUtils = require('./utils/userUtils.js');

// Combinar todas las exportaciones en un solo objeto
module.exports = {
    // Servicios de API
    getAuthHeaders: apiService.getAuthHeaders,
    getAllUsers: apiService.getAllUsers,
    getUserById: apiService.getUserById,
    createUser: apiService.createUser,
    updateUser: apiService.updateUser,
    deleteUser: apiService.deleteUser,
    toggleUserBlock: apiService.toggleUserBlock,
    
    // Funciones de renderizado
    renderUsersTable: userComponents.renderUsersTable,
    renderUserForm: userComponents.renderUserForm,
    showUserDetails: userComponents.showUserDetails,
    renderUserFormModal: userComponents.renderUserFormModal,
    
    // Funciones de eventos
    initUserEvents: userEvents.initUserEvents,
    showUserForm: userEvents.showUserForm,
    loadUsers: userEvents.loadUsers,
    
    // Funciones de áreas y roles
    getAllAreas: metadataService.getAllAreas,
    getAllRoles: metadataService.getAllRoles,
    
    // Funciones de utilidad
    showAlert: userUtils.showAlert,
    showModal: userUtils.showModal,
    closeModal: userUtils.closeModal,
    forcePageReload: userUtils.forcePageReload
}; 