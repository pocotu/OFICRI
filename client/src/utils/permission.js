/**
 * Utilidades de Permisos
 * 
 * Este archivo contiene funciones para trabajar con el sistema de permisos
 * basado en bits, facilitando la verificación de accesos.
 */

// Constantes de permisos (bits 0..7)
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

// Definición de roles con sus permisos asociados
export const ROLES = {
    // Administrador (todos los permisos)
    ADMIN: {
        name: 'Administrador',
        permissions: 255 // Todos los permisos (11111111 en binario) - bits 0..7
    },
    
    // Mesa de Partes (Crear, Editar, Ver, Derivar, Exportar)
    MESA_PARTES: {
        name: 'Mesa de Partes',
        permissions: PERMISSION.CREATE | 
                    PERMISSION.EDIT | 
                    PERMISSION.VIEW | 
                    PERMISSION.DERIVE | 
                    PERMISSION.EXPORT  // bits 0,1,3,4,6 = 91
    },
    
    // Responsable de Área (Crear, Editar, Ver, Derivar, Exportar)
    AREA_RESPONSABLE: {
        name: 'Responsable de Área',
        permissions: PERMISSION.CREATE | 
                    PERMISSION.EDIT | 
                    PERMISSION.VIEW | 
                    PERMISSION.DERIVE | 
                    PERMISSION.EXPORT  // bits 0,1,3,4,6 = 91
    }
};

