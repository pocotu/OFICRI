/**
 * Eventos del módulo de usuarios
 * Funciones para manejar eventos y carga de datos de usuarios
 */

import * as permissionUtils from '../../../utils/permissions.js';
import { getAllUsers, getUserById, createUser, updateUser, deleteUser, toggleUserBlock } from '../services/apiService.js';
import { getAllAreas, getAllRoles } from '../services/metadataService.js';
import { renderUsersTable, renderUserFormModal, showUserDetails } from '../components/userComponents.js';
import { showAlert, showModal, closeModal } from '../utils/userUtils.js';

/**
 * Inicializa los eventos del módulo de usuarios
 * @param {number} userPermissions - Permisos del usuario actual
 */
export const initUserEvents = (userPermissions) => {
    console.log('[USER-MODULE] Inicializando eventos del módulo de usuarios');
    
    const userContainer = document.getElementById('userContainer');
    
    if (!userContainer) {
        console.error('[USER-MODULE] No se encontró el contenedor de usuarios');
        return;
    }
    
    // Evento para cargar usuarios al iniciar
    loadUsers();
    
    // Evento para el botón de nuevo usuario
    document.querySelector('.btn-new-user')?.addEventListener('click', () => {
        showUserForm();
    });
    
    // Delegación de eventos para los botones de acción
    userContainer.addEventListener('click', async (event) => {
        const target = event.target.closest('button');
        
        if (!target) return;
        
        const userId = target.dataset.id;
        
        // Botón de ver detalles
        if (target.classList.contains('btn-view-user')) {
            try {
                const user = await getUserById(userId);
                showModal('Detalles del Usuario', showUserDetails(user));
            } catch (error) {
                showAlert('error', 'Error al cargar los detalles del usuario');
            }
        }
        
        // Botón de editar usuario
        if (target.classList.contains('btn-edit-user')) {
            if (!permissionUtils.canEdit(userPermissions)) {
                showAlert('error', 'No tienes permisos para editar usuarios');
                return;
            }
            
            showUserForm(userId);
        }
        
        // Botón de eliminar usuario
        if (target.classList.contains('btn-delete-user')) {
            if (!permissionUtils.canDelete(userPermissions)) {
                showAlert('error', 'No tienes permisos para eliminar usuarios');
                return;
            }
            
            // Confirmación antes de eliminar
            if (confirm('¿Está seguro que desea eliminar este usuario?')) {
                try {
                    await deleteUser(userId);
                    showAlert('success', 'Usuario eliminado correctamente');
                    loadUsers();
                } catch (error) {
                    showAlert('error', 'Error al eliminar el usuario');
                }
            }
        }
        
        // Botón de bloquear/desbloquear usuario
        if (target.classList.contains('btn-toggle-block')) {
            if (!permissionUtils.canBloquear(userPermissions)) {
                showAlert('error', 'No tienes permisos para bloquear/desbloquear usuarios');
                return;
            }
            
            const isBlocked = target.dataset.blocked === 'true';
            
            try {
                await toggleUserBlock(userId, !isBlocked);
                showAlert('success', `Usuario ${!isBlocked ? 'bloqueado' : 'desbloqueado'} correctamente`);
                loadUsers();
            } catch (error) {
                showAlert('error', `Error al ${!isBlocked ? 'bloquear' : 'desbloquear'} el usuario`);
            }
        }
    });
    
    // Delegación de eventos para el formulario de usuario
    document.addEventListener('submit', async (event) => {
        if (event.target.id === 'userForm') {
            event.preventDefault();
            
            const form = event.target;
            
            // Validar el formulario
            if (!form.checkValidity()) {
                event.stopPropagation();
                form.classList.add('was-validated');
                return;
            }
            
            // Recopilar datos del formulario
            const formData = new FormData(form);
            const userData = {
                codigoCIP: formData.get('CodigoCIP'),
                nombres: formData.get('Nombres'),
                apellidos: formData.get('Apellidos'),
                grado: formData.get('Grado'),
                idArea: parseInt(formData.get('IDArea')),
                idRol: parseInt(formData.get('IDRol'))
            };
            
            // Agregar contraseña solo si se proporciona
            const password = formData.get('Password');
            if (password) {
                userData.password = password;
            }
            
            // Operación de edición
            if (formData.get('IDUsuario')) {
                const userId = formData.get('IDUsuario');
                
                // Agregar estado de bloqueo para edición
                if (formData.has('Bloqueado')) {
                    userData.bloqueado = formData.get('Bloqueado') === 'true';
                }
                
                try {
                    await updateUser(userId, userData);
                    showAlert('success', 'Usuario actualizado correctamente');
                    closeModal();
                    loadUsers();
                } catch (error) {
                    showAlert('error', 'Error al actualizar el usuario');
                }
            } 
            // Operación de creación
            else {
                try {
                    await createUser(userData);
                    showAlert('success', 'Usuario creado correctamente');
                    closeModal();
                    loadUsers();
                } catch (error) {
                    showAlert('error', 'Error al crear el usuario');
                }
            }
        }
    });
};

/**
 * Muestra el formulario de creación/edición de usuario
 * @param {number|string} userId - ID del usuario a editar (null para nuevo usuario)
 */
export const showUserForm = async (userId = null) => {
    try {
        let user = null;
        let areas = [];
        let roles = [];
        
        // Obtener datos para el formulario
        if (userId) {
            user = await getUserById(userId);
        }
        
        areas = await getAllAreas();
        roles = await getAllRoles();
        
        // Mostrar formulario en modal
        showModal(
            userId ? 'Editar Usuario' : 'Nuevo Usuario',
            renderUserFormModal(user, areas, roles),
            'modal-lg'
        );
        
        // Agregar evento para mostrar/ocultar contraseña
        document.querySelectorAll('.toggle-password').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const passwordInput = e.currentTarget.previousElementSibling;
                const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
                passwordInput.setAttribute('type', type);
                e.currentTarget.querySelector('i').classList.toggle('fa-eye');
                e.currentTarget.querySelector('i').classList.toggle('fa-eye-slash');
            });
        });
    } catch (error) {
        console.error('[USER-MODULE] Error al mostrar formulario:', error);
        showAlert('error', 'Error al cargar el formulario de usuario');
    }
};

/**
 * Carga la lista de usuarios y la muestra en el contenedor
 */
export const loadUsers = async () => {
    try {
        console.log('[USER-MODULE] Cargando usuarios...');
        
        const userContainer = document.getElementById('userContainer');
        
        if (!userContainer) {
            console.error('[USER-MODULE] No se encontró el contenedor de usuarios');
            return;
        }
        
        // Mostrar indicador de carga
        userContainer.innerHTML = `
            <div class="text-center my-5">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Cargando...</span>
                </div>
                <p class="mt-2">Cargando usuarios...</p>
            </div>
        `;
        
        // Obtener usuarios y permisos
        const users = await getAllUsers();
        const userPermissions = permissionUtils.getCurrentUserPermissions();
        
        // Renderizar tabla de usuarios
        userContainer.innerHTML = renderUsersTable(users, userPermissions);
        
        console.log('[USER-MODULE] Usuarios cargados correctamente');
    } catch (error) {
        console.error('[USER-MODULE] Error al cargar usuarios:', error);
        
        const userContainer = document.getElementById('userContainer');
        
        if (userContainer) {
            userContainer.innerHTML = `
                <div class="alert alert-danger">
                    <i class="fas fa-exclamation-triangle me-2"></i>
                    Error al cargar los usuarios. Por favor, intente nuevamente.
                </div>
            `;
        }
    }
}; 