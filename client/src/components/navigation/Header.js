/**
 * Componente Header
 * Barra de navegación superior que incluye el logo, título y perfil de usuario
 */

import { sessionManager } from '../../services/sessionManager.js';
import { UserProfile } from '../user/UserProfile.js';
import { sidebarToggle } from '../../utils/sidebarToggle.js';
import { Button } from '../base/Button.js';

export class Header {
    constructor(options = {}) {
        this.options = {
            onUserProfileClick: options.onUserProfileClick || null,
            onLogout: options.onLogout || null,
            className: options.className || 'navbar',
            ...options
        };
        
        this.user = null;
    }

    getUserDisplayName() {
        if (!this.user) return 'Usuario';
        
        const nombres = this.user.Nombres || this.user.nombres || this.user.name || '';
        const apellidos = this.user.Apellidos || this.user.apellidos || '';
        
        if (nombres || apellidos) {
            return `${nombres} ${apellidos}`.trim();
        }
        
        return this.user.nombreCompleto || this.user.username || this.user.usuario || 'Usuario';
    }

    async render(container) {
        try {
            this.user = await sessionManager.obtenerUsuarioActual();
        } catch (error) {
            console.error('[HEADER] Error al obtener usuario:', error);
            this.user = null;
        }
        
        const nombreUsuario = this.getUserDisplayName();
        
        const template = `
            <nav class="${this.options.className} navbar-expand-lg navbar-light bg-light">
                <div class="container-fluid">
                    <div class="navbar-left d-flex align-items-center">
                        <button id="sidebar-toggle-btn" 
                                class="btn btn-link me-2" 
                                aria-label="Toggle sidebar">
                            <i class="fas fa-bars"></i>
                        </button>
                        <a class="navbar-brand d-flex align-items-center" href="#">
                            <img src="/assets/img/logoOficri2x2.png" 
                                 alt="OFICRI Logo" 
                                 class="me-2"
                                 style="height: 40px;">
                            <span>Sistema de Gestión OFICRI</span>
                        </a>
                    </div>
                    <div class="navbar-right">
                        <div class="user-info d-flex align-items-center" 
                             id="user-info-button"
                             style="cursor: pointer;">
                            <i class="fas fa-user me-2"></i>
                            <span>${nombreUsuario}</span>
                        </div>
                    </div>
                </div>
            </nav>
        `;

        if (container) {
            container.innerHTML = template;
            this.initializeEventListeners(container);
        }

        return template;
    }

    initializeEventListeners(container) {
        // Evento para el perfil de usuario
        const userInfoButton = container.querySelector('#user-info-button');
        if (userInfoButton) {
            userInfoButton.title = 'Haga clic para ver su perfil';
            userInfoButton.addEventListener('click', () => this.handleUserInfoClick());
        }

        // Evento para el toggle del sidebar
        const sidebarToggleBtn = container.querySelector('#sidebar-toggle-btn');
        if (sidebarToggleBtn) {
            sidebarToggleBtn.addEventListener('click', () => this.handleSidebarToggle());
        }

        // Inicializar el toggle del sidebar
        this.initSidebarToggle();
    }

    initSidebarToggle() {
        if (!document.querySelector('.sidebar-overlay')) {
            const overlay = document.createElement('div');
            overlay.className = 'sidebar-overlay';
            document.body.appendChild(overlay);
            
            overlay.addEventListener('click', () => {
                sidebarToggle.hide();
            });
        }
        
        sidebarToggle.init({
            sidebarSelector: '.admin-sidebar',
            contentSelector: '.admin-content',
            buttonSelector: '#sidebar-toggle-btn',
            mainSelector: 'main',
            layoutSelector: '.admin-layout'
        });
    }

    handleSidebarToggle() {
        sidebarToggle.toggle();
    }

    async handleUserInfoClick() {
        try {
            const mainContent = document.getElementById('mainContent');
            
            if (!mainContent) {
                console.error('[HEADER] No se encontró el contenedor principal');
                return;
            }
            
            // Ocultar otros contenidos
            const statsContainer = document.querySelector('.stats-container');
            if (statsContainer) {
                statsContainer.style.display = 'none';
            }
            
            // Mostrar el perfil
            mainContent.innerHTML = `<div id="userProfileContainer"></div>`;
            
            const userProfile = new UserProfile();
            await userProfile.render(document.getElementById('userProfileContainer'));
            
            if (this.options.onUserProfileClick) {
                this.options.onUserProfileClick();
            }
            
        } catch (error) {
            console.error('[HEADER] Error al mostrar el perfil de usuario:', error);
            if (mainContent) {
                mainContent.innerHTML = `
                    <div class="alert alert-danger">
                        <i class="fas fa-exclamation-triangle me-2"></i>
                        Error: No se pudo cargar el perfil del usuario
                    </div>
                `;
            }
        }
    }
}

export default Header; 