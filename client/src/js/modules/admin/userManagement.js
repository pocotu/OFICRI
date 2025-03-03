// Variables globales
let editingUserId = null;

// Gestión de usuarios
async function loadUsers() {
    try {
        console.log('=== INICIO DE CARGA DE USUARIOS ===');
        
        // Buscar la tabla existente
        const table = document.querySelector('#gestionUsuariosTable');
        if (!table) {
            console.error('No se encontró la tabla de usuarios');
            throw new Error('No se encontró la tabla de usuarios (#gestionUsuariosTable)');
        }

        // Actualizar los encabezados de la tabla
        const thead = table.querySelector('thead');
        if (thead) {
            thead.innerHTML = `
                <tr class="table-header">
                    <th>Usuario</th>
                    <th>Área</th>
                    <th>Nivel de Acceso</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                </tr>
            `;
        }

        let tableBody = table.querySelector('tbody');
        
        // Si no existe el tbody, crearlo
        if (!tableBody) {
            tableBody = document.createElement('tbody');
            table.appendChild(tableBody);
        }
        
        // Limpiar contenido existente SIEMPRE antes de cargar
        tableBody.innerHTML = '<tr><td colspan="5" class="loading-cell">Cargando usuarios...</td></tr>';

        console.log('Realizando petición a /api/users...');
        const timestamp = new Date().getTime();
        const response = await fetch(`/api/users?_=${timestamp}`, {
            method: 'GET',
            headers: {
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
            }
        });
        
        console.log('Respuesta recibida:', {
            status: response.status,
            ok: response.ok,
            statusText: response.statusText
        });
        
        if (!response.ok) {
            throw new Error(`Error al cargar usuarios: ${response.status}`);
        }

        const users = await response.json();
        console.log('Datos de usuarios recibidos:', JSON.stringify(users, null, 2));

        // Limpiar contenido existente
        tableBody.innerHTML = '';
        
        // Si no hay usuarios, mostrar mensaje
        if (!Array.isArray(users) || users.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="5" class="empty-cell">No hay usuarios registrados</td></tr>';
            return;
        }
        
        // Agregar cada usuario a la tabla
        users.forEach(user => {
            const row = document.createElement('tr');
            row.dataset.userId = user.IDUsuario;
            
            // Mapear los campos de la API a los campos que espera la interfaz
            const mappedUser = {
                id: user.IDUsuario,
                username: user.Username,
                area: user.NombreArea,
                nivelAcceso: user.NivelAcceso,
                idArea: user.IDArea,
                idRol: user.IDRol,
                bloqueado: user.Bloqueado
            };
            
            console.log('Agregando usuario a la tabla:', mappedUser);

            // Verificar si es el usuario administrador (username === 'admin')
            const isAdmin = mappedUser.username.toLowerCase() === 'admin';
            
            row.innerHTML = `
                <td>${mappedUser.username}</td>
                <td>${mappedUser.area || 'Sin área'}</td>
                <td>${window.formatters ? window.formatters.getNivelAccesoText(mappedUser.nivelAcceso) : mappedUser.nivelAcceso}</td>
                <td class="text-center">
                    <span class="badge ${mappedUser.bloqueado ? 'bg-danger' : 'bg-success'}">
                        ${mappedUser.bloqueado ? 'BLOQUEADO' : 'ACTIVO'}
                    </span>
                </td>
                <td class="actions-cell text-center">
                    ${isAdmin ? 
                        '<span class="text-muted"><i class="fas fa-lock"></i> No editable</span>' :
                        `<button class="action-btn edit-btn" title="Editar usuario">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="action-btn delete-btn" title="Eliminar usuario permanentemente">
                            <i class="fas fa-trash-alt"></i>
                        </button>`
                    }
                </td>
            `;
            
            tableBody.appendChild(row);
        });

        // Configurar botones de acción (solo para usuarios no administradores)
        configureUserButtons();
        
        console.log('=== FIN DE CARGA DE USUARIOS ===');
    } catch (error) {
        console.error('Error al cargar usuarios:', error);
        if (window.uiHelpers) {
            window.uiHelpers.showError('Error al cargar usuarios: ' + error.message);
        } else {
            alert('Error al cargar usuarios: ' + error.message);
        }
    }
}

