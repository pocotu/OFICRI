/**
 * Componente AuthFooter
 * Footer para páginas de autenticación
 */

export class AuthFooter {
    constructor(options = {}) {
        this.options = {
            className: options.className || 'oficri-footer',
            ...options
        };
    }

    render(container) {
        const template = `
            <div class="w-100 text-center text-white">
                &copy; ${new Date().getFullYear()} OFICRI Cusco - Todos los derechos reservados
            </div>
        `;

        if (container) {
            container.innerHTML = template;
        }

        return template;
    }
}

export default AuthFooter; 