import { showError } from '../../common/uiHelpers.js';
import { getNivelAccesoText } from '../../utils/formatters.js';
import { loadAreas, updateAreaSelects } from './areaManagement.js';

// Variables globales
let editingUserId = null;

// Gestión de usuarios
export async function loadUsers() {
    try {
        const response = await fetch('/api/users');
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Error al cargar usuarios: ${response.status} - ${errorText}`);
        }
        const users = await response.json();
        renderUsers(users);
    } catch (error) {
        console.error('Error al cargar usuarios:', error);
        showError('Error al cargar la lista de usuarios');
    }
}

export function renderUsers(users) {
    const tbody = document.querySelector('#gestionUsuariosTable tbody');
    if (!tbody) {
        console.error('No se encontró la tabla de usuarios');
        return;
    }

    tbody.innerHTML = '';
    users.forEach(user => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${user.Username || ''}</td>
            <td>${user.NombreArea || ''}</td>
            <td>${getNivelAccesoText(user.NivelAcceso) || ''}</td>
            <td>
                <button class="action-btn edit" data-user-id="${user.IDUsuario}">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="action-btn delete" data-user-id="${user.IDUsuario}">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    // Agregar event listeners
    tbody.querySelectorAll('.action-btn.edit').forEach(btn => {
        btn.removeEventListener('click', handleEditClick); // Remover listener existente si hay
        btn.addEventListener('click', handleEditClick);
    });

    tbody.querySelectorAll('.action-btn.delete').forEach(btn => {
        btn.removeEventListener('click', handleDeleteClick); // Remover listener existente si hay
        btn.addEventListener('click', handleDeleteClick);
    });
}

// Manejadores de eventos separados
function handleEditClick(e) {
    const userId = e.currentTarget.dataset.userId;
    if (userId) prepareUserEdit(userId);
}

function handleDeleteClick(e) {
    const userId = e.currentTarget.dataset.userId;
    if (userId) deleteUser(userId);
}

export async function handleCreateUser(e) {
    console.log('Iniciando handleCreateUser');
    e.preventDefault();
    const form = e.target;
    
    const username = form.querySelector('#username').value;
    const password = form.querySelector('#password').value;
    const area = form.querySelector('#area').value;
    const nivelAcceso = form.querySelector('#nivel-acceso').value;

    console.log('Datos del formulario:', {
        username,
        passwordLength: password?.length,
        area,
        nivelAcceso
    });

    try {
        const response = await fetch('/api/users', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username,
                password,
                idArea: area,
                nivelAcceso
            })
        });

        console.log('Respuesta del servidor:', response.status);

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Error al crear usuario');
        }

        // Recargar la lista de usuarios
        await loadUsers();
        
        // Cerrar el modal
        const modal = document.querySelector('#userModal');
        if (modal) {
            modal.style.display = 'none';
            console.log('Modal cerrado');
        }
        
        // Limpiar el formulario
        form.reset();
        console.log('Formulario reseteado');
    } catch (error) {
        console.error('Error en handleCreateUser:', error);
        showError(error.message || 'Error al crear el usuario');
    }
}

export async function handleEditUser(e) {
    e.preventDefault();
    if (!editingUserId) return;

    const form = e.target;
    const username = form.querySelector('#edit-username').value;
    const area = form.querySelector('#edit-area').value;
    const nivelAcceso = form.querySelector('#edit-nivel-acceso').value;

    try {
        const response = await fetch(`/api/users/${editingUserId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username,
                idArea: area,
                nivelAcceso
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Error al actualizar usuario');
        }

        // Recargar la lista de usuarios
        await loadUsers();
        
        // Cerrar el modal
        const modal = document.querySelector('#editUserModal');
        if (modal) modal.style.display = 'none';
        
        // Resetear el ID de edición
        editingUserId = null;
    } catch (error) {
        console.error('Error:', error);
        showError(error.message || 'Error al actualizar el usuario');
    }
}

export async function deleteUser(userId) {
    console.log('=== INICIO DE PROCESO DE ELIMINACIÓN DE USUARIO ===');
    console.log('ID de usuario a eliminar:', userId);
    
    try {
        // Mostrar el modal de confirmación con campo de contraseña
        console.log('Solicitando credenciales de administrador...');
        const adminCredentials = await showAdminPasswordModal();
        
        if (!adminCredentials) {
            console.log('Operación cancelada: No se proporcionaron credenciales');
            return;
        }
        
        console.log('Credenciales recibidas:', {
            username: adminCredentials.username,
            usernameLength: adminCredentials.username.length,
            passwordLength: adminCredentials.password.length
        });

        console.log('Preparando solicitud DELETE al servidor...');
        const requestData = {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                adminUsername: adminCredentials.username,
                adminPassword: adminCredentials.password
            })
        };
        console.log('Datos de la solicitud:', {
            url: `/api/users/${userId}`,
            method: requestData.method,
            headers: requestData.headers,
            bodyLength: requestData.body.length
        });

        console.log('Enviando solicitud al servidor...');
        const response = await fetch(`/api/users/${userId}`, requestData);
        
        console.log('Respuesta recibida del servidor:', {
            status: response.status,
            statusText: response.statusText,
            headers: Object.fromEntries(response.headers.entries())
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('Error del servidor:', errorData);
            throw new Error(errorData.message || 'Error al eliminar usuario');
        }

        const responseData = await response.json();
        console.log('Respuesta exitosa:', responseData);

        // Recargar la lista de usuarios
        console.log('Recargando lista de usuarios...');
        await loadUsers();
        console.log('=== PROCESO DE ELIMINACIÓN COMPLETADO ===');
    } catch (error) {
        console.error('Error detallado en deleteUser:', error);
        console.error('Stack trace:', error.stack);
        showError(error.message || 'Error al eliminar el usuario');
    }
}

