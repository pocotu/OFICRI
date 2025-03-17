/**
 * Componente MesaPartesSidebar
 * Barra lateral de navegación específica para Mesa de Partes
 */

// Importar módulos
import { authService } from '../../../services/services.js';
import * as sessionService from '../../../services/sessionService.js';
import * as permissionUtils from '../../../utils/permissions.js';
import * as errorHandler from '../../../utils/errorHandler.js';

export class MesaPartesSidebar {
    constructor() {
        console.log('[MESA-PARTES-SIDEBAR] ---- INICIANDO CONSTRUCTOR ----');
        try {
            // Inicializar con valores predeterminados
            this.permissions = 0;
            this.user = null;
            
            // Intentar obtener usuario, pero como puede ser una Promise, 
            // la inicialización real se hará en el método render
            const userResult = sessionService.obtenerUsuarioActual();
            console.log('[MESA-PARTES-SIDEBAR] Resultado de obtenerUsuarioActual:', userResult);
            
            // Verificar si es una Promise o un objeto directo
            if (userResult && typeof userResult.then === 'function') {
                console.log('[MESA-PARTES-SIDEBAR] El resultado es una Promise, se procesará en render()');
                this.userPromise = userResult;
            } else {
                console.log('[MESA-PARTES-SIDEBAR] El resultado es un objeto directo');
                this.user = userResult;
                
                // Inicializar permisos si tenemos usuario directamente
                if (this.user) {
                    // Mesa de Partes tiene bits 0,1,3,4,6 (Crear, Editar, Ver, Derivar, Exportar)
                    // Lo que corresponde a valor 1+2+8+16+64 = 91
                    this.permissions = typeof this.user.permisos === 'number' 
                        ? this.user.permisos 
                        : 91; // Valor por defecto para Mesa de Partes
                    console.log('[MESA-PARTES-SIDEBAR] Permisos asignados:', this.permissions);
                }
            }
        } catch (error) {
            console.error('[MESA-PARTES-SIDEBAR] Error en constructor:', error);
            this.permissions = 0;
        }
        
        // Definir los elementos del menú con sus permisos requeridos
        this.menuItems = [
            {
                icon: 'fas fa-inbox',
                label: 'Documentos Recibidos',
                url: '#documentos-recibidos',
                permission: permissionUtils.PERMISSION.VIEW
            },
            {
                icon: 'fas fa-file-alt',
                label: 'Registro de Expediente',
                url: '#registro-expediente',
                permission: permissionUtils.PERMISSION.CREATE
            },
            {
                icon: 'fas fa-edit',
                label: 'Actualización de Expediente',
                url: '#actualizacion-expediente',
                permission: permissionUtils.PERMISSION.EDIT
            },
            {
                icon: 'fas fa-exchange-alt',
                label: 'Transferencia / Derivación',
                url: '#derivacion',
                permission: permissionUtils.PERMISSION.TRANSFER
            },
            {
                icon: 'fas fa-route',
                label: 'Trazabilidad',
                url: '#trazabilidad',
                permission: permissionUtils.PERMISSION.VIEW
            },
            {
                icon: 'fas fa-clock',
                label: 'Documentos En Proceso',
                url: '#documentos-en-proceso',
                permission: permissionUtils.PERMISSION.VIEW
            },
            {
                icon: 'fas fa-check-circle',
                label: 'Documentos Completados',
                url: '#documentos-completados',
                permission: permissionUtils.PERMISSION.VIEW
            },
            {
                icon: 'fas fa-file-export',
                label: 'Exportar Reportes',
                url: '#exportar',
                permission: permissionUtils.PERMISSION.EXPORT
            }
        ];
        
        console.log('[MESA-PARTES-SIDEBAR] Constructor finalizado');
    }
    
    /**
     * Renderiza el componente
     * @param {HTMLElement} container - Elemento contenedor
     */
    async render(container) {
        console.log('[MESA-PARTES-SIDEBAR] Iniciando renderizado del sidebar');
        
        try {
            // Si tenemos una promesa pendiente, esperarla
            if (this.userPromise) {
                console.log('[MESA-PARTES-SIDEBAR] Esperando promesa de usuario');
                try {
                    this.user = await this.userPromise;
                    console.log('[MESA-PARTES-SIDEBAR] Usuario obtenido de promesa:', this.user);
                    
                    // Mesa de Partes tiene bits 0,1,3,4,6 (Crear, Editar, Ver, Derivar, Exportar)
                    // Lo que corresponde a valor 1+2+8+16+64 = 91
                    this.permissions = typeof this.user?.permisos === 'number'
                        ? this.user.permisos
                        : 91; // Valor por defecto para Mesa de Partes
                        
                    console.log('[MESA-PARTES-SIDEBAR] Permisos asignados tras promesa:', this.permissions);
                } catch (error) {
                    console.error('[MESA-PARTES-SIDEBAR] Error al obtener usuario de promesa:', error);
                    this.permissions = 0;
                }
            }
            
            // Si no tenemos usuario, intentar obtenerlo directamente
            if (!this.user) {
                console.log('[MESA-PARTES-SIDEBAR] No hay usuario, intentando obtenerlo directamente');
                this.user = authService.getCurrentUser();
                
                if (this.user) {
                    // Mesa de Partes tiene bits 0,1,3,4,6 (Crear, Editar, Ver, Derivar, Exportar)
                    // Lo que corresponde a valor 1+2+8+16+64 = 91
                    this.permissions = typeof this.user.permisos === 'number'
                        ? this.user.permisos
                        : 91; // Valor por defecto para Mesa de Partes
                        
                    console.log('[MESA-PARTES-SIDEBAR] Permisos asignados tras obtención directa:', this.permissions);
                } else {
                    console.warn('[MESA-PARTES-SIDEBAR] No se pudo obtener el usuario');
                }
            }
            
            // Construir HTML del sidebar
            const menuItems = this.menuItems
                .filter(item => !item.permission || (this.permissions & item.permission) !== 0)
                .map(item => this.renderMenuItem(item))
                .join('');
            
            // Utilizando el estilo que se muestra en la imagen
            const html = `
                <div class="sidebar-container">
                    <div class="sidebar-header">
                        <h5 class="sidebar-title">Menú Principal</h5>
                    </div>
                    <div class="sidebar-menu">
                        ${menuItems}
                    </div>
                    <div class="sidebar-footer">
                        <a href="#" id="logout-link" class="logout-link">
                            <i class="fas fa-sign-out-alt"></i> Cerrar Sesión
                        </a>
                    </div>
                </div>
            `;
            
            container.innerHTML = html;
            
            // Aplicar estilos adicionales para que coincida con el diseño mostrado
            this.applyStyles(container);
            
            // Actualizar elemento activo
            this.updateActiveMenuItem(container);
            
            // Configurar listeners
            this.setupEventListeners(container);
            
            console.log('[MESA-PARTES-SIDEBAR] Sidebar renderizado correctamente');
        } catch (error) {
            console.error('[MESA-PARTES-SIDEBAR] Error al renderizar sidebar:', error);
            container.innerHTML = `
                <div class="sidebar-container">
                    <div class="sidebar-header">
                        <h5 class="sidebar-title">Menú Principal</h5>
                    </div>
                    <div class="sidebar-menu">
                        <div class="sidebar-error">
                            Error al cargar menú. Intente recargar la página.
                        </div>
                    </div>
                </div>
            `;
        }
    }

