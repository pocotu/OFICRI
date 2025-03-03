// Import necessary modules
import { loadAreas } from './areas.js';
import { initAdminDashboard } from './admin/adminDashboard.js';
import { loadUsers } from './admin/userManagement.js';
import { loadRoles } from './admin/adminRoles.js';

// Initialize all modules when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Check which page we're on based on the current URL or page elements
        const isAdminDashboard = document.querySelector('.admin-dashboard');
        const isUserManagement = document.querySelector('#gestionUsuariosTable');
        const isAreaManagement = document.querySelector('#areas-table');
        const isRoleManagement = document.querySelector('#roles-table');

        // Initialize appropriate modules based on the current page
        if (isAdminDashboard) {
            await initAdminDashboard();
        }

        if (isUserManagement) {
            await loadUsers();
        }

        if (isAreaManagement) {
            await loadAreas();
        }

        if (isRoleManagement) {
            await loadRoles();
        }

    } catch (error) {
        console.error('Error initializing modules:', error);
        if (window.uiHelpers && window.uiHelpers.showError) {
            window.uiHelpers.showError('Error al cargar los módulos: ' + error.message);
        }
    }
});