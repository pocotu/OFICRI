/**
 * Constantes de Permisos - OFICRI
 * Sistema de permisos basado en bits (0..7)
 */

export const PERMISSION = {
    CREATE: 1,      // bit 0 (1) - Crear
    EDIT: 2,        // bit 1 (2) - Editar
    DELETE: 4,      // bit 2 (4) - Eliminar
    VIEW: 8,        // bit 3 (8) - Ver
    DERIVE: 16,     // bit 4 (16) - Derivar
    AUDIT: 32,      // bit 5 (32) - Auditar
    EXPORT: 64,     // bit 6 (64) - Exportar
    BLOCK: 128      // bit 7 (128) - Bloquear
};

export const ROLE_PERMISSIONS = {
    ADMIN: PERMISSION.CREATE | PERMISSION.EDIT | PERMISSION.DELETE | 
           PERMISSION.VIEW | PERMISSION.DERIVE | PERMISSION.AUDIT | 
           PERMISSION.EXPORT | PERMISSION.BLOCK,
    
    MESA_PARTES: PERMISSION.CREATE | PERMISSION.EDIT | 
                 PERMISSION.VIEW | PERMISSION.DERIVE | 
                 PERMISSION.EXPORT,
    
    AREA: PERMISSION.CREATE | PERMISSION.EDIT | 
          PERMISSION.VIEW | PERMISSION.DERIVE | 
          PERMISSION.EXPORT
};

/**
 * Verifica si un usuario tiene un permiso específico
 * @param {number} userPermissions - Permisos del usuario
 * @param {number} requiredPermission - Permiso requerido
 * @returns {boolean} - Si el usuario tiene el permiso
 */
export function hasPermission(userPermissions, requiredPermission) {
    return (userPermissions & requiredPermission) !== 0;
}

/**
 * Verifica si un usuario tiene un rol específico
 * @param {number} userPermissions - Permisos del usuario
 * @param {string} roleName - Nombre del rol
 * @returns {boolean} - Si el usuario tiene el rol
 */
export function hasRole(userPermissions, roleName) {
    const rolePermissions = ROLE_PERMISSIONS[roleName.toUpperCase()];
    if (!rolePermissions) return false;
    return (userPermissions & rolePermissions) === rolePermissions;
}

/**
 * Obtiene el nombre del rol más alto del usuario
 * @param {number} userPermissions - Permisos del usuario
 * @returns {string} - Nombre del rol más alto
 */
export function getHighestRole(userPermissions) {
    if (hasRole(userPermissions, 'ADMIN')) return 'ADMIN';
    if (hasRole(userPermissions, 'MESA_PARTES')) return 'MESA_PARTES';
    if (hasRole(userPermissions, 'AREA')) return 'AREA';
    return 'USER';
}

/**
 * Convierte los permisos numéricos a una lista de nombres
 * @param {number} permissions - Permisos numéricos
 * @returns {string[]} - Lista de nombres de permisos
 */
export function getPermissionNames(permissions) {
    const names = [];
    for (const [name, value] of Object.entries(PERMISSION)) {
        if ((permissions & value) !== 0) {
            names.push(name);
        }
    }
    return names;
} 