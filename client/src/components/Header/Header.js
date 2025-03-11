/**
 * Componente Header
 * Barra de navegación superior
 */

// Importar módulos
import * as sessionManager from '../../services/sessionManager.js';
import UserProfile from '../UserProfile/UserProfile.js';

export class Header {
    constructor() {
        this.user = sessionManager.obtenerUsuarioActual();
    }

    getUserDisplayName() {
        if (!this.user) return 'Usuario';
        
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
        const template = `
            <nav class="navbar">
                <div class="container-fluid">
                    <div class="navbar-left">
                        <a class="navbar-brand" href="#">
                            <img src="/assets/img/logoOficri2x2.png" alt="OFICRI Logo">
                            <span>Sistema de Gestión OFICRI</span>
                        </a>
                    </div>
                    <div class="navbar-right">
                        <div class="user-info" id="user-info-button">
                            <i class="fas fa-user"></i>
                            <span>${this.getUserDisplayName()}</span>
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
        }
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