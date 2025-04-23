// Define las rutas del módulo auth
const routes = [
  {
    path: '/login',
    name: 'login',
    component: () => import('./components/Login.vue')
  }
];

export default routes; 