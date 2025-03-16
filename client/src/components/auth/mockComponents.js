/**
 * Componentes Mock para Autenticación
 * Proporciona versiones simplificadas para cuando hay errores de carga
 */

/**
 * Componente Header para páginas de autenticación
 */
export class AuthHeader {
    constructor(options = {}) {
        this.className = options.className || 'auth-header';
        console.log('[MOCK] AuthHeader creado con clase:', this.className);
    }

    /**
     * Renderizar el header en el contenedor
     * @param {HTMLElement} container - Elemento donde se renderizará
     */
    render(container) {
        if (!container) {
            console.error('[MOCK] No se proporcionó un contenedor para AuthHeader');
            return;
        }

        container.innerHTML = `
            <div class="d-flex align-items-center justify-content-between w-100">
                <div class="d-flex align-items-center">
                    <img src="/assets/img/logoOficri2x2.png" alt="OFICRI" class="oficri-logo">
                    <span class="d-none d-sm-inline ms-2 text-white fw-bold">OFICRI</span>
                </div>
                <div class="oficri-title">
                    OFICINA DE CRIMINALÍSTICA CUSCO
                </div>
                <div>
                    <img src="/assets/img/logoPolicia2x2.png" alt="Policía Nacional del Perú" class="oficri-logo">
                </div>
            </div>
        `;
        console.log('[MOCK] AuthHeader renderizado');
    }
}

/**
 * Componente Footer para páginas de autenticación
 */
export class AuthFooter {
    constructor(options = {}) {
        this.className = options.className || 'auth-footer';
        console.log('[MOCK] AuthFooter creado con clase:', this.className);
    }

    /**
     * Renderizar el footer en el contenedor
     * @param {HTMLElement} container - Elemento donde se renderizará
     */
    render(container) {
        if (!container) {
            console.error('[MOCK] No se proporcionó un contenedor para AuthFooter');
            return;
        }

        container.innerHTML = `
            <div class="d-flex justify-content-center">
                <span>© ${new Date().getFullYear()} OFICRI - Oficina de Criminalística Cusco</span>
            </div>
        `;
        console.log('[MOCK] AuthFooter renderizado');
    }
}

export default {
    AuthHeader,
    AuthFooter
}; 