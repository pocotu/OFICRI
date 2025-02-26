// Manejo de sesión
export async function checkAuth() {
    try {
        const response = await fetch('/api/auth/check');
        if (!response.ok) {
            window.location.href = '/index.html';
            return;
        }
        const data = await response.json();
        if (!data.authenticated) {
            window.location.href = '/index.html';
        }
    } catch (error) {
        console.error('Error al verificar autenticación:', error);
        window.location.href = '/index.html';
    }
}

export async function handleLogout() {
    try {
        const response = await fetch('/api/auth/logout', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            window.location.href = '/index.html';
        } else {
            throw new Error('Error al cerrar sesión');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error al cerrar sesión');
    }
}

// Inicializar manejo de sesión
export function initializeSession() {
    checkAuth();
    
    // Agregar event listener al botón de logout
    const logoutBtn = document.querySelector('#logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    } else {
        console.error('No se encontró el botón de logout');
    }
}
