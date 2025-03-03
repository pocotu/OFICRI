// Helpers para la interfaz de usuario
function showError(message) {
    const errorDiv = document.querySelector('.error-message');
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
        setTimeout(() => {
            errorDiv.style.display = 'none';
        }, 5000);
    } else {
        alert(message);
    }
}

function setupNavigation() {
    const sections = document.querySelectorAll('.section');
    const navButtons = document.querySelectorAll('.nav-btn');

    // Ocultar todas las secciones excepto la primera al cargar
    sections.forEach((section, index) => {
        if (index === 0) {
            section.classList.add('active');
            section.style.display = 'block';
        } else {
            section.classList.remove('active');
            section.style.display = 'none';
        }
    });

    // Activar el primer botón
    if (navButtons.length > 0) {
        navButtons[0].classList.add('active');
    }

    navButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetId = button.getAttribute('data-target');
            
            sections.forEach(section => {
                if (section.id === targetId) {
                    section.classList.add('active');
                    section.style.display = 'block';
                } else {
                    section.classList.remove('active');
                    section.style.display = 'none';
                }
            });
            
            navButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
        });
    });
}

function setupModals() {
    // Configurar botones para cerrar modales
    document.querySelectorAll('.close-modal').forEach(button => {
        button.addEventListener('click', () => {
            const modal = button.closest('.modal');
            if (modal) {
                modal.style.display = 'none';
                // Limpiar formularios al cerrar
                const form = modal.querySelector('form');
                if (form) form.reset();
            }
        });
    });

    // Cerrar modal al hacer clic fuera
    window.addEventListener('click', (event) => {
        if (event.target.classList.contains('modal')) {
            event.target.style.display = 'none';
            // Limpiar formularios al cerrar
            const form = event.target.querySelector('form');
            if (form) form.reset();
        }
    });
}

function showSection(sectionId) {
    const sections = document.querySelectorAll('.section');
    const navButtons = document.querySelectorAll('.nav-btn');

    sections.forEach(section => {
        if (section.id === sectionId) {
            section.classList.add('active');
            section.style.display = 'block';
        } else {
            section.classList.remove('active');
            section.style.display = 'none';
        }
    });

    navButtons.forEach(button => {
        if (button.getAttribute('data-target') === sectionId) {
            button.classList.add('active');
        } else {
            button.classList.remove('active');
        }
    });
}

// Exponer las funciones globalmente
window.uiHelpers = {
    showError,
    setupNavigation,
    setupModals,
    showSection,
    showNotification: function(message, type) {
        const notification = document.createElement('div');
        notification.className = `notification ${type || 'info'}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    },
    showConfirmDialog: function(message, onConfirm, onCancel) {
        const confirmed = confirm(message);
        if (confirmed && typeof onConfirm === 'function') {
            onConfirm();
        } else if (!confirmed && typeof onCancel === 'function') {
            onCancel();
        }
        return confirmed;
    },
    showErrorMessage: function(message) {
        this.showNotification(message, 'error');
    },
    showSuccessMessage: function(message) {
        this.showNotification(message, 'success');
    },
    createModal: function(title, content) {
        // Implementación básica
        alert(title + "\n\n" + content);
    },
    closeModal: function(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
        }
    },
    toggleLoader: function(show) {
        const loader = document.querySelector('.loader');
        if (loader) {
            loader.style.display = show ? 'flex' : 'none';
        }
    },
    formatDate: function(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES');
    },
    formatDateTime: function(dateString) {
        const date = new Date(dateString);
        return date.toLocaleString('es-ES');
    },
    validateForm: function(formId) {
        const form = document.getElementById(formId);
        return form ? form.checkValidity() : false;
    }
};