// Mapeo de permisos a elementos de UI
export const UI_PERMISSIONS = {
    // Elementos de menú principales
    mainMenu: {
        'dashboard': { permission: PERMISSION.VIEW, label: 'Dashboard' },
        'users': { permission: PERMISSION.VIEW, label: 'Gestión de Usuarios' },
        'roles': { permission: PERMISSION.VIEW, label: 'Gestión de Roles' },
        'areas': { permission: PERMISSION.VIEW, label: 'Gestión de Áreas' },
        'documents': { permission: PERMISSION.VIEW, label: 'Gestión de Documentos' },
        'audit': { permission: PERMISSION.AUDIT, label: 'Registros del Sistema / Auditoría' },
        'export': { permission: PERMISSION.EXPORT, label: 'Exportar' }
    },
    
    // Submenús para cada sección principal
    subMenus: {
        // Submenú de Usuarios
        'users': [
            { id: 'viewUsers', permission: PERMISSION.VIEW, label: 'Ver Usuarios', url: '/users' },
            { id: 'createUser', permission: PERMISSION.CREATE, label: 'Crear Usuario', url: '/users/new' },
            { id: 'editUser', permission: PERMISSION.EDIT, label: 'Editar Usuario', url: '#', showInMenu: false },
            { id: 'deleteUser', permission: PERMISSION.DELETE, label: 'Eliminar Usuario', url: '#', showInMenu: false },
            { id: 'blockUser', permission: PERMISSION.BLOCK, label: 'Bloquear/Desbloquear Usuario', url: '#', showInMenu: false }
        ],
        
        // Submenú de Roles
        'roles': [
            { id: 'viewRoles', permission: PERMISSION.VIEW, label: 'Ver Roles', url: '/roles' },
            { id: 'createRole', permission: PERMISSION.CREATE, label: 'Crear Rol', url: '/roles/new' },
            { id: 'editRole', permission: PERMISSION.EDIT, label: 'Editar Rol', url: '#', showInMenu: false },
            { id: 'deleteRole', permission: PERMISSION.DELETE, label: 'Eliminar Rol', url: '#', showInMenu: false }
        ],
        
        // Submenú de Áreas
        'areas': [
            { id: 'viewAreas', permission: PERMISSION.VIEW, label: 'Ver Áreas', url: '/areas' },
            { id: 'createArea', permission: PERMISSION.CREATE, label: 'Crear Área', url: '/areas/new' },
            { id: 'editArea', permission: PERMISSION.EDIT, label: 'Editar Área', url: '#', showInMenu: false },
            { id: 'deleteArea', permission: PERMISSION.DELETE, label: 'Eliminar Área', url: '#', showInMenu: false },
            { id: 'areaHistory', permission: PERMISSION.VIEW, label: 'Historial de Documentos del Área', url: '/areas/history' }
        ],
        
        // Submenú de Documentos
        'documents': [
            { id: 'viewDocuments', permission: PERMISSION.VIEW, label: 'Ver Documentos', url: '/documents' },
            { id: 'createDocument', permission: PERMISSION.CREATE, label: 'Crear Documento', url: '/documents/new' },
            { id: 'editDocument', permission: PERMISSION.EDIT, label: 'Editar Documento', url: '#', showInMenu: false },
            { id: 'deleteDocument', permission: PERMISSION.DELETE, label: 'Eliminar Documento', url: '#', showInMenu: false },
            { id: 'deriveDocument', permission: PERMISSION.DERIVE, label: 'Derivar Documento', url: '#', showInMenu: false },
            { id: 'pendingDocuments', permission: PERMISSION.VIEW, label: 'Documentos en Proceso', url: '/documents/pending' },
            { id: 'completedDocuments', permission: PERMISSION.VIEW, label: 'Documentos Completados', url: '/documents/completed' }
        ],
        
        // Submenú de Auditoría
        'audit': [
            { id: 'userLogs', permission: PERMISSION.AUDIT, label: 'Logs de Usuario', url: '/audit/users' },
            { id: 'documentLogs', permission: PERMISSION.AUDIT, label: 'Logs de Documentos', url: '/audit/documents' },
            { id: 'areaLogs', permission: PERMISSION.AUDIT, label: 'Logs de Áreas', url: '/audit/areas' },
            { id: 'roleLogs', permission: PERMISSION.AUDIT, label: 'Logs de Roles', url: '/audit/roles' },
            { id: 'permissionLogs', permission: PERMISSION.AUDIT, label: 'Logs de Permisos', url: '/audit/permissions' },
            { id: 'mesaPartesLogs', permission: PERMISSION.AUDIT, label: 'Logs de Mesa de Partes', url: '/audit/mesapartes' }
        ],
        
        // Submenú de Exportar
        'export': [
            { id: 'exportLogs', permission: PERMISSION.EXPORT, label: 'Exportar Logs', url: '/export/logs' },
            { id: 'exportDocuments', permission: PERMISSION.EXPORT, label: 'Exportar Documentos', url: '/export/documents' },
            { id: 'exportBackup', permission: PERMISSION.EXPORT, label: 'Backup de BD', url: '/export/backup' }
        ]
    },
    
    // Acciones por contexto (botones, enlaces, etc.)
    actions: {
        'users': {
            'view': PERMISSION.VIEW,
            'create': PERMISSION.CREATE,
            'edit': PERMISSION.EDIT,
            'delete': PERMISSION.DELETE,
            'block': PERMISSION.BLOCK
        },
        'roles': {
            'view': PERMISSION.VIEW,
            'create': PERMISSION.CREATE,
            'edit': PERMISSION.EDIT,
            'delete': PERMISSION.DELETE
        },
        'areas': {
            'view': PERMISSION.VIEW,
            'create': PERMISSION.CREATE,
            'edit': PERMISSION.EDIT,
            'delete': PERMISSION.DELETE,
            'history': PERMISSION.VIEW
        },
        'documents': {
            'view': PERMISSION.VIEW,
            'create': PERMISSION.CREATE,
            'edit': PERMISSION.EDIT,
            'delete': PERMISSION.DELETE,
            'derive': PERMISSION.DERIVE,
            'trace': PERMISSION.VIEW,
            'export': PERMISSION.EXPORT
        },
        'audit': {
            'view': PERMISSION.AUDIT,
            'export': PERMISSION.EXPORT
        }
    }
};

/**
 * Verifica si un conjunto de permisos incluye un permiso específico
 * @param {number} userPermissions - Permisos del usuario (valor numérico)
 * @param {number} permission - Permiso a verificar
 * @returns {boolean} - True si tiene el permiso
 */
export function hasPermission(userPermissions, permission) {
    if (typeof userPermissions !== 'number' || typeof permission !== 'number') {
        console.error('Los permisos deben ser valores numéricos');
        return false;
    }
    
    return (userPermissions & permission) !== 0;
}

/**
 * Verifica si un usuario tiene un rol específico
 * @param {number} userPermissions - Permisos del usuario
 * @param {string} roleName - Nombre del rol a verificar
 * @returns {boolean} - True si tiene el rol
 */
