// Importar módulos
import { 
    loadUsers, 
    renderUsers, 
    handleCreateUser, 
    handleEditUser, 
    deleteUser, 
    prepareUserEdit 
} from './userManagement.js';

import { 
    loadAreas, 
    renderAreas, 
    updateAreaSelects, 
    handleCreateArea 
} from './areaManagement.js';

import { 
    setupLogControls, 
    loadFilteredLogs, 
    downloadLogs 
} from './logManagement.js';

import { 
    formatDate, 
    formatDateTime, 
    getNivelAccesoText 
} from '../../utils/formatters.js';

import { 
    showError, 
    setupNavigation, 
    setupModals 
} from '../../common/uiHelpers.js';

import { handleLogout } from '../../modules/session.js';

// Variables globales
let editingUserId = null;

// Función para inicializar el dashboard
export async function initializeAdmin() {
    console.log('Iniciando inicialización del dashboard admin');
    
    // Esperar a que el DOM esté completamente cargado
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            initializeAdminUI();
        });
    } else {
        await initializeAdminUI();
    }
}

async function initializeAdminUI() {
    try {
        console.log('Inicializando UI del dashboard...');
        
        // Configurar UI primero
        setupUI();
        
        // Luego cargar datos
        await loadInitialData();
        
    } catch (error) {
        console.error('Error en la inicialización:', error);
        showError('Error al inicializar el dashboard');
    }
}

async function loadInitialData() {
    try {
        console.log('Cargando datos iniciales...');
        
        // Cargar áreas primero
        const areas = await loadAreas();
        console.log('Áreas cargadas inicialmente:', areas);
        
        // Actualizar los selectores de área después de que el DOM esté listo
        updateAreaSelects(areas);
        
        // Cargar usuarios después
        await loadUsers();
        console.log('Datos iniciales cargados completamente');
        
    } catch (error) {
        console.error('Error al cargar datos iniciales:', error);
    }
}

// Configurar UI
function setupUI() {
    console.log('Configurando UI...');
    setupNavigation();
    setupModals();
    setupForms();
    setupLogControls();
    setupEventListeners();
    setupLogoutButton();
}

// Configurar formularios
function setupForms() {
    console.log('Configurando formularios...');
    
    const createUserForm = document.getElementById('createUserForm');
    const editUserForm = document.getElementById('editUserForm');
    const createAreaForm = document.getElementById('createAreaForm');

    console.log('Formularios encontrados:', {
        createUser: !!createUserForm,
        editUser: !!editUserForm,
        createArea: !!createAreaForm
    });

    if (createUserForm) {
        createUserForm.addEventListener('submit', handleCreateUser);
        console.log('Event listener agregado a createUserForm');
    }

    if (editUserForm) {
        editUserForm.addEventListener('submit', handleEditUser);
        console.log('Event listener agregado a editUserForm');
    }

    if (createAreaForm) {
        createAreaForm.addEventListener('submit', handleCreateArea);
        console.log('Event listener agregado a createAreaForm');
    }
}

// Configurar event listeners
function setupEventListeners() {
    console.log('Configurando event listeners...');
    
    // Botones para mostrar modales
    const addUserBtn = document.getElementById('addUserButton');
    const addAreaBtn = document.getElementById('addAreaButton');

    console.log('Botones encontrados:', {
        addUser: !!addUserBtn,
        addArea: !!addAreaBtn
    });

    if (addUserBtn) {
        addUserBtn.addEventListener('click', () => {
            console.log('Botón agregar usuario clickeado');
            const modal = document.getElementById('userModal');
            if (modal) {
                // Limpiar el formulario
                const form = document.getElementById('createUserForm');
                if (form) {
                    form.reset();
                    console.log('Formulario de usuario reseteado');
                }
                
                // Actualizar título del modal
                const title = modal.querySelector('.modal-title');
                if (title) title.textContent = 'Agregar Nuevo Usuario';
                
                // Mostrar el modal
                modal.style.display = 'block';
                console.log('Modal de usuario mostrado');
                
                // Actualizar los selectores de área
                loadAreas().then(areas => {
                    if (areas && areas.length > 0) {
                        updateAreaSelects(areas);
                    }
                });
            } else {
                console.error('No se encontró el modal de usuario');
            }
        });
        console.log('Event listener agregado a addUserBtn');
    }

    if (addAreaBtn) {
        addAreaBtn.addEventListener('click', () => {
            console.log('Botón agregar área clickeado');
            const modal = document.getElementById('areaModal');
            if (modal) {
                // Limpiar el formulario
                const form = document.getElementById('createAreaForm');
                if (form) form.reset();
                
                // Actualizar título del modal
                const title = modal.querySelector('.modal-title');
                if (title) title.textContent = 'Agregar Nueva Área';
                
                // Mostrar el modal
                modal.style.display = 'block';
                console.log('Modal de área mostrado');
            } else {
                console.error('No se encontró el modal de área');
            }
        });
        console.log('Event listener agregado a addAreaBtn');
    }

    // Botones para cerrar modales
    document.querySelectorAll('.close-modal').forEach(button => {
        button.addEventListener('click', () => {
            const modal = button.closest('.modal');
            if (modal) {
                modal.style.display = 'none';
                // Limpiar el formulario
                const form = modal.querySelector('form');
                if (form) form.reset();
            }
        });
    });
    console.log('Event listeners agregados a botones de cierre');
}

// Configurar botón de cierre de sesión
function setupLogoutButton() {
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
        console.log('Event listener agregado al botón de cierre de sesión');
    } else {
        console.error('No se encontró el botón de cierre de sesión');
    }
}

// Exportar funciones necesarias para el HTML
window.prepareUserEdit = prepareUserEdit;
window.deleteUser = deleteUser;
window.downloadLogs = downloadLogs;
window.handleCreateUser = handleCreateUser;
window.handleEditUser = handleEditUser;
window.handleCreateArea = handleCreateArea;

// Exportar variables necesarias
window.editingUserId = editingUserId;

// Exportar la función de inicialización
export default initializeAdmin;
