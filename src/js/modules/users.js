// Funciones relacionadas con usuarios
export async function loadUsers() {
    try {
        const response = await fetch('/api/users');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const allUsers = await response.json();
        // Filtrar solo usuarios con nivel de acceso definido
        const users = allUsers.filter(user => 
            user.NivelAcceso !== undefined && 
            user.NivelAcceso !== null && 
            user.NivelAcceso !== 'undefined' &&
            user.NivelAcceso !== ''
        );
        renderUsers(users);
    } catch (error) {
        console.error('Error al cargar usuarios:', error);
    }
}

export function renderUsers(users) {
    const tbody = document.querySelector('#users-table tbody');
    if (!tbody) return;

    tbody.innerHTML = '';
    users.forEach(user => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${user.Username || ''}</td>
            <td>${user.NombreArea || 'No asignada'}</td>
            <td>${user.NombreRol ? `${user.NombreRol} (Nivel ${user.NivelAcceso})` : 'No asignado'}</td>
            <td>
                <button class="action-btn edit-btn" data-id="${user.IDUsuario}">
                    <i class="fas fa-edit"></i> Editar
                </button>
                <button class="action-btn delete-btn" data-id="${user.IDUsuario}">
                    <i class="fas fa-trash"></i> Eliminar
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    // Agregar event listeners para los botones
    tbody.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', () => editUser(btn.dataset.id));
    });
    tbody.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', () => deleteUser(btn.dataset.id));
    });
}

export async function handleUserSubmit(e) {
    e.preventDefault();
    
    if (!validatePasswords()) {
        return;
    }
    
    try {
        const userData = {
            username: document.getElementById('username-input').value,
            password: document.getElementById('password-input').value,
            idArea: parseInt(document.getElementById('area-select').value),
            nivelAcceso: parseInt(document.getElementById('nivel-acceso-select').value),
            puedeCrear: document.getElementById('puede-crear').checked,
            puedeEditar: document.getElementById('puede-editar').checked,
            puedeDerivar: document.getElementById('puede-derivar').checked,
            puedeAuditar: document.getElementById('puede-auditar').checked
        };

        const response = await fetch('/api/users', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        await response.json();
        alert('Usuario creado exitosamente');
        document.getElementById('user-modal').style.display = 'none';
        e.target.reset();
        await loadUsers();
    } catch (error) {
        console.error('Error al crear usuario:', error);
        alert('Error al crear usuario: ' + error.message);
    }
}

export async function editUser(id) {
    try {
        const response = await fetch(`/api/users/${id}`);
        if (!response.ok) {
            throw new Error('Error al cargar usuario');
        }
        const user = await response.json();
        
        // Obtener referencias a los elementos del formulario
        const form = document.getElementById('user-form');
        const usernameInput = form.querySelector('#username-input');
        const areaSelect = form.querySelector('#area-select');
        const nivelAccesoSelect = form.querySelector('#nivel-acceso-select');
        
        // Verificar que existan los elementos antes de asignar valores
        if (usernameInput) usernameInput.value = user.Username || '';
        if (areaSelect) areaSelect.value = user.IDArea || '';
        if (nivelAccesoSelect) nivelAccesoSelect.value = user.NivelAcceso || '';
        
        // Mostrar el modal
        const modal = document.getElementById('user-modal');
        if (modal) {
            modal.style.display = 'block';
            // Guardar el ID del usuario que se está editando
            modal.dataset.editingUserId = id;
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error al cargar usuario');
    }
}

export async function deleteUser(id) {
    if (confirm('¿Está seguro de que desea eliminar este usuario?')) {
        try {
            const response = await fetch(`/api/users/${id}`, {
                method: 'DELETE'
            });
            
            if (!response.ok) {
                throw new Error('Error al eliminar usuario');
            }
            
            alert('Usuario eliminado exitosamente');
            await loadUsers();
        } catch (error) {
            console.error('Error:', error);
            alert('Error al eliminar usuario');
        }
    }
}

function validatePasswords() {
    const password = document.getElementById('password-input').value;
    const confirmPassword = document.getElementById('confirm-password-input').value;
    
    if (password !== confirmPassword) {
        alert('Las contraseñas no coinciden');
        return false;
    }
    return true;
}
