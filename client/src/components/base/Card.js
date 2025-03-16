/**
 * Componente Card
 * Tarjeta genérica reutilizable con diferentes variantes y opciones
 */

export class Card {
    constructor(options = {}) {
        this.options = {
            title: options.title || '',
            subtitle: options.subtitle || '',
            content: options.content || '',
            footer: options.footer || '',
            variant: options.variant || 'default',
            className: options.className || '',
            headerActions: options.headerActions || [],
            footerActions: options.footerActions || [],
            ...options
        };
    }

    render(container) {
        const {
            title,
            subtitle,
            content,
            footer,
            variant,
            className,
            headerActions,
            footerActions
        } = this.options;

        const cardClasses = [
            'card',
            variant !== 'default' ? `card-${variant}` : '',
            className
        ].filter(Boolean).join(' ');

        const template = `
            <div class="${cardClasses}">
                ${(title || subtitle || headerActions.length > 0) ? `
                    <div class="card-header">
                        <div class="d-flex justify-content-between align-items-center">
                            <div>
                                ${title ? `<h5 class="card-title mb-0">${title}</h5>` : ''}
                                ${subtitle ? `<h6 class="card-subtitle text-muted">${subtitle}</h6>` : ''}
                            </div>
                            ${headerActions.length > 0 ? `
                                <div class="card-header-actions">
                                    ${headerActions.map(action => action.render()).join('')}
                                </div>
                            ` : ''}
                        </div>
                    </div>
                ` : ''}
                
                <div class="card-body">
                    ${content}
                </div>

                ${(footer || footerActions.length > 0) ? `
                    <div class="card-footer">
                        <div class="d-flex justify-content-between align-items-center">
                            ${footer ? `<div class="card-footer-text">${footer}</div>` : ''}
                            ${footerActions.length > 0 ? `
                                <div class="card-footer-actions">
                                    ${footerActions.map(action => action.render()).join('')}
                                </div>
                            ` : ''}
                        </div>
                    </div>
                ` : ''}
            </div>
        `;

        if (container) {
            container.innerHTML = template;
        }

        return template;
    }

    setContent(content) {
        this.options.content = content;
        const cardBody = document.querySelector(`.${this.options.className} .card-body`);
        if (cardBody) {
            cardBody.innerHTML = content;
        }
    }

    setTitle(title) {
        this.options.title = title;
        const cardTitle = document.querySelector(`.${this.options.className} .card-title`);
        if (cardTitle) {
            cardTitle.textContent = title;
        }
    }

    setSubtitle(subtitle) {
        this.options.subtitle = subtitle;
        const cardSubtitle = document.querySelector(`.${this.options.className} .card-subtitle`);
        if (cardSubtitle) {
            cardSubtitle.textContent = subtitle;
        }
    }

    setFooter(footer) {
        this.options.footer = footer;
        const cardFooter = document.querySelector(`.${this.options.className} .card-footer-text`);
        if (cardFooter) {
            cardFooter.textContent = footer;
        }
    }
}

export default Card; 