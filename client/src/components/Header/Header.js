/**
 * Componente Header
 * Barra de navegación superior
 */

// Importar módulos
import * as sessionManager from '../../services/sessionManager.js';
import UserProfile from '../UserProfile/UserProfile.js';
import sidebarToggle from '../../modules/sidebarToggle.js';

export class Header {
    constructor() {
        console.log('[HEADER-DEBUG] Inicializando componente Header');
        this.user = null;
        // No asignamos this.user aquí porque obtenerUsuarioActual es async
        // En su lugar, cargaremos los datos del usuario en el método render
    }

    getUserDisplayName() {
        if (!this.user) return 'Usuario';
        
        console.log('[HEADER-DEBUG] Datos de usuario para mostrar:', this.user);
        
        // Intentar obtener el nombre completo con diferentes posibles propiedades
        const nombres = this.user.Nombres || this.user.nombres || this.user.name || '';
        const apellidos = this.user.Apellidos || this.user.apellidos || '';
        
        if (nombres || apellidos) {
            return `${nombres} ${apellidos}`.trim();
        }
        
        // Si no hay nombre, intentar con otras propiedades
        return this.user.nombreCompleto || this.user.username || this.user.usuario || 'Usuario';
    }

    async render(container) {
        console.log('[HEADER-DEBUG] Iniciando renderizado de Header');
        
        try {
            // Cargar los datos del usuario de manera asíncrona
            this.user = await sessionManager.obtenerUsuarioActual();
            console.log('[HEADER-DEBUG] Usuario obtenido:', this.user);
        } catch (error) {
            console.error('[HEADER-DEBUG] Error al obtener usuario:', error);
            this.user = null;
        }
        
        const nombreUsuario = this.getUserDisplayName();
        console.log('[HEADER-DEBUG] Nombre para mostrar:', nombreUsuario);
        
        const template = `
            <nav class="navbar">
                <div class="container-fluid">
                    <div class="navbar-left">
                        <button id="sidebar-toggle-btn" class="sidebar-toggle-btn" aria-label="Toggle sidebar">
                            <i class="fas fa-bars"></i>
                        </button>
                        <a class="navbar-brand" href="#">
                            <img src="/assets/img/logoOficri2x2.png" alt="OFICRI Logo">
                            <span>Sistema de Gestión OFICRI</span>
                        </a>
                    </div>
                    <div class="navbar-right">
                        <div class="user-info" id="user-info-button">
                            <i class="fas fa-user"></i>
                            <span>${nombreUsuario}</span>
                        </div>
                    </div>
                </div>
            </nav>
        `;

        if (container) {
            container.innerHTML = template;
            
            // Añadir evento al hacer clic en la información del usuario
            const userInfoButton = container.querySelector('#user-info-button');
            if (userInfoButton) {
                userInfoButton.style.cursor = 'pointer';
                userInfoButton.title = 'Haga clic para ver su perfil';
                
                userInfoButton.addEventListener('click', this.handleUserInfoClick.bind(this));
            }
            
            // Inicializar el toggle del sidebar después de renderizar
            this.initSidebarToggle();
        }
    }
    
    /**
     * Inicializa el toggle del sidebar
     */
    initSidebarToggle() {
        // Crear el overlay para el sidebar si no existe
        if (!document.querySelector('.sidebar-overlay')) {
            const overlay = document.createElement('div');
            overlay.className = 'sidebar-overlay';
            document.body.appendChild(overlay);
            
            // Agregar evento para cerrar el sidebar al hacer clic en el overlay
            overlay.addEventListener('click', () => {
                sidebarToggle.hide();
            });
        }
        
        // Inicializar el módulo de toggle del sidebar con configuración predeterminada
        sidebarToggle.init({
            sidebarSelector: '.admin-sidebar',
            contentSelector: '.admin-content',
            buttonSelector: '#sidebar-toggle-btn',
            mainSelector: 'main',
            layoutSelector: '.admin-layout'
        });
    }
    
    async handleUserInfoClick() {
        try {
            // Obtener el contenedor principal donde se mostrará el perfil
            const mainContent = document.getElementById('mainContent');
            
            if (!mainContent) {
                console.error('No se encontró el contenedor principal');
                return;
            }
            
            // Ocultar otros contenidos que puedan estar visibles
            const statsContainer = document.querySelector('.stats-container');
            if (statsContainer) {
                statsContainer.style.display = 'none';
            }
            
            // Mostrar el perfil sin título adicional (el componente ya lo tiene)
            mainContent.innerHTML = `<div id="userProfileContainer"></div>`;
            
            // Renderizar el componente de perfil
            const userProfile = new UserProfile();
            await userProfile.render(document.getElementById('userProfileContainer'));
            
        } catch (error) {
            console.error('Error al mostrar el perfil de usuario:', error);
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