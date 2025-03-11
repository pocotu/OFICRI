/**
 * sidebarToggle.js
 * Módulo para controlar la visibilidad del sidebar con un botón hamburguesa
 */

// Clase para gestionar el toggle del sidebar
class SidebarToggle {
    constructor() {
        this.isVisible = false; // Iniciar con el sidebar oculto
        this.mobileBreakpoint = 768; // punto de quiebre para móviles en px
        this.sidebarElement = null;
        this.contentElement = null;
        this.mainElement = null;
        this.buttonElement = null;
        this.adminLayout = null;
        
        // Evento para responsive
        this.handleResize = this.handleResize.bind(this);
    }

    /**
     * Inicializa el toggle del sidebar
     * @param {Object} options - Opciones de configuración
     * @param {String} options.sidebarSelector - Selector del sidebar
     * @param {String} options.contentSelector - Selector del contenido
     * @param {String} options.buttonSelector - Selector del botón toggle
     * @param {String} options.mainSelector - Selector del contenido principal
     * @param {String} options.layoutSelector - Selector del layout admin
     */
    init(options = {}) {
        // Seleccionar elementos del DOM
        this.sidebarElement = document.querySelector(options.sidebarSelector || '.admin-sidebar');
        this.contentElement = document.querySelector(options.contentSelector || '.admin-content');
        this.mainElement = document.querySelector(options.mainSelector || 'main');
        this.buttonElement = document.querySelector(options.buttonSelector || '#sidebar-toggle-btn');
        this.adminLayout = document.querySelector(options.layoutSelector || '.admin-layout');
        
        if (!this.sidebarElement || !this.buttonElement) {
            console.error('No se encontró el sidebar o el botón de toggle');
            return;
        }
        
        // Aplicar el estado inicial (oculto)
        this.updateUI();
        
        // Configurar oyentes de eventos
        this.buttonElement.addEventListener('click', this.toggle.bind(this));
        window.addEventListener('resize', this.handleResize);
        
        console.log('SidebarToggle inicializado correctamente');
    }
    
    /**
     * Alternar la visibilidad del sidebar
     */
    toggle() {
        this.isVisible = !this.isVisible;
        this.updateUI();
    }
    
    /**
     * Muestra el sidebar
     */
    show() {
        this.isVisible = true;
        this.updateUI();
    }
    
    /**
     * Oculta el sidebar
     */
    hide() {
        this.isVisible = false;
        this.updateUI();
    }
    
    /**
     * Actualiza la interfaz según el estado actual
     */
    updateUI() {
        if (!this.sidebarElement) return;
        
        const overlay = document.querySelector('.sidebar-overlay');
        
        if (this.isVisible) {
            this.sidebarElement.classList.remove('hidden');
            this.buttonElement.classList.add('active');
            document.body.classList.add('sidebar-visible');
            
            // Si estamos en mobile, añadir clase para prevenir scroll del body
            if (window.innerWidth <= this.mobileBreakpoint) {
                document.body.classList.add('no-scroll');
            }
        } else {
            this.sidebarElement.classList.add('hidden');
            this.buttonElement.classList.remove('active');
            document.body.classList.remove('sidebar-visible');
            document.body.classList.remove('no-scroll');
        }
        
        // Si la layout grid ya no es compatible con esta implementación
        if (this.adminLayout) {
            if (this.isVisible) {
                this.adminLayout.classList.remove('sidebar-hidden');
            } else {
                this.adminLayout.classList.add('sidebar-hidden');
            }
        }
    }
    
    /**
     * Maneja el cambio de tamaño de la ventana
     */
    handleResize() {
        const isMobile = window.innerWidth <= this.mobileBreakpoint;
        
        // En móviles, ocultar sidebar por defecto
        if (isMobile && this.isVisible) {
            this.hide();
        }
        // En escritorio, mostrar sidebar por defecto
        else if (!isMobile && !this.isVisible) {
            this.show();
        }
    }
    
    /**
     * Limpia los eventos al destruir el componente
     */
    destroy() {
        if (this.buttonElement) {
            this.buttonElement.removeEventListener('click', this.toggle);
        }
        window.removeEventListener('resize', this.handleResize);
    }
}

// Crear instancia única para toda la aplicación
const sidebarToggle = new SidebarToggle();

export default sidebarToggle; 