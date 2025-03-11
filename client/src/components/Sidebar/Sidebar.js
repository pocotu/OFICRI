/**
 * Componente Sidebar
 * Barra lateral de navegación
 */

// Importar módulos
import authService from '../../services/auth.service.js';
import * as sessionManager from '../../services/sessionManager.js';
import * as permissionUtils from '../../utils/permissions.js';

export class Sidebar {
    constructor() {
        console.log('[SIDEBAR-DEBUG] Inicializando componente Sidebar');
        this.user = sessionManager.obtenerUsuarioActual();
        this.permissions = this.user ? permissionUtils.getRolePermissions(this.user.IDRol) : 0;
        
        // Definir los elementos del menú con sus permisos requeridos
        this.menuItems = [
            {
                icon: 'fas fa-tachometer-alt',
                label: 'Dashboard',
                url: '/admin.html',
                permission: null // No requiere permiso específico
            },
            {
                icon: 'fas fa-users',
                label: 'Gestión de Usuarios',
                url: '/admin/users.html',
                permission: permissionUtils.PERMISSION.VIEW
            },
            {
                icon: 'fas fa-user-tag',
                label: 'Gestión de Roles',
                url: '/admin/roles.html',
                permission: permissionUtils.PERMISSION.VIEW
            },
            {
                icon: 'fas fa-building',
                label: 'Gestión de Áreas',
                url: '/admin/areas.html',
                permission: permissionUtils.PERMISSION.VIEW
            },
            {
                icon: 'fas fa-file-alt',
                label: 'Gestión de Documentos',
                url: '/admin/documents.html',
                permission: permissionUtils.PERMISSION.VIEW
            },
            {
                icon: 'fas fa-shield-alt',
                label: 'Registros / Auditoría',
                url: '/admin/audit.html',
                permission: permissionUtils.PERMISSION.AUDIT
            },
            {
                icon: 'fas fa-file-export',
                label: 'Exportar',
                url: '/admin/export.html',
                permission: permissionUtils.PERMISSION.EXPORT
            }
        ];
    }

    async render(container) {
        // Filtrar elementos del menú según permisos
        const filteredMenuItems = this.menuItems.filter(item => 
            item.permission === null || permissionUtils.hasPermission(this.permissions, item.permission)
        );
        
        const template = `
            <div class="sidebar-content">
                <div class="sidebar-header">
                    <h5>Menú Principal</h5>
                </div>
                <div class="sidebar-main">
                    <ul class="nav flex-column menu-items">
                        ${filteredMenuItems.map(item => this.renderMenuItem(item)).join('')}
                    </ul>
                </div>
                <div class="sidebar-footer">
                    <a class="nav-link nav-link-logout" href="#" id="logout-link">
                        <i class="fas fa-sign-out-alt"></i>
                        Cerrar Sesión
                    </a>
                </div>
            </div>
        `;

        if (container) {
            container.innerHTML = template;
            this.setupEventListeners(container);
            
            // Marcar el elemento activo inicial
            this.updateActiveMenuItem();
            
            // Agregar evento al botón de cerrar sesión
            const logoutLink = container.querySelector('#logout-link');
            if (logoutLink) {
                logoutLink.addEventListener('click', (e) => {
                    e.preventDefault();
                    console.log('[SIDEBAR-DEBUG] Botón de cerrar sesión clickeado');
                    
                    // Usar try-catch para manejar posibles errores
                    try {
                        console.log('[SIDEBAR-DEBUG] Intentando cerrar sesión con authService');
                        console.log('[SIDEBAR-DEBUG] authService disponible:', authService ? 'SÍ' : 'NO');
                        
                        if (authService && typeof authService.logout === 'function') {
                            authService.logout(true);
                        } else {
                            console.error('[SIDEBAR-DEBUG] authService.logout no está disponible');
                            // Usar el método del sessionManager como respaldo
                            sessionManager.cerrarSesion();
                        }
                    } catch (error) {
                        console.error('[SIDEBAR-DEBUG] Error al cerrar sesión:', error);
                        
                        // Último recurso: redirigir directamente
                        try {
                            window.location.href = '/index.html';
                        } catch (redirectError) {
                            console.error('[SIDEBAR-DEBUG] Error al redirigir:', redirectError);
                            alert('Error al cerrar sesión. Por favor, recarga la página.');
                        }
                    }
                });
            } else {
                console.warn('[SIDEBAR-DEBUG] No se encontró el enlace de logout');
            }
        }
    }

    renderMenuItem(item) {
        const isActive = this.isActiveUrl(item.url);
        return `
            <li class="nav-item">
                <a class="nav-link ${isActive ? 'active' : ''}" href="${item.url}">
                    <i class="${item.icon}"></i>
                    ${item.label}
                </a>
            </li>
        `;
    }
    
    isActiveUrl(itemUrl) {
        const currentPath = window.location.pathname;
        
        // Normalizar las URLs para la comparación
        const normalizedCurrent = currentPath === '/' ? '/admin.html' : currentPath;
        const normalizedItem = itemUrl;
        
        return normalizedCurrent === normalizedItem ||
               (normalizedItem === '/admin.html' && 
                (normalizedCurrent === '/admin' || normalizedCurrent === '/'));
    }

    updateActiveMenuItem() {
        const links = document.querySelectorAll('.menu-items .nav-link');
        links.forEach(link => {
            const isActive = this.isActiveUrl(link.getAttribute('href'));
            link.classList.toggle('active', isActive);
        });
    }

    setupEventListeners(container) {
        // No necesitamos configurar los event listeners aquí
        // ya que el manejo de la navegación se hace en admin.js
    }
}

export default Sidebar; 