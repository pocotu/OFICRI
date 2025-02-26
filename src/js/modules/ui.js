// Funciones relacionadas con la interfaz de usuario
export function setupNavigation() {
    const sections = document.querySelectorAll('.section');
    const navButtons = document.querySelectorAll('.nav-btn');

    // Función para cambiar de sección
    function switchSection(targetId) {
        // Ocultar todas las secciones
        sections.forEach(section => {
            section.style.display = 'none';
            section.classList.remove('active');
        });
        
        // Mostrar la sección seleccionada
        const targetSection = document.getElementById(targetId);
        if (targetSection) {
            targetSection.style.display = 'block';
            targetSection.classList.add('active');
        }
    }

    // Mostrar la primera sección por defecto
    if (sections.length > 0) {
        switchSection(sections[0].id);
    }

    // Configurar los botones de navegación
    navButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetId = button.getAttribute('data-target');
            
            // Actualizar botones
            navButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            // Cambiar sección
            switchSection(targetId);
        });
    });
}

export function setupModals() {
    // Configurar botones para cerrar modales
    document.querySelectorAll('.close').forEach(closeBtn => {
        closeBtn.addEventListener('click', function() {
            const modal = this.closest('.modal');
            if (modal) {
                modal.style.display = 'none';
            }
        });
    });

    // Cerrar modal al hacer click fuera
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            e.target.style.display = 'none';
        }
    });
}

export function setupPasswordToggles() {
    document.querySelectorAll('.toggle-password').forEach(button => {
        button.addEventListener('click', function() {
            const input = this.parentElement.querySelector('input');
            const icon = this.querySelector('i');
            
            if (input.type === 'password') {
                input.type = 'text';
                icon.classList.remove('bx-hide');
                icon.classList.add('bx-show');
            } else {
                input.type = 'password';
                icon.classList.remove('bx-show');
                icon.classList.add('bx-hide');
            }
        });
    });
}

export async function handleLogout() {
    try {
        const response = await fetch('/api/auth/logout', {
            method: 'POST'
        });

        if (!response.ok) {
            throw new Error('Error al cerrar sesión');
        }
        
        window.location.href = '/login';
    } catch (error) {
        console.error('Error:', error);
        alert('Error al cerrar sesión');
    }
}
