// Manejo de autenticación
const auth = {
    login: async (username, password) => {
        try {
            // Obtener el contador de intentos del almacenamiento local
            let attempts = parseInt(localStorage.getItem(`login_attempts_${username}`)) || 0;
            
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password }),
                credentials: 'include'
            });

            const data = await response.json();

            if (response.ok) {
                // Resetear intentos fallidos al lograr un login exitoso
                localStorage.removeItem(`login_attempts_${username}`);
                localStorage.removeItem(`login_blocked_until_${username}`);
                
                // Guardar datos del usuario
                localStorage.setItem('user_data', JSON.stringify(data.user));
                
                // Redirigir según el nivel de acceso
                if (data.user.nivelAcceso === 1) {
                    window.location.href = '/admin';
                } else {
                    window.location.href = '/dashboard';
                }
            } else {
                // Incrementar intentos fallidos
                attempts++;
                localStorage.setItem(`login_attempts_${username}`, attempts);

                // Verificar si debemos bloquear temporalmente
                if (attempts >= 5) {
                    const blockUntil = new Date(Date.now() + 5 * 60 * 1000); // 5 minutos
                    localStorage.setItem(`login_blocked_until_${username}`, blockUntil.getTime());
                    throw new Error(`Demasiados intentos fallidos. Por favor espere 5 minutos antes de intentar nuevamente. Intentos realizados: ${attempts}`);
                }

                throw new Error(`${data.message}. Intentos fallidos: ${attempts} de 3 permitidos`);
            }
        } catch (error) {
            console.error('Error durante el login:', error);
            
            // Verificar si el usuario está bloqueado temporalmente
            const username = document.getElementById('username').value;
            const blockedUntil = localStorage.getItem(`login_blocked_until_${username}`);
            
            if (blockedUntil) {
                const now = Date.now();
                if (now < parseInt(blockedUntil)) {
                    const minutesLeft = Math.ceil((parseInt(blockedUntil) - now) / (60 * 1000));
                    throw new Error(`Usuario bloqueado temporalmente. Por favor espere ${minutesLeft} minutos antes de intentar nuevamente.`);
                } else {
                    // Si ya pasó el tiempo de bloqueo, limpiar el bloqueo
                    localStorage.removeItem(`login_blocked_until_${username}`);
                    localStorage.removeItem(`login_attempts_${username}`);
                }
            }
            
            throw error;
        }
    },

    logout: async () => {
        try {
            const response = await fetch('/api/auth/logout', {
                method: 'POST',
                credentials: 'include'
            });
            
            if (response.ok) {
                // Limpiar cualquier dato de sesión local
                localStorage.removeItem('user_data');
                sessionStorage.clear();
                
                // Redirigir al login
                window.location.href = '/index.html';
            } else {
                throw new Error('Error al cerrar sesión');
            }
        } catch (error) {
            console.error('Error durante el cierre de sesión:', error);
            alert('Error al cerrar sesión. Por favor intente nuevamente.');
        }
    },

    checkAuth: async () => {
        try {
            const response = await fetch('/api/auth/check', {
                method: 'GET',
                credentials: 'include'
            });
            
            if (!response.ok) {
                window.location.href = '/index.html';
            }
        } catch (error) {
            console.error('Error al verificar autenticación:', error);
            window.location.href = '/index.html';
        }
    }
};

// Exportar el objeto auth
window.auth = auth;
