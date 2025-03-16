/**
 * Configuración de Roles y Permisos
 * 
 * Este archivo define la estructura de roles y permisos del sistema,
 * utilizando un sistema basado en bits para los permisos.
 */

// Definición de permisos (bits)
export const PERMISSIONS = {
    CREATE: 1,      // bit 0 (1) - Crear
    EDIT: 2,        // bit 1 (2) - Editar
    DELETE: 4,      // bit 2 (4) - Eliminar
    VIEW: 8,        // bit 3 (8) - Ver
    DERIVE: 16,     // bit 4 (16) - Derivar
    AUDIT: 32,      // bit 5 (32) - Auditar
    EXPORT: 64,     // bit 6 (64) - Exportar
    BLOCK: 128      // bit 7 (128) - Bloquear
};

// Definición de roles
export const ROLES = {
    ADMIN: {
        id: 1,
        name: 'Administrador',
        description: 'Acceso total al sistema',
        permissions: 255 // Todos los permisos (bits 0-7)
    },
    MESA_PARTES: {
        id: 2,
        name: 'Mesa de Partes',
        description: 'Gestión de documentos y derivaciones',
        permissions: PERMISSIONS.CREATE | 
                    PERMISSIONS.EDIT | 
                    PERMISSIONS.VIEW | 
                    PERMISSIONS.DERIVE | 
                    PERMISSIONS.EXPORT // bits 0,1,3,4,6
    },
    AREA_RESPONSABLE: {
        id: 3,
        name: 'Responsable de Área',
        description: 'Gestión de documentos en su área',
        permissions: PERMISSIONS.CREATE | 
                    PERMISSIONS.EDIT | 
                    PERMISSIONS.VIEW | 
                    PERMISSIONS.DERIVE | 
                    PERMISSIONS.EXPORT // bits 0,1,3,4,6
    }
};

// Mapeo de permisos a elementos de UI
export const PERMISSION_UI_MAP = {
    [PERMISSIONS.CREATE]: {
        label: 'Crear',
        icon: 'fas fa-plus',
        color: 'success'
    },
    [PERMISSIONS.EDIT]: {
        label: 'Editar',
        icon: 'fas fa-edit',
        color: 'primary'
    },
    [PERMISSIONS.DELETE]: {
        label: 'Eliminar',
        icon: 'fas fa-trash',
        color: 'danger'
    },
    [PERMISSIONS.VIEW]: {
        label: 'Ver',
        icon: 'fas fa-eye',
        color: 'info'
    },
    [PERMISSIONS.DERIVE]: {
        label: 'Derivar',
        icon: 'fas fa-share-alt',
        color: 'warning'
    },
    [PERMISSIONS.AUDIT]: {
        label: 'Auditar',
        icon: 'fas fa-clipboard-check',
        color: 'secondary'
    },
    [PERMISSIONS.EXPORT]: {
        label: 'Exportar',
        icon: 'fas fa-file-export',
        color: 'success'
    },
    [PERMISSIONS.BLOCK]: {
        label: 'Bloquear',
        icon: 'fas fa-ban',
        color: 'danger'
    }
};

// Mapeo de roles a rutas por defecto
export const ROLE_DEFAULT_ROUTES = {
    [ROLES.ADMIN.id]: '/admin.html',
    [ROLES.MESA_PARTES.id]: '/mesaPartes.html',
    [ROLES.AREA_RESPONSABLE.id]: '/area.html'
};

// Mapeo de roles a menús
export const ROLE_MENUS = {
    [ROLES.ADMIN.id]: [
        {
            icon: 'fas fa-tachometer-alt',
            label: 'Dashboard',
            url: '/admin.html',
            permission: PERMISSIONS.VIEW
        },
        {
            icon: 'fas fa-users',
            label: 'Usuarios',
            url: '/admin/users.html',
            permission: PERMISSIONS.VIEW
        },
        {
            icon: 'fas fa-building',
            label: 'Áreas',
            url: '/admin/areas.html',
            permission: PERMISSIONS.VIEW
        },
        {
            icon: 'fas fa-file-alt',
            label: 'Documentos',
            url: '/admin/documents.html',
            permission: PERMISSIONS.VIEW
        },
        {
            icon: 'fas fa-clipboard-check',
            label: 'Auditoría',
            url: '/admin/audit.html',
            permission: PERMISSIONS.AUDIT
        },
        {
            icon: 'fas fa-cog',
            label: 'Configuración',
            url: '/admin/settings.html',
            permission: PERMISSIONS.VIEW
        }
    ],
    [ROLES.MESA_PARTES.id]: [
        {
            icon: 'fas fa-home',
            label: 'Inicio',
            url: '/mesaPartes.html',
            permission: PERMISSIONS.VIEW
        },
        {
            icon: 'fas fa-file-alt',
            label: 'Documentos',
            url: '/mesaPartes/documents.html',
            permission: PERMISSIONS.VIEW
        },
        {
            icon: 'fas fa-clock',
            label: 'Pendientes',
            url: '/mesaPartes/pending.html',
            permission: PERMISSIONS.VIEW
        },
        {
            icon: 'fas fa-user',
            label: 'Mi Perfil',
            url: '/profile.html',
            permission: PERMISSIONS.VIEW
        }
    ],
    [ROLES.AREA_RESPONSABLE.id]: [
        {
            icon: 'fas fa-home',
            label: 'Inicio',
            url: '/area.html',
            permission: PERMISSIONS.VIEW
        },
        {
            icon: 'fas fa-file-alt',
            label: 'Documentos',
            url: '/area/documents.html',
            permission: PERMISSIONS.VIEW
        },
        {
            icon: 'fas fa-clock',
            label: 'Pendientes',
            url: '/area/pending.html',
            permission: PERMISSIONS.VIEW
        },
        {
            icon: 'fas fa-user',
            label: 'Mi Perfil',
            url: '/profile.html',
            permission: PERMISSIONS.VIEW
        }
    ]
};

// Exportar configuración por defecto
export default {
    PERMISSIONS,
    ROLES,
    PERMISSION_UI_MAP,
    ROLE_DEFAULT_ROUTES,
    ROLE_MENUS
}; 