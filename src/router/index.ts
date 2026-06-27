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
        },
        {
          path: 'dte',
          name: 'admin-dte',
          meta: { title: 'Documentos Tributarios', subtitle: 'Gestión de DTE emitidos' },
          component: () => import('../views/admin/AdminDTEView.vue')
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
          redirect: 'empresa'
        },
        {
          path: 'empresa',
          name: 'empresa-home',
          meta: { title: 'Panel', subtitle: 'Vista general de la empresa' },
          component: () => import('../views/empresa/EmpresaView.vue')
        },
        { path: 'organizacion', name: 'empresa-organizacion', meta: { title: 'Organización', subtitle: 'Zonas y sucursales de la empresa' }, component: () => import('../views/empresa/AjustesEstructuraView.vue') },
        { path: 'perfil', name: 'empresa-perfil', meta: { title: 'Mi perfil', subtitle: 'Configuración de tu cuenta' }, component: () => import('../views/shared/PerfilView.vue') },
        { path: 'empresa-ajustes', name: 'empresa-ajustes-empresa', meta: { title: 'Empresa', subtitle: 'Datos generales de la organización', requiresActiveSubscription: true }, component: () => import('../views/empresa/AjustesEmpresaView.vue') },
        { path: 'usuarios', name: 'empresa-ajustes-usuarios', meta: { title: 'Usuarios', subtitle: 'Control de acceso y permisos' }, component: () => import('../views/empresa/AjustesUsuariosView.vue') },
        { path: 'cargos', name: 'empresa-ajustes-cargos', meta: { title: 'Cargos', subtitle: 'Roles de trabajo personalizados', requiresActiveSubscription: true }, component: () => import('../views/empresa/AjustesRolesView.vue') },
        { path: 'facturacion', name: 'empresa-facturacion', meta: { title: 'Facturación', subtitle: 'Plan, suscripción y documentos tributarios' }, component: () => import('../views/empresa/AjustesFacturacionView.vue') },
      ]
    },
    {
      path: '/:companySlug/zonas/:zonaSlug',
      component: () => import('../layouts/ZonaLayout.vue'),
      meta: { requiresAuth: true, requiresCompany: true, requiresZona: true },
      children: [
        { path: '', redirect: 'dashboard' },
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
        { path: '', redirect: 'dashboard' },
        { path: 'dashboard', name: 'sucursal-dashboard', meta: { title: 'Centro de control', subtitle: 'Resumen operativo de la sucursal' }, component: () => import('../views/sucursal/SucursalDashboardView.vue') },
        { path: 'turnos', name: 'sucursal-turnos', meta: { title: 'Turnos', subtitle: 'Gestión de horarios y asignaciones', requiresActiveSubscription: true }, component: () => import('../views/sucursal/TurnosView.vue') },
        { path: 'solicitudes', name: 'sucursal-solicitudes', meta: { title: 'Solicitudes', subtitle: 'Permisos y ausencias pendientes', requiresActiveSubscription: true }, component: () => import('../views/sucursal/SolicitudesView.vue') },
        { path: 'calendario', name: 'sucursal-calendario', meta: { title: 'Mi Calendario', subtitle: 'Tu horario publicado' }, component: () => import('../views/sucursal/CalendarioView.vue') },
        {
          path: 'mi-equipo',
          component: () => import('../layouts/MiEquipoLayout.vue'),
          children: [
            { path: '', redirect: 'personal' },
            { path: 'personal', name: 'sucursal-mi-equipo-personal', meta: { title: 'Mi Equipo', subtitle: 'Directorio de personal de la sucursal', requiresActiveSubscription: true }, component: () => import('../views/sucursal/PersonalView.vue') },
            { path: 'estaciones', name: 'sucursal-mi-equipo-estaciones', meta: { title: 'Estaciones', subtitle: 'Puestos operativos del equipo', requiresActiveSubscription: true }, component: () => import('../views/sucursal/ajustes/AjustesEstacionesView.vue') },
            { path: 'disponibilidad', name: 'sucursal-mi-equipo-disponibilidad', meta: { title: 'Disponibilidad', subtitle: 'Reglas base de disponibilidad' }, component: () => import('../views/sucursal/ajustes/AjustesDisponibilidadView.vue') },
            { path: 'excepciones', name: 'sucursal-mi-equipo-excepciones', meta: { title: 'Excepciones', subtitle: 'Ausencias y días fuera de rutina' }, component: () => import('../views/sucursal/ajustes/AjustesExcepcionesView.vue') },
            { path: 'reglas', name: 'sucursal-mi-equipo-reglas', meta: { title: 'Reglas', subtitle: 'Preferencias de asignación conjunta' }, component: () => import('../views/sucursal/ajustes/AjustesReglasView.vue') },
          ]
        }
      ]
    },
    {
      path: '/c/:clienteSlug',
      component: () => import('../layouts/ClienteLayout.vue'),
      meta: { requiresAuth: true, requiresCliente: true },
      children: [
        { path: '', redirect: 'empresas' },
        {
          path: 'empresas',
          name: 'cliente-empresas',
          meta: { title: 'Mis Empresas', subtitle: 'Selector de empresa' },
          component: () => import('../views/cliente/ClienteEmpresasView.vue')
        },
        {
          path: 'perfil',
          name: 'cliente-perfil',
          meta: { title: 'Mi perfil', subtitle: 'Configuración de tu cuenta' },
          component: () => import('../views/shared/PerfilView.vue')
        }
      ]
    }
  ]
});

