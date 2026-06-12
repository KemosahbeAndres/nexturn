import { createRouter, createWebHistory } from 'vue-router';
import LoginView from '../views/LoginView.vue';
import { useSessionStore } from '../stores/sessionStore';

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
      meta: { requiresAuth: true }, // Protege esta ruta y a todos sus hijos
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
          meta: { title: 'Usuarios' },
          component: () => import('../views/UsersView.vue')
        }
      ]
    }
  ]
});

router.beforeEach(async (to, from, next) => {
  const sessionStore = useSessionStore();
  // Validamos si la sesión está activa (ya sea en memoria o en localStorage)
  const isAuthenticated = await sessionStore.validateSession();

  if (to.meta.requiresAuth && !isAuthenticated) {
    next({ name: 'login' }); // Redirigir al login si no está autenticado
  } else if (to.name === 'login' && isAuthenticated) {
    next({ name: 'dashboard' }); // Redirigir al dashboard si intenta ir al login y ya está autenticado
  } else {
    next(); // Permitir el paso en cualquier otro caso
  }
});

export default router;