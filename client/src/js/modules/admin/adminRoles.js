// Variables globales
let roles = [];
let currentRoleId = null;
let editMode = false;

// Módulo de gestión de roles para el panel de administración

// Función para cargar los roles
async function loadRoles() {
    try {
        console.log('=== INICIO DE CARGA DE ROLES ===');
        console.log('Realizando petición a /api/roles...');
        
        const response = await fetch('/api/roles');
        console.log('Respuesta recibida:', {
            ok: response.ok,
            status: response.status,
            statusText: response.statusText
        });

        if (!response.ok) {
            throw new Error(`Error al cargar roles: ${response.status} - ${response.statusText}`);
        }

        roles = await response.json();
        console.log(`Se encontraron ${roles.length} roles`);
        
        // Actualizar la tabla de roles
        updateRolesTable();
        
        console.log('=== FIN DE CARGA DE ROLES ===');
        return roles;
    } catch (error) {
        console.error('Error al cargar roles:', error);
        window.commonUiHelpers.showError('Error al cargar roles: ' + error.message);
        return [];
    }
}

function updateRolesTable() {
    const table = document.querySelector('#rolesTable');
    if (!table) {
        console.log('No se encontró la tabla de roles');
        return;
    }
    
    // Aplicar estilos a los encabezados
    const headers = table.querySelectorAll('th');
    headers.forEach(header => {
        header.style.backgroundColor = '#004225';
        header.style.color = 'white';
        header.style.padding = '12px';
    });
    
    let tableBody = table.querySelector('#roles-table-body');
    
    // Si no existe el tbody, crearlo
    if (!tableBody) {
        tableBody = document.createElement('tbody');
        tableBody.id = 'roles-table-body';
        table.appendChild(tableBody);
    } else {
        // Limpiar contenido existente
        tableBody.innerHTML = '';
    }
    
    // Si no hay roles, mostrar mensaje
    if (roles.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="6" class="empty-cell">No hay roles registrados</td></tr>';
        return;
    }
    
    // Agregar cada rol a la tabla
    roles.forEach(role => {
        const row = document.createElement('tr');
        row.dataset.roleId = role.IDRol;
        
        // Crear el HTML para los permisos con diferentes colores
        const permisos = [];
        if (role.PuedeCrear) permisos.push('<span class="badge bg-success" title="Puede Crear" style="margin: 0 2px;">C</span>');
        if (role.PuedeEditar) permisos.push('<span class="badge bg-primary" title="Puede Editar" style="margin: 0 2px;">E</span>');
        if (role.PuedeDerivar) permisos.push('<span class="badge bg-info" title="Puede Derivar" style="margin: 0 2px;">D</span>');
        if (role.PuedeAuditar) permisos.push('<span class="badge bg-warning text-dark" title="Puede Auditar" style="margin: 0 2px;">A</span>');
        
        row.innerHTML = `
            <td>${role.IDRol}</td>
            <td>${role.NombreRol}</td>
            <td>${role.NivelAcceso}</td>
            <td>${role.Descripcion || 'Sin descripción'}</td>
            <td class="permisos-cell" style="min-width: 120px;">${permisos.join(' ')}</td>
            <td class="actions-cell">
                <button class="action-btn edit-btn" title="Editar rol"><i class="fas fa-edit"></i></button>
                <button class="action-btn delete-btn" title="Eliminar rol"><i class="fas fa-trash-alt"></i></button>
            </td>
        `;
        
        tableBody.appendChild(row);
    });
    
    // Configurar botones de acción
    configureRoleButtons();
}

function configureRoleButtons() {
    // Configurar botones de edición
    document.querySelectorAll('.edit-btn').forEach(button => {
        button.addEventListener('click', handleEditRoleClick);
    });
    
    // Configurar botones de eliminación
    document.querySelectorAll('.delete-btn').forEach(button => {
        button.addEventListener('click', handleDeleteRoleClick);
    });
}

function handleEditRoleClick(e) {
    const roleId = e.currentTarget.closest('tr').dataset.roleId;
    console.log(`Editando rol con ID: ${roleId}`);
    showRoleModal('edit', roleId);
}

function handleDeleteRoleClick(e) {
    const roleId = e.currentTarget.closest('tr').dataset.roleId;
    console.log(`Eliminando rol con ID: ${roleId}`);
    deleteRole(roleId);
}