function configureUserButtons() {
    // Configurar botones de edición
    document.querySelectorAll('.edit-btn').forEach(button => {
        button.addEventListener('click', handleEditClick);
    });

    // Configurar botones de eliminación
    document.querySelectorAll('.delete-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const userId = e.currentTarget.closest('tr').dataset.userId;
            console.log(`Eliminando usuario con ID: ${userId}`);
            deleteUser(userId);
        });
    });
}

function handleEditClick(e) {
    const userId = e.currentTarget.closest('tr').dataset.userId;
    console.log(`Editando usuario con ID: ${userId}`);
        prepareUserEdit(userId);
}

async function handleCreateUser(e) {
    e.preventDefault();
    
    try {
        console.log('=== INICIO DE CREACIÓN DE USUARIO ===');
        
        // Obtener el formulario
        const form = e.target;
        console.log('Formulario:', form);
        
        // Obtener datos del formulario
        const username = form.querySelector('#username').value.trim();
        const password = form.querySelector('#password').value.trim();
        const areaId = form.querySelector('#area').value;
        
        console.log('Datos capturados:', { username, areaId });
        
        // Validar datos
        if (!username || !password || !areaId) {
            throw new Error('Todos los campos son obligatorios');
        }
        
        // Obtener privilegios seleccionados
        const privilegios = {
            puedeCrear: form.querySelector('#priv-crear').checked,
            puedeEditar: form.querySelector('#priv-editar').checked,
            puedeEliminar: form.querySelector('#priv-eliminar').checked,
            puedeVer: form.querySelector('#priv-ver').checked
        };
        
        // Calcular nivel de acceso basado en privilegios
        let nivelAcceso = 0;
        if (privilegios.puedeCrear) nivelAcceso |= 1;
        if (privilegios.puedeEditar) nivelAcceso |= 2;
        if (privilegios.puedeEliminar) nivelAcceso |= 4;
        if (privilegios.puedeVer) nivelAcceso |= 8;
        
        console.log('Datos del nuevo usuario:', {
            username,
            areaId,
            privilegios,
            nivelAcceso
        });
        
        // Enviar datos al servidor
        console.log('Enviando petición a /api/users...');
            const response = await fetch('/api/users', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    username,
                    password,
                idArea: areaId,
                nivelAcceso
                })
            });

        console.log('Respuesta recibida:', {
            status: response.status,
            ok: response.ok
        });

            if (!response.ok) {
                const errorData = await response.json();
            throw new Error(errorData.message || `Error al crear usuario: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Usuario creado exitosamente:', data);
        
        // Cerrar modal
        const modal = document.getElementById('userModal');
        if (modal && typeof bootstrap !== 'undefined') {
            const bsModal = bootstrap.Modal.getInstance(modal);
            if (bsModal) {
                bsModal.hide();
            }
        }
        
        // Limpiar formulario
            form.reset();
        
        // Recargar lista de usuarios
        await loadUsers();
        
        // Mostrar mensaje de éxito
        if (window.uiHelpers) {
            window.uiHelpers.showSuccessMessage('Usuario creado exitosamente');
        } else {
            alert('Usuario creado exitosamente');
        }
        
        console.log('=== FIN DE CREACIÓN DE USUARIO ===');
    } catch (error) {
        console.error('Error al crear usuario:', error);
        if (window.uiHelpers) {
            window.uiHelpers.showError('Error al crear usuario: ' + error.message);
        } else {
            alert('Error al crear usuario: ' + error.message);
        }
    }
}

async function handleEditUser(e) {
    e.preventDefault();
    
    try {
        console.log('=== INICIO DE EDICIÓN DE USUARIO ===');
        
    if (!editingUserId) {
            throw new Error('No se ha seleccionado un usuario para editar');
        }
        
        // Obtener datos del formulario
        const username = document.getElementById('edit-username').value.trim();
        const areaId = document.getElementById('edit-area').value;
        
        // Obtener privilegios seleccionados
        const privilegios = {
            puedeCrear: document.getElementById('edit-crear').checked,
            puedeEditar: document.getElementById('edit-editar').checked,
            puedeEliminar: document.getElementById('edit-eliminar').checked,
            puedeVer: document.getElementById('edit-ver').checked
        };
        
        // Calcular nivel de acceso basado en privilegios
        let nivelAcceso = 0;
        if (privilegios.puedeCrear) nivelAcceso |= 1;
        if (privilegios.puedeEditar) nivelAcceso |= 2;
        if (privilegios.puedeEliminar) nivelAcceso |= 4;
        if (privilegios.puedeVer) nivelAcceso |= 8;
        
        // Validar datos
        if (!username || !areaId) {
            throw new Error('El nombre de usuario y el área son obligatorios');
        }
        
        console.log('Datos actualizados del usuario:', {
            id: editingUserId,
            username,
            areaId,
            privilegios,
            nivelAcceso
        });

        // Enviar datos al servidor
        console.log(`Enviando petición a /api/users/${editingUserId}...`);
        const response = await fetch(`/api/users/${editingUserId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username,
                idArea: areaId,
                nivelAcceso
            })
        });

        console.log('Respuesta recibida:', {
            status: response.status,
            ok: response.ok
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `Error al actualizar usuario: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Usuario actualizado exitosamente:', data);
        
        // Cerrar modal
        const modal = document.getElementById('editUserModal');
        if (modal && typeof bootstrap !== 'undefined') {
            const bsModal = bootstrap.Modal.getInstance(modal);
            if (bsModal) {
                bsModal.hide();
            }
        }
        
        // Limpiar formulario y variable global
        document.getElementById('editUserForm').reset();
        editingUserId = null;
        
        // Recargar lista de usuarios
            await loadUsers();

        // Mostrar mensaje de éxito
        if (window.uiHelpers) {
            window.uiHelpers.showSuccessMessage('Usuario actualizado exitosamente');
        } else {
            alert('Usuario actualizado exitosamente');
        }
        
        console.log('=== FIN DE EDICIÓN DE USUARIO ===');
    } catch (error) {
        console.error('Error al actualizar usuario:', error);
        if (window.uiHelpers) {
            window.uiHelpers.showError('Error al actualizar usuario: ' + error.message);
        } else {
            alert('Error al actualizar usuario: ' + error.message);
        }
    }
}

async function deleteUser(userId) {
    try {
        console.log('=== INICIO DE ELIMINACIÓN DE USUARIO ===');
        
        if (!userId) {
            throw new Error('ID de usuario no válido');
        }

        // Verificar si es el usuario administrador
        const userCheckResponse = await fetch(`/api/users/${userId}`);
        if (!userCheckResponse.ok) {
            throw new Error(`Error al obtener datos del usuario: ${userCheckResponse.status}`);
        }
        const userData = await userCheckResponse.json();
        if (userData.Username.toLowerCase() === 'admin') {
            throw new Error('No se puede eliminar al usuario administrador del sistema');
        }
        
        // Confirmar eliminación
        const confirmMessage = 'ADVERTENCIA: Esta acción eliminará PERMANENTEMENTE el usuario y todos sus registros relacionados.\n' +
            'Esta acción NO SE PUEDE DESHACER y se perderá todo el historial asociado al usuario.\n\n' +
            '¿Está COMPLETAMENTE SEGURO de que desea ELIMINAR este usuario?';
        if (!confirm(confirmMessage)) {
            console.log('Eliminación cancelada por el usuario');
            return;
        }

        // Segunda confirmación para asegurarse
        if (!confirm('¿REALMENTE desea eliminar permanentemente este usuario? Esta es su última oportunidad para cancelar.')) {
            console.log('Eliminación cancelada en la segunda confirmación');
            return;
        }

        // Solicitar credenciales del administrador
        const adminUsername = prompt('Por favor, ingrese su nombre de usuario de administrador:');
        if (!adminUsername) {
            console.log('Eliminación cancelada: No se proporcionó nombre de usuario');
            return;
        }

        const adminPassword = prompt('Por favor, ingrese su contraseña de administrador:');
        if (!adminPassword) {
            console.log('Eliminación cancelada: No se proporcionó contraseña');
            return;
        }
        
        console.log(`Eliminando permanentemente usuario con ID: ${userId}`);
        console.log('Credenciales proporcionadas:', {
            username: adminUsername,
            password: '*'.repeat(adminPassword.length)
        });
        
        // Enviar petición al servidor
        console.log(`Enviando petición a /api/users/${userId}...`);
        const requestBody = {
            adminUsername,
            adminPassword,
            permanentDelete: true,
            hardDelete: true,
            cascade: true
        };
        console.log('Cuerpo de la petición:', JSON.stringify(requestBody, (key, value) => 
            key === 'adminPassword' ? '*'.repeat(value.length) : value
        ));

        const timestamp = new Date().getTime();
        const response = await fetch(`/api/users/${userId}?_=${timestamp}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
            },
            body: JSON.stringify(requestBody)
        });
        
        console.log('Respuesta recibida:', {
            status: response.status,
            ok: response.ok,
            statusText: response.statusText
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.log('Error data:', errorData);
            throw new Error(errorData.message || `Error al eliminar usuario: ${response.status}`);
        }

        // Intentar obtener el cuerpo de la respuesta
        try {
        const responseData = await response.json();
            console.log('Datos de respuesta:', responseData);
        } catch (e) {
            console.log('No hay datos en la respuesta');
        }
        
        // Esperar un momento antes de recargar la lista
        console.log('Esperando antes de recargar la lista...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Recargar lista de usuarios forzando actualización
        console.log('Recargando lista de usuarios...');
        await loadUsers();
        
        // Mostrar mensaje de éxito
        if (window.uiHelpers) {
            window.uiHelpers.showSuccessMessage('Usuario eliminado permanentemente');
        } else {
            alert('Usuario eliminado permanentemente');
        }
        
        console.log('=== FIN DE ELIMINACIÓN DE USUARIO ===');
    } catch (error) {
        console.error('Error al eliminar usuario:', error);
        if (window.uiHelpers) {
            window.uiHelpers.showError('Error al eliminar usuario: ' + error.message);
        } else {
            alert('Error al eliminar usuario: ' + error.message);
        }
    }
}

