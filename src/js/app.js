document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    // Initialize navigation
    const navbar = new Navbar();
    navbar.render();

    // Check authentication
    const authService = new AuthService();
    if (!authService.isAuthenticated()) {
        window.location.href = '/login.html';
    }
}
