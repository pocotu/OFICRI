/**
 * Servicio de enrutamiento para la aplicación
 * Maneja la navegación entre páginas y la protección de rutas
 */

import { securityLogger } from './securityLogger.js';
import { securityUtils } from './securityUtils.js';

class RoutingService {
    constructor() {
        this.routes = {
            '/': '/index.html',
            '/login': '/index.html',
            '/mesa-partes': '/mesaPartes.html',
            '/admin': '/admin.html'
        };

        this.protectedRoutes = ['/mesa-partes', '/admin'];
    }

    /**
     * Inicializa el servicio de enrutamiento
     */
    init() {
        // Manejar navegación del navegador
        window.addEventListener('popstate', () => this.handleRoute());
        
        // Manejar clics en enlaces
        document.addEventListener('click', (e) => {
            const link = e.target.closest('a');
            if (link) {
                e.preventDefault();
                this.navigate(link.getAttribute('href'));
            }
        });

        // Manejar ruta inicial
        this.handleRoute();
    }

    /**
     * Maneja la navegación a una nueva ruta
     * @param {string} path - Ruta a navegar
     */
    async navigate(path) {
        try {
            // Verificar si la ruta está protegida
            if (this.protectedRoutes.includes(path)) {
                const isAuthenticated = await securityUtils.checkAuth();
                if (!isAuthenticated) {
                    securityLogger.logSecurityEvent('auth', 'warning', 'Intento de acceso a ruta protegida sin autenticación');
                    this.navigate('/login');
                    return;
                }
            }

            // Actualizar URL
            window.history.pushState({}, '', path);
            
            // Cargar página
            await this.loadPage(path);
            
            securityLogger.logSecurityEvent('navigation', 'info', `Navegación exitosa a ${path}`);
        } catch (error) {
            securityLogger.logSecurityEvent('navigation', 'error', `Error en navegación: ${error.message}`);
            console.error('Error en navegación:', error);
        }
    }

    /**
     * Maneja la ruta actual
     */
    async handleRoute() {
        const path = window.location.pathname;
        await this.loadPage(path);
    }

    /**
     * Carga una página específica
     * @param {string} path - Ruta de la página a cargar
     */
    async loadPage(path) {
        try {
            const pagePath = this.routes[path] || this.routes['/'];
            const response = await fetch(pagePath);
            
            if (!response.ok) {
                throw new Error(`Error al cargar la página: ${response.statusText}`);
            }

            const html = await response.text();
            document.body.innerHTML = html;

            // Inicializar la página
            const scriptPath = pagePath.replace('.html', '.js');
            const script = document.createElement('script');
            script.src = scriptPath;
            document.body.appendChild(script);

            securityLogger.logSecurityEvent('page_load', 'info', `Página cargada exitosamente: ${path}`);
        } catch (error) {
            securityLogger.logSecurityEvent('page_load', 'error', `Error al cargar página: ${error.message}`);
            console.error('Error al cargar página:', error);
            this.showError('Error al cargar la página');
        }
    }

    /**
     * Muestra un mensaje de error al usuario
     * @param {string} message - Mensaje de error
     */
    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'alert alert-danger alert-dismissible fade show';
        errorDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        document.body.insertBefore(errorDiv, document.body.firstChild);
    }
}

export const routingService = new RoutingService(); 