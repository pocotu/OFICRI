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
    console.log('dashboard-common.js: handleLogout iniciado');
    try {
        if (window.auth && typeof window.auth.logout === 'function') {
            console.log('dashboard-common.js: window.auth.logout está disponible, llamando...');
            // Usar un timeout para que el proceso no se quede bloqueado indefinidamente
            const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Timeout esperando respuesta de logout')), 5000)
            );
            
            try {
                // Race entre el logout regular y un timeout
                await Promise.race([window.auth.logout(), timeoutPromise]);
            } catch (timeoutError) {
                console.error('dashboard-common.js: Timeout en logout, usando forceLogout', timeoutError);
                // Si hay timeout, usar el logout forzado
                if (window.auth && typeof window.auth.forceLogout === 'function') {
                    window.auth.forceLogout();
                } else {
                    // Si no hay método forceLogout, hacemos logout manual
                    localStorage.clear();
                    sessionStorage.clear();
                    window.location.href = '/index.html';
                }
            }
        } else {
            console.error('dashboard-common.js: window.auth.logout no está disponible');
            // Fallback si la función auth.logout no está disponible
            localStorage.clear();
            sessionStorage.clear();
            window.location.href = '/index.html';
        }
    } catch (error) {
        console.error('dashboard-common.js: Error en handleLogout:', error);
        // Fallback si ocurre algún error - usar logout forzado
        if (window.auth && typeof window.auth.forceLogout === 'function') {
            window.auth.forceLogout();
        } else {
            localStorage.clear();
            sessionStorage.clear();
            window.location.href = '/index.html';
        }
    }
}

// Configurar eventos cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    // Verificar autenticación
    checkAuth();

    // Configurar botón de logout
    const logoutBtn = document.getElementById('logout-btn');
    if (!logoutBtn) {
        console.log('dashboard-common.js: Buscando el botón de logout con otro ID...');
        // Intentar encontrar el botón con un ID alternativo
        const alternativeLogoutBtn = document.querySelector('[id*="logout"]');
        if (alternativeLogoutBtn) {
            console.log('dashboard-common.js: Encontrado botón de logout alternativo:', alternativeLogoutBtn.id);
            setupLogoutButton(alternativeLogoutBtn);
        } else {
            console.error('dashboard-common.js: No se encontró ningún botón de logout');
        }
    } else {
        console.log('dashboard-common.js: Encontrado botón de logout estándar');
        setupLogoutButton(logoutBtn);
    }
});

// Función para configurar el botón de logout
function setupLogoutButton(button) {
    console.log('dashboard-common.js: Configurando evento click en botón logout');
    // Eliminar cualquier event listener previo para evitar duplicados
    button.removeEventListener('click', logoutHandler);
    // Agregar el event listener con una función que previene múltiples clicks
    button.addEventListener('click', logoutHandler);
}

// Función manejadora del evento click del botón logout
function logoutHandler(e) {
    console.log('dashboard-common.js: Click en botón logout detectado');
    // Prevenir comportamiento por defecto
    e.preventDefault();
    // Deshabilitar el botón temporalmente
    this.disabled = true;
    
    // Añadir una clase visual y texto para indicar proceso
    this.classList.add('logging-out');
    if (!this.textContent.includes('...')) {
        this.dataset.originalText = this.textContent;
        this.textContent = 'Cerrando sesión...';
    }
    
    // Tiempo máximo para el proceso de logout (5 segundos)
    const logoutTimeout = setTimeout(() => {
        console.warn('dashboard-common.js: Tiempo máximo excedido, usando logout forzado');
        // Forzar salida incluso si el proceso de logout está bloqueado
        localStorage.clear();
        sessionStorage.clear();
        
        // Limpiar cookies
        document.cookie.split(";").forEach(cookie => {
            const [name] = cookie.trim().split("=");
            document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
        });
        
        window.location.replace('/index.html');
    }, 5000);
    
    // Ejecutar el logout con manejo de errores de DB
    try {
        handleLogout().finally(() => {
            clearTimeout(logoutTimeout);
            this.disabled = false;
            this.classList.remove('logging-out');
            if (this.dataset.originalText) {
                this.textContent = this.dataset.originalText;
            }
        });
    } catch (error) {
        console.error('Error crítico durante logout:', error);
        clearTimeout(logoutTimeout);
        auth.forceLogout(); // Usar el método de emergencia
    }
}