function initializeRoles() {
    console.log('Inicializando módulo de roles');
    
    // Configurar evento para el botón de agregar rol
    const addRoleButton = document.getElementById('addRoleBtn');
    if (addRoleButton) {
        addRoleButton.addEventListener('click', () => {
            console.log('Botón de agregar rol clickeado');
            showRoleModal('add');
        });
    }
    
    // Configurar evento para el formulario de rol
    const roleForm = document.getElementById('roleForm');
    if (roleForm) {
        roleForm.addEventListener('submit', handleRoleFormSubmit);
    }
    
    // Cargar roles inicialmente
    loadRoles();
}

function showRoleModal(mode, roleId = null) {
    try {
        console.log(`Mostrando modal de rol en modo: ${mode}`);
        
        // Establecer variables globales
        editMode = mode === 'edit';
        currentRoleId = roleId;
        
        // Obtener referencia al modal
        const modal = document.getElementById('roleModal');
        if (!modal) {
            throw new Error('No se encontró el modal de rol');
        }
        
        // Actualizar título del modal
        const modalTitle = modal.querySelector('.modal-title');
        if (modalTitle) {
            modalTitle.textContent = editMode ? 'Editar Rol' : 'Agregar Nuevo Rol';
        }
        
        // Limpiar formulario
        const form = document.getElementById('roleForm');
        if (form) {
            form.reset();
        }
        
        // Si estamos en modo edición, cargar datos del rol
        if (editMode && roleId) {
            loadRoleDetails(roleId);
        }
        
        // Mostrar modal
        if (typeof bootstrap !== 'undefined') {
            const bsModal = new bootstrap.Modal(modal);
            bsModal.show();
        } else {
            modal.style.display = 'block';
        }
    } catch (error) {
        console.error('Error al mostrar modal de rol:', error);
        window.commonUiHelpers.showError('Error al mostrar modal: ' + error.message);
    }
}

async function loadRoleDetails(roleId) {
    try {
        console.log(`Cargando detalles del rol con ID: ${roleId}`);
        
        // Buscar el rol en la lista cargada
        const role = roles.find(r => r.IDRol == roleId);
        if (!role) {
            // Si no se encuentra en la lista, intentar obtenerlo del servidor
            console.log('Rol no encontrado en la lista, consultando al servidor...');
            const response = await fetch(`/api/roles/${roleId}`);
            
            if (!response.ok) {
                throw new Error(`Error al obtener detalles del rol: ${response.status}`);
            }
            
            const roleData = await response.json();
            console.log('Datos del rol obtenidos del servidor:', roleData);
            
            // Llenar formulario con datos del rol
            document.getElementById('nombreRol').value = roleData.NombreRol || '';
            document.getElementById('nivelAcceso').value = roleData.NivelAcceso || '1';
            document.getElementById('descripcion').value = roleData.Descripcion || '';
            document.getElementById('puedeCrear').checked = Boolean(roleData.PuedeCrear);
            document.getElementById('puedeEditar').checked = Boolean(roleData.PuedeEditar);
            document.getElementById('puedeDerivar').checked = Boolean(roleData.PuedeDerivar);
            document.getElementById('puedeAuditar').checked = Boolean(roleData.PuedeAuditar);
        } else {
            console.log('Datos del rol encontrados en la lista:', role);
            
            // Llenar formulario con datos del rol
            document.getElementById('nombreRol').value = role.NombreRol || '';
            document.getElementById('nivelAcceso').value = role.NivelAcceso || '1';
            document.getElementById('descripcion').value = role.Descripcion || '';
            document.getElementById('puedeCrear').checked = Boolean(role.PuedeCrear);
            document.getElementById('puedeEditar').checked = Boolean(role.PuedeEditar);
            document.getElementById('puedeDerivar').checked = Boolean(role.PuedeDerivar);
            document.getElementById('puedeAuditar').checked = Boolean(role.PuedeAuditar);
        }
    } catch (error) {
        console.error('Error al cargar detalles del rol:', error);
        window.commonUiHelpers.showError('Error al cargar detalles del rol: ' + error.message);
    }
}

