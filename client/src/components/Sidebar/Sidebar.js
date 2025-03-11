/**
 * Componente Sidebar
 * Barra lateral de navegación
 */

// Importar módulos
import { authService } from '../../services/services.js';
import * as sessionManager from '../../services/sessionManager.js';
import * as permissionUtils from '../../utils/permissions.js';
import * as errorHandler from '../../utils/errorHandler.js';

export class Sidebar {
    constructor() {
        console.log('[SIDEBAR-DEBUG] ---- INICIANDO CONSTRUCTOR ----');
        try {
            // Inicializar con valores predeterminados
            this.permissions = 0;
            this.user = null;
            
            // Intentar obtener usuario, pero como puede ser una Promise, 
            // la inicialización real se hará en el método render
            const userResult = sessionManager.obtenerUsuarioActual();
            console.log('[SIDEBAR-DEBUG] Resultado de obtenerUsuarioActual:', userResult);
            
            // Verificar si es una Promise o un objeto directo
            if (userResult && typeof userResult.then === 'function') {
                console.log('[SIDEBAR-DEBUG] El resultado es una Promise, se procesará en render()');
                this.userPromise = userResult;
            } else {
                console.log('[SIDEBAR-DEBUG] El resultado es un objeto directo');
                this.user = userResult;
                
                // Inicializar permisos si tenemos usuario directamente
                if (this.user) {
                    const isAdmin = this.user.IDRol === 1;
                    console.log('[SIDEBAR-DEBUG] ¿Es administrador?:', isAdmin);
                    
                    if (isAdmin) {
                        this.permissions = 255;
                        console.log('[SIDEBAR-DEBUG] Usuario administrador, asignando todos los permisos (255)');
                    } else if (typeof this.user.permisos === 'number') {
                        this.permissions = this.user.permisos;
                        console.log('[SIDEBAR-DEBUG] Asignando permisos del usuario:', this.permissions);
                    } else {
                        this.permissions = permissionUtils.getRolePermissions(this.user.IDRol || 0);
                        console.log('[SIDEBAR-DEBUG] Asignando permisos por rol:', this.permissions);
                    }
                }
            }
            
            console.log('[SIDEBAR-DEBUG] Permisos iniciales asignados:', this.permissions);
        } catch (error) {
            console.error('[SIDEBAR-DEBUG] Error en constructor:', error);
            this.permissions = 0;
        }
        
        // Definir los elementos del menú con sus permisos requeridos
        this.menuItems = [
            {
                icon: 'fas fa-tachometer-alt',
                label: 'Dashboard',
                url: '/admin/index.html',
                permission: null // No requiere permiso especial
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
        
        // Imprimir todos los elementos del menú y sus permisos requeridos
        console.log('[SIDEBAR-DEBUG] Definición de elementos del menú:');
        this.menuItems.forEach(item => {
            console.log(`[SIDEBAR-DEBUG] Menú: ${item.label}, URL: ${item.url}, Permiso requerido: ${item.permission}`);
        });
    }

    async render(container) {
        try {
            console.log('[SIDEBAR-DEBUG] ---- INICIANDO RENDERIZADO ----');
            console.log('[SIDEBAR-DEBUG] Container recibido:', container);
            
            // Si tenemos una Promise pendiente, resolverla primero
            if (this.userPromise && !this.user) {
                console.log('[SIDEBAR-DEBUG] Resolviendo Promise de usuario...');
                try {
                    this.user = await this.userPromise;
                    console.log('[SIDEBAR-DEBUG] Usuario obtenido de Promise:', this.user);
                    
                    // Actualizar permisos basados en el usuario resuelto
                    if (this.user) {
                        const isAdmin = this.user.IDRol === 1;
                        console.log('[SIDEBAR-DEBUG] Usuario resuelto - ¿Es administrador?:', isAdmin);
                        
                        if (isAdmin) {
                            this.permissions = 255;
                            console.log('[SIDEBAR-DEBUG] Usuario administrador, asignando todos los permisos (255)');
                        } else if (typeof this.user.permisos === 'number') {
                            this.permissions = this.user.permisos;
                            console.log('[SIDEBAR-DEBUG] Asignando permisos del usuario:', this.permissions);
                        } else {
                            this.permissions = permissionUtils.getRolePermissions(this.user.IDRol || 0);
                            console.log('[SIDEBAR-DEBUG] Asignando permisos por rol:', this.permissions);
                        }
                    }
                    
                    console.log('[SIDEBAR-DEBUG] Permisos actualizados después de resolver la Promise:', this.permissions);
                } catch (promiseError) {
                    console.error('[SIDEBAR-DEBUG] Error al resolver Promise de usuario:', promiseError);
                }
            }
            
            // Verificar si tenemos usuario y permisos
            if (!this.user) {
                console.warn('[SIDEBAR-DEBUG] No se encontraron datos de usuario, intentando obtenerlos nuevamente');
                try {
                    this.user = await sessionManager.obtenerUsuarioActual();
                    console.log('[SIDEBAR-DEBUG] Usuario recuperado nuevamente:', this.user);
                } catch (error) {
                    console.error('[SIDEBAR-DEBUG] Error al recuperar usuario:', error);
                }
            }
            
            // Verificar que el usuario sea un objeto y no una promesa
            if (this.user && typeof this.user.then === 'function') {
                console.log('[SIDEBAR-DEBUG] El usuario sigue siendo una Promise, esperando resolución...');
                try {
                    this.user = await this.user;
                    console.log('[SIDEBAR-DEBUG] Promise resuelta, usuario obtenido:', this.user);
                } catch (error) {
                    console.error('[SIDEBAR-DEBUG] Error al resolver Promise de usuario:', error);
                }
            }
            
            // Verificación final para administrador
            const isAdmin = this.user && typeof this.user === 'object' && this.user.IDRol === 1;
            console.log('[SIDEBAR-DEBUG] Verificación final - Usuario:', this.user);
            console.log('[SIDEBAR-DEBUG] Verificación final - ¿Es administrador?:', isAdmin);
            console.log('[SIDEBAR-DEBUG] Verificación final - Permisos actuales:', this.permissions);
            
            // Si es administrador, asegurarse de tener todos los permisos
            if (isAdmin && this.permissions !== 255) {
                console.log('[SIDEBAR-DEBUG] Usuario es administrador, actualizando permisos a 255');
                this.permissions = 255;
            }

            // Filtrar elementos del menú según permisos
            let menuItems;
            if (isAdmin) {
                console.log('[SIDEBAR-DEBUG] Usuario administrador - mostrando TODOS los elementos sin filtrar');
                menuItems = [...this.menuItems]; // Crear una copia para no modificar el original
                console.log(`[SIDEBAR-DEBUG] Mostrando ${menuItems.length} elementos para administrador:`, menuItems.map(item => item.label));
            } else {
                console.log('[SIDEBAR-DEBUG] Usuario regular - filtrando elementos por permisos');
                menuItems = this.menuItems.filter(item => {
                    // Si el permiso es null, siempre se muestra (como Dashboard)
                    if (item.permission === null) {
                        console.log(`[SIDEBAR-DEBUG] Item "${item.label}" - No requiere permiso, se muestra siempre`);
                        return true;
                    }
                    
                    // Verificar permiso requerido
                    const hasPermission = permissionUtils.hasPermission(this.permissions, item.permission);
                    console.log(`[SIDEBAR-DEBUG] Item "${item.label}" - Permiso requerido: ${item.permission}, ¿Tiene permiso?: ${hasPermission}, Permisos usuario: ${this.permissions}`);
                    return hasPermission;
                });
            }
            
            console.log('[SIDEBAR-DEBUG] Elementos de menú después de filtrar:', menuItems.map(item => item.label));
            console.log('[SIDEBAR-DEBUG] HTML que se va a generar para los elementos de menú:');
            menuItems.forEach(item => {
                console.log(`[SIDEBAR-DEBUG] HTML para ${item.label}: ${this.renderMenuItem(item)}`);
            });
            
            // Generar la plantilla HTML
            const sidebarHTML = `
                <div class="sidebar-content">
                    <div class="sidebar-header">
                        <h5>Menú Principal</h5>
                    </div>
                    <div class="sidebar-main">
                        <ul class="nav flex-column menu-items">
                            ${menuItems.map(item => this.renderMenuItem(item)).join('')}
                        </ul>
                    </div>
                    <div class="sidebar-footer">
                        <a class="nav-link logout-link" href="#" id="logout-link">
                            <i class="fas fa-sign-out-alt"></i>
                            <span>Cerrar Sesión</span>
                        </a>
                    </div>
                </div>
            `;

            // Insertar el HTML en el contenedor
            if (container) {
                container.innerHTML = sidebarHTML;
                console.log('[SIDEBAR-DEBUG] HTML insertado en el contenedor');
                
                // Configurar los event listeners
                this.setupEventListeners(container);
                console.log('[SIDEBAR-DEBUG] Event listeners configurados');
                
                // Actualizar el elemento activo del menú
                this.updateActiveMenuItem(container);
                console.log('[SIDEBAR-DEBUG] Elemento activo del menú actualizado');
                
                // Renderizado completo
                console.log('[SIDEBAR-DEBUG] Renderizado de Sidebar completado exitosamente');
                console.log('[SIDEBAR-DEBUG] Elementos del menú disponibles:');
                const menuElements = container.querySelectorAll('.nav-item');
                console.log(`[SIDEBAR-DEBUG] Número de elementos encontrados: ${menuElements.length}`);
                menuElements.forEach((el, index) => {
                    console.log(`[SIDEBAR-DEBUG] Elemento #${index+1}: ${el.textContent.trim()}`);
                });
            } else {
                console.error('[SIDEBAR-DEBUG] No se encontró el contenedor para Sidebar');
            }
        } catch (error) {
            console.error('[SIDEBAR-DEBUG] Error al renderizar Sidebar:', error);
            // Código de recuperación...
        }
    }

    renderMenuItem(item) {
        console.log(`[SIDEBAR-DEBUG] Renderizando elemento del menú: ${item.label}`);
        const isActive = this.isActiveUrl(item.url);
        console.log(`[SIDEBAR-DEBUG] ¿El elemento ${item.label} está activo?: ${isActive}`);
        
        // Retorna el HTML para este elemento del menú
        return `
            <li class="nav-item">
                <a class="nav-link ${isActive ? 'active' : ''}" href="${item.url}">
                    <i class="${item.icon}"></i>
                    <span>${item.label}</span>
                </a>
            </li>
        `;
    }
    
    isActiveUrl(itemUrl) {
        try {
            const currentUrl = window.location.pathname;
            console.log(`[SIDEBAR-DEBUG] Comparando URL actual: ${currentUrl} con URL del elemento: ${itemUrl}`);
            return currentUrl.includes(itemUrl) || 
                  (currentUrl.endsWith('/admin/') && itemUrl.includes('/admin/index.html'));
        } catch (error) {
            console.error('[SIDEBAR-DEBUG] Error al comprobar URL activa:', error);
            return false;
        }
    }

    updateActiveMenuItem(container) {
        try {
            if (!container) {
                console.warn('[SIDEBAR-DEBUG] No se proporcionó contenedor para actualizar elemento activo');
                return;
            }
            
            // Obtener todos los enlaces del menú
            const links = container.querySelectorAll('.nav-link:not(#logout-link):not(.logout-link)');
            console.log(`[SIDEBAR-DEBUG] Enlaces del menú encontrados para activar: ${links.length}`);
            
            if (!links || links.length === 0) {
                console.warn('[SIDEBAR-DEBUG] No se encontraron enlaces en el menú para activar');
                return;
            }
            
            // Verificar URL actual
            const currentUrl = window.location.pathname;
            console.log(`[SIDEBAR-DEBUG] URL actual para activación: ${currentUrl}`);
            
            // Remover clase activa de todos los enlaces
            links.forEach(link => link.classList.remove('active'));
            
            // Intentar encontrar coincidencia exacta primero
            let activeFound = false;
            
            // Primera pasada: buscar coincidencia exacta
            for (const link of links) {
                const href = link.getAttribute('href');
                if (href && (currentUrl === href || currentUrl.endsWith(href))) {
                    link.classList.add('active');
                    console.log(`[SIDEBAR-DEBUG] Coincidencia exacta: ${href}`);
                    activeFound = true;
                    break;
                }
            }
            
            // Segunda pasada: buscar coincidencia parcial si no se encontró exacta
            if (!activeFound) {
                for (const link of links) {
                    const href = link.getAttribute('href');
                    if (href && currentUrl.includes(href)) {
                        link.classList.add('active');
                        console.log(`[SIDEBAR-DEBUG] Coincidencia parcial: ${href}`);
                        activeFound = true;
                        break;
                    }
                }
            }
            
            // Si aún no hay coincidencia, activar Dashboard por defecto
            if (!activeFound && links.length > 0) {
                const dashboardLink = Array.from(links).find(link => 
                    link.textContent.trim().includes('Dashboard') ||
                    link.getAttribute('href')?.includes('index.html')
                );
                
                if (dashboardLink) {
                    dashboardLink.classList.add('active');
                    console.log('[SIDEBAR-DEBUG] Activando Dashboard por defecto');
                } else {
                    // Si no se encuentra dashboard, activar el primer enlace
                    links[0].classList.add('active');
                    console.log('[SIDEBAR-DEBUG] Activando primer enlace por defecto');
                }
            }
            
            console.log('[SIDEBAR-DEBUG] Actualización de elemento activo completada');
        } catch (error) {
            console.error('[SIDEBAR-DEBUG] Error al actualizar elemento activo:', error);
        }
    }

    setupEventListeners(container) {
        try {
            console.log('[SIDEBAR-DEBUG] Configurando event listeners para Sidebar');
            
            // Obtener el botón de cierre de sesión (usando múltiples selectores para asegurar que lo encontramos)
            const logoutBtn = container.querySelector('#logout-link') || container.querySelector('.logout-link') || container.querySelector('.nav-link-logout');
            console.log('[SIDEBAR-DEBUG] Botón de logout encontrado:', !!logoutBtn);
            
            if (logoutBtn) {
                logoutBtn.addEventListener('click', async (e) => {
                    console.log('[SIDEBAR-DEBUG] Evento click en botón de logout detectado');
                    e.preventDefault();
                    
                    try {
                        // Mostrar indicador de carga
                        const loadingOverlay = document.getElementById('loadingOverlay');
                        if (loadingOverlay) {
                            console.log('[SIDEBAR-DEBUG] Mostrando overlay de carga');
                            loadingOverlay.style.display = 'flex';
                            const loadingMessage = loadingOverlay.querySelector('h4');
                            if (loadingMessage) {
                                loadingMessage.textContent = 'Cerrando sesión y limpiando caché...';
                            }
                        }
                        
                        // Limpiar caché de navegación si es posible
                        try {
                            console.log('[SIDEBAR-DEBUG] Intentando limpiar caché del navegador');
                            
                            // Intentar limpiar caché si el navegador lo soporta
                            if (window.caches && typeof window.caches.keys === 'function') {
                                window.caches.keys().then(cacheNames => {
                                    cacheNames.forEach(cacheName => {
                                        window.caches.delete(cacheName).catch(() => {});
                                    });
                                }).catch(() => {});
                            }
                            
                            // Forzar recarga sin caché para la próxima visita
                            if ('serviceWorker' in navigator) {
                                navigator.serviceWorker.getRegistrations().then(registrations => {
                                    registrations.forEach(registration => {
                                        registration.unregister();
                                    });
                                }).catch(() => {});
                            }
                            
                            console.log('[SIDEBAR-DEBUG] Proceso de limpieza de caché completado');
                        } catch (cacheError) {
                            console.warn('[SIDEBAR-DEBUG] Error al limpiar caché:', cacheError);
                        }
                        
                        // Intentar usar el servicio de autenticación
                        console.log('[SIDEBAR-DEBUG] Intentando cerrar sesión con authService');
                        if (typeof authService !== 'undefined' && authService.logout) {
                            await authService.logout();
                            console.log('[SIDEBAR-DEBUG] Sesión cerrada exitosamente');
                        } else {
                            // Fallback a sessionManager
                            console.log('[SIDEBAR-DEBUG] authService no disponible, usando sessionManager');
                            sessionManager.cerrarSesion();
                            console.log('[SIDEBAR-DEBUG] Sesión cerrada con sessionManager');
                        }
                        
                        // Pequeña pausa para asegurar que se complete la limpieza
                        console.log('[SIDEBAR-DEBUG] Esperando para redirección...');
                        setTimeout(() => {
                            // Redirigir a login
                            console.log('[SIDEBAR-DEBUG] Redirigiendo a login.html');
                            window.location.href = '/login.html';
                        }, 500);
                    } catch (error) {
                        console.error('[SIDEBAR-DEBUG] Error al cerrar sesión:', error);
                        // En caso de error, forzar redirección a login
                        window.location.href = '/login.html';
                    }
                });
                console.log('[SIDEBAR-DEBUG] Event listener para logout configurado');
            }
            
            // Configurar eventos para los elementos del menú
            const menuLinks = container.querySelectorAll('.nav-link');
            console.log(`[SIDEBAR-DEBUG] Enlaces de menú encontrados: ${menuLinks.length}`);
            
            menuLinks.forEach(link => {
                link.addEventListener('click', () => {
                    console.log(`[SIDEBAR-DEBUG] Click en enlace de menú: ${link.textContent.trim()}`);
                    // Marcarlo como activo después de la navegación
                    this.updateActiveMenuItem(container);
                });
            });
            console.log('[SIDEBAR-DEBUG] Event listeners para enlaces de menú configurados');
        } catch (error) {
            console.error('[SIDEBAR-DEBUG] Error al configurar event listeners:', error);
        }
    }
}

export default Sidebar; 