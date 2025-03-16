/**
 * Utilidad de Integración de Páginas - OFICRI
 * Maneja la inicialización y configuración de componentes en las páginas
 */

import { Header } from '../components/Header/Header.js';
import { Sidebar } from '../components/Sidebar/Sidebar.js';
import { initSessionManager } from '../services/session/sessionManager.js';
import { securityLogger } from '../services/security/logging.js';

export class PageIntegration {
    constructor(options = {}) {
        this.options = {
            headerContainerId: 'header-container',
            sidebarContainerId: 'sidebar-container',
            mainContainerId: 'main-content',
            ...options
        };
        this.header = null;
        this.sidebar = null;
    }

    async init() {
        try {
            // Inicializar gestor de sesiones
            await initSessionManager();

            // Inicializar componentes
            await this.initComponents();

            // Registrar evento de inicialización exitosa
            securityLogger.logSecurityEvent('PAGE_INIT_SUCCESS', {
                page: window.location.pathname,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            securityLogger.logSecurityEvent('PAGE_INIT_ERROR', {
                error: error.message,
                page: window.location.pathname,
                timestamp: new Date().toISOString()
            });
            throw error;
        }
    }

    async initComponents() {
        // Inicializar Header
        this.header = new Header(this.options.headerContainerId);
        await this.header.init();

        // Inicializar Sidebar
        this.sidebar = new Sidebar(this.options.sidebarContainerId);
        await this.sidebar.init();
    }

    showError(message) {
        // Sanitizar mensaje para prevenir XSS
        const sanitizedMessage = message.replace(/[<>]/g, '');
        
        // Mostrar mensaje de error
        const errorDiv = document.createElement('div');
        errorDiv.className = 'alert alert-danger alert-dismissible fade show';
        errorDiv.innerHTML = `
            <strong>Error:</strong> ${sanitizedMessage}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        `;

        const container = document.getElementById(this.options.mainContainerId) || document.body;
        container.insertBefore(errorDiv, container.firstChild);
    }

    showLoading() {
        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'loading-overlay';
        loadingDiv.innerHTML = `
            <div class="loading-content">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Cargando...</span>
                </div>
            </div>
        `;
        document.body.appendChild(loadingDiv);
    }

    hideLoading() {
        const loadingDiv = document.querySelector('.loading-overlay');
        if (loadingDiv) {
            loadingDiv.remove();
        }
    }
} 