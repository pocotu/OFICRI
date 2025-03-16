/**
 * Página de Dashboard - OFICRI
 * Maneja la lógica y renderizado de la interfaz del Dashboard
 */

import { PageIntegration } from '../../utils/pageIntegration.js';
import { securityLogger } from '../../services/security/logging.js';
import { getCurrentSession } from '../../services/session/sessionManager.js';

class DashboardPage {
    constructor() {
        this.pageIntegration = new PageIntegration({
            headerContainerId: 'header-container',
            sidebarContainerId: 'sidebar-container',
            mainContainerId: 'main-content'
        });
        this.stats = {
            documentsByStatus: {
                received: 0,
                inProcess: 0,
                completed: 0,
                blocked: 0
            },
            recentActivity: [],
            systemStatus: {
                usersOnline: 0,
                systemLoad: 0,
                lastBackup: null
            }
        };
    }

    async init() {
        try {
            // Mostrar indicador de carga
            this.pageIntegration.showLoading();

            // Inicializar componentes base
            await this.pageIntegration.init();

            // Verificar permisos básicos
            await this.checkBasicPermissions();

            // Cargar datos del dashboard
            await this.loadDashboardData();

            // Ocultar indicador de carga
            this.pageIntegration.hideLoading();
        } catch (error) {
            this.pageIntegration.hideLoading();
            this.pageIntegration.showError(error.message);
            
            securityLogger.logSecurityEvent('DASHBOARD_INIT_ERROR', {
                error: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }

    async checkBasicPermissions() {
        const session = await getCurrentSession();
        if (!session) {
            throw new Error('No hay sesión activa');
        }

        // Verificar permisos básicos (VIEW es suficiente para el dashboard)
        const hasPermission = session.permissions.includes('VIEW');

        if (!hasPermission) {
            throw new Error('No tiene los permisos necesarios para acceder al dashboard');
        }
    }

    async loadDashboardData() {
        try {
            // TODO: Implementar llamadas a API para obtener datos del dashboard
            // Por ahora usamos datos de ejemplo
            this.stats = {
                documentsByStatus: {
                    received: 150,
                    inProcess: 45,
                    completed: 105,
                    blocked: 5
                },
                recentActivity: [
                    {
                        type: 'document',
                        action: 'created',
                        timestamp: new Date().toISOString(),
                        details: 'Nuevo expediente creado'
                    },
                    {
                        type: 'user',
                        action: 'login',
                        timestamp: new Date().toISOString(),
                        details: 'Usuario inició sesión'
                    }
                ],
                systemStatus: {
                    usersOnline: 25,
                    systemLoad: 45,
                    lastBackup: new Date().toISOString()
                }
            };

            // Actualizar visualización
            this.updateDashboardDisplay();
        } catch (error) {
            securityLogger.logSecurityEvent('DASHBOARD_DATA_ERROR', {
                error: error.message,
                timestamp: new Date().toISOString()
            });
            throw new Error('Error al cargar los datos del dashboard');
        }
    }

    updateDashboardDisplay() {
        // Actualizar contadores de documentos
        document.getElementById('documents-received').textContent = this.stats.documentsByStatus.received;
        document.getElementById('documents-in-process').textContent = this.stats.documentsByStatus.inProcess;
        document.getElementById('documents-completed').textContent = this.stats.documentsByStatus.completed;
        document.getElementById('documents-blocked').textContent = this.stats.documentsByStatus.blocked;

        // Actualizar estado del sistema
        document.getElementById('users-online').textContent = this.stats.systemStatus.usersOnline;
        document.getElementById('system-load').textContent = `${this.stats.systemStatus.systemLoad}%`;
        document.getElementById('last-backup').textContent = new Date(this.stats.systemStatus.lastBackup).toLocaleString();

        // Actualizar actividad reciente
        this.updateRecentActivity();
    }

    updateRecentActivity() {
        const activityContainer = document.getElementById('recent-activity');
        if (!activityContainer) return;

        activityContainer.innerHTML = this.stats.recentActivity
            .map(activity => `
                <div class="activity-item">
                    <div class="activity-icon">
                        <i class="bi ${this.getActivityIcon(activity.type)}"></i>
                    </div>
                    <div class="activity-details">
                        <div class="activity-text">${activity.details}</div>
                        <div class="activity-time">${new Date(activity.timestamp).toLocaleString()}</div>
                    </div>
                </div>
            `)
            .join('');
    }

    getActivityIcon(type) {
        const icons = {
            document: 'bi-file-text',
            user: 'bi-person',
            system: 'bi-gear',
            security: 'bi-shield-lock'
        };
        return icons[type] || 'bi-info-circle';
    }
}

// Inicializar la página cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    const dashboardPage = new DashboardPage();
    dashboardPage.init();
}); 