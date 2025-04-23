import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/store/auth'
import { menuService } from '../services/menuService'

// Layouts
import BaseLayout from '@/layouts/BaseLayout.vue'

// Vistas públicas
// import Login from '@/views/Login.vue' // Se importa directamente en la definición de ruta
import AccessDenied from '@/views/AccessDenied.vue'
import NotFound from '@/views/NotFound.vue'

// Vistas protegidas (Estas probablemente se cargan dinámicamente desde los módulos)
import Dashboard from '@/views/Dashboard.vue' // Mantener Dashboard como placeholder inicial
/* Comentando importaciones estáticas de vistas de módulos
import Documents from '@/views/documents/Documents.vue'
import DocumentCreate from '@/views/documents/Create.vue'
import DocumentList from '@/views/documents/List.vue'
import DocumentPending from '@/views/documents/Pending.vue'
import MesaPartes from '@/views/mesa-partes/MesaPartes.vue'
import MesaPartesReception from '@/views/mesa-partes/Reception.vue'
import MesaPartesPending from '@/views/mesa-partes/Pending.vue'
import MesaPartesHistory from '@/views/mesa-partes/History.vue'
import Areas from '@/views/areas/Areas.vue'
import AreaList from '@/views/areas/List.vue'
import AreaCreate from '@/views/areas/Create.vue'
import Users from '@/views/users/Users.vue'
import UserList from '@/views/users/List.vue'
import UserCreate from '@/views/users/Create.vue'
import Roles from '@/views/roles/Roles.vue'
import RoleList from '@/views/roles/List.vue'
import RoleCreate from '@/views/roles/Create.vue'
import Audit from '@/views/audit/Audit.vue'
import AuditLogs from '@/views/audit/Logs.vue'
import AuditSecurity from '@/views/audit/Security.vue'
*/
import AccessibilityTesting from '@/components/AccessibilityTesting.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('@auth/components/Login.vue'),
      meta: { requiresAuth: false }
    },
    {
      path: '/access-denied',
      name: 'access-denied',
      component: () => import('@/views/AccessDenied.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/',
      component: BaseLayout,
      meta: { requiresAuth: true },
      children: [
        {
          path: '',
          redirect: '/dashboard'
        },
        {
          path: 'dashboard',
          name: 'Dashboard',
          component: () => import('@/views/Dashboard.vue'), // Usar import dinámico aquí también
          meta: {
            requiresAuth: true,
            requiredPermission: 8 // Ver
          }
        },
        /* Comentando rutas estáticas de módulos que se cargarán dinámicamente
        {
          path: 'documents',
          name: 'Documents',
          component: () => import('@/views/documents/Documents.vue'),
          meta: {
            requiresAuth: true,
            requiredPermission: 8 // Ver
          },
          children: [
            {
              path: '',
              redirect: 'list'
            },
            {
              path: 'create',
              name: 'CreateDocument',
              component: () => import('@/views/documents/Create.vue'),
              meta: {
                requiresAuth: true,
                requiredPermission: 1 // Crear
              }
            },
            {
              path: 'list',
              name: 'DocumentList',
              component: () => import('@/views/documents/List.vue'),
              meta: {
                requiresAuth: true,
                requiredPermission: 8 // Ver
              }
            },
            {
              path: 'pending',
              name: 'PendingDocuments',
              component: () => import('@/views/documents/Pending.vue'),
              meta: {
                requiresAuth: true,
                requiredPermission: 16 // Derivar
              }
            },
            {
              path: 'export',
              name: 'ExportDocuments',
              component: () => import('@/views/documents/Export.vue'),
              meta: {
                requiresAuth: true,
                requiredPermission: 64 // Exportar
              }
            }
          ]
        },
        {
          path: 'mesa-partes',
          name: 'MesaPartes',
          component: () => import('@/views/mesa-partes/MesaPartes.vue'),
          meta: {
            requiresAuth: true,
            requiredPermission: 8 // Ver
          },
          children: [
            {
              path: '',
              redirect: 'reception'
            },
            {
              path: 'reception',
              name: 'Reception',
              component: () => import('@/views/mesa-partes/Reception.vue'),
              meta: {
                requiresAuth: true,
                requiredPermission: 1 // Crear
              }
            },
            {
              path: 'pending',
              name: 'Pending',
              component: () => import('@/views/mesa-partes/Pending.vue'),
              meta: {
                requiresAuth: true,
                requiredPermission: 16 // Derivar
              }
            },
            {
              path: 'history',
              name: 'History',
              component: () => import('@/views/mesa-partes/History.vue'),
              meta: {
                requiresAuth: true,
                requiredPermission: 8 // Ver
              }
            },
            {
              path: 'export',
              name: 'Export',
              component: () => import('@/views/mesa-partes/Export.vue'),
              meta: {
                requiresAuth: true,
                requiredPermission: 64 // Exportar
              }
            }
          ]
        },
        {
          path: 'areas',
          name: 'Areas',
          component: () => import('@/views/areas/Areas.vue'),
          meta: {
            requiresAuth: true,
            requiredPermission: 8 // Ver
          },
          children: [
            {
              path: '',
              redirect: 'list'
            },
            {
              path: 'list',
              name: 'AreaList',
              component: () => import('@/views/areas/List.vue'),
              meta: {
                requiresAuth: true,
                requiredPermission: 8 // Ver
              }
            },
            {
              path: 'create',
              name: 'CreateArea',
              component: () => import('@/views/areas/Create.vue'),
              meta: {
                requiresAuth: true,
                requiredPermission: 1 // Crear
              }
            }
          ]
        },
        {
          path: 'users',
          name: 'Users',
          component: () => import('@/views/users/Users.vue'),
          meta: {
            requiresAuth: true,
            requiredPermission: 8 // Ver
          },
          children: [
            {
              path: '',
              redirect: 'list'
            },
            {
              path: 'list',
              name: 'UserList',
              component: () => import('@/views/users/List.vue'),
              meta: {
                requiresAuth: true,
                requiredPermission: 8 // Ver
              }
            },
            {
              path: 'create',
              name: 'CreateUser',
              component: () => import('@/views/users/Create.vue'),
              meta: {
                requiresAuth: true,
                requiredPermission: 128 // Administrar
              }
            }
          ]
        },
        {
          path: 'roles',
          name: 'Roles',
          component: () => import('@/views/roles/Roles.vue'),
          meta: {
            requiresAuth: true,
            requiredPermission: 8 // Ver
          },
          children: [
            {
              path: '',
              redirect: 'list'
            },
            {
              path: 'list',
              name: 'RoleList',
              component: () => import('@/views/roles/List.vue'),
              meta: {
                requiresAuth: true,
                requiredPermission: 8 // Ver
              }
            },
            {
              path: 'create',
              name: 'CreateRole',
              component: () => import('@/views/roles/Create.vue'),
              meta: {
                requiresAuth: true,
                requiredPermission: 128 // Administrar
              }
            }
          ]
        },
        {
          path: 'audit',
          name: 'Audit',
          component: () => import('@/views/audit/Audit.vue'),
          meta: {
            requiresAuth: true,
            requiredPermission: 32 // Auditar
          },
          children: [
            {
              path: '',
              redirect: 'logs'
            },
            {
              path: 'logs',
              name: 'AuditLogs',
              component: () => import('@/views/audit/Logs.vue'),
              meta: {
                requiresAuth: true,
                requiredPermission: 32 // Auditar
              }
            },
            {
              path: 'security',
              name: 'AuditSecurity',
              component: () => import('@/views/audit/Security.vue'),
              meta: {
                requiresAuth: true,
                requiredPermission: 32 // Auditar
              }
            }
          ]
        },
        */
        {
          path: 'accessibility-test',
          name: 'accessibility',
          component: AccessibilityTesting,
          meta: {
            requiresAuth: true,
            requiredPermission: 32, // Permiso de auditoría
            title: 'Pruebas de Accesibilidad'
          }
        }
      ]
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('@/views/NotFound.vue')
    }
  ]
})

// Guard de navegación
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth)

  // Si la ruta no requiere autenticación, permitir acceso
  if (!requiresAuth) {
    next()
    return
  }

  // Si es la página de acceso denegado, permitir acceso sin verificación adicional
  if (to.name === 'access-denied') {
    next()
    return
  }

  // Verificar si el usuario está autenticado
  if (!authStore.isAuthenticated) {
    next({ name: 'login', query: { redirect: to.fullPath } })
    return
  }

  // Verificar si el usuario tiene acceso a la ruta (solo para dashboard y otras rutas protegidas)
  if (to.path === '/dashboard' || menuService.hasRouteAccess(to.path)) {
    next()
  } else {
    next({ name: 'access-denied' })
  }
})

export default router 