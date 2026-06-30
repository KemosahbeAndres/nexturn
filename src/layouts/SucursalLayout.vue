<template>
  <AppShell
    :nav-items="menuItems"
    :route-params="{ companySlug: String($route.params.companySlug), ubicacionSlug: String($route.params.ubicacionSlug) }"
    :context-label="ubicacion?.name || 'Sucursal'"
    :page-title="currentPageTitle"
    perfil-route-name="empresa-perfil"
    :perfil-route-params="{ companySlug: String($route.params.companySlug) }"
    :is-active="isMenuItemActive"
    @logout="handleLogout"
  >
    <template #sidebar-top>
      <router-link
        :to="{ name: 'empresa-home', params: { companySlug: $route.params.companySlug } }"
        class="flex items-center gap-1.5 text-[10px] lg:text-xs font-medium text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors mb-3"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-3 h-3"><path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" /></svg>
        Volver a la empresa
      </router-link>
    </template>

    <template #topbar-left>
      <router-link
        :to="{ name: 'empresa-home', params: { companySlug: $route.params.companySlug } }"
        class="shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-3.5 h-3.5"><path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" /></svg>
      </router-link>
    </template>
  </AppShell>
</template>

<script setup lang="ts">
import { computed, defineComponent, h, onMounted, onUnmounted, watchEffect } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useSessionStore } from '../stores/sessionStore';
import { useUbicacionStore } from '../stores/ubicacionStore';
import { useEmpresaStore } from '../stores/empresaStore';
import AppShell from './AppShell.vue';

