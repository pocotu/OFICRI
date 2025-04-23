import { useAuthStore } from '@/store/auth'
import { ref } from 'vue'

// Definición de los permisos necesarios para cada sección del menú
const MENU_PERMISSIONS = {
  dashboard: 8, // Ver
  documents: {
    view: 8,
    create: 1,
    edit: 2,
    delete: 4,
    derive: 16,
    export: 64
  },
  mesaPartes: {
    view: 8,
    create: 1,
    edit: 2,
    delete: 4,
    derive: 16,
    export: 64
  },
  areas: {
    view: 8,
    create: 1,
    edit: 2,
    delete: 4
  },
  users: {
    view: 8,
    create: 1,
    edit: 2,
    delete: 4,
    manage: 128
  },
  roles: {
    view: 8,
    create: 1,
    edit: 2,
    delete: 4,
    manage: 128
  },
  audit: {
    view: 32 // Auditar
  }
}

// Estructura base del menú
const BASE_MENU = [
  {
    path: '/dashboard',
    label: 'Dashboard',
    icon: 'fas fa-chart-line',
    requiredPermission: MENU_PERMISSIONS.dashboard
  },
  {
    path: '/documents',
    label: 'Documentos',
    icon: 'fas fa-file-alt',
    requiredPermission: MENU_PERMISSIONS.documents.view,
    submenu: [
      {
        path: '/documents/create',
        label: 'Crear Documento',
        icon: 'fas fa-plus',
        requiredPermission: MENU_PERMISSIONS.documents.create
      },
      {
        path: '/documents/list',
        label: 'Lista de Documentos',
        icon: 'fas fa-list',
        requiredPermission: MENU_PERMISSIONS.documents.view
      },
      {
        path: '/documents/pending',
        label: 'Documentos Pendientes',
        icon: 'fas fa-clock',
        requiredPermission: MENU_PERMISSIONS.documents.derive
      },
      {
        path: '/documents/export',
        label: 'Exportar Documentos',
        icon: 'fas fa-file-export',
        requiredPermission: MENU_PERMISSIONS.documents.export
      }
    ]
  },
  {
    path: '/mesa-partes',
    label: 'Mesa de Partes',
    icon: 'fas fa-inbox',
    requiredPermission: MENU_PERMISSIONS.mesaPartes.view,
    submenu: [
      {
        path: '/mesa-partes/reception',
        label: 'Recepción',
        icon: 'fas fa-sign-in-alt',
        requiredPermission: MENU_PERMISSIONS.mesaPartes.create
      },
      {
        path: '/mesa-partes/pending',
        label: 'Pendientes',
        icon: 'fas fa-clock',
        requiredPermission: MENU_PERMISSIONS.mesaPartes.derive
      },
      {
        path: '/mesa-partes/history',
        label: 'Historial',
        icon: 'fas fa-history',
        requiredPermission: MENU_PERMISSIONS.mesaPartes.view
      },
      {
        path: '/mesa-partes/export',
        label: 'Exportar',
        icon: 'fas fa-file-export',
        requiredPermission: MENU_PERMISSIONS.mesaPartes.export
      }
    ]
  },
  {
    path: '/areas',
    label: 'Áreas',
    icon: 'fas fa-building',
    requiredPermission: MENU_PERMISSIONS.areas.view,
    submenu: [
      {
        path: '/areas/list',
        label: 'Lista de Áreas',
        icon: 'fas fa-list',
        requiredPermission: MENU_PERMISSIONS.areas.view
      },
      {
        path: '/areas/create',
        label: 'Crear Área',
        icon: 'fas fa-plus',
        requiredPermission: MENU_PERMISSIONS.areas.create
      }
    ]
  }
]

