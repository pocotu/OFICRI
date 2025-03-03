import { showError } from '../../common/uiHelpers.js';

// Módulo de gestión de roles para el panel de administración

// Función para cargar los roles
export async function loadRoles() {
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
        
        const roles = await response.json();
        console.log('Roles obtenidos:', {
            cantidad: roles.length,
            roles: roles
        });
        
        const tbody = document.querySelector('#roles-table-body');
        if (!tbody) {
            console.error('No se encontró la tabla de roles (#roles-table-body)');
            console.log('Estado del DOM:', {
                tabla: document.getElementById('rolesTable')?.outerHTML,
                seccion: document.getElementById('roles-section')?.outerHTML
            });
            throw new Error('No se encontró la tabla de roles');
        }
        
        console.log('Limpiando tabla existente...');
        tbody.innerHTML = '';
        
        console.log('Procesando roles para mostrar en tabla...');
        roles.forEach(rol => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${rol.IDRol}</td>
                <td>${rol.NombreRol}</td>
                <td>${rol.NivelAcceso}</td>
                <td>${rol.Descripcion || ''}</td>
                <td>
                    <span class="badge ${rol.PuedeCrear ? 'bg-success' : 'bg-secondary'} me-1">Crear</span>
                    <span class="badge ${rol.PuedeEditar ? 'bg-success' : 'bg-secondary'} me-1">Editar</span>
                    <span class="badge ${rol.PuedeDerivar ? 'bg-success' : 'bg-secondary'} me-1">Derivar</span>
                    <span class="badge ${rol.PuedeAuditar ? 'bg-success' : 'bg-secondary'}">Auditar</span>
                </td>
                <td>
                    <button class="btn btn-success btn-sm edit-role-btn" data-role-id="${rol.IDRol}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-danger btn-sm delete-role-btn ms-2" data-role-id="${rol.IDRol}">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });
        
        console.log('Se agregaron', roles.length, 'roles a la tabla');
        console.log('=== FIN DE CARGA DE ROLES ===');
    } catch (error) {
        console.error('Error detallado al cargar roles:', error);
        console.error('Stack trace:', error.stack);
        console.error('Estado del DOM al momento del error:', {
            tabla: document.getElementById('rolesTable')?.outerHTML,
            seccion: document.getElementById('roles-section')?.outerHTML
        });
        showError('Error al cargar la lista de roles');
    }
}

// Función para inicializar el módulo de roles
export function initializeRoles() {
    console.log('=== INICIO DE INICIALIZACIÓN DE ROLES ===');
    
    // Cargar roles iniciales
    loadRoles();
    
    // Configurar botón de agregar rol si existe
    const addRoleBtn = document.querySelector('#addRoleBtn');
    if (addRoleBtn) {
        console.log('Configurando botón de agregar rol...');
        addRoleBtn.addEventListener('click', () => {
            const modal = document.querySelector('#roleModal');
            if (modal) {
                modal.style.display = 'block';
            } else {
                console.error('No se encontró el modal de roles (#roleModal)');
            }
        });
        console.log('Botón de agregar rol configurado');
    } else {
        console.warn('No se encontró el botón de agregar rol (#addRoleBtn)');
    }
    
    // Configurar formulario de roles
    const roleForm = document.querySelector('#roleForm');
    if (roleForm) {
        console.log('Configurando formulario de roles...');
        roleForm.addEventListener('submit', handleRoleFormSubmit);
        console.log('Formulario de roles configurado');
    } else {
        console.warn('No se encontró el formulario de roles (#roleForm)');
    }
    
    console.log('=== FIN DE INICIALIZACIÓN DE ROLES ===');
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