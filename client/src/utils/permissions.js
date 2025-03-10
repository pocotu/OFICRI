/**
 * Módulo de permisos
 * Proporciona funciones para verificar permisos basados en bits
 */

// Constantes de permisos (bits)
export const PERMISSION = {
    CREATE: 1,      // bit 0 (1)
    EDIT: 2,        // bit 1 (2)
    DELETE: 4,      // bit 2 (4)
    VIEW: 8,        // bit 3 (8)
    DERIVE: 16,     // bit 4 (16)
    AUDIT: 32,      // bit 5 (32)
    EXPORT: 64,     // bit 6 (64)
    BLOCK: 128      // bit 7 (128)
};

// Constantes de roles
export const ROLE = {
    ADMIN: 1,
    MESA_PARTES: 2,
    AREA_RESPONSABLE: 3
};

// Permisos por rol
export const ROLE_PERMISSIONS = {
    [ROLE.ADMIN]: 255,                                      // Todos los permisos (bits 0-7)
    [ROLE.MESA_PARTES]: PERMISSION.CREATE | 
                        PERMISSION.EDIT | 
                        PERMISSION.VIEW | 
                        PERMISSION.DERIVE | 
                        PERMISSION.EXPORT,                  // bits 0,1,3,4,6
    [ROLE.AREA_RESPONSABLE]: PERMISSION.CREATE | 
                            PERMISSION.EDIT | 
                            PERMISSION.VIEW | 
                            PERMISSION.DERIVE | 
                            PERMISSION.EXPORT               // bits 0,1,3,4,6
};

/**
 * Verifica si un usuario tiene un permiso específico
 * @param {number} userPermissions - Permisos del usuario (valor numérico)
 * @param {number} permission - Permiso a verificar (valor de bit)
 * @returns {boolean} - true si tiene el permiso, false en caso contrario
 */
export const hasPermission = (userPermissions, permission) => {
    return (userPermissions & permission) !== 0;
};

/**
 * Verifica si un usuario tiene permiso para crear
 * @param {number} userPermissions - Permisos del usuario
 * @returns {boolean} - true si tiene permiso para crear
 */
export const canCreate = (userPermissions) => {
    return hasPermission(userPermissions, PERMISSION.CREATE);
};

/**
 * Verifica si un usuario tiene permiso para editar
 * @param {number} userPermissions - Permisos del usuario
 * @returns {boolean} - true si tiene permiso para editar
 */
export const canEdit = (userPermissions) => {
    return hasPermission(userPermissions, PERMISSION.EDIT);
};

/**
 * Verifica si un usuario tiene permiso para eliminar
 * @param {number} userPermissions - Permisos del usuario
 * @returns {boolean} - true si tiene permiso para eliminar
 */
export const canDelete = (userPermissions) => {
    return hasPermission(userPermissions, PERMISSION.DELETE);
};

/**
 * Verifica si un usuario tiene permiso para ver
 * @param {number} userPermissions - Permisos del usuario
 * @returns {boolean} - true si tiene permiso para ver
 */
export const canView = (userPermissions) => {
    return hasPermission(userPermissions, PERMISSION.VIEW);
};

/**
 * Verifica si un usuario tiene permiso para derivar
 * @param {number} userPermissions - Permisos del usuario
 * @returns {boolean} - true si tiene permiso para derivar
 */
export const canDerive = (userPermissions) => {
    return hasPermission(userPermissions, PERMISSION.DERIVE);
};

/**
 * Verifica si un usuario tiene permiso para auditar
 * @param {number} userPermissions - Permisos del usuario
 * @returns {boolean} - true si tiene permiso para auditar
 */
export const canAudit = (userPermissions) => {
    return hasPermission(userPermissions, PERMISSION.AUDIT);
};

/**
 * Verifica si un usuario tiene permiso para exportar
 * @param {number} userPermissions - Permisos del usuario
 * @returns {boolean} - true si tiene permiso para exportar
 */
export const canExport = (userPermissions) => {
    return hasPermission(userPermissions, PERMISSION.EXPORT);
};

/**
 * Verifica si un usuario tiene permiso para bloquear
 * @param {number} userPermissions - Permisos del usuario
 * @returns {boolean} - true si tiene permiso para bloquear
 */
export const canBlock = (userPermissions) => {
    return hasPermission(userPermissions, PERMISSION.BLOCK);
};

/**
 * Obtiene los permisos de un rol
 * @param {number} roleId - ID del rol
 * @returns {number} - Permisos del rol
 */