    /**
     * Aplica estilos adicionales al sidebar
     * @param {HTMLElement} container - Contenedor del sidebar
     */
    applyStyles(container) {
        // Estilos CSS inline para asegurar que se aplican correctamente
        const styles = `
            <style>
                .sidebar-container {
                    display: flex;
                    flex-direction: column;
                    height: 100%;
                    background-color: #2d3339; /* Color oscuro similar al de la imagen */
                    color: #fff;
                }
                
                .sidebar-header {
                    padding: 15px;
                    background-color: #212529; /* Color más oscuro para el encabezado */
                    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                }
                
                .sidebar-title {
                    margin: 0;
                    font-size: 1rem;
                    font-weight: 500;
                    color: white;
                }
                
                .sidebar-menu {
                    flex: 1;
                    overflow-y: auto;
                    padding: 0;
                }
                
                .sidebar-menu a {
                    display: flex;
                    align-items: center;
                    padding: 12px 15px;
                    color: #fff;
                    text-decoration: none;
                    transition: background-color 0.3s;
                }
                
                .sidebar-menu a:hover {
                    background-color: rgba(255, 255, 255, 0.1);
                }
                
                .sidebar-menu a.active {
                    background-color: rgba(255, 255, 255, 0.2);
                }
                
                .sidebar-menu a i {
                    width: 20px;
                    margin-right: 10px;
                    text-align: center;
                }
                
                .sidebar-footer {
                    padding: 0;
                    background-color: #0f5132; /* Verde oscuro similar al de la imagen */
                    border-top: 1px solid rgba(255, 255, 255, 0.1);
                }
                
                .logout-link {
                    display: flex;
                    align-items: center;
                    padding: 12px 15px;
                    color: #fff;
                    text-decoration: none;
                    transition: background-color 0.3s;
                }
                
                .logout-link:hover {
                    background-color: rgba(0, 0, 0, 0.2);
                }
                
                .logout-link i {
                    margin-right: 10px;
                }
                
                .sidebar-error {
                    padding: 15px;
                    color: #ff5252;
                }
            </style>
        `;
        
        // Agregar los estilos al contenedor
        container.insertAdjacentHTML('beforeend', styles);
    }
    
    /**
     * Renderiza un elemento del menú
     * @param {Object} item - Elemento a renderizar
     * @returns {string} HTML del elemento
     */
    renderMenuItem(item) {
        return `
            <a href="${item.url}" class="${this.isActiveUrl(item.url) ? 'active' : ''}">
                <i class="${item.icon}"></i>
                ${item.label}
            </a>
        `;
    }
    
    /**
     * Verifica si una URL es la activa
     * @param {string} url - URL a verificar
     * @returns {boolean} Verdadero si es la URL activa
     */
    isActiveUrl(url) {
        const currentHash = window.location.hash || '#documentos-recibidos';
        return url === currentHash;
    }
    
    /**
     * Actualiza el elemento activo en el menú
     * @param {HTMLElement} container - Contenedor del sidebar
     */
    updateActiveMenuItem(container) {
        const currentHash = window.location.hash || '#documentos-recibidos';
        const links = container.querySelectorAll('.sidebar-menu a');
        
        links.forEach(link => {
            if (link.getAttribute('href') === currentHash) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
    }
    
    /**
     * Configura los listeners de eventos
     * @param {HTMLElement} container - Contenedor del sidebar
     */
    setupEventListeners(container) {
        // Configurar evento de cierre de sesión
        const logoutLink = container.querySelector('#logout-link');
        if (logoutLink) {
            logoutLink.addEventListener('click', (e) => {
                e.preventDefault();
                
                // Confirmar cierre de sesión
                if (window.confirm('¿Está seguro de cerrar la sesión?')) {
                    authService.logout(true);
                }
            });
        }
        
        // Actualizar elemento activo cuando cambia la URL
        window.addEventListener('hashchange', () => {
            this.updateActiveMenuItem(container);
        });
    }
} 