function showAdminPasswordModal(userId) {
    // Crear modal dinámicamente
        const modalHtml = `
        <div class="modal fade" id="adminPasswordModal" tabindex="-1" aria-labelledby="adminPasswordModalLabel" aria-hidden="true">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="adminPasswordModalLabel">Confirmar Eliminación</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <p>Para eliminar un usuario, debe confirmar su contraseña de administrador:</p>
                        <div class="form-group">
                            <label for="admin-password">Contraseña de Administrador:</label>
                            <input type="password" id="admin-password" class="form-control" required>
                        </div>
                        <div id="admin-password-error" class="error-message mt-2"></div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                        <button type="button" id="confirm-delete-btn" class="btn btn-danger">Eliminar Usuario</button>
                    </div>
                    </div>
                </div>
            </div>
        `;

    // Agregar modal al DOM si no existe
    if (!document.getElementById('adminPasswordModal')) {
        const modalContainer = document.createElement('div');
        modalContainer.innerHTML = modalHtml;
        document.body.appendChild(modalContainer);
    }
    
    // Obtener referencia al modal
        const modal = document.getElementById('adminPasswordModal');
    
    // Configurar evento para el botón de confirmación
    const confirmButton = document.getElementById('confirm-delete-btn');
    if (confirmButton) {
        // Eliminar eventos previos
        const newButton = confirmButton.cloneNode(true);
        confirmButton.parentNode.replaceChild(newButton, confirmButton);
        
        // Configurar nuevo evento
        newButton.addEventListener('click', async () => {
            const adminPassword = document.getElementById('admin-password').value;
            if (!adminPassword) {
                document.getElementById('admin-password-error').textContent = 'La contraseña es obligatoria';
                return;
            }
            
            try {
                // Cerrar modal
                if (typeof bootstrap !== 'undefined') {
                    const bsModal = bootstrap.Modal.getInstance(modal);
                    if (bsModal) {
                        bsModal.hide();
                    }
                }
                
                // Proceder con la eliminación
                await performUserDeletion(userId, adminPassword);
            } catch (error) {
                console.error('Error al eliminar usuario:', error);
                if (window.uiHelpers) {
                    window.uiHelpers.showError('Error al eliminar usuario: ' + error.message);
                } else {
                    alert('Error al eliminar usuario: ' + error.message);
                }
            }
        });
    }
    
    // Mostrar modal
    if (typeof bootstrap !== 'undefined') {
        const bsModal = new bootstrap.Modal(modal);
        bsModal.show();
    } else {
        modal.style.display = 'block';
    }
}