export const getRolePermissions = (roleId) => {
    return ROLE_PERMISSIONS[roleId] || 0;
};

/**
 * Verifica si un usuario es administrador
 * @param {Object} user - Objeto de usuario
 * @returns {boolean} - true si es administrador
 */
export const isAdmin = (user) => {
    return user && user.IDRol === ROLE.ADMIN;
};

/**
 * Verifica si un usuario es de mesa de partes
 * @param {Object} user - Objeto de usuario
 * @returns {boolean} - true si es de mesa de partes
 */
export const isMesaPartes = (user) => {
    return user && user.IDRol === ROLE.MESA_PARTES;
};

/**
 * Verifica si un usuario es responsable de área
 * @param {Object} user - Objeto de usuario
 * @returns {boolean} - true si es responsable de área
 */
export const isAreaResponsable = (user) => {
    return user && user.IDRol === ROLE.AREA_RESPONSABLE;
};

/**
 * Obtiene la página de redirección según el rol del usuario
 * @param {Object} user - Objeto de usuario
 * @returns {string} - Ruta de redirección
 */
export const getRedirectPath = (user) => {
    if (!user) return '/';
    
    if (isAdmin(user)) return '/admin.html';
    if (isMesaPartes(user)) return '/mesaPartes.html';
    if (isAreaResponsable(user)) return '/area.html';
    
    return '/';
};

/**
 * Verifica si un elemento debe mostrarse según los permisos del usuario
 * @param {number} userPermissions - Permisos del usuario
 * @param {number} requiredPermission - Permiso requerido para mostrar el elemento
 * @returns {string} - 'd-none' si no tiene permiso, '' si tiene permiso
 */
export const showIfHasPermission = (userPermissions, requiredPermission) => {
    return hasPermission(userPermissions, requiredPermission) ? '' : 'd-none';
};

/**
 * Deshabilita un elemento si el usuario no tiene el permiso requerido
 * @param {number} userPermissions - Permisos del usuario
 * @param {number} requiredPermission - Permiso requerido
 * @returns {boolean} - true si debe estar deshabilitado, false en caso contrario
 */
export const disableIfNoPermission = (userPermissions, requiredPermission) => {
    return !hasPermission(userPermissions, requiredPermission);
};

/**
 * Genera las clases CSS para mostrar u ocultar elementos según permisos
 * @param {number} userPermissions - Permisos del usuario
 * @param {number} requiredPermission - Permiso requerido para mostrar el elemento
 * @param {string} additionalClasses - Clases CSS adicionales
 * @returns {string} - Clases CSS a aplicar
 */
export const permissionBasedClasses = (userPermissions, requiredPermission, additionalClasses = '') => {
    const visibilityClass = showIfHasPermission(userPermissions, requiredPermission);
    return `${additionalClasses} ${visibilityClass}`.trim();
};

/**
 * Obtiene el nombre del rol a partir de su ID
 * @param {number} roleId - ID del rol
 * @returns {string} - Nombre del rol
 */
export const getRoleName = (roleId) => {
    switch (roleId) {
        case ROLE.ADMIN: return 'Administrador';
        case ROLE.MESA_PARTES: return 'Mesa de Partes';
        case ROLE.AREA_RESPONSABLE: return 'Responsable de Área';
        default: return 'Desconocido';
    }
};

/**
 * Calcula y formatea los permisos de un rol para mostrar
 * @param {number} permissionBits - Bits de permisos
 * @returns {string[]} - Array con nombres de permisos
 */
export const formatPermissionsForDisplay = (permissionBits) => {
    const permissions = [];
    
    if (hasPermission(permissionBits, PERMISSION.CREATE)) permissions.push('Crear');
    if (hasPermission(permissionBits, PERMISSION.EDIT)) permissions.push('Editar');
    if (hasPermission(permissionBits, PERMISSION.DELETE)) permissions.push('Eliminar');
    if (hasPermission(permissionBits, PERMISSION.VIEW)) permissions.push('Ver');
    if (hasPermission(permissionBits, PERMISSION.DERIVE)) permissions.push('Derivar');
    if (hasPermission(permissionBits, PERMISSION.AUDIT)) permissions.push('Auditar');
    if (hasPermission(permissionBits, PERMISSION.EXPORT)) permissions.push('Exportar');
    if (hasPermission(permissionBits, PERMISSION.BLOCK)) permissions.push('Bloquear');
    
    return permissions;
}; 