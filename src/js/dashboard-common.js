// Verificar autenticación al cargar la página
async function checkAuth() {
    console.log('=== Iniciando verificación de autenticación ===');
    try {
        console.log('Haciendo petición a /api/auth/check...');
        const response = await fetch('/api/auth/check');
        console.log('Respuesta recibida:', {
            status: response.status,
            ok: response.ok
        });

        if (!response.ok) {
            console.log('Respuesta no válida, redirigiendo a login...');
            window.location.href = '/index.html';
            return;
        }

        const data = await response.json();
        console.log('Datos recibidos de /api/auth/check:', data);

        if (!data.authenticated) {
            console.log('Usuario no autenticado, redirigiendo a login...');
            window.location.href = '/index.html';
        }

        console.log('Datos del usuario obtenidos:', data.user);
        return data.user;
    } catch (error) {
        console.error('Error en checkAuth:', error);
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

// Actualizar la información del usuario en la interfaz
function updateUserInfo(userData) {
    console.log('=== Actualizando información del usuario en la interfaz ===');
    console.log('Datos del usuario a mostrar:', userData);
    
    // Mostrar nombre de usuario
    const usernameElement = document.getElementById('username');
    if (usernameElement) {
        console.log('Actualizando nombre de usuario:', userData.username);
        usernameElement.textContent = userData.username || 'Usuario';
    } else {
        console.warn('Elemento username no encontrado en el DOM');
    }

    // Mostrar rol del usuario
    const userRoleElement = document.getElementById('user-role');
    if (userRoleElement) {
        // Determinar el rol basado en el nivelAcceso
        let rolName = 'Rol no especificado';
        switch(userData.nivelAcceso) {
            case 1:
                rolName = 'Administrador';
                break;
            case 2:
                rolName = 'Operador Mesa de Partes';
                break;
            case 3:
                rolName = 'Técnico Especialista';
                break;
            case 4:
                rolName = 'Jefe de Área';
                break;
            case 5:
                rolName = 'Visualizador';
                break;
        }
        console.log('Actualizando rol:', rolName);
        userRoleElement.textContent = rolName;
    } else {
        console.warn('Elemento user-role no encontrado en el DOM');
    }

    // Mostrar área del usuario
    const userAreaElement = document.getElementById('user-area');
    if (userAreaElement) {
        // Obtener el nombre del área basado en el idArea
        let areaName = 'Área no especificada';
        switch(userData.idArea) {
            case 1:
                areaName = 'Administración';
                break;
            case 2:
                areaName = 'Mesa de Partes';
                break;
            case 3:
                areaName = 'Forense Digital';
                break;
            case 4:
                areaName = 'Dosaje Etílico';
                break;
            case 5:
                areaName = 'Química y Toxicología Forense';
                break;
        }
        console.log('Actualizando área:', areaName);
        userAreaElement.textContent = areaName;
    } else {
        console.warn('Elemento user-area no encontrado en el DOM');
    }

    // Mostrar último acceso
    const lastLoginElement = document.getElementById('last-login');
    if (lastLoginElement) {
        const now = new Date().toLocaleString();
        console.log('Actualizando último acceso:', now);
        lastLoginElement.textContent = `Último acceso: ${now}`;
    } else {
        console.warn('Elemento last-login no encontrado en el DOM');
    }

    console.log('=== Actualización de interfaz completada ===');
}

// Configurar eventos cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', async () => {
    console.log('=== DOM Cargado - Iniciando configuración ===');
    try {
        // Verificar autenticación y obtener datos del usuario
        console.log('Obteniendo datos del usuario del servidor...');
        const userData = await checkAuth();
        
        if (userData) {
            console.log('Datos del usuario obtenidos correctamente del servidor');
            // Actualizar localStorage con los datos más recientes
            localStorage.setItem('user_data', JSON.stringify(userData));
            console.log('Datos guardados en localStorage');
            // Actualizar la interfaz
            updateUserInfo(userData);
        } else {
            console.log('No se obtuvieron datos del servidor, intentando localStorage...');
            // Si no hay datos del usuario, intentar obtenerlos del localStorage
            const storedUserData = JSON.parse(localStorage.getItem('user_data') || '{}');
            console.log('Datos encontrados en localStorage:', storedUserData);
            
            if (Object.keys(storedUserData).length > 0) {
                console.log('Usando datos del localStorage para actualizar la interfaz');
                updateUserInfo(storedUserData);
            } else {
                console.warn('No se encontraron datos del usuario ni en el servidor ni en localStorage');
            }
        }

        // Configurar botón de logout
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            console.log('Botón de logout encontrado, configurando evento');
            logoutBtn.addEventListener('click', handleLogout);
        } else {
            console.warn('Botón de logout no encontrado, buscando alternativas...');
        }
    } catch (error) {
        console.error('Error al inicializar el dashboard:', error);
    }
    console.log('=== Configuración inicial completada ===');
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
