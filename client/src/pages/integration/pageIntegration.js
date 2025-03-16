/**
 * Integración de Páginas
 * Maneja la carga y coordinación de componentes en las páginas
 */

import { authService } from '../../services/auth/AuthService.js';
import { sessionManager } from '../../services/session/sessionManager.js';
import { securityLogger } from '../../services/security/securityLogger.js';
import { securityUtils } from '../../services/security/SecurityUtils.js';

export class PageIntegration {
    constructor() {
        this.currentPage = null;
        this.isInitializing = false;
    }

    /**
     * Inicializa una página con sus componentes
     * @param {string} pageName - Nombre de la página a inicializar
     * @param {Object} options - Opciones de inicialización
     * @returns {Promise<void>}
     */
    async initializePage(pageName, options = {}) {
        try {
            if (this.isInitializing) {
                securityLogger.logSecurityEvent('PAGE_INIT_ALREADY_IN_PROGRESS', { pageName });
                return;
            }

            this.isInitializing = true;
            this.currentPage = pageName;

            // Verificar autenticación si es requerida
            if (options.requireAuth !== false) {
                const isAuthenticated = await authService.isAuthenticated();
                if (!isAuthenticated) {
                    securityLogger.logSecurityEvent('AUTH_REQUIRED', { pageName });
                    window.location.replace('/index.html');
                    return;
                }
            }

            // Verificar permisos si se especifican
            if (options.requiredPermissions) {
                const user = await sessionManager.getCurrentUser();
                const hasPermissions = this.checkPermissions(user, options.requiredPermissions);
                if (!hasPermissions) {
                    securityLogger.logSecurityEvent('PERMISSION_DENIED', { 
                        pageName,
                        userId: user?.IDUsuario 
                    });
                    window.location.replace('/dashboard.html');
                    return;
                }
            }

            // Cargar componentes específicos de la página
            await this.loadPageComponents(pageName, options);

            // Registrar evento de inicialización exitosa
            securityLogger.logSecurityEvent('PAGE_INIT_SUCCESS', { pageName });

        } catch (error) {
            securityLogger.logSecurityEvent('PAGE_INIT_ERROR', {
                pageName,
                error: error.message
            });
            throw error;
        } finally {
            this.isInitializing = false;
        }
    }

    /**
     * Verifica los permisos del usuario
     * @param {Object} user - Datos del usuario
     * @param {Array} requiredPermissions - Permisos requeridos
     * @returns {boolean}
     */
    checkPermissions(user, requiredPermissions) {
        if (!user || !user.Permisos) return false;
        
        return requiredPermissions.every(permission => 
            user.Permisos.includes(permission)
        );
    }

    /**
     * Carga los componentes específicos de una página
     * @param {string} pageName - Nombre de la página
     * @param {Object} options - Opciones de carga
     * @returns {Promise<void>}
     */
    async loadPageComponents(pageName, options) {
        const components = options.components || [];
        
        for (const component of components) {
            try {
                // Sanitizar nombre del componente
                const sanitizedName = securityUtils.sanitizeString(component.name);
                
                // Importar dinámicamente el componente
                const module = await import(`../../components/${sanitizedName}/${sanitizedName}.js`);
                
                // Inicializar el componente
                if (module.default) {
                    const instance = new module.default();
                    await instance.initialize(component.options || {});
                }
            } catch (error) {
                securityLogger.logSecurityEvent('COMPONENT_LOAD_ERROR', {
                    pageName,
                    component: component.name,
                    error: error.message
                });
                throw error;
            }
        }
    }

    /**
     * Maneja la navegación entre páginas
     * @param {string} targetPage - Página destino
     * @param {Object} params - Parámetros de navegación
     */
    async navigateTo(targetPage, params = {}) {
        try {
            // Sanitizar parámetros
            const sanitizedParams = securityUtils.sanitizeData(params);
            
            // Construir URL
            const url = new URL(targetPage, window.location.origin);
            Object.entries(sanitizedParams).forEach(([key, value]) => {
                url.searchParams.append(key, value);
            });
            
            // Registrar evento de navegación
            securityLogger.logSecurityEvent('PAGE_NAVIGATION', {
                from: this.currentPage,
                to: targetPage,
                params: sanitizedParams
            });
            
            // Realizar navegación
            window.location.href = url.toString();
        } catch (error) {
            securityLogger.logSecurityEvent('NAVIGATION_ERROR', {
                targetPage,
                error: error.message
            });
            throw error;
        }
    }
}

// Exportar instancia única
export const pageIntegration = new PageIntegration(); 