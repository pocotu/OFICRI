/**
 * Componente Sidebar - OFICRI
 * Maneja la navegación basada en permisos del usuario
 */

import { getCurrentSession } from '../../services/session/sessionManager.js';
import { securityLogger } from '../../services/security/logging.js';
import { PERMISSION } from '../../constants/permissions.js';

export class Sidebar {
    constructor(containerId = 'sidebar-container') {
        this.containerId = containerId;
        this.container = null;
        this.session = null;
        this.menuItems = this.getMenuItems();
    }

    async init() {
        try {
            this.container = document.getElementById(this.containerId);
            if (!this.container) {
                throw new Error('Container no encontrado');
            }

            this.session = await getCurrentSession();
            if (!this.session) {
                throw new Error('No hay sesión activa');
            }

            this.render();
            this.attachEventListeners();
        } catch (error) {
            securityLogger.logSecurityEvent('SIDEBAR_INIT_ERROR', {
                error: error.message,
                timestamp: new Date().toISOString()
            });
            throw error;
        }
    }

    getMenuItems() {
        return [
            {
                id: 'dashboard',
                title: 'Dashboard',
                icon: 'bi-speedometer2',
                url: '/dashboard.html',
                permission: PERMISSION.VIEW
            },
            {
                id: 'documents',
                title: 'Documentos',
                icon: 'bi-file-earmark-text',
                url: '/documents.html',
                permission: PERMISSION.VIEW,
                subItems: [
                    {
                        id: 'documents-received',
                        title: 'Recibidos',
                        url: '/documents.html?type=received',
                        permission: PERMISSION.VIEW
                    },
                    {
                        id: 'documents-process',
                        title: 'En Proceso',
                        url: '/documents.html?type=process',
                        permission: PERMISSION.VIEW
                    },
                    {
                        id: 'documents-completed',
                        title: 'Completados',
                        url: '/documents.html?type=completed',
                        permission: PERMISSION.VIEW
                    }
                ]
            },
            {
                id: 'admin',
                title: 'Administración',
                icon: 'bi-gear',
                url: '/admin.html',
                permission: PERMISSION.AUDIT,
                subItems: [
                    {
                        id: 'admin-users',
                        title: 'Usuarios',
                        url: '/admin/users.html',
                        permission: PERMISSION.AUDIT
                    },
                    {
                        id: 'admin-roles',
                        title: 'Roles',
                        url: '/admin/roles.html',
                        permission: PERMISSION.AUDIT
                    },
                    {
                        id: 'admin-areas',
                        title: 'Áreas',
                        url: '/admin/areas.html',
                        permission: PERMISSION.AUDIT
                    },
                    {
                        id: 'admin-logs',
                        title: 'Registros',
                        url: '/admin/logs.html',
                        permission: PERMISSION.AUDIT
                    }
                ]
            }
        ];
    }

    hasPermission(permission) {
        return (this.session.permisos & permission) !== 0;
    }

    renderMenuItem(item) {
        if (!this.hasPermission(item.permission)) {
            return '';
        }

        let html = `
            <li class="nav-item">
                <a class="nav-link" href="${item.url}" id="${item.id}">
                    <i class="bi ${item.icon}"></i>
                    <span>${item.title}</span>
                </a>
        `;

        if (item.subItems) {
            html += '<ul class="nav flex-column ms-3">';
            item.subItems.forEach(subItem => {
                if (this.hasPermission(subItem.permission)) {
                    html += `
                        <li class="nav-item">
                            <a class="nav-link" href="${subItem.url}" id="${subItem.id}">
                                <i class="bi bi-circle"></i>
                                <span>${subItem.title}</span>
                            </a>
                        </li>
                    `;
                }
            });
            html += '</ul>';
        }

        html += '</li>';
        return html;
    }

    render() {
        let html = `
            <div class="sidebar bg-light">
                <ul class="nav flex-column">
        `;

        this.menuItems.forEach(item => {
            html += this.renderMenuItem(item);
        });

        html += `
                </ul>
            </div>
        `;

        this.container.innerHTML = html;
    }

    attachEventListeners() {
        // Resaltar el ítem activo
        const currentPath = window.location.pathname;
        const menuItems = this.container.querySelectorAll('.nav-link');
        
        menuItems.forEach(item => {
            if (item.getAttribute('href') === currentPath) {
                item.classList.add('active');
            }
        });
    }
} 