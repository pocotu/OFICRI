import { showError } from '../../common/uiHelpers.js';
import { getNivelAccesoText } from '../../utils/formatters.js';
import { loadAreas, updateAreaSelects } from './areaManagement.js';

// Variables globales
let editingUserId = null;

// Gestión de usuarios
export async function loadUsers() {
    try {
        console.log('=== INICIO DE CARGA DE USUARIOS ===');
        
        // Buscar la tabla existente
        const table = document.querySelector('#gestionUsuariosTable');
        if (!table) {
            console.error('No se encontró la tabla de usuarios');
            throw new Error('No se encontró la tabla de usuarios (#gestionUsuariosTable)');
        }

        let tableBody = table.querySelector('tbody');
        if (!tableBody) {
            console.log('Creando tbody para la tabla de usuarios');
            tableBody = document.createElement('tbody');
            table.appendChild(tableBody);
        }

        console.log('Realizando petición a /api/users...');
        const response = await fetch('/api/users');
        
        if (!response.ok) {
            throw new Error(`Error al cargar usuarios: ${response.status} ${response.statusText}`);
        }

        const users = await response.json();
        console.log(`Se obtuvieron ${users.length} usuarios`);

        // Limpiar tabla existente
        tableBody.innerHTML = '';
        
        // Procesar usuarios
        users.forEach(user => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${user.Username || ''}</td>
                <td>${user.NombreArea || 'No asignada'}</td>
                <td>${getNivelAccesoText(user.NivelAcceso)}</td>
                <td class="text-center">
                    ${user.Username !== 'admin' ? `
                        <button class="btn btn-success btn-sm edit-user" data-userid="${user.IDUsuario}">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-danger btn-sm delete-user ms-2" data-userid="${user.IDUsuario}">
                            <i class="fas fa-trash"></i>
                        </button>
                    ` : '<span class="text-muted">No editable</span>'}
                </td>
            `;
            tableBody.appendChild(row);
        });

        // Configurar event listeners para los botones
        configureUserButtons();
        
        console.log('=== FIN DE CARGA DE USUARIOS ===');
    } catch (error) {
        console.error('Error en loadUsers:', error);
        showError('Error al cargar la lista de usuarios: ' + error.message);
    }
}

// Función para configurar los event listeners de los botones
function configureUserButtons() {
    document.querySelectorAll('.edit-user').forEach(button => {
        button.addEventListener('click', handleEditClick);
    });

    document.querySelectorAll('.delete-user').forEach(button => {
        button.addEventListener('click', handleDeleteClick);
    });
}

// Manejadores de eventos separados
function handleEditClick(e) {
    console.log('=== INICIO DE EDICIÓN DE USUARIO ===');
    const userId = e.currentTarget.dataset.userid;
    console.log('Click en editar usuario con ID:', userId);
    console.log('Dataset completo del botón:', e.currentTarget.dataset);
    if (userId) {
        console.log('Procediendo a preparar edición para usuario ID:', userId);
        prepareUserEdit(userId);
    } else {
        console.error('Error: No se encontró el ID del usuario en el botón');
    }
}

function handleDeleteClick(e) {
    const userId = e.currentTarget.dataset.userId;
    if (userId) deleteUser(userId);
}

export async function handleCreateUser(e) {
    console.log('Iniciando handleCreateUser');
    e.preventDefault();
    const form = e.target;

    // Cargar áreas antes de procesar el formulario
    try {
        console.log('Cargando áreas para el formulario...');
        const areas = await loadAreas();
        console.log('Áreas cargadas:', areas);
        
        // Actualizar el selector de áreas
        const areaSelect = form.querySelector('#area');
        if (areaSelect) {
            console.log('Actualizando selector de áreas...');
            await updateAreaSelects(areas);
        }

        const username = form.querySelector('#username').value;
        const password = form.querySelector('#password').value;
        const area = form.querySelector('#area').value;
        
        // Obtener los privilegios seleccionados
        const privilegios = {
            crear: form.querySelector('#priv-crear').checked,
            editar: form.querySelector('#priv-editar').checked,
            derivar: form.querySelector('#priv-eliminar').checked,
            auditar: form.querySelector('#priv-ver').checked
        };

        // Calcular el nivel de acceso basado en los privilegios
        let nivelAccesoNumerico = 0;
        if (privilegios.crear) nivelAccesoNumerico |= 1;  // Crear
        if (privilegios.editar) nivelAccesoNumerico |= 2; // Editar
        if (privilegios.derivar) nivelAccesoNumerico |= 4; // Derivar
        if (privilegios.auditar) nivelAccesoNumerico |= 8; // Auditar

        console.log('Datos del formulario:', {
            username,
            area,
            nivelAcceso: nivelAccesoNumerico,
            privilegios
        });

        if (!username || !password || !area || !nivelAccesoNumerico) {
            showError('Por favor complete todos los campos requeridos');
            return;
        }

        // Validación de contraseña
        if (password.length < 6) {
            showError('La contraseña debe tener al menos 6 caracteres');
            return;
        }

        console.log('Username:', username);
        console.log('Password length:', password.length);
        console.log('Area:', area);
        console.log('Nivel de Acceso Numérico:', nivelAccesoNumerico);

        try {
            const response = await fetch('/api/users', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    username,
                    password,
                    idArea: parseInt(area),
                    nivelAcceso: nivelAccesoNumerico
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
    } catch (error) {
        console.error('Error en handleCreateUser:', error);
        showError('Error al crear el usuario: ' + error.message);
    }
}

export async function handleEditUser(e) {
    console.log('=== INICIO DE ACTUALIZACIÓN DE USUARIO ===');
    e.preventDefault();
    
    console.log('ID del usuario en edición:', editingUserId);
    if (!editingUserId) {
        console.error('Error: No hay ID de usuario para editar');
        return;
    }

    const form = e.target;
    console.log('Formulario encontrado:', form);

    const username = form.querySelector('#edit-username').value;
    const area = form.querySelector('#edit-area').value;
    const nivelAccesoElements = form.querySelectorAll('input[name="edit-privileges"]:checked');
    
    console.log('Datos del formulario:', {
        username,
        area,
        privilegiosSeleccionados: Array.from(nivelAccesoElements).map(el => el.value)
    });

    // Convertir los privilegios en un nivel de acceso numérico
    let nivelAccesoNumerico = 0;
    nivelAccesoElements.forEach(el => {
        if (el.value === 'crear') nivelAccesoNumerico |= 1;
        if (el.value === 'editar') nivelAccesoNumerico |= 2;
        if (el.value === 'eliminar') nivelAccesoNumerico |= 4;
        if (el.value === 'ver') nivelAccesoNumerico |= 8;
    });

    console.log('Nivel de acceso numérico calculado:', nivelAccesoNumerico);

    try {
        console.log('Enviando solicitud PUT a:', `/api/users/${editingUserId}`);
        console.log('Datos a enviar:', {
            username,
            idArea: parseInt(area),
            nivelAcceso: nivelAccesoNumerico
        });

        const response = await fetch(`/api/users/${editingUserId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username,
                idArea: parseInt(area),
                nivelAcceso: nivelAccesoNumerico
            })
        });

        console.log('Respuesta del servidor:', {
            status: response.status,
            statusText: response.statusText
        });

        if (response.ok) {
            const result = await response.json();
            console.log('Respuesta exitosa:', result);

            // Cerrar el modal
            const modal = document.querySelector('#editUserModal');
            if (modal) {
                const modalInstance = bootstrap.Modal.getInstance(modal);
                modalInstance.hide();
                console.log('Modal cerrado exitosamente');
            }

            // Recargar la tabla de usuarios
            await loadUsers();
            console.log('Tabla de usuarios recargada');

            // Limpiar el ID del usuario en edición
            editingUserId = null;
        } else {
            const errorData = await response.json();
            console.error('Error del servidor:', errorData);
            throw new Error(errorData.message || 'Error al actualizar usuario');
        }
    } catch (error) {
        console.error('Error detallado en handleEditUser:', error);
        console.error('Stack trace:', error.stack);
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
                adminPassword: adminCredentials.password,
                permanentDelete: true // Indicar al servidor que debe eliminar permanentemente
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
                        <p>Por favor, ingrese las credenciales de administrador para confirmar la eliminación del usuario:</p>
                        <p><small><i>Nota: El usuario será eliminado permanentemente de la base de datos, pero se guardará un registro de esta acción.</i></small></p>
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
    console.log('=== INICIO DE PREPARACIÓN DE EDICIÓN ===');
    console.log('Preparando edición para usuario ID:', userId);
    try {
        // Primero cargar las áreas
        console.log('Cargando áreas...');
        const areasResponse = await fetch('/api/areas');
        console.log('Respuesta de áreas:', areasResponse.status);
        
        if (!areasResponse.ok) {
            console.error('Error al cargar áreas:', await areasResponse.text());
            throw new Error('Error al cargar áreas');
        }
        
        const areas = await areasResponse.json();
        console.log('Áreas obtenidas:', areas);

        // Luego cargar los datos del usuario
        console.log('Cargando datos del usuario...');
        const userResponse = await fetch(`/api/users/${userId}`);
        console.log('Respuesta de usuario:', userResponse.status);
        
        if (!userResponse.ok) {
            console.error('Error al obtener usuario:', await userResponse.text());
            throw new Error('Error al obtener datos del usuario');
        }
        
        const user = await userResponse.json();
        console.log('Datos del usuario obtenidos:', user);
        editingUserId = userId;

        const modal = document.querySelector('#editUserModal');
        console.log('Modal encontrado:', !!modal);
        if (!modal) {
            throw new Error('No se encontró el modal de edición');
        }

        // Llenar el formulario
        const usernameInput = modal.querySelector('#edit-username');
        const areaSelect = modal.querySelector('#edit-area');
        
        // Marcar los checkboxes según los privilegios actuales
        const crearCheck = modal.querySelector('input[name="edit-privileges"][value="crear"]');
        const editarCheck = modal.querySelector('input[name="edit-privileges"][value="editar"]');
        const eliminarCheck = modal.querySelector('input[name="edit-privileges"][value="eliminar"]');
        const verCheck = modal.querySelector('input[name="edit-privileges"][value="ver"]');

        console.log('Estado actual de privilegios:', {
            nivelAcceso: user.NivelAcceso,
            crear: Boolean(user.PuedeCrear),
            editar: Boolean(user.PuedeEditar),
            derivar: Boolean(user.PuedeDerivar),
            auditar: Boolean(user.PuedeAuditar)
        });

        if (crearCheck) crearCheck.checked = Boolean(user.PuedeCrear);
        if (editarCheck) editarCheck.checked = Boolean(user.PuedeEditar);
        if (eliminarCheck) eliminarCheck.checked = Boolean(user.PuedeDerivar);
        if (verCheck) verCheck.checked = Boolean(user.PuedeAuditar);

        // Actualizar las áreas antes de establecer los valores
        await updateAreaSelects(areas);

        // Establecer los valores
        if (usernameInput) usernameInput.value = user.Username || '';
        if (areaSelect) areaSelect.value = user.IDArea || '';

        console.log('Valores establecidos en el formulario:', {
            username: usernameInput?.value,
            area: areaSelect?.value,
            checkboxesEncontrados: {
                crear: !!crearCheck,
                editar: !!editarCheck,
                eliminar: !!eliminarCheck,
                ver: !!verCheck
            }
        });

        // Mostrar el modal usando jQuery para evitar problemas con Bootstrap
        $(modal).modal('show');
        console.log('Modal mostrado usando jQuery');
        console.log('=== FIN DE PREPARACIÓN DE EDICIÓN ===');
    } catch (error) {
        console.error('Error detallado en prepareUserEdit:', error);
        console.error('Stack trace:', error.stack);
        showError('Error al cargar los datos del usuario: ' + error.message);
    }
}

