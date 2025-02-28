// Función para iniciar sesión
async function login(username, password) {
    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Error al iniciar sesión');
        }
        
        // Guardar información del usuario en sessionStorage
        sessionStorage.setItem('user', JSON.stringify(data.user));
        
        return data;
    } catch (error) {
        console.error('Error en login:', error);
        throw error;
    }
}

// Función para cerrar sesión
async function logout() {
    try {
        const response = await fetch('/api/auth/logout', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include' // Asegurar que se envíen las cookies de sesión
        });

        const data = await response.json();
        
        // Limpiar datos de sesión
        sessionStorage.removeItem('user');
        localStorage.removeItem('user');
        
        // Redirigir al usuario a la página de inicio después de cerrar sesión
        window.location.href = '/index.html';
        
        return data;
    } catch (error) {
        console.error('Error en logout:', error);
        // En caso de error, intentar forzar el cierre de sesión
        forceLogout();
        throw error;
    }
}

// Función para verificar si el usuario está autenticado
async function checkAuth() {
    try {
        const response = await fetch('/api/auth/check');
        
        if (!response.ok) {
            return { authenticated: false };
        }
        
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error al verificar autenticación:', error);
        return { authenticated: false };
    }
}

// Función para obtener el usuario actual desde sessionStorage
function getCurrentUser() {
    const userStr = sessionStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
}

// Función para verificar si el usuario tiene un permiso específico
function hasPermission(permission) {
    const user = getCurrentUser();
    if (!user || !user.permisos) return false;
    
    return user.permisos[permission] === true;
}

// Función para forzar el cierre de sesión sin esperar respuesta del servidor
function forceLogout() {
    // Limpiar datos de sesión local
    sessionStorage.clear();
    localStorage.clear();
    
    // Limpiar cookies
    document.cookie.split(";").forEach(cookie => {
        const [name] = cookie.trim().split("=");
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
    });
    
    // Redirigir al inicio
    window.location.href = '/index.html';
}

// Exportar funciones
window.auth = {
    login,
    logout,
    forceLogout,
    checkAuth,
    getCurrentUser,
    hasPermission
};