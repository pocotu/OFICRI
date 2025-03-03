// Importar módulos
import { 
    loadUsers, 
    handleCreateUser, 
    handleEditUser, 
    deleteUser, 
    prepareUserEdit 
} from './userManagement.js';

import { 
    loadAreas,
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
import { initializeRoles } from './adminRoles.js';
import { initializeActivityLogs } from './activityLogs.js';

let isInitialized = false;

// Función principal de inicialización
export async function initializeDashboard() {
    console.log('=== INICIO DE INICIALIZACIÓN DEL DASHBOARD ===');
    
    if (isInitialized) {
        console.log('Dashboard ya inicializado, saltando inicialización');
        return;
    }

    try {
        // Esperar a que el DOM esté completamente cargado
        if (document.readyState !== 'complete') {
            console.log('Esperando a que el DOM se cargue completamente...');
            await new Promise(resolve => {
                window.addEventListener('load', resolve);
            });
        }

        console.log('Configurando navegación...');
        setupDashboardNavigation();
        
        console.log('Configurando event listeners...');
        setupEventListeners();

        // Cargar datos iniciales de la sección activa
        const activeSection = document.querySelector('.section.active');
        if (activeSection) {
            console.log('Cargando datos de la sección activa:', activeSection.id);
            await loadSectionData(activeSection.id);
        } else {
            console.log('No hay sección activa, cargando sección de usuarios por defecto');
            const usersSection = document.getElementById('users-section');
            if (usersSection) {
                usersSection.classList.add('active');
                await loadSectionData('users-section');
            }
        }

        isInitialized = true;
        console.log('=== FIN DE INICIALIZACIÓN DEL DASHBOARD ===');
    } catch (error) {
        console.error('Error en la inicialización del dashboard:', error);
        showError('Error al inicializar el dashboard: ' + error.message);
    }
}

// Configurar navegación del dashboard
function setupDashboardNavigation() {
    const navButtons = document.querySelectorAll('.nav-btn');
    console.log('Botones de navegación encontrados:', navButtons.length);

    navButtons.forEach(button => {
        button.addEventListener('click', async (e) => {
            const targetId = button.dataset.target;
            console.log('Click en botón de navegación:', targetId);

            // Desactivar todos los botones y secciones
            navButtons.forEach(btn => btn.classList.remove('active'));
            document.querySelectorAll('.section').forEach(section => section.classList.remove('active'));

            // Activar el botón y sección seleccionados
            button.classList.add('active');
            const targetSection = document.getElementById(targetId);
            if (targetSection) {
                targetSection.classList.add('active');
                await loadSectionData(targetId);
            }
        });
    });
}

// Función para cargar datos según la sección
async function loadSectionData(sectionId) {
    console.log('=== INICIO DE CARGA DE DATOS PARA SECCIÓN ===', sectionId);
    
    try {
        switch (sectionId) {
            case 'users-section':
                console.log('Iniciando carga de usuarios...');
                await loadUsers();
                break;
            case 'roles-section':
                console.log('Iniciando carga de roles...');
                await initializeRoles();
                break;
            case 'areas-section':
                console.log('Iniciando carga de áreas...');
                await loadAreas();
                break;
            case 'logs-section':
                console.log('Iniciando carga de logs...');
                await initializeActivityLogs();
                break;
            default:
                console.warn('Sección no reconocida:', sectionId);
        }
        
        console.log('=== FIN DE CARGA DE DATOS PARA SECCIÓN ===', sectionId);
    } catch (error) {
        console.error('Error al cargar datos de la sección:', error);
        showError('Error al cargar los datos: ' + error.message);
    }
}

// Configurar event listeners
function setupEventListeners() {
    console.log('Configurando event listeners...');
    
    // Botón de agregar usuario
    const addUserBtn = document.getElementById('addUserButton');
    if (addUserBtn) {
        addUserBtn.addEventListener('click', async () => {
            console.log('Click en botón agregar usuario');
            const modal = document.getElementById('userModal');
            if (modal) {
                try {
                    const form = document.getElementById('createUserForm');
                    if (form) {
                        form.reset();
                        console.log('Formulario reseteado');
                    }

                    // Cargar áreas antes de mostrar el modal
                    const areas = await loadAreas();
                    if (areas && areas.length > 0) {
                        await updateAreaSelects(areas);
                    }

                    const modalInstance = new bootstrap.Modal(modal);
                    modalInstance.show();
                } catch (error) {
                    console.error('Error al preparar el modal:', error);
                    showError('Error al preparar el formulario: ' + error.message);
                }
            }
        });
    }

    // Formularios
    const createUserForm = document.getElementById('createUserForm');
    const editUserForm = document.getElementById('editUserForm');

    if (createUserForm) {
        createUserForm.addEventListener('submit', handleCreateUser);
    }

    if (editUserForm) {
        editUserForm.addEventListener('submit', handleEditUser);
    }

    // Botón de cerrar sesión
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
}

// Inicializar el dashboard cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', initializeDashboard);

// Exportar funciones necesarias
window.prepareUserEdit = prepareUserEdit;
window.deleteUser = deleteUser;
window.downloadLogs = downloadLogs;
window.handleCreateUser = handleCreateUser;
window.handleEditUser = handleEditUser;
window.handleCreateArea = handleCreateArea;
