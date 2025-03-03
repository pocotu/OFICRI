// Este archivo es un alias para clientAuth.js para mantener compatibilidad
// con código existente que hace referencia a frontendAuth.js

// Redirigir a las funciones de clientAuth.js
function checkAuth() {
    return window.clientAuth && typeof window.clientAuth.checkAuth === 'function' 
        ? window.clientAuth.checkAuth() 
        : console.error('clientAuth.checkAuth no está disponible');
}

function logout() {
    return window.clientAuth && typeof window.clientAuth.logout === 'function' 
        ? window.clientAuth.logout() 
        : console.error('clientAuth.logout no está disponible');
}

function redirectToLogin() {
    return window.clientAuth && typeof window.clientAuth.redirectToLogin === 'function' 
        ? window.clientAuth.redirectToLogin() 
        : console.error('clientAuth.redirectToLogin no está disponible');
}

function getUserData() {
    return window.clientAuth && typeof window.clientAuth.getUserData === 'function' 
        ? window.clientAuth.getUserData() 
        : console.error('clientAuth.getUserData no está disponible');
}

function saveUserData(userData) {
    return window.clientAuth && typeof window.clientAuth.saveUserData === 'function' 
        ? window.clientAuth.saveUserData(userData) 
        : console.error('clientAuth.saveUserData no está disponible');
}

function clearUserData() {
    return window.clientAuth && typeof window.clientAuth.clearUserData === 'function' 
        ? window.clientAuth.clearUserData() 
        : console.error('clientAuth.clearUserData no está disponible');
}

// Exponer las funciones globalmente
window.frontendAuth = {
    checkAuth,
    logout,
    redirectToLogin,
    getUserData,
    saveUserData,
    clearUserData
}; 