/**
 * Módulo de usuarios - Versión inline
 * 
 * Este archivo contiene una implementación mínima del módulo de usuarios
 * con funciones básicas que no dependen de importaciones complejas.
 * Se usa como fallback cuando la versión completa no puede cargarse.
 */

const inlineUserService = {
    // Servicio de autenticación simplificado
    getAuthHeaders: function() {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        return {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };
    },
    
    // Función para obtener usuarios (versión simplificada)
    getAllUsers: async function() {
        try {
            console.log('[USER-MODULE-INLINE] Obteniendo usuarios (versión inline)');
            
            // Intentar obtener datos del servidor
            try {
                const response = await fetch('/api/usuarios', {
                    method: 'GET',
                    headers: this.getAuthHeaders()
                });
                
                if (response.ok) {
                    const data = await response.json();
                    return Array.isArray(data) ? data : 
                           Array.isArray(data.users) ? data.users : 
                           Array.isArray(data.data) ? data.data : [];
                }
            } catch (e) {
                console.error('[USER-MODULE-INLINE] Error al obtener datos del servidor:', e);
            }
            
            // Fallback a datos mock si la petición falla
            return [
                { 
                    id: 1, 
                    IDUsuario: 1,
                    codigoCIP: '12345678', 
                    nombres: 'Usuario', 
                    apellidos: 'De Prueba', 
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
                }
            ];
        } catch (error) {
            console.error('[USER-MODULE-INLINE] Error general:', error);
            return [];
        }
    },
    
    // Renderizado de tabla simplificado
    renderUsersTable: function(users, permissions) {
        console.log('[USER-MODULE-INLINE] Renderizando tabla de usuarios (versión inline)');
        
        if (!users || !Array.isArray(users) || users.length === 0) {
            return `
                <div class="alert alert-info">
                    <i class="fas fa-info-circle me-2"></i>
                    No hay usuarios para mostrar
                </div>
            `;
        }
        
        return `
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
                    ${users.map(user => `
                        <tr>
                            <td>${user.IDUsuario || user.id || ''}</td>
                            <td>${user.codigoCIP || ''}</td>
                            <td>${(user.nombres || '') + ' ' + (user.apellidos || '')}</td>
                            <td>${user.grado || ''}</td>
                            <td>${user.nombreArea || ''}</td>
                            <td>${user.nombreRol || ''}</td>
                            <td>${user.bloqueado ? '<span class="badge bg-danger">Bloqueado</span>' : '<span class="badge bg-success">Activo</span>'}</td>
                            <td>
                                <button class="btn btn-sm btn-info btn-view-user" data-id="${user.IDUsuario || user.id}">
                                    <i class="fas fa-eye"></i>
                                </button>
                                <button class="btn btn-sm btn-primary btn-edit-user" data-id="${user.IDUsuario || user.id}">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="btn btn-sm btn-danger btn-delete-user" data-id="${user.IDUsuario || user.id}">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    },
    
    // Inicialización de eventos simplificada
    initUserEvents: function(permissions) {
        console.log('[USER-MODULE-INLINE] Inicializando eventos (versión inline)');
        
        // Añadir eventlistener para el botón de refresh
        const refreshBtn = document.getElementById('refreshUsersBtn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', async () => {
                try {
                    const users = await this.getAllUsers();
                    const tableContainer = document.getElementById('usersTableContent');
                    if (tableContainer) {
                        tableContainer.innerHTML = this.renderUsersTable(users, permissions);
                    }
                } catch (error) {
                    console.error('[USER-MODULE-INLINE] Error al actualizar usuarios:', error);
                }
            });
        }
        
        // Placeholder para otros eventos
    },
    
    // Placeholder para otras funciones requeridas
    showUserForm: function() {
        console.log('[USER-MODULE-INLINE] Mostrando formulario (versión inline)');
        alert('Esta función no está disponible en la versión de emergencia del módulo');
    },
    
    loadUsers: async function() {
        return await this.getAllUsers();
    }
};

// Exportar objeto completo como default
export default inlineUserService;

// Exportar funciones individuales
export const {
    getAuthHeaders,
    getAllUsers,
    renderUsersTable,
    initUserEvents,
    showUserForm,
    loadUsers
} = inlineUserService; 