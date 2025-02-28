// Módulo de gestión de roles para el panel de administración

// Función para inicializar el módulo de roles
export async function initializeRoles() {
    console.log('Inicializando módulo de roles...');
    
    // Cargar roles al inicio
    await loadRoles();
    
    // Configurar botón para abrir modal de nuevo rol
    const addRoleBtn = document.getElementById('addRoleBtn');
    if (addRoleBtn) {
        addRoleBtn.addEventListener('click', () => {
            showRoleModal('create');
        });
    }
    
    // Configurar formulario para envío
    const roleForm = document.getElementById('roleForm');
    if (roleForm) {
        roleForm.addEventListener('submit', handleRoleFormSubmit);
    }
    
    // Configurar cerrado de modales
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', () => {
            document.getElementById('roleModal').style.display = 'none';
        });
    });
    
    // Delegación de eventos para botones de acción en la tabla
    document.getElementById('roles-table-body').addEventListener('click', async (e) => {
        const target = e.target.closest('button');
        if (!target) return;
        
        const roleId = target.dataset.roleId;
        
        if (target.classList.contains('edit-role-btn')) {
            await loadRoleDetails(roleId);
        } else if (target.classList.contains('delete-role-btn')) {
            await deleteRole(roleId);
        }
    });
}

// Cargar todos los roles
export async function loadRoles() {
    try {
        const response = await fetch('/api/roles');
        if (!response.ok) {
            throw new Error(`Error al cargar roles: ${response.status}`);
        }
        
        const roles = await response.json();
        renderRolesTable(roles);
    } catch (error) {
        console.error('Error al cargar roles:', error);
        showNotification('Error al cargar roles', 'error');
    }
}

// Renderizar tabla de roles
export function renderRolesTable(roles) {
    const tableBody = document.getElementById('roles-table-body');
    if (!tableBody) return;
    
    tableBody.innerHTML = '';
    
    if (roles.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="6" class="text-center">No hay roles definidos</td></tr>';
        return;
    }
    
    roles.forEach(role => {
        // Crear fila para cada rol
        const row = document.createElement('tr');
        
        // Crear celdas con los datos
        row.innerHTML = `
            <td>${role.IDRol}</td>
            <td>${role.NombreRol}</td>
            <td>${role.NivelAcceso}</td>
            <td>${role.Descripcion || '-'}</td>
            <td>
                <span class="badge ${role.PuedeCrear ? 'badge-success' : 'badge-danger'}" 
                      title="Puede Crear">C</span>
                <span class="badge ${role.PuedeEditar ? 'badge-success' : 'badge-danger'}" 
                      title="Puede Editar">E</span>
                <span class="badge ${role.PuedeDerivar ? 'badge-success' : 'badge-danger'}" 
                      title="Puede Derivar">D</span>
                <span class="badge ${role.PuedeAuditar ? 'badge-success' : 'badge-danger'}" 
                      title="Puede Auditar">A</span>
            </td>
            <td>
                <button class="action-btn edit-role-btn" data-role-id="${role.IDRol}" title="Editar">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="action-btn delete-role-btn" data-role-id="${role.IDRol}" title="Eliminar">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        
        // Añadir la fila a la tabla
        tableBody.appendChild(row);
    });
}

// Mostrar modal para crear/editar rol
export function showRoleModal(mode, roleId = null) {
    const form = document.getElementById('roleForm');
    if (!form) return;
    
    // Limpiar formulario y establecer modo
    form.reset();
    form.dataset.mode = mode;
    form.dataset.roleId = roleId || '';
    
    // Actualizar título según modo
    document.getElementById('roleModalTitle').textContent = 
        mode === 'create' ? 'Agregar Nuevo Rol' : 'Editar Rol';
    
    // Mostrar el modal
    document.getElementById('roleModal').style.display = 'block';
}

// Cargar detalles de un rol para editar
export async function loadRoleDetails(roleId) {
    try {
        const response = await fetch(`/api/roles/${roleId}`);
        if (!response.ok) {
            throw new Error(`Error: ${response.status}`);
        }
        
        const role = await response.json();
        
        // Rellenar formulario con datos del rol
        const form = document.getElementById('roleForm');
        form.dataset.mode = 'edit';
        form.dataset.roleId = roleId;
        
        document.getElementById('nombreRol').value = role.NombreRol;
        document.getElementById('descripcion').value = role.Descripcion || '';
        document.getElementById('nivelAcceso').value = role.NivelAcceso;
        document.getElementById('puedeCrear').checked = Boolean(role.PuedeCrear);
        document.getElementById('puedeEditar').checked = Boolean(role.PuedeEditar);
        document.getElementById('puedeDerivar').checked = Boolean(role.PuedeDerivar);
        document.getElementById('puedeAuditar').checked = Boolean(role.PuedeAuditar);
        
        // Mostrar modal
        showRoleModal('edit', roleId);
        
    } catch (error) {
        console.error('Error al cargar detalles del rol:', error);
        showNotification('No se pudieron cargar los detalles del rol', 'error');
    }
}

// Enviar formulario de rol
export async function handleRoleFormSubmit(e) {
    e.preventDefault();
    
    const form = e.target;
    const isEdit = form.dataset.mode === 'edit';
    const roleId = form.dataset.roleId;
    
    try {
        // Recolectar datos del formulario
        const roleData = {
            nombreRol: document.getElementById('nombreRol').value,
            descripcion: document.getElementById('descripcion').value,
            nivelAcceso: parseInt(document.getElementById('nivelAcceso').value),
            puedeCrear: document.getElementById('puedeCrear').checked,
            puedeEditar: document.getElementById('puedeEditar').checked,
            puedeDerivar: document.getElementById('puedeDerivar').checked,
            puedeAuditar: document.getElementById('puedeAuditar').checked
        };
        
        // Configurar petición según modo (crear o editar)
        const url = isEdit ? `/api/roles/${roleId}` : '/api/roles';
        const method = isEdit ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method: method,
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(roleData)
        });
        
        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.message || `Error ${response.status}`);
        }
        
        // Operación exitosa
        document.getElementById('roleModal').style.display = 'none';
        showNotification(
            isEdit ? 'Rol actualizado correctamente' : 'Rol creado correctamente', 
            'success'
        );
        
        // Recargar lista de roles
        await loadRoles();
        
    } catch (error) {
        console.error('Error al guardar rol:', error);
        document.getElementById('role-error-message').textContent = error.message;
    }
}

// Eliminar rol
export async function deleteRole(roleId) {
    if (!confirm('¿Está seguro de eliminar este rol? Esta acción no se puede deshacer.')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/roles/${roleId}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.message || `Error ${response.status}`);
        }
        
        showNotification('Rol eliminado correctamente', 'success');
        await loadRoles();
        
    } catch (error) {
        console.error('Error al eliminar rol:', error);
        showNotification(error.message, 'error');
    }
}

// Función para mostrar notificaciones
export function showNotification(message, type) {
    // Implementación básica, mejorar con un sistema de notificaciones adecuado
    alert(message); 
}