export function hasRole(userPermissions, roleName) {
    if (!ROLES[roleName]) {
        console.error(`Rol no encontrado: ${roleName}`);
        return false;
    }
    
    // Un usuario tiene un rol si tiene todos los permisos de ese rol
    const rolePermissions = ROLES[roleName].permissions;
    return (userPermissions & rolePermissions) === rolePermissions;
}

/**
 * Obtiene la clase CSS para mostrar/ocultar elementos según permisos
 * @param {number} userPermissions - Permisos del usuario
 * @param {number} requiredPermission - Permiso requerido
 * @returns {string} - Clase CSS (vacía si tiene permiso, 'd-none' si no)
 */
export function showIfHasPermission(userPermissions, requiredPermission) {
    return hasPermission(userPermissions, requiredPermission) ? '' : 'd-none';
}

/**
 * Verifica si un usuario tiene acceso a una funcionalidad específica
 * @param {number} userPermissions - Permisos del usuario
 * @param {string} module - Módulo ('users', 'documents', etc.)
 * @param {string} action - Acción ('view', 'create', etc.)
 * @returns {boolean} - True si tiene acceso
 */
export function canPerformAction(userPermissions, module, action) {
    if (!UI_PERMISSIONS.actions[module] || !UI_PERMISSIONS.actions[module][action]) {
        console.error(`Acción no encontrada: ${module}.${action}`);
        return false;
    }
    
    const requiredPermission = UI_PERMISSIONS.actions[module][action];
    return hasPermission(userPermissions, requiredPermission);
}

/**
 * Obtiene los elementos de menú filtrados según permisos del usuario
 * @param {number} userPermissions - Permisos del usuario
 * @returns {Array} - Elementos de menú filtrados
 */
export function getFilteredMenu(userPermissions) {
    const filteredMenu = [];
    
    // Filtrar menú principal
    for (const [id, menuItem] of Object.entries(UI_PERMISSIONS.mainMenu)) {
        if (hasPermission(userPermissions, menuItem.permission)) {
            const menuEntry = {
                id,
                label: menuItem.label,
                subMenus: []
            };
            
            // Agregar submenús si existen y tienen permiso
            if (UI_PERMISSIONS.subMenus[id]) {
                menuEntry.subMenus = UI_PERMISSIONS.subMenus[id]
                    .filter(subItem => 
                        hasPermission(userPermissions, subItem.permission) && 
                        subItem.showInMenu !== false
                    );
            }
            
            filteredMenu.push(menuEntry);
        }
    }
    
    return filteredMenu;
}

/**
 * Obtiene el rol más alto del usuario basado en sus permisos
 * @param {number} userPermissions - Permisos del usuario
 * @returns {string|null} - Nombre del rol más alto o null si no coincide
 */
export function getHighestRole(userPermissions) {
    // Roles en orden de jerarquía (de mayor a menor)
    const roleHierarchy = ['ADMIN', 'MESA_PARTES', 'AREA_RESPONSABLE'];
    
    for (const roleName of roleHierarchy) {
        if (hasRole(userPermissions, roleName)) {
            return roleName;
        }
    }
    
    return null;
}

/**
 * Convierte permisos numéricos a una lista de nombres legibles
 * @param {number} permissionBits - Valor numérico de permisos
 * @returns {Array<string>} - Lista de nombres de permisos
 */
export function getPermissionNames(permissionBits) {
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
}

/**
 * Verifica si cierta UI debe ser mostrada basado en el contexto y permisos
 * @param {number} userPermissions - Permisos del usuario
 * @param {string} context - Contexto de la UI ('admin', 'mesaPartes', 'area')
 * @returns {boolean} - True si debe mostrarse
 */
export function shouldShowUI(userPermissions, context) {
    switch(context) {
        case 'admin':
            return hasRole(userPermissions, 'ADMIN');
        case 'mesaPartes':
            return hasRole(userPermissions, 'MESA_PARTES') || hasRole(userPermissions, 'ADMIN');
        case 'area':
            return hasRole(userPermissions, 'AREA_RESPONSABLE') || hasRole(userPermissions, 'ADMIN');
        default:
            return false;
    }
} 