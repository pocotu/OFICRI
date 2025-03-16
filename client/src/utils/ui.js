/**
 * Utilidades para la UI
 * 
 * Este archivo proporciona funciones para manipular la interfaz de usuario,
 * especialmente relacionadas con permisos y visualización condicional.
 */

import { hasPermission, PERMISSION } from './permission.js';

/**
 * Muestra u oculta elementos del DOM según los permisos del usuario
 * @param {number} userPermissions - Permisos del usuario
 */
export function applyPermissionsToUI(userPermissions) {
    // Mostrar/ocultar elementos con data-permission
    document.querySelectorAll('[data-permission]').forEach(element => {
        const requiredPermission = parseInt(element.dataset.permission);
        
        if (!requiredPermission || isNaN(requiredPermission)) {
            console.warn('Elemento con data-permission inválido:', element);
            return;
        }
        
        if (hasPermission(userPermissions, requiredPermission)) {
            element.classList.remove('d-none');
        } else {
            element.classList.add('d-none');
        }
    });
    
    // Mostrar/ocultar elementos con class permission-{TIPO}
    Object.entries(PERMISSION).forEach(([name, value]) => {
        const selector = `.permission-${name.toLowerCase()}`;
        document.querySelectorAll(selector).forEach(element => {
            if (hasPermission(userPermissions, value)) {
                element.classList.remove('d-none');
            } else {
                element.classList.add('d-none');
            }
        });
    });
}

/**
 * Renderiza el menú según los permisos y contexto del usuario
 * @param {number} userPermissions - Permisos del usuario
 * @param {string} context - Contexto ('admin', 'mesaPartes', 'area')
 * @param {string} containerId - ID del contenedor donde se renderizará el menú
 */
export function renderMenu(userPermissions, context, containerId = 'sidebar-menu') {
    const { getFilteredMenu } = require('../config/menu.config.js');
    const menuItems = getFilteredMenu(userPermissions, context);
    const container = document.getElementById(containerId);
    
    if (!container) {
        console.error(`Contenedor para el menú no encontrado: ${containerId}`);
        return;
    }
    
    // Limpiar contenedor
    container.innerHTML = '';
    
    // Construir HTML del menú
    menuItems.forEach(item => {
        const hasSubmenu = item.submenu && item.submenu.length > 0;
        const itemHtml = `
            <li class="nav-item ${hasSubmenu ? 'has-submenu' : ''}">
                <a href="${item.url}" class="nav-link ${hasSubmenu ? 'dropdown-toggle' : ''}">
                    <i class="${item.icon}"></i> <span>${item.text}</span>
                    ${hasSubmenu ? '<i class="fa fa-angle-down dropdown-indicator"></i>' : ''}
                </a>
                ${buildSubmenu(item)}
            </li>
        `;
        
        container.innerHTML += itemHtml;
    });
    
    // Inicializar eventos del menú
    initializeMenuEvents();
}

/**
 * Construye el HTML para un submenú
 * @param {Object} item - Elemento de menú
 * @returns {string} - HTML del submenú
 */
function buildSubmenu(item) {
    if (!item.submenu || item.submenu.length === 0) {
        return '';
    }
    
    let submenuHtml = '<ul class="submenu">';
    
    item.submenu.forEach(subItem => {
        submenuHtml += `
            <li>
                <a href="${subItem.url}">
                    ${subItem.icon ? `<i class="${subItem.icon}"></i>` : ''}
                    <span>${subItem.text}</span>
                </a>
            </li>
        `;
    });
    
    submenuHtml += '</ul>';
    return submenuHtml;
}

/**
 * Inicializa eventos para el menú desplegable
 */
function initializeMenuEvents() {
    // Toggle para submenús
    document.querySelectorAll('.has-submenu > a').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const parent = this.parentElement;
            parent.classList.toggle('open');
            
            // Cerrar otros submenús abiertos
            document.querySelectorAll('.has-submenu').forEach(item => {
                if (item !== parent && item.classList.contains('open')) {
                    item.classList.remove('open');
                }
            });
        });
    });
}

/**
 * Habilita/deshabilita un elemento de formulario según los permisos
 * @param {string} elementId - ID del elemento
 * @param {number} userPermissions - Permisos del usuario
 * @param {number} requiredPermission - Permiso requerido
 */
export function setFormElementState(elementId, userPermissions, requiredPermission) {
    const element = document.getElementById(elementId);
    
    if (!element) {
        console.warn(`Elemento no encontrado: ${elementId}`);
        return;
    }
    
    if (hasPermission(userPermissions, requiredPermission)) {
        element.disabled = false;
        element.classList.remove('disabled');
    } else {
        element.disabled = true;
        element.classList.add('disabled');
    }
}

/**
 * Actualiza los botones de acción en una tabla según permisos
 * @param {number} userPermissions - Permisos del usuario
 * @param {string} tableId - ID de la tabla
 * @param {Object} actionConfig - Configuración de acciones (ej: {edit: PERMISSION.EDIT})
 */
export function setupTableActions(userPermissions, tableId, actionConfig) {
    const table = document.getElementById(tableId);
    
    if (!table) {
        console.error(`Tabla no encontrada: ${tableId}`);
        return;
    }
    
    // Por cada fila en el tbody
    table.querySelectorAll('tbody tr').forEach(row => {
        const actionsCell = row.querySelector('td.actions');
        
        if (!actionsCell) return;
        
        // Por cada acción configurada
        Object.entries(actionConfig).forEach(([action, permission]) => {
            const actionButton = actionsCell.querySelector(`.btn-${action}`);
            
            if (actionButton) {
                if (hasPermission(userPermissions, permission)) {
                    actionButton.classList.remove('d-none');
                } else {
                    actionButton.classList.add('d-none');
                }
            }
        });
    });
} 