// Menú de administración
const ADMIN_MENU = [
  {
    path: '/users',
    label: 'Usuarios',
    icon: 'fas fa-users',
    requiredPermission: MENU_PERMISSIONS.users.view,
    submenu: [
      {
        path: '/users/list',
        label: 'Lista de Usuarios',
        icon: 'fas fa-list',
        requiredPermission: MENU_PERMISSIONS.users.view
      },
      {
        path: '/users/create',
        label: 'Crear Usuario',
        icon: 'fas fa-user-plus',
        requiredPermission: MENU_PERMISSIONS.users.manage
      }
    ]
  },
  {
    path: '/roles',
    label: 'Roles',
    icon: 'fas fa-user-shield',
    requiredPermission: MENU_PERMISSIONS.roles.view,
    submenu: [
      {
        path: '/roles/list',
        label: 'Lista de Roles',
        icon: 'fas fa-list',
        requiredPermission: MENU_PERMISSIONS.roles.view
      },
      {
        path: '/roles/create',
        label: 'Crear Rol',
        icon: 'fas fa-plus',
        requiredPermission: MENU_PERMISSIONS.roles.manage
      }
    ]
  },
  {
    path: '/audit',
    label: 'Auditoría',
    icon: 'fas fa-clipboard-list',
    requiredPermission: MENU_PERMISSIONS.audit.view,
    submenu: [
      {
        path: '/audit/logs',
        label: 'Logs del Sistema',
        icon: 'fas fa-history',
        requiredPermission: MENU_PERMISSIONS.audit.view
      },
      {
        path: '/audit/security',
        label: 'Eventos de Seguridad',
        icon: 'fas fa-shield-alt',
        requiredPermission: MENU_PERMISSIONS.audit.view
      }
    ]
  }
]

export const menuService = {
  /**
   * Obtiene el menú completo basado en los permisos del usuario
   * @returns {Array} Menú filtrado según permisos
   */
  getMenu() {
    const authStore = useAuthStore()
    const userPermissions = authStore.permissions

    // Filtrar menú principal
    const filteredMainMenu = BASE_MENU.filter(item => {
      if (!item.requiredPermission) return true
      return this.hasPermission(userPermissions, item.requiredPermission)
    }).map(item => {
      if (item.submenu) {
        return {
          ...item,
          submenu: item.submenu.filter(subItem => 
            this.hasPermission(userPermissions, subItem.requiredPermission)
          )
        }
      }
      return item
    })

    // Filtrar menú de administración
    const filteredAdminMenu = ADMIN_MENU.filter(item => {
      if (!item.requiredPermission) return true
      return this.hasPermission(userPermissions, item.requiredPermission)
    }).map(item => {
      if (item.submenu) {
        return {
          ...item,
          submenu: item.submenu.filter(subItem => 
            this.hasPermission(userPermissions, subItem.requiredPermission)
          )
        }
      }
      return item
    })

    return {
      mainMenu: filteredMainMenu,
      adminMenu: filteredAdminMenu
    }
  },

  /**
   * Verifica si el usuario tiene un permiso específico
   * @param {number} userPermissions - Permisos del usuario
   * @param {number} requiredPermission - Permiso requerido
   * @returns {boolean}
   */
  hasPermission(userPermissions, requiredPermission) {
    return (userPermissions & requiredPermission) === requiredPermission
  },

  /**
   * Verifica si el usuario tiene acceso a una ruta específica
   * @param {string} path - Ruta a verificar
   * @returns {boolean}
   */
  hasRouteAccess(path) {
    const authStore = useAuthStore()
    const userPermissions = authStore.permissions

    // Buscar en el menú principal
    const mainMenuItem = BASE_MENU.find(item => path.startsWith(item.path))
    if (mainMenuItem) {
      if (mainMenuItem.submenu) {
        const subMenuItem = mainMenuItem.submenu.find(subItem => path.startsWith(subItem.path))
        if (subMenuItem) {
          return this.hasPermission(userPermissions, subMenuItem.requiredPermission)
        }
      }
      return this.hasPermission(userPermissions, mainMenuItem.requiredPermission)
    }

    // Buscar en el menú de administración
    const adminMenuItem = ADMIN_MENU.find(item => path.startsWith(item.path))
    if (adminMenuItem) {
      if (adminMenuItem.submenu) {
        const subMenuItem = adminMenuItem.submenu.find(subItem => path.startsWith(subItem.path))
        if (subMenuItem) {
          return this.hasPermission(userPermissions, subMenuItem.requiredPermission)
        }
      }
      return this.hasPermission(userPermissions, adminMenuItem.requiredPermission)
    }

    return false
  }
} 