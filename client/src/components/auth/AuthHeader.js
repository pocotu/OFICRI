/**
 * Componente AuthHeader
 * Header para páginas de autenticación
 */

export class AuthHeader {
    constructor(options = {}) {
        this.options = {
            className: options.className || 'oficri-header',
            ...options
        };
    }

    render(container) {
        const template = `
            <div class="d-flex align-items-center justify-content-between w-100">
                <div class="d-flex align-items-center">
                    <img src="/assets/img/logoOficri2x2.png" alt="OFICRI" class="oficri-logo" style="height: 60px; width: auto;">
                    <span class="d-none d-sm-inline ms-2 text-white fw-bold">OFICRI</span>
                </div>
                <div class="oficri-title">
                    OFICINA DE CRIMINALÍSTICA CUSCO
                </div>
                <div>
                    <img src="/assets/img/logoPolicia2x2.png" alt="Policía Nacional del Perú" class="oficri-logo" style="height: 60px; width: auto;">
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