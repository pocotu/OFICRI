import { createRouter, createWebHistory } from 'vue-router'
// import HomeView from '../views/HomeView.vue'
import LoginView from '../views/LoginView.vue'
import UsuariosView from '../views/UsuariosView.vue'
import { useAuthStore } from '../stores/auth'

const DashboardLayout = () => import('../layouts/DashboardLayout.vue')

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('../views/HomeView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/',
      component: DashboardLayout,
      meta: { requiresAuth: true },
      children: [
        {
          path: 'dashboard',
          name: 'dashboard',
          component: () => import('../views/DashboardView.vue')
        },
        {
          path: 'perfil',
          name: 'perfil',
          component: () => import('../views/UserProfile.vue')
        },
        {
          path: 'usuarios',
          name: 'usuarios',
          component: UsuariosView,
          meta: { requiresAuth: true }
        },
        {
          path: 'roles',
          name: 'roles',
          component: () => import('../views/RolesView.vue'),
          meta: { requiresAuth: true }
        },
        {
          path: 'areas',
          name: 'areas',
          component: () => import('../views/areas/AreasView.vue'),
          meta: { requiresAuth: true }
        },
        {
          path: 'documentos',
          name: 'documentos',
          component: () => import('../views/DocumentosView.vue'),
          meta: { requiresAuth: true },
        },
        {
          path: 'documentos/recepcion',
          redirect: { name: 'documentos' }
        },
        {
          path: 'consulta-documentos',
          name: 'consulta-documentos',
          component: () => import('../views/documentos/ConsultaView.vue'),
          meta: { requiresAuth: true }
        },
        {
          path: 'auditoria',
          name: 'auditoria',
          component: () => import('../views/AuditoriaView.vue'),
          meta: { requiresAuth: true }
        },
        {
          path: 'reportes',
          name: 'reportes',
          component: () => import('../views/ReportesView.vue'),
          meta: { requiresAuth: true }
        },
        // ... otras rutas protegidas
      ]
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView,
      meta: { requiresGuest: true }
    },
    {
      path: '/logout',
      name: 'logout',
      component: () => import('../views/LogoutView.vue')
    }
  ]
})

// Guardia de navegación
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()
  await authStore.initialize()

  const isAuthenticated = authStore.isAuthenticated
  const user = authStore.user

  // Si la ruta requiere autenticación y el usuario no está autenticado
  if (to.meta.requiresAuth && !isAuthenticated) {
    next('/login')
  }
  // Si la ruta es para invitados (login) y el usuario está autenticado
  else if (to.meta.requiresGuest && isAuthenticated) {
    next('/dashboard')
  }
  // Si la ruta requiere permisos de auditoría/admin
  else if (to.meta.requiresAudit) {
    if (!user || !user.Permisos || ((user.Permisos & 32) !== 32 && (user.Permisos & 128) !== 128)) {
      // No tiene bit de AUDITAR (32) ni ADMIN (128)
      next('/dashboard')
      return
    }
    next()
  }
  else {
    next()
  }
})

export default router 