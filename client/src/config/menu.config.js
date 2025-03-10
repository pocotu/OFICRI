export const menuConfig = {
    admin: [
        {
            icon: 'fas fa-tachometer-alt',
            label: 'Dashboard',
            url: '/admin.html'
        },
        {
            icon: 'fas fa-users',
            label: 'Usuarios',
            url: '/admin/users.html'
        },
        {
            icon: 'fas fa-building',
            label: 'Áreas',
            url: '/admin/areas.html'
        },
        {
            icon: 'fas fa-file-alt',
            label: 'Documentos',
            url: '/admin/documents.html'
        },
        {
            icon: 'fas fa-cog',
            label: 'Configuración',
            url: '/admin/settings.html'
        }
    ],
    user: [
        {
            icon: 'fas fa-home',
            label: 'Inicio',
            url: '/dashboard.html'
        },
        {
            icon: 'fas fa-file-alt',
            label: 'Mis Documentos',
            url: '/documents.html'
        },
        {
            icon: 'fas fa-clock',
            label: 'Pendientes',
            url: '/pending.html'
        },
        {
            icon: 'fas fa-user',
            label: 'Mi Perfil',
            url: '/profile.html'
        }
    ]
}; 