router.beforeEach(async (to, _from) => {
  console.log('[guard] to:', to.name, to.path);

  // Permitir siempre la ruta de login sin ningún procesamiento adicional
  if (to.name === 'login') return true;

  const sessionStore = useSessionStore();

  let isAuthenticated = false;
  try {
    isAuthenticated = await sessionStore.validateSession();
  } catch (e) {
    console.error('[guard] validateSession error:', e);
    isAuthenticated = false;
  }

  console.log('[guard] isAuthenticated:', isAuthenticated, '| currentUser:', sessionStore.currentUser?.id);

  if (to.meta.requiresAuth && !isAuthenticated) {
    console.log('[guard] → login (requiresAuth failed)');
    return { name: 'login' };
  }

  if (!isAuthenticated) return true;

  const user = sessionStore.currentUser!;
  const isSuperAdmin = user.isSuperAdmin;

  console.log('[guard] isSuperAdmin:', isSuperAdmin, '| isActivo:', user.isActivo);

  // Bloquear usuarios no activos (invitado / suspendido)
  if (!isSuperAdmin && !user.isActivo && to.name !== 'login') {
    console.log('[guard] → login (not activo)');
    return { name: 'login' };
  }

  const defaultEmpresaSlug = user.empresa?.slug ?? user.empresa_id ?? '';
  const deny = () => defaultEmpresaSlug
    ? { name: 'empresa-home' as const, params: { companySlug: defaultEmpresaSlug } }
    : { name: 'login' as const };

  if (to.name === 'login') {
    return isSuperAdmin ? { name: 'admin-dashboard' } : deny();
  }

  // Rutas exclusivas del super_admin
  if (to.meta.requiresSuperAdmin && !isSuperAdmin) return deny();

  if (to.meta.requiresCliente) {
    const clienteSlug = to.params.clienteSlug as string;

    if (!isSuperAdmin) {
      const grantStore = useGrantStore();
      let clienteId = grantStore.resolverClienteId(clienteSlug);

      // Si no está en caché: resolver con lectura puntual y registrar
      if (!clienteId) {
        const resolved = await resolverYRegistrarCliente(clienteSlug, grantStore);
        if (!resolved) return { name: 'login' };
        clienteId = resolved;
      }

      // Verificar que el usuario tiene grant 'client' sobre este cliente
      const tieneAccesoCliente = grantStore.grants.some(
        g => g.scope_type === 'client' && g.scope_id === clienteId && g.active && g.deletedAt === null
      );
      if (!tieneAccesoCliente) return deny();

      // Si solo tiene una empresa bajo este cliente, redirigir directamente
      const empresasDelCliente = grantStore.grants.filter(
        g => g.company_id && g.active && g.deletedAt === null
      );
      const companyIds = [...new Set(empresasDelCliente.map(g => g.company_id!))];
      if (companyIds.length === 1 && to.name === 'cliente-empresas') {
        const slugEntry = Object.entries(grantStore.empresaSlugToId).find(([, id]) => id === companyIds[0]);
        if (slugEntry) {
          return { name: 'empresa-home', params: { companySlug: slugEntry[0] } };
        }
      }
    }
  }

  if (to.meta.requiresCompany) {
    const companySlug = to.params.companySlug as string;

    if (!isSuperAdmin) {
      // Resolver slug → id desde el mapa cargado al login
      const grantStore = useGrantStore();
      const companyId = grantStore.resolverEmpresaId(companySlug);
      console.log('[guard] companySlug:', companySlug, '| companyId:', companyId, '| slugMap:', grantStore.empresaSlugToId);

      if (!companyId) return deny();

      // Verificar que el usuario tiene al menos un grant activo en esta empresa (cualquier scope)
      const perteneceEmpresa = grantStore.grants.some(g => g.company_id === companyId && g.active && g.deletedAt === null);
      console.log('[guard] perteneceEmpresa:', perteneceEmpresa, '| grants:', grantStore.grants.map(g => `${g.scope_type}/${g.scope_id} company:${g.company_id}`));
      if (!perteneceEmpresa) return deny();

      // Si la ruta es de empresa (no sucursal/zona) pero el usuario solo tiene grants branch → redirigir a su sucursal
      if (!to.params.ubicacionSlug && !to.params.zonaSlug) {
        const soloTieneBranch = grantStore.grants
          .filter(g => g.company_id === companyId && g.active && g.deletedAt === null)
          .every(g => g.scope_type === 'branch');
        if (soloTieneBranch) {
          const branchGrant = grantStore.grants.find(g => g.company_id === companyId && g.scope_type === 'branch' && g.active && g.deletedAt === null);
          if (branchGrant) {
            const { getDoc, doc } = await import('firebase/firestore');
            const { db } = await import('../firebase');
            const { ubicacionConverter } = await import('../models/Ubicacion');
            const snap = await getDoc(doc(db, 'ubicaciones', branchGrant.scope_id).withConverter(ubicacionConverter));
            if (snap.exists()) {
              const u = snap.data();
              grantStore.registrarUbicacionSlug(u.slug, u.id, u.zone_id ?? null);
              return { name: 'sucursal-dashboard', params: { companySlug, ubicacionSlug: u.slug } };
            }
          }
        }
      }

      if (to.meta.requiresZona || to.params.zonaSlug) {
        const zonaSlug = to.params.zonaSlug as string;
        let zonaId = grantStore.resolverZonaId(zonaSlug);

        if (!zonaId) {
          const resolved = await resolverYRegistrarZona(companyId, zonaSlug);
          if (!resolved) return deny();
          zonaId = resolved.id;
        }

        const tieneAccesoZona = grantStore.puedeAccederScope(user, 'zone', zonaId, { companyId });
        if (!tieneAccesoZona) return deny();
      }

      if (to.meta.requiresUbicacion || to.params.ubicacionSlug) {
        const ubicacionSlug = to.params.ubicacionSlug as string;
        const ubicacion = grantStore.resolverUbicacion(ubicacionSlug);
        console.log('[guard] ubicacion cache:', ubicacion, '| slug:', ubicacionSlug, '| companyId:', companyId);

        if (!ubicacion) {
          const resolved = await resolverYRegistrarUbicacion(companyId, ubicacionSlug);
          console.log('[guard] resolved ubicacion:', resolved);
          if (!resolved) return deny();
          const tieneAccesoSucursal = grantStore.puedeAccederScope(
            user, 'branch', resolved.id,
            { companyId, zonaDeLaSucursal: resolved.zone_id ?? undefined }
          );
          console.log('[guard] tieneAccesoSucursal (resolved):', tieneAccesoSucursal, '| grants:', grantStore.grants.map(g => `${g.scope_type}/${g.scope_id}`));
          if (!tieneAccesoSucursal) return deny();
        } else {
          const tieneAccesoSucursal = grantStore.puedeAccederScope(
            user, 'branch', ubicacion.id,
            { companyId, zonaDeLaSucursal: ubicacion.zone_id ?? undefined }
          );
          console.log('[guard] tieneAccesoSucursal (cached):', tieneAccesoSucursal);
          if (!tieneAccesoSucursal) return deny();
        }
      }
    }
  }

  // Bloquear rutas de escritura cuando la empresa está en past_due
  if (to.meta.requiresActiveSubscription && !isSuperAdmin) {
    const empresa = sessionStore.currentUser?.empresa;
    if (empresa?.isPastDue) {
      const companySlug = to.params.companySlug as string;
      return { name: 'empresa-facturacion', params: { companySlug } };
    }
  }

  console.log('[guard] → return true, mounting route');
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

async function resolverYRegistrarCliente(
  clienteSlug: string,
  grantStore: ReturnType<typeof useGrantStore>
): Promise<string | null> {
  const { clienteConverter } = await import('../models/Cliente');
  const snap = await getDocs(
    query(
      collection(db, 'clientes').withConverter(clienteConverter),
      where('slug', '==', clienteSlug),
      where('deletedAt', '==', null)
    )
  );
  if (snap.empty) return null;
  const data = snap.docs[0].data();
  grantStore.registrarClienteSlug(clienteSlug, data.id);
  return data.id;
}

export default router;