async function prepareUserEdit(userId) {
    try {
        console.log(`Preparando edición de usuario con ID: ${userId}`);
        
        // Obtener datos del usuario
        console.log(`Realizando petición a /api/users/${userId}...`);
        const userDataResponse = await fetch(`/api/users/${userId}`);
        
        console.log('Respuesta recibida:', {
            status: userDataResponse.status,
            ok: userDataResponse.ok
        });
        
        if (!userDataResponse.ok) {
            throw new Error(`Error al obtener datos del usuario: ${userDataResponse.status}`);
        }
        
        const userData = await userDataResponse.json();
        console.log('Datos del usuario obtenidos:', userData);

        // Verificar si es el usuario administrador
        if (userData.Username.toLowerCase() === 'admin') {
            throw new Error('No se puede editar al usuario administrador del sistema');
        }
        
        // Guardar ID del usuario que se está editando
        editingUserId = userId;

        // Mapear los datos del usuario
        const user = {
            id: userData.IDUsuario,
            username: userData.Username,
            idArea: userData.IDArea,
            nivelAcceso: userData.NivelAcceso,
            privilegios: {
                puedeCrear: Boolean(userData.PuedeCrear),
                puedeEditar: Boolean(userData.PuedeEditar),
                puedeEliminar: Boolean(userData.PuedeDerivar),
                puedeVer: Boolean(userData.PuedeAuditar)
            }
        };
        
        // Cargar áreas para el select
        if (window.adminModules && window.adminModules.areaManagement) {
            await window.adminModules.areaManagement.loadAreas();
            window.adminModules.areaManagement.updateAreaSelects();
        }
        
        // Llenar formulario con datos del usuario
        document.getElementById('edit-username').value = user.username;
        
        // Seleccionar área
        const areaSelect = document.getElementById('edit-area');
        if (areaSelect) {
            // Seleccionar el área del usuario
            for (let i = 0; i < areaSelect.options.length; i++) {
                if (areaSelect.options[i].value == user.idArea) {
                    areaSelect.selectedIndex = i;
                    break;
                }
            }
        }
        
        // Marcar privilegios
        if (user.privilegios) {
            document.getElementById('edit-crear').checked = user.privilegios.puedeCrear;
            document.getElementById('edit-editar').checked = user.privilegios.puedeEditar;
            document.getElementById('edit-eliminar').checked = user.privilegios.puedeEliminar;
            document.getElementById('edit-ver').checked = user.privilegios.puedeVer;
        }
        
        // Mostrar modal
        const modal = document.getElementById('editUserModal');
        if (modal && typeof bootstrap !== 'undefined') {
            const bsModal = new bootstrap.Modal(modal);
            bsModal.show();
        }
        
    } catch (error) {
        console.error('Error al preparar edición de usuario:', error);
        if (window.uiHelpers) {
            window.uiHelpers.showError('Error al preparar edición de usuario: ' + error.message);
        } else {
            alert('Error al preparar edición de usuario: ' + error.message);
        }
    }
}

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    console.log('Inicializando módulo de gestión de usuarios');
    
    // Configurar evento para el botón de agregar usuario
    const addUserButton = document.getElementById('addUserButton');
    if (addUserButton) {
        addUserButton.addEventListener('click', async () => {
            console.log('Botón de agregar usuario clickeado');
            
            try {
                // Asegurarse de que los selectores de área tengan la clase correcta
                const areaSelects = document.querySelectorAll('#area, #edit-area');
                areaSelects.forEach(select => {
                    if (!select.classList.contains('area-select')) {
                        select.classList.add('area-select');
                    }
                });
                
                // Cargar áreas para el select
                if (window.adminModules && window.adminModules.areaManagement) {
                    await window.adminModules.areaManagement.loadAreas();
                    window.adminModules.areaManagement.updateAreaSelects();
                }
                
                // Mostrar modal
                const modal = document.getElementById('userModal');
                if (modal && typeof bootstrap !== 'undefined') {
                    const bsModal = new bootstrap.Modal(modal);
                    bsModal.show();
                }
                    } catch (error) {
                console.error('Error al preparar creación de usuario:', error);
                if (window.uiHelpers) {
                    window.uiHelpers.showError('Error al preparar creación de usuario: ' + error.message);
                } else {
                    alert('Error al preparar creación de usuario: ' + error.message);
                }
            }
        });
    }
    
    // Configurar evento para el formulario de creación de usuario
    const createUserForm = document.getElementById('createUserForm');
        if (createUserForm) {
            createUserForm.addEventListener('submit', handleCreateUser);
        }

    // Configurar evento para el formulario de edición de usuario
    const editUserForm = document.getElementById('editUserForm');
        if (editUserForm) {
            editUserForm.addEventListener('submit', handleEditUser);
    }
    
    // Cargar usuarios inicialmente
    loadUsers();
});

// Exponer funciones globalmente
window.adminModules = window.adminModules || {};
window.adminModules.userManagement = {
    loadUsers,
    handleCreateUser,
    handleEditUser,
    deleteUser,
    prepareUserEdit
};
