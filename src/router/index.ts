import { createRouter, createWebHistory } from 'vue-router';
import { collection, getDocs, query, where } from 'firebase/firestore';
import LoginView from '../views/LoginView.vue';
import { useSessionStore } from '../stores/sessionStore';
import { useGrantStore } from '../stores/grantStore';
import { db } from '../firebase';
import { ubicacionConverter } from '../models/Ubicacion';
import { zonaConverter } from '../models/Zona';

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
      component: () => import('../layouts/MainLayout.vue'),
      meta: { requiresAuth: true, requiresSuperAdmin: true },
      children: [
        {
          path: '',
          redirect: '/dashboard'
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
      component: () => import('../layouts/EmpresaLayout.vue'),
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
        { path: 'organizacion', name: 'empresa-organizacion', meta: { title: 'Organización', subtitle: 'Zonas y sucursales de la empresa' }, component: () => import('../views/empresa/AjustesEstructuraView.vue') },
        { path: 'perfil', name: 'empresa-perfil', meta: { title: 'Mi perfil', subtitle: 'Configuración de tu cuenta' }, component: () => import('../views/shared/PerfilView.vue') },
        { path: 'empresa-ajustes', name: 'empresa-ajustes-empresa', meta: { title: 'Empresa', subtitle: 'Datos generales de la organización' }, component: () => import('../views/empresa/AjustesEmpresaView.vue') },
        { path: 'usuarios', name: 'empresa-ajustes-usuarios', meta: { title: 'Usuarios', subtitle: 'Control de acceso y permisos' }, component: () => import('../views/empresa/AjustesUsuariosView.vue') },
        { path: 'cargos', name: 'empresa-ajustes-cargos', meta: { title: 'Cargos', subtitle: 'Roles de trabajo personalizados' }, component: () => import('../views/empresa/AjustesRolesView.vue') },
      ]
    },
    {
      path: '/:companySlug/zonas/:zonaSlug',
      component: () => import('../layouts/ZonaLayout.vue'),
      meta: { requiresAuth: true, requiresCompany: true, requiresZona: true },
      children: [
        { path: '', name: 'zona-home', redirect: { name: 'zona-dashboard' } },
        {
          path: 'dashboard',
          name: 'zona-dashboard',
          meta: { title: 'Zona', subtitle: 'Resumen de la zona' },
          component: () => import('../views/zona/ZonaDashboardView.vue')
        },
      ]
    },
    {
      path: '/:companySlug/sucursales/:ubicacionSlug',
      component: () => import('../layouts/SucursalLayout.vue'),
      meta: { requiresAuth: true, requiresCompany: true, requiresUbicacion: true },
      children: [
        { path: '', name: 'sucursal-home', redirect: { name: 'sucursal-dashboard' } },
        { path: 'dashboard', name: 'sucursal-dashboard', meta: { title: 'Centro de control', subtitle: 'Resumen operativo de la sucursal' }, component: () => import('../views/sucursal/SucursalDashboardView.vue') },
        { path: 'turnos', name: 'sucursal-turnos', meta: { title: 'Turnos', subtitle: 'Gestión de horarios y asignaciones' }, component: () => import('../views/sucursal/TurnosView.vue') },
        { path: 'solicitudes', name: 'sucursal-solicitudes', meta: { title: 'Solicitudes', subtitle: 'Permisos y ausencias pendientes' }, component: () => import('../views/sucursal/SolicitudesView.vue') },
        { path: 'presencias', name: 'sucursal-presencias', meta: { title: 'Presencias', subtitle: 'Disponibilidad diaria del equipo' }, component: () => import('../views/sucursal/PresenciasView.vue') },
        { path: 'calendario', name: 'sucursal-calendario', meta: { title: 'Mi Calendario', subtitle: 'Tu horario publicado' }, component: () => import('../views/sucursal/CalendarioView.vue') },
        {
          path: 'mi-equipo',
          component: () => import('../layouts/MiEquipoLayout.vue'),
          children: [
            { path: '', name: 'sucursal-mi-equipo', redirect: { name: 'sucursal-mi-equipo-personal' } },
            { path: 'personal', name: 'sucursal-mi-equipo-personal', meta: { title: 'Mi Equipo', subtitle: 'Directorio de personal de la sucursal' }, component: () => import('../views/sucursal/PersonalView.vue') },
            { path: 'estaciones', name: 'sucursal-mi-equipo-estaciones', meta: { title: 'Estaciones', subtitle: 'Puestos operativos del equipo' }, component: () => import('../views/sucursal/ajustes/AjustesEstacionesView.vue') },
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
  const isAuthenticated = await sessionStore.validateSession();

  if (to.meta.requiresAuth && !isAuthenticated) {
    return { name: 'login' };
  }

  if (!isAuthenticated) return true;

  const user = sessionStore.currentUser!;
  const isSuperAdmin = user.isSuperAdmin;

  // Bloquear usuarios no activos (invitado / suspendido)
  if (!isSuperAdmin && !user.isActivo && to.name !== 'login') {
    return { name: 'login' };
  }

  const defaultEmpresaSlug = user.empresa?.slug ?? user.empresa_id ?? '';

  if (to.name === 'login') {
    return isSuperAdmin
      ? { name: 'admin-dashboard' }
      : { name: 'empresa-home', params: { companySlug: defaultEmpresaSlug } };
  }

  // Rutas exclusivas del super_admin
  if (to.meta.requiresSuperAdmin && !isSuperAdmin) {
    return { name: 'empresa-home', params: { companySlug: defaultEmpresaSlug } };
  }

  if (to.meta.requiresCompany) {
    const companySlug = to.params.companySlug as string;

    if (!isSuperAdmin) {
      // Resolver slug → id desde el mapa cargado al login
      const grantStore = useGrantStore();
      const companyId = grantStore.resolverEmpresaId(companySlug);

      if (!companyId) {
        // Slug desconocido para este usuario → denegar
        return { name: 'empresa-home', params: { companySlug: defaultEmpresaSlug } };
      }

      const tieneAcceso = grantStore.puedeAccederScope(user, 'company', companyId, { companyId });
      if (!tieneAcceso) {
        return { name: 'empresa-home', params: { companySlug: defaultEmpresaSlug } };
      }

      if (to.meta.requiresZona) {
        const zonaSlug = to.params.zonaSlug as string;
        let zonaId = grantStore.resolverZonaId(zonaSlug);

        if (!zonaId) {
          const resolved = await resolverYRegistrarZona(companyId, zonaSlug);
          if (!resolved) {
            return { name: 'empresa-home', params: { companySlug: defaultEmpresaSlug } };
          }
          zonaId = resolved.id;
        }

        const tieneAccesoZona = grantStore.puedeAccederScope(user, 'zone', zonaId, { companyId });
        if (!tieneAccesoZona) {
          return { name: 'empresa-home', params: { companySlug: defaultEmpresaSlug } };
        }
      }

      if (to.meta.requiresUbicacion) {
        const ubicacionSlug = to.params.ubicacionSlug as string;
        const ubicacion = grantStore.resolverUbicacion(ubicacionSlug);

        if (!ubicacion) {
          // Slug de sucursal no cacheado: hacer lectura puntual y registrarlo
          const resolved = await resolverYRegistrarUbicacion(companyId, ubicacionSlug);
          if (!resolved) {
            return { name: 'empresa-home', params: { companySlug: defaultEmpresaSlug } };
          }
          const tieneAccesoSucursal = grantStore.puedeAccederScope(
            user, 'branch', resolved.id,
            { companyId, zonaDeLaSucursal: resolved.zone_id ?? undefined }
          );
          if (!tieneAccesoSucursal) {
            return { name: 'empresa-home', params: { companySlug: defaultEmpresaSlug } };
          }
        } else {
          const tieneAccesoSucursal = grantStore.puedeAccederScope(
            user, 'branch', ubicacion.id,
            { companyId, zonaDeLaSucursal: ubicacion.zone_id ?? undefined }
          );
          if (!tieneAccesoSucursal) {
            return { name: 'empresa-home', params: { companySlug: defaultEmpresaSlug } };
          }
        }
      }
    }
  }

  return true;
});

// Resuelve el slug de una ubicación leyendo Firestore UNA vez y lo registra en grantStore para
// navaciones futuras sin re-lectura. Solo se llama si el slug no está ya cacheado.
async function resolverYRegistrarUbicacion(
  companyId: string,
  ubicacionSlug: string
): Promise<{ id: string; zone_id: string | null } | null> {
  const snap = await getDocs(
    query(
      collection(db, 'ubicaciones').withConverter(ubicacionConverter),
      where('company_id', '==', companyId),
      where('slug', '==', ubicacionSlug),
      where('deletedAt', '==', null)
    )
  );
  if (snap.empty) return null;
  const data = snap.docs[0].data();
  const result = { id: data.id, zone_id: data.zone_id ?? null };
  useGrantStore().registrarUbicacionSlug(ubicacionSlug, result.id, result.zone_id);
  return result;
}

async function resolverYRegistrarZona(
  companyId: string,
  zonaSlug: string
): Promise<{ id: string } | null> {
  const snap = await getDocs(
    query(
      collection(db, 'zonas').withConverter(zonaConverter),
      where('empresa_id', '==', companyId),
      where('slug', '==', zonaSlug),
      where('deletedAt', '==', null)
    )
  );
  if (snap.empty) return null;
  const data = snap.docs[0].data();
  useGrantStore().registrarZonaSlug(zonaSlug, data.id);
  return { id: data.id };
}

export default router;