const router = useRouter();
const route = useRoute();
const sessionStore = useSessionStore();
const ubicacionStore = useUbicacionStore();
const empresaStore = useEmpresaStore();

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// ---- Iconos ----
const IconDashboard   = defineComponent({ render: () => h('svg', { xmlns: 'http://www.w3.org/2000/svg', fill: 'none', viewBox: '0 0 24 24', 'stroke-width': '1.5', stroke: 'currentColor' }, [h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', d: 'M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z' })]) });
const IconTurnos      = defineComponent({ render: () => h('svg', { xmlns: 'http://www.w3.org/2000/svg', fill: 'none', viewBox: '0 0 24 24', 'stroke-width': '1.5', stroke: 'currentColor' }, [h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', d: 'M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5m-9-6h.008v.008H12v-.008ZM12 15h.008v.008H12V15Zm0 2.25h.008v.008H12v-.008ZM9.75 15h.008v.008H9.75V15Zm0 2.25h.008v.008H9.75v-.008ZM7.5 15h.008v.008H7.5V15Zm0 2.25h.008v.008H7.5v-.008Zm6.75-4.5h.008v.008h-.008v-.008Zm0 2.25h.008v.008h-.008V15Zm0 2.25h.008v.008h-.008v-.008Zm2.25-4.5h.008v.008H16.5v-.008Zm0 2.25h.008v.008H16.5V15Z' })]) });
const IconMiEquipo    = defineComponent({ render: () => h('svg', { xmlns: 'http://www.w3.org/2000/svg', fill: 'none', viewBox: '0 0 24 24', 'stroke-width': '1.5', stroke: 'currentColor' }, [h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', d: 'M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z' })]) });
const IconSolicitudes = defineComponent({ render: () => h('svg', { xmlns: 'http://www.w3.org/2000/svg', fill: 'none', viewBox: '0 0 24 24', 'stroke-width': '1.5', stroke: 'currentColor' }, [h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', d: 'M9 12h3.75M9 15h3.75M9 18h3.75m3-15H6a2.25 2.25 0 0 0-2.25 2.25v15A2.25 2.25 0 0 0 6 21.75h12a2.25 2.25 0 0 0 2.25-2.25V8.25L15.75 3Z' })]) });
const IconCalendario  = defineComponent({ render: () => h('svg', { xmlns: 'http://www.w3.org/2000/svg', fill: 'none', viewBox: '0 0 24 24', 'stroke-width': '1.5', stroke: 'currentColor' }, [h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', d: 'M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5m-9-6h.008v.008H12v-.008ZM12 15h.008v.008H12V15Zm0 2.25h.008v.008H12v-.008Z' })]) });

interface MenuItem { name: string; routeName: string; icon: any }

const MI_EQUIPO_ROUTES = [
  'sucursal-mi-equipo-personal',
  'sucursal-mi-equipo-estaciones',
  'sucursal-mi-equipo-disponibilidad',
  'sucursal-mi-equipo-excepciones',
  'sucursal-mi-equipo-reglas',
];

const isMiEquipoActive = computed(() => MI_EQUIPO_ROUTES.includes(route.name as string));
const isMenuItemActive = (routeName: string) =>
  routeName === 'sucursal-mi-equipo-personal' ? isMiEquipoActive.value : route.name === routeName;

const esManager = computed(() => {
  const role = sessionStore.currentUser?.system_role;
  return role === 'super_admin' || role === 'client_user';
});

const menuItems = computed((): MenuItem[] => {
  const items: MenuItem[] = [
    { name: 'Dashboard',    routeName: 'sucursal-dashboard',   icon: IconDashboard },
    { name: 'Turnos',       routeName: 'sucursal-turnos',      icon: IconTurnos },
    { name: 'Solicitudes',  routeName: 'sucursal-solicitudes', icon: IconSolicitudes },
    { name: 'Mi Calendario', routeName: 'sucursal-calendario', icon: IconCalendario },
  ];
  if (esManager.value) {
    items.splice(3, 0,
      { name: 'Mi Equipo',  routeName: 'sucursal-mi-equipo-personal',  icon: IconMiEquipo }
    );
  }
  return items;
});

const ubicacion = computed(() => {
  const lista = ubicacionStore.ubicaciones;
  if (!lista) return undefined;
  if (sessionStore.activeUbicacionId)
    return lista.find(u => u.id === sessionStore.activeUbicacionId);
  const slug = route.params.ubicacionSlug as string;
  return lista.find(u => (u.slug || slugify(u.name)) === slug);
});

const currentPageTitle = computed(() => {
  if (isMiEquipoActive.value) return 'Mi Equipo';
  if (route.name === 'sucursal-calendario') return 'Mi Calendario';
  return menuItems.value.find(item => item.routeName === route.name)?.name || ubicacion.value?.name || 'Sucursal';
});

onMounted(() => {
  // Arrancar carga de empresas siempre, para que el watchEffect pueda resolver companySlug → id
  empresaStore.listarEmpresas(
    sessionStore.userRole,
    sessionStore.userRole === 'super_admin' ? null : sessionStore.currentUser?.empresa_id
  );
});

// Paso 1: resolver companyId y arrancar la carga de ubicaciones
watchEffect(() => {
  const companySlug = route.params.companySlug as string;

  let companyId: string | null = null;
  if (sessionStore.userRole !== 'super_admin') {
    companyId = sessionStore.currentUser?.empresa_id ?? null;
  } else {
    // Para super_admin: buscar en el store si ya está cargado; si no, esperar
    companyId = (empresaStore.empresas ?? []).find(e => e.slug === companySlug)?.id ?? null;
  }

  if (companyId) {
    sessionStore.activeCompanyId = companyId;
    ubicacionStore.listarUbicaciones(companyId);
  }
});

// Paso 2: resolver activeUbicacionId cuando las ubicaciones lleguen (pueden tardar)
watchEffect(() => {
  const ubicacionSlug = route.params.ubicacionSlug as string;
  const lista = ubicacionStore.ubicaciones; // dependencia reactiva rastreada aquí
  if (!ubicacionSlug || !lista || lista.length === 0) return;
  const found = lista.find(u => (u.slug || slugify(u.name)) === ubicacionSlug);
  if (found) sessionStore.activeUbicacionId = found.id;
});

onUnmounted(() => {
  sessionStore.activeUbicacionId = null;
});

const handleLogout = async () => {
  await sessionStore.logout();
  router.push('/login');
};
</script>
