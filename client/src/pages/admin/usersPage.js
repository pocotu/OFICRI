/**
 * PÁGINA DE GESTIÓN DE USUARIOS (VERSIÓN STANDALONE)
 * Este archivo contiene toda la implementación de la página de gestión de usuarios
 * en un solo archivo para evitar importaciones dinámicas.
 */

// Importación del nuevo módulo bundle que contiene todas las funcionalidades
import userBundle from '../../modules/userBundle.js';
import { authService } from '../../services/services.js';

// Permisos simplificados
const permissionUtils = {
    getRolePermissions: function(roleId) {
        // Permisos por defecto según el rol
        return {
            canView: true,
            canCreate: roleId === 1,
            canEdit: roleId === 1,
            canDelete: roleId === 1
        };
    },
    canCreate: function(permissions) {
        return permissions && permissions.canCreate;
    },
    canEdit: function(permissions) {
        return permissions && permissions.canEdit;
    },
    canDelete: function(permissions) {
        return permissions && permissions.canDelete;
    }
};

/**
 * Renderiza el contenido principal de la página de usuarios
 * @returns {string} HTML del contenido
 */
export const renderUsersContent = () => {
    console.log('[USERS-PAGE-BUNDLE] Renderizando contenido principal');
    
    return `
        <div class="module-container users-container">
            <div class="users-header mb-4">
                <h2 class="mb-3">Gestión de Usuarios</h2>
                <div class="users-actions">
                    <button class="btn btn-primary" id="createUserBtn">
                        <i class="fas fa-plus me-2"></i> Nuevo Usuario
                    </button>
                    <button class="btn btn-secondary" id="refreshUsersBtn">
                        <i class="fas fa-sync-alt me-2"></i> Actualizar
                    </button>
                </div>
            </div>
            
            <div class="users-filters mb-4">
                <div class="row w-100">
                    <div class="col-md-4">
                        <input type="text" class="form-control" id="userSearch" placeholder="Buscar usuario...">
                    </div>
                    <div class="col-md-3">
                        <select class="form-select" id="areaFilter">
                            <option value="">Todas las áreas</option>
                        </select>
                    </div>
                    <div class="col-md-3">
                        <select class="form-select" id="roleFilter">
                            <option value="">Todos los roles</option>
                        </select>
                    </div>
                    <div class="col-md-2">
                        <select class="form-select" id="statusFilter">
                            <option value="">Todos los estados</option>
                            <option value="active">Activos</option>
                            <option value="blocked">Bloqueados</option>
                        </select>
                    </div>
                </div>
            </div>
            
            <div class="users-table-container table-responsive w-100 flex-grow-1">
                <div id="usersTableContent">
                    <div class="text-center py-5">
                        <div class="spinner-border text-primary" role="status">
                            <span class="visually-hidden">Cargando...</span>
                        </div>
                        <p class="mt-2">Cargando usuarios...</p>
                    </div>
                </div>
            </div>
        </div>
    `;
};

/**
 * Inicializa la página de usuarios
 */
export const initUsersPage = async () => {
    try {
        console.log('[USERS-PAGE-BUNDLE] Iniciando inicialización de página de usuarios...');
        
        // Verificar autenticación (con fallback)
        let user = authService.getCurrentUser();
        console.log('[USERS-PAGE-BUNDLE] Usuario autenticado obtenido:', user);
        
        // Si no hay usuario, usar uno predeterminado para desarrollo
        if (!user) {
            console.log('[USERS-PAGE-BUNDLE] No se encontró usuario autenticado, usando admin por defecto');
            user = {
                IDUsuario: 1,
                Nombres: 'Admin',
                Apellidos: 'Sistema',
                IDRol: 1,
                IDArea: 1
            };
        }
        
        // Asignar permisos basados en el rol
        const permissions = permissionUtils.getRolePermissions(user.IDRol);
        console.log('[USERS-PAGE-BUNDLE] Permisos del usuario:', permissions);
        
        // Cargar datos iniciales
        await loadInitialData();
        
        // Inicializar eventos
        initializeEvents(permissions);
        
        // Configurar filtros
        setupFilters();
        
        console.log('[USERS-PAGE-BUNDLE] Inicialización de página completada con éxito');
        
    } catch (error) {
        console.error('[USERS-PAGE-BUNDLE] Error al inicializar página de usuarios:', error);
        showError('Error al cargar la página de usuarios: ' + error.message);
    }
};

/**
 * Carga los datos iniciales necesarios
 */
