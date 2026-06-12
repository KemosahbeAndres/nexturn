import { createRouter, createWebHistory } from 'vue-router';
import LoginView from '../views/LoginView.vue';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: LoginView
    },
    {
      path: '/',
      component: () => import('../layouts/MainLayout.vue'), // Layout Principal
      children: [
        {
          path: '',
          redirect: '/dashboard' // Redirige por defecto al dashboard
        },
        {
          path: 'dashboard',
          name: 'dashboard',
          meta: { title: 'Dashboard' },
          component: () => import('../views/DashboardView.vue')
        },
        {
          path: 'usuarios',
          name: 'usuarios',
          meta: { title: 'Personal y Usuarios' },
          component: () => import('../views/UsersView.vue')
        }
      ]
    }
  ]
});

export default router;