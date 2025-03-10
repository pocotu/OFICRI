/**
 * Módulo de gestión de sesiones
 * Proporciona funciones específicas para manejo de sesiones (login, logout, verificación)
 */

/**
 * Cierra la sesión del usuario actual
 * Elimina el token y la información del usuario del localStorage y redirige al login
 */
export const cerrarSesion = () => {
    // Eliminar datos de sesión del localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Redirigir al usuario a la página de login
    window.location.href = '/';
};

/**
 * Verifica si hay una sesión activa
 * @returns {boolean} - true si el usuario está autenticado, false en caso contrario
 */
export const haySesionActiva = () => {
    return !!localStorage.getItem('token');
};

/**
 * Obtiene el usuario actual de la sesión
 * @returns {Object|null} - Objeto con datos del usuario si está autenticado, null en caso contrario
 */
export const obtenerUsuarioActual = () => {
    try {
        const userStr = localStorage.getItem('user');
        if (!userStr) return null;
        
        const user = JSON.parse(userStr);
        console.log('Obteniendo usuario de sesión:', user);
        
        // Verifica si tiene la estructura esperada
        if (!user.IDUsuario && (user.id || user.ID)) {
            // Normalizar la estructura si usa nombres de propiedades diferentes
            return {
                ...user,
                IDUsuario: user.IDUsuario || user.id || user.ID,
                IDRol: user.IDRol || user.idRol || user.rolId,
                IDArea: user.IDArea || user.idArea || user.areaId,
                Nombres: user.Nombres || user.nombres || user.name || user.firstName,
                Apellidos: user.Apellidos || user.apellidos || user.lastName,
                CodigoCIP: user.CodigoCIP || user.codigoCIP || user.cip
            };
        }
        
        return user;
    } catch (error) {
        console.error('Error al obtener usuario de sesión:', error);
        return null;
    }
};

/**
 * Obtiene el token de autenticación actual
 * @returns {string|null} - Token de autenticación si existe, null en caso contrario
 */
export const obtenerToken = () => {
    return localStorage.getItem('token');
};

/**
 * Actualiza los datos del usuario en la sesión
 * @param {Object} userData - Datos actualizados del usuario
 */
export const actualizarUsuarioSesion = (userData) => {
    if (!userData) return;
    
    try {
        // Obtener usuario actual
        const currentUser = obtenerUsuarioActual();
        
        // Fusionar datos actuales con los nuevos
        const updatedUser = { ...currentUser, ...userData };
        
        // Guardar usuario actualizado
        localStorage.setItem('user', JSON.stringify(updatedUser));
    } catch (error) {
        console.error('Error al actualizar usuario en sesión:', error);
    }
};

// Exportación por defecto para permitir importación directa
export default {
    cerrarSesion,
    haySesionActiva,
    obtenerUsuarioActual,
    obtenerToken,
    actualizarUsuarioSesion
}; 