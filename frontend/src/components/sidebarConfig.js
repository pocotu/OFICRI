export const sidebarOptions = {
  admin: [
    { icon: 'fa-solid fa-gauge', label: 'Dashboard', route: '/dashboard' },
    { icon: 'fa-solid fa-users', label: 'Gestión de Usuarios', route: '/usuarios' },
    { icon: 'fa-solid fa-user-shield', label: 'Gestión de Roles y Permisos', route: '/roles' },
    { icon: 'fa-solid fa-building', label: 'Gestión de Áreas', route: '/areas' },
    { icon: 'fa-solid fa-file', label: 'Gestión de Documentos', route: '/documentos' },
    { icon: 'fa-solid fa-clipboard-list', label: 'Auditoría', route: '/auditoria' },
    { icon: 'fa-solid fa-chart-bar', label: 'Reportes y Exportación', route: '/reportes' }
  ],
  mesa: [
    { icon: 'fa-solid fa-gauge', label: 'Dashboard', route: '/dashboard' },
    { icon: 'fa-solid fa-file-circle-plus', label: 'Recepción de Documentos', route: '/documentos/recepcion' },
    { icon: 'fa-solid fa-share-nodes', label: 'Derivación', route: '/documentos/derivacion' },
    { icon: 'fa-solid fa-magnifying-glass', label: 'Consulta', route: '/documentos/consulta' },
    { icon: 'fa-solid fa-chart-bar', label: 'Reportes', route: '/reportes' },
    { icon: 'fa-solid fa-file-export', label: 'Exportar', route: '/exportar' }
  ],
  responsable: [
    { icon: 'fa-solid fa-gauge', label: 'Dashboard', route: '/dashboard' },
    { icon: 'fa-solid fa-file', label: 'Gestión Documental', route: '/documentos/gestion' },
    { icon: 'fa-solid fa-tasks', label: 'Procesamiento', route: '/documentos/procesamiento' },
    { icon: 'fa-solid fa-share-nodes', label: 'Derivación', route: '/documentos/derivacion' },
    { icon: 'fa-solid fa-bell', label: 'Monitoreo', route: '/documentos/monitoreo' },
    { icon: 'fa-solid fa-chart-bar', label: 'Reportes', route: '/reportes' },
    { icon: 'fa-solid fa-file-export', label: 'Exportar', route: '/exportar' }
  ]
} 