function showAdminPasswordModal() {
    console.log('Iniciando showAdminPasswordModal');
    return new Promise((resolve) => {
        // Crear el modal dinámicamente
        const modalHtml = `
            <div id="adminPasswordModal" class="modal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h2>Confirmar Eliminación</h2>
                        <span class="close">&times;</span>
                    </div>
                    <div class="modal-body">
                        <p>Por favor, ingrese las credenciales de administrador para confirmar la eliminación:</p>
                        <div class="form-group">
                            <label for="adminUsername">Usuario Administrador:</label>
                            <input type="text" id="adminUsername" class="form-control" placeholder="Usuario administrador" required>
                        </div>
                        <div class="form-group">
                            <label for="adminPassword">Contraseña:</label>
                            <input type="password" id="adminPassword" class="form-control" placeholder="Contraseña de administrador" required>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary cancel-btn">Cancelar</button>
                        <button type="button" class="btn btn-danger confirm-btn">Confirmar Eliminación</button>
                    </div>
                </div>
            </div>
        `;

        // Agregar el modal al DOM
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        console.log('Modal agregado al DOM');

        const modal = document.getElementById('adminPasswordModal');
        const closeBtn = modal.querySelector('.close');
        const cancelBtn = modal.querySelector('.cancel-btn');
        const confirmBtn = modal.querySelector('.confirm-btn');
        const usernameInput = modal.querySelector('#adminUsername');
        const passwordInput = modal.querySelector('#adminPassword');

        // Función para cerrar el modal y limpiar
        const closeModal = () => {
            console.log('Modal cerrado por el usuario');
            modal.remove();
            resolve(null);
        };

        // Función para confirmar
        const confirmDelete = () => {
            const username = usernameInput.value.trim();
            const password = passwordInput.value.trim();
            
            console.log('Intento de confirmación, campos proporcionados:', {
                username: username ? '(no vacío)' : '(vacío)',
                password: password ? '(no vacío)' : '(vacío)'
            });
            
            if (!username || !password) {
                console.log('Intento de confirmación con campos vacíos');
                showError('Por favor, complete todos los campos');
                return;
            }
            
            console.log('Confirmación exitosa, cerrando modal');
            modal.remove();
            resolve({ username, password });
        };

        // Event listeners
        closeBtn.addEventListener('click', closeModal);
        cancelBtn.addEventListener('click', closeModal);
        confirmBtn.addEventListener('click', confirmDelete);
        
        // Permitir confirmar con Enter en el campo de contraseña
        passwordInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                console.log('Tecla Enter presionada');
                confirmDelete();
            }
        });

        // Mostrar el modal y enfocar el campo de usuario
        modal.style.display = 'block';
        usernameInput.focus();
        console.log('Modal mostrado y enfocado en el campo de usuario');
    });
}

export async function prepareUserEdit(userId) {
    console.log('Iniciando prepareUserEdit para usuario:', userId);
    try {
        // Primero cargar las áreas
        console.log('Cargando áreas...');
        const areasResponse = await fetch('/api/areas');
        console.log('Respuesta de áreas:', areasResponse.status);
        
        if (!areasResponse.ok) throw new Error('Error al cargar áreas');
        
        const areas = await areasResponse.json();
        console.log('Áreas obtenidas:', areas);

        // Luego cargar los datos del usuario
        const userResponse = await fetch(`/api/users/${userId}`);
        console.log('Respuesta de /api/users:', userResponse.status);
        
        if (!userResponse.ok) throw new Error('Error al obtener datos del usuario');
        
        const user = await userResponse.json();
        console.log('Datos del usuario:', user);
        editingUserId = userId;

        const modal = document.querySelector('#editUserModal');
        console.log('Modal encontrado:', !!modal);
        if (!modal) {
            throw new Error('No se encontró el modal de edición');
        }

        // Llenar el formulario
        const usernameInput = modal.querySelector('#edit-username');
        const areaSelect = modal.querySelector('#edit-area');
        const nivelAccesoSelect = modal.querySelector('#edit-nivel-acceso');

        console.log('Elementos del formulario encontrados:', {
            username: !!usernameInput,
            area: !!areaSelect,
            nivelAcceso: !!nivelAccesoSelect
        });

        // Verificar que todos los elementos necesarios existen
        if (!usernameInput || !areaSelect || !nivelAccesoSelect) {
            throw new Error('No se encontraron todos los elementos del formulario');
        }

        // Actualizar las áreas antes de establecer los valores
        updateAreaSelects(areas);

        // Establecer los valores después de actualizar las áreas
        usernameInput.value = user.Username || '';
        areaSelect.value = user.IDArea || '';
        nivelAccesoSelect.value = user.NivelAcceso || '';

        console.log('Valores establecidos:', {
            username: usernameInput.value,
            area: areaSelect.value,
            nivelAcceso: nivelAccesoSelect.value
        });

        // Mostrar el modal
        modal.style.display = 'block';
        console.log('Modal mostrado');
    } catch (error) {
        console.error('Error en prepareUserEdit:', error);
        showError('Error al cargar los datos del usuario: ' + error.message);
    }
}
