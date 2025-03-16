/**
 * Componente Button
 * Botón genérico reutilizable con diferentes variantes y estados
 */

export class Button {
    constructor(options = {}) {
        this.options = {
            text: options.text || '',
            type: options.type || 'button',
            variant: options.variant || 'primary',
            size: options.size || 'md',
            icon: options.icon || '',
            disabled: options.disabled || false,
            loading: options.loading || false,
            onClick: options.onClick || null,
            className: options.className || '',
            ...options
        };
    }

    render(container) {
        const {
            text,
            type,
            variant,
            size,
            icon,
            disabled,
            loading,
            onClick,
            className
        } = this.options;

        const buttonClasses = [
            'btn',
            `btn-${variant}`,
            `btn-${size}`,
            loading ? 'btn-loading' : '',
            className
        ].filter(Boolean).join(' ');

        const template = `
            <button 
                type="${type}"
                class="${buttonClasses}"
                ${disabled ? 'disabled' : ''}
                ${loading ? 'disabled' : ''}
            >
                ${loading ? '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>' : ''}
                ${icon ? `<i class="${icon} me-2"></i>` : ''}
                ${text}
            </button>
        `;

        if (container) {
            container.innerHTML = template;
            
            if (onClick && !disabled && !loading) {
                const button = container.querySelector('button');
                button.addEventListener('click', onClick);
            }
        }

        return template;
    }

    setLoading(loading) {
        this.options.loading = loading;
        const button = document.querySelector(`.${this.options.className}`);
        if (button) {
            if (loading) {
                button.disabled = true;
                button.innerHTML = `
                    <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    ${this.options.text}
                `;
            } else {
                button.disabled = false;
                button.innerHTML = `
                    ${this.options.icon ? `<i class="${this.options.icon} me-2"></i>` : ''}
                    ${this.options.text}
                `;
            }
        }
    }

    setDisabled(disabled) {
        this.options.disabled = disabled;
        const button = document.querySelector(`.${this.options.className}`);
        if (button) {
            button.disabled = disabled;
        }
    }
}

export default Button; 