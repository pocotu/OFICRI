/**
 * sidebarToggle.js
 * Módulo para controlar la visibilidad del sidebar con un botón hamburguesa
 */

// Clase para gestionar el toggle del sidebar
class SidebarToggle {
    constructor() {
        this.isVisible = false; // Estado inicial
        this.mobileBreakpoint = 768; // punto de quiebre para móviles en px
        this.sidebarElement = null;
        this.contentElement = null;
        this.buttonElement = null;
        
        // Binding de métodos
        this.handleResize = this.handleResize.bind(this);
        this.toggle = this.toggle.bind(this);
    }

    /**
     * Inicializa el toggle del sidebar
     * @param {Object} options - Opciones de configuración
     * @param {String} options.sidebarSelector - Selector del sidebar
     * @param {String} options.contentSelector - Selector del contenido
     * @param {String} options.buttonSelector - Selector del botón toggle
     */
    init(options = {}) {
        console.log('🔧 SidebarToggle: Inicializando...');
        
        // Seleccionar elementos del DOM
        this.sidebarElement = document.querySelector(options.sidebarSelector || '#sidebarMenu');
        this.contentElement = document.querySelector(options.contentSelector || 'main');
        this.buttonElement = document.querySelector(options.buttonSelector || '#menuToggle');
        
        if (!this.sidebarElement || !this.buttonElement) {
            console.error('🔧 SidebarToggle: No se encontró el sidebar o el botón de toggle');
            return;
        }
        
        // Estado inicial basado en el tamaño de la ventana
        this.isVisible = window.innerWidth >= this.mobileBreakpoint;
        
        // Aplicar estado inicial
        this.updateUI();
        
        // Configurar oyentes de eventos
        this.buttonElement.addEventListener('click', this.handleClick.bind(this));
        window.addEventListener('resize', this.handleResize);
        
        console.log('🔧 SidebarToggle: Inicializado correctamente');
    }
    
    /**
     * Maneja el evento click del botón
     */
    handleClick(e) {
        e.preventDefault();
        e.stopPropagation();
        this.toggle();
    }
    
    /**
     * Alternar la visibilidad del sidebar
     */
    toggle() {
        this.isVisible = !this.isVisible;
        this.updateUI();
        return this.isVisible;
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
        
        // Actualizar clases
        if (this.isVisible) {
            // Mostrar sidebar
            this.sidebarElement.classList.add('show');
            document.body.classList.add('sidebar-visible');
            this.buttonElement.classList.add('active');
            
            // Aplicar transformación directamente
            this.sidebarElement.style.transform = 'translateX(0)';
        } else {
            // Ocultar sidebar
            this.sidebarElement.classList.remove('show');
            document.body.classList.remove('sidebar-visible');
            this.buttonElement.classList.remove('active');
            
            // Aplicar transformación según el dispositivo
            if (window.innerWidth < this.mobileBreakpoint) {
                this.sidebarElement.style.transform = 'translateX(-100%)';
            } else {
                this.sidebarElement.style.transform = 'translateX(-280px)';
            }
        }
    }
    
    /**
     * Maneja el cambio de tamaño de la ventana
     */
    handleResize() {
        const isMobile = window.innerWidth < this.mobileBreakpoint;
        
        // En dispositivos móviles, ocultar el sidebar automáticamente
        if (isMobile && this.isVisible) {
            this.isVisible = false;
            this.updateUI();
        }
    }
    
    /**
     * Limpia los eventos al destruir el componente
     */
    destroy() {
        if (this.buttonElement) {
            this.buttonElement.removeEventListener('click', this.handleClick);
        }
        window.removeEventListener('resize', this.handleResize);
    }
}

// Crear instancia única para toda la aplicación
const sidebarToggle = new SidebarToggle();

export default sidebarToggle; 