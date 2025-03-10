/**
 * Módulo de Dashboard
 * Proporciona funciones modulares para gestionar y mostrar el dashboard
 */

import AuthService from '../services/auth.service.js';
import * as permissionUtils from '../utils/permissions.js';

// URL base para las operaciones del dashboard
const BASE_URL = '/api/dashboard';

/**
 * Obtiene los headers con el token de autenticación
 * @returns {Object} - Headers con el token de autenticación
 */
const getAuthHeaders = () => {
    const token = AuthService.getToken();
    return {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };
};

/**
 * Obtiene las estadísticas del dashboard
 * @returns {Promise<Object>} - Objeto con las estadísticas
 */
export const getDashboardStats = async () => {
    try {
        // Por ahora, simularemos los datos hasta que el backend esté listo
        // TODO: Reemplazar con llamada real a la API cuando esté disponible
        return {
            usuariosActivos: Math.floor(Math.random() * 100),
            documentosPendientes: Math.floor(Math.random() * 50),
            areasActivas: Math.floor(Math.random() * 20)
        };

        /* Código para cuando la API esté lista
        const response = await fetch(`${BASE_URL}/stats`, {
            method: 'GET',
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }

        return await response.json();
        */
    } catch (error) {
        console.error('Error en getDashboardStats:', error);
        return {
            usuariosActivos: '...',
            documentosPendientes: '...',
            areasActivas: '...'
        };
    }
};

/**
 * Actualiza las estadísticas en la interfaz
 * @returns {Promise<void>}
 */
export const updateDashboardStats = async () => {
    try {
        const stats = await getDashboardStats();
        
        // Actualizar los elementos del DOM
        const elements = {
            activeUsers: document.getElementById('activeUsers'),
            pendingDocs: document.getElementById('pendingDocs'),
            activeAreas: document.getElementById('activeAreas')
        };

        if (elements.activeUsers) elements.activeUsers.textContent = stats.usuariosActivos;
        if (elements.pendingDocs) elements.pendingDocs.textContent = stats.documentosPendientes;
        if (elements.activeAreas) elements.activeAreas.textContent = stats.areasActivas;
    } catch (error) {
        console.error('Error al actualizar estadísticas:', error);
    }
};

/**
 * Renderiza el contenido principal del dashboard
 * @returns {string} - HTML del contenido del dashboard
 */
export const renderDashboardContent = () => {
    return `
        <div class="dashboard-container">
            <div class="dashboard-header">
                <h2>Panel de Control</h2>
                <div class="dashboard-actions">
                    <button class="btn btn-primary" id="updateStatsButton">
                        <i class="fas fa-sync-alt"></i> Actualizar
                    </button>
                </div>
            </div>
            
            <div class="dashboard-grid">
                <!-- Las tarjetas de estadísticas ya están en el HTML base -->
                
                <!-- Sección de actividad reciente -->
                <div class="dashboard-section">
                    <h3>Actividad Reciente</h3>
                    <div id="recentActivity" class="activity-list">
                        <p class="text-muted">Cargando actividad reciente...</p>
                    </div>
                </div>
                
                <!-- Sección de documentos pendientes -->
                <div class="dashboard-section">
                    <h3>Documentos Pendientes</h3>
                    <div id="pendingDocuments" class="documents-list">
                        <p class="text-muted">Cargando documentos pendientes...</p>
                    </div>
                </div>
            </div>
        </div>
    `;
};

/**
 * Inicializa el dashboard
 * @returns {Promise<void>}
 */
export const initDashboard = async () => {
    try {
        // Verificar permisos
        const user = AuthService.getCurrentUser();
        if (!user) {
            throw new Error('Usuario no autenticado');
        }

        // Actualizar estadísticas iniciales
        await updateDashboardStats();

        // Configurar el botón de actualización
        const updateButton = document.getElementById('updateStatsButton');
        if (updateButton) {
            updateButton.addEventListener('click', updateDashboardStats);
        }

        // Configurar actualización automática cada 5 minutos
        const intervalId = setInterval(updateDashboardStats, 5 * 60 * 1000);

        // Limpiar el intervalo cuando se desmonte el componente
        window.addEventListener('unload', () => clearInterval(intervalId));

    } catch (error) {
        console.error('Error al inicializar dashboard:', error);
    }
};

// Exponer funciones necesarias al objeto window para el onclick
window.dashboardModule = {
    updateDashboardStats
}; 