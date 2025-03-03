// Este archivo es un alias para ../uiHelpers.js para mantener compatibilidad
// con código existente que hace referencia a common/uiHelpers.js

// Redirigir a las funciones de uiHelpers.js
window.commonUiHelpers = {
    showNotification: function(message, type) {
        return window.uiHelpers && typeof window.uiHelpers.showNotification === 'function'
            ? window.uiHelpers.showNotification(message, type)
            : console.error('uiHelpers.showNotification no está disponible');
    },
    showConfirmDialog: function(message, onConfirm, onCancel) {
        return window.uiHelpers && typeof window.uiHelpers.showConfirmDialog === 'function'
            ? window.uiHelpers.showConfirmDialog(message, onConfirm, onCancel)
            : console.error('uiHelpers.showConfirmDialog no está disponible');
    },
    showErrorMessage: function(message) {
        return window.uiHelpers && typeof window.uiHelpers.showErrorMessage === 'function'
            ? window.uiHelpers.showErrorMessage(message)
            : console.error('uiHelpers.showErrorMessage no está disponible');
    },
    showSuccessMessage: function(message) {
        return window.uiHelpers && typeof window.uiHelpers.showSuccessMessage === 'function'
            ? window.uiHelpers.showSuccessMessage(message)
            : console.error('uiHelpers.showSuccessMessage no está disponible');
    },
    createModal: function(title, content) {
        return window.uiHelpers && typeof window.uiHelpers.createModal === 'function'
            ? window.uiHelpers.createModal(title, content)
            : console.error('uiHelpers.createModal no está disponible');
    },
    closeModal: function(modalId) {
        return window.uiHelpers && typeof window.uiHelpers.closeModal === 'function'
            ? window.uiHelpers.closeModal(modalId)
            : console.error('uiHelpers.closeModal no está disponible');
    },
    toggleLoader: function(show) {
        return window.uiHelpers && typeof window.uiHelpers.toggleLoader === 'function'
            ? window.uiHelpers.toggleLoader(show)
            : console.error('uiHelpers.toggleLoader no está disponible');
    },
    formatDate: function(dateString) {
        return window.uiHelpers && typeof window.uiHelpers.formatDate === 'function'
            ? window.uiHelpers.formatDate(dateString)
            : console.error('uiHelpers.formatDate no está disponible');
    },
    formatDateTime: function(dateString) {
        return window.uiHelpers && typeof window.uiHelpers.formatDateTime === 'function'
            ? window.uiHelpers.formatDateTime(dateString)
            : console.error('uiHelpers.formatDateTime no está disponible');
    },
    validateForm: function(formId) {
        return window.uiHelpers && typeof window.uiHelpers.validateForm === 'function'
            ? window.uiHelpers.validateForm(formId)
            : console.error('uiHelpers.validateForm no está disponible');
    },
    showError: function(message) {
        return window.uiHelpers && typeof window.uiHelpers.showError === 'function'
            ? window.uiHelpers.showError(message)
            : console.error('uiHelpers.showError no está disponible');
    }
}; 