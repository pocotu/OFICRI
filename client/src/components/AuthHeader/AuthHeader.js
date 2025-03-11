/**
 * Componente AuthHeader
 * Barra de encabezado para las páginas de autenticación
 * Muestra los logos de OFICRI y la Policía Nacional del Perú
 * 
 * Utiliza las variables globales de color definidas en main.css
 * - Fondo: var(--primary-color)
 * - Texto: blanco
 */

export class AuthHeader {
    constructor() {
        console.log('[AUTH-HEADER-DEBUG] Inicializando componente AuthHeader');
    }

    render(container) {
        console.log('[AUTH-HEADER-DEBUG] Renderizando AuthHeader');
        
        const template = `
            <div class="auth-header">
                <div class="auth-header-content">
                    <div class="auth-header-left">
                        <img src="/assets/img/logoOficri2x2.png" alt="Logo OFICRI" class="auth-logo">
                        <span class="auth-title">OFICRI</span>
                    </div>
                    <div class="auth-header-center">
                        <span class="auth-center-title">OFICINA DE CRIMINALÍSTICA CUSCO</span>
                    </div>
                    <div class="auth-header-right">
                        <img src="/assets/img/logoPolicia2x2.png" alt="Logo Policía Nacional del Perú" class="auth-logo">
                    </div>
                </div>
            </div>
        `;

        if (container) {
            container.innerHTML = template;
        }
        
        return template;
    }
}

export default AuthHeader; 