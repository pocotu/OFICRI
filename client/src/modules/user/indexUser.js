/**
 * Punto de entrada unificado para el módulo de usuarios
 * Exporta todas las funciones desde los archivos modularizados
 */

// Importar y reexportar las funciones de servicios de API
export {
    getAuthHeaders,
    getAllUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser,
    toggleUserBlock
} from './services/apiService.js';

// Importar y reexportar las funciones de renderizado
export {
    renderUsersTable,
    renderUserForm,
    showUserDetails,
    renderUserFormModal
} from './components/userComponents.js';

// Importar y reexportar las funciones de eventos
export {
    initUserEvents,
    showUserForm,
    loadUsers
} from './events/userEvents.js';

// Importar y reexportar las funciones de áreas y roles
export {
    getAllAreas,
    getAllRoles
} from './services/metadataService.js';

// Importar y reexportar las funciones de utilidad
export {
    showAlert,
    showModal,
    closeModal,
    forcePageReload
} from './utils/userUtils.js'; 