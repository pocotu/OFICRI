export const sidebarOptions = {
  admin: [
    { icon: 'fa-solid fa-gauge', label: 'Dashboard', route: '/dashboard' },
    { icon: 'fa-solid fa-users', label: 'Gestión de Usuarios', route: '/usuarios' },
    { icon: 'fa-solid fa-user-shield', label: 'Gestión de Roles y Permisos', route: '/roles' },
    { icon: 'fa-solid fa-building', label: 'Gestión de Áreas', route: '/areas' },
    { icon: 'fa-solid fa-file', label: 'Gestión de Documentos', route: '/documentos' },
    { icon: 'fa-solid fa-magnifying-glass', label: 'Consulta de Documentos', route: '/consulta-documentos' },
    { icon: 'fa-solid fa-clipboard-list', label: 'Auditoría', route: '/auditoria' },
    { icon: 'fa-solid fa-chart-bar', label: 'Reportes y Exportación', route: '/reportes' },
    { icon: 'fa-solid fa-right-from-bracket', label: 'Cerrar Sesión', logout: true }
  ],
  mesa: [
    { icon: 'fa-solid fa-gauge', label: 'Dashboard', route: '/dashboard' },
    { icon: 'fa-solid fa-file-circle-plus', label: 'Recepción de Documentos', route: '/documentos/recepcion' },
    { icon: 'fa-solid fa-magnifying-glass', label: 'Consulta de Documentos', route: '/consulta-documentos' },
    { icon: 'fa-solid fa-chart-bar', label: 'Reportes y Exportación', route: '/reportes' },
    { icon: 'fa-solid fa-right-from-bracket', label: 'Cerrar Sesión', logout: true }
  ],
  responsable: [
    { icon: 'fa-solid fa-gauge', label: 'Dashboard', route: '/dashboard' },
    { icon: 'fa-solid fa-file', label: 'Gestión Documental', route: '/dosaje/gestion' },
    { icon: 'fa-solid fa-tasks', label: 'Procesamiento', route: '/documentos/procesamiento' },
    { icon: 'fa-solid fa-chart-bar', label: 'Reportes y Exportación', route: '/reportes' },
    { icon: 'fa-solid fa-right-from-bracket', label: 'Cerrar Sesión', logout: true }
  ]
} 