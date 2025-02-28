const usuarios = [
    { username: "Juan", password: "1234"},
    { username: "Maria", password: "abcd"},
    { username: "Pedro", password: "qwerty"}
];

const userPrivileges = [
    { name: 'Crear', value: 'crear' },
    { name: 'Editar', value: 'editar' },
    { name: 'Eliminar', value: 'eliminar' },
    { name: 'Ver', value: 'ver' }
];

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const errorMessage = document.getElementById('error-message');
    const attemptsMessage = document.getElementById('attempts-message');
    const usernameInput = document.getElementById('username');

    // Mostrar mensaje de error
    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.style.display = 'block';
    }

    // Mostrar mensaje de intentos
    function showAttempts(attempts, remaining) {
        if (attempts > 0) {
            attemptsMessage.textContent = `Intentos fallidos: ${attempts} de 5 permitidos. ${remaining ? `Intentos restantes: ${remaining}` : ''}`;
            attemptsMessage.style.display = 'block';
        } else {
            attemptsMessage.style.display = 'none';
        }
    }

    // Limpiar mensajes
    function clearMessages() {
        errorMessage.style.display = 'none';
        attemptsMessage.style.display = 'none';
    }

    // Manejar cambio de usuario
    usernameInput.addEventListener('input', () => {
        clearMessages();
    });

    // Manejar envío del formulario
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const username = usernameInput.value;
        const password = document.getElementById('password').value;

        try {
            clearMessages();
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
                // Login exitoso
                localStorage.setItem('user_data', JSON.stringify(data.user));
                
                // Redirigir según el área del usuario
                if (data.user.idArea === 1) { // Área de Administración
                    window.location.href = "/admin";
                } else if (data.user.idArea === 4) { // Área de Química y Toxicología
                    window.location.href = "/src/pages/dashboard_toxicologia.html";
                } else {
                    // Para otras áreas, redirigir a sus respectivos dashboards
                    window.location.href = "/src/pages/dashboard_toxicologia.html";
                }
            } else {
                // Mostrar error y actualizar intentos
                showError(data.message);
                if (data.intentosFallidos) {
                    showAttempts(data.intentosFallidos, data.intentosRestantes);
                }
            }
        } catch (error) {
            console.error('Error durante el login:', error);
            showError('Error al intentar iniciar sesión. Por favor, intente nuevamente.');
        }
    });

    // Verificar si hay una sesión "fantasma" al cargar la página de login
    // (esto puede ocurrir si el proceso de logout falló en el servidor)
    const checkForGhostSession = async () => {
        try {
            // Limpiar cualquier dato local primero para prevenir bucles
            localStorage.clear();
            sessionStorage.clear();
            const debugMsg = document.getElementById('debug-message');
            // Verificar estado del servidor en background
            fetch('/api/health', { 
                method: 'GET',
                signal: AbortSignal.timeout(3000)
            })
            .then(response => {
                if (response.ok) {
                    debugMsg.textContent = '✓ Servidor API conectado correctamente';
                    // Si el servidor está activo, intentar un logout "de seguridad"
                    fetch('/api/auth/logout', { 
                        method: 'POST', 
                        credentials: 'include'
                    }).catch(() => {}); // Ignoramos errores aquí
                } else {
                    debugMsg.textContent = '✗ El servidor API respondió con estado: ' + response.status;
                }
            })
            .catch(err => {
                debugMsg.textContent = '✗ No se puede conectar al servidor API. Error: ' + err.message;
            });
        } catch (error) {
            console.error('Error al verificar sesión:', error);
        }
    };
    // Ejecutar verificación
    checkForGhostSession();
    // Toggle para mostrar/ocultar información de debug
    document.getElementById('debug-toggle').addEventListener('click', function() {
        const debugMsg = document.getElementById('debug-message');
        debugMsg.style.display = debugMsg.style.display === 'block' ? 'none' : 'block';
    });

    // La lógica para manejar los privilegios solo debe ejecutarse en páginas que tengan el elemento
    const privilegesSelect = document.getElementById('privileges');
    if (privilegesSelect) {
        userPrivileges.forEach(privilege => {
            const option = document.createElement('option');
            option.value = privilege.value;
            option.textContent = privilege.name;
            privilegesSelect.appendChild(option);
        });
    }
});