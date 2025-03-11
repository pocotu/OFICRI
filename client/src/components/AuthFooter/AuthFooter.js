/**
 * Componente AuthFooter
 * Pie de página para las páginas de autenticación
 * Muestra información de copyright de OFICRI
 * 
 * Utiliza las variables globales de color definidas en main.css
 * - Fondo: var(--primary-color)
 * - Texto: blanco
 */

export class AuthFooter {
    constructor() {
        console.log('[AUTH-FOOTER-DEBUG] Inicializando componente AuthFooter');
    }

    render(container) {
        console.log('[AUTH-FOOTER-DEBUG] Renderizando AuthFooter');
        
        // Obtener el año actual para el copyright
        const currentYear = new Date().getFullYear();
        
        const template = `
            <div class="auth-footer">
                <div class="auth-footer-content">
                    <span class="auth-footer-text">© ${currentYear} OFICRI Cusco - Todos los derechos reservados</span>
                </div>
            </div>
        `;

        if (container) {
            container.innerHTML = template;
        }
        
        return template;
    }
}

export default AuthFooter; 