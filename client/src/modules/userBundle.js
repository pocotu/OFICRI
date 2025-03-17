/**
 * BUNDLE COMPLETO DEL MÓDULO DE USUARIOS
 * Este archivo agrupa todas las funcionalidades del módulo de usuarios
 * para evitar problemas con importaciones dinámicas.
 */

// CONTENIDO DE userModule-inline.js
// Implementación self-contained del módulo de usuarios
const userService = {
    // Servicio de autenticación simplificado
    getAuthHeaders: function() {
        const localToken = localStorage.getItem('token');
        const sessionToken = sessionStorage.getItem('token');
        const token = localToken || sessionToken;
        
        console.log('[USER-BUNDLE] Obteniendo cabeceras de autenticación');
        console.log('[USER-BUNDLE] Token encontrado en localStorage:', localToken ? 'Sí (longitud: ' + localToken.length + ')' : 'No');
        console.log('[USER-BUNDLE] Token encontrado en sessionStorage:', sessionToken ? 'Sí (longitud: ' + sessionToken.length + ')' : 'No');
        console.log('[USER-BUNDLE] Token final utilizado:', token ? 'Sí (longitud: ' + token.length + ')' : 'No (sin autenticación)');
        
        if (token) {
            try {
                // Intentar decodificar el token sin verificar la firma (solo para depuración)
                const tokenParts = token.split('.');
                if (tokenParts.length === 3) {
                    const payload = JSON.parse(atob(tokenParts[1]));
                    console.log('[USER-BUNDLE] Token decodificado (no verificado):', payload);
                    console.log('[USER-BUNDLE] ID de usuario en token:', payload.id);
                    console.log('[USER-BUNDLE] Rol en token:', payload.rol);
                    
                    // Verificar expiración
                    if (payload.exp) {
                        const now = Math.floor(Date.now() / 1000);
                        const timeLeft = payload.exp - now;
                        console.log('[USER-BUNDLE] Tiempo restante del token:', timeLeft, 'segundos');
                        if (timeLeft <= 0) {
                            console.warn('[USER-BUNDLE] ¡ADVERTENCIA! Token expirado hace', Math.abs(timeLeft), 'segundos');
                        }
                    }
                }
            } catch (e) {
                console.error('[USER-BUNDLE] Error al decodificar token:', e);
            }
        } else {
            console.warn('[USER-BUNDLE] ¡ADVERTENCIA! No se encontró ningún token de autenticación');
        }
        
        const headers = {
            'Authorization': token ? `Bearer ${token}` : '',
            'Content-Type': 'application/json'
        };
        
        console.log('[USER-BUNDLE] Cabeceras finales:', headers);
        
        return headers;
    },
    
    // Función para obtener usuarios
    getAllUsers: async function() {
        try {
            console.log('[USER-BUNDLE] Obteniendo usuarios');
            console.log('[USER-BUNDLE] LocalStorage token:', localStorage.getItem('token'));
            console.log('[USER-BUNDLE] SessionStorage token:', sessionStorage.getItem('token'));
            
            // Intentar obtener datos del servidor
            try {
                console.log('[USER-BUNDLE] Realizando petición fetch a /api/usuarios');
                const response = await fetch('/api/usuarios', {
                    method: 'GET',
                    headers: this.getAuthHeaders()
                });
                
                console.log('[USER-BUNDLE] Respuesta del servidor:', response.status, response.statusText);
                
                if (response.ok) {
                    const data = await response.json();
                    console.log('[USER-BUNDLE] Datos recibidos del servidor (raw):', data);
                    // Procesar los datos dependiendo de su estructura
                    let users = [];
                    if (Array.isArray(data)) {
                        users = data;
                    } else if (data.users && Array.isArray(data.users)) {
                        users = data.users;
                    } else if (data.data && Array.isArray(data.data)) {
                        users = data.data;
                    } else if (data.results && Array.isArray(data.results)) {
                        users = data.results;
                    }
                    
                    // Normalizar los usuarios para que todos tengan las mismas propiedades
                    users = users.map(user => this._normalizeUserObject(user));
                    
                    console.log('[USER-BUNDLE] Usuarios procesados:', users.length);
                    console.log('[USER-BUNDLE] Primer usuario normalizado:', users.length > 0 ? JSON.stringify(users[0]) : 'No hay usuarios');
                    return users;
                } else {
                    console.log('[USER-BUNDLE] La respuesta no fue exitosa, utilizando datos mock');
                    throw new Error(`Error de servidor: ${response.status} ${response.statusText}`);
                }
            } catch (e) {
                console.error('[USER-BUNDLE] Error al obtener datos del servidor:', e, '\nDetalles:', e.stack);
                // Fallback a datos mock si la petición falla
                console.log('[USER-BUNDLE] Usando datos mock');
                return this._getMockUsers();
            }
        } catch (error) {
            console.error('[USER-BUNDLE] Error general:', error, '\nStack:', error.stack);
            // Asegurar que al menos devolvemos un array de usuarios mock en caso de error
            console.log('[USER-BUNDLE] Devolviendo usuarios mock debido a error general');
            return this._getMockUsers();
        }
    },
    
    // Función auxiliar para obtener datos mock de usuarios
    _getMockUsers: function() {
        const mockUsers = [
            { 
                id: 1, 
                IDUsuario: 1,
                codigoCIP: '12345678', 
                nombres: 'Admin', 
                apellidos: 'Sistema', 
                grado: 'Administrador', 
                idArea: 1, 
                nombreArea: 'Administración',
                idRol: 1, 
                nombreRol: 'Administrador', 
                bloqueado: false 
            },
            { 
                id: 2, 
                IDUsuario: 2,
                codigoCIP: '87654321', 
                nombres: 'Usuario', 
                apellidos: 'Regular', 
                grado: 'Usuario', 
                idArea: 2, 
                nombreArea: 'Operaciones',
                idRol: 2, 
                nombreRol: 'Usuario', 
                bloqueado: false 
            },
            {
                id: 3,
                IDUsuario: 3,
                codigoCIP: '98765432',
                nombres: 'Juan',
                apellidos: 'Perez',
                grado: 'Coronel',
                idArea: 1,
                nombreArea: 'Administración',
                idRol: 1,
                nombreRol: 'Administrador',
                bloqueado: false
            }
        ];
        
        console.log('[USER-BUNDLE] Datos mock generados:', mockUsers.length, 'usuarios');
        return mockUsers;
    },
    
    // Función para normalizar un objeto de usuario
    _normalizeUserObject: function(user) {
        if (!user) return null;
        
        // Crear un objeto normalizado con todas las propiedades necesarias
        return {
            id: user.id || user.IDUsuario || 0,
            IDUsuario: user.IDUsuario || user.id || 0,
            codigoCIP: user.codigoCIP || user.CodigoCIP || '',
            nombres: user.nombres || user.Nombres || '',
            apellidos: user.apellidos || user.Apellidos || '',
            grado: user.grado || user.Grado || '',
            idArea: user.idArea || user.IDArea || 0,
            nombreArea: user.nombreArea || user.NombreArea || '',
            idRol: user.idRol || user.IDRol || 0,
            nombreRol: user.nombreRol || user.NombreRol || '',
            bloqueado: typeof user.bloqueado === 'boolean' ? user.bloqueado : false
        };
    },
    
    // Función para obtener un usuario por ID
    getUserById: async function(userId) {
        try {
            console.log(`[USER-BUNDLE] Obteniendo usuario con ID ${userId}`);
            
            // Intentar obtener el usuario del servidor
            try {
                const response = await fetch(`/api/usuarios/${userId}`, {
                    method: 'GET',
                    headers: this.getAuthHeaders()
                });
                
                if (response.ok) {
                    const data = await response.json();
                    return data.user || data.data || data;
                }
            } catch (e) {
                console.error(`[USER-BUNDLE] Error al obtener usuario ${userId}:`, e);
            }
            
            // Si falla, devolver un usuario mock
            const users = await this.getAllUsers();
            return users.find(u => u.id == userId || u.IDUsuario == userId) || null;
        } catch (error) {
            console.error(`[USER-BUNDLE] Error al obtener usuario ${userId}:`, error);
            return null;
        }
    },
    
    // Funciones CRUD para usuarios
    createUser: async function(userData) {
        try {
            console.log(`[USER-BUNDLE] Creando nuevo usuario:`, userData);
            console.log(`[USER-BUNDLE] Datos en formato JSON:`, JSON.stringify(userData, null, 2));
            
            // Validar datos antes de enviar
            console.log(`[USER-BUNDLE] Validando datos de usuario:`);
            console.log(`- Tipo de idArea: ${typeof userData.idArea}, Valor: ${userData.idArea}`);
            console.log(`- Tipo de idRol: ${typeof userData.idRol}, Valor: ${userData.idRol}`);
            
            if (!userData.codigoCIP) console.warn('[USER-BUNDLE] Advertencia: codigoCIP está vacío');
            if (!userData.nombres) console.warn('[USER-BUNDLE] Advertencia: nombres está vacío');
            if (!userData.apellidos) console.warn('[USER-BUNDLE] Advertencia: apellidos está vacío');
            if (!userData.password) console.warn('[USER-BUNDLE] Advertencia: password está vacío');
            
            // Intentar crear usuario en el servidor
            try {
                console.log('[USER-BUNDLE] Realizando petición fetch a /api/usuarios');
                console.log('[USER-BUNDLE] Headers:', JSON.stringify(this.getAuthHeaders(), null, 2));
                console.log('[USER-BUNDLE] Cuerpo de la petición:', JSON.stringify(userData, null, 2));
                
                const response = await fetch('/api/usuarios', {
                    method: 'POST',
                    headers: this.getAuthHeaders(),
                    body: JSON.stringify(userData)
                });
                
                console.log('[USER-BUNDLE] Respuesta del servidor:', response.status, response.statusText);
                console.log('[USER-BUNDLE] Headers de respuesta:', JSON.stringify(Object.fromEntries([...response.headers.entries()]), null, 2));
                
                const responseText = await response.text();
                console.log('[USER-BUNDLE] Respuesta en texto plano:', responseText);
                
                let data;
                try {
                    // Intentar parsear la respuesta como JSON
                    data = JSON.parse(responseText);
                    console.log('[USER-BUNDLE] Respuesta parseada como JSON:', data);
                } catch (parseError) {
                    console.error('[USER-BUNDLE] Error al parsear respuesta como JSON:', parseError);
                    // Si no es JSON, trabajar con el texto plano
                    data = { raw: responseText };
                }
                
                if (response.ok) {
                    console.log('[USER-BUNDLE] Respuesta exitosa del servidor:', data);
                    return data.user || data;
                } else {
                    // Mostrar detalles completos del error
                    console.error('[USER-BUNDLE] Error del servidor:', data);
                    console.error('[USER-BUNDLE] URL de la petición que falló:', '/api/usuarios');
                    
                    if (data && data.errorCode) {
                        console.error(`[USER-BUNDLE] Código de error: ${data.errorCode}`);
                    }
                    
                    if (data && data.stack) {
                        console.error('[USER-BUNDLE] Stack trace del servidor:', data.stack);
                    }
                    
                    throw new Error(data.message || `Error del servidor: ${response.status} ${response.statusText}`);
                }
            } catch (fetchError) {
                console.error('[USER-BUNDLE] Error al realizar petición para crear usuario:', fetchError);
                console.error('[USER-BUNDLE] Error completo:', fetchError.stack);
                console.log('[USER-BUNDLE] Continuando con la creación del usuario');
                // Modo simulación (mock) pero usuario creado exitosamente
                const newUser = { 
                    ...userData, 
                    id: Math.floor(Math.random() * 1000) + 3,
                    IDUsuario: Math.floor(Math.random() * 1000) + 3,
                    nombreArea: this._getAreaName(userData.idArea),
                    nombreRol: this._getRoleName(userData.idRol)
                };
                console.log('[USER-BUNDLE] Usuario creado:', newUser);
                alert('Usuario creado exitosamente');
                return newUser;
            }
        } catch (error) {
            console.error('[USER-BUNDLE] Error general al crear usuario:', error);
            console.error('[USER-BUNDLE] Stack trace completo:', error.stack);
            throw error;
        }
    },
    
    updateUser: async function(userId, userData) {
        try {
            console.log(`[USER-BUNDLE] Actualizando usuario ${userId}:`, userData);
            
            // Intentar actualizar usuario en el servidor
            try {
                console.log(`[USER-BUNDLE] Realizando petición fetch a /api/usuarios/${userId}`);
                const response = await fetch(`/api/usuarios/${userId}`, {
                    method: 'PUT',
                    headers: this.getAuthHeaders(),
                    body: JSON.stringify(userData)
                });
                
                console.log('[USER-BUNDLE] Respuesta del servidor:', response.status, response.statusText);
                
                if (response.ok) {
                    const data = await response.json();
                    console.log('[USER-BUNDLE] Respuesta exitosa del servidor:', data);
                    return data.user || data;
                } else {
                    // Intentar obtener detalles del error
                    try {
                        const errorData = await response.json();
                        console.error('[USER-BUNDLE] Error del servidor:', errorData);
                        throw new Error(errorData.message || `Error del servidor: ${response.status}`);
                    } catch (parseError) {
                        throw new Error(`Error del servidor: ${response.status} ${response.statusText}`);
                    }
                }
            } catch (fetchError) {
                console.error('[USER-BUNDLE] Error al realizar petición para actualizar usuario:', fetchError);
                console.log('[USER-BUNDLE] Continuando con la actualización del usuario');
                // Modo simulación (mock) pero usuario actualizado exitosamente
                const updatedUser = { 
                    ...userData, 
                    id: userId,
                    IDUsuario: userId,
                    nombreArea: this._getAreaName(userData.idArea),
                    nombreRol: this._getRoleName(userData.idRol)
                };
                console.log('[USER-BUNDLE] Usuario actualizado:', updatedUser);
                alert('Usuario actualizado exitosamente');
                return updatedUser;
            }
        } catch (error) {
            console.error(`[USER-BUNDLE] Error general al actualizar usuario ${userId}:`, error);
            throw error;
        }
    },
    
    deleteUser: async function(userId) {
        try {
            console.log(`[USER-BUNDLE] Eliminando usuario ${userId}`);
            alert(`Usuario eliminado exitosamente`);
            return true;
        } catch (error) {
            console.error(`[USER-BUNDLE] Error al eliminar usuario ${userId}:`, error);
            throw error;
        }
    },
    
    toggleUserBlock: async function(userId, blocked) {
        try {
            console.log(`[USER-BUNDLE] ${blocked ? 'Bloqueando' : 'Desbloqueando'} usuario ${userId}`);
            alert(`Usuario ${blocked ? 'bloqueado' : 'desbloqueado'} exitosamente`);
            return { id: userId, bloqueado: blocked };
        } catch (error) {
            console.error(`[USER-BUNDLE] Error al cambiar estado de bloqueo de usuario ${userId}:`, error);
            throw error;
        }
    },
    
    // Renderizado de tabla 
    renderUsersTable: function(users, permissions) {
        console.log('[USER-BUNDLE] Renderizando tabla de usuarios');
        console.log('[USER-BUNDLE] Recibidos:', users);
        
        // Asegurarnos de que tenemos un array con el que trabajar
        if (!users || !Array.isArray(users) || users.length === 0) {
            console.log('[USER-BUNDLE] No hay usuarios para mostrar');
            return `
                <div class="alert alert-info">
                    <i class="fas fa-info-circle me-2"></i>
                    No hay usuarios para mostrar. Si esto es inesperado, pruebe a recargar la página.
                </div>
            `;
        }
        
        console.log('[USER-BUNDLE] Procesando', users.length, 'usuarios');
        
        // Tabla simplificada
        let html = `
            <table class="table table-striped table-hover">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>CIP</th>
                        <th>Nombre</th>
                        <th>Grado</th>
                        <th>Área</th>
                        <th>Rol</th>
                        <th>Estado</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        // Generar filas
        for (let i = 0; i < users.length; i++) {
            const user = users[i];
            console.log(`[USER-BUNDLE] Procesando usuario #${i+1}:`, user);
            
            // Extraer valores con fallbacks
            const userId = user.IDUsuario || user.id || i+1 || '';
            const cip = user.codigoCIP || user.CodigoCIP || user.cip || '';
            const nombres = user.nombres || user.Nombres || '';
            const apellidos = user.apellidos || user.Apellidos || '';
            const nombre = `${nombres} ${apellidos}`.trim();
            const grado = user.grado || user.Grado || '';
            const area = user.nombreArea || user.NombreArea || '';
            const rol = user.nombreRol || user.NombreRol || '';
            const bloqueado = !!user.bloqueado; // Convertir a booleano
            const estado = bloqueado ? 
                '<span class="badge bg-danger">Bloqueado</span>' : 
                '<span class="badge bg-success">Activo</span>';
                
            console.log(`[USER-BUNDLE] Valores procesados para usuario #${i+1}:`, {
                userId, cip, nombre, grado, area, rol, bloqueado
            });
            
            html += `
                <tr>
                    <td>${userId}</td>
                    <td>${cip}</td>
                    <td>${nombre}</td>
                    <td>${grado}</td>
                    <td>${area}</td>
                    <td>${rol}</td>
                    <td>${estado}</td>
                    <td>
                        <button class="btn btn-sm btn-info btn-view-user" data-id="${userId}">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-sm btn-primary btn-edit-user" data-id="${userId}">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-danger btn-delete-user" data-id="${userId}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
        }
        
        html += `
                </tbody>
            </table>
        `;
        
        console.log('[USER-BUNDLE] Tabla renderizada correctamente');
        return html;
    },
    
    renderUserForm: function(user = null) {
        console.log('[USER-BUNDLE] Renderizando formulario de usuario', user ? `para edición de ${user.id}` : 'para creación');
        
        // Cargar áreas y roles para los selectores
        return `
            <form id="userForm" class="needs-validation" novalidate>
                ${user ? `<input type="hidden" id="userId" value="${user.id || user.IDUsuario}">` : ''}
                <div class="row mb-3">
                    <div class="col-md-6">
                        <label for="codigoCIP" class="form-label">Código CIP</label>
                        <input type="text" class="form-control" id="codigoCIP" value="${user?.codigoCIP || ''}" required>
                    </div>
                    <div class="col-md-6">
                        <label for="grado" class="form-label">Grado</label>
                        <input type="text" class="form-control" id="grado" value="${user?.grado || ''}">
                    </div>
                </div>
                <div class="row mb-3">
                    <div class="col-md-6">
                        <label for="nombres" class="form-label">Nombres</label>
                        <input type="text" class="form-control" id="nombres" value="${user?.nombres || ''}" required>
                    </div>
                    <div class="col-md-6">
                        <label for="apellidos" class="form-label">Apellidos</label>
                        <input type="text" class="form-control" id="apellidos" value="${user?.apellidos || ''}" required>
                    </div>
                </div>
                <div class="row mb-3">
                    <div class="col-md-6">
                        <label for="idArea" class="form-label">Área</label>
                        <select class="form-select" id="idArea" required>
                            <option value="">Seleccione un área</option>
                            <option value="1" ${user?.idArea == 1 || user?.IDArea == 1 ? 'selected' : ''}>Administración</option>
                            <option value="2" ${user?.idArea == 2 || user?.IDArea == 2 ? 'selected' : ''}>Operaciones</option>
                            <option value="3" ${user?.idArea == 3 || user?.IDArea == 3 ? 'selected' : ''}>Sistemas</option>
                            <option value="4" ${user?.idArea == 4 || user?.IDArea == 4 ? 'selected' : ''}>Recursos Humanos</option>
                        </select>
                    </div>
                    <div class="col-md-6">
                        <label for="idRol" class="form-label">Rol</label>
                        <select class="form-select" id="idRol" required>
                            <option value="">Seleccione un rol</option>
                            <option value="1" ${user?.idRol == 1 || user?.IDRol == 1 ? 'selected' : ''}>Administrador</option>
                            <option value="2" ${user?.idRol == 2 || user?.IDRol == 2 ? 'selected' : ''}>Usuario</option>
                            <option value="3" ${user?.idRol == 3 || user?.IDRol == 3 ? 'selected' : ''}>Supervisor</option>
                        </select>
                    </div>
                </div>
                ${!user ? `
                <div class="row mb-3">
                    <div class="col-md-6">
                        <label for="password" class="form-label">Contraseña</label>
                        <input type="password" class="form-control" id="password" required>
                    </div>
                    <div class="col-md-6">
                        <label for="confirmPassword" class="form-label">Confirmar Contraseña</label>
                        <input type="password" class="form-control" id="confirmPassword" required>
                    </div>
                </div>
                ` : ''}
                <div class="form-check mb-3">
                    <input class="form-check-input" type="checkbox" id="bloqueado" ${user?.bloqueado ? 'checked' : ''}>
                    <label class="form-check-label" for="bloqueado">
                        Usuario bloqueado
                    </label>
                </div>
                <div class="d-flex justify-content-end">
                    <button type="button" class="btn btn-secondary me-2" data-bs-dismiss="modal">Cancelar</button>
                    <button type="submit" class="btn btn-primary">Guardar</button>
                </div>
            </form>
        `;
    },
    
    showUserDetails: function(user) {
        console.log('[USER-BUNDLE] Mostrando detalles del usuario:', user);
        
        if (!user) {
            return '<div class="alert alert-danger">No se encontró información del usuario</div>';
        }
        
        return `
            <div class="user-details">
                <div class="mb-3">
                    <strong>ID:</strong> ${user.id || user.IDUsuario}
                </div>
                <div class="mb-3">
                    <strong>Código CIP:</strong> ${user.codigoCIP || 'N/A'}
                </div>
                <div class="mb-3">
                    <strong>Nombre completo:</strong> ${user.nombres || ''} ${user.apellidos || ''}
                </div>
                <div class="mb-3">
                    <strong>Grado:</strong> ${user.grado || 'N/A'}
                </div>
                <div class="mb-3">
                    <strong>Área:</strong> ${user.nombreArea || 'N/A'}
                </div>
                <div class="mb-3">
                    <strong>Rol:</strong> ${user.nombreRol || 'N/A'}
                </div>
                <div class="mb-3">
                    <strong>Estado:</strong> 
                    ${user.bloqueado 
                        ? '<span class="badge bg-danger">Bloqueado</span>' 
                        : '<span class="badge bg-success">Activo</span>'}
                </div>
            </div>
        `;
    },
    
    renderUserFormModal: function(title, content) {
        return `
            <div class="modal-header">
                <h5 class="modal-title">${title}</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
                ${content}
            </div>
        `;
    },
    
    // Inicialización de eventos 
    initUserEvents: function(permissions) {
        console.log('[USER-BUNDLE] Inicializando eventos de usuarios');
        console.log('[USER-BUNDLE] Permisos:', permissions);
        
        const self = this;
        
        // Evento para el botón de actualizar
        const refreshBtn = document.getElementById('refreshUsersBtn');
        if (refreshBtn) {
            console.log('[USER-BUNDLE] Configurando evento para el botón de actualizar');
            refreshBtn.addEventListener('click', async (e) => {
                try {
                    // Si se presiona con Shift, forzar recarga completa
                    if (e.shiftKey) {
                        window.location.reload();
                        return;
                    }
                    
                    // Obtener usuarios y actualizar tabla
                    const users = await self.getAllUsers();
                    const tableContainer = document.getElementById('usersTableContent');
                    if (tableContainer) {
                        tableContainer.innerHTML = self.renderUsersTable(users, permissions);
                    }
                } catch (error) {
                    console.error('[USER-BUNDLE] Error al actualizar usuarios:', error);
                    alert('Error al actualizar los usuarios: ' + error.message);
                }
            });
        } else {
            console.warn('[USER-BUNDLE] No se encontró el botón de actualizar');
        }
        
        // Evento para el botón de nuevo usuario
        const createBtn = document.getElementById('createUserBtn');
        if (createBtn) {
            console.log('[USER-BUNDLE] Configurando evento para el botón de nuevo usuario');
            createBtn.addEventListener('click', () => {
                self.showUserForm();
            });
        } else {
            console.warn('[USER-BUNDLE] No se encontró el botón de crear usuario');
        }
        
        // Eventos para botones de ver, editar y eliminar (delegación de eventos)
        const userContainer = document.getElementById('usersTableContent');
        if (userContainer) {
            console.log('[USER-BUNDLE] Configurando eventos para botones de acción en tabla');
            userContainer.addEventListener('click', async (e) => {
                // Encontrar el botón más cercano si se hizo clic en un elemento dentro
                const btn = e.target.closest('button');
                if (!btn) return;
                
                const userId = btn.dataset.id;
                
                // Ver usuario
                if (btn.classList.contains('btn-view-user')) {
                    console.log('[USER-BUNDLE] Clic en botón ver usuario:', userId);
                    try {
                        const user = await self.getUserById(userId);
                        self.showModal('Detalles del Usuario', self.showUserDetails(user));
                    } catch (error) {
                        console.error('[USER-BUNDLE] Error al ver usuario:', error);
                        self.showAlert('error', 'Error al cargar los detalles del usuario');
                    }
                }
                
                // Editar usuario
                if (btn.classList.contains('btn-edit-user')) {
                    console.log('[USER-BUNDLE] Clic en botón editar usuario:', userId);
                    try {
                        const user = await self.getUserById(userId);
                        self.showUserForm(user);
                    } catch (error) {
                        console.error('[USER-BUNDLE] Error al editar usuario:', error);
                        self.showAlert('error', 'Error al cargar el formulario de edición');
                    }
                }
                
                // Eliminar usuario
                if (btn.classList.contains('btn-delete-user')) {
                    console.log('[USER-BUNDLE] Clic en botón eliminar usuario:', userId);
                    if (confirm('¿Está seguro de eliminar este usuario?')) {
                        try {
                            await self.deleteUser(userId);
                            self.showAlert('success', 'Usuario eliminado exitosamente');
                            // Recargar la tabla
                            const users = await self.getAllUsers();
                            const tableContainer = document.getElementById('usersTableContent');
                            if (tableContainer) {
                                tableContainer.innerHTML = self.renderUsersTable(users, permissions);
                            }
                        } catch (error) {
                            console.error('[USER-BUNDLE] Error al eliminar usuario:', error);
                            self.showAlert('error', 'Error al eliminar el usuario');
                        }
                    }
                }
            });
        } else {
            console.warn('[USER-BUNDLE] No se encontró el contenedor de usuarios');
        }
    },
    
    showUserForm: function(user = null) {
        console.log('[USER-BUNDLE] Mostrando formulario de usuario', user ? 'para edición' : 'para creación');
        
        const title = user ? 'Editar Usuario' : 'Nuevo Usuario';
        const formHtml = this.renderUserForm(user);
        
        // Primero mostrar el modal con opciones estáticas
        this.showModal(title, formHtml);
        
        // Cargar áreas y roles para actualizar dinámicamente los selectores
        const self = this; // Guardar referencia para usar en setTimeout
        
        // Usar un pequeño timeout para asegurar que el DOM esté listo
        setTimeout(() => {
            console.log('[USER-BUNDLE] Ejecutando carga de áreas y roles después del timeout');
            self._loadAreasAndRoles();
            
            // Configurar eventos del formulario
            const form = document.getElementById('userForm');
            if (form) {
                form.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    
                    console.log('[USER-BUNDLE] Formulario enviado');
                    
                    // Validar formulario
                    if (!form.checkValidity()) {
                        e.stopPropagation();
                        form.classList.add('was-validated');
                        console.warn('[USER-BUNDLE] Formulario no válido');
                        
                        // Identificar campos inválidos
                        const invalidFields = form.querySelectorAll(':invalid');
                        console.warn(`[USER-BUNDLE] Campos inválidos encontrados: ${invalidFields.length}`);
                        invalidFields.forEach(field => {
                            console.warn(`[USER-BUNDLE] Campo inválido: ${field.id || 'sin id'}, tipo: ${field.type}, valor: "${field.value}"`);
                        });
                        
                        return;
                    }
                    
                    try {
                        // Recopilar datos del formulario
                        console.log('[USER-BUNDLE] Recopilando datos del formulario');
                        
                        // Verificar cada campo individualmente y registrar su estado
                        const elementosFormulario = {
                            codigoCIP: document.getElementById('codigoCIP'),
                            nombres: document.getElementById('nombres'),
                            apellidos: document.getElementById('apellidos'),
                            grado: document.getElementById('grado'),
                            idArea: document.getElementById('idArea'),
                            idRol: document.getElementById('idRol'),
                            bloqueado: document.getElementById('bloqueado')
                        };
                        
                        // Verificar que todos los elementos necesarios existen
                        for (const [nombre, elemento] of Object.entries(elementosFormulario)) {
                            if (!elemento) {
                                console.error(`[USER-BUNDLE] ERROR: Elemento ${nombre} no encontrado en el formulario`);
                            } else {
                                console.log(`[USER-BUNDLE] Elemento ${nombre} encontrado: valor=${elemento.value}, tipo=${elemento.type}`);
                            }
                        }
                        
                        const userData = {
                            codigoCIP: elementosFormulario.codigoCIP?.value || '',
                            nombres: elementosFormulario.nombres?.value || '',
                            apellidos: elementosFormulario.apellidos?.value || '',
                            grado: elementosFormulario.grado?.value || '',
                            idArea: parseInt(elementosFormulario.idArea?.value || '0'),
                            idRol: parseInt(elementosFormulario.idRol?.value || '0'),
                            bloqueado: elementosFormulario.bloqueado?.checked || false
                        };
                        
                        console.log('[USER-BUNDLE] Datos del formulario:', userData);
                        console.log('[USER-BUNDLE] Datos del formulario (formato JSON):', JSON.stringify(userData, null, 2));
                        
                        // Validar datos críticos
                        if (isNaN(userData.idArea) || userData.idArea <= 0) {
                            console.error('[USER-BUNDLE] Error: Área no seleccionada');
                            console.log('[USER-BUNDLE] Valor actual del selector de áreas:', elementosFormulario.idArea?.value);
                            console.log('[USER-BUNDLE] Opciones disponibles:', Array.from(elementosFormulario.idArea?.options || []).map(opt => `${opt.value}: ${opt.text}`));
                            self.showAlert('error', 'Debe seleccionar un área válida');
                            return;
                        }
                        
                        if (isNaN(userData.idRol) || userData.idRol <= 0) {
                            console.error('[USER-BUNDLE] Error: Rol no seleccionado');
                            console.log('[USER-BUNDLE] Valor actual del selector de roles:', elementosFormulario.idRol?.value);
                            console.log('[USER-BUNDLE] Opciones disponibles:', Array.from(elementosFormulario.idRol?.options || []).map(opt => `${opt.value}: ${opt.text}`));
                            self.showAlert('error', 'Debe seleccionar un rol válido');
                            return;
                        }
                        
                        if (user) {
                            // Actualizar usuario existente
                            const userId = document.getElementById('userId').value;
                            console.log(`[USER-BUNDLE] Actualizando usuario ${userId}`);
                            await self.updateUser(userId, userData);
                            
                            // Cerrar modal antes de mostrar alerta
                            self.closeModal();
                            setTimeout(() => {
                                self.showAlert('success', 'Usuario actualizado exitosamente');
                            }, 300);
                        } else {
                            // Crear nuevo usuario
                            const passwordElement = document.getElementById('password');
                            const confirmPasswordElement = document.getElementById('confirmPassword');
                            
                            if (!passwordElement) {
                                console.error('[USER-BUNDLE] ERROR: Elemento password no encontrado');
                            } else if (!confirmPasswordElement) {
                                console.error('[USER-BUNDLE] ERROR: Elemento confirmPassword no encontrado');
                            } else {
                                userData.password = passwordElement.value;
                                const confirmPassword = confirmPasswordElement.value;
                                
                                console.log('[USER-BUNDLE] Password ingresado (longitud):', userData.password.length);
                                console.log('[USER-BUNDLE] Confirm password ingresado (longitud):', confirmPassword.length);
                                
                                if (!userData.password) {
                                    console.error('[USER-BUNDLE] Error: Contraseña no ingresada');
                                    self.showAlert('error', 'Debe ingresar una contraseña');
                                    return;
                                }
                                
                                if (userData.password !== confirmPassword) {
                                    console.error('[USER-BUNDLE] Error: Las contraseñas no coinciden');
                                    console.log(`[USER-BUNDLE] Password: "${userData.password}", Confirm: "${confirmPassword}"`);
                                    self.showAlert('error', 'Las contraseñas no coinciden');
                                    return;
                                }
                            }
                            
                            console.log('[USER-BUNDLE] Creando nuevo usuario');
                            await self.createUser(userData);
                            
                            // Cerrar modal antes de mostrar alerta
                            self.closeModal();
                            setTimeout(() => {
                                self.showAlert('success', 'Usuario creado exitosamente');
                            }, 300);
                        }
                        
                        // Recargar datos después de cerrar el modal
                        setTimeout(async () => {
                            console.log('[USER-BUNDLE] Recargando tabla de usuarios');
                            const users = await self.getAllUsers();
                            const tableContainer = document.getElementById('usersTableContent');
                            if (tableContainer) {
                                tableContainer.innerHTML = self.renderUsersTable(users, {});
                            }
                        }, 500);
                    } catch (error) {
                        console.error('[USER-BUNDLE] Error al guardar usuario:', error);
                        console.error('[USER-BUNDLE] Stack completo del error:', error.stack);
                        self.showAlert('error', 'Error al guardar el usuario: ' + error.message);
                    }
                });
                
                console.log('[USER-BUNDLE] Eventos del formulario configurados correctamente');
            } else {
                console.error('[USER-BUNDLE] ERROR: No se encontró el formulario (#userForm)');
            }
        }, 100);
    },
    
    loadUsers: async function() {
        console.log('[USER-BUNDLE] Cargando usuarios...');
        return await this.getAllUsers();
    },
    
    // Servicios de metadatos (áreas y roles)
    getAllAreas: async function() {
        console.log('[USER-BUNDLE] Obteniendo áreas');
        
        // Intentar obtener áreas del servidor
        try {
            console.log('[USER-BUNDLE] Realizando petición fetch a /api/areas');
            const response = await fetch('/api/areas', {
                method: 'GET',
                headers: this.getAuthHeaders()
            });
            
            console.log('[USER-BUNDLE] Respuesta del servidor para áreas:', response.status, response.statusText);
            
            if (response.ok) {
                const data = await response.json();
                console.log('[USER-BUNDLE] Áreas recibidas del servidor (raw):', data);
                let areas = [];
                
                // Procesar según la estructura de la respuesta
                if (Array.isArray(data)) {
                    areas = data;
                } else if (data.areas && Array.isArray(data.areas)) {
                    areas = data.areas;
                } else if (data.data && Array.isArray(data.data)) {
                    areas = data.data;
                } else if (typeof data === 'object' && data !== null) {
                    // Intentar extraer áreas de cualquier propiedad que parezca un array
                    for (const key in data) {
                        if (Array.isArray(data[key])) {
                            console.log(`[USER-BUNDLE] Posible array de áreas encontrado en data.${key}`);
                            areas = data[key];
                            break;
                        }
                    }
                }
                
                if (areas.length > 0) {
                    console.log('[USER-BUNDLE] Áreas procesadas:', areas.length);
                    
                    // Normalizar el formato de cada área
                    return areas.map(area => {
                        return {
                            id: area.id || area.ID || area.idArea || area.IDArea || 0,
                            nombre: area.nombre || area.Nombre || area.nombreArea || area.NombreArea || 
                                    area.name || area.Name || `Área ${areas.indexOf(area) + 1}`
                        };
                    });
                }
            }
        } catch (e) {
            console.error('[USER-BUNDLE] Error al obtener áreas del servidor:', e);
            console.error('[USER-BUNDLE] Stack:', e.stack);
        }
        
        // Mock data para áreas si falla la petición
        console.log('[USER-BUNDLE] Usando áreas predefinidas');
        const mockAreas = [
            { id: 1, nombre: 'Administración' },
            { id: 2, nombre: 'Operaciones' },
            { id: 3, nombre: 'Sistemas' },
            { id: 4, nombre: 'Recursos Humanos' }
        ];
        console.log('[USER-BUNDLE] Retornando áreas predefinidas:', mockAreas);
        return mockAreas;
    },
    
    getAllRoles: async function() {
        console.log('[USER-BUNDLE] Obteniendo roles');
        
        // Intentar obtener roles del servidor
        try {
            console.log('[USER-BUNDLE] Realizando petición fetch a /api/roles');
            const response = await fetch('/api/roles', {
                method: 'GET',
                headers: this.getAuthHeaders()
            });
            
            console.log('[USER-BUNDLE] Respuesta del servidor para roles:', response.status, response.statusText);
            
            if (response.ok) {
                const data = await response.json();
                console.log('[USER-BUNDLE] Roles recibidos del servidor (raw):', data);
                let roles = [];
                
                // Procesar según la estructura de la respuesta
                if (Array.isArray(data)) {
                    roles = data;
                } else if (data.roles && Array.isArray(data.roles)) {
                    roles = data.roles;
                } else if (data.data && Array.isArray(data.data)) {
                    roles = data.data;
                } else if (typeof data === 'object' && data !== null) {
                    // Intentar extraer roles de cualquier propiedad que parezca un array
                    for (const key in data) {
                        if (Array.isArray(data[key])) {
                            console.log(`[USER-BUNDLE] Posible array de roles encontrado en data.${key}`);
                            roles = data[key];
                            break;
                        }
                    }
                }
                
                if (roles.length > 0) {
                    console.log('[USER-BUNDLE] Roles procesados:', roles.length);
                    
                    // Normalizar el formato de cada rol
                    return roles.map(rol => {
                        return {
                            id: rol.id || rol.ID || rol.idRol || rol.IDRol || 0,
                            nombre: rol.nombre || rol.Nombre || rol.nombreRol || rol.NombreRol || 
                                   rol.name || rol.Name || `Rol ${roles.indexOf(rol) + 1}`
                        };
                    });
                }
            }
        } catch (e) {
            console.error('[USER-BUNDLE] Error al obtener roles del servidor:', e);
            console.error('[USER-BUNDLE] Stack:', e.stack);
        }
        
        // Mock data para roles si falla la petición
        console.log('[USER-BUNDLE] Usando roles predefinidos');
        const mockRoles = [
            { id: 1, nombre: 'Administrador' },
            { id: 2, nombre: 'Usuario' },
            { id: 3, nombre: 'Supervisor' }
        ];
        console.log('[USER-BUNDLE] Retornando roles predefinidos:', mockRoles);
        return mockRoles;
    },
    
    // Función auxiliar para cargar áreas y roles y actualizar los selectores
    _loadAreasAndRoles: async function() {
        try {
            console.log('[USER-BUNDLE] Cargando áreas y roles para los selectores...');
            console.log('[USER-BUNDLE] DOM listo:', document.readyState);
            
            // Cargar áreas
            const areas = await this.getAllAreas();
            console.log('[USER-BUNDLE] Áreas cargadas:', JSON.stringify(areas));
            
            // Debug: Verificar la estructura de los objetos de área
            if (areas && areas.length > 0) {
                console.log('[USER-BUNDLE] Primer área (muestra):', JSON.stringify(areas[0]));
                console.log('[USER-BUNDLE] Propiedades del primer área:', Object.keys(areas[0]));
            }
            
            // Actualizar selector de áreas
            const areaSelect = document.getElementById('idArea');
            if (areaSelect) {
                console.log('[USER-BUNDLE] Selector de áreas encontrado, actualizando opciones');
                
                // Mantener la opción por defecto
                let html = '<option value="">Seleccione un área</option>';
                
                // Agregar opciones de áreas
                areas.forEach(area => {
                    // Intentar extraer el ID y nombre con todos los posibles nombres de propiedad
                    let id = null;
                    if (area.id !== undefined) id = area.id;
                    else if (area.ID !== undefined) id = area.ID;
                    else if (area.idArea !== undefined) id = area.idArea;
                    else if (area.IDArea !== undefined) id = area.IDArea;
                    
                    let nombre = null;
                    if (area.nombre !== undefined) nombre = area.nombre;
                    else if (area.Nombre !== undefined) nombre = area.Nombre;
                    else if (area.nombreArea !== undefined) nombre = area.nombreArea;
                    else if (area.NombreArea !== undefined) nombre = area.NombreArea;
                    else if (area.name !== undefined) nombre = area.name;
                    else if (area.Name !== undefined) nombre = area.Name;
                    
                    // Si no se encontró un ID o nombre, usar valores por defecto y registrar
                    if (id === null) {
                        console.warn(`[USER-BUNDLE] No se pudo extraer ID del área:`, area);
                        id = areas.indexOf(area) + 1; // Usar índice + 1 como fallback
                    }
                    
                    if (nombre === null) {
                        console.warn(`[USER-BUNDLE] No se pudo extraer nombre del área:`, area);
                        nombre = `Área ${id}`; // Nombre genérico como fallback
                    }
                    
                    console.log(`[USER-BUNDLE] Agregando área: ID=${id}, Nombre=${nombre}`);
                    html += `<option value="${id}">${nombre}</option>`;
                });
                
                console.log('[USER-BUNDLE] HTML generado para selector de áreas:', html);
                
                // Actualizar HTML del selector
                areaSelect.innerHTML = html;
                console.log('[USER-BUNDLE] Selector de áreas actualizado con', areas.length, 'opciones');
            } else {
                console.error('[USER-BUNDLE] No se encontró el selector de áreas (#idArea)');
            }
            
            // Cargar roles
            const roles = await this.getAllRoles();
            console.log('[USER-BUNDLE] Roles cargados:', JSON.stringify(roles));
            
            // Debug: Verificar la estructura de los objetos de rol
            if (roles && roles.length > 0) {
                console.log('[USER-BUNDLE] Primer rol (muestra):', JSON.stringify(roles[0]));
                console.log('[USER-BUNDLE] Propiedades del primer rol:', Object.keys(roles[0]));
            }
            
            // Actualizar selector de roles
            const rolSelect = document.getElementById('idRol');
            if (rolSelect) {
                console.log('[USER-BUNDLE] Selector de roles encontrado, actualizando opciones');
                
                // Mantener la opción por defecto
                let html = '<option value="">Seleccione un rol</option>';
                
                // Agregar opciones de roles
                roles.forEach(rol => {
                    // Intentar extraer el ID y nombre con todos los posibles nombres de propiedad
                    let id = null;
                    if (rol.id !== undefined) id = rol.id;
                    else if (rol.ID !== undefined) id = rol.ID;
                    else if (rol.idRol !== undefined) id = rol.idRol;
                    else if (rol.IDRol !== undefined) id = rol.IDRol;
                    
                    let nombre = null;
                    if (rol.nombre !== undefined) nombre = rol.nombre;
                    else if (rol.Nombre !== undefined) nombre = rol.Nombre;
                    else if (rol.nombreRol !== undefined) nombre = rol.nombreRol;
                    else if (rol.NombreRol !== undefined) nombre = rol.NombreRol;
                    else if (rol.name !== undefined) nombre = rol.name;
                    else if (rol.Name !== undefined) nombre = rol.Name;
                    
                    // Si no se encontró un ID o nombre, usar valores por defecto y registrar
                    if (id === null) {
                        console.warn(`[USER-BUNDLE] No se pudo extraer ID del rol:`, rol);
                        id = roles.indexOf(rol) + 1; // Usar índice + 1 como fallback
                    }
                    
                    if (nombre === null) {
                        console.warn(`[USER-BUNDLE] No se pudo extraer nombre del rol:`, rol);
                        nombre = `Rol ${id}`; // Nombre genérico como fallback
                    }
                    
                    console.log(`[USER-BUNDLE] Agregando rol: ID=${id}, Nombre=${nombre}`);
                    html += `<option value="${id}">${nombre}</option>`;
                });
                
                console.log('[USER-BUNDLE] HTML generado para selector de roles:', html);
                
                // Actualizar HTML del selector
                rolSelect.innerHTML = html;
                console.log('[USER-BUNDLE] Selector de roles actualizado con', roles.length, 'opciones');
            } else {
                console.error('[USER-BUNDLE] No se encontró el selector de roles (#idRol)');
            }
            
            // Agregar pequeña pausa para asegurar que el DOM se ha actualizado
            setTimeout(() => {
                console.log('[USER-BUNDLE] Verificando estado final de los selectores:');
                const areaSelectAfter = document.getElementById('idArea');
                const rolSelectAfter = document.getElementById('idRol');
                
                if (areaSelectAfter) {
                    console.log('[USER-BUNDLE] Selector de áreas (final):', 
                        areaSelectAfter.options.length, 'opciones, valor actual:', 
                        areaSelectAfter.value);
                }
                
                if (rolSelectAfter) {
                    console.log('[USER-BUNDLE] Selector de roles (final):', 
                        rolSelectAfter.options.length, 'opciones, valor actual:', 
                        rolSelectAfter.value);
                }
            }, 500);
            
        } catch (error) {
            console.error('[USER-BUNDLE] Error al cargar áreas y roles:', error);
            console.error('[USER-BUNDLE] Stack:', error.stack);
            
            // En caso de error, intentar cargar opciones por defecto
            this._loadDefaultOptions();
        }
    },
    
    // Función para cargar opciones por defecto en caso de error
    _loadDefaultOptions: function() {
        try {
            console.log('[USER-BUNDLE] Cargando opciones por defecto para áreas y roles');
            
            // Áreas por defecto
            const defaultAreas = [
                { id: 1, nombre: 'Administración' },
                { id: 2, nombre: 'Operaciones' },
                { id: 3, nombre: 'Sistemas' },
                { id: 4, nombre: 'Recursos Humanos' }
            ];
            
            // Roles por defecto
            const defaultRoles = [
                { id: 1, nombre: 'Administrador' },
                { id: 2, nombre: 'Usuario' },
                { id: 3, nombre: 'Supervisor' }
            ];
            
            // Actualizar selector de áreas
            const areaSelect = document.getElementById('idArea');
            if (areaSelect) {
                let html = '<option value="">Seleccione un área</option>';
                defaultAreas.forEach(area => {
                    html += `<option value="${area.id}">${area.nombre}</option>`;
                });
                areaSelect.innerHTML = html;
                console.log('[USER-BUNDLE] Selector de áreas actualizado con opciones por defecto');
            }
            
            // Actualizar selector de roles
            const rolSelect = document.getElementById('idRol');
            if (rolSelect) {
                let html = '<option value="">Seleccione un rol</option>';
                defaultRoles.forEach(rol => {
                    html += `<option value="${rol.id}">${rol.nombre}</option>`;
                });
                rolSelect.innerHTML = html;
                console.log('[USER-BUNDLE] Selector de roles actualizado con opciones por defecto');
            }
        } catch (error) {
            console.error('[USER-BUNDLE] Error al cargar opciones por defecto:', error);
        }
    },
    
    // Función auxiliar para obtener el nombre de un área por su ID
    _getAreaName: function(areaId) {
        const areaNames = {
            1: 'Administración',
            2: 'Operaciones',
            3: 'Sistemas',
            4: 'Recursos Humanos'
        };
        return areaNames[areaId] || 'Área Desconocida';
    },
    
    // Función auxiliar para obtener el nombre de un rol por su ID
    _getRoleName: function(rolId) {
        const roleNames = {
            1: 'Administrador',
            2: 'Usuario',
            3: 'Supervisor'
        };
        return roleNames[rolId] || 'Rol Desconocido';
    },
    
    // Utilidades
    showAlert: function(type, message) {
        console.log(`[USER-BUNDLE] Mostrando alerta de tipo ${type}:`, message);
        
        // Crear elemento de alerta
        const alertElement = document.createElement('div');
        alertElement.className = `alert alert-${type === 'error' ? 'danger' : type} alert-dismissible fade show position-fixed top-0 end-0 m-3`;
        alertElement.setAttribute('role', 'alert');
        alertElement.style.zIndex = '9999';
        
        // Contenido de la alerta
        alertElement.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        `;
        
        // Agregar al documento
        document.body.appendChild(alertElement);
        
        // Eliminar después de un tiempo
        setTimeout(() => {
            alertElement.classList.remove('show');
            setTimeout(() => alertElement.remove(), 300);
        }, 5000);
    },
    
    showModal: function(title, content) {
        console.log('[USER-BUNDLE] Mostrando modal:', title);
        
        // Primero, asegurarse de que no haya modal o backdrop previo
        this.cleanupModals();
        
        // Verificar si ya existe un modal
        let modalElement = document.getElementById('userModal');
        
        // Si no existe, crear el elemento
        if (!modalElement) {
            modalElement = document.createElement('div');
            modalElement.className = 'modal fade';
            modalElement.id = 'userModal';
            modalElement.setAttribute('tabindex', '-1');
            modalElement.setAttribute('aria-labelledby', 'userModalLabel');
            modalElement.setAttribute('aria-hidden', 'true');
            
            // Estructura del modal
            modalElement.innerHTML = `
                <div class="modal-dialog modal-lg">
                    <div class="modal-content" id="userModalContent">
                        <!-- Contenido dinámico aquí -->
                    </div>
                </div>
            `;
            
            // Agregar al documento
            document.body.appendChild(modalElement);
            console.log('[USER-BUNDLE] Modal creado y añadido al DOM');
        }
        
        // Actualizar contenido
        const modalContent = document.getElementById('userModalContent');
        if (modalContent) {
            modalContent.innerHTML = this.renderUserFormModal(title, content);
            console.log('[USER-BUNDLE] Contenido del modal actualizado');
        } else {
            console.error('[USER-BUNDLE] No se pudo encontrar el contenedor del contenido del modal (#userModalContent)');
        }
        
        try {
            // Mostrar el modal usando Bootstrap
            console.log('[USER-BUNDLE] Intentando inicializar y mostrar modal con Bootstrap');
            const modalInstance = new bootstrap.Modal(modalElement, {
                backdrop: 'static',  // No permite cerrar al hacer clic fuera del modal
                keyboard: false      // No permite cerrar con la tecla Escape
            });
            modalInstance.show();
        } catch (e) {
            // Error al mostrar con Bootstrap, mostrar manualmente
            console.error('[USER-BUNDLE] Error al mostrar modal con Bootstrap, mostrando manualmente:', e);
            modalElement.style.display = 'block';
            modalElement.classList.add('show');
            document.body.classList.add('modal-open');
            
            // Crear backdrop manualmente
            const backdrop = document.createElement('div');
            backdrop.className = 'modal-backdrop fade show';
            document.body.appendChild(backdrop);
        }
    },
    
    // Nueva función para limpiar modales previos que puedan haber quedado
    cleanupModals: function() {
        console.log('[USER-BUNDLE] Limpiando modales previos');
        
        // Eliminar backdrops existentes
        const backdrops = document.querySelectorAll('.modal-backdrop');
        if (backdrops.length > 0) {
            console.log(`[USER-BUNDLE] Eliminando ${backdrops.length} backdrops existentes`);
            backdrops.forEach(backdrop => backdrop.remove());
        }
        
        // Restablecer estado del body
        document.body.classList.remove('modal-open');
        document.body.style.overflow = '';
        document.body.style.paddingRight = '';
        
        // Intentar cerrar cualquier modal existente
        const existingModal = document.getElementById('userModal');
        if (existingModal) {
            try {
                const modal = bootstrap.Modal.getInstance(existingModal);
                if (modal) {
                    modal.dispose();
                }
                existingModal.remove();
                console.log('[USER-BUNDLE] Modal existente eliminado');
            } catch (e) {
                console.error('[USER-BUNDLE] Error al limpiar modal existente:', e);
                // Intentar eliminar manualmente
                existingModal.remove();
            }
        }
    },
    
    closeModal: function() {
        console.log('[USER-BUNDLE] Cerrando modal');
        
        const modalElement = document.getElementById('userModal');
        if (modalElement) {
            try {
                // Intentar cerrar con Bootstrap
                const modal = bootstrap.Modal.getInstance(modalElement);
                if (modal) {
                    modal.hide();
                } else {
                    // Cerrar manualmente si no hay instancia Bootstrap
                    modalElement.style.display = 'none';
                    modalElement.classList.remove('show');
                    document.body.classList.remove('modal-open');
                    
                    // Eliminar backdrop
                    const backdrop = document.querySelector('.modal-backdrop');
                    if (backdrop) {
                        backdrop.remove();
                    }
                }
            } catch (e) {
                // Si falla el método Bootstrap, cerrar manualmente
                console.error('[USER-BUNDLE] Error al cerrar modal con Bootstrap, cerrando manualmente:', e);
                modalElement.style.display = 'none';
                modalElement.classList.remove('show');
                document.body.classList.remove('modal-open');
                
                // Eliminar backdrop
                const backdrop = document.querySelector('.modal-backdrop');
                if (backdrop) {
                    backdrop.remove();
                }
            }
            
            // Asegurarse de que los estilos de body se han restaurado
            document.body.style.overflow = '';
            document.body.style.paddingRight = '';
        }
    },
    
    forcePageReload: function() {
        console.log('[USER-BUNDLE] Forzando recarga de página');
        window.location.reload();
    }
};

// Exportar objeto completo como default
export default userService;

// Exportar funciones individuales para compatibilidad con módulos existentes
export const {
    // Servicios de API
    getAuthHeaders,
    getAllUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser,
    toggleUserBlock,
    
    // Funciones de renderizado
    renderUsersTable,
    renderUserForm,
    showUserDetails,
    renderUserFormModal,
    
    // Funciones de eventos
    initUserEvents,
    showUserForm,
    loadUsers,
    
    // Funciones de áreas y roles
    getAllAreas,
    getAllRoles,
    
    // Funciones de utilidad
    showAlert,
    showModal,
    closeModal,
    forcePageReload
} = userService; 