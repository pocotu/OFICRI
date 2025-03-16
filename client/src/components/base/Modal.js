/**
 * Componente Modal
 * Modal genérico reutilizable con diferentes variantes y opciones
 */

export class Modal {
    constructor(options = {}) {
        this.options = {
            id: options.id || `modal-${Math.random().toString(36).substr(2, 9)}`,
            title: options.title || '',
            content: options.content || '',
            size: options.size || 'md',
            backdrop: options.backdrop || 'static',
            keyboard: options.keyboard !== false,
            className: options.className || '',
            headerActions: options.headerActions || [],
            footerActions: options.footerActions || [],
            onShow: options.onShow || null,
            onHide: options.onHide || null,
            ...options
        };

        this.isVisible = false;
    }

    render(container) {
        const {
            id,
            title,
            content,
            size,
            backdrop,
            keyboard,
            className,
            headerActions,
            footerActions
        } = this.options;

        const modalClasses = [
            'modal fade',
            size !== 'md' ? `modal-${size}` : '',
            className
        ].filter(Boolean).join(' ');

        const template = `
            <div class="${modalClasses}" 
                 id="${id}" 
                 tabindex="-1" 
                 aria-labelledby="${id}Label" 
                 aria-hidden="true"
                 data-bs-backdrop="${backdrop}"
                 data-bs-keyboard="${keyboard}">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title" id="${id}Label">${title}</h5>
                            ${headerActions.length > 0 ? `
                                <div class="modal-header-actions">
                                    ${headerActions.map(action => action.render()).join('')}
                                </div>
                            ` : ''}
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">
                            ${content}
                        </div>
                        ${footerActions.length > 0 ? `
                            <div class="modal-footer">
                                ${footerActions.map(action => action.render()).join('')}
                            </div>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;

        if (container) {
            container.innerHTML = template;
            this.initializeModal();
        }

        return template;
    }

    initializeModal() {
        const modalElement = document.getElementById(this.options.id);
        if (!modalElement) return;

        // Crear instancia de Bootstrap Modal
        this.modal = new bootstrap.Modal(modalElement, {
            backdrop: this.options.backdrop,
            keyboard: this.options.keyboard
        });

        // Agregar event listeners
        modalElement.addEventListener('show.bs.modal', () => {
            this.isVisible = true;
            if (this.options.onShow) {
                this.options.onShow();
            }
        });

        modalElement.addEventListener('hide.bs.modal', () => {
            this.isVisible = false;
            if (this.options.onHide) {
                this.options.onHide();
            }
        });
    }

    show() {
        if (this.modal) {
            this.modal.show();
        }
    }

    hide() {
        if (this.modal) {
            this.modal.hide();
        }
    }

    setContent(content) {
        this.options.content = content;
        const modalBody = document.querySelector(`#${this.options.id} .modal-body`);
        if (modalBody) {
            modalBody.innerHTML = content;
        }
    }

    setTitle(title) {
        this.options.title = title;
        const modalTitle = document.querySelector(`#${this.options.id} .modal-title`);
        if (modalTitle) {
            modalTitle.textContent = title;
        }
    }

    isOpen() {
        return this.isVisible;
    }
}

export default Modal; 