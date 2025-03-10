class AuthService {
    constructor() {
        this.baseUrl = '/api/auth';
        this._isRedirecting = false;
    }

    async login(codigoCIP, password) {
        try {
            const response = await fetch(`${this.baseUrl}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ codigoCIP, password })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Error en la autenticación');
            }

            // Guardar el token en localStorage
            if (data.token) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
            }

            return {
                success: true,
                user: data.user,
                token: data.token
            };
        } catch (error) {
            console.error('Error en login:', error);
            return {
                success: false,
                message: error.message
            };
        }
    }

    logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        if (!this._isRedirecting) {
            this._isRedirecting = true;
            window.location.href = '/';
        }
    }

    isAuthenticated() {
        try {
            const token = localStorage.getItem('token');
            const user = localStorage.getItem('user');
            if (!token || !user) return false;
            
            // Verificar que el usuario tenga la estructura correcta
            const userData = JSON.parse(user);
            return !!(userData && (userData.idRol || userData.IDRol));
        } catch (error) {
            console.error('Error al verificar autenticación:', error);
            return false;
        }
    }

    getCurrentUser() {
        try {
            const user = localStorage.getItem('user');
            return user ? JSON.parse(user) : null;
        } catch (error) {
            console.error('Error al obtener usuario:', error);
            this.logout();
            return null;
        }
    }

    getToken() {
        return localStorage.getItem('token');
    }

    redirectToLogin() {
        if (!this._isRedirecting) {
            this._isRedirecting = true;
            window.location.href = '/';
        }
    }

    redirectToAdmin() {
        if (!this._isRedirecting) {
            this._isRedirecting = true;
            window.location.href = '/admin.html';
        }
    }

    redirectToDashboard() {
        if (!this._isRedirecting) {
            this._isRedirecting = true;
            window.location.href = '/dashboard.html';
        }
    }
}

// Exportar una única instancia del servicio
const authService = new AuthService();
export default authService; 