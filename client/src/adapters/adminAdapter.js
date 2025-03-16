/**
 * Adaptador temporal para mantener compatibilidad con el sistema actual
 * mientras se migran los componentes administrativos
 */

import { AdminPanel } from '../components/admin/AdminPanel.js';
import { UserManagement } from '../components/admin/UserManagement.js';
import { SystemConfig } from '../components/admin/SystemConfig.js';
import { ReportManager } from '../components/admin/ReportManager.js';
import { sessionManager } from '../services/sessionManager.js';
import { permissionUtils } from '../utils/permissions.js';

export class AdminAdapter {
    constructor() {
        this.components = {
            adminPanel: null,
            userManagement: null,
            systemConfig: null,
            reportManager: null
        };
    }

    /**
     * Inicializa el adaptador y los componentes
     */
    async initialize() {
        try {
            // Inicializar componentes
            this.components.adminPanel = new AdminPanel({
                onUserManagement: () => this.showUserManagement(),
                onSystemConfig: () => this.showSystemConfig(),
                onReports: () => this.showReportManager()
            });

            this.components.userManagement = new UserManagement({
                onUserCreate: () => this.handleUserCreate(),
                onUserEdit: (userId) => this.handleUserEdit(userId),
                onUserDelete: (userId) => this.handleUserDelete(userId)
            });

            this.components.systemConfig = new SystemConfig({
                onConfigUpdate: (config) => this.handleConfigUpdate(config),
                onBackupCreate: () => this.handleBackupCreate(),
                onBackupRestore: (backupId) => this.handleBackupRestore(backupId)
            });

            this.components.reportManager = new ReportManager({
                onReportGenerate: () => this.handleReportGenerate(),
                onReportExport: (reportId) => this.handleReportExport(reportId)
            });

            // Renderizar el panel principal
            const mainContent = document.getElementById('mainContent');
            if (mainContent) {
                await this.components.adminPanel.render(mainContent);
            }

            return true;
        } catch (error) {
            console.error('[ADMIN-ADAPTER] Error al inicializar:', error);
            throw error;
        }
    }

    /**
     * Muestra el panel de administración
     */
    async showAdminPanel() {
        const mainContent = document.getElementById('mainContent');
        if (mainContent) {
            await this.components.adminPanel.render(mainContent);
        }
    }

    /**
     * Muestra la gestión de usuarios
     */
    async showUserManagement() {
        const mainContent = document.getElementById('mainContent');
        if (mainContent) {
            await this.components.userManagement.render(mainContent);
        }
    }

    /**
     * Muestra la configuración del sistema
     */
    async showSystemConfig() {
        const mainContent = document.getElementById('mainContent');
        if (mainContent) {
            await this.components.systemConfig.render(mainContent);
        }
    }

    /**
     * Muestra el gestor de reportes
     */
    async showReportManager() {
        const mainContent = document.getElementById('mainContent');
        if (mainContent) {
            await this.components.reportManager.render(mainContent);
        }
    }

    /**
     * Maneja la creación de usuarios
     */
    async handleUserCreate() {
        // Implementar lógica de creación de usuarios
        console.log('[ADMIN-ADAPTER] Creando nuevo usuario');
    }

    /**
     * Maneja la edición de usuarios
     */
    async handleUserEdit(userId) {
        // Implementar lógica de edición de usuarios
        console.log('[ADMIN-ADAPTER] Editando usuario:', userId);
    }

    /**
     * Maneja la eliminación de usuarios
     */
    async handleUserDelete(userId) {
        // Implementar lógica de eliminación de usuarios
        console.log('[ADMIN-ADAPTER] Eliminando usuario:', userId);
    }

    /**
     * Maneja la actualización de configuración
     */
    async handleConfigUpdate(config) {
        // Implementar lógica de actualización de configuración
        console.log('[ADMIN-ADAPTER] Actualizando configuración:', config);
    }

    /**
     * Maneja la creación de copias de seguridad
     */
    async handleBackupCreate() {
        // Implementar lógica de creación de copias de seguridad
        console.log('[ADMIN-ADAPTER] Creando copia de seguridad');
    }

    /**
     * Maneja la restauración de copias de seguridad
     */
    async handleBackupRestore(backupId) {
        // Implementar lógica de restauración de copias de seguridad
        console.log('[ADMIN-ADAPTER] Restaurando copia de seguridad:', backupId);
    }

    /**
     * Maneja la generación de reportes
     */
    async handleReportGenerate() {
        // Implementar lógica de generación de reportes
        console.log('[ADMIN-ADAPTER] Generando reporte');
    }

    /**
     * Maneja la exportación de reportes
     */
    async handleReportExport(reportId) {
        // Implementar lógica de exportación de reportes
        console.log('[ADMIN-ADAPTER] Exportando reporte:', reportId);
    }
}

// Exportar instancia única
export const adminAdapter = new AdminAdapter();

// Exportar clase para pruebas
export default AdminAdapter; 