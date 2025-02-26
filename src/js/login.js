const usuarios = [
    { username: "Juan", password: "1234"},
    { username: "Maria", password: "abcd"},
    { username: "Pedro", password: "qwerty"}
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
                
                // Redirigir según el nivel de acceso
                if (data.user.idRol === 1) { // Rol de administrador
                    window.location.href = "/admin";
                } else {
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
});