async function handleRoleFormSubmit(e) {
    e.preventDefault();
    
    try {
        console.log('=== INICIO DE PROCESAMIENTO DE FORMULARIO DE ROL ===');
        
        // Obtener datos del formulario
        const nombreRol = document.getElementById('nombreRol').value.trim();
        const nivelAcceso = document.getElementById('nivelAcceso').value;
        const descripcion = document.getElementById('descripcion').value.trim();
        const puedeCrear = document.getElementById('puedeCrear').checked;
        const puedeEditar = document.getElementById('puedeEditar').checked;
        const puedeDerivar = document.getElementById('puedeDerivar').checked;
        const puedeAuditar = document.getElementById('puedeAuditar').checked;
        
        // Validar datos
        if (!nombreRol) {
            throw new Error('El nombre del rol es obligatorio');
        }
        
        console.log('Datos del formulario:', {
            nombreRol,
            nivelAcceso,
            descripcion,
            permisos: {
                puedeCrear,
                puedeEditar,
                puedeDerivar,
                puedeAuditar
            },
            modoEdicion: editMode,
            idRol: currentRoleId
        });
        
        // Preparar URL y método según el modo
        const url = editMode ? `/api/roles/${currentRoleId}` : '/api/roles';
        const method = editMode ? 'PUT' : 'POST';
        
        console.log(`Enviando petición ${method} a ${url}...`);
        const response = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                nombreRol,
                nivelAcceso: parseInt(nivelAcceso),
                descripcion,
                puedeCrear,
                puedeEditar,
                puedeDerivar,
                puedeAuditar
            })
        });
        
        console.log('Respuesta recibida:', {
            status: response.status,
            ok: response.ok
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `Error al ${editMode ? 'actualizar' : 'crear'} rol: ${response.status}`);
        }
        
        const data = await response.json();
        console.log(`Rol ${editMode ? 'actualizado' : 'creado'} exitosamente:`, data);
        
        // Cerrar modal
        const modal = document.getElementById('roleModal');
        if (modal) {
            const closeBtn = modal.querySelector('.close-modal');
            if (closeBtn) {
                closeBtn.click();
            }
        }
        
        // Recargar roles
        await loadRoles();
        
        // Mostrar mensaje de éxito
        window.commonUiHelpers.showSuccessMessage(`Rol ${editMode ? 'actualizado' : 'creado'} exitosamente`);
        
        console.log('=== FIN DE PROCESAMIENTO DE FORMULARIO DE ROL ===');
    } catch (error) {
        console.error(`Error al ${editMode ? 'actualizar' : 'crear'} rol:`, error);
        const errorMessageElement = document.getElementById('role-error-message');
        if (errorMessageElement) {
            errorMessageElement.textContent = error.message;
            errorMessageElement.style.display = 'block';
        }
    }
}

async function deleteRole(roleId) {
    try {
        console.log('=== INICIO DE ELIMINACIÓN DE ROL ===');
        
        if (!roleId) {
            throw new Error('ID de rol no válido');
        }
        
        // Confirmar eliminación
        const confirmed = window.commonUiHelpers.showConfirmDialog(
            '¿Está seguro de que desea eliminar este rol? Esta acción no se puede deshacer.',
            async () => {
                try {
                    console.log(`Eliminando rol con ID: ${roleId}`);
                    
                    // Enviar petición al servidor
                    console.log(`Enviando petición a /api/roles/${roleId}...`);
                    const response = await fetch(`/api/roles/${roleId}`, {
                        method: 'DELETE'
                    });
                    
                    console.log('Respuesta recibida:', {
                        status: response.status,
                        ok: response.ok
                    });
                    
                    if (!response.ok) {
                        const errorData = await response.json();
                        throw new Error(errorData.message || `Error al eliminar rol: ${response.status}`);
                    }
                    
                    const data = await response.json();
                    console.log('Rol eliminado exitosamente:', data);
                    
                    // Recargar roles
                    await loadRoles();
                    
                    // Mostrar mensaje de éxito
                    window.commonUiHelpers.showSuccessMessage('Rol eliminado exitosamente');
                } catch (error) {
                    console.error('Error al eliminar rol:', error);
                    window.commonUiHelpers.showError('Error al eliminar rol: ' + error.message);
                }
            }
        );
        
        if (!confirmed) {
            console.log('Eliminación cancelada por el usuario');
            return;
        }
        
        console.log('=== FIN DE ELIMINACIÓN DE ROL ===');
    } catch (error) {
        console.error('Error al eliminar rol:', error);
        window.commonUiHelpers.showError('Error al eliminar rol: ' + error.message);
    }
}

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    initializeRoles();
});

// Exponer funciones globalmente
window.adminModules = window.adminModules || {};
window.adminModules.roles = {
    loadRoles,
    showRoleModal,
    handleRoleFormSubmit,
    deleteRole,
    initializeRoles
};