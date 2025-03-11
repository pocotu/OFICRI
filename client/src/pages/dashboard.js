/**
 * Página de dashboard
 * Maneja la lógica y renderizado del dashboard de usuario
 */

import AuthService from '../services/auth.service.js';
import * as dashboardModule from '../modules/dashboardModule.js';

// Variable para evitar múltiples verificaciones
let isCheckingAuth = false;

// Verificar autenticación al cargar la página
document.addEventListener('DOMContentLoaded', async () => {
    console.log('[DASHBOARD] Iniciando carga de dashboard...');
    
    try {
        // Evitar verificaciones múltiples
        if (isCheckingAuth) {
            console.log('[DASHBOARD] Ya hay una verificación en progreso');
            return;
        }
        isCheckingAuth = true;

        // Verificar autenticación
        if (!AuthService.isAuthenticated()) {
            console.log('[DASHBOARD] Usuario no autenticado');
            // Guardar la ruta actual antes de redirigir
            localStorage.setItem('lastPath', window.location.pathname);
            window.location.replace('/');
            return;
        }

        const user = AuthService.getCurrentUser();
        console.log('[DASHBOARD] Datos del usuario:', user);
        
        // Verificar que el usuario existe y tiene datos válidos
        if (!user || !user.IDRol) {
            console.log('[DASHBOARD] Datos de usuario inválidos');
            AuthService.logout(true);
            return;
        }

        // Si es administrador, redirigir al panel de administración
        if (user.IDRol === 1) {
            console.log('[DASHBOARD] Usuario es administrador, redirigiendo a panel admin');
            window.location.replace('/admin.html');
            return;
        }

        console.log('[DASHBOARD] Usuario autenticado y autorizado, cargando dashboard...');

        // Mostrar la interfaz del dashboard
        document.querySelector('.dashboard-layout').style.display = 'block';
        document.getElementById('loadingOverlay').style.display = 'none';

        // Inicializar el dashboard
        await dashboardModule.initDashboard();

    } catch (error) {
        console.error('[DASHBOARD] Error al inicializar dashboard:', error);
        AuthService.logout(true);
    } finally {
        isCheckingAuth = false;
    }
}); 