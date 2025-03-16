/**
 * Página principal de Administración
 */

import { authService } from '../../services/services.js';
import * as errorHandler from '../../utils/errorHandler.js';
import { AdminSidebar } from './components/AdminSidebar.js';

// Inicializar la página
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Verificar autenticación
        if (!authService.isAuthenticated()) {
            window.location.href = '/';
            return;
        }

        // Verificar permisos de administrador
        if (!authService.hasRole('admin')) {
            errorHandler.showError('No tiene permisos para acceder a esta página');
            window.location.href = '/';
            return;
        }

        // Renderizar sidebar
        const sidebarContainer = document.getElementById('adminSidebar');
        if (sidebarContainer) {
            const sidebar = new AdminSidebar();
            sidebar.render(sidebarContainer);
        }

        // Cargar vista por defecto
        const mainContent = document.getElementById('mainContent');
        if (mainContent) {
            // TODO: Cargar vista por defecto
        }
    } catch (error) {
        errorHandler.handleError(error);
    }
}); 