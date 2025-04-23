import Dashboard from './components/Dashboard.vue';

// Configuración de rutas para el módulo de dashboard
const dashboardRoutes = [
  {
    path: '/dashboard',
    name: 'dashboard',
    component: Dashboard,
    meta: {
      title: 'Dashboard',
      requiresAuth: true,
      permissions: []  // Todos los usuarios autenticados pueden acceder
    }
  }
];

export default dashboardRoutes; 