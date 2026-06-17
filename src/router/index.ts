import { createRouter, createWebHistory } from 'vue-router';
import { collection, getDocs, query, where } from 'firebase/firestore';
import LoginView from '../views/LoginView.vue';
import { useSessionStore } from '../stores/sessionStore';
import { db } from '../firebase';
import { ubicacionConverter } from '../models/Ubicacion';
import { empleadoConverter } from '../models/Empleado';

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
          meta: { title: 'Dashboard', subtitle: 'Panel de administración global' },
          component: () => import('../views/admin/DashboardView.vue')
        },
        {
          path: 'usuarios',
          name: 'admin-usuarios',
          meta: { title: 'Usuarios', subtitle: 'Gestión de usuarios del sistema' },
          component: () => import('../views/admin/AdminUsersView.vue')
        },
        {
          path: 'empresas',
          name: 'admin-empresas',
          meta: { title: 'Clientes', subtitle: 'Empresas y organizaciones registradas' },
          component: () => import('../views/admin/CompaniesView.vue')
        },
        {
          path: 'perfil',
          name: 'admin-perfil',
          meta: { title: 'Mi perfil', subtitle: 'Configuración de tu cuenta' },
          component: () => import('../views/shared/PerfilView.vue')
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
          redirect: { name: 'empresa-home' }
        },
        {
          path: 'empresa',
          name: 'empresa-home',
          meta: { title: 'Panel', subtitle: 'Vista general de la empresa' },
          component: () => import('../views/empresa/EmpresaView.vue')
        },
        { path: 'sucursales', name: 'empresa-sucursales', meta: { title: 'Sucursales', subtitle: 'Puntos de atención y ubicaciones' }, component: () => import('../views/empresa/AjustesEstructuraView.vue') },
        { path: 'perfil', name: 'empresa-perfil', meta: { title: 'Mi perfil', subtitle: 'Configuración de tu cuenta' }, component: () => import('../views/shared/PerfilView.vue') },
        { path: 'empresa-ajustes', name: 'empresa-ajustes-empresa', meta: { title: 'Empresa', subtitle: 'Datos generales de la organización' }, component: () => import('../views/empresa/AjustesEmpresaView.vue') },
        { path: 'usuarios', name: 'empresa-ajustes-usuarios', meta: { title: 'Usuarios', subtitle: 'Control de acceso y permisos' }, component: () => import('../views/empresa/AjustesUsuariosView.vue') },
        { path: 'cargos', name: 'empresa-ajustes-cargos', meta: { title: 'Cargos', subtitle: 'Roles de trabajo personalizados' }, component: () => import('../views/empresa/AjustesRolesView.vue') },
      ]
    },
    {
      path: '/:companySlug/:ubicacionSlug',
      component: () => import('../layouts/SucursalLayout.vue'),
      meta: { requiresAuth: true, requiresCompany: true, requiresUbicacion: true },
      children: [
        { path: '', name: 'sucursal-home', redirect: { name: 'sucursal-dashboard' } },
        { path: 'dashboard', name: 'sucursal-dashboard', meta: { title: 'Centro de control', subtitle: 'Resumen operativo de la sucursal' }, component: () => import('../views/sucursal/SucursalDashboardView.vue') },
        { path: 'turnos', name: 'sucursal-turnos', meta: { title: 'Turnos', subtitle: 'Gestión de horarios y asignaciones' }, component: () => import('../views/sucursal/TurnosView.vue') },
        { path: 'solicitudes', name: 'sucursal-solicitudes', meta: { title: 'Solicitudes', subtitle: 'Permisos y ausencias pendientes' }, component: () => import('../views/sucursal/SolicitudesView.vue') },
        {
          path: 'mi-equipo',
          component: () => import('../layouts/MiEquipoLayout.vue'),
          children: [
            { path: '', name: 'sucursal-mi-equipo', redirect: { name: 'sucursal-mi-equipo-personal' } },
            { path: 'personal', name: 'sucursal-mi-equipo-personal', meta: { title: 'Mi Equipo', subtitle: 'Directorio de personal de la sucursal' }, component: () => import('../views/sucursal/PersonalView.vue') },
            { path: 'habilidades', name: 'sucursal-mi-equipo-habilidades', meta: { title: 'Habilidades', subtitle: 'Roles y competencias del equipo' }, component: () => import('../views/sucursal/ajustes/AjustesHabilidadesView.vue') },
            { path: 'disponibilidad', name: 'sucursal-mi-equipo-disponibilidad', meta: { title: 'Disponibilidad', subtitle: 'Reglas base de disponibilidad' }, component: () => import('../views/sucursal/ajustes/AjustesDisponibilidadView.vue') },
            { path: 'excepciones', name: 'sucursal-mi-equipo-excepciones', meta: { title: 'Excepciones', subtitle: 'Ausencias y días fuera de rutina' }, component: () => import('../views/sucursal/ajustes/AjustesExcepcionesView.vue') },
            { path: 'reglas', name: 'sucursal-mi-equipo-reglas', meta: { title: 'Reglas', subtitle: 'Preferencias de asignación conjunta' }, component: () => import('../views/sucursal/ajustes/AjustesReglasView.vue') },
          ]
        }
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
      return isSuperAdmin ? { name: 'admin-dashboard' } : { name: 'empresa-home', params: { companySlug } };
    }

    // Usuarios de empresa intentando acceder al panel super_admin (/dashboard, /usuarios, /empresas)
    if (to.meta.requiresSuperAdmin && !isSuperAdmin) {
      return { name: 'empresa-home', params: { companySlug } };
    }

    if (to.meta.requiresCompany) {
      if (!isSuperAdmin) {
        // Aislamiento por URL: el usuario solo puede navegar por el slug de su propia empresa
        if (to.params.companySlug !== companySlug) {
          return { name: 'empresa-home', params: { companySlug } };
        }
      }

      if (to.meta.requiresUbicacion && !isSuperAdmin) {
        const tieneAcceso = await usuarioPerteneceASucursal(
          sessionStore.currentUser?.empresa_id ?? null,
          sessionStore.currentUser?.contact_id ?? null,
          to.params.ubicacionSlug as string
        );
        if (!tieneAcceso) {
          return { name: 'empresa-home', params: { companySlug } };
        }
      }
    }
  }

  return true; // Permitir el paso en cualquier otro caso
});

async function usuarioPerteneceASucursal(empresaId: string | null, contactId: string | null, ubicacionSlug: string): Promise<boolean> {
  if (!empresaId || !contactId) return false;

  const ubicacionesRef = collection(db, 'ubicaciones').withConverter(ubicacionConverter);
  const ubicacionSnap = await getDocs(query(
    ubicacionesRef,
    where('company_id', '==', empresaId),
    where('slug', '==', ubicacionSlug),
    where('deletedAt', '==', null)
  ));
  if (ubicacionSnap.empty) return false;
  const ubicacion = ubicacionSnap.docs[0].data();

  const empleadosRef = collection(db, 'empleados').withConverter(empleadoConverter);
  const empleadoSnap = await getDocs(query(
    empleadosRef,
    where('company_id', '==', empresaId),
    where('contact_id', '==', contactId),
    where('deletedAt', '==', null)
  ));
  if (empleadoSnap.empty) return false;
  const empleado = empleadoSnap.docs[0].data();

  if (ubicacion.manager_id === empleado.id) return true;

  return empleado.contratos.some(c => c.active && c.ubicacion_id === ubicacion.id);
}

export default router;