// Inicializar event listeners y cargar datos
document.addEventListener('DOMContentLoaded', async () => {
    console.log('=== INICIALIZANDO MÓDULO DE GESTIÓN DE USUARIOS ===');
    console.log('Estado del documento:', document.readyState);
    
    try {
        // Esperar a que el DOM esté completamente cargado
        if (document.readyState !== 'complete') {
            console.log('Esperando a que el DOM se cargue completamente...');
            await new Promise(resolve => {
                window.addEventListener('load', resolve);
            });
            console.log('DOM completamente cargado');
        }
        
        console.log('DOM completamente cargado, procediendo con la inicialización');
        
        // Configurar botones de navegación
        const navBtns = document.querySelectorAll('.nav-btn');
        console.log('Botones de navegación encontrados:', navBtns.length);
        
        navBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const targetId = btn.getAttribute('data-target');
                console.log('Click en botón de navegación:', targetId);
                
                if (targetId) {
                    // Desactivar todos los botones y secciones
                    navBtns.forEach(b => b.classList.remove('active'));
                    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
                    
                    // Activar el botón y sección seleccionados
                    btn.classList.add('active');
                    const targetSection = document.getElementById(targetId);
                    if (targetSection) {
                        targetSection.classList.add('active');
                        if (targetId === 'users-section') {
                            loadUsers();
                        }
                    }
                }
            });
        });

        // Configurar botón de agregar usuario
        const addUserBtn = document.querySelector('#addUserButton');
        console.log('Botón agregar usuario encontrado:', !!addUserBtn);
        
        if (addUserBtn) {
            addUserBtn.addEventListener('click', async () => {
                console.log('=== INICIO DE APERTURA DE MODAL DE USUARIO ===');
                const modal = document.querySelector('#userModal');
                console.log('Modal encontrado:', !!modal);
                
                if (modal) {
                    try {
                        // Limpiar el formulario
                        const form = document.querySelector('#createUserForm');
                        console.log('Formulario encontrado:', !!form);
                        
                        if (form) {
                            form.reset();
                            console.log('Formulario reseteado');
                        }

                        // Cargar áreas antes de mostrar el modal
                        console.log('Cargando áreas para el modal...');
                        const areas = await loadAreas();
                        console.log('Áreas cargadas:', areas);

                        // Verificar el selector de áreas
                        const areaSelect = form?.querySelector('#area');
                        console.log('Selector de áreas encontrado:', {
                            existe: !!areaSelect,
                            id: areaSelect?.id,
                            optionsAntes: areaSelect?.options.length
                        });

                        if (areas && areas.length > 0) {
                            console.log('Actualizando selector con las áreas...');
                            await updateAreaSelects(areas);
                            console.log('Selector actualizado');
                        } else {
                            console.warn('No se encontraron áreas para cargar');
                        }

                        // Mostrar el modal
                        console.log('Mostrando modal...');
                        const modalInstance = new bootstrap.Modal(modal);
                        modalInstance.show();
                        console.log('Modal mostrado');
                        
                        // Verificar estado final del selector
                        console.log('Estado final del selector de áreas:', {
                            optionsDespues: areaSelect?.options.length,
                            valores: Array.from(areaSelect?.options || []).map(opt => ({
                                value: opt.value,
                                text: opt.text
                            }))
                        });
                        
                        console.log('=== FIN DE APERTURA DE MODAL DE USUARIO ===');
                    } catch (error) {
                        console.error('Error detallado al abrir el modal:', error);
                        console.error('Stack trace:', error.stack);
                        showError('Error al cargar las áreas: ' + error.message);
                    }
                } else {
                    console.error('No se encontró el modal de usuario');
                }
            });
            console.log('Event listener agregado a addUserBtn');
        }

        // Configurar formularios
        const createUserForm = document.querySelector('#createUserForm');
        const editUserForm = document.querySelector('#editUserForm');
        
        console.log('Formularios encontrados:', {
            createUser: !!createUserForm,
            editUser: !!editUserForm
        });

        if (createUserForm) {
            createUserForm.addEventListener('submit', handleCreateUser);
            console.log('Event listener agregado a createUserForm');
        }

        if (editUserForm) {
            editUserForm.addEventListener('submit', handleEditUser);
            console.log('Event listener agregado a editUserForm');
        }

        // Configurar botones de cerrar modales
        document.querySelectorAll('.modal .close, .modal .close-modal').forEach(btn => {
            btn.addEventListener('click', function() {
                const modal = this.closest('.modal');
                if (modal) {
                    $(modal).modal('hide');
                }
            });
        });

        // Cargar usuarios iniciales
        await loadUsers();
        console.log('=== INICIALIZACIÓN COMPLETADA ===');
    } catch (error) {
        console.error('Error detallado durante la inicialización:', error);
        console.error('Stack trace:', error.stack);
        showError('Error al inicializar la gestión de usuarios');
    }
});
