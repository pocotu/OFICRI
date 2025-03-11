/**
 * Módulo de Dashboard
 * Proporciona funciones modulares para gestionar y mostrar el dashboard
 */

import { authService } from '../services/services.js';
import * as permissionUtils from '../utils/permissions.js';
import * as errorHandler from '../utils/errorHandler.js';

// URL base para las operaciones del dashboard
const BASE_URL = '/api/dashboard';

// Estado local para mantener las estadísticas consistentes
let dashboardState = {
    usuariosActivos: 0,
    documentosPendientes: 0,
    areasActivas: 0,
    lastUpdate: null
};

/**
 * Obtiene los headers con el token de autenticación
 * @returns {Object} - Headers con el token de autenticación
 */
const getAuthHeaders = () => {
    const token = authService.getToken();
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
        // Si los datos tienen menos de 1 minuto, usar el caché
        if (dashboardState.lastUpdate && 
            (Date.now() - dashboardState.lastUpdate) < 60000) {
            return { ...dashboardState };
        }

        const response = await fetch(`${BASE_URL}/stats`, {
            method: 'GET',
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }

        const data = await response.json();
        dashboardState = {
            ...data,
            lastUpdate: Date.now()
        };
        return { ...dashboardState };
    } catch (error) {
        console.error('Error en getDashboardStats:', error);
        return dashboardState;
    }
};

/**
 * Actualiza las estadísticas del dashboard y actualiza la UI
 * @returns {Promise<void>}
 */
export const updateDashboardStats = async () => {
    try {
        // Verificar permisos
        const user = authService.getCurrentUser();
        if (!user) {
            throw new Error('Usuario no autenticado');
        }

        const permissions = permissionUtils.getRolePermissions(user.IDRol);
        if (!permissionUtils.hasPermission(permissions, permissionUtils.PERMISSION.VIEW)) {
            throw new Error('No tiene permisos para ver esta información');
        }

        // Actualizar estadísticas
        const stats = await getDashboardStats();

        // Actualizar elementos de la UI
        const activeUsersElement = document.getElementById('activeUsers');
        const pendingDocsElement = document.getElementById('pendingDocs');
        const activeAreasElement = document.getElementById('activeAreas');

        if (activeUsersElement) {
            const currentValue = parseInt(activeUsersElement.textContent) || 0;
            animateNumber(activeUsersElement, currentValue, stats.usuariosActivos);
        }

        if (pendingDocsElement) {
            const currentValue = parseInt(pendingDocsElement.textContent) || 0;
            animateNumber(pendingDocsElement, currentValue, stats.documentosPendientes);
        }

        if (activeAreasElement) {
            const currentValue = parseInt(activeAreasElement.textContent) || 0;
            animateNumber(activeAreasElement, currentValue, stats.areasActivas);
        }

        return stats;
    } catch (error) {
        errorHandler.handleError('DASHBOARD', error, 'actualizar estadísticas', true);
        return { error: error.message };
    }
};

/**
 * Anima un número desde un valor inicial hasta un valor final
 * @param {HTMLElement} element - Elemento a animar
 * @param {number} start - Valor inicial
 * @param {number} end - Valor final
 */
function animateNumber(element, start, end) {
    const duration = 1000; // 1 segundo
    const steps = 60;
    const stepValue = (end - start) / steps;
    let current = start;
    let step = 0;

    const animate = () => {
        step++;
        current += stepValue;
        
        if (step === steps) {
            element.textContent = end;
        } else {
            element.textContent = Math.round(current);
            requestAnimationFrame(animate);
        }
    };

    requestAnimationFrame(animate);
}

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
        const user = authService.getCurrentUser();
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