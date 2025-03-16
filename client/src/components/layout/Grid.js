/**
 * Componente Grid
 * Sistema de grid modular basado en Bootstrap
 */

export class Grid {
    constructor(options = {}) {
        this.options = {
            container: options.container || false,
            fluid: options.fluid || false,
            className: options.className || '',
            children: options.children || [],
            ...options
        };
    }

    render(container) {
        const {
            container,
            fluid,
            className,
            children
        } = this.options;

        const gridClasses = [
            container ? (fluid ? 'container-fluid' : 'container') : '',
            className
        ].filter(Boolean).join(' ');

        const template = `
            <div class="${gridClasses}">
                ${children.map(child => child.render()).join('')}
            </div>
        `;

        if (container) {
            container.innerHTML = template;
        }

        return template;
    }

    addChild(child) {
        this.options.children.push(child);
        const gridContainer = document.querySelector(`.${this.options.className}`);
        if (gridContainer) {
            gridContainer.innerHTML += child.render();
        }
    }

    clearChildren() {
        this.options.children = [];
        const gridContainer = document.querySelector(`.${this.options.className}`);
        if (gridContainer) {
            gridContainer.innerHTML = '';
        }
    }
}

export class Row {
    constructor(options = {}) {
        this.options = {
            className: options.className || '',
            children: options.children || [],
            gutters: options.gutters !== false,
            ...options
        };
    }

    render(container) {
        const {
            className,
            children,
            gutters
        } = this.options;

        const rowClasses = [
            'row',
            !gutters ? 'g-0' : '',
            className
        ].filter(Boolean).join(' ');

        const template = `
            <div class="${rowClasses}">
                ${children.map(child => child.render()).join('')}
            </div>
        `;

        if (container) {
            container.innerHTML = template;
        }

        return template;
    }

    addChild(child) {
        this.options.children.push(child);
        const rowContainer = document.querySelector(`.${this.options.className}`);
        if (rowContainer) {
            rowContainer.innerHTML += child.render();
        }
    }

    clearChildren() {
        this.options.children = [];
        const rowContainer = document.querySelector(`.${this.options.className}`);
        if (rowContainer) {
            rowContainer.innerHTML = '';
        }
    }
}

export class Col {
    constructor(options = {}) {
        this.options = {
            xs: options.xs || 12,
            sm: options.sm || null,
            md: options.md || null,
            lg: options.lg || null,
            xl: options.xl || null,
            xxl: options.xxl || null,
            className: options.className || '',
            content: options.content || '',
            ...options
        };
    }

    render(container) {
        const {
            xs,
            sm,
            md,
            lg,
            xl,
            xxl,
            className,
            content
        } = this.options;

        const colClasses = [
            'col',
            xs ? `col-${xs}` : '',
            sm ? `col-sm-${sm}` : '',
            md ? `col-md-${md}` : '',
            lg ? `col-lg-${lg}` : '',
            xl ? `col-xl-${xl}` : '',
            xxl ? `col-xxl-${xxl}` : '',
            className
        ].filter(Boolean).join(' ');

        const template = `
            <div class="${colClasses}">
                ${content}
            </div>
        `;

        if (container) {
            container.innerHTML = template;
        }

        return template;
    }

    setContent(content) {
        this.options.content = content;
        const colElement = document.querySelector(`.${this.options.className}`);
        if (colElement) {
            colElement.innerHTML = content;
        }
    }
}

export default {
    Grid,
    Row,
    Col
}; 