document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const errorMessage = document.getElementById('error-message');
    const attemptsMessage = document.getElementById('attempts-message');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const togglePassword = document.getElementById('togglePassword');

    // Toggle password visibility
    togglePassword.addEventListener('click', () => {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        togglePassword.querySelector('i').classList.toggle('bi-eye');
        togglePassword.querySelector('i').classList.toggle('bi-eye-slash');
    });

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
        const password = passwordInput.value;

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
                const userData = {
                    ...data.user,
                    lastLogin: new Date().toISOString(),
                    sessionStarted: new Date().toLocaleString()
                };
                localStorage.setItem('user_data', JSON.stringify(userData));
                
                // Redirigir según el área del usuario
                if (data.user.idArea === 1) { // Área de Administración
                    window.location.href = "/admin";
                } else if (data.user.idArea === 4) { // Área de Química y Toxicología
                    window.location.href = "/pages/dashboard_toxicologia.html";
                } else {
                    // Para otras áreas, redirigir a sus respectivos dashboards
                    window.location.href = "/pages/dashboard_toxicologia.html";
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

    // Limpiar datos locales al cargar la página
    localStorage.clear();
    sessionStorage.clear();
});