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
      meta: { requiresAuth: true, requiresSuperAdmin: true }, // Protege esta ruta y a todos sus hijos
      children: [
        {
          path: '',
          redirect: '/dashboard' // Redirige por defecto al dashboard de admin
        },
        {
          path: 'dashboard',
          name: 'admin-dashboard',
          meta: { title: 'Dashboard Admin' },
          component: () => import('../views/DashboardView.vue')
        },
        {
          path: 'usuarios',
          name: 'admin-usuarios',
          meta: { title: 'Usuarios Globales' },
          component: () => import('../views/AdminUsersView.vue')
        },
        {
          path: 'empresas',
          name: 'admin-empresas',
          meta: { title: 'Empresas y Clientes' },
          component: () => import('../views/CompaniesView.vue')
        },
        {
          path: 'perfil',
          name: 'admin-perfil',
          meta: { title: 'Mi perfil' },
          component: () => import('../views/PerfilView.vue')
        }
      ]
    },
    {
      path: '/:companySlug',
      component: () => import('../layouts/EmpresaLayout.vue'), // Layout de Empresa
      meta: { requiresAuth: true, requiresCompany: true },
      children: [
        {
          path: '',
          redirect: { name: 'empresa-dashboard' }
        },
        {
          path: 'dashboard',
          name: 'empresa-dashboard',
          meta: { title: 'Dashboard' },
          component: () => import('../views/DashboardView.vue') // Reutilizado
        },
        {
          path: 'usuarios',
          name: 'empresa-usuarios',
          meta: { title: 'Usuarios' },
          component: () => import('../views/UsersView.vue') // Reutilizado
        },
        { path: 'personal', name: 'empresa-personal', component: () => import('../views/PersonalView.vue') },
        { path: 'sucursales', name: 'empresa-sucursales', component: () => import('../views/SucursalesView.vue') },
        { path: 'turnos', name: 'empresa-turnos', component: () => import('../views/TurnosView.vue') },
        { path: 'calendario', name: 'empresa-calendario', component: () => import('../views/CalendarioView.vue') },
        { path: 'perfil', name: 'empresa-perfil', meta: { title: 'Mi perfil' }, component: () => import('../views/PerfilView.vue') }
      ]
    }
  ]
});

router.beforeEach(async (to, _from) => {
  const sessionStore = useSessionStore();
  // Validamos si la sesión está activa (ya sea en memoria o en localStorage)
  const isAuthenticated = await sessionStore.validateSession();

  if (to.meta.requiresAuth && !isAuthenticated) {
    return { name: 'login' }; // Redirigir al login si no está autenticado
  }

  if (isAuthenticated) {
    const isSuperAdmin = sessionStore.userRole === 'super_admin';
    const companySlug = sessionStore.currentUser?.empresa?.slug || sessionStore.currentUser?.empresa_id;

    // Usuario de empresa sin slug resolvible: forzar logout
    if (!isSuperAdmin && !companySlug) {
      return { name: 'login' };
    }

    if (to.name === 'login') {
      return isSuperAdmin ? { name: 'admin-dashboard' } : { name: 'empresa-dashboard', params: { companySlug } };
    }

    // Usuarios de empresa intentando acceder al panel super_admin (/dashboard, /usuarios, /empresas)
    if (to.meta.requiresSuperAdmin && !isSuperAdmin) {
      return { name: 'empresa-dashboard', params: { companySlug } };
    }

    if (to.meta.requiresCompany) {
      if (isSuperAdmin) return true; // super_admin tiene pase libre en cualquier scope de empresa

      // Aislamiento por URL: el usuario solo puede navegar por el slug de su propia empresa
      if (to.params.companySlug !== companySlug) {
        return { name: 'empresa-dashboard', params: { companySlug } };
      }
    }
  }

  return true; // Permitir el paso en cualquier otro caso
});

export default router;