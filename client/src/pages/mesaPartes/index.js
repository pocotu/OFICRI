/**
 * Página principal de Mesa de Partes
 */

import { authService } from '../../services/services.js';
import * as errorHandler from '../../utils/errorHandler.js';
import { MesaPartesSidebar } from './components/MesaPartesSidebar.js';

// Inicializar la página
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Verificar autenticación
        if (!authService.isAuthenticated()) {
            window.location.href = '/';
            return;
        }

        // Renderizar sidebar
        const sidebarContainer = document.getElementById('sidebarContainer');
        if (sidebarContainer) {
            const sidebar = new MesaPartesSidebar();
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