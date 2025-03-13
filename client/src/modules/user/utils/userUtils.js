/**
 * Utilidades para el módulo de usuarios
 * Funciones auxiliares comunes
 */

// Referencia al modal global
let modalInstance = null;

/**
 * Muestra una alerta usando SweetAlert si está disponible, o un alert nativo
 * @param {string} type - Tipo de alerta (success, error, warning, info)
 * @param {string} message - Mensaje a mostrar
 */
export const showAlert = (type, message) => {
    console.log(`[USER-MODULE] Alerta ${type}: ${message}`);
    
    // Verificar si SweetAlert está disponible
    if (typeof Swal !== 'undefined') {
        const swalOptions = {
            icon: type,
            title: type === 'error' ? 'Error' : 'Éxito',
            text: message,
            confirmButtonText: 'Aceptar',
            confirmButtonColor: type === 'error' ? '#dc3545' : '#28a745'
        };
        
        Swal.fire(swalOptions);
    } else {
        // Fallback a alert nativo si SweetAlert no está disponible
        alert(message);
    }
};

/**
 * Muestra un modal con contenido personalizado
 * @param {string} title - Título del modal
 * @param {string} content - Contenido HTML del modal
 * @param {string} size - Tamaño del modal (sm, md, lg, xl)
 */
export const showModal = (title, content, size = '') => {
    try {
        console.log(`[USER-MODULE] Mostrando modal: ${title}`);
        
        // Verificar si existe un contenedor de modales
        let modalContainer = document.getElementById('modalContainer');
        
        // Si no existe, crear uno
        if (!modalContainer) {
            modalContainer = document.createElement('div');
            modalContainer.id = 'modalContainer';
            document.body.appendChild(modalContainer);
        }
        
        // Crear estructura del modal
        const modalHTML = `
            <div class="modal fade" id="appModal" tabindex="-1" aria-labelledby="modalLabel" aria-hidden="true">
                <div class="modal-dialog ${size ? `modal-${size}` : ''} modal-dialog-centered">
                    <div class="modal-content">
                        ${typeof content === 'string' && content.includes('modal-header') 
                            ? content 
                            : `
                                <div class="modal-header">
                                    <h5 class="modal-title" id="modalLabel">${title}</h5>
                                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                                </div>
                                <div class="modal-body">
                                    ${content}
                                </div>
                            `
                        }
                    </div>
                </div>
            </div>
        `;
        
        // Insertar HTML del modal
        modalContainer.innerHTML = modalHTML;
        
        // Verificar si Bootstrap está disponible
        if (typeof bootstrap !== 'undefined') {
            // Inicializar y mostrar el modal
            const modalElement = document.getElementById('appModal');
            modalInstance = new bootstrap.Modal(modalElement);
            
            // Evento para limpiar al cerrar
            modalElement.addEventListener('hidden.bs.modal', () => {
                modalContainer.innerHTML = '';
                modalInstance = null;
            });
            
            modalInstance.show();
        } else {
            // Fallback si Bootstrap no está disponible
            console.error('[USER-MODULE] Bootstrap no está disponible para mostrar el modal');
            alert(title + '\n\n' + 'El contenido no se puede mostrar en formato modal.');
        }
    } catch (error) {
        console.error('[USER-MODULE] Error al mostrar modal:', error);
    }
};

/**
 * Cierra el modal actual
 */
export const closeModal = () => {
    try {
        console.log('[USER-MODULE] Cerrando modal');
        
        if (modalInstance) {
            modalInstance.hide();
        } else {
            // Buscar el modal por su ID si la instancia no está disponible
            const modalElement = document.getElementById('appModal');
            
            if (modalElement && typeof bootstrap !== 'undefined') {
                const modal = bootstrap.Modal.getInstance(modalElement);
                if (modal) {
                    modal.hide();
                }
            }
        }
    } catch (error) {
        console.error('[USER-MODULE] Error al cerrar modal:', error);
    }
};

/**
 * Fuerza la recarga de la página
 */
export const forcePageReload = () => {
    console.log('[USER-MODULE] Forzando recarga de la página');
    window.location.reload();
}; 