async function loadInitialData() {
    try {
        console.log('[USERS-PAGE-BUNDLE] Iniciando carga de datos...');
        
        // Obtener usuarios desde el módulo
        console.log('[USERS-PAGE-BUNDLE] Llamando a userBundle.getAllUsers()');
        const users = await userBundle.getAllUsers();
        console.log('[USERS-PAGE-BUNDLE] Respuesta de getAllUsers:', users);
        console.log('[USERS-PAGE-BUNDLE] Tipo de datos:', typeof users);
        console.log('[USERS-PAGE-BUNDLE] ¿Es array?', Array.isArray(users));
        console.log('[USERS-PAGE-BUNDLE] Usuarios obtenidos:', users?.length || 0);
        
        if (!users || !Array.isArray(users)) {
            console.error('[USERS-PAGE-BUNDLE] Error: Los datos recibidos no son un array válido');
            throw new Error('Datos de usuarios inválidos');
        }
        
        // Actualizar la tabla con los usuarios
        const tableContainer = document.getElementById('usersTableContent');
        if (tableContainer) {
            console.log('[USERS-PAGE-BUNDLE] Contenedor de tabla encontrado, actualizando contenido');
            
            // Obtener usuario actual y permisos
            console.log('[USERS-PAGE-BUNDLE] Obteniendo usuario actual');
            const user = authService.getCurrentUser();
            console.log('[USERS-PAGE-BUNDLE] Usuario actual:', user);
            
            console.log('[USERS-PAGE-BUNDLE] Calculando permisos');
            const permissions = permissionUtils.getRolePermissions(user?.IDRol || 0);
            console.log('[USERS-PAGE-BUNDLE] Permisos calculados:', permissions);
            
            console.log('[USERS-PAGE-BUNDLE] Llamando a userBundle.renderUsersTable');
            const tableHTML = userBundle.renderUsersTable(users, permissions);
            console.log('[USERS-PAGE-BUNDLE] HTML de la tabla generado:', tableHTML.length, 'caracteres');
            
            // Asignar HTML a la tabla
            tableContainer.innerHTML = tableHTML;
            console.log('[USERS-PAGE-BUNDLE] Tabla actualizada correctamente');
        } else {
            console.error('[USERS-PAGE-BUNDLE] No se encontró el contenedor de la tabla (#usersTableContent)');
            throw new Error('No se encontró el contenedor de la tabla');
        }
    } catch (error) {
        console.error('[USERS-PAGE-BUNDLE] Error al cargar datos iniciales:', error);
        console.error('[USERS-PAGE-BUNDLE] Stack:', error.stack);
        
        // Mostrar error en la interfaz
        const tableContainer = document.getElementById('usersTableContent');
        if (tableContainer) {
            tableContainer.innerHTML = `
                <div class="alert alert-danger">
                    <i class="fas fa-exclamation-triangle me-2"></i>
                    <strong>Error al cargar usuarios:</strong> ${error.message}
                    <p class="mt-2 mb-0">Intente recargar la página o contacte al administrador del sistema.</p>
                </div>
            `;
        }
        
        throw error;
    }
}

/**
 * Inicializa los eventos de la página
 */
function initializeEvents(permissions) {
    console.log('[USERS-PAGE-BUNDLE] Inicializando eventos con permisos:', permissions);
    
    // Inicializar eventos desde el bundle
    userBundle.initUserEvents(permissions);
    
    // Evento para el botón de actualizar (adicional al del bundle)
    const refreshBtn = document.getElementById('refreshUsersBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', (e) => {
            // Si se presiona con Shift, forzar recarga completa sin caché
            if (e.shiftKey) {
                userBundle.forcePageReload();
            } else {
                loadInitialData();
            }
        });
        
        // Agregar título informativo
        refreshBtn.setAttribute('title', 'Click para actualizar datos. Shift+Click para forzar recarga completa sin caché');
    }
    
    // Evento para el botón de crear usuario
    const createBtn = document.getElementById('createUserBtn');
    if (createBtn && permissionUtils.canCreate(permissions)) {
        createBtn.addEventListener('click', () => {
            userBundle.showUserForm();
        });
    } else if (createBtn) {
        createBtn.style.display = 'none';
    }
}

/**
 * Configura los filtros de la tabla
 */
function setupFilters() {
    console.log('[USERS-PAGE-BUNDLE] Configurando filtros...');
    const searchInput = document.getElementById('userSearch');
    const areaFilter = document.getElementById('areaFilter');
    const roleFilter = document.getElementById('roleFilter');
    const statusFilter = document.getElementById('statusFilter');
    
    // Función para aplicar filtros
    const applyFilters = () => {
        const searchTerm = searchInput?.value.toLowerCase() || '';
        const areaValue = areaFilter?.value || '';
        const roleValue = roleFilter?.value || '';
        const statusValue = statusFilter?.value || '';
        
        const rows = document.querySelectorAll('#usersTableContent tbody tr');
        console.log('[USERS-PAGE-BUNDLE] Aplicando filtros a', rows.length, 'filas');
        
        rows.forEach(row => {
            const text = row.textContent.toLowerCase();
            const area = row.querySelector('td:nth-child(6)')?.textContent || '';
            const role = row.querySelector('td:nth-child(7)')?.textContent || '';
            const status = row.querySelector('td:nth-child(8)')?.textContent.toLowerCase() || '';
            
            const matchesSearch = text.includes(searchTerm);
            const matchesArea = !areaValue || area.includes(areaValue);
            const matchesRole = !roleValue || role.includes(roleValue);
            const matchesStatus = !statusValue || 
                                (statusValue === 'active' && status.includes('activo')) ||
                                (statusValue === 'blocked' && status.includes('bloqueado'));
            
            row.style.display = (matchesSearch && matchesArea && matchesRole && matchesStatus) ? '' : 'none';
        });
    };
    
    // Configurar eventos de filtrado
    [searchInput, areaFilter, roleFilter, statusFilter].forEach(element => {
        if (element) {
            element.addEventListener('input', applyFilters);
            element.addEventListener('change', applyFilters);
        }
    });
    
    console.log('[USERS-PAGE-BUNDLE] Filtros configurados correctamente');
}

/**
 * Muestra un mensaje de error
 * @param {string} message - Mensaje de error
 */
function showError(message) {
    console.error('[USERS-PAGE-BUNDLE] Mostrando mensaje de error:', message);
    
    const container = document.getElementById('usersTableContent');
    if (container) {
        container.innerHTML = `
            <div class="alert alert-danger">
                <i class="fas fa-exclamation-triangle me-2"></i>
                ${message}
            </div>
        `;
    }
}

// Exportar todo el módulo como default también
export default {
    renderUsersContent,
    initUsersPage
}; 