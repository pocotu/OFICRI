// Verificar autenticación al cargar la página
async function checkAuth() {
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

// Manejar el cierre de sesión
async function handleLogout() {
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
            console.error('Error al cerrar sesión');
        }
    } catch (error) {
        console.error('Error al cerrar sesión:', error);
    }
}

// Configurar eventos cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    // Verificar autenticación
    checkAuth();

    // Configurar botón